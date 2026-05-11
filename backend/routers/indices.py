"""
GET /api/indices — 코스피 / 코스닥 / 코스피200 / 원달러 지수 현재가.

KIS API 지수 코드:
    KOSPI    → 0001
    KOSDAQ   → 1001
    KOSPI200 → 2001
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import APIRouter, Request

from schemas.market import IndexResponse
from services.kis_client import KISClient

logger = logging.getLogger(__name__)
router = APIRouter()

# 조회할 지수 목록: (프론트엔드 key, KIS 지수 코드)
_INDICES: list[tuple[str, str]] = [
    ("KOSPI",    "0001"),
    ("KOSDAQ",   "1001"),
    ("KOSPI200", "2001"),
]


@router.get("/indices", response_model=list[IndexResponse], summary="지수 현재가 목록")
async def get_indices(request: Request) -> list[dict[str, Any]]:
    """코스피 / 코스닥 / 코스피200 세 지수를 병렬로 조회하여 반환한다.

    원달러(KRW) 지수는 별도 TR(inquire-price-by-currency) 이 필요하므로
    현재 구현에서는 제외한다. 필요 시 라우터 확장 가능.
    """
    client: KISClient = request.app.state.kis_client

    # 세 지수를 동시에 호출 (asyncio.gather)
    results = await asyncio.gather(
        *[client.get_index_price(kis_code) for _, kis_code in _INDICES],
        return_exceptions=True,
    )

    responses: list[dict[str, Any]] = []
    for (index_key, _), result in zip(_INDICES, results):
        if isinstance(result, Exception):
            logger.error("지수 조회 실패 [%s]: %s", index_key, result)
            # 개별 지수 조회 실패 시 0값으로 채워 응답 (전체 실패 방지)
            responses.append(
                {
                    "code":      index_key,
                    "name":      index_key,
                    "value":     0.0,
                    "change":    0.0,
                    "changePct": 0.0,
                    "volume":    "—",
                    "high":      0.0,
                    "low":       0.0,
                    "spark":     [],
                }
            )
        else:
            responses.append(client.parse_index(index_key, result))

    return responses
