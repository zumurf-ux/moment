export const demoData = {
  editions: [{
    id:"daily-2026-08-06-v1", type:"daily", publishDate:"2026-08-08", sourceDate:"2026-08-07", visibleAt:"2026-08-08T05:00:00+09:00", version:3, status:"PUBLISHED",
    headline:"8월 7일 핵심 이슈", reviewedAt:"2026-08-08T20:10:00+09:00", sourceCount:104,
    sourceWindowStart:"2026-08-07T00:00:00+09:00", sourceWindowEnd:"2026-08-07T23:59:59+09:00",
    selectionModel:"일간 영향도 분석 v2", selectionFactors:"전날 발행 확인·국민 영향도 30%·안전성 25%·최신성 25%·출처 검증도 20%",
    items:[
      {order:1,category:"날씨",title:"서울 노원구 자동기상관측장비 40.2도 기록",summary:"8월 7일 오후 3시 28분 서울 노원구 자동기상관측장비가 40.2도를 기록했습니다. 서울 관측 지점에서 40도를 넘은 것은 2018년 8월 1일 이후 처음입니다.",sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807098251530",factDate:"2026.08.07",sourceDate:"2026-08-07",isHot:true,selectionScore:99,selectionReason:"당일 최고기온 관측과 전국 생활 안전 영향"},
      {order:2,category:"재난",title:"안동·의성 4개 면 특별재난지역 선포",summary:"정부는 8월 7일 집중호우 피해가 발생한 경북 안동시와 의성군의 4개 면을 특별재난지역으로 선포했습니다.",sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807141600001",factDate:"2026.08.07",sourceDate:"2026-08-07",selectionScore:93,selectionReason:"집중호우 피해 복구와 주민 지원에 직접 영향"},
      {order:3,category:"경제",title:"한국·대만 상반기 수출, 각각 일본 추월",summary:"8월 7일 집계 보도에 따르면 상반기 수출은 한국 4,963억달러, 대만 4,166억달러로 두 나라 모두 처음으로 일본을 넘어섰습니다.",sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807117900073",factDate:"2026.08.07",sourceDate:"2026-08-07",selectionScore:89,selectionReason:"국가 수출 규모와 산업 전반의 영향"},
      {order:4,category:"생활경제",title:"전국 주유소 기름값 12주 연속 하락",summary:"8월 7일 보도된 주간 집계에서 전국 주유소 휘발유와 경유 평균 판매가격은 12주 연속 내렸지만 모두 리터당 1,800원대를 유지했습니다.",sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807134300003",factDate:"2026.08.07",sourceDate:"2026-08-07",selectionScore:84,selectionReason:"전국 가계 교통비에 직접 영향"},
      {order:5,category:"농업",title:"농협, 폭염·가뭄 피해에 3천억원 재해자금 지원",summary:"농협중앙회는 8월 7일 폭염과 가뭄 피해 농가를 위해 3천억원 규모의 긴급 재해자금을 지원한다고 밝혔습니다.",sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807142100030",factDate:"2026.08.07",sourceDate:"2026-08-07",selectionScore:82,selectionReason:"농가 피해 회복과 농산물 수급 영향"},
      {order:6,category:"노동",title:"카카오 노사, 3개월 만에 임금협약 타결",summary:"카카오 노사는 약 3개월간의 교섭 끝에 8월 7일 임금협약을 최종 타결했습니다.",sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807122851017",factDate:"2026.08.07",sourceDate:"2026-08-07",selectionScore:76,selectionReason:"대형 플랫폼 기업의 노사 합의 확정"}
    ]
  }],
  candidates:[
    {id:"heat-seoul-40",category:"날씨",title:"서울 노원구 자동기상관측장비 40.2도 기록",summary:"8월 7일 오후 3시 28분 서울 노원구 자동기상관측장비가 40.2도를 기록했습니다.",trustGrade:"A",sourceIds:["bigkinds","news"],sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807098251530",factDate:"2026.08.07",sourceDate:"2026-08-07",verified:true,analysisFactors:{freshness:100,impact:98,safety:100,verification:98},analysisReason:"당일 최고기온 관측과 전국 생활 안전 영향"},
    {id:"flood-disaster-areas",category:"재난",title:"안동·의성 4개 면 특별재난지역 선포",summary:"정부는 집중호우 피해가 발생한 경북 안동시와 의성군의 4개 면을 특별재난지역으로 선포했습니다.",trustGrade:"A",sourceIds:["bigkinds","news"],sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807141600001",factDate:"2026.08.07",sourceDate:"2026-08-07",verified:true,analysisFactors:{freshness:100,impact:92,safety:98,verification:96},analysisReason:"집중호우 피해 복구와 주민 지원에 직접 영향"},
    {id:"exports-korea-taiwan",category:"경제",title:"한국·대만 상반기 수출, 각각 일본 추월",summary:"상반기 수출은 한국 4,963억달러, 대만 4,166억달러로 두 나라 모두 처음으로 일본을 넘어섰습니다.",trustGrade:"A",sourceIds:["bigkinds","news"],sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807117900073",factDate:"2026.08.07",sourceDate:"2026-08-07",verified:true,analysisFactors:{freshness:100,impact:95,safety:58,verification:97},analysisReason:"국가 수출 규모와 산업 전반의 영향"},
    {id:"fuel-prices-12weeks",category:"생활경제",title:"전국 주유소 기름값 12주 연속 하락",summary:"전국 주유소 휘발유와 경유 평균 판매가격은 12주 연속 내렸지만 모두 리터당 1,800원대를 유지했습니다.",trustGrade:"A",sourceIds:["bigkinds","news"],sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807134300003",factDate:"2026.08.07",sourceDate:"2026-08-07",verified:true,analysisFactors:{freshness:100,impact:88,safety:45,verification:96},analysisReason:"전국 가계 교통비에 직접 영향"},
    {id:"nonghyup-disaster-fund",category:"농업",title:"농협, 폭염·가뭄 피해에 3천억원 재해자금 지원",summary:"농협중앙회는 폭염과 가뭄 피해 농가를 위해 3천억원 규모의 긴급 재해자금을 지원한다고 밝혔습니다.",trustGrade:"A",sourceIds:["bigkinds","news"],sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807142100030",factDate:"2026.08.07",sourceDate:"2026-08-07",verified:true,analysisFactors:{freshness:100,impact:84,safety:76,verification:94},analysisReason:"농가 피해 회복과 농산물 수급 영향"},
    {id:"kakao-wage-deal",category:"노동",title:"카카오 노사, 3개월 만에 임금협약 타결",summary:"카카오 노사는 약 3개월간의 교섭 끝에 임금협약을 최종 타결했습니다.",trustGrade:"A",sourceIds:["bigkinds","news"],sourceName:"연합뉴스",sourceUrl:"https://www.yna.co.kr/view/AKR20260807122851017",factDate:"2026.08.07",sourceDate:"2026-08-07",verified:true,analysisFactors:{freshness:100,impact:70,safety:40,verification:96},analysisReason:"대형 플랫폼 기업의 노사 합의 확정"}
  ],
  sources:[
    {id:"bigkinds",name:"빅카인즈 104개 언론사 통합DB",sourceType:"AGGREGATOR",trustLevel:"A",collectionMethod:"SEARCH",active:true,lastStatus:"SUCCESS"},
    {id:"weather",name:"기상청",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"API",active:true,lastStatus:"SUCCESS"},
    {id:"news",name:"국내 언론사 원문",sourceType:"NEWS",trustLevel:"A",collectionMethod:"SEARCH",active:true,lastStatus:"SUCCESS"}
  ],
  auditLogs:[{id:"log-1",action:"system.seeded",entityType:"system",actorEmail:"admin@jamsi.local",createdAt:new Date().toISOString()}],
  config:{adsEnabled:false,maintenanceEnabled:false,maintenanceMessage:"",minimumVersion:"1.0.0",dailySourceDate:"2026-08-07"}
};
