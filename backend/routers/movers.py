"""
GET /api/movers — 상승/하락 상위 종목 (gainers + losers 통합 응답).
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import APIRouter, Query, Request

from schemas.market import MoversResponse
from services.kis_client import KISClient

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/movers",
    response_model=MoversResponse,
    summary="등락 상위/하위 종목 통합 조회",
)
async def get_movers(
    request: Request,
    limit: int = Query(default=5, ge=1, le=50, description="반환 종목 수 (1–50)"),
) -> dict[str, Any]:
    """상승 상위와 하락 상위 종목을 동시에 조회하여 gainers/losers 구조로 반환한다.

    Args:
        limit: 상승/하락 각각의 반환 종목 수 (기본값 5)

    Returns:
        MoversResponse: { gainers: [...], losers: [...] }
    """
    client: KISClient = request.app.state.kis_client

    # 상승 / 하락 동시 조회
    gainers_raw, losers_raw = await asyncio.gather(
        client.get_movers(direction="up",   limit=limit),
        client.get_movers(direction="down", limit=limit),
        return_exceptions=True,
    )

    # 상승 목록 처리
    if isinstance(gainers_raw, Exception):
        logger.error("상승 종목 조회 실패: %s", gainers_raw)
        gainers: list[dict[str, Any]] = []
    else:
        gainers = [client.parse_mover(item) for item in gainers_raw[:limit]]

    # 하락 목록 처리
    if isinstance(losers_raw, Exception):
        logger.error("하락 종목 조회 실패: %s", losers_raw)
        losers: list[dict[str, Any]] = []
    else:
        losers = [client.parse_mover(item) for item in losers_raw[:limit]]

    return {"gainers": gainers, "losers": losers}
