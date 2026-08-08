import { firebaseConfig } from "./firebase-config.js?v=12";
import { demoData } from "./demo-data.js?v=12";

const sdk = "https://www.gstatic.com/firebasejs/12.16.0";
const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
const state = { view:"dashboard", user:null, db:null, auth:null, api:null, data:structuredClone(demoData), selectedEdition:null, selectedCandidates:new Set() };
const menus = [["dashboard","운영 현황"],["editions","발행본 편집"],["candidates","이슈 후보"],["sources","수집 소스"],["audit","감사 로그"],["settings","서비스 설정"]];
const $ = (q) => document.querySelector(q);
const esc = (value="") => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const now = () => new Date().toISOString();
const statusLabels = { DRAFT:"초안", IN_REVIEW:"검수 중", APPROVED:"승인됨", SCHEDULED:"발행 예정", PUBLISHED:"공개됨", WITHDRAWN:"철회됨", REJECTED:"반려됨", SUCCESS:"정상", ERROR:"오류", READY:"준비됨", PENDING:"대기 중" };
const typeLabels = { daily:"일간", weekly:"주간", monthly:"월간" };
const sourceTypeLabels = { OFFICIAL:"공식", NEWS:"언론사", AGGREGATOR:"언론 종합DB", TREND:"트렌드" };
const methodLabels = { API:"자동 연동", RSS:"새 소식 모음", SEARCH:"통합 검색", MANUAL:"수동" };
const gradeLabels = { A:"가", B:"나", C:"다" };
const actionLabels = { "system.seeded":"초기 데이터 생성", "config.updated":"서비스 설정 변경", "document.updated":"문서 변경", "account.credentials_updated":"운영자 계정 변경", "analysis.updated":"이슈 영향도 재분석" };
const entityLabels = { system:"시스템", appConfig:"앱 설정", candidates:"이슈 후보", sources:"수집 소스", editions:"발행본", admins:"운영자" };
const entityIdLabels = { android:"사용자 앱" };
const statusLabel = value => statusLabels[value] || value;
const typeLabel = value => typeLabels[value] || value;
const actionLabel = value => actionLabels[value] || value;
const entityLabel = value => entityLabels[value] || value;

function toast(message){ const el=$("#toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2300); }
function showApp(on){ $("#loginView").classList.toggle("hidden",on); $("#appView").classList.toggle("hidden",!on); }
function setConnection(ok,label){ $("#connectionText").textContent=label; $(".connection").classList.toggle("online",ok); $("#environmentLabel").textContent=configured?"파이어베이스":"데모"; }

async function initializeFirebase(){
  if(!configured){ $("#modeBanner").innerHTML="현재 <strong>데모 모드</strong>입니다. 비밀번호는 <code>ChangeMe!2026</code>입니다."; setConnection(true,"데모 데이터 연결됨"); return; }
  $("#modeBanner").textContent="파이어베이스 인증으로 보호됩니다.";
  const appSdk=await import(`${sdk}/firebase-app.js`); const authSdk=await import(`${sdk}/firebase-auth.js`); const fs=await import(`${sdk}/firebase-firestore.js`);
  const app=appSdk.initializeApp(firebaseConfig); state.auth=authSdk.getAuth(app); state.db=fs.getFirestore(app); state.api={...authSdk,...fs};
  authSdk.onAuthStateChanged(state.auth, async user=>{ if(user){state.user=user; await loadFirebaseData(); enterApp();} else {state.user=null; showApp(false);} });
  setConnection(true,"파이어베이스 연결됨");
}

async function loadFirebaseData(){
  const {collection,getDocs,doc,getDoc}=state.api; const names=["editions","candidates","sources","auditLogs"];
  for(const name of names){ const snap=await getDocs(collection(state.db,name)); state.data[name]=snap.docs.map(d=>({id:d.id,...d.data()})); }
  const cfg=await getDoc(doc(state.db,"appConfig","android")); if(cfg.exists()) state.data.config=cfg.data();
  state.selectedEdition=state.data.editions[0]?.id||null;
}

async function signIn(email,password){
  if(!configured){ if(email!=="admin@jamsi.local"||password!=="ChangeMe!2026") throw new Error("데모 계정 정보를 확인하세요."); state.user={email,uid:"demo-admin"}; enterApp(); return; }
  await state.api.signInWithEmailAndPassword(state.auth,email,password);
}
async function signOut(){ if(configured) await state.api.signOut(state.auth); state.user=null; showApp(false); }
function enterApp(){ $("#accountLabel").textContent=state.user?.email||"운영자"; showApp(true); renderNav(); render(); }

async function saveDoc(collectionName,id,value){
  if(configured){ const {doc,setDoc}=state.api; await setDoc(doc(state.db,collectionName,id),{...value,updatedAt:now()},{merge:true}); await audit("document.updated",collectionName,id); await loadFirebaseData(); }
  else { const list=state.data[collectionName]; const i=list.findIndex(x=>x.id===id); if(i>=0) list[i]={...list[i],...value,updatedAt:now()}; else list.unshift({id,...value,createdAt:now()}); state.data.auditLogs.unshift({id:crypto.randomUUID(),action:"document.updated",entityType:collectionName,entityId:id,actorEmail:state.user.email,createdAt:now()}); }
}
async function audit(action,entityType,entityId){ if(!configured)return; const {collection,addDoc,serverTimestamp}=state.api; await addDoc(collection(state.db,"auditLogs"),{action,entityType,entityId,actorUid:state.user.uid,actorEmail:state.user.email,createdAt:serverTimestamp()}); }

function renderNav(){ $("#nav").innerHTML=menus.map(([id,label])=>`<button class="nav-button ${state.view===id?'active':''}" data-view="${id}">${label}</button>`).join(""); }
function head(title,desc,actions=""){ return `<header class="page-head"><div><p class="eyebrow">잠시 운영</p><h1>${title}</h1><p class="muted">${desc}</p></div><div class="actions">${actions}</div></header>`; }
function badge(status){ const cls=/REJECT|WITHDRAW|ERROR/.test(status)?"danger":/REVIEW|SCHEDULE|PENDING/.test(status)?"warn":""; return `<span class="badge ${cls}">${esc(statusLabel(status))}</span>`; }
function formatDate(v){ if(!v)return"-"; const d=v?.toDate?v.toDate():new Date(v); return Number.isNaN(d.getTime())?esc(v):d.toLocaleString("ko-KR"); }
function analyzeCandidate(candidate){
  const f=candidate.analysisFactors||{};
  const fallback=Number(candidate.analysisScore||candidate.score||50);
  const freshness=Number(f.freshness??fallback);
  const impact=Number(f.impact??fallback);
  const safety=Number(f.safety??fallback);
  const verification=Number(f.verification??fallback);
  const analysisScore=Math.round(freshness*0.25+impact*0.30+safety*0.25+verification*0.20);
  return {...candidate,analysisScore,analysisReason:candidate.analysisReason||"최신성·영향도·안전성·검증도 종합"};
}
function localIsoDate(date=new Date()){ return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function previousDate(dateString){ const [year,month,day]=String(dateString).split("-").map(Number); const date=new Date(year,month-1,day); date.setDate(date.getDate()-1); return localIsoDate(date); }
function nextDate(dateString){ const [year,month,day]=String(dateString).split("-").map(Number); const date=new Date(year,month-1,day); date.setDate(date.getDate()+1); return localIsoDate(date); }
function activePublishDate(){ return state.data.editions.find(x=>x.id===state.selectedEdition)?.publishDate||localIsoDate(); }
function expectedSourceDate(){ return localIsoDate(); }
function scheduledVisibleAt(sourceDate){ return `${nextDate(sourceDate)}T05:00:00+09:00`; }
function rankedCandidates(){
  const target=expectedSourceDate();
  return state.data.candidates
    .filter(candidate=>candidate.verified===true&&candidate.sourceDate===target)
    .map(analyzeCandidate)
    .sort((a,b)=>b.analysisScore-a.analysisScore||String(a.title).localeCompare(String(b.title),"ko"));
}
async function runIssueAnalysis(){
  const ranked=rankedCandidates();
  if(configured){
    const {doc,setDoc}=state.api;
    await Promise.all(ranked.map((candidate,index)=>setDoc(doc(state.db,"candidates",candidate.id),{analysisScore:candidate.analysisScore,analysisRank:index+1,analysisReason:candidate.analysisReason,analyzedAt:now()},{merge:true})));
    await audit("analysis.updated","candidates","daily-ranking");
    await loadFirebaseData();
  }else state.data.candidates=ranked;
  return ranked;
}
async function syncPreviousDayData(){
  if(!configured){ state.data=structuredClone(demoData); return; }
  const {doc,setDoc,deleteDoc}=state.api;
  const edition=demoData.editions[0];
  const staleIds=["c1","c2","c3","weather-august","energy-oil","prices-june","childcare-leave","anti-scalping","samsung-q2"];
  await setDoc(doc(state.db,"editions",edition.id),{...edition,updatedAt:now()},{merge:true});
  await Promise.all(demoData.candidates.map(candidate=>setDoc(doc(state.db,"candidates",candidate.id),{...candidate,updatedAt:now()},{merge:true})));
  await Promise.all(staleIds.map(id=>deleteDoc(doc(state.db,"candidates",id)).catch(()=>null)));
  await setDoc(doc(state.db,"appConfig","editorial"),{dailySourceRule:"발행일 전날 00:00~23:59",dailySourceDate:edition.sourceDate,publishOnlyVerifiedFacts:true,politicalToneEnabled:false,selectionModel:"일간 영향도 분석 v2",updatedAt:now()},{merge:true});
  await audit("daily_source.corrected","editions",edition.id);
  await loadFirebaseData();
}

function dashboard(){ const d=state.data; const ranked=rankedCandidates(); const top=ranked[0]; return head("운영 현황",`${expectedSourceDate()} 하루 동안 발행된 자료만 분석합니다.`,`<button class="primary" data-action="pipeline">영향도 재분석</button>`)+`<section class="grid metrics"><div class="metric"><span>공개 발행본</span><strong>${d.editions.filter(x=>x.status==="PUBLISHED").length}</strong></div><div class="metric"><span>검수 대기</span><strong>${d.editions.filter(x=>x.status==="IN_REVIEW").length}</strong></div><div class="metric"><span>오늘 검증 후보</span><strong>${ranked.length}</strong></div><div class="metric"><span>종합 대상 언론사</span><strong>104</strong></div></section>${top?`<div class="policy-note"><strong>${esc(expectedSourceDate())} 이슈 분석 1순위 · ${esc(top.title)}</strong><p>선정 ${top.analysisScore}점 · ${esc(top.analysisReason)}. 점수는 최신성 25%, 국민 영향도 30%, 안전성 25%, 출처 검증도 20%를 합산합니다.</p></div>`:""}<section class="grid two-col"><article class="card"><h2>오늘 운영 상태</h2><div class="status-list"><div class="status-row"><span>최신 공개일</span><strong>${esc(d.editions.find(x=>x.status==="PUBLISHED")?.publishDate||"-")}</strong></div><div class="status-row"><span>수집 기준일</span><strong>${esc(expectedSourceDate())}</strong></div><div class="status-row"><span>자료 저장소</span><strong>${configured?"파이어베이스":"데모"}</strong></div></div></article><article class="card"><h2>최근 활동</h2>${d.auditLogs.slice(0,6).map(x=>`<div class="status-row"><span>${esc(actionLabel(x.action))}</span><small>${formatDate(x.createdAt)}</small></div>`).join("")||'<p class="empty">기록 없음</p>'}</article></section>`; }
function editions(){ const current=state.data.editions.find(x=>x.id===state.selectedEdition)||state.data.editions[0]; if(!current)return head("발행본 편집","후보를 선택해 첫 발행본을 만드세요.")+`<div class="empty">발행본이 없습니다.</div>`; const checks=["언론사 종합DB 확인","수치·고유명사 확인","공식 또는 원문 출처","발표일·시행일 확인","사실·전망 분리","정파 평가 없음","상반된 주장 동등 표기","주어·대상 명시","수치 단위 명시","인용 주체 명시","출처 연결 확인","휴대전화 미리보기"]; return head("발행본 편집","전날 이슈는 다음 날 오전 5시에 자동 공개합니다.",`<button class="secondary" data-action="save-edition">저장</button><button class="primary" data-action="schedule-edition">오전 5시 예약</button><button class="danger" data-action="withdraw">철회</button>`)+`<section class="split"><div class="list">${state.data.editions.map(x=>`<button class="list-button ${x.id===current.id?'active':''}" data-edition="${x.id}"><strong>${esc(x.publishDate)} · ${esc(typeLabel(x.type))}</strong><span>${x.version}판 · ${esc(statusLabel(x.status))}</span></button>`).join("")}</div><div class="grid"><article class="card"><div class="form-grid"><label>제목<input id="editionHeadline" value="${esc(current.headline)}"></label><label>발행일<input id="editionDate" type="date" value="${esc(current.publishDate)}"></label><label>공개 시각<input id="editionVisibleAt" type="datetime-local" value="${esc((current.visibleAt||`${current.publishDate}T05:00:00+09:00`).slice(0,16))}"></label><label>상태<input value="${esc(statusLabel(current.status))}" disabled></label><label>판 번호<input value="${current.version}" disabled></label><label>이슈 기준일<input value="${esc(current.sourceDate||previousDate(current.publishDate))}" disabled></label></div></article><article class="card"><h2>핵심 팩트 ${current.items?.length||0}개</h2>${(current.items||[]).map((x,i)=>`<div class="candidate"><span>${String(i+1).padStart(2,"0")}</span><div><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p>${x.selectionScore?`<p class="fact-source">선정 ${esc(x.selectionScore)}점 · ${esc(x.selectionReason||"")}</p>`:""}${x.sourceName?`<p class="fact-source">확인 · ${esc(x.factDate||"발표일 미기재")} · <a href="${esc(x.sourceUrl||"#")}" target="_blank" rel="noreferrer">${esc(x.sourceName)}</a></p>`:""}</div><span class="badge">${esc(x.category)}</span></div>`).join("")}</article><article class="card"><h2>언론 종합·사실·정치 중립 검수 12개</h2><div class="checklist">${checks.map((x,i)=>`<label class="check"><input type="checkbox" class="review-check" ${current.reviewChecklist?.[i]?'checked':''}>${x}</label>`).join("")}</div></article></div></section>`; }
function candidates(){ const ranked=rankedCandidates(); return head("이슈 후보",`${expectedSourceDate()} 00:00~23:59에 발행되고 사실 검증을 통과한 후보만 표시합니다.`,`<button class="secondary" data-action="sync-previous-day">기준일 데이터 반영</button><button class="secondary" data-action="pipeline">영향도 재분석</button><button class="primary" data-action="create-draft">상위 후보로 초안 생성</button>`)+`<div class="policy-note"><strong>일간판 수집 기준 · ${esc(expectedSourceDate())}</strong><p>해당일 발행 확인 필수 · 최신성 25% · 국민 영향도 30% · 안전성 25% · 출처 검증도 20%. 기준일과 다른 자료 및 미검증 후보는 자동 제외됩니다.</p></div><article class="card">${ranked.map((x,index)=>`<div class="candidate"><input type="checkbox" data-candidate="${x.id}" ${state.selectedCandidates.has(x.id)?'checked':''}><div><h3>${index+1}순위 · ${esc(x.title)}</h3><p>${esc(x.summary)} · 발행일 ${esc(x.sourceDate)} · 출처 ${(x.sourceIds||[]).length}개</p><p class="fact-source">선정 근거 · ${esc(x.analysisReason)}</p></div><span class="badge">선정 ${x.analysisScore}점 · 신뢰 ${esc(gradeLabels[x.trustGrade]||x.trustGrade||"나")}등급</span></div>`).join("")||'<p class="empty">전날 발행·검증 조건을 충족한 후보가 없습니다.</p>'}</article>`; }
function sources(){ return head("수집 소스","언론사 종합DB·각 언론사 원문·공식 발표를 함께 관리합니다.")+`<div class="policy-note"><strong>언론사 종합 기준</strong><p>한국언론진흥재단 빅카인즈의 104개 언론사 통합DB와 각 언론사 원문, 공식 발표를 대조합니다. 보도가 서로 다르면 하나의 사실로 합치지 않고 발행을 보류합니다.</p><a href="https://www.bigkinds.or.kr/" target="_blank" rel="noreferrer">104개 언론사 통합DB 열기</a></div><article class="card"><form id="sourceForm" class="source-form"><input id="sourceName" placeholder="소스 이름" required><select id="sourceType"><option value="OFFICIAL">공식</option><option value="NEWS">언론사</option><option value="AGGREGATOR">언론 종합DB</option><option value="TREND">트렌드</option></select><select id="sourceMethod"><option value="API">자동 연동</option><option value="RSS">새 소식 모음</option><option value="SEARCH">통합 검색</option><option value="MANUAL">수동</option></select><button class="primary">추가</button></form><div class="table-wrap"><table><thead><tr><th>이름</th><th>유형</th><th>신뢰</th><th>수집</th><th>상태</th><th>활성</th></tr></thead><tbody>${state.data.sources.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(sourceTypeLabels[x.sourceType]||x.sourceType)}</td><td>${esc(gradeLabels[x.trustLevel]||x.trustLevel)}등급</td><td>${esc(methodLabels[x.collectionMethod]||x.collectionMethod)}</td><td>${badge(x.lastStatus||"READY")}</td><td><label class="toggle"><input type="checkbox" data-source="${x.id}" ${x.active?'checked':''}>사용</label></td></tr>`).join("")}</tbody></table></div></article>`; }
function auditView(){ return head("감사 로그","로그인과 주요 변경 기록입니다.")+`<div class="table-wrap"><table><thead><tr><th>시각</th><th>작업</th><th>대상</th><th>운영자</th></tr></thead><tbody>${state.data.auditLogs.map(x=>`<tr><td>${formatDate(x.createdAt)}</td><td>${esc(actionLabel(x.action))}</td><td>${esc(entityLabel(x.entityType))} ${esc(entityIdLabels[x.entityId]||x.entityId||"")}</td><td>${esc(x.actorEmail||x.actorUid||"시스템")}</td></tr>`).join("")}</tbody></table></div>`; }
function settings(){ const x=state.data.config; return head("서비스 설정","사용자 앱 원격 설정과 운영자 계정을 관리합니다.",`<button class="primary" data-action="save-settings">설정 저장</button>`)+`<section class="grid two-col"><article class="card"><h2>앱 원격 설정</h2><div class="form-grid"><label class="check"><input id="adsEnabled" type="checkbox" ${x.adsEnabled?'checked':''}>광고 활성</label><label class="check"><input id="maintenanceEnabled" type="checkbox" ${x.maintenanceEnabled?'checked':''}>점검 모드</label><label class="full">점검 안내<textarea id="maintenanceMessage">${esc(x.maintenanceMessage||"")}</textarea></label><label>최소 앱 버전<input id="minimumVersion" value="${esc(x.minimumVersion||"1.0.0")}"></label></div><div class="policy-note"><strong>언론 종합·정치 중립 원칙</strong><p>104개 언론사 통합DB와 공식 원문을 함께 확인합니다. 큰 이슈는 최신성 25%·국민 영향도 30%·안전성 25%·출처 검증도 20%로 정렬합니다. 정치 성향·좌우·정당에 대한 평가나 유불리 해석은 저장하지 않습니다. 의결 결과, 찬반 숫자, 발언 주체, 발표일만 쓰고 상반된 주장은 같은 분량으로 표시합니다.</p></div></article><article class="card"><h2>운영자 아이디·비밀번호 변경</h2><p class="muted">현재 비밀번호로 본인 확인 후 변경합니다. 아이디는 로그인에 사용하는 이메일입니다.</p><form id="accountForm" class="form-grid"><label class="full">현재 아이디<input value="${esc(state.user?.email||"")}" disabled></label><label class="full">새 아이디(선택)<input id="newAccountEmail" type="email" autocomplete="email" placeholder="새 운영자 이메일"></label><label class="full">현재 비밀번호<input id="currentAccountPassword" type="password" autocomplete="current-password" required></label><label>새 비밀번호(선택)<input id="newAccountPassword" type="password" autocomplete="new-password" minlength="6" placeholder="6자 이상"></label><label>새 비밀번호 확인<input id="confirmAccountPassword" type="password" autocomplete="new-password" minlength="6"></label><div class="full"><button class="primary" type="submit">계정 변경 저장</button></div></form></article></section>`; }
function render(){ renderNav(); const views={dashboard,editions,candidates,sources,audit:auditView,settings}; $("#content").innerHTML=views[state.view](); bindContent(); $("#content").focus(); }

function bindContent(){
  document.querySelectorAll("[data-edition]").forEach(el=>el.onclick=()=>{state.selectedEdition=el.dataset.edition;render();});
  document.querySelectorAll("[data-candidate]").forEach(el=>el.onchange=()=>{el.checked?state.selectedCandidates.add(el.dataset.candidate):state.selectedCandidates.delete(el.dataset.candidate);});
  document.querySelectorAll("[data-source]").forEach(el=>el.onchange=async()=>{await saveDoc("sources",el.dataset.source,{active:el.checked});toast("소스 상태를 저장했습니다.");render();});
  $("#sourceForm")?.addEventListener("submit",async e=>{e.preventDefault();const id=crypto.randomUUID();await saveDoc("sources",id,{name:$("#sourceName").value,sourceType:$("#sourceType").value,trustLevel:"B",collectionMethod:$("#sourceMethod").value,active:true,lastStatus:"READY"});toast("소스를 추가했습니다.");render();});
  $("#accountForm")?.addEventListener("submit",changeAccount);
  document.querySelectorAll("[data-action]").forEach(el=>el.onclick=()=>handleAction(el.dataset.action));
}

async function changeAccount(event){
  event.preventDefault();
  try{
    if(!configured) throw new Error("파이어베이스 연결 환경에서만 계정을 변경할 수 있습니다.");
    const user=state.auth.currentUser; if(!user?.email) throw new Error("로그인 정보를 다시 확인하세요.");
    const currentPassword=$("#currentAccountPassword").value;
    const newEmail=$("#newAccountEmail").value.trim();
    const newPassword=$("#newAccountPassword").value;
    const confirmPassword=$("#confirmAccountPassword").value;
    if(!newEmail&&!newPassword) throw new Error("새 아이디 또는 새 비밀번호를 입력하세요.");
    if(newPassword&&newPassword.length<6) throw new Error("새 비밀번호는 6자 이상이어야 합니다.");
    if(newPassword!==confirmPassword) throw new Error("새 비밀번호 확인이 일치하지 않습니다.");
    const credential=state.api.EmailAuthProvider.credential(user.email,currentPassword);
    await state.api.reauthenticateWithCredential(user,credential);
    if(newEmail&&newEmail!==user.email) await state.api.updateEmail(user,newEmail);
    if(newPassword) await state.api.updatePassword(user,newPassword);
    await audit("account.credentials_updated","admins",user.uid);
    $("#accountLabel").textContent=user.email||newEmail;
    $("#email").value=user.email||newEmail;
    toast("운영자 계정 정보를 변경했습니다.");
    render();
  }catch(error){
    const messages={"auth/invalid-credential":"현재 비밀번호가 올바르지 않습니다.","auth/wrong-password":"현재 비밀번호가 올바르지 않습니다.","auth/email-already-in-use":"이미 사용 중인 아이디입니다.","auth/invalid-email":"새 아이디 이메일 형식을 확인하세요.","auth/weak-password":"새 비밀번호는 6자 이상이어야 합니다.","auth/requires-recent-login":"다시 로그인한 뒤 변경해 주세요."};
    toast(messages[error?.code]||error.message||"계정 정보를 변경하지 못했습니다.");
  }
}
async function handleAction(action){
  try{
    const edition=state.data.editions.find(x=>x.id===state.selectedEdition)||state.data.editions[0];
    if(action==="sync-previous-day"){ await syncPreviousDayData(); toast(`${demoData.editions[0].sourceDate} 이슈를 파이어베이스에 반영했습니다.`); }
    if(action==="pipeline"){ await runIssueAnalysis(); toast("이슈 영향도를 다시 계산해 큰 이슈부터 정렬했습니다."); }
    if(action==="create-draft"){ const ranked=rankedCandidates(); const pool=state.selectedCandidates.size?ranked.filter(x=>state.selectedCandidates.has(x.id)):ranked.slice(0,6); const items=pool.map((x,i)=>({order:i+1,category:x.category,title:x.title,summary:x.summary,sourceName:x.sourceName||"",sourceUrl:x.sourceUrl||"",factDate:x.factDate||"",sourceDate:x.sourceDate||"",isHot:i===0,selectionScore:x.analysisScore,selectionReason:x.analysisReason})); if(!items.length)throw new Error(`${expectedSourceDate()}에 발행되고 검증된 후보가 없습니다.`); const sourceDate=expectedSourceDate(); const publishDate=nextDate(sourceDate); const visibleAt=scheduledVisibleAt(sourceDate); const id=`daily-${publishDate}-${crypto.randomUUID().slice(0,5)}`; await saveDoc("editions",id,{type:"daily",publishDate,sourceDate,visibleAt,sourceWindowStart:`${sourceDate}T00:00:00+09:00`,sourceWindowEnd:`${sourceDate}T23:59:59+09:00`,version:1,status:"DRAFT",headline:`${Number(sourceDate.slice(5,7))}월 ${Number(sourceDate.slice(8,10))}일 가장 영향도가 큰 6가지 사실`,items,sourceCount:new Set(pool.flatMap(x=>x.sourceIds||[])).size,selectionModel:"일간 영향도 분석 v3",selectionFactors:"해당일 발행 확인·최신성 25%·영향도 30%·안전성 25%·검증도 20%"}); state.selectedEdition=id; state.view="editions"; toast(`${sourceDate} 이슈를 ${publishDate} 오전 5시 공개 초안으로 만들었습니다.`); }
    if(action==="save-edition"){ const visibleAt=`${$("#editionVisibleAt").value}:00+09:00`; await saveDoc("editions",edition.id,{headline:$("#editionHeadline").value,publishDate:$("#editionDate").value,visibleAt,reviewChecklist:[...document.querySelectorAll(".review-check")].map(x=>x.checked)}); toast("발행본을 저장했습니다."); }
    if(action==="schedule-edition"){ const checks=[...document.querySelectorAll(".review-check")]; if(checks.some(x=>!x.checked))throw new Error("12개 검수 항목을 모두 확인하세요."); const publishDate=$("#editionDate").value; const sourceDate=edition.sourceDate||previousDate(publishDate); if(previousDate(publishDate)!==sourceDate)throw new Error("발행일은 이슈 기준일의 다음 날이어야 합니다."); const visibleAt=`${publishDate}T05:00:00+09:00`; await saveDoc("editions",edition.id,{status:"PUBLISHED",publishDate,sourceDate,visibleAt,reviewedAt:now(),reviewChecklist:checks.map(()=>true)}); toast(`${publishDate} 오전 5시 공개로 예약했습니다.`); }
    if(action==="withdraw"){ await saveDoc("editions",edition.id,{status:"WITHDRAWN",withdrawnAt:now()}); toast("발행본을 철회했습니다."); }
    if(action==="save-settings"){ const cfg={adsEnabled:$("#adsEnabled").checked,maintenanceEnabled:$("#maintenanceEnabled").checked,maintenanceMessage:$("#maintenanceMessage").value,minimumVersion:$("#minimumVersion").value,interstitialMinSeconds:30,interstitialMaxPerSession:1,interstitialPlacement:"content_end_after_30s",bannerPlacement:"bottom_anchored"}; if(configured){const{doc,setDoc}=state.api;await setDoc(doc(state.db,"appConfig","android"),cfg,{merge:true});await audit("config.updated","appConfig","android");await loadFirebaseData();}else state.data.config=cfg;toast("서비스 설정을 저장했습니다."); }
    render();
  }catch(error){toast(error.message||"작업을 완료하지 못했습니다.");}
}

$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();try{await signIn($("#email").value,$("#password").value);}catch(error){toast(error.message||"로그인하지 못했습니다.");}});
$("#logoutButton").onclick=signOut;
$("#nav").onclick=e=>{const button=e.target.closest("[data-view]");if(!button)return;state.view=button.dataset.view;render();};
initializeFirebase().catch(error=>{setConnection(false,"파이어베이스 연결 오류");$("#modeBanner").textContent="서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";});
