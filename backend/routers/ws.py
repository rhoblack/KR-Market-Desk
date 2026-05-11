"""
WebSocket 라우터.

엔드포인트:
    WebSocket /ws/realtime  — 브라우저 ↔ 백엔드 실시간 양방향 연결

프로토콜:
    클라이언트 → 서버:
        {"action": "subscribe", "codes": ["005930", "000660"]}
        {"action": "ping"}

    서버 → 클라이언트 (KIS 체결 데이터):
        {"code":"005930","price":75000,"change":500,"changePct":0.67,
         "volume":1234567,"time":"09:32:15"}

    서버 → 클라이언트 (연결 확인):
        {"type":"connected","message":"실시간 연결 성공"}
        {"type":"subscribed","codes":["005930"],"message":"구독 등록 완료"}
        {"type":"pong"}
"""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.kis_ws import get_broker, get_manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/realtime")
async def realtime_ws(ws: WebSocket) -> None:
    """실시간 체결 데이터 WebSocket 엔드포인트.

    브라우저가 연결하면:
    1. ConnectionManager 에 클라이언트 등록
    2. 클라이언트로부터 subscribe 메시지 대기
    3. 구독 종목 KISWebSocketBroker 에 전달
    4. KIS WS 에서 수신된 체결 데이터를 fan-out 으로 전달받아 클라이언트에 전송
    5. 연결 해제 시 클라이언트 제거
    """
    manager = get_manager()
    broker = get_broker()

    await manager.connect(ws)
    logger.info("WebSocket 클라이언트 연결됨")

    try:
        # 연결 성공 알림
        await ws.send_text(
            json.dumps(
                {"type": "connected", "message": "실시간 연결 성공"},
                ensure_ascii=False,
            )
        )

        # 클라이언트 메시지 수신 루프
        async for raw_text in ws.iter_text():
            try:
                msg = json.loads(raw_text)
            except json.JSONDecodeError:
                logger.debug("JSON 파싱 불가: %s", raw_text[:80])
                continue

            action = msg.get("action", "")

            if action == "subscribe":
                codes: list[str] = msg.get("codes", [])
                if not isinstance(codes, list):
                    codes = []

                # 관리자에 구독 종목 등록
                await manager.subscribe(ws, codes)

                # 브로커에 KIS WS 구독 요청
                await broker.subscribe_codes(codes)

                # 구독 확인 응답
                await ws.send_text(
                    json.dumps(
                        {
                            "type": "subscribed",
                            "codes": codes,
                            "message": f"{len(codes)}개 종목 구독 등록 완료",
                        },
                        ensure_ascii=False,
                    )
                )
                logger.info("구독 처리 완료: %s", codes)

            elif action == "ping":
                await ws.send_text(json.dumps({"type": "pong"}, ensure_ascii=False))

            else:
                logger.debug("알 수 없는 action: %s", action)

    except WebSocketDisconnect:
        logger.info("WebSocket 클라이언트 연결 해제")
    except Exception as exc:
        logger.error("WebSocket 오류: %s", exc)
    finally:
        await manager.disconnect(ws)
