"""
Pydantic 응답 스키마 — frontend/src/types/index.ts 와 1:1 대응.

TypeScript 타입 → Python 모델 매핑:
  Index           → IndexResponse
  Stock           → StockResponse
  Mover           → MoverResponse
  Movers          → MoversResponse
  NewsItem        → NewsItemResponse
  Candle          → CandleResponse
  TechnicalSignal → TechnicalSignalResponse
  TechnicalAnalysis → TechnicalAnalysisResponse
"""

from __future__ import annotations

from typing import Literal, Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Index  (GET /api/indices)
# ---------------------------------------------------------------------------

class IndexResponse(BaseModel):
    """코스피 / 코스닥 / 코스피200 / 원달러 지수 응답.

    TypeScript:
        interface Index {
          code: string; name: string; value: number; change: number;
          changePct: number; volume: string; high: number; low: number;
          spark: number[];
        }
    """

    code: str
    name: str
    value: float
    change: float
    changePct: float
    volume: str          # 포맷된 문자열 (예: "8.2조", "—")
    high: float
    low: float
    spark: list[float]   # 12개 틱 스파크라인 데이터


# ---------------------------------------------------------------------------
# Stock  (GET /api/stocks, GET /api/stocks/{code})
# ---------------------------------------------------------------------------

class StockResponse(BaseModel):
    """관심종목 현재가 응답.

    TypeScript:
        interface Stock {
          code: string; name: string; sector: string; price: number;
          change: number; changePct: number; volume: string; marketCap: string;
        }
    """

    code: str
    name: str
    sector: str
    price: float
    change: float
    changePct: float
    volume: str          # 포맷된 문자열 (예: "12.4M")
    marketCap: str       # 포맷된 문자열 (예: "468조")


# ---------------------------------------------------------------------------
# Mover  (GET /api/movers)
# ---------------------------------------------------------------------------

class MoverResponse(BaseModel):
    """등락 상위 단일 종목 응답.

    TypeScript:
        interface Mover {
          code: string; name: string; price: number; changePct: number;
        }
    """

    code: str
    name: str
    price: float
    changePct: float


class MoversResponse(BaseModel):
    """등락 상위/하위 통합 응답.

    TypeScript:
        interface Movers { gainers: Mover[]; losers: Mover[]; }
    """

    gainers: list[MoverResponse]
    losers: list[MoverResponse]


# ---------------------------------------------------------------------------
# NewsItem  (GET /api/news, GET /api/news/{code})
# ---------------------------------------------------------------------------

ImpactLiteral = Literal["긍정", "부정", "중립"]


class NewsItemResponse(BaseModel):
    """뉴스 아이템 응답.

    TypeScript:
        interface NewsItem {
          id?: number; category?: string; title: string; source: string;
          time: string; impact: '긍정' | '부정' | '중립';
          summary?: string; url?: string;
        }
    """

    id: Optional[int] = None
    category: Optional[str] = None
    title: str
    source: str
    time: str
    impact: ImpactLiteral
    summary: Optional[str] = None
    url: Optional[str] = None


# ---------------------------------------------------------------------------
# Candle  (GET /api/stocks/{code}/candles)
# ---------------------------------------------------------------------------

class CandleResponse(BaseModel):
    """OHLCV 캔들 응답.

    TypeScript:
        interface Candle {
          open: number; close: number; high: number; low: number;
          volume: number; time?: string;
        }
    """

    open: float
    close: float
    high: float
    low: float
    volume: int
    time: Optional[str] = None   # ISO date string (예: "2026-05-11")


# ---------------------------------------------------------------------------
# TechnicalAnalysis  (GET /api/stocks/{code}/technical)
# ---------------------------------------------------------------------------

BiasBiasLiteral = Literal[
    "매수", "매도", "중립", "주의", "강한 매수", "약한 매도", "강한 매도"
]


class TechnicalSignalResponse(BaseModel):
    """기술적 지표 개별 신호.

    TypeScript:
        interface TechnicalSignal {
          name: string; value: string;
          bias: '매수' | '매도' | '중립' | '주의' | '강한 매수' | '약한 매도' | '강한 매도';
          note: string;
        }
    """

    name: str
    value: str
    bias: BiasBiasLiteral
    note: str


class SupportResistanceLevels(BaseModel):
    support: float
    resistance: float


class TechnicalAnalysisResponse(BaseModel):
    """기술적 분석 종합 응답.

    TypeScript:
        interface TechnicalAnalysis {
          summary: string; score: number; signals: TechnicalSignal[];
          interpretation: string; levels: { support: number; resistance: number; }
        }
    """

    summary: str
    score: int
    signals: list[TechnicalSignalResponse]
    interpretation: str
    levels: SupportResistanceLevels
