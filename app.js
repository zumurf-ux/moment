import { firebaseConfig } from "./firebase-config.js?v=2";
import { demoData } from "./demo-data.js?v=2";

const sdk = "https://www.gstatic.com/firebasejs/12.16.0";
const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
const state = { view:"dashboard", user:null, db:null, auth:null, api:null, data:structuredClone(demoData), selectedEdition:null, selectedCandidates:new Set() };
const menus = [["dashboard","운영 현황"],["editions","발행본 편집"],["candidates","이슈 후보"],["sources","수집 소스"],["audit","감사 로그"],["settings","서비스 설정"]];
const $ = (q) => document.querySelector(q);
const esc = (value="") => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const now = () => new Date().toISOString();

function toast(message){ const el=$("#toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2300); }
function showApp(on){ $("#loginView").classList.toggle("hidden",on); $("#appView").classList.toggle("hidden",!on); }
function setConnection(ok,label){ $("#connectionText").textContent=label; $(".connection").classList.toggle("online",ok); $("#environmentLabel").textContent=configured?"Firebase":"Demo"; }

async function initializeFirebase(){
  if(!configured){ $("#modeBanner").innerHTML="현재 <strong>데모 모드</strong>입니다. 비밀번호는 <code>ChangeMe!2026</code>입니다."; setConnection(true,"데모 데이터 연결됨"); return; }
  $("#modeBanner").textContent="Firebase Authentication으로 보호됩니다.";
  const appSdk=await import(`${sdk}/firebase-app.js`); const authSdk=await import(`${sdk}/firebase-auth.js`); const fs=await import(`${sdk}/firebase-firestore.js`);
  const app=appSdk.initializeApp(firebaseConfig); state.auth=authSdk.getAuth(app); state.db=fs.getFirestore(app); state.api={...authSdk,...fs};
  authSdk.onAuthStateChanged(state.auth, async user=>{ if(user){state.user=user; await loadFirebaseData(); enterApp();} else {state.user=null; showApp(false);} });
  setConnection(true,"Firebase 연결됨");
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
function enterApp(){ $("#accountLabel").textContent=state.user?.email||"admin"; showApp(true); renderNav(); render(); }

async function saveDoc(collectionName,id,value){
  if(configured){ const {doc,setDoc}=state.api; await setDoc(doc(state.db,collectionName,id),{...value,updatedAt:now()},{merge:true}); await audit("document.updated",collectionName,id); await loadFirebaseData(); }
  else { const list=state.data[collectionName]; const i=list.findIndex(x=>x.id===id); if(i>=0) list[i]={...list[i],...value,updatedAt:now()}; else list.unshift({id,...value,createdAt:now()}); state.data.auditLogs.unshift({id:crypto.randomUUID(),action:"document.updated",entityType:collectionName,entityId:id,actorEmail:state.user.email,createdAt:now()}); }
}
async function audit(action,entityType,entityId){ if(!configured)return; const {collection,addDoc,serverTimestamp}=state.api; await addDoc(collection(state.db,"auditLogs"),{action,entityType,entityId,actorUid:state.user.uid,actorEmail:state.user.email,createdAt:serverTimestamp()}); }

function renderNav(){ $("#nav").innerHTML=menus.map(([id,label])=>`<button class="nav-button ${state.view===id?'active':''}" data-view="${id}">${label}</button>`).join(""); }
function head(title,desc,actions=""){ return `<header class="page-head"><div><p class="eyebrow">MOMENT OPERATIONS</p><h1>${title}</h1><p class="muted">${desc}</p></div><div class="actions">${actions}</div></header>`; }
function badge(status){ const cls=/REJECT|WITHDRAW|ERROR/.test(status)?"danger":/REVIEW|SCHEDULE|PENDING/.test(status)?"warn":""; return `<span class="badge ${cls}">${esc(status)}</span>`; }
function formatDate(v){ if(!v)return"-"; const d=v?.toDate?v.toDate():new Date(v); return Number.isNaN(d.getTime())?esc(v):d.toLocaleString("ko-KR"); }

function dashboard(){ const d=state.data; return head("운영 현황","Firebase 실시간 운영 데이터",`<button class="primary" data-action="pipeline">수집·분석 갱신</button>`)+`<section class="grid metrics"><div class="metric"><span>공개 발행본</span><strong>${d.editions.filter(x=>x.status==="PUBLISHED").length}</strong></div><div class="metric"><span>검수 대기</span><strong>${d.editions.filter(x=>x.status==="IN_REVIEW").length}</strong></div><div class="metric"><span>후보 클러스터</span><strong>${d.candidates.length}</strong></div><div class="metric"><span>활성 소스</span><strong>${d.sources.filter(x=>x.active).length}</strong></div></section><section class="grid two-col"><article class="card"><h2>오늘 운영 상태</h2><div class="status-list"><div class="status-row"><span>최신 공개일</span><strong>${esc(d.editions.find(x=>x.status==="PUBLISHED")?.publishDate||"-")}</strong></div><div class="status-row"><span>수집 오류</span><strong>${d.sources.filter(x=>x.lastStatus==="ERROR").length}건</strong></div><div class="status-row"><span>백엔드</span><strong>${configured?"Firebase":"Demo"}</strong></div></div></article><article class="card"><h2>최근 활동</h2>${d.auditLogs.slice(0,6).map(x=>`<div class="status-row"><span>${esc(x.action)}</span><small>${formatDate(x.createdAt)}</small></div>`).join("")||'<p class="empty">기록 없음</p>'}</article></section>`; }
function editions(){ const current=state.data.editions.find(x=>x.id===state.selectedEdition)||state.data.editions[0]; if(!current)return head("발행본 편집","후보를 선택해 첫 발행본을 만드세요.")+`<div class="empty">발행본이 없습니다.</div>`; const checks=["복수 출처","공식 사실 확인","과거 사건 확인","사실·주장 분리","중립 표현","투자 조언 금지","선정성 없음","제목 길이","전체 길이","출처 링크 확인","모바일 미리보기"]; return head("발행본 편집","필수 검수 후 승인·발행합니다.",`<button class="secondary" data-action="save-edition">저장</button><button class="primary" data-action="approve">승인</button><button class="danger" data-action="withdraw">철회</button>`)+`<section class="split"><div class="list">${state.data.editions.map(x=>`<button class="list-button ${x.id===current.id?'active':''}" data-edition="${x.id}"><strong>${esc(x.publishDate)} · ${esc(x.type)}</strong><span>v${x.version} · ${esc(x.status)}</span></button>`).join("")}</div><div class="grid"><article class="card"><div class="form-grid"><label>제목<input id="editionHeadline" value="${esc(current.headline)}"></label><label>발행일<input id="editionDate" type="date" value="${esc(current.publishDate)}"></label><label>상태<select id="editionStatus">${["DRAFT","IN_REVIEW","APPROVED","SCHEDULED","PUBLISHED","WITHDRAWN"].map(x=>`<option ${x===current.status?'selected':''}>${x}</option>`).join("")}</select></label><label>버전<input value="${current.version}" disabled></label></div></article><article class="card"><h2>이슈 ${current.items?.length||0}개</h2>${(current.items||[]).map((x,i)=>`<div class="candidate"><span>${String(i+1).padStart(2,"0")}</span><div><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p></div><span class="badge">${esc(x.category)}</span></div>`).join("")}</article><article class="card"><h2>필수 검수 11개</h2><div class="checklist">${checks.map((x,i)=>`<label class="check"><input type="checkbox" class="review-check" ${current.reviewChecklist?.[i]?'checked':''}>${x}</label>`).join("")}</div></article></div></section>`; }
function candidates(){ return head("이슈 후보","활성 소스에서 생성된 편집 후보입니다.",`<button class="secondary" data-action="pipeline">후보 갱신</button><button class="primary" data-action="create-draft">선택 후보로 초안 생성</button>`)+`<article class="card">${state.data.candidates.map(x=>`<div class="candidate"><input type="checkbox" data-candidate="${x.id}" ${state.selectedCandidates.has(x.id)?'checked':''}><div><h3>${esc(x.title)}</h3><p>${esc(x.summary)} · 출처 ${(x.sourceIds||[]).length}개</p></div><span class="badge">${esc(x.trustGrade||"B")} · ${x.score||0}</span></div>`).join("")||'<p class="empty">후보가 없습니다.</p>'}</article>`; }
function sources(){ return head("수집 소스","공식·뉴스·트렌드 소스를 관리합니다.")+`<article class="card"><form id="sourceForm" class="source-form"><input id="sourceName" placeholder="소스 이름" required><select id="sourceType"><option>OFFICIAL</option><option>NEWS</option><option>TREND</option></select><select id="sourceMethod"><option>API</option><option>RSS</option><option>MANUAL</option></select><button class="primary">추가</button></form><div class="table-wrap"><table><thead><tr><th>이름</th><th>유형</th><th>신뢰</th><th>수집</th><th>상태</th><th>활성</th></tr></thead><tbody>${state.data.sources.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.sourceType)}</td><td>${esc(x.trustLevel)}</td><td>${esc(x.collectionMethod)}</td><td>${badge(x.lastStatus||"READY")}</td><td><label class="toggle"><input type="checkbox" data-source="${x.id}" ${x.active?'checked':''}>사용</label></td></tr>`).join("")}</tbody></table></div></article>`; }
function auditView(){ return head("감사 로그","로그인과 주요 변경 기록입니다.")+`<div class="table-wrap"><table><thead><tr><th>시각</th><th>작업</th><th>대상</th><th>운영자</th></tr></thead><tbody>${state.data.auditLogs.map(x=>`<tr><td>${formatDate(x.createdAt)}</td><td class="code">${esc(x.action)}</td><td>${esc(x.entityType)} ${esc(x.entityId||"")}</td><td>${esc(x.actorEmail||x.actorUid||"system")}</td></tr>`).join("")}</tbody></table></div>`; }
function settings(){ const x=state.data.config; return head("서비스 설정","Android 앱 원격 설정을 관리합니다.",`<button class="primary" data-action="save-settings">설정 저장</button>`)+`<article class="card"><div class="form-grid"><label class="check"><input id="adsEnabled" type="checkbox" ${x.adsEnabled?'checked':''}>광고 활성</label><label class="check"><input id="maintenanceEnabled" type="checkbox" ${x.maintenanceEnabled?'checked':''}>점검 모드</label><label class="full">점검 안내<textarea id="maintenanceMessage">${esc(x.maintenanceMessage||"")}</textarea></label><label>최소 앱 버전<input id="minimumVersion" value="${esc(x.minimumVersion||"1.0.0")}"></label></div></article>`; }
function render(){ renderNav(); const views={dashboard,editions,candidates,sources,audit:auditView,settings}; $("#content").innerHTML=views[state.view](); bindContent(); $("#content").focus(); }

function bindContent(){
  document.querySelectorAll("[data-edition]").forEach(el=>el.onclick=()=>{state.selectedEdition=el.dataset.edition;render();});
  document.querySelectorAll("[data-candidate]").forEach(el=>el.onchange=()=>{el.checked?state.selectedCandidates.add(el.dataset.candidate):state.selectedCandidates.delete(el.dataset.candidate);});
  document.querySelectorAll("[data-source]").forEach(el=>el.onchange=async()=>{await saveDoc("sources",el.dataset.source,{active:el.checked});toast("소스 상태를 저장했습니다.");render();});
  $("#sourceForm")?.addEventListener("submit",async e=>{e.preventDefault();const id=crypto.randomUUID();await saveDoc("sources",id,{name:$("#sourceName").value,sourceType:$("#sourceType").value,trustLevel:"B",collectionMethod:$("#sourceMethod").value,active:true,lastStatus:"READY"});toast("소스를 추가했습니다.");render();});
  document.querySelectorAll("[data-action]").forEach(el=>el.onclick=()=>handleAction(el.dataset.action));
}
async function handleAction(action){
  try{
    const edition=state.data.editions.find(x=>x.id===state.selectedEdition)||state.data.editions[0];
    if(action==="pipeline"){ const id=crypto.randomUUID(); await saveDoc("candidates",id,{category:"사회",title:"새 수집 후보",summary:"활성 소스에서 새 후보를 생성했습니다.",score:76,trustGrade:"B",sourceIds:state.data.sources.filter(x=>x.active).slice(0,2).map(x=>x.id)}); toast("수집·분석을 갱신했습니다."); }
    if(action==="create-draft"){ const items=state.data.candidates.filter(x=>state.selectedCandidates.has(x.id)).map((x,i)=>({order:i+1,category:x.category,title:x.title,summary:x.summary})); if(!items.length)throw new Error("후보를 하나 이상 선택하세요."); const id=`daily-${new Date().toISOString().slice(0,10)}-${crypto.randomUUID().slice(0,5)}`; await saveDoc("editions",id,{type:"daily",publishDate:new Date().toISOString().slice(0,10),version:1,status:"DRAFT",headline:"오늘, 이 정도만 알아두세요",items,sourceCount:items.length*2}); state.selectedEdition=id; state.view="editions"; toast("초안을 만들었습니다."); }
    if(action==="save-edition"){ await saveDoc("editions",edition.id,{headline:$("#editionHeadline").value,publishDate:$("#editionDate").value,status:$("#editionStatus").value,reviewChecklist:[...document.querySelectorAll(".review-check")].map(x=>x.checked)}); toast("발행본을 저장했습니다."); }
    if(action==="approve"){ const checks=[...document.querySelectorAll(".review-check")]; if(checks.some(x=>!x.checked))throw new Error("11개 검수 항목을 모두 확인하세요."); await saveDoc("editions",edition.id,{status:"APPROVED",reviewedAt:now(),reviewChecklist:checks.map(()=>true)}); toast("승인했습니다."); }
    if(action==="withdraw"){ await saveDoc("editions",edition.id,{status:"WITHDRAWN",withdrawnAt:now()}); toast("발행본을 철회했습니다."); }
    if(action==="save-settings"){ const cfg={adsEnabled:$("#adsEnabled").checked,maintenanceEnabled:$("#maintenanceEnabled").checked,maintenanceMessage:$("#maintenanceMessage").value,minimumVersion:$("#minimumVersion").value}; if(configured){const{doc,setDoc}=state.api;await setDoc(doc(state.db,"appConfig","android"),cfg,{merge:true});await audit("config.updated","appConfig","android");await loadFirebaseData();}else state.data.config=cfg;toast("서비스 설정을 저장했습니다."); }
    render();
  }catch(error){toast(error.message||"작업을 완료하지 못했습니다.");}
}

$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();try{await signIn($("#email").value,$("#password").value);}catch(error){toast(error.message||"로그인하지 못했습니다.");}});
$("#logoutButton").onclick=signOut;
$("#nav").onclick=e=>{const button=e.target.closest("[data-view]");if(!button)return;state.view=button.dataset.view;render();};
initializeFirebase().catch(error=>{setConnection(false,"Firebase 연결 오류");$("#modeBanner").textContent=error.message;});
