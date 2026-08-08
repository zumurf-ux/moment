export const demoData = {
  editions: [{ id:"daily-2026-08-06-v1", type:"daily", publishDate:"2026-08-08", version:1, status:"PUBLISHED", headline:"오늘 반드시 알아야 할 6가지 팩트", reviewedAt:"2026-08-08T17:40:00+09:00", sourceCount:5, items:[
    {order:1,category:"산업",title:"삼성전자 2분기 잠정 영업이익 89.4조원",summary:"삼성전자는 2026년 2분기 연결기준 잠정 매출 171조원, 영업이익 89.4조원을 발표했습니다.",sourceName:"삼성전자 뉴스룸",sourceUrl:"https://news.samsung.com/kr/%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90-2026%EB%85%84-2%EB%B6%84%EA%B8%B0-%EC%9E%A0%EC%A0%95%EC%8B%A4%EC%A0%81-%EB%B0%9C%ED%91%9C",factDate:"2026.07.07 발표"},
    {order:2,category:"경제",title:"6월 소비자물가 3.2% 상승",summary:"재정경제부는 6월 소비자물가 상승률이 3.2%였고, 석유제품 최고가격제가 상승률을 0.4%포인트 낮춘 것으로 추정했습니다.",sourceName:"대한민국 정책브리핑",sourceUrl:"https://www.korea.kr/news/policyNewsView.do?newsId=148967512",factDate:"2026.07.02 발표",isHot:true},
    {order:3,category:"에너지",title:"7~8월 원유, 전년 평균의 100% 이상 확보",summary:"산업통상부는 9월 도입 원유도 전년 대비 76%를 확보했으며, 호르무즈 해협을 통과한 한국행 유조선 6척이 국내에 순차 도착한다고 밝혔습니다.",sourceName:"연합뉴스·산업통상부",sourceUrl:"https://www.yna.co.kr/view/AKR20260714082000003",factDate:"2026.07.14 확인"},
    {order:4,category:"안전",title:"여름철 인명피해 우려지역 9,412곳 관리",summary:"행정안전부는 관리 대상을 지난해보다 448곳 늘렸고, 재해예방사업 투자를 1조8천억원에서 2조2천억원으로 확대했습니다.",sourceName:"행정안전부",sourceUrl:"https://www.mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=125943",factDate:"2026.05.12 발표"},
    {order:5,category:"노동",title:"8월 20일부터 1~2주 단기 육아휴직 신설",summary:"자녀의 방학·휴원·휴교·질병처럼 단기간 돌봄이 필요할 때 연 1회, 1주 또는 2주 단위로 사용할 수 있습니다.",sourceName:"대한민국 정책브리핑",sourceUrl:"https://m.korea.kr/news/policyNewsView.do?newsId=148967360",factDate:"2026.08.20 시행"},
    {order:6,category:"문화",title:"8월 28일부터 모든 암표 부정거래 금지",summary:"매크로 사용 여부와 관계없이 공연·스포츠 경기 암표 거래가 금지되며, 판매금액의 50배 이하 과징금 근거가 적용됩니다.",sourceName:"대한민국 정책브리핑",sourceUrl:"https://m.korea.kr/news/policyNewsView.do?newsId=148967360",factDate:"2026.08.28 시행"}
  ]}],
  candidates:[
    {id:"c1",category:"산업",title:"삼성전자 2분기 잠정 영업이익 89.4조원",summary:"2026년 2분기 연결기준 잠정 매출 171조원, 영업이익 89.4조원입니다.",score:96,trustGrade:"A",sourceIds:["bigkinds","samsung"],sourceName:"삼성전자 뉴스룸",sourceUrl:"https://news.samsung.com/kr/%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90-2026%EB%85%84-2%EB%B6%84%EA%B8%B0-%EC%9E%A0%EC%A0%95%EC%8B%A4%EC%A0%81-%EB%B0%9C%ED%91%9C",factDate:"2026.07.07 발표"},
    {id:"c2",category:"경제",title:"6월 소비자물가 3.2% 상승",summary:"재정경제부는 석유제품 최고가격제가 상승률을 0.4%포인트 낮춘 것으로 추정했습니다.",score:94,trustGrade:"A",sourceIds:["bigkinds","policy"],sourceName:"대한민국 정책브리핑",sourceUrl:"https://www.korea.kr/news/policyNewsView.do?newsId=148967512",factDate:"2026.07.02 발표"},
    {id:"c3",category:"안전",title:"여름철 인명피해 우려지역 9,412곳 관리",summary:"행정안전부는 관리 대상을 448곳 늘리고 재해예방사업 투자를 2조2천억원으로 확대했습니다.",score:92,trustGrade:"A",sourceIds:["bigkinds","mois"],sourceName:"행정안전부",sourceUrl:"https://www.mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=125943",factDate:"2026.05.12 발표"}
  ],
  sources:[
    {id:"bigkinds",name:"빅카인즈 104개 언론사 통합DB",sourceType:"AGGREGATOR",trustLevel:"A",collectionMethod:"SEARCH",active:true,lastStatus:"SUCCESS"},
    {id:"stats",name:"통계청",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"API",active:true,lastStatus:"SUCCESS"},
    {id:"weather",name:"기상청",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"API",active:true,lastStatus:"SUCCESS"},
    {id:"policy",name:"정책브리핑",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"samsung",name:"삼성전자 뉴스룸",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"mois",name:"행정안전부",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"news",name:"국내 언론사 원문",sourceType:"NEWS",trustLevel:"A",collectionMethod:"SEARCH",active:true,lastStatus:"READY"}
  ],
  auditLogs:[{id:"log-1",action:"system.seeded",entityType:"system",actorEmail:"admin@jamsi.local",createdAt:new Date().toISOString()}],
  config:{adsEnabled:false,maintenanceEnabled:false,maintenanceMessage:"",minimumVersion:"1.0.0"}
};
