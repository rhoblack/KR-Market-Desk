"""
뉴스 API 라우터.

엔드포인트:
    GET /api/news              — 시장 전체 뉴스 (limit 쿼리 파라미터)
    GET /api/news/{code}       — 종목별 뉴스
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Query

from schemas.market import NewsItemResponse
from services.news_rss import get_market_news, get_stock_news

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/news",
    response_model=list[NewsItemResponse],
    summary="시장 전체 뉴스",
    description="네이버 금융 RSS 에서 수집한 시장 뉴스를 반환합니다. 5분 캐시 적용.",
)
async def market_news(
    limit: int = Query(default=20, ge=1, le=100, description="반환할 최대 뉴스 건수"),
) -> list[dict[str, Any]]:
    """시장 전체 뉴스 목록을 반환한다."""
    items = get_market_news(limit=limit)
    return items


@router.get(
    "/news/{code}",
    response_model=list[NewsItemResponse],
    summary="종목별 뉴스",
    description="특정 종목(6자리 코드) 의 네이버 금융 뉴스를 반환합니다. 5분 캐시 적용.",
)
async def stock_news(
    code: str,
    limit: int = Query(default=10, ge=1, le=50, description="반환할 최대 뉴스 건수"),
) -> list[dict[str, Any]]:
    """특정 종목의 뉴스 목록을 반환한다.

    Args:
        code: 종목코드 6자리 (예: "005930")
        limit: 반환할 최대 뉴스 건수
    """
    items = get_stock_news(code=code, limit=limit)
    return items
