export const demoData = {
  editions: [{
    id:"daily-2026-08-22-official-v4", type:"daily", publishDate:"2026-08-22", sourceDate:"2026-08-21", visibleAt:"2026-08-22T05:00:00+09:00", version:4, status:"PUBLISHED",
    headline:"8월 21일 핵심 이슈", reviewedAt:"2026-08-22T04:55:00+09:00", sourceCount:4, privateMediaExcluded:true,
    sourceWindowStart:"2026-08-21T00:00:00+09:00", sourceWindowEnd:"2026-08-21T23:59:59+09:00",
    selectionModel:"공공정보 일간 영향도 분석 v4", selectionFactors:"국가·공공기관 공식 자료만 사용·민간 언론·포털 제외·원자료 표현 복제 차단",
    items:[
      {order:1,category:"경제·금융",title:"한국은행이 7월 생산자물가 잠정 통계를 공개했습니다",summary:"한국은행은 8월 21일 2026년 7월 생산자물가지수 잠정치를 공식 발표했습니다.",sourceName:"한국은행",sourceUrl:"",factDate:"2026.08.21",sourceDate:"2026-08-21",isHot:true,selectionScore:94,selectionReason:"국가 물가 통계 발표"},
      {order:2,category:"과학·기술",title:"국민 참여형 인공지능 사회문제 해결 공모가 시작됐습니다",summary:"과학기술정보통신부가 기후재난과 사회문제 해결을 위한 인공지능·디지털 서비스 공모를 발표했습니다.",sourceName:"과학기술정보통신부",sourceUrl:"",factDate:"2026.08.21",sourceDate:"2026-08-21",selectionScore:82,selectionReason:"공공 분야 디지털 서비스 개발"},
      {order:3,category:"문화·예술",title:"탄소중립 실천을 주제로 한 체험 행사가 마련됐습니다",summary:"문화체육관광부가 대중문화 콘텐츠를 활용한 탄소중립 체험 행사를 공식 안내했습니다.",sourceName:"문화체육관광부",sourceUrl:"",factDate:"2026.08.21",sourceDate:"2026-08-21",selectionScore:74,selectionReason:"국민 참여 문화 행사"},
      {order:4,category:"생활·안전",title:"호우 피해 지역이 특별재난지역으로 우선 선포됐습니다",summary:"정부는 8월 15일부터 18일까지 집중호우 피해를 입은 지역 가운데 조사가 끝난 곳을 특별재난지역으로 우선 선포했습니다.",sourceName:"행정안전부",sourceUrl:"",factDate:"2026.08.21",sourceDate:"2026-08-21",selectionScore:88,selectionReason:"재난 복구와 주민 지원에 직접 영향"}
    ]
  }],
  candidates:[
    {id:"bok-producer-price",category:"경제·금융",title:"한국은행이 7월 생산자물가 잠정 통계를 공개했습니다",summary:"한국은행은 8월 21일 2026년 7월 생산자물가지수 잠정치를 공식 발표했습니다.",trustGrade:"A",sourceIds:["bok"],sourceName:"한국은행",sourceUrl:"https://www.bok.or.kr/portal/bbs/B0000501/view.do?nttId=11063946&menuNo=200690",factDate:"2026.08.21",sourceDate:"2026-08-21",verified:true,analysisFactors:{freshness:100,impact:92,safety:45,verification:100},analysisReason:"국가 물가 통계 발표"},
    {id:"msit-public-ai",category:"과학·기술",title:"국민 참여형 인공지능 사회문제 해결 공모가 시작됐습니다",summary:"과학기술정보통신부가 기후재난과 사회문제 해결을 위한 인공지능·디지털 서비스 공모를 발표했습니다.",trustGrade:"A",sourceIds:["msit"],sourceName:"과학기술정보통신부",sourceUrl:"https://www.msit.go.kr/user/rss/rss.do?bbsSeqNo=94",factDate:"2026.08.21",sourceDate:"2026-08-21",verified:true,analysisFactors:{freshness:100,impact:80,safety:72,verification:100},analysisReason:"공공 분야 디지털 서비스 개발"},
    {id:"mcst-carbon-experience",category:"문화·예술",title:"탄소중립 실천을 주제로 한 체험 행사가 마련됐습니다",summary:"문화체육관광부가 대중문화 콘텐츠를 활용한 탄소중립 체험 행사를 공식 안내했습니다.",trustGrade:"A",sourceIds:["mcst"],sourceName:"문화체육관광부",sourceUrl:"https://www.mcst.go.kr/common/rss/press.jsp",factDate:"2026.08.21",sourceDate:"2026-08-21",verified:true,analysisFactors:{freshness:100,impact:65,safety:70,verification:100},analysisReason:"국민 참여 문화 행사"}
  ],
  sources:[
    {id:"mois",name:"행정안전부",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"bok",name:"한국은행",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"fsc",name:"금융위원회",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"msit",name:"과학기술정보통신부",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"mcst",name:"문화체육관광부",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"mohw",name:"보건복지부",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"mafra",name:"농림축산식품부",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"},
    {id:"kma",name:"기상청",sourceType:"OFFICIAL",trustLevel:"A",collectionMethod:"RSS",active:true,lastStatus:"SUCCESS"}
  ],
  auditLogs:[{id:"log-1",action:"system.seeded",entityType:"system",actorEmail:"admin@jamsi.local",createdAt:new Date().toISOString()}],
  config:{adsEnabled:false,maintenanceEnabled:false,maintenanceMessage:"",minimumVersion:"1.0.0",dailySourceDate:"2026-08-21"}
};
