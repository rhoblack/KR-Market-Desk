"""
KIS WebSocket 실시간 브로커 + FastAPI WebSocket fan-out.

구조:
    KISWebSocketBroker  — KIS WS 연결 및 데이터 수신 (asyncio 태스크로 실행)
    ConnectionManager   — 브라우저 클라이언트 연결/해제/브로드캐스트 관리

환경변수:
    KIS_APP_KEY, KIS_APP_SECRET  — 미설정 시 KIS WS 연결 없이 연결 대기만 유지
    KIS_IS_VIRTUAL               — "true" 이면 모의투자 엔드포인트 사용 (기본값)

모의투자 WebSocket URL:
    ws://ops.koreainvestment.com:21000

실전투자 WebSocket URL:
    ws://ops.koreainvestment.com:10000

구독 TR:
    H0STCNT0  — 주식 체결 (실시간 체결가/거래량)
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from typing import Any

from fastapi import WebSocket
from fastapi.websockets import WebSocketDisconnect

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 상수
# ---------------------------------------------------------------------------

_WS_URL_VIRTUAL = "ws://ops.koreainvestment.com:21000"
_WS_URL_REAL    = "ws://ops.koreainvestment.com:10000"
_TR_SUBSCRIBE   = "H0STCNT0"

# ---------------------------------------------------------------------------
# ConnectionManager — 브라우저 클라이언트 fan-out
# ---------------------------------------------------------------------------


class ConnectionManager:
    """FastAPI WebSocket 클라이언트 목록을 관리하고 메시지를 브로드캐스트한다.

    사용 예:
        manager = ConnectionManager()
        await manager.connect(websocket)
        await manager.broadcast({"code": "005930", "price": 75000, ...})
    """

    def __init__(self) -> None:
        # {websocket: set[종목코드]}
        self._clients: dict[WebSocket, set[str]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        """WebSocket 핸드셰이크를 수락하고 클라이언트 목록에 추가한다."""
        await ws.accept()
        async with self._lock:
            self._clients[ws] = set()
        logger.info("클라이언트 연결: 총 %d명", len(self._clients))

    async def disconnect(self, ws: WebSocket) -> None:
        """클라이언트를 목록에서 제거한다."""
        async with self._lock:
            self._clients.pop(ws, None)
        logger.info("클라이언트 해제: 총 %d명", len(self._clients))

    async def subscribe(self, ws: WebSocket, codes: list[str]) -> None:
        """특정 WebSocket 클라이언트의 구독 종목 코드 목록을 갱신한다."""
        async with self._lock:
            if ws in self._clients:
                self._clients[ws] = set(codes)
        logger.info("구독 갱신 [%d개 종목]: %s", len(codes), codes)

    async def broadcast(self, data: dict[str, Any]) -> None:
        """해당 종목을 구독 중인 모든 클라이언트에게 메시지를 전송한다.

        전송 실패한 클라이언트는 자동으로 목록에서 제거한다.
        data 에 "code" 키가 없으면 전체 클라이언트에게 전송한다.
        """
        code = data.get("code", "")
        payload = json.dumps(data, ensure_ascii=False)

        async with self._lock:
            targets = list(self._clients.items())

        disconnected: list[WebSocket] = []
        for ws, subscribed in targets:
            # 종목 코드가 있으면 해당 종목 구독자만, 없으면 전체
            if code and subscribed and code not in subscribed:
                continue
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            await self.disconnect(ws)

    @property
    def client_count(self) -> int:
        return len(self._clients)

    def subscribed_codes(self) -> set[str]:
        """현재 연결된 모든 클라이언트가 구독 중인 종목 코드 합집합을 반환한다."""
        result: set[str] = set()
        for codes in self._clients.values():
            result |= codes
        return result


# ---------------------------------------------------------------------------
# KISWebSocketBroker — KIS WS 연결 및 데이터 수신
# ---------------------------------------------------------------------------


class KISWebSocketBroker:
    """KIS WebSocket API 에 연결하여 실시간 체결 데이터를 수신한다.

    ConnectionManager 를 통해 연결된 브라우저 클라이언트에게 fan-out 한다.

    환경변수 미설정 시 KIS 연결 없이 ConnectionManager 만 유지한다.
    """

    def __init__(self, manager: ConnectionManager) -> None:
        self._manager = manager
        self._app_key: str = os.environ.get("KIS_APP_KEY", "")
        self._app_secret: str = os.environ.get("KIS_APP_SECRET", "")
        is_virtual_str = os.environ.get("KIS_IS_VIRTUAL", "true").lower()
        self._is_virtual: bool = is_virtual_str in ("1", "true", "yes")
        self._ws_url: str = _WS_URL_VIRTUAL if self._is_virtual else _WS_URL_REAL
        self._task: asyncio.Task[None] | None = None
        self._subscribed: set[str] = set()
        self._running = False

    @property
    def has_credentials(self) -> bool:
        return bool(self._app_key and self._app_secret)

    async def start(self) -> None:
        """백그라운드 asyncio 태스크로 KIS WS 수신 루프를 시작한다."""
        if not self.has_credentials:
            logger.warning(
                "KIS API 자격증명 미설정: KIS WebSocket 연결 없이 ConnectionManager 만 활성화됩니다."
            )
            return

        if self._task and not self._task.done():
            logger.debug("KIS WebSocket 브로커가 이미 실행 중입니다.")
            return

        self._running = True
        self._task = asyncio.create_task(self._run_loop(), name="kis_ws_broker")
        logger.info("KIS WebSocket 브로커 태스크 시작됨")

    async def stop(self) -> None:
        """브로커 태스크를 중지한다."""
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("KIS WebSocket 브로커 태스크 종료됨")

    async def subscribe_codes(self, codes: list[str]) -> None:
        """구독할 종목 코드 목록을 갱신한다.

        현재 연결된 브로커 세션에 신규 종목을 동적으로 추가한다.
        실제 WebSocket 구독 메시지는 _run_loop 내부에서 처리한다.
        """
        new_codes = set(codes) - self._subscribed
        self._subscribed |= new_codes
        if new_codes:
            logger.info("KIS WS 신규 구독 종목: %s", new_codes)

    async def _get_approval_key(self) -> str | None:
        """KIS WebSocket 접속키(approval_key) 를 발급받는다."""
        import httpx
        ws_token_url = (
            "https://openapivts.koreainvestment.com:9443/oauth2/Approval"
            if self._is_virtual
            else "https://openapi.koreainvestment.com:9443/oauth2/Approval"
        )
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    ws_token_url,
                    json={
                        "grant_type": "client_credentials",
                        "appkey": self._app_key,
                        "secretkey": self._app_secret,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                return data.get("approval_key")
        except Exception as exc:
            logger.error("KIS WS approval_key 발급 실패: %s", exc)
            return None

    def _make_subscribe_msg(self, approval_key: str, code: str) -> str:
        """특정 종목 체결 구독 메시지(JSON 문자열)를 반환한다."""
        return json.dumps(
            {
                "header": {
                    "approval_key": approval_key,
                    "custtype": "P",
                    "tr_type": "1",   # 1=등록, 2=해제
                    "content-type": "utf-8",
                },
                "body": {
                    "input": {
                        "tr_id": _TR_SUBSCRIBE,
                        "tr_key": code,
                    }
                },
            },
            ensure_ascii=False,
        )

    def _parse_execution(self, raw: str) -> dict[str, Any] | None:
        """KIS WebSocket 체결 데이터 문자열을 파싱하여 dict 를 반환한다.

        KIS WS 응답 형식 (파이프 구분):
            데이터구분|TR ID|데이터건수|데이터 (STCK_CNTG 필드 순서)

        H0STCNT0 데이터 필드 순서 (일부):
            [0]  MKSC_SHRN_ISCD   단축종목코드
            [2]  STCK_CNTG_HOUR  체결 시각 (HHMMSS)
            [3]  STCK_PRPR        현재가
            [4]  PRDY_VRSS_SIGN   전일대비부호
            [5]  PRDY_VRSS        전일대비
            [6]  PRDY_CTRT        전일대비율
            [7]  WGHN_AVRG_STCK_PRC 가중평균주가
            [8]  STCK_OPRC        시가
            [9]  STCK_HGPR        고가
            [10] STCK_LWPR        저가
            [11] ASKP1           매도호가1
            [12] BIDP1           매수호가1
            [13] CNTG_VOL         체결 거래량
            [14] ACML_VOL         누적거래량
        """
        try:
            parts = raw.split("|")
            if len(parts) < 4:
                return None
            tr_id = parts[1].strip()
            if tr_id != _TR_SUBSCRIBE:
                return None

            fields = parts[3].split("^")
            if len(fields) < 15:
                return None

            code      = fields[0]
            hour_str  = fields[2]           # HHMMSS
            price     = float(fields[3] or 0)
            change    = float(fields[5] or 0)
            change_pct = float(fields[6] or 0)
            volume    = int(fields[14] or 0)

            # HHMMSS → HH:MM:SS
            time_str = (
                f"{hour_str[:2]}:{hour_str[2:4]}:{hour_str[4:6]}"
                if len(hour_str) >= 6
                else hour_str
            )

            return {
                "code":      code,
                "price":     price,
                "change":    change,
                "changePct": change_pct,
                "volume":    volume,
                "time":      time_str,
            }
        except Exception as exc:
            logger.debug("체결 데이터 파싱 오류: %s | raw=%s", exc, raw[:80])
            return None

    async def _run_loop(self) -> None:
        """KIS WebSocket 연결 → 구독 → 수신 루프.

        연결이 끊기면 30초 후 재연결을 시도한다.
        """
        import websockets  # type: ignore

        while self._running:
            approval_key = await self._get_approval_key()
            if not approval_key:
                logger.warning("approval_key 발급 실패, 60초 후 재시도")
                await asyncio.sleep(60)
                continue

            try:
                logger.info("KIS WebSocket 연결 시도: %s", self._ws_url)
                async with websockets.connect(
                    self._ws_url,
                    ping_interval=30,
                    ping_timeout=10,
                ) as ws_conn:
                    logger.info("KIS WebSocket 연결 성공")

                    # 초기 구독 종목 등록
                    for code in list(self._subscribed):
                        msg = self._make_subscribe_msg(approval_key, code)
                        await ws_conn.send(msg)
                        logger.debug("구독 등록: %s", code)

                    subscribed_snapshot = set(self._subscribed)

                    async for raw_msg in ws_conn:
                        if not self._running:
                            break

                        # 신규 종목 구독 처리
                        current = set(self._subscribed)
                        new_codes = current - subscribed_snapshot
                        for code in new_codes:
                            msg = self._make_subscribe_msg(approval_key, code)
                            await ws_conn.send(msg)
                            logger.debug("신규 구독 등록: %s", code)
                        subscribed_snapshot = current

                        # JSON 응답 (PINGPONG / 구독 확인 등)
                        if isinstance(raw_msg, str) and raw_msg.startswith("{"):
                            try:
                                resp = json.loads(raw_msg)
                                tr_id = resp.get("header", {}).get("tr_id", "")
                                if tr_id == "PINGPONG":
                                    await ws_conn.send(raw_msg)
                                    logger.debug("PINGPONG 응답")
                            except json.JSONDecodeError:
                                pass
                            continue

                        # 체결 데이터 파싱 → fan-out
                        parsed = self._parse_execution(raw_msg)
                        if parsed:
                            await self._manager.broadcast(parsed)

            except asyncio.CancelledError:
                logger.info("KIS WebSocket 브로커 취소됨")
                break
            except Exception as exc:
                if self._running:
                    logger.error("KIS WebSocket 오류: %s — 30초 후 재연결", exc)
                    await asyncio.sleep(30)
                else:
                    break

        logger.info("KIS WebSocket 브로커 루프 종료")


# ---------------------------------------------------------------------------
# 싱글턴 인스턴스 (main.py lifespan 에서 초기화)
# ---------------------------------------------------------------------------

_manager: ConnectionManager | None = None
_broker: KISWebSocketBroker | None = None


def get_manager() -> ConnectionManager:
    """앱 전역 ConnectionManager 를 반환한다."""
    global _manager
    if _manager is None:
        _manager = ConnectionManager()
    return _manager


def get_broker() -> KISWebSocketBroker:
    """앱 전역 KISWebSocketBroker 를 반환한다."""
    global _broker, _manager
    if _manager is None:
        _manager = ConnectionManager()
    if _broker is None:
        _broker = KISWebSocketBroker(_manager)
    return _broker
