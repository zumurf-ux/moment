const PROJECT_ID='moment-jamsi', DATABASE_ID='(default)';
const {FIREBASE_API_KEY,FIREBASE_ADMIN_EMAIL,FIREBASE_ADMIN_PASSWORD,GITHUB_TOKEN}=process.env;
const MODEL=process.env.AI_MODEL||'openai/gpt-4.1';
for(const [name,value] of Object.entries({FIREBASE_API_KEY,FIREBASE_ADMIN_EMAIL,FIREBASE_ADMIN_PASSWORD,GITHUB_TOKEN})) if(!value) throw new Error(`${name} 환경값이 없습니다.`);

const kstDate=(date=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const addDays=(value,days)=>{const date=new Date(`${value}T12:00:00+09:00`);date.setUTCDate(date.getUTCDate()+days);return kstDate(date)};
const sourceDate=process.env.SOURCE_DATE||addDays(kstDate(),-1);
const publishDate=addDays(sourceDate,1);
const visibleAt=`${publishDate}T05:00:00+09:00`;
const feeds=[
 ['종합','https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko'],
 ['날씨·재난','https://news.google.com/rss/search?q=%EB%82%A0%EC%94%A8+OR+%ED%8F%AD%EC%97%BC+OR+%ED%98%B8%EC%9A%B0+OR+%EC%9E%AC%EB%82%9C&hl=ko&gl=KR&ceid=KR:ko'],
 ['경제','https://news.google.com/rss/search?q=%EA%B2%BD%EC%A0%9C+OR+%EB%AC%BC%EA%B0%80+OR+%EA%B8%88%EB%A6%AC+OR+%EC%88%98%EC%B6%9C&hl=ko&gl=KR&ceid=KR:ko'],
 ['사회·안전','https://news.google.com/rss/search?q=%EC%82%AC%ED%9A%8C+OR+%EC%95%88%EC%A0%84+OR+%EC%9D%98%EB%A3%8C+OR+%EA%B5%90%ED%86%B5&hl=ko&gl=KR&ceid=KR:ko'],
 ['산업·과학','https://news.google.com/rss/search?q=%EC%82%B0%EC%97%85+OR+%EA%B3%BC%ED%95%99+OR+AI+OR+%EB%B0%98%EB%8F%84%EC%B2%B4&hl=ko&gl=KR&ceid=KR:ko'],
 ['국제','https://news.google.com/rss/search?q=%EA%B5%AD%EC%A0%9C+OR+%EC%99%B8%EA%B5%90+OR+%EB%AC%B4%EC%97%AD&hl=ko&gl=KR&ceid=KR:ko'],
 ['정책','https://news.google.com/rss/search?q=%EC%A0%95%EB%B6%80+%EB%B0%9C%ED%91%9C+OR+%EC%A0%95%EC%B1%85+%EC%8B%9C%ED%96%89&hl=ko&gl=KR&ceid=KR:ko']
];
const decodeXml=text=>text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const tag=(xml,name)=>decodeXml(xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`,'i'))?.[1]||'');
async function collectFeed([section,url]){
 const response=await fetch(url,{headers:{'user-agent':'JamsiDailyBot/1.0'}});if(!response.ok)throw new Error(`${section} 피드 수집 실패: ${response.status}`);
 const xml=await response.text();return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(match=>{const item=match[1],publishedAt=tag(item,'pubDate'),sourceMatch=item.match(/<source[^>]*url="([^"]+)"[^>]*>([\s\S]*?)<\/source>/i);return {section,title:tag(item,'title'),summary:tag(item,'description'),url:tag(item,'link'),sourceName:decodeXml(sourceMatch?.[2]||'언론사'),sourceHome:sourceMatch?.[1]||'',publishedAt,sourceDate:publishedAt?kstDate(new Date(publishedAt)):''}})
}
const feedResults=await Promise.allSettled(feeds.map(collectFeed));
const articles=feedResults.flatMap(result=>result.status==='fulfilled'?result.value:[]).filter(article=>article.sourceDate===sourceDate&&article.title&&article.url).filter((article,index,array)=>array.findIndex(other=>other.title===article.title)===index).slice(0,160);
if(articles.length<12)throw new Error(`${sourceDate} 기사 후보가 ${articles.length}개뿐이어서 자동 발행을 중단합니다.`);

const prompt=`당신은 한국어 일간 브리핑 '잠시'의 사실검증 편집 AI다. 입력은 ${sourceDate} 00:00~23:59(KST)에 발행된 기사 후보뿐이다.
정치적 좌우 평가, 정당 유불리 해석, 감정적 표현, 전망을 사실처럼 쓰는 행위를 금지한다. 국민 영향도 30%, 안전성 25%, 최신성 25%, 출처 검증도 20%로 큰 이슈 6개를 고른다.
날씨·재난처럼 당일 생활안전에 큰 영향을 주는 이슈는 실제 영향이 크면 우선한다. 후보에 명시된 수치·고유명사·확정 조치만 사용하고 추론하지 않는다. 충돌하는 수치는 쓰지 않는다. 정치 이슈는 결정·발표·표결 결과 같은 확인된 사실만 쓴다.
반드시 JSON만 출력한다. 스키마: {"items":[{"category":"분류","title":"구체적 사실 제목","summary":"2문장 이내 사실 요약","sourceName":"언론사","sourceUrl":"입력 URL과 정확히 동일","score":0,"reason":"선정 근거","factors":{"freshness":0,"impact":0,"safety":0,"verification":0}}]}
기사 후보: ${JSON.stringify(articles)}`;
const aiResponse=await fetch('https://models.github.ai/inference/chat/completions',{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${GITHUB_TOKEN}`,'accept':'application/vnd.github+json'},body:JSON.stringify({model:MODEL,temperature:0,messages:[{role:'system',content:'오직 제공된 기사 후보에 근거한 JSON만 출력한다.'},{role:'user',content:prompt}]})});
if(!aiResponse.ok)throw new Error(`AI 분석 실패: ${aiResponse.status} ${await aiResponse.text()}`);
const aiPayload=await aiResponse.json(),raw=aiPayload.choices?.[0]?.message?.content?.replace(/^```json\s*|\s*```$/g,'').trim(),analysis=JSON.parse(raw);
if(!Array.isArray(analysis.items)||analysis.items.length!==6)throw new Error('AI 결과가 정확히 6개가 아닙니다.');
const inputUrls=new Set(articles.map(article=>article.url));for(const item of analysis.items){if(!inputUrls.has(item.sourceUrl))throw new Error(`입력에 없는 출처 URL: ${item.sourceUrl}`);if(!item.title||!item.summary||!item.sourceName)throw new Error('필수 사실 필드가 비었습니다.')}
const editionItems=analysis.items.map((item,index)=>({order:index+1,category:item.category,title:item.title,summary:item.summary,sourceName:item.sourceName,sourceUrl:item.sourceUrl,factDate:sourceDate.replaceAll('-','.'),sourceDate,isHot:index===0,selectionScore:Number(item.score||0),selectionReason:item.reason}));
const editionId=`daily-${publishDate}-ai-v1`,edition={type:'daily',publishDate,sourceDate,visibleAt,version:1,status:'PUBLISHED',headline:`${Number(sourceDate.slice(5,7))}월 ${Number(sourceDate.slice(8,10))}일 가장 영향도가 큰 6가지 사실`,sourceWindowStart:`${sourceDate}T00:00:00+09:00`,sourceWindowEnd:`${sourceDate}T23:59:59+09:00`,items:editionItems,sourceCount:new Set(articles.map(article=>article.sourceName)).size,reviewedAt:new Date().toISOString(),reviewMode:'AI 자동 분석·날짜·출처 검증',politicalToneEnabled:false,selectionModel:`GitHub Models ${MODEL}`,selectionFactors:'최신성 25%·국민 영향도 30%·안전성 25%·출처 검증도 20%'};
const authResponse=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:FIREBASE_ADMIN_EMAIL,password:FIREBASE_ADMIN_PASSWORD,returnSecureToken:true})});if(!authResponse.ok)throw new Error(`파이어베이스 인증 실패: ${authResponse.status}`);const {idToken}=await authResponse.json();
function firestoreValue(value){if(value===null||value===undefined)return{nullValue:null};if(typeof value==='boolean')return{booleanValue:value};if(typeof value==='number')return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};if(typeof value==='string')return{stringValue:value};if(Array.isArray(value))return{arrayValue:{values:value.map(firestoreValue)}};return{mapValue:{fields:Object.fromEntries(Object.entries(value).map(([key,val])=>[key,firestoreValue(val)]))}}}
async function setDocument(collectionName,id,data){const url=`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${collectionName}/${encodeURIComponent(id)}`,body={fields:Object.fromEntries(Object.entries(data).map(([key,value])=>[key,firestoreValue(value)]))},response=await fetch(url,{method:'PATCH',headers:{authorization:`Bearer ${idToken}`,'content-type':'application/json'},body:JSON.stringify(body)});if(!response.ok)throw new Error(`${collectionName}/${id} 저장 실패: ${response.status} ${await response.text()}`)}
await setDocument('editions',editionId,edition);
await Promise.all(analysis.items.map((item,index)=>setDocument('candidates',`${sourceDate}-${index+1}`,{category:item.category,title:item.title,summary:item.summary,sourceName:item.sourceName,sourceUrl:item.sourceUrl,factDate:sourceDate.replaceAll('-','.'),sourceDate,verified:true,trustGrade:'A',sourceIds:['google-news',item.sourceName],analysisFactors:item.factors,analysisScore:Number(item.score||0),analysisRank:index+1,analysisReason:item.reason,analyzedAt:new Date().toISOString()})));
await setDocument('auditLogs',`auto-publish-${publishDate}`,{action:'daily.auto_published',entityType:'editions',entityId:editionId,actorEmail:'github-actions@jamsi',sourceDate,publishDate,visibleAt,model:MODEL,createdAt:new Date().toISOString()});
console.log(`${sourceDate} 이슈 6개 분석 완료 → ${visibleAt} 공개 예약`);
