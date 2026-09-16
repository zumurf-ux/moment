import dns from 'node:dns';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';

dns.setDefaultResultOrder('ipv4first');
const execFile = promisify(execFileCallback);

const PROJECT_ID = 'moment-jamsi';
const DATABASE_ID = '(default)';
const { FIREBASE_API_KEY, FIREBASE_ADMIN_EMAIL, FIREBASE_ADMIN_PASSWORD, GEMINI_API_KEY } = process.env;
const MODEL = process.env.AI_MODEL || 'gemini-3.1-flash-lite';
const MODEL_CANDIDATES = [...new Set([MODEL, 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'])];
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

for (const [name, value] of Object.entries({ FIREBASE_API_KEY, FIREBASE_ADMIN_EMAIL, FIREBASE_ADMIN_PASSWORD, GEMINI_API_KEY })) {
  if (!value) throw new Error(`${name} 환경값이 없습니다.`);
}

const TARGET_CATEGORIES = ['정책', '경제·금융', '사회', '국제', '생활·안전', '과학·기술', '문화·예술', '스포츠'];

// 국가기관과 공공기관이 직접 제공하는 공식 RSS만 허용한다.
// 민간 언론사, 뉴스 집계 서비스, 민간 포털 및 제3자 RSS 중계는 이 목록에 넣지 않는다.
const OFFICIAL_SOURCES = [
  { id: 'mois', name: '행정안전부', defaultCategory: '생활·안전', url: 'https://www.mois.go.kr/gpms/view/jsp/rss/rss.jsp?ctxCd=1012', allowedHosts: ['www.mois.go.kr'], license: '국가기관 공공저작물' },
  { id: 'bok', name: '한국은행', defaultCategory: '경제·금융', url: 'https://www.bok.or.kr/portal/bbs/B0000552/news.rss?menuNo=200690', allowedHosts: ['www.bok.or.kr'], license: '공공기관 공식 RSS' },
  { id: 'fsc', name: '금융위원회', defaultCategory: '경제·금융', url: 'https://www.fsc.go.kr/about/fsc_bbs_rss/?fid=0111', allowedHosts: ['www.fsc.go.kr', 'fsc.go.kr'], license: '국가기관 공식 RSS·공공저작물 이용조건 확인' },
  { id: 'msit', name: '과학기술정보통신부', defaultCategory: '과학·기술', url: 'https://www.msit.go.kr/user/rss/rss.do?bbsSeqNo=94', allowedHosts: ['www.msit.go.kr'], license: '국가기관 공공저작물' },
  { id: 'mcst', name: '문화체육관광부', defaultCategory: '문화·예술', url: 'https://www.mcst.go.kr/common/rss/press.jsp', allowedHosts: ['www.mcst.go.kr', 'mcst.go.kr'], license: '공공누리 제0·1유형 확인 대상' },
  { id: 'mohw', name: '보건복지부', defaultCategory: '생활·안전', url: 'https://www.mohw.go.kr/rss/board.es?mid=a10503000000&bid=0027&info', allowedHosts: ['www.mohw.go.kr', 'mohw.go.kr'], license: '국가기관 공공저작물' },
  { id: 'mafra', name: '농림축산식품부', defaultCategory: '생활·안전', url: 'https://www.mafra.go.kr/bbs/home/792/rssList.do?row=50', allowedHosts: ['www.mafra.go.kr', 'mafra.go.kr'], license: '국가기관 공식 RSS·공공저작물 이용조건 확인' },
  { id: 'kma', name: '기상청', defaultCategory: '생활·안전', url: 'https://www.kma.go.kr/servlet/NeoboardProcess?mode=rss&bid=press&url=http%3A%2F%2Fwww.kma.go.kr%2Fnotify%2Fpress%2Fkma_list.jsp', allowedHosts: ['www.kma.go.kr', 'kma.go.kr'], license: '출처표시 조건 공식 RSS' },
];

const kstDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);
const addDays = (value, days) => {
  const date = new Date(`${value}T12:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() + days);
  return kstDate(date);
};
const sourceDate = process.env.SOURCE_DATE || addDays(kstDate(), -1);
const publishDate = addDays(sourceDate, 1);
const visibleAt = `${publishDate}T05:00:00+09:00`;

const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: FIREBASE_ADMIN_EMAIL, password: FIREBASE_ADMIN_PASSWORD, returnSecureToken: true }),
});
if (!authResponse.ok) throw new Error(`Firebase 인증 실패: ${authResponse.status}`);
const { idToken } = await authResponse.json();

async function hasPublishedEditionForDate() {
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents:runQuery`, {
    method: 'POST',
    headers: { authorization: `Bearer ${idToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'editions' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'publishDate' },
            op: 'EQUAL',
            value: { stringValue: publishDate },
          },
        },
        limit: 20,
      },
    }),
  });
  if (!response.ok) throw new Error(`기존 발행본 확인 실패: ${response.status} ${await response.text()}`);
  const rows = await response.json();
  return rows.some(row => row.document?.fields?.type?.stringValue === 'daily'
    && row.document?.fields?.status?.stringValue === 'PUBLISHED');
}

if (await hasPublishedEditionForDate()) {
  console.log(`${publishDate} 발행본이 이미 확정되어 있어 다시 분석하거나 덮어쓰지 않습니다.`);
  process.exit(0);
}

const decodeXml = text => text
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (xml, name) => decodeXml(xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || '');

const parsePublishedAt = value => {
  const normalized = String(value || '').replace(/\bKST\b/g, '+0900');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const officialItemUrl = (rawUrl, source) => {
  try {
    const url = new URL(rawUrl, source.url);
    return source.allowedHosts.includes(url.hostname.toLowerCase()) ? url.toString() : '';
  } catch {
    return '';
  }
};

async function collectFeed(source) {
  const headers = {
    accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
    'accept-language': 'ko-KR,ko;q=0.9',
    'user-agent': 'Mozilla/5.0 (compatible; JamsiOfficialPublicDataBot/1.0; +https://zumurf-ux.github.io/moment/)',
  };
  let xml = '';
  let lastError;
  for (let attempt = 0; attempt < 3 && !xml; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch(source.url, { headers, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      xml = await response.text();
    } catch (error) {
      const cause = error?.cause?.code || error?.cause?.message || error?.message || String(error);
      lastError = new Error(`${source.name} Node 수집 실패: ${cause}`);
      if (attempt < 2) await wait(1_500 * (2 ** attempt));
    } finally {
      clearTimeout(timeout);
    }
  }
  if (!xml) {
    try {
      const { stdout } = await execFile('curl', [
        '--fail', '--silent', '--show-error', '--location', '--max-time', '45',
        '--retry', '2', '--retry-delay', '2', '--retry-all-errors',
        '--user-agent', headers['user-agent'], '--header', `Accept: ${headers.accept}`, source.url,
      ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
      xml = stdout;
    } catch (error) {
      throw new Error(`${lastError?.message || `${source.name} Node 수집 실패`} / curl 수집 실패: ${error?.message || error}`);
    }
  }
  if (!/<(?:rss|rdf:RDF|feed)\b/i.test(xml)) throw new Error(`${source.name} 응답이 공식 RSS 형식이 아닙니다.`);
  return [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)].map((match, index) => {
    const item = match[1];
    const publishedAt = tag(item, 'pubDate') || tag(item, 'dc:date') || tag(item, 'date');
    const publishedDate = parsePublishedAt(publishedAt);
    const description = tag(item, 'description') || tag(item, 'content:encoded');
    return {
      id: `${source.id}-${index + 1}`,
      defaultCategory: source.defaultCategory,
      title: tag(item, 'title'),
      summary: description.slice(0, 1600),
      url: officialItemUrl(tag(item, 'link') || tag(item, 'guid'), source),
      sourceName: source.name,
      sourceId: source.id,
      license: source.license,
      publishedAt,
      sourceDate: publishedDate ? kstDate(publishedDate) : '',
    };
  });
}

// 국내 정부 누리집의 연결 제한을 피하기 위해 공식 피드를 한 번에 하나씩 수집한다.
const feedResults = [];
for (const source of OFFICIAL_SOURCES) {
  try {
    feedResults.push({ status: 'fulfilled', value: await collectFeed(source) });
  } catch (reason) {
    feedResults.push({ status: 'rejected', reason });
  }
  await wait(500);
}
const failedSources = feedResults
  .map((result, index) => result.status === 'rejected' ? `${OFFICIAL_SOURCES[index].name}: ${result.reason?.message || result.reason}` : null)
  .filter(Boolean);
if (failedSources.length) console.warn(`공식 피드 일부 수집 실패: ${failedSources.join(' / ')}`);

const collected = feedResults
  .flatMap(result => result.status === 'fulfilled' ? result.value : [])
  .filter(article => article.sourceDate === sourceDate && article.title && article.url)
  .filter((article, index, array) => array.findIndex(other => other.url === article.url || other.title === article.title) === index);

// 한 기관이 후보 전체를 독점하지 않도록 기관별 상한을 둔다.
const counts = new Map();
const articles = collected.filter(article => {
  const count = counts.get(article.sourceId) || 0;
  if (count >= 12) return false;
  counts.set(article.sourceId, count + 1);
  return true;
}).slice(0, 80);

if (articles.length < 3) {
  throw new Error(`${sourceDate} 국가·공공기관 공식 자료가 ${articles.length}개뿐이어서 자동 발행을 중단합니다.`);
}

const prompt = `당신은 한국어 일간 브리핑 '잠시'의 공공정보 편집 AI다. 입력은 ${sourceDate} 00:00~23:59(KST)에 국가기관·공공기관이 직접 공개한 공식 자료뿐이다.

목표는 공식 자료를 분야별로 종합 검토한 뒤 국민에게 실제 영향이 큰 확정 사실을 골라, 공개 화면에 실을 짧은 제목만 새로 작성하는 것이다.

편집 규칙:
1. 결과는 3~8개다. 정책, 경제·금융, 사회, 국제, 생활·안전, 과학·기술, 문화·예술, 스포츠를 모두 검토하고 같은 분야는 최대 1개만 고른다. 다만 확인 가능한 자료가 없는 분야는 허위로 채우지 않는다.
2. 국민 영향도 30%·안전성 25%·최신성 25%·검증도 20%로 정렬하며 1번이 메인 이슈다.
3. 보도자료의 홍보성 표현, 장관 발언, 전망, 평가, 구호는 제거하고 시행·발표·수치·일정·경보·의결처럼 확인된 사실만 쓴다.
4. 원자료 제목과 설명의 문장, 어순, 표현을 복사하거나 일부 단어만 바꿔 쓰지 않는다. 주체·행위·날짜·수치의 사실요소만 추출한 뒤 완전히 새로운 문장으로 작성한다.
5. 직접 인용, 따옴표 인용, 사진·도표·그래픽 설명은 사용하지 않는다.
6. 공개 콘텐츠는 제목뿐이다. 제목은 14~42자, 한 문장으로 쓰고 구체적인 주체·결과·핵심 수치를 포함한다. 마침표, 감탄문, 질문, 낚시성 표현은 쓰지 않는다.
7. 같은 사건의 공식 자료가 여러 개면 sourceIds에 함께 기록하고, 하나뿐이면 해당 공식 원자료 하나만 기록한다.
8. 입력에 없는 사실·기관·식별자를 만들지 않는다.

JSON만 출력한다.
{"items":[{"category":"지정된 분야 중 하나","title":"14~42자의 새로 작성한 사실 제목","sourceIds":["입력 id"],"score":0,"reason":"선정 근거","factors":{"freshness":0,"impact":0,"safety":0,"verification":0}}]}

공식 자료 후보: ${JSON.stringify(articles)}`;

const allowedCategories = new Set(TARGET_CATEGORIES);
const articleById = new Map(articles.map(article => [article.id, article]));
const neutralityBlocklist = /빌런|조롱|전격|실책|책임론|강력히|망언|폭언|굴욕|참사 정권|무능 정권/;
const transientAiStatuses = new Set([429, 500, 502, 503, 504]);
async function requestAi(body) {
  let lastError;
  for (const model of MODEL_CANDIDATES) {
    for (let retry = 0; retry < 2; retry += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000);
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (response.ok) return { response, model };
        const detail = await response.text();
        lastError = new Error(`AI 분석 실패(${model}): ${response.status} ${detail}`);
        if (response.status === 404) {
          console.warn(`${model}을 현재 계정에서 사용할 수 없어 다음 공식 지원 모델로 전환합니다.`);
          break;
        }
        if (!transientAiStatuses.has(response.status)) {
          lastError.retryable = false;
          throw lastError;
        }
      } catch (error) {
        if (error?.retryable === false) throw error;
        lastError = error?.name === 'AbortError'
          ? new Error(`AI 분석 시간 초과(${model}): 90초`)
          : error;
      } finally {
        clearTimeout(timeout);
      }
      console.warn(`${model} 일시 오류 · ${retry + 1}차 요청 실패, 재시도합니다.`);
      await wait(5_000 * (2 ** retry));
    }
    console.warn(`${model} 응답이 불안정해 다음 공식 지원 모델로 전환합니다.`);
  }
  throw lastError || new Error('AI 분석 요청에 실패했습니다.');
}

const compactText = value => String(value || '').replace(/[^0-9A-Za-z가-힣]/g, '').toLowerCase();
const longestCommonRun = (left, right) => {
  const a = compactText(left);
  const b = compactText(right);
  const previous = new Uint16Array(b.length + 1);
  let longest = 0;
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = 0;
    for (let j = 1; j <= b.length; j += 1) {
      const saved = previous[j];
      previous[j] = a[i - 1] === b[j - 1] ? diagonal + 1 : 0;
      if (previous[j] > longest) longest = previous[j];
      diagonal = saved;
    }
  }
  return longest;
};

const copiesSourceExpression = (generated, sourceText) => {
  const generatedCompact = compactText(generated);
  const sourceCompact = compactText(sourceText);
  if (!generatedCompact || !sourceCompact) return false;
  if (generatedCompact === sourceCompact) return true;
  const threshold = Math.max(14, Math.min(24, Math.floor(generatedCompact.length * 0.8)));
  return longestCommonRun(generated, sourceText) >= threshold;
};

const normalizeGeneratedText = value => String(value || '').replace(/\s+/g, ' ').trim();
function validateAnalysis(value) {
  const errors = [];
  if (!Array.isArray(value?.items) || value.items.length < 3 || value.items.length > 8) {
    errors.push(`결과 개수 ${Array.isArray(value?.items) ? value.items.length : 0}개(허용 3~8개)`);
    return errors;
  }
  const usedDocumentIds = new Set();
  const usedCategories = new Set();
  for (const item of value.items) {
    if (!allowedCategories.has(item.category)) errors.push(`허용되지 않은 분야: ${item.category}`);
    if (usedCategories.has(item.category)) errors.push(`${item.category} 분야가 중복됨`);
    usedCategories.add(item.category);
    if (!Array.isArray(item.sourceIds) || item.sourceIds.length < 1 || item.sourceIds.some(id => !articleById.has(id))) {
      errors.push(`${item.category} 공식 자료 식별자 오류`);
      continue;
    }
    const sourceDocuments = item.sourceIds.map(id => articleById.get(id));
    if (item.sourceIds.some(id => usedDocumentIds.has(id))) errors.push(`${item.category} 동일 공식 자료 중복 사용`);
    item.sourceIds.forEach(id => usedDocumentIds.add(id));
    if (!item.title || item.title.length < 14 || item.title.length > 42 || /[.!?。！？]$/.test(item.title)) {
      errors.push(`${item.category} 제목 길이 또는 형식 오류`);
    }
    if (neutralityBlocklist.test(item.title)) errors.push(`${item.category} 감정·논평 표현 포함`);
    if (/경질|사퇴|해임|비난|공방|의원.*요구/.test(item.title)) {
      errors.push(`${item.category}에 주장·공방 표현 포함`);
    }
    for (const sourceDocument of sourceDocuments) {
      if (copiesSourceExpression(item.title, sourceDocument.title)) {
        errors.push(`${item.category} 원자료 표현과 지나치게 유사함`);
      }
    }
  }
  return [...new Set(errors)];
}

let analysis;
let validationErrors = [];
let modelUsed = MODEL;
for (let attempt = 1; attempt <= 3; attempt += 1) {
  const correction = attempt === 1 ? '' : `\n\n이전 응답은 다음 검증에 실패했다: ${validationErrors.join(' / ')}. 원자료 표현을 반복하지 말고 사실요소만 이용해 분야 중복 없이 14~42자의 새로운 제목 3~8개를 다시 작성하라.`;
  const aiRequest = await requestAi({
    systemInstruction: { parts: [{ text: '국가·공공기관 공식 자료의 사실요소만 근거로 삼고 원자료 표현을 복제하지 않은 한국어 사실 JSON만 출력한다.' }] },
    contents: [{ role: 'user', parts: [{ text: prompt + correction }] }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json' },
  });
  const { response: aiResponse, model } = aiRequest;
  modelUsed = model;
  const aiPayload = await aiResponse.json();
  const raw = aiPayload.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').replace(/^```json\s*|\s*```$/g, '').trim();
  if (!raw) {
    validationErrors = ['Gemini 응답에 분석 결과가 없음'];
  } else {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        analysis = { items: parsed };
      } else if (Array.isArray(parsed?.items)) {
        analysis = parsed;
      } else {
        const arrayEntry = Object.entries(parsed || {}).find(([, value]) => Array.isArray(value));
        analysis = arrayEntry ? { ...parsed, items: arrayEntry[1] } : parsed;
      }
      if (Array.isArray(analysis?.items)) {
        analysis.items = analysis.items.map(item => ({
          ...item,
          title: normalizeGeneratedText(item.title),
        }));
      }
      validationErrors = validateAnalysis(analysis);
    } catch (error) {
      validationErrors = [`JSON 파싱 오류: ${error.message}`];
    }
  }
  if (validationErrors.length === 0) break;
  console.warn(`AI 분석 ${attempt}차 검증 실패: ${validationErrors.join(' / ')}`);
}
if (validationErrors.length > 0) throw new Error(`AI 결과 검증 3회 실패: ${validationErrors.join(' / ')}`);

analysis.items = analysis.items.map(item => {
  const sourceDocuments = item.sourceIds.map(id => articleById.get(id));
  return {
    ...item,
    sourceNames: [...new Set(sourceDocuments.map(document => document.sourceName))],
    sourceUrls: [...new Set(sourceDocuments.map(document => document.url))],
    sourceLicenses: [...new Set(sourceDocuments.map(document => document.license))],
  };
});
analysis.items.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));

const editionItems = analysis.items.map((item, index) => ({
  order: index + 1,
  category: item.category,
  title: item.title,
  summary: '',
  sourceName: '',
  sourceUrl: '',
  sourceNames: item.sourceNames,
  sourceUrls: item.sourceUrls,
  sourceLicenses: item.sourceLicenses,
  factDate: sourceDate.replaceAll('-', '.'),
  sourceDate,
  isHot: index === 0,
  selectionScore: Number(item.score || 0),
  selectionReason: item.reason,
}));
const editionId = `daily-${publishDate}-official-v5`;
const edition = {
  type: 'daily', publishDate, sourceDate, visibleAt, version: 5, status: 'PUBLISHED',
  headline: `${Number(sourceDate.slice(5, 7))}월 ${Number(sourceDate.slice(8, 10))}일 핵심 이슈`,
  sourceWindowStart: `${sourceDate}T00:00:00+09:00`, sourceWindowEnd: `${sourceDate}T23:59:59+09:00`,
  items: editionItems,
  sourceCount: new Set(analysis.items.flatMap(item => item.sourceNames)).size,
  reviewedAt: new Date().toISOString(),
  reviewMode: '국가·공공기관 직접 제공 자료만 수집·전 분야 분석·원문 표현 유사도 차단·AI 사실 제목만 공개',
  politicalToneEnabled: false,
  privateMediaExcluded: true,
  selectionModel: `Gemini ${modelUsed}`,
  selectionFactors: '국가·공공기관 공식 자료만 사용·민간 언론·포털 제외·분야별 최대 1개·제목만 공개·원자료 표현 복제 차단·최신성 25%·국민 영향도 30%·안전성 25%·검증도 20%',
};

function firestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, val]) => [key, firestoreValue(val)])) } };
}
async function setDocument(collectionName, id, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${collectionName}/${encodeURIComponent(id)}`;
  const body = { fields: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, firestoreValue(value)])) };
  const response = await fetch(url, {
    method: 'PATCH', headers: { authorization: `Bearer ${idToken}`, 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${collectionName}/${id} 저장 실패: ${response.status} ${await response.text()}`);
}

await setDocument('editions', editionId, edition);
await Promise.all(analysis.items.map((item, index) => setDocument('candidates', `${sourceDate}-${index + 1}`, {
  category: item.category, title: item.title, summary: '',
  sourceName: item.sourceNames.join(' · '), sourceNames: item.sourceNames, sourceUrls: item.sourceUrls,
  sourceUrl: item.sourceUrls[0], factDate: sourceDate.replaceAll('-', '.'), sourceDate,
  sourceLicenses: item.sourceLicenses,
  verified: true, trustGrade: 'A', sourceIds: item.sourceIds,
  analysisFactors: item.factors, analysisScore: Number(item.score || 0), analysisRank: index + 1,
  analysisReason: item.reason, analyzedAt: new Date().toISOString(),
})));
await setDocument('auditLogs', `auto-publish-${publishDate}`, {
  action: 'daily.auto_published', entityType: 'editions', entityId: editionId,
  actorEmail: 'github-actions@jamsi', sourceDate, publishDate, visibleAt, model: modelUsed,
  categoryCoverage: [...new Set(analysis.items.map(item => item.category))],
  representativeSourceCount: new Set(analysis.items.flatMap(item => item.sourceNames)).size,
  privateMediaExcluded: true,
  createdAt: new Date().toISOString(),
});
console.log(`${sourceDate} 국가·공공기관 공식 자료 ${analysis.items.length}개 이슈 분석 완료 → ${visibleAt} 공개 예약`);
