// Mock data for Korean stock dashboard
// Korean convention: RED = up, BLUE = down

const MOCK_INDICES = [
  {
    code: "KOSPI",
    name: "코스피",
    value: 2847.32,
    change: 18.46,
    changePct: 0.65,
    volume: "8.2조",
    high: 2851.04,
    low: 2828.87,
    spark: [2810, 2815, 2808, 2820, 2825, 2818, 2830, 2835, 2828, 2840, 2845, 2847]
  },
  {
    code: "KOSDAQ",
    name: "코스닥",
    value: 845.91,
    change: -4.23,
    changePct: -0.50,
    volume: "6.8조",
    high: 852.14,
    low: 843.77,
    spark: [855, 853, 850, 852, 848, 847, 846, 849, 847, 846, 844, 845]
  },
  {
    code: "KOSPI200",
    name: "코스피200",
    value: 384.21,
    change: 2.18,
    changePct: 0.57,
    volume: "—",
    high: 385.02,
    low: 381.94,
    spark: [378, 379, 378, 380, 381, 380, 382, 383, 382, 383, 384, 384]
  },
  {
    code: "KRW",
    name: "원/달러",
    value: 1382.40,
    change: -3.20,
    changePct: -0.23,
    volume: "—",
    high: 1387.10,
    low: 1380.50,
    spark: [1390, 1388, 1389, 1386, 1385, 1387, 1384, 1383, 1385, 1383, 1382, 1382]
  }
];

const MOCK_WATCHLIST = [
  { code: "005930", name: "삼성전자", sector: "반도체",   price: 78400,  change: 1200, changePct: 1.55,  volume: "12.4M", marketCap: "468조" },
  { code: "000660", name: "SK하이닉스", sector: "반도체",  price: 195500, change: 4500, changePct: 2.36, volume: "5.8M",  marketCap: "142조" },
  { code: "035420", name: "NAVER",     sector: "IT서비스",  price: 218000, change: -3500, changePct: -1.58, volume: "1.2M", marketCap: "35.8조" },
  { code: "035720", name: "카카오",     sector: "IT서비스",  price: 52400,  change: -800,  changePct: -1.50, volume: "3.4M", marketCap: "23.1조" },
  { code: "207940", name: "삼성바이오로직스", sector: "바이오", price: 892000, change: 12000, changePct: 1.36, volume: "0.1M",  marketCap: "63.4조" },
  { code: "005380", name: "현대차",     sector: "자동차",    price: 248500, change: 3500,  changePct: 1.43, volume: "0.9M",  marketCap: "52.6조" },
  { code: "051910", name: "LG화학",     sector: "화학",      price: 412000, change: -8000, changePct: -1.90, volume: "0.3M",  marketCap: "29.1조" },
  { code: "373220", name: "LG에너지솔루션", sector: "이차전지", price: 384500, change: 6500, changePct: 1.72, volume: "0.5M",  marketCap: "89.9조" }
];

const MOCK_MARKET_NEWS = [
  {
    id: 1,
    category: "시장",
    title: "코스피, 외국인 매수에 8거래일 연속 상승…2,847선 마감",
    source: "한국경제",
    time: "14:32",
    impact: "긍정",
    summary: "외국인이 7,200억원 순매수하며 코스피를 끌어올렸다. 반도체·바이오 업종이 상승을 주도했다."
  },
  {
    id: 2,
    category: "기업",
    title: "삼성전자, HBM4 양산 일정 6개월 앞당겨…엔비디아 공급 확대",
    source: "전자신문",
    time: "13:18",
    impact: "긍정",
    summary: "차세대 고대역폭메모리 양산이 당초 계획보다 빨라지며 AI 메모리 시장 주도권 확보 기대."
  },
  {
    id: 3,
    category: "정책",
    title: "한은, 5월 금통위서 기준금리 동결 가능성…환율 변수",
    source: "연합뉴스",
    time: "12:45",
    impact: "중립",
    summary: "물가 둔화에도 원/달러 환율 부담이 커지면서 인하 시점이 6월 이후로 미뤄질 것이라는 분석."
  },
  {
    id: 4,
    category: "글로벌",
    title: "美 4월 CPI 예상치 부합…나스닥 0.8% 상승 마감",
    source: "블룸버그",
    time: "08:12",
    impact: "긍정",
    summary: "근원 CPI가 전월 대비 0.3% 상승하며 시장 전망에 부합. 연내 금리 인하 기대 유지."
  },
  {
    id: 5,
    category: "기업",
    title: "현대차·기아 4월 美 판매 14.2% 증가…전기차 호조",
    source: "머니투데이",
    time: "10:24",
    impact: "긍정",
    summary: "아이오닉5·EV6 등 전기차 판매가 전년 대비 38% 늘어나며 분기 실적 호조 전망."
  },
  {
    id: 6,
    category: "시장",
    title: "코스닥, 바이오 차익실현에 사흘 연속 약세",
    source: "이데일리",
    time: "15:05",
    impact: "부정",
    summary: "최근 급등했던 바이오 종목 중심 매도세. 시총 상위주 평균 1.2% 하락."
  }
];

// Stock-specific news (keyed by code)
const MOCK_STOCK_NEWS = {
  "005930": [
    { title: "삼성전자, HBM4 양산 일정 6개월 앞당겨…엔비디아 공급 확대",  source: "전자신문",   time: "13:18", impact: "긍정" },
    { title: "갤럭시 S26 시리즈, 자체 AI 칩 탑재 검토",                    source: "조선비즈",   time: "11:02", impact: "긍정" },
    { title: "외국인, 삼성전자 9거래일 연속 순매수",                       source: "한국경제",   time: "09:48", impact: "긍정" },
    { title: "1분기 영업이익 컨센서스 상회…메모리 회복 본격화",            source: "매일경제",   time: "어제",   impact: "긍정" },
    { title: "파운드리 2나노 시범양산 돌입…TSMC 추격 본격화",              source: "디지털타임스", time: "어제", impact: "긍정" }
  ],
  "000660": [
    { title: "SK하이닉스, HBM3E 12단 양산 본격화…수요 폭증",             source: "전자신문",   time: "14:01", impact: "긍정" },
    { title: "엔비디아 차세대 GPU에 HBM4 단독 공급 협상 진행",            source: "블룸버그",   time: "10:33", impact: "긍정" },
    { title: "DDR5 가격 5월에도 추가 인상 전망",                          source: "한국경제",   time: "어제",   impact: "긍정" }
  ],
  "035420": [
    { title: "NAVER, AI 검색 '큐:' 정식 출시 임박",                      source: "ZDNet",      time: "13:55", impact: "중립" },
    { title: "1분기 광고 매출 부진…커머스는 두 자릿수 성장",              source: "이데일리",   time: "11:20", impact: "부정" },
    { title: "외국인 8거래일 연속 순매도",                                source: "한국경제",   time: "09:14", impact: "부정" }
  ],
  "035720": [
    { title: "카카오, 콘텐츠 자회사 분할 검토 보도",                      source: "조선비즈",   time: "14:22", impact: "부정" },
    { title: "1분기 톡비즈 매출 둔화…광고 시장 침체 영향",                source: "매일경제",   time: "12:10", impact: "부정" }
  ],
  "207940": [
    { title: "삼성바이오로직스, 5공장 가동 임박…매출 1조 추가",           source: "한국경제",   time: "13:40", impact: "긍정" },
    { title: "글로벌 빅파마와 신규 CMO 계약 체결",                        source: "머니투데이", time: "10:55", impact: "긍정" }
  ],
  "005380": [
    { title: "현대차·기아 4월 美 판매 14.2% 증가",                       source: "머니투데이", time: "10:24", impact: "긍정" },
    { title: "조지아 메타플랜트 6월 본격 가동",                          source: "조선비즈",   time: "어제",   impact: "긍정" }
  ],
  "051910": [
    { title: "LG화학, 양극재 北美 증설 일부 연기",                       source: "전자신문",   time: "13:11", impact: "부정" },
    { title: "GM과 LFP 양극재 공급 계약 연장 협상",                      source: "이데일리",   time: "어제",   impact: "중립" }
  ],
  "373220": [
    { title: "LG에너지솔루션, 美 IRA 보조금 1.2조 확보",                 source: "한국경제",   time: "14:50", impact: "긍정" },
    { title: "전고체 배터리 시제품 2027년 공개 계획",                    source: "디일렉",     time: "어제",   impact: "긍정" }
  ]
};

// Generate deterministic-ish candles by code
function generateCandles(code, base, n = 60) {
  let seed = 0;
  for (let i = 0; i < code.length; i++) seed += code.charCodeAt(i);
  function rng() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }
  const candles = [];
  let price = base * 0.92;
  for (let i = 0; i < n; i++) {
    const drift = (rng() - 0.47) * base * 0.022;
    const open = price;
    const close = Math.max(base * 0.7, open + drift);
    const range = Math.abs(close - open) + base * (0.005 + rng() * 0.015);
    const high = Math.max(open, close) + range * rng() * 0.6;
    const low  = Math.min(open, close) - range * rng() * 0.6;
    const volume = Math.round((rng() * 0.7 + 0.3) * 4_000_000);
    candles.push({ open, close, high, low, volume });
    price = close;
  }
  // Make last close match current price for consistency
  candles[candles.length - 1].close = base;
  return candles;
}

const MOCK_TECHNICAL = {
  "005930": {
    summary: "강한 매수",
    score: 78,
    signals: [
      { name: "이동평균선(20일)",  value: "76,820",  bias: "매수",   note: "현재가가 20일선 위에서 안정적으로 거래되고 있어 단기 상승 추세가 유효합니다." },
      { name: "이동평균선(60일)",  value: "73,180",  bias: "매수",   note: "중기 추세선을 상회하며 추세적 상승 국면에 진입한 모습입니다." },
      { name: "RSI(14)",         value: "62.4",    bias: "중립",   note: "과매수 구간(70) 진입 전이지만 모멘텀이 둔화될 수 있어 분할 매수가 안전합니다." },
      { name: "MACD",            value: "+412",    bias: "매수",   note: "시그널선을 상향 돌파한 골든크로스 상태로 매수 압력이 우세합니다." },
      { name: "볼린저밴드",       value: "상단 근접", bias: "주의",   note: "밴드 상단에 근접해 단기 조정 가능성이 있어 추격 매수는 자제하는 것이 좋습니다." },
      { name: "거래량",          value: "+38%",    bias: "매수",   note: "5일 평균 대비 거래량이 크게 증가하며 상승 추세에 신뢰도를 더하고 있습니다." }
    ],
    interpretation: "삼성전자는 HBM 모멘텀과 외국인 매수세에 힘입어 단기·중기 추세 모두 상승 방향입니다. 다만 볼린저밴드 상단에 근접한 상태이므로 단기 차익실현 매물이 나올 수 있습니다. 78,000원 부근에서 분할 매수, 76,500원 이탈 시 손절 라인으로 설정하는 전략을 권장합니다.",
    levels: { support: 76500, resistance: 81000 }
  },
  "000660": {
    summary: "매수",
    score: 84,
    signals: [
      { name: "이동평균선(20일)",  value: "189,200", bias: "매수", note: "20일선이 우상향하며 견고한 지지선 역할을 하고 있습니다." },
      { name: "이동평균선(60일)",  value: "175,400", bias: "매수", note: "60일선과 20일선이 정배열을 유지하며 강한 상승 추세입니다." },
      { name: "RSI(14)",         value: "71.8",    bias: "주의", note: "과매수 구간 진입. 단기 조정 가능성을 염두에 두어야 합니다." },
      { name: "MACD",            value: "+2,840",  bias: "매수", note: "상승 모멘텀이 강하지만 다이버전스 발생 여부를 모니터링해야 합니다." },
      { name: "볼린저밴드",       value: "상단 돌파", bias: "주의", note: "상단을 돌파한 상태로 단기 변동성 확대 구간입니다." },
      { name: "거래량",          value: "+52%",    bias: "매수", note: "거래량이 평균 대비 크게 증가해 상승 신뢰도가 높습니다." }
    ],
    interpretation: "SK하이닉스는 HBM 수요 폭증 모멘텀으로 강한 상승 추세를 보이고 있습니다. 다만 RSI가 과매수 구간에 진입했고 볼린저밴드 상단을 돌파한 상태라 단기 조정 가능성에 유의해야 합니다. 신규 진입보다는 보유 종목의 분할 익절을, 추가 매수는 188,000원 지지선 확인 후를 권합니다.",
    levels: { support: 188000, resistance: 205000 }
  },
  "035420": {
    summary: "약한 매도",
    score: 38,
    signals: [
      { name: "이동평균선(20일)",  value: "222,300", bias: "매도", note: "현재가가 20일선을 하향 이탈한 약세 흐름입니다." },
      { name: "이동평균선(60일)",  value: "228,150", bias: "매도", note: "20일선이 60일선을 하향 돌파하며 데드크로스 발생." },
      { name: "RSI(14)",         value: "38.2",    bias: "중립", note: "과매도 구간에 근접해 기술적 반등 가능성도 존재합니다." },
      { name: "MACD",            value: "-1,210",  bias: "매도", note: "음의 영역에서 시그널선 아래에 위치, 매도 신호 유효." },
      { name: "볼린저밴드",       value: "하단 근접", bias: "중립", note: "밴드 하단에 근접하며 단기 기술적 반등 가능 구간입니다." },
      { name: "거래량",          value: "-12%",    bias: "중립", note: "하락 시 거래량이 동반되지 않아 패닉 셀링은 아닙니다." }
    ],
    interpretation: "NAVER는 광고 매출 부진과 외국인 매도세가 지속되며 기술적 지표 대부분이 약세를 가리키고 있습니다. 다만 RSI가 과매도 영역에 근접하고 거래량 동반 하락이 아니어서 기술적 반등 가능성도 열려 있습니다. 215,000원 지지선 확인 전까지는 관망, 이탈 시 추가 하락에 대비할 필요가 있습니다.",
    levels: { support: 215000, resistance: 232000 }
  },
  "035720": {
    summary: "매도",
    score: 28,
    signals: [
      { name: "이동평균선(20일)",  value: "54,200",  bias: "매도", note: "20일선 아래에서 횡보 중으로 단기 추세 약세." },
      { name: "이동평균선(60일)",  value: "56,800",  bias: "매도", note: "중기 추세선 하회 상태로 추세 반전 신호 부재." },
      { name: "RSI(14)",         value: "34.5",    bias: "중립", note: "과매도 영역에 근접한 상태." },
      { name: "MACD",            value: "-380",    bias: "매도", note: "음의 영역에서 횡보 중으로 매도 신호 유효." },
      { name: "볼린저밴드",       value: "중단 부근", bias: "중립", note: "방향성 부재로 추격 매매 자제." },
      { name: "거래량",          value: "+24%",    bias: "주의", note: "하락 시 거래량이 증가해 추가 하락 압력 존재." }
    ],
    interpretation: "카카오는 자회사 분할 이슈와 톡비즈 매출 둔화 우려로 기술적 지표 대부분이 약세입니다. 하락 시 거래량 동반이 우려스러운 신호로, 52,000원 이탈 시 추가 하락 가능성이 있습니다. 단기 추세 반전 시그널 확인 전까지는 신규 매수를 미루는 것이 좋습니다.",
    levels: { support: 52000, resistance: 56000 }
  },
  "207940": {
    summary: "매수",
    score: 72,
    signals: [
      { name: "이동평균선(20일)",  value: "872,400", bias: "매수", note: "20일선 위에서 안정적 흐름." },
      { name: "이동평균선(60일)",  value: "845,200", bias: "매수", note: "정배열 유지." },
      { name: "RSI(14)",         value: "58.1",    bias: "중립", note: "건강한 상승 구간." },
      { name: "MACD",            value: "+4,210",  bias: "매수", note: "골든크로스 상태 유지." },
      { name: "볼린저밴드",       value: "중상단",   bias: "중립", note: "추가 상승 여력 존재." },
      { name: "거래량",          value: "+8%",     bias: "중립", note: "거래량은 평이한 수준." }
    ],
    interpretation: "삼성바이오로직스는 5공장 가동 모멘텀과 신규 CMO 계약 호재로 안정적 상승 흐름을 유지하고 있습니다. 정배열 유지와 함께 단기·중기 추세 모두 양호하며 거래량 부담이 크지 않아 추가 상승 여력이 있습니다. 880,000원 부근 지지 확인 후 분할 매수를 고려할 만합니다.",
    levels: { support: 880000, resistance: 920000 }
  },
  "005380": {
    summary: "매수",
    score: 68,
    signals: [
      { name: "이동평균선(20일)",  value: "242,800", bias: "매수", note: "20일선 우상향." },
      { name: "이동평균선(60일)",  value: "235,400", bias: "매수", note: "중기 추세 양호." },
      { name: "RSI(14)",         value: "61.2",    bias: "중립", note: "건강한 상승 구간." },
      { name: "MACD",            value: "+1,140",  bias: "매수", note: "골든크로스 유효." },
      { name: "볼린저밴드",       value: "중상단",   bias: "중립", note: "단기 추가 상승 여력." },
      { name: "거래량",          value: "+15%",    bias: "매수", note: "거래량 동반 상승." }
    ],
    interpretation: "현대차는 美 판매 호조와 메타플랜트 가동 임박으로 펀더멘털과 기술적 지표가 모두 우호적입니다. 단기·중기 추세가 견조하며 거래량을 동반한 상승이 진행 중이라 추세 추종 매매에 적합합니다. 246,000원 지지 확인 시 추가 매수를 고려할 만하며, 240,000원 이탈은 손절선으로 설정합니다.",
    levels: { support: 244000, resistance: 258000 }
  },
  "051910": {
    summary: "약한 매도",
    score: 35,
    signals: [
      { name: "이동평균선(20일)",  value: "418,200", bias: "매도", note: "20일선 하향 이탈." },
      { name: "이동평균선(60일)",  value: "425,800", bias: "매도", note: "중기 추세 약화." },
      { name: "RSI(14)",         value: "41.8",    bias: "중립", note: "추가 하락 여지." },
      { name: "MACD",            value: "-820",    bias: "매도", note: "음의 영역 진입." },
      { name: "볼린저밴드",       value: "중하단",   bias: "중립", note: "방향성 부재." },
      { name: "거래량",          value: "+18%",    bias: "주의", note: "하락 시 거래량 증가." }
    ],
    interpretation: "LG화학은 양극재 증설 연기 이슈와 중기 추세 약화로 기술적 지표가 부진합니다. 하락 시 거래량 동반이 우려 요인으로, 추세 반전 신호 확인 전까지는 관망이 적절합니다. 405,000원 이탈 시 추가 하락 가능성에 유의해야 합니다.",
    levels: { support: 405000, resistance: 428000 }
  },
  "373220": {
    summary: "매수",
    score: 74,
    signals: [
      { name: "이동평균선(20일)",  value: "375,800", bias: "매수", note: "20일선 우상향." },
      { name: "이동평균선(60일)",  value: "362,400", bias: "매수", note: "중기 추세 양호." },
      { name: "RSI(14)",         value: "64.5",    bias: "중립", note: "상승 여력 존재." },
      { name: "MACD",            value: "+3,210",  bias: "매수", note: "강한 상승 모멘텀." },
      { name: "볼린저밴드",       value: "중상단",   bias: "매수", note: "상승 추세 유효." },
      { name: "거래량",          value: "+22%",    bias: "매수", note: "거래량 동반 상승." }
    ],
    interpretation: "LG에너지솔루션은 IRA 보조금 확보와 전고체 배터리 로드맵 공개로 투자 심리가 개선되고 있습니다. 기술적 지표 대부분이 매수를 가리키며 거래량 동반 상승이 추세에 신뢰도를 더합니다. 380,000원 지지 확인 후 분할 매수, 375,000원은 손절 라인으로 설정합니다.",
    levels: { support: 378000, resistance: 398000 }
  }
};

// Pre-generate candles for each watchlist item
const MOCK_CANDLES = {};
MOCK_WATCHLIST.forEach(s => {
  MOCK_CANDLES[s.code] = generateCandles(s.code, s.price);
});

const MOCK_MOVERS = {
  gainers: [
    { code: "247540", name: "에코프로비엠",  price: 218500, changePct: 8.42 },
    { code: "000660", name: "SK하이닉스",   price: 195500, changePct: 2.36 },
    { code: "373220", name: "LG에너지솔루션", price: 384500, changePct: 1.72 },
    { code: "005930", name: "삼성전자",     price: 78400,  changePct: 1.55 },
    { code: "005380", name: "현대차",       price: 248500, changePct: 1.43 }
  ],
  losers: [
    { code: "068270", name: "셀트리온",      price: 178200, changePct: -3.45 },
    { code: "051910", name: "LG화학",       price: 412000, changePct: -1.90 },
    { code: "035420", name: "NAVER",        price: 218000, changePct: -1.58 },
    { code: "035720", name: "카카오",        price: 52400,  changePct: -1.50 },
    { code: "323410", name: "카카오뱅크",     price: 24850,  changePct: -1.20 }
  ]
};

window.MOCK = {
  indices: MOCK_INDICES,
  watchlist: MOCK_WATCHLIST,
  marketNews: MOCK_MARKET_NEWS,
  stockNews: MOCK_STOCK_NEWS,
  candles: MOCK_CANDLES,
  technical: MOCK_TECHNICAL,
  movers: MOCK_MOVERS
};
