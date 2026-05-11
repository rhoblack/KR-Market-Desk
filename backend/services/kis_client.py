"""
KIS(한국투자증권) REST API 비동기 클라이언트.

환경변수:
    KIS_APP_KEY       — 앱 키
    KIS_APP_SECRET    — 앱 시크릿
    KIS_ACCOUNT_NO    — 계좌번호 (예: "12345678-01")
    KIS_IS_VIRTUAL    — "true" 이면 모의투자, "false" 이면 실전 (기본값 "true")

사용 예:
    client = KISClient()
    price_data = await client.get_stock_price("005930")
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from typing import Any

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 상수
# ---------------------------------------------------------------------------

BASE_URL_REAL = "https://openapi.koreainvestment.com:9443"
BASE_URL_VIRTUAL = "https://openapivts.koreainvestment.com:9443"

# 지수 코드 매핑 (KIS FID_INPUT_ISCD)
INDEX_CODE_MAP: dict[str, str] = {
    "KOSPI":   "0001",
    "KOSDAQ":  "1001",
    "KOSPI200": "2001",
    "KRW":     "USD",   # 원달러 — 별도 TR 사용 (inquire-price-by-currency)
}

# 종목명 + 업종 — KIS 현재가 API에서 반환되지 않으므로 정적 테이블로 보완
STOCK_META: dict[str, dict[str, str]] = {
    "005930": {"name": "삼성전자",        "sector": "반도체"},
    "000660": {"name": "SK하이닉스",      "sector": "반도체"},
    "035420": {"name": "NAVER",           "sector": "IT서비스"},
    "035720": {"name": "카카오",           "sector": "IT서비스"},
    "207940": {"name": "삼성바이오로직스", "sector": "바이오"},
    "005380": {"name": "현대차",          "sector": "자동차"},
    "051910": {"name": "LG화학",          "sector": "화학"},
    "373220": {"name": "LG에너지솔루션",  "sector": "이차전지"},
    "247540": {"name": "에코프로비엠",    "sector": "이차전지"},
    "068270": {"name": "셀트리온",        "sector": "바이오"},
    "323410": {"name": "카카오뱅크",      "sector": "금융"},
}


# ---------------------------------------------------------------------------
# 포맷 헬퍼
# ---------------------------------------------------------------------------

def _fmt_volume(vol: int) -> str:
    """거래량 정수를 "12.4M" 형태 문자열로 변환."""
    if vol >= 1_000_000:
        return f"{vol / 1_000_000:.1f}M"
    if vol >= 1_000:
        return f"{vol / 1_000:.1f}K"
    return str(vol)


def _fmt_market_cap(cap_won: int) -> str:
    """시가총액(원) 을 "468조" 형태 문자열로 변환.

    KIS API는 시가총액을 직접 반환하지 않으므로,
    get_stock_price 응답의 `hts_avls` (HTS 시가총액, 억 단위) 필드를 사용한다.
    """
    if cap_won >= 10_000:
        return f"{cap_won / 10_000:.1f}조"
    return f"{cap_won}억"


# ---------------------------------------------------------------------------
# KISClient
# ---------------------------------------------------------------------------

class KISClient:
    """KIS OpenAPI 비동기 클라이언트 (싱글턴 패턴 권장).

    app lifespan 에서 하나의 인스턴스를 생성하여 app.state 에 저장해 사용한다.
    httpx.AsyncClient 는 lifespan 종료 시 aclose() 를 호출해야 한다.
    """

    def __init__(self) -> None:
        self._app_key: str = os.environ.get("KIS_APP_KEY", "")
        self._app_secret: str = os.environ.get("KIS_APP_SECRET", "")
        self._account_no: str = os.environ.get("KIS_ACCOUNT_NO", "")
        is_virtual_str: str = os.environ.get("KIS_IS_VIRTUAL", "true").lower()
        self._is_virtual: bool = is_virtual_str in ("1", "true", "yes")

        self._base_url: str = BASE_URL_VIRTUAL if self._is_virtual else BASE_URL_REAL

        # 토큰 캐시
        self._access_token: str = ""
        self._token_expires_at: float = 0.0  # epoch seconds

        # 공유 httpx 클라이언트 (커넥션 풀)
        self._http: httpx.AsyncClient = httpx.AsyncClient(
            base_url=self._base_url,
            timeout=10.0,
            headers={"Content-Type": "application/json; charset=utf-8"},
        )

        # 레이트 리밋: 초당 20건 → 요청 간 최소 간격 0.05 초
        self._rate_lock = asyncio.Lock()
        self._last_request_time: float = 0.0

    # ------------------------------------------------------------------
    # 라이프사이클
    # ------------------------------------------------------------------

    async def aclose(self) -> None:
        """앱 종료 시 호출하여 HTTP 커넥션 풀을 해제한다."""
        await self._http.aclose()

    # ------------------------------------------------------------------
    # 내부 유틸
    # ------------------------------------------------------------------

    def _require_credentials(self) -> None:
        """환경변수가 설정되어 있지 않으면 503 에러를 발생시킨다."""
        if not self._app_key or not self._app_secret:
            raise HTTPException(
                status_code=503,
                detail=(
                    "KIS API 자격증명이 설정되지 않았습니다. "
                    ".env 파일에 KIS_APP_KEY / KIS_APP_SECRET 를 입력하세요."
                ),
            )

    async def _throttle(self) -> None:
        """KIS API 레이트 리밋(초당 20건)을 준수하도록 요청 간격을 조절한다."""
        async with self._rate_lock:
            now = time.monotonic()
            elapsed = now - self._last_request_time
            min_interval = 0.05  # 50 ms = 초당 최대 20건
            if elapsed < min_interval:
                await asyncio.sleep(min_interval - elapsed)
            self._last_request_time = time.monotonic()

    async def _get_token(self) -> str:
        """OAuth 액세스 토큰을 반환한다. 유효한 캐시가 있으면 재사용한다."""
        self._require_credentials()

        now = time.time()
        if self._access_token and now < self._token_expires_at - 60:
            return self._access_token

        logger.info("KIS 토큰 발급 요청 중...")
        try:
            resp = await self._http.post(
                "/oauth2/tokenP",
                json={
                    "grant_type": "client_credentials",
                    "appkey": self._app_key,
                    "appsecret": self._app_secret,
                },
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            logger.error("KIS 토큰 발급 실패: %s", exc.response.text)
            raise HTTPException(status_code=502, detail="KIS 토큰 발급 실패") from exc
        except httpx.RequestError as exc:
            logger.error("KIS 토큰 네트워크 오류: %s", exc)
            raise HTTPException(status_code=502, detail="KIS API 연결 실패") from exc

        data: dict[str, Any] = resp.json()
        self._access_token = data["access_token"]
        # KIS 토큰 유효기간은 보통 24시간 (86400초)
        expires_in: int = int(data.get("expires_in", 86400))
        self._token_expires_at = now + expires_in
        logger.info("KIS 토큰 발급 완료 (만료까지 %d초)", expires_in)
        return self._access_token

    def _auth_headers(self, token: str, tr_id: str) -> dict[str, str]:
        """KIS API 공통 인증 헤더를 반환한다."""
        return {
            "authorization": f"Bearer {token}",
            "appkey": self._app_key,
            "appsecret": self._app_secret,
            "tr_id": tr_id,
            "custtype": "P",
        }

    async def _get(
        self,
        path: str,
        tr_id: str,
        params: dict[str, str],
    ) -> dict[str, Any]:
        """인증 헤더를 포함한 GET 요청을 수행하고 응답 body 를 반환한다.

        KIS API 응답 rt_cd 가 "0" 이 아닌 경우 HTTPException(502) 를 발생시킨다.
        """
        token = await self._get_token()
        await self._throttle()

        try:
            resp = await self._http.get(
                path,
                headers=self._auth_headers(token, tr_id),
                params=params,
            )
            resp.raise_for_status()
        except httpx.HTTPStatusError as exc:
            # 토큰 만료(401) 시 한 번 재발급 후 재시도
            if exc.response.status_code == 401:
                logger.warning("KIS 토큰 만료, 재발급 후 재시도")
                self._access_token = ""
                self._token_expires_at = 0.0
                token = await self._get_token()
                await self._throttle()
                try:
                    resp = await self._http.get(
                        path,
                        headers=self._auth_headers(token, tr_id),
                        params=params,
                    )
                    resp.raise_for_status()
                except httpx.HTTPStatusError as exc2:
                    logger.error("KIS API 오류(재시도 후): %s", exc2.response.text)
                    raise HTTPException(
                        status_code=502, detail=f"KIS API 오류: {exc2.response.text}"
                    ) from exc2
            else:
                logger.error("KIS API HTTP 오류: %s", exc.response.text)
                raise HTTPException(
                    status_code=502, detail=f"KIS API 오류: {exc.response.text}"
                ) from exc
        except httpx.RequestError as exc:
            logger.error("KIS API 네트워크 오류: %s", exc)
            raise HTTPException(status_code=502, detail="KIS API 연결 실패") from exc

        body: dict[str, Any] = resp.json()

        # KIS 비즈니스 오류 코드 확인
        rt_cd: str = body.get("rt_cd", "")
        if rt_cd != "0":
            msg: str = body.get("msg1", "알 수 없는 오류")
            logger.error("KIS 비즈니스 오류 [%s]: %s", rt_cd, msg)
            raise HTTPException(
                status_code=502, detail=f"KIS API 비즈니스 오류 ({rt_cd}): {msg}"
            )

        return body

    # ------------------------------------------------------------------
    # 공개 API 메서드
    # ------------------------------------------------------------------

    async def get_index_price(self, index_code: str) -> dict[str, Any]:
        """지수 현재가 조회.

        Args:
            index_code: KIS 지수 코드 (예: "0001" = KOSPI)

        Returns:
            output 딕셔너리. 주요 필드:
              bstp_nmix_prpr  — 현재가
              bstp_nmix_prdy_vrss — 전일대비
              bstp_nmix_prdy_ctrt — 등락률
              bstp_nmix_hgpr  — 당일 고가
              bstp_nmix_lwpr  — 당일 저가
              acml_vol        — 누적거래량
        """
        body = await self._get(
            path="/uapi/domestic-stock/v1/quotations/inquire-index-price",
            tr_id="FHPUP02100000",
            params={
                "FID_COND_MRKT_DIV_CODE": "U",
                "FID_INPUT_ISCD": index_code,
            },
        )
        return body.get("output", {})

    async def get_stock_price(self, stock_code: str) -> dict[str, Any]:
        """주식 현재가 조회.

        Args:
            stock_code: 종목코드 6자리 (예: "005930")

        Returns:
            output 딕셔너리. 주요 필드:
              stck_prpr  — 현재가
              prdy_vrss  — 전일대비
              prdy_ctrt  — 등락률(%)
              acml_vol   — 누적거래량
              stck_mxpr  — 상한가
              stck_llam  — 하한가
              hts_avls   — HTS 시가총액(억원)
        """
        body = await self._get(
            path="/uapi/domestic-stock/v1/quotations/inquire-price",
            tr_id="FHKST01010100",
            params={
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_INPUT_ISCD": stock_code,
            },
        )
        return body.get("output", {})

    async def get_movers(
        self,
        direction: str = "up",
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        """등락 상위/하위 종목 조회.

        Args:
            direction: "up" (상승) | "down" (하락)
            limit: 반환 종목 수 (최대 100)

        Returns:
            output2 리스트. 각 항목의 주요 필드:
              mksc_shrn_iscd — 단축 종목코드
              hts_kor_isnm   — 종목명
              stck_prpr      — 현재가
              prdy_ctrt      — 등락률(%)
        """
        sort_code = "0" if direction == "up" else "1"
        body = await self._get(
            path="/uapi/domestic-stock/v1/ranking/fluctuation",
            tr_id="FHPST01700000",
            params={
                "FID_COND_MRKT_DIV_CODE": "J",
                "FID_COND_SCR_DIV_CODE": "20170",
                "FID_INPUT_ISCD": "0000",          # 0000 = 전체
                "FID_RANK_SORT_CLS_CODE": sort_code,
                "FID_INPUT_CNT_1": str(limit),
                "FID_RSFL_RATE1": "",
                "FID_RSFL_RATE2": "",
            },
        )
        return body.get("output", [])

    # ------------------------------------------------------------------
    # 응답 변환 헬퍼 (KIS raw dict → 도메인 dict)
    # ------------------------------------------------------------------

    def parse_index(self, index_key: str, raw: dict[str, Any]) -> dict[str, Any]:
        """get_index_price 원시 응답을 IndexResponse 호환 딕셔너리로 변환.

        spark 데이터는 KIS 일반 현재가 API에서 제공하지 않으므로
        빈 리스트로 반환한다 (프론트엔드에서 빈 배열 허용).
        """
        index_meta = {
            "KOSPI":    {"name": "코스피",    "code": "KOSPI"},
            "KOSDAQ":   {"name": "코스닥",    "code": "KOSDAQ"},
            "KOSPI200": {"name": "코스피200", "code": "KOSPI200"},
            "KRW":      {"name": "원/달러",   "code": "KRW"},
        }
        meta = index_meta.get(index_key, {"name": index_key, "code": index_key})

        value = float(raw.get("bstp_nmix_prpr", 0) or 0)
        change = float(raw.get("bstp_nmix_prdy_vrss", 0) or 0)
        change_pct = float(raw.get("bstp_nmix_prdy_ctrt", 0) or 0)
        high = float(raw.get("bstp_nmix_hgpr", 0) or 0)
        low = float(raw.get("bstp_nmix_lwpr", 0) or 0)
        acml_vol = int(raw.get("acml_vol", 0) or 0)

        # 거래량 포맷 — 지수는 "N조" 단위, 없으면 "—"
        if acml_vol > 0:
            if acml_vol >= 1_000_000_000_000:
                volume_str = f"{acml_vol / 1_000_000_000_000:.1f}조"
            elif acml_vol >= 100_000_000:
                volume_str = f"{acml_vol / 100_000_000:.1f}억"
            else:
                volume_str = _fmt_volume(acml_vol)
        else:
            volume_str = "—"

        return {
            "code":      meta["code"],
            "name":      meta["name"],
            "value":     value,
            "change":    change,
            "changePct": change_pct,
            "volume":    volume_str,
            "high":      high,
            "low":       low,
            "spark":     [],   # 실시간 스파크는 WebSocket 구현 후 별도 제공
        }

    def parse_stock(self, stock_code: str, raw: dict[str, Any]) -> dict[str, Any]:
        """get_stock_price 원시 응답을 StockResponse 호환 딕셔너리로 변환."""
        meta = STOCK_META.get(stock_code, {"name": stock_code, "sector": "기타"})

        price = float(raw.get("stck_prpr", 0) or 0)
        change = float(raw.get("prdy_vrss", 0) or 0)
        change_pct = float(raw.get("prdy_ctrt", 0) or 0)
        acml_vol = int(raw.get("acml_vol", 0) or 0)
        # hts_avls = HTS 시가총액 (억원 단위)
        hts_avls = int(raw.get("hts_avls", 0) or 0)

        return {
            "code":      stock_code,
            "name":      meta["name"],
            "sector":    meta["sector"],
            "price":     price,
            "change":    change,
            "changePct": change_pct,
            "volume":    _fmt_volume(acml_vol),
            "marketCap": _fmt_market_cap(hts_avls),
        }

    def parse_mover(self, raw: dict[str, Any]) -> dict[str, Any]:
        """get_movers 원시 항목을 MoverResponse 호환 딕셔너리로 변환."""
        code = raw.get("mksc_shrn_iscd", "")
        name = raw.get("hts_kor_isnm", "")
        price = float(raw.get("stck_prpr", 0) or 0)
        change_pct = float(raw.get("prdy_ctrt", 0) or 0)

        return {
            "code":      code,
            "name":      name,
            "price":     price,
            "changePct": change_pct,
        }
