"""
GET /api/stocks         — 관심종목 현재가 목록 (codes 쿼리 파라미터)
GET /api/stocks/{code}  — 단일 종목 현재가 상세
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

from schemas.market import StockResponse
from services.kis_client import KISClient

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/stocks",
    response_model=list[StockResponse],
    summary="관심종목 현재가 목록",
)
async def get_stocks(
    request: Request,
    codes: str = Query(
        default="005930,000660,035420,035720,207940,005380,051910,373220",
        description="쉼표로 구분된 종목코드 (예: 005930,000660)",
    ),
) -> list[dict[str, Any]]:
    """지정한 종목코드 목록의 현재가를 병렬로 조회하여 반환한다.

    Args:
        codes: 쉼표 구분 종목코드 문자열. 최대 50개까지 권장.
    """
    client: KISClient = request.app.state.kis_client
    code_list = [c.strip() for c in codes.split(",") if c.strip()]

    if not code_list:
        raise HTTPException(status_code=400, detail="codes 파라미터가 비어 있습니다.")

    results = await asyncio.gather(
        *[client.get_stock_price(code) for code in code_list],
        return_exceptions=True,
    )

    responses: list[dict[str, Any]] = []
    for code, result in zip(code_list, results):
        if isinstance(result, Exception):
            logger.error("종목 조회 실패 [%s]: %s", code, result)
            # 개별 종목 실패 시 목록에서 제외 (None 필터링)
            continue
        responses.append(client.parse_stock(code, result))

    return responses


@router.get(
    "/stocks/{code}",
    response_model=StockResponse,
    summary="단일 종목 현재가 상세",
)
async def get_stock(
    request: Request,
    code: str,
) -> dict[str, Any]:
    """단일 종목의 현재가를 조회하여 반환한다.

    Args:
        code: 종목코드 6자리 (예: 005930)
    """
    # 종목코드 기본 검증 (6자리 숫자)
    if not code.isdigit() or len(code) != 6:
        raise HTTPException(
            status_code=400,
            detail=f"유효하지 않은 종목코드입니다: {code} (6자리 숫자여야 합니다)",
        )

    client: KISClient = request.app.state.kis_client
    raw = await client.get_stock_price(code)

    # KIS API는 존재하지 않는 코드도 빈 output 을 반환하는 경우가 있음
    if not raw or float(raw.get("stck_prpr", 0) or 0) == 0:
        raise HTTPException(
            status_code=404,
            detail=f"종목을 찾을 수 없습니다: {code}",
        )

    return client.parse_stock(code, raw)
