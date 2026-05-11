"""
pandas-ta 기술적 지표 계산 서비스.

- 지표: MA20, MA60, RSI(14), MACD(12,26,9), 볼린저밴드(20,2), 거래량
- get_technical(code) 함수: TechnicalAnalysisResponse 호환 dict 반환
- pykrx_cache에서 1년치 캔들 데이터를 가져와 계산
"""

from __future__ import annotations

import logging
import math
from datetime import date, timedelta
from typing import Any

import pandas as pd

# pandas-ta 임포트 (설치 전 예외 처리)
try:
    import pandas_ta as ta  # type: ignore
    _TA_AVAILABLE = True
except ImportError:
    _TA_AVAILABLE = False

from services.pykrx_cache import _read_from_cache, _is_today_cached, _fetch_and_cache

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 헬퍼: NaN/Inf 안전 변환
# ---------------------------------------------------------------------------

def _safe_float(val: Any, default: float = 0.0) -> float:
    """NaN 또는 Inf 가 아닌 float을 반환, 그 외에는 default."""
    try:
        v = float(val)
        if math.isnan(v) or math.isinf(v):
            return default
        return v
    except (TypeError, ValueError):
        return default


def _fmt(val: Any, digits: int = 2) -> str:
    """float → 포맷 문자열 (예: 78400.0 → "78,400.00")."""
    v = _safe_float(val)
    if digits == 0:
        return f"{v:,.0f}"
    return f"{v:,.{digits}f}"


# ---------------------------------------------------------------------------
# 데이터 준비
# ---------------------------------------------------------------------------

def _load_df(code: str) -> pd.DataFrame:
    """SQLite 캐시에서 최근 1년치 OHLCV DataFrame을 로드.

    캐시 미스 시 pykrx로 수집 후 재조회.
    """
    today = date.today()
    one_year_ago = today - timedelta(days=365)

    from_str = one_year_ago.strftime("%Y-%m-%d")
    to_str = today.strftime("%Y-%m-%d")

    if not _is_today_cached(code):
        try:
            _fetch_and_cache(
                code,
                one_year_ago.strftime("%Y%m%d"),
                today.strftime("%Y%m%d"),
            )
        except Exception as exc:
            logger.error("pykrx 수집 실패 [%s]: %s", code, exc)

    df = _read_from_cache(code, from_str, to_str)
    if not df.empty:
        df = df.sort_values("date").reset_index(drop=True)
        df["close"] = df["close"].astype(float)
        df["open"] = df["open"].astype(float)
        df["high"] = df["high"].astype(float)
        df["low"] = df["low"].astype(float)
        df["volume"] = df["volume"].astype(float)
    return df


# ---------------------------------------------------------------------------
# 지표별 신호 계산
# ---------------------------------------------------------------------------

def _ma_signal(df: pd.DataFrame) -> dict[str, Any]:
    """MA20 / MA60 크로스 신호."""
    close = df["close"]
    ma20 = close.rolling(20).mean()
    ma60 = close.rolling(60).mean()

    latest_close = _safe_float(close.iloc[-1])
    latest_ma20 = _safe_float(ma20.iloc[-1])
    latest_ma60 = _safe_float(ma60.iloc[-1])

    if latest_ma20 == 0:
        bias = "중립"
        note = "MA20 계산 불가 (데이터 부족)"
    elif latest_close > latest_ma20 > latest_ma60:
        bias = "강한 매수"
        note = f"주가가 MA20({_fmt(latest_ma20, 0)})·MA60({_fmt(latest_ma60, 0)}) 위에 위치 — 강한 상승 추세"
    elif latest_close > latest_ma20:
        bias = "매수"
        note = f"주가가 MA20({_fmt(latest_ma20, 0)}) 위에 위치 — 단기 상승 추세"
    elif latest_close < latest_ma20 < latest_ma60:
        bias = "강한 매도"
        note = f"주가가 MA20({_fmt(latest_ma20, 0)})·MA60({_fmt(latest_ma60, 0)}) 아래 위치 — 강한 하락 추세"
    elif latest_close < latest_ma20:
        bias = "매도"
        note = f"주가가 MA20({_fmt(latest_ma20, 0)}) 아래 위치 — 단기 하락 추세"
    else:
        bias = "중립"
        note = f"주가({_fmt(latest_close, 0)})가 MA20({_fmt(latest_ma20, 0)}) 부근 — 추세 불명확"

    return {
        "name": "이동평균(MA)",
        "value": f"MA20: {_fmt(latest_ma20, 0)} / MA60: {_fmt(latest_ma60, 0)}",
        "bias": bias,
        "note": note,
    }


def _rsi_signal(df: pd.DataFrame) -> dict[str, Any]:
    """RSI(14) 신호."""
    close = df["close"]

    if _TA_AVAILABLE and len(close) >= 14:
        rsi_series = ta.rsi(close, length=14)
    else:
        # 수동 계산
        delta = close.diff()
        gain = delta.clip(lower=0).rolling(14).mean()
        loss = (-delta.clip(upper=0)).rolling(14).mean()
        rs = gain / loss.replace(0, float("nan"))
        rsi_series = 100 - (100 / (1 + rs))

    latest_rsi = _safe_float(rsi_series.iloc[-1] if rsi_series is not None and len(rsi_series) > 0 else 50)

    if latest_rsi >= 70:
        bias = "매도"
        note = f"RSI {latest_rsi:.1f} — 과매수 구간, 단기 조정 가능성"
    elif latest_rsi >= 60:
        bias = "주의"
        note = f"RSI {latest_rsi:.1f} — 과매수 접근 구간, 모멘텀 약화 주의"
    elif latest_rsi <= 30:
        bias = "매수"
        note = f"RSI {latest_rsi:.1f} — 과매도 구간, 반등 가능성"
    elif latest_rsi <= 40:
        bias = "매수"
        note = f"RSI {latest_rsi:.1f} — 과매도 접근 구간, 매수 관심 구간"
    else:
        bias = "중립"
        note = f"RSI {latest_rsi:.1f} — 중립 구간 (30~70)"

    return {
        "name": "RSI(14)",
        "value": f"{latest_rsi:.1f}",
        "bias": bias,
        "note": note,
    }


def _macd_signal(df: pd.DataFrame) -> dict[str, Any]:
    """MACD(12,26,9) 신호."""
    close = df["close"]

    if _TA_AVAILABLE and len(close) >= 26:
        macd_df = ta.macd(close, fast=12, slow=26, signal=9)
        if macd_df is not None and not macd_df.empty:
            macd_col = [c for c in macd_df.columns if "MACD_12" in c and "MACDs" not in c and "MACDh" not in c]
            sig_col = [c for c in macd_df.columns if "MACDs_12" in c]
            hist_col = [c for c in macd_df.columns if "MACDh_12" in c]

            macd_val = _safe_float(macd_df[macd_col[0]].iloc[-1]) if macd_col else 0.0
            sig_val = _safe_float(macd_df[sig_col[0]].iloc[-1]) if sig_col else 0.0
            hist_val = _safe_float(macd_df[hist_col[0]].iloc[-1]) if hist_col else 0.0
        else:
            macd_val = sig_val = hist_val = 0.0
    else:
        # 수동 계산
        ema12 = close.ewm(span=12, adjust=False).mean()
        ema26 = close.ewm(span=26, adjust=False).mean()
        macd_line = ema12 - ema26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        macd_val = _safe_float(macd_line.iloc[-1])
        sig_val = _safe_float(signal_line.iloc[-1])
        hist_val = macd_val - sig_val

    if macd_val > sig_val and hist_val > 0:
        bias = "매수"
        note = f"MACD({_fmt(macd_val)}) > Signal({_fmt(sig_val)}) — 골든크로스, 상승 모멘텀"
    elif macd_val < sig_val and hist_val < 0:
        bias = "매도"
        note = f"MACD({_fmt(macd_val)}) < Signal({_fmt(sig_val)}) — 데드크로스, 하락 모멘텀"
    elif macd_val > 0:
        bias = "매수"
        note = f"MACD 양수({_fmt(macd_val)}) — 상승 추세 유지"
    elif macd_val < 0:
        bias = "매도"
        note = f"MACD 음수({_fmt(macd_val)}) — 하락 추세 유지"
    else:
        bias = "중립"
        note = "MACD 신호 불명확"

    return {
        "name": "MACD(12,26,9)",
        "value": f"MACD: {_fmt(macd_val)} / Signal: {_fmt(sig_val)}",
        "bias": bias,
        "note": note,
    }


def _bb_signal(df: pd.DataFrame) -> dict[str, Any]:
    """볼린저밴드(20,2) 신호."""
    close = df["close"]

    if _TA_AVAILABLE and len(close) >= 20:
        bb_df = ta.bbands(close, length=20, std=2)
        if bb_df is not None and not bb_df.empty:
            upper_col = [c for c in bb_df.columns if "BBU" in c]
            mid_col = [c for c in bb_df.columns if "BBM" in c]
            lower_col = [c for c in bb_df.columns if "BBL" in c]

            upper = _safe_float(bb_df[upper_col[0]].iloc[-1]) if upper_col else 0.0
            mid = _safe_float(bb_df[mid_col[0]].iloc[-1]) if mid_col else 0.0
            lower = _safe_float(bb_df[lower_col[0]].iloc[-1]) if lower_col else 0.0
        else:
            upper = mid = lower = 0.0
    else:
        # 수동 계산
        mid = close.rolling(20).mean()
        std = close.rolling(20).std()
        upper_s = mid + 2 * std
        lower_s = mid - 2 * std
        upper = _safe_float(upper_s.iloc[-1])
        mid = _safe_float(mid.iloc[-1])
        lower = _safe_float(lower_s.iloc[-1])

    latest_close = _safe_float(close.iloc[-1])

    if upper == 0:
        bias = "중립"
        note = "볼린저밴드 계산 불가 (데이터 부족)"
    elif latest_close >= upper:
        bias = "매도"
        note = f"주가({_fmt(latest_close, 0)})가 상단밴드({_fmt(upper, 0)}) 터치 — 과매수, 되돌림 주의"
    elif latest_close <= lower:
        bias = "매수"
        note = f"주가({_fmt(latest_close, 0)})가 하단밴드({_fmt(lower, 0)}) 터치 — 과매도, 반등 가능성"
    elif latest_close > mid:
        bias = "매수"
        note = f"주가({_fmt(latest_close, 0)})가 중간선({_fmt(mid, 0)}) 위 — 상방 압력"
    else:
        bias = "매도"
        note = f"주가({_fmt(latest_close, 0)})가 중간선({_fmt(mid, 0)}) 아래 — 하방 압력"

    return {
        "name": "볼린저밴드(20,2)",
        "value": f"상단: {_fmt(upper, 0)} / 중간: {_fmt(mid, 0)} / 하단: {_fmt(lower, 0)}",
        "bias": bias,
        "note": note,
    }


def _volume_signal(df: pd.DataFrame) -> dict[str, Any]:
    """거래량 신호 — 20일 평균 대비 현재 거래량."""
    vol = df["volume"]
    close = df["close"]

    vol_ma20 = vol.rolling(20).mean()
    latest_vol = _safe_float(vol.iloc[-1])
    latest_vol_ma = _safe_float(vol_ma20.iloc[-1])
    latest_close = _safe_float(close.iloc[-1])
    prev_close = _safe_float(close.iloc[-2]) if len(close) >= 2 else latest_close

    ratio = (latest_vol / latest_vol_ma) if latest_vol_ma > 0 else 1.0
    price_up = latest_close >= prev_close

    if ratio >= 1.5 and price_up:
        bias = "강한 매수"
        note = f"거래량 평균 대비 {ratio:.1f}배 — 강한 매수세 유입"
    elif ratio >= 1.5 and not price_up:
        bias = "매도"
        note = f"거래량 평균 대비 {ratio:.1f}배 — 강한 매도세 유입"
    elif ratio >= 1.2:
        bias = "주의"
        note = f"거래량 평균 대비 {ratio:.1f}배 — 관심 증가, 방향 확인 필요"
    elif ratio < 0.5:
        bias = "중립"
        note = f"거래량 평균 대비 {ratio:.1f}배 — 거래량 극감, 관망세"
    else:
        bias = "중립"
        note = f"거래량 평균 수준 ({ratio:.1f}배) — 특이 신호 없음"

    # 포맷: 만 단위
    def fmt_vol(v: float) -> str:
        if v >= 1_000_000:
            return f"{v/1_000_000:.1f}M"
        elif v >= 10_000:
            return f"{v/10_000:.0f}만"
        return f"{v:,.0f}"

    return {
        "name": "거래량",
        "value": f"{fmt_vol(latest_vol)} (평균 {fmt_vol(latest_vol_ma)})",
        "bias": bias,
        "note": note,
    }


# ---------------------------------------------------------------------------
# 지지/저항선 계산
# ---------------------------------------------------------------------------

def _calc_levels(df: pd.DataFrame) -> dict[str, float]:
    """최근 60일 고가/저가를 기반으로 지지선·저항선 계산."""
    recent = df.tail(60)
    resistance = _safe_float(recent["high"].max())
    support = _safe_float(recent["low"].min())
    return {"support": support, "resistance": resistance}


# ---------------------------------------------------------------------------
# 종합 점수 계산
# ---------------------------------------------------------------------------

_BIAS_SCORE: dict[str, int] = {
    "강한 매수": 90,
    "매수": 70,
    "주의": 50,
    "중립": 50,
    "약한 매도": 35,
    "매도": 25,
    "강한 매도": 10,
}

_BIAS_WEIGHT = {
    "MA": 0.30,
    "RSI": 0.20,
    "MACD": 0.25,
    "BB": 0.15,
    "VOL": 0.10,
}


def _calc_summary(signals: list[dict[str, Any]]) -> tuple[int, str]:
    """신호 목록에서 종합 점수(0~100)와 summary("매수"/"중립"/"매도") 반환."""
    weights = list(_BIAS_WEIGHT.values())
    score = 0.0
    for sig, w in zip(signals, weights):
        score += _BIAS_SCORE.get(sig["bias"], 50) * w

    score_int = max(0, min(100, int(round(score))))
    if score_int >= 65:
        summary = "매수"
    elif score_int <= 40:
        summary = "매도"
    else:
        summary = "중립"

    return score_int, summary


def _build_interpretation(summary: str, score: int, signals: list[dict[str, Any]]) -> str:
    """종합 해석 텍스트 생성."""
    buy_signals = [s["name"] for s in signals if s["bias"] in ("매수", "강한 매수")]
    sell_signals = [s["name"] for s in signals if s["bias"] in ("매도", "강한 매도")]

    lines = [f"종합 판정: {summary} (점수 {score}/100)"]

    if buy_signals:
        lines.append(f"매수 우호 지표: {', '.join(buy_signals)}")
    if sell_signals:
        lines.append(f"매도 우호 지표: {', '.join(sell_signals)}")

    if summary == "매수":
        lines.append("주요 기술적 지표가 매수 신호를 나타내고 있습니다. 단, 거래량 확인 후 진입을 권장합니다.")
    elif summary == "매도":
        lines.append("주요 기술적 지표가 매도 신호를 나타내고 있습니다. 손절 라인 점검 및 리스크 관리가 필요합니다.")
    else:
        lines.append("기술적 지표가 혼재되어 있습니다. 추가 신호 확인 후 포지션 결정을 권장합니다.")

    return " | ".join(lines)


# ---------------------------------------------------------------------------
# 공개 API
# ---------------------------------------------------------------------------

def get_technical(code: str) -> dict[str, Any]:
    """종목코드에 대한 기술적 분석 결과를 반환한다.

    Args:
        code: 종목코드 (예: "005930")

    Returns:
        TechnicalAnalysisResponse 호환 dict
    """
    df = _load_df(code)

    if df.empty or len(df) < 20:
        logger.warning("기술적 분석 데이터 부족: code=%s, rows=%d", code, len(df))
        return {
            "summary": "중립",
            "score": 50,
            "signals": [
                {
                    "name": "데이터 부족",
                    "value": "—",
                    "bias": "중립",
                    "note": "분석에 필요한 최소 데이터(20일)가 부족합니다.",
                }
            ],
            "interpretation": "데이터 부족으로 기술적 분석을 수행할 수 없습니다.",
            "levels": {"support": 0.0, "resistance": 0.0},
        }

    signals = [
        _ma_signal(df),
        _rsi_signal(df),
        _macd_signal(df),
        _bb_signal(df),
        _volume_signal(df),
    ]

    score, summary = _calc_summary(signals)
    interpretation = _build_interpretation(summary, score, signals)
    levels = _calc_levels(df)

    return {
        "summary": summary,
        "score": score,
        "signals": signals,
        "interpretation": interpretation,
        "levels": levels,
    }
