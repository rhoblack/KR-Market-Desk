"""
pykrx SQLite 캐시 서비스.

- DB 경로: backend/data/stock_cache.db
- 테이블: candles (code, date, open, high, low, close, volume)
- 오늘 데이터가 없으면 pykrx로 최근 1년치 수집
- 수집된 raw 데이터를 CandleResponse 스키마에 맞게 변환
"""

from __future__ import annotations

import logging
import sqlite3
from datetime import date, timedelta
from pathlib import Path
from typing import Optional

import pandas as pd
from pykrx import stock as pykrx_stock

from schemas.market import CandleResponse

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# DB 경로
# ---------------------------------------------------------------------------

_DB_DIR = Path(__file__).parent.parent / "data"
_DB_PATH = _DB_DIR / "stock_cache.db"

# ---------------------------------------------------------------------------
# 기간 코드 → 거래일 수 매핑
# ---------------------------------------------------------------------------

PERIOD_DAYS: dict[str, int] = {
    "1d":  1,
    "1w":  7,
    "1m":  30,
    "3m":  90,
    "6m":  180,
    "1y":  365,
}


# ---------------------------------------------------------------------------
# DB 초기화
# ---------------------------------------------------------------------------

def _get_conn() -> sqlite3.Connection:
    """SQLite 연결 반환. DB 파일과 테이블이 없으면 자동 생성."""
    _DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(_DB_PATH))
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS candles (
            code    TEXT    NOT NULL,
            date    TEXT    NOT NULL,
            open    REAL    NOT NULL,
            high    REAL    NOT NULL,
            low     REAL    NOT NULL,
            close   REAL    NOT NULL,
            volume  INTEGER NOT NULL,
            PRIMARY KEY (code, date)
        )
        """
    )
    conn.commit()
    return conn


# ---------------------------------------------------------------------------
# pykrx 수집 & 저장
# ---------------------------------------------------------------------------

def _fetch_and_cache(code: str, from_date: str, to_date: str) -> pd.DataFrame:
    """pykrx로 OHLCV를 수집하고 SQLite에 저장한 뒤 DataFrame을 반환한다."""
    logger.info("pykrx 수집 시작: code=%s from=%s to=%s", code, from_date, to_date)

    df = pykrx_stock.get_market_ohlcv_by_date(from_date, to_date, code)
    if df is None or df.empty:
        logger.warning("pykrx 수집 결과 없음: code=%s", code)
        return pd.DataFrame()

    # 컬럼명 정규화 (한글 → 영문)
    rename_map = {
        "시가": "open",
        "고가": "high",
        "저가": "low",
        "종가": "close",
        "거래량": "volume",
    }
    df = df.rename(columns=rename_map)

    # 필요 컬럼만 추출
    needed = [c for c in ("open", "high", "low", "close", "volume") if c in df.columns]
    df = df[needed].copy()

    # 인덱스(날짜)를 date 컬럼으로
    df.index = pd.to_datetime(df.index)
    df["date"] = df.index.strftime("%Y-%m-%d")
    df["code"] = code

    # SQLite upsert
    conn = _get_conn()
    try:
        for row in df.itertuples(index=False):
            conn.execute(
                """
                INSERT OR REPLACE INTO candles (code, date, open, high, low, close, volume)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    row.code,
                    row.date,
                    float(row.open),
                    float(row.high),
                    float(row.low),
                    float(row.close),
                    int(row.volume),
                ),
            )
        conn.commit()
        logger.info("SQLite 저장 완료: code=%s, rows=%d", code, len(df))
    finally:
        conn.close()

    return df


# ---------------------------------------------------------------------------
# 캐시 히트 여부 확인
# ---------------------------------------------------------------------------

def _is_today_cached(code: str) -> bool:
    """오늘 날짜 데이터가 이미 캐시에 있으면 True."""
    today = date.today().strftime("%Y-%m-%d")
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT 1 FROM candles WHERE code = ? AND date = ? LIMIT 1",
            (code, today),
        ).fetchone()
        return row is not None
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# 캐시에서 읽기
# ---------------------------------------------------------------------------

def _read_from_cache(code: str, from_date: str, to_date: str) -> pd.DataFrame:
    """지정 기간의 캔들을 SQLite에서 읽어 DataFrame으로 반환."""
    conn = _get_conn()
    try:
        df = pd.read_sql_query(
            """
            SELECT date, open, high, low, close, volume
            FROM candles
            WHERE code = ? AND date BETWEEN ? AND ?
            ORDER BY date ASC
            """,
            conn,
            params=(code, from_date, to_date),
        )
        return df
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# 공개 API
# ---------------------------------------------------------------------------

def get_candles(code: str, period: str = "3m") -> list[CandleResponse]:
    """종목코드와 기간에 해당하는 캔들 데이터를 반환한다.

    - 오늘 데이터가 캐시에 없으면 최근 1년치를 pykrx로 수집
    - 이후 캐시에서 period에 맞는 범위를 잘라서 반환

    Args:
        code: 종목코드 (예: "005930")
        period: "1d" | "1w" | "1m" | "3m" | "6m" | "1y" (기본값 "3m")

    Returns:
        CandleResponse 리스트 (오름차순)
    """
    days = PERIOD_DAYS.get(period, PERIOD_DAYS["3m"])
    today = date.today()
    from_dt = today - timedelta(days=days + 30)  # 충분한 여유분 확보

    from_str = from_dt.strftime("%Y%m%d")
    to_str = today.strftime("%Y%m%d")

    # 오늘 캐시 미스 → pykrx 수집 (1년치)
    if not _is_today_cached(code):
        one_year_ago = (today - timedelta(days=365)).strftime("%Y%m%d")
        try:
            _fetch_and_cache(code, one_year_ago, to_str)
        except Exception as exc:
            logger.error("pykrx 수집 실패 [%s]: %s", code, exc)

    # 캐시에서 읽기
    from_read = from_dt.strftime("%Y-%m-%d")
    to_read = today.strftime("%Y-%m-%d")
    df = _read_from_cache(code, from_read, to_read)

    if df.empty:
        logger.warning("캔들 데이터 없음: code=%s, period=%s", code, period)
        return []

    # 실제 기간 필터 (여유분 제거)
    target_from = (today - timedelta(days=days)).strftime("%Y-%m-%d")
    df = df[df["date"] >= target_from]

    return [
        CandleResponse(
            time=row["date"],
            open=float(row["open"]),
            high=float(row["high"]),
            low=float(row["low"]),
            close=float(row["close"]),
            volume=int(row["volume"]),
        )
        for _, row in df.iterrows()
    ]
