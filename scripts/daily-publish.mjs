const PROJECT_ID = 'moment-jamsi';
const DATABASE_ID = '(default)';
const { FIREBASE_API_KEY, FIREBASE_ADMIN_EMAIL, FIREBASE_ADMIN_PASSWORD, GITHUB_TOKEN } = process.env;
const MODEL = process.env.AI_MODEL || 'openai/gpt-4.1';

for (const [name, value] of Object.entries({ FIREBASE_API_KEY, FIREBASE_ADMIN_EMAIL, FIREBASE_ADMIN_PASSWORD, GITHUB_TOKEN })) {
  if (!value) throw new Error(`${name} 환경값이 없습니다.`);
}

const SECTIONS = [
  ['정치', ['정치', '국회', '정부 정책']],
  ['경제', ['경제', '물가 금리', '산업 수출']],
  ['사회', ['사회', '사건 사고', '노동 교육']],
  ['국제', ['국제', '외교', '세계']],
  ['생활·안전', ['날씨 재난', '보건 의료', '교통 주거']],
  ['과학·기술', ['과학 기술', 'AI 반도체', '우주 연구']],
  ['문화·예술', ['문화 예술', '영화 음악', '출판 공연']],
  ['스포츠', ['스포츠', '야구 축구', '올림픽']],
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
const feedUrl = query => `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
const feeds = SECTIONS.flatMap(([section, queries]) => queries.map(query => [section, feedUrl(query)]));

const decodeXml = text => text
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (xml, name) => decodeXml(xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] || '');

async function collectFeed([section, url]) {
  const response = await fetch(url, { headers: { 'user-agent': 'JamsiDailyBot/2.0' } });
  if (!response.ok) throw new Error(`${section} 피드 수집 실패: ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(match => {
    const item = match[1];
    const publishedAt = tag(item, 'pubDate');
    const sourceMatch = item.match(/<source[^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/source>/i);
    return {
      section,
      title: tag(item, 'title'),
      summary: tag(item, 'description'),
      url: tag(item, 'link'),
      sourceName: decodeXml(sourceMatch?.[2] || '언론사'),
      publishedAt,
      sourceDate: publishedAt ? kstDate(new Date(publishedAt)) : '',
    };
  });
}

const feedResults = await Promise.allSettled(feeds.map(collectFeed));
const collected = feedResults
  .flatMap(result => result.status === 'fulfilled' ? result.value : [])
  .filter(article => article.sourceDate === sourceDate && article.title && article.url)
  .filter((article, index, array) => array.findIndex(other => other.url === article.url || other.title === article.title) === index);

// 특정 언론사가 후보 목록 자체를 독점하지 못하도록 분야별·언론사별 상한을 둔다.
const articles = [];
for (const [section] of SECTIONS) {
  const counts = new Map();
  const balanced = collected.filter(article => article.section === section).filter(article => {
    const count = counts.get(article.sourceName) || 0;
    if (count >= 4) return false;
    counts.set(article.sourceName, count + 1);
    return true;
  }).slice(0, 36);
  if (balanced.length < 4) throw new Error(`${sourceDate} ${section} 후보가 ${balanced.length}개뿐이어서 자동 발행을 중단합니다.`);
  articles.push(...balanced);
}

const prompt = `당신은 한국어 일간 브리핑 '잠시'의 사실검증 편집 AI다. 입력은 ${sourceDate} 00:00~23:59(KST)에 발행된 기사 후보뿐이다.

목표는 기사 수가 많은 언론사를 따라가는 것이 아니라, 전체 분야와 여러 언론사를 대조해 그날 국민에게 영향이 큰 사실을 고르는 것이다.

편집 규칙:
1. 정치·경제·사회·국제·생활·안전·과학·기술·문화·예술·스포츠를 빠짐없이 검토한다.
2. 결과는 정확히 8개이며 정치, 경제, 사회, 국제, 생활·안전, 과학·기술, 문화·예술, 스포츠에서 각 1개를 고른다.
3. 8개 결과의 대표 sourceName은 모두 달라야 한다. 같은 언론사를 두 번 대표 출처로 쓰지 않는다.
4. 같은 사건을 다룬 독립 언론사 기사 2개 이상이 입력에 있을 때만 선정한다. sourceNames와 sourceUrls에 교차 확인한 출처를 2개 이상 기록한다.
5. 8개를 먼저 분야별 영향도 순으로 비교한 뒤, 국민 영향도 30%·안전성 25%·최신성 25%·출처 검증도 20%로 전체 순위를 정한다. 1번이 그날의 메인 이슈다.
6. 정치에서는 좌우 평가, 정당 유불리, 감정적 표현, 전망을 쓰지 않는다. 의결·발표·수치·일정처럼 확인된 사실만 쓴다.
7. 제목은 구체적인 주어와 확정된 결과를 담고, 요약은 휴대전화 한 페이지에 맞게 2문장·120자 이내로 쓴다.
8. 입력에 없는 사실이나 URL을 만들지 않는다.

JSON만 출력한다.
{"items":[{"category":"지정된 8개 분야 중 하나","title":"구체적 사실 제목","summary":"120자 이내 사실 요약","sourceName":"대표 언론사","sourceNames":["교차확인 언론사1","교차확인 언론사2"],"sourceUrls":["입력 URL1","입력 URL2"],"score":0,"reason":"선정 근거","factors":{"freshness":0,"impact":0,"safety":0,"verification":0}}]}

기사 후보: ${JSON.stringify(articles)}`;

const aiResponse = await fetch('https://models.github.ai/inference/chat/completions', {
  method: 'POST',
  headers: {
    'content-type': 'application/json', authorization: `Bearer ${GITHUB_TOKEN}`,
    accept: 'application/vnd.github+json',
  },
  body: JSON.stringify({
    model: MODEL, temperature: 0,
    messages: [
      { role: 'system', content: '주어진 기사 후보만 근거로 분야·언론사 균형을 지킨 사실 JSON만 출력한다.' },
      { role: 'user', content: prompt },
    ],
  }),
});
if (!aiResponse.ok) throw new Error(`AI 분석 실패: ${aiResponse.status} ${await aiResponse.text()}`);
const aiPayload = await aiResponse.json();
const raw = aiPayload.choices?.[0]?.message?.content?.replace(/^```json\s*|\s*```$/g, '').trim();
const analysis = JSON.parse(raw);

const requiredCategories = new Set(SECTIONS.map(([section]) => section));
if (!Array.isArray(analysis.items) || analysis.items.length !== requiredCategories.size) throw new Error('AI 결과가 정확히 8개가 아닙니다.');
const inputUrls = new Set(articles.map(article => article.url));
const chosenCategories = new Set();
const representativeSources = new Set();
for (const item of analysis.items) {
  if (!requiredCategories.has(item.category) || chosenCategories.has(item.category)) throw new Error(`분야 누락 또는 중복: ${item.category}`);
  chosenCategories.add(item.category);
  if (!item.sourceName || representativeSources.has(item.sourceName)) throw new Error(`대표 언론사 중복: ${item.sourceName}`);
  representativeSources.add(item.sourceName);
  if (!Array.isArray(item.sourceUrls) || item.sourceUrls.length < 2 || item.sourceUrls.some(url => !inputUrls.has(url))) throw new Error(`${item.category} 교차검증 URL이 부족하거나 입력에 없습니다.`);
  if (!Array.isArray(item.sourceNames) || new Set(item.sourceNames).size < 2) throw new Error(`${item.category} 독립 언론사 교차검증이 부족합니다.`);
  if (!item.title || !item.summary || item.summary.length > 120) throw new Error(`${item.category} 제목 또는 요약 형식이 잘못됐습니다.`);
}

analysis.items.sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
const editionItems = analysis.items.map((item, index) => ({
  order: index + 1,
  category: item.category,
  title: item.title,
  summary: item.summary,
  sourceName: item.sourceNames.join(' · '),
  sourceUrl: '',
  sourceNames: item.sourceNames,
  factDate: sourceDate.replaceAll('-', '.'),
  sourceDate,
  isHot: index === 0,
  selectionScore: Number(item.score || 0),
  selectionReason: item.reason,
}));
const editionId = `daily-${publishDate}-ai-v2`;
const edition = {
  type: 'daily', publishDate, sourceDate, visibleAt, version: 2, status: 'PUBLISHED',
  headline: `${Number(sourceDate.slice(5, 7))}월 ${Number(sourceDate.slice(8, 10))}일 가장 영향도가 큰 8가지 사실`,
  sourceWindowStart: `${sourceDate}T00:00:00+09:00`, sourceWindowEnd: `${sourceDate}T23:59:59+09:00`,
  items: editionItems,
  sourceCount: new Set(analysis.items.flatMap(item => item.sourceNames)).size,
  reviewedAt: new Date().toISOString(),
  reviewMode: 'AI 분야 균형·언론사 분산·복수 출처 교차검증',
  politicalToneEnabled: false,
  selectionModel: `GitHub Models ${MODEL}`,
  selectionFactors: '분야별 1개·대표 언론사 중복 금지·최신성 25%·국민 영향도 30%·안전성 25%·출처 검증도 20%',
};

const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: FIREBASE_ADMIN_EMAIL, password: FIREBASE_ADMIN_PASSWORD, returnSecureToken: true }),
});
if (!authResponse.ok) throw new Error(`Firebase 인증 실패: ${authResponse.status}`);
const { idToken } = await authResponse.json();

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
  category: item.category, title: item.title, summary: item.summary,
  sourceName: item.sourceName, sourceNames: item.sourceNames, sourceUrls: item.sourceUrls,
  sourceUrl: item.sourceUrls[0], factDate: sourceDate.replaceAll('-', '.'), sourceDate,
  verified: true, trustGrade: 'A', sourceIds: ['google-news', ...item.sourceNames],
  analysisFactors: item.factors, analysisScore: Number(item.score || 0), analysisRank: index + 1,
  analysisReason: item.reason, analyzedAt: new Date().toISOString(),
})));
await setDocument('auditLogs', `auto-publish-${publishDate}`, {
  action: 'daily.auto_published', entityType: 'editions', entityId: editionId,
  actorEmail: 'github-actions@jamsi', sourceDate, publishDate, visibleAt, model: MODEL,
  categoryCoverage: [...requiredCategories], representativeSourceCount: representativeSources.size,
  createdAt: new Date().toISOString(),
});
console.log(`${sourceDate} 전 분야 8개 이슈 분석 완료 → ${visibleAt} 공개 예약`);
