export const demoData = {
  editions: [{ id:"daily-2026-08-06-v1", type:"daily", publishDate:"2026-08-06", version:1, status:"PUBLISHED", headline:"오늘, 이 정도만 알아두세요", reviewedAt:"2026-08-06T05:48:00+09:00", sourceCount:24, items:[
    {order:1,category:"경제",title:"환율 변동성이 다시 커졌습니다",summary:"수입 원가와 해외 결제 비용에 영향을 줄 수 있어 주요 지표를 함께 확인해야 합니다."},
    {order:2,category:"사회",title:"폭염 대응 단계가 확대됐습니다",summary:"낮 시간 야외 활동과 이동 계획에 안전 수칙을 우선 적용할 필요가 있습니다.",isHot:true},
    {order:3,category:"국제",title:"주요국 정책 일정이 이어집니다",summary:"이번 주 발표가 시장과 국내 정책 논의에 어떤 영향을 주는지 지켜볼 사안입니다."},
    {order:4,category:"정책",title:"생활과 가까운 제도 변경을 확인하세요",summary:"시행 시점과 적용 대상을 공식 안내에서 확인하면 변화를 미리 준비할 수 있습니다."},
    {order:5,category:"문화",title:"주말 도심 행사 일정이 시작됩니다",summary:"교통 통제 구간과 운영 시간을 확인하면 이동 계획을 세우기 수월합니다."},
    {order:6,category:"스포츠",title:"국제 대회 주요 대진이 확정됐습니다",summary:"대표팀의 첫 경기와 주요 대진을 중심으로 대회 일정의 큰 흐름을 정리했습니다."}
  ]}],
  candidates:[
    {id:"c1",category:"경제",title:"환율 변동성 확대",summary:"원화와 주요 통화 변동 폭이 확대됐습니다.",score:92,trustGrade:"A",sourceIds:["bok","stats"]},
    {id:"c2",category:"사회",title:"폭염 대응 단계 확대",summary:"관계 기관이 폭염 대응 단계를 조정했습니다.",score:88,trustGrade:"A",sourceIds:["weather","policy"]},
    {id:"c3",category:"정책",title:"생활 제도 변경",summary:"시행을 앞둔 생활 밀착형 제도를 확인합니다.",score:81,trustGrade:"B",sourceIds:["policy"]}
  ],
  sources:[
    {id:"stats",name:"통계청",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"API",active:true,lastStatus:"SUCCESS"},
    {id:"weather",name:"기상청",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"API",active:true,lastStatus:"SUCCESS"},
    {id:"policy",name:"정책브리핑",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"news",name:"뉴스 샘플",sourceType:"NEWS",trustLevel:"B",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"}
  ],
  auditLogs:[{id:"log-1",action:"system.seeded",entityType:"system",actorEmail:"admin@jamsi.local",createdAt:new Date().toISOString()}],
  config:{adsEnabled:false,maintenanceEnabled:false,maintenanceMessage:"",minimumVersion:"1.0.0"}
};
