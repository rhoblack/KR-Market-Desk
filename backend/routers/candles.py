"""
GET /api/stocks/{code}/candles — 종목 OHLCV 캔들 데이터.

pykrx SQLite 캐시에서 지정 기간 캔들을 반환한다.
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query

from schemas.market import CandleResponse
from services.pykrx_cache import get_candles, PERIOD_DAYS

logger = logging.getLogger(__name__)
router = APIRouter()

_VALID_PERIODS = list(PERIOD_DAYS.keys())  # ["1d","1w","1m","3m","6m","1y"]


@router.get(
    "/stocks/{code}/candles",
    response_model=list[CandleResponse],
    summary="종목 캔들 데이터 조회",
    description=(
        "pykrx SQLite 캐시에서 OHLCV 캔들 데이터를 반환합니다. "
        "오늘 데이터가 없으면 자동으로 pykrx에서 최근 1년치를 수집합니다."
    ),
)
async def get_stock_candles(
    code: Annotated[str, Path(description="종목코드 (예: 005930)", min_length=6, max_length=6)],
    period: Annotated[str, Query(description="조회 기간 (1d/1w/1m/3m/6m/1y)")] = "3m",
) -> list[CandleResponse]:
    """종목코드와 기간에 해당하는 캔들 데이터를 반환한다."""
    if period not in _VALID_PERIODS:
        raise HTTPException(
            status_code=400,
            detail=f"유효하지 않은 period: '{period}'. 허용값: {_VALID_PERIODS}",
        )

    try:
        candles = get_candles(code, period)
    except Exception as exc:
        logger.error("캔들 조회 실패 [code=%s, period=%s]: %s", code, period, exc)
        raise HTTPException(status_code=500, detail=f"캔들 데이터 조회 중 오류 발생: {exc}") from exc

    if not candles:
        logger.warning("캔들 데이터 없음: code=%s, period=%s", code, period)
        # 데이터 없음은 404 대신 빈 배열 반환 (프론트엔드가 빈 배열을 처리하도록)
        return []

    return candles
