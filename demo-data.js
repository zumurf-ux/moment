export const demoData = {
  editions: [{
    id:"daily-2026-08-06-v1", type:"daily", publishDate:"2026-08-08", version:2, status:"PUBLISHED",
    headline:"오늘 영향도가 가장 큰 6가지 사실", reviewedAt:"2026-08-08T19:10:00+09:00", sourceCount:8,
    selectionModel:"영향도 분석 v1", selectionFactors:"최신성 25%·영향도 30%·안전성 25%·검증도 20%",
    items:[
      {order:1,category:"날씨",title:"8월 전국 기온, 평년보다 높을 확률 50~70%",summary:"기상청 1개월 전망을 인용한 7월 28일 보도에 따르면 8월 3~30일 전국 평균·최저·최고기온이 평년보다 높을 확률은 50~70%입니다.",sourceName:"기상청 1개월 전망·뉴스핌",sourceUrl:"https://www.newspim.com/news/view/20260728000164",factDate:"2026.07.28 발표",isHot:true,selectionScore:97,selectionReason:"전국 생활 안전 영향과 8월 고온 전망"},
      {order:2,category:"에너지",title:"7~8월 원유, 전년 평균의 100% 이상 확보",summary:"산업통상부는 9월 도입 원유도 전년 대비 76%를 확보했으며, 호르무즈 해협을 통과한 한국행 유조선 6척이 국내에 순차 도착한다고 밝혔습니다.",sourceName:"연합뉴스·산업통상부",sourceUrl:"https://www.yna.co.kr/view/AKR20260714082000003",factDate:"2026.07.14 확인",selectionScore:86,selectionReason:"전국 에너지 수급과 생활물가 영향"},
      {order:3,category:"경제",title:"6월 소비자물가 3.2% 상승",summary:"재정경제부는 6월 소비자물가 상승률이 3.2%였고, 석유제품 최고가격제가 상승률을 0.4%포인트 낮춘 것으로 추정했습니다.",sourceName:"대한민국 정책브리핑",sourceUrl:"https://www.korea.kr/news/policyNewsView.do?newsId=148967512",factDate:"2026.07.02 발표",selectionScore:79,selectionReason:"전국 가계 지출에 직접 영향"},
      {order:4,category:"노동",title:"8월 20일부터 1~2주 단기 육아휴직 신설",summary:"자녀의 방학·휴원·휴교·질병처럼 단기간 돌봄이 필요할 때 연 1회, 1주 또는 2주 단위로 사용할 수 있습니다.",sourceName:"대한민국 정책브리핑",sourceUrl:"https://m.korea.kr/news/policyNewsView.do?newsId=148967360",factDate:"2026.08.20 시행",selectionScore:74,selectionReason:"시행일 임박과 돌봄 가구 영향"},
      {order:5,category:"문화",title:"8월 28일부터 모든 암표 부정거래 금지",summary:"매크로 사용 여부와 관계없이 공연·스포츠 경기 암표 거래가 금지되며, 판매금액의 50배 이하 과징금 근거가 적용됩니다.",sourceName:"대한민국 정책브리핑",sourceUrl:"https://m.korea.kr/news/policyNewsView.do?newsId=148967360",factDate:"2026.08.28 시행",selectionScore:71,selectionReason:"전국 소비자 거래 규칙 변경"},
      {order:6,category:"산업",title:"삼성전자 2분기 잠정 영업이익 89.4조원",summary:"삼성전자는 2026년 2분기 연결기준 잠정 매출 171조원, 영업이익 89.4조원을 발표했습니다.",sourceName:"삼성전자 뉴스룸",sourceUrl:"https://news.samsung.com/kr/%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90-2026%EB%85%84-2%EB%B6%84%EA%B8%B0-%EC%9E%A0%EC%A0%95%EC%8B%A4%EC%A0%81-%EB%B0%9C%ED%91%9C",factDate:"2026.07.07 발표",selectionScore:69,selectionReason:"대형 기업 실적과 산업 영향"}
    ]
  }],
  candidates:[
    {id:"weather-august",category:"날씨",title:"8월 전국 기온, 평년보다 높을 확률 50~70%",summary:"기상청 1개월 전망 기준 8월 3~30일 전국 평균·최저·최고기온이 평년보다 높을 확률은 50~70%입니다.",trustGrade:"A",sourceIds:["bigkinds","weather","newspim"],sourceName:"기상청 1개월 전망·뉴스핌",sourceUrl:"https://www.newspim.com/news/view/20260728000164",factDate:"2026.07.28 발표",analysisFactors:{freshness:96,impact:97,safety:100,verification:95},analysisReason:"전국 생활 안전 영향과 8월 고온 전망"},
    {id:"energy-oil",category:"에너지",title:"7~8월 원유, 전년 평균의 100% 이상 확보",summary:"산업통상부는 9월 도입 원유도 전년 대비 76%를 확보했다고 밝혔습니다.",trustGrade:"A",sourceIds:["bigkinds","news","policy"],sourceName:"연합뉴스·산업통상부",sourceUrl:"https://www.yna.co.kr/view/AKR20260714082000003",factDate:"2026.07.14 확인",analysisFactors:{freshness:80,impact:84,safety:88,verification:94},analysisReason:"전국 에너지 수급과 생활물가 영향"},
    {id:"prices-june",category:"경제",title:"6월 소비자물가 3.2% 상승",summary:"재정경제부는 석유제품 최고가격제가 상승률을 0.4%포인트 낮춘 것으로 추정했습니다.",trustGrade:"A",sourceIds:["bigkinds","policy"],sourceName:"대한민국 정책브리핑",sourceUrl:"https://www.korea.kr/news/policyNewsView.do?newsId=148967512",factDate:"2026.07.02 발표",analysisFactors:{freshness:76,impact:92,safety:50,verification:98},analysisReason:"전국 가계 지출에 직접 영향"},
    {id:"childcare-leave",category:"노동",title:"8월 20일부터 1~2주 단기 육아휴직 신설",summary:"단기간 돌봄이 필요할 때 연 1회, 1주 또는 2주 단위로 사용할 수 있습니다.",trustGrade:"A",sourceIds:["bigkinds","policy"],sourceName:"대한민국 정책브리핑",sourceUrl:"https://m.korea.kr/news/policyNewsView.do?newsId=148967360",factDate:"2026.08.20 시행",analysisFactors:{freshness:86,impact:82,safety:35,verification:95},analysisReason:"시행일 임박과 돌봄 가구 영향"},
    {id:"anti-scalping",category:"문화",title:"8월 28일부터 모든 암표 부정거래 금지",summary:"매크로 사용 여부와 관계없이 공연·스포츠 경기 암표 거래가 금지됩니다.",trustGrade:"A",sourceIds:["bigkinds","policy"],sourceName:"대한민국 정책브리핑",sourceUrl:"https://m.korea.kr/news/policyNewsView.do?newsId=148967360",factDate:"2026.08.28 시행",analysisFactors:{freshness:88,impact:70,safety:35,verification:95},analysisReason:"전국 소비자 거래 규칙 변경"},
    {id:"samsung-q2",category:"산업",title:"삼성전자 2분기 잠정 영업이익 89.4조원",summary:"2026년 2분기 연결기준 잠정 매출 171조원, 영업이익 89.4조원입니다.",trustGrade:"A",sourceIds:["bigkinds","samsung"],sourceName:"삼성전자 뉴스룸",sourceUrl:"https://news.samsung.com/kr/%EC%82%BC%EC%84%B1%EC%A0%84%EC%9E%90-2026%EB%85%84-2%EB%B6%84%EA%B8%B0-%EC%9E%A0%EC%A0%95%EC%8B%A4%EC%A0%81-%EB%B0%9C%ED%91%9C",factDate:"2026.07.07 발표",analysisFactors:{freshness:72,impact:88,safety:20,verification:99},analysisReason:"대형 기업 실적과 산업 영향"}
  ],
  sources:[
    {id:"bigkinds",name:"빅카인즈 104개 언론사 통합DB",sourceType:"AGGREGATOR",trustLevel:"A",collectionMethod:"SEARCH",active:true,lastStatus:"SUCCESS"},
    {id:"weather",name:"기상청",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"API",active:true,lastStatus:"SUCCESS"},
    {id:"newspim",name:"뉴스핌",sourceType:"NEWS",trustLevel:"A",collectionMethod:"SEARCH",active:true,lastStatus:"SUCCESS"},
    {id:"stats",name:"통계청",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"API",active:true,lastStatus:"SUCCESS"},
    {id:"policy",name:"정책브리핑",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"samsung",name:"삼성전자 뉴스룸",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"news",name:"국내 언론사 원문",sourceType:"NEWS",trustLevel:"A",collectionMethod:"SEARCH",active:true,lastStatus:"SUCCESS"}
  ],
  auditLogs:[{id:"log-1",action:"system.seeded",entityType:"system",actorEmail:"admin@jamsi.local",createdAt:new Date().toISOString()}],
  config:{adsEnabled:false,maintenanceEnabled:false,maintenanceMessage:"",minimumVersion:"1.0.0"}
};


