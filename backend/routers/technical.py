"""
GET /api/stocks/{code}/technical — 종목 기술적 분석.

pandas-ta로 MA/RSI/MACD/볼린저밴드/거래량 지표를 계산해 반환한다.
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Path

from schemas.market import TechnicalAnalysisResponse
from services.technical import get_technical

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/stocks/{code}/technical",
    response_model=TechnicalAnalysisResponse,
    summary="종목 기술적 분석 조회",
    description=(
        "pandas-ta를 사용하여 MA20/MA60, RSI(14), MACD(12,26,9), "
        "볼린저밴드(20,2), 거래량 지표를 계산하고 종합 매수/매도 판정을 반환합니다."
    ),
)
async def get_stock_technical(
    code: Annotated[str, Path(description="종목코드 (예: 005930)", min_length=6, max_length=6)],
) -> TechnicalAnalysisResponse:
    """종목코드에 대한 기술적 분석 결과를 반환한다."""
    try:
        result = get_technical(code)
    except Exception as exc:
        logger.error("기술적 분석 실패 [code=%s]: %s", code, exc)
        raise HTTPException(status_code=500, detail=f"기술적 분석 중 오류 발생: {exc}") from exc

    return TechnicalAnalysisResponse(**result)
