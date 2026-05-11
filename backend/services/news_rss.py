"""
네이버 금융 뉴스 RSS 파서.

제공 함수:
    get_market_news(limit=20) -> List[dict]  — 시장 전체 뉴스
    get_stock_news(code, limit=10) -> List[dict]  — 종목별 뉴스

캐시: 메모리 dict {url: (timestamp, data)}, TTL 5분 (300초)

의존성: feedparser (feedparser>=6.0.0), httpx (이미 requirements.txt 에 있음)
"""

from __future__ import annotations

import hashlib
import logging
import time
from typing import Any

import feedparser  # type: ignore

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 상수
# ---------------------------------------------------------------------------

# 시장 전체 뉴스 RSS
_MARKET_RSS_URL = (
    "https://finance.naver.com/news/news_list.naver"
    "?mode=LSS2D&section_id=101&section_id2=258"
)

# 종목별 뉴스 RSS (네이버 증권 종목 뉴스 pstatic RSS 엔드포인트)
_STOCK_RSS_TEMPLATE = (
    "https://stock.pstatic.net/stock.nhn"
    "?service=news&targetPage=1&code={code}"
)

_CACHE_TTL = 300  # 5분

# {url: (fetched_at_epoch, parsed_entries)}
_cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}

# ---------------------------------------------------------------------------
# 영향도 추정 (제목 키워드 기반 단순 휴리스틱)
# ---------------------------------------------------------------------------

_POSITIVE_KEYWORDS = [
    "급등", "상승", "호재", "성장", "신고가", "돌파", "흑자", "증가",
    "선방", "수혜", "강세", "회복", "개선", "호실적", "매수", "긍정",
]
_NEGATIVE_KEYWORDS = [
    "급락", "하락", "악재", "부진", "신저가", "붕괴", "적자", "감소",
    "충격", "리스크", "약세", "침체", "악화", "매도", "부정", "하향",
]


def _infer_impact(title: str) -> str:
    """제목 키워드로 영향도(긍정/부정/중립)를 추정한다."""
    for kw in _POSITIVE_KEYWORDS:
        if kw in title:
            return "긍정"
    for kw in _NEGATIVE_KEYWORDS:
        if kw in title:
            return "부정"
    return "중립"


# ---------------------------------------------------------------------------
# 카테고리 추정
# ---------------------------------------------------------------------------

_CATEGORY_KEYWORDS: list[tuple[str, list[str]]] = [
    ("정책", ["금리", "기준금리", "연준", "Fed", "정부", "규제", "법안", "정책"]),
    ("글로벌", ["미국", "중국", "일본", "유럽", "달러", "환율", "글로벌", "해외"]),
    ("기업", ["실적", "영업이익", "매출", "분기", "상장", "공시", "M&A", "인수"]),
    ("시장", ["코스피", "코스닥", "지수", "시장", "거래대금", "수급"]),
]


def _infer_category(title: str) -> str:
    for category, keywords in _CATEGORY_KEYWORDS:
        for kw in keywords:
            if kw in title:
                return category
    return "시장"


# ---------------------------------------------------------------------------
# RSS 파싱 헬퍼
# ---------------------------------------------------------------------------

def _entry_to_dict(entry: Any, idx: int, url: str) -> dict[str, Any]:
    """feedparser Entry 객체를 NewsItemResponse 호환 dict 로 변환한다."""
    title: str = entry.get("title", "").strip()
    link: str = entry.get("link", "")
    source: str = ""

    # 출처: feedparser 에서 tags 또는 source 필드로 제공될 수 있음
    if hasattr(entry, "source") and entry.source:
        source = entry.source.get("title", "")

    # 출처가 없으면 링크 도메인에서 추출
    if not source and link:
        try:
            from urllib.parse import urlparse
            parsed = urlparse(link)
            source = parsed.netloc.replace("www.", "")
        except Exception:
            source = "네이버 금융"

    if not source:
        source = "네이버 금융"

    # 발행 시각 — feedparser 는 published_parsed (time.struct_time) 를 제공
    time_str = ""
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        try:
            t = entry.published_parsed
            time_str = f"{t.tm_year:04d}-{t.tm_mon:02d}-{t.tm_mday:02d} {t.tm_hour:02d}:{t.tm_min:02d}"
        except Exception:
            pass
    if not time_str:
        time_str = entry.get("published", "")[:16]

    # 요약
    summary = ""
    if hasattr(entry, "summary"):
        summary = entry.summary[:200] if entry.summary else ""

    # 안정적인 id 생성 (url+index 해시)
    raw_id = f"{url}:{idx}"
    numeric_id = int(hashlib.md5(raw_id.encode()).hexdigest()[:8], 16)

    return {
        "id": numeric_id,
        "title": title,
        "source": source,
        "time": time_str,
        "impact": _infer_impact(title),
        "category": _infer_category(title),
        "url": link,
        "summary": summary or None,
    }


def _fetch_rss(url: str) -> list[dict[str, Any]]:
    """feedparser 로 RSS URL 을 파싱하여 항목 목록을 반환한다.

    네트워크 오류 / 파싱 오류 발생 시 빈 리스트를 반환한다.
    feedparser 는 내부적으로 urllib 을 사용하므로 동기 함수다.
    """
    try:
        logger.info("RSS 파싱 시작: %s", url)
        feed = feedparser.parse(url)
        entries = feed.get("entries", [])
        result = [_entry_to_dict(e, i, url) for i, e in enumerate(entries)]
        logger.info("RSS 파싱 완료: %d건 수신", len(result))
        return result
    except Exception as exc:
        logger.error("RSS 파싱 오류 [%s]: %s", url, exc)
        return []


# ---------------------------------------------------------------------------
# 캐시 래퍼
# ---------------------------------------------------------------------------

def _get_cached(url: str) -> list[dict[str, Any]] | None:
    """캐시에서 유효한 데이터를 꺼낸다. 만료 또는 미존재 시 None."""
    entry = _cache.get(url)
    if entry is None:
        return None
    fetched_at, data = entry
    if time.time() - fetched_at > _CACHE_TTL:
        del _cache[url]
        return None
    return data


def _set_cache(url: str, data: list[dict[str, Any]]) -> None:
    _cache[url] = (time.time(), data)


# ---------------------------------------------------------------------------
# 공개 API
# ---------------------------------------------------------------------------

def get_market_news(limit: int = 20) -> list[dict[str, Any]]:
    """시장 전체 뉴스 목록을 반환한다.

    Args:
        limit: 반환할 최대 뉴스 건수 (기본값 20)

    Returns:
        NewsItemResponse 호환 dict 리스트
    """
    url = _MARKET_RSS_URL
    cached = _get_cached(url)
    if cached is not None:
        logger.debug("시장 뉴스 캐시 HIT")
        return cached[:limit]

    data = _fetch_rss(url)

    # RSS 가 비었거나 실패한 경우 대체 피드 시도
    if not data:
        fallback_url = (
            "https://finance.naver.com/news/news_list.naver"
            "?mode=LSS2D&section_id=101&section_id2=259"
        )
        data = _fetch_rss(fallback_url)

    _set_cache(url, data)
    return data[:limit]


def get_stock_news(code: str, limit: int = 10) -> list[dict[str, Any]]:
    """특정 종목의 뉴스 목록을 반환한다.

    Args:
        code: 종목코드 6자리 (예: "005930")
        limit: 반환할 최대 뉴스 건수 (기본값 10)

    Returns:
        NewsItemResponse 호환 dict 리스트
    """
    url = _STOCK_RSS_TEMPLATE.format(code=code)
    cached = _get_cached(url)
    if cached is not None:
        logger.debug("종목 뉴스 캐시 HIT [%s]", code)
        return cached[:limit]

    data = _fetch_rss(url)
    _set_cache(url, data)
    return data[:limit]
