import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const PROJECT_ID = 'moment-jamsi';
const DATABASE_ID = '(default)';
const { FIREBASE_API_KEY, FIREBASE_ADMIN_EMAIL, FIREBASE_ADMIN_PASSWORD } = process.env;

for (const [name, value] of Object.entries({ FIREBASE_API_KEY, FIREBASE_ADMIN_EMAIL, FIREBASE_ADMIN_PASSWORD })) {
  if (!value) throw new Error(`${name} 환경값이 없습니다.`);
}

const INDICES = [
  { symbol: '^KS11', name: '코스피' },
  { symbol: '^KQ11', name: '코스닥' },
  { symbol: '^IXIC', name: '나스닥' },
  { symbol: '^DJI', name: '다우지수' },
  { symbol: '^GSPC', name: 'S&P 500' },
];

const finiteNumber = (value, label) => {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} 값이 올바르지 않습니다.`);
  return number;
};

async function fetchIndex(index) {
  const path = `/v8/finance/chart/${encodeURIComponent(index.symbol)}?interval=1d&range=10d`;
  let lastError;
  for (const host of ['query1.finance.yahoo.com', 'query2.finance.yahoo.com']) {
    try {
      const response = await fetch(`https://${host}${path}`, {
        headers: {
          accept: 'application/json',
          'user-agent': 'Mozilla/5.0 (compatible; JamsiMarketBoard/1.0; +https://zumurf-ux.github.io/moment/)',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json();
      const result = body.chart?.result?.[0];
      const meta = result?.meta;
      if (!meta) throw new Error('응답에 지수 정보가 없습니다.');
      const timestamps = result.timestamp || [];
      const closes = result.indicators?.quote?.[0]?.close || [];
      const regular = meta.currentTradingPeriod?.regular;
      const nowSeconds = Date.now() / 1000;
      const marketIsOpen = regular && nowSeconds >= Number(regular.start) && nowSeconds < Number(regular.end);
      const completed = timestamps
        .map((timestamp, position) => ({ timestamp: Number(timestamp), rawClose: closes[position] }))
        .filter(point => point.rawClose !== null && point.rawClose !== undefined)
        .map(point => ({ timestamp: point.timestamp, close: Number(point.rawClose) }))
        .filter(point => Number.isFinite(point.close) && point.close > 0)
        .filter(point => !(marketIsOpen && point.timestamp >= Number(regular.start)));
      const lastRawClose = closes.at(-1);
      const fallbackClose = Number(meta.regularMarketPrice);
      const fallbackTime = Number(meta.regularMarketTime);
      if (!marketIsOpen && (lastRawClose === null || lastRawClose === undefined)
        && Number.isFinite(fallbackClose) && fallbackClose > 0 && Number.isFinite(fallbackTime)) {
        completed.push({ timestamp: fallbackTime, close: fallbackClose });
      }
      if (completed.length < 2) throw new Error('확정 종가가 부족합니다.');
      const latest = completed.at(-1);
      const prior = completed.at(-2);
      const value = finiteNumber(latest.close, `${index.name} 종가`);
      const previous = finiteNumber(prior.close, `${index.name} 전일 종가`);
      const change = value - previous;
      return {
        symbol: index.symbol,
        name: index.name,
        value: Number(value.toFixed(4)),
        change: Number(change.toFixed(4)),
        changePercent: Number(((change / previous) * 100).toFixed(4)),
        currency: String(meta.currency || ''),
        marketTime: new Date(latest.timestamp * 1000).toISOString(),
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw new Error(`${index.name} 조회 실패: ${lastError?.message || '알 수 없는 오류'}`);
}

const quotes = await Promise.all(INDICES.map(fetchIndex));

const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    email: FIREBASE_ADMIN_EMAIL,
    password: FIREBASE_ADMIN_PASSWORD,
    returnSecureToken: true,
  }),
});
if (!authResponse.ok) throw new Error(`Firebase 인증 실패: ${authResponse.status} ${await authResponse.text()}`);
const { idToken } = await authResponse.json();

const toValue = value => {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, toValue(entry)])) } };
};

const updatedAt = new Date().toISOString();
const basisDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const fields = {
  updatedAt: toValue(updatedAt),
  basisDate: toValue(basisDate),
  delayed: toValue(true),
  source: toValue('Yahoo Finance 지수 데이터'),
  basis: toValue('CLOSE'),
  quotes: toValue(quotes),
};
const publishResponse = await fetch(
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/appConfig/markets`,
  {
    method: 'PATCH',
    headers: { authorization: `Bearer ${idToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ fields }),
  },
);
if (!publishResponse.ok) throw new Error(`시세 업로드 실패: ${publishResponse.status} ${await publishResponse.text()}`);

console.log(`${updatedAt} 주요 지수 ${quotes.length}개를 갱신했습니다.`);
for (const quote of quotes) console.log(`${quote.name}: ${quote.value} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent}%)`);
