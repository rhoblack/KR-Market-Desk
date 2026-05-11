export interface Index {
  code: string;
  name: string;
  value: number;
  change: number;
  changePct: number;
  volume: string;
  high: number;
  low: number;
  spark: number[];
}

export interface Stock {
  code: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePct: number;
  volume: string;
  marketCap: string;
}

export interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  time?: string;
}

export interface TechnicalSignal {
  name: string;
  value: string;
  bias: '매수' | '매도' | '중립' | '주의' | '강한 매수' | '약한 매도' | '강한 매도';
  note: string;
}

export interface TechnicalAnalysis {
  summary: string;
  score: number;
  signals: TechnicalSignal[];
  interpretation: string;
  levels: {
    support: number;
    resistance: number;
  };
}

export interface NewsItem {
  id?: number;
  category?: string;
  title: string;
  source: string;
  time: string;
  impact: '긍정' | '부정' | '중립';
  summary?: string;
  url?: string;
}

export interface Mover {
  code: string;
  name: string;
  price: number;
  changePct: number;
}

export interface Movers {
  gainers: Mover[];
  losers: Mover[];
}
