"""
한국 주식 매매 대시보드 — FastAPI 백엔드 진입점.

실행:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

환경변수 (.env):
    KIS_APP_KEY, KIS_APP_SECRET, KIS_ACCOUNT_NO, KIS_IS_VIRTUAL
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# .env 파일 로드 — main.py 와 동일 디렉토리에 있어야 함
load_dotenv()

from routers import candles, indices, movers, news, stocks, technical, ws
from services.kis_client import KISClient
from services.kis_ws import get_broker

# ---------------------------------------------------------------------------
# 로거 설정
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# 앱 라이프사이클
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """FastAPI 라이프사이클 핸들러.

    startup: KISClient 인스턴스 생성 → app.state 에 저장
    shutdown: httpx 커넥션 풀 해제
    """
    logger.info("백엔드 서버 시작 중...")

    # KIS 클라이언트 초기화
    kis_client = KISClient()
    app.state.kis_client = kis_client

    is_virtual = os.environ.get("KIS_IS_VIRTUAL", "true").lower() in ("1", "true", "yes")
    mode = "모의투자" if is_virtual else "실전투자"
    has_key = bool(os.environ.get("KIS_APP_KEY"))
    logger.info("KIS API 모드: %s | 자격증명: %s", mode, "설정됨" if has_key else "미설정")

    # KIS WebSocket 브로커 시작 (자격증명 있을 때만 KIS WS 연결)
    ws_broker = get_broker()
    app.state.ws_broker = ws_broker
    await ws_broker.start()

    yield  # 앱 실행 구간

    # 종료 처리
    logger.info("백엔드 서버 종료 중...")
    await ws_broker.stop()
    await kis_client.aclose()
    logger.info("KIS HTTP 클라이언트 정상 종료.")


# ---------------------------------------------------------------------------
# FastAPI 앱 생성
# ---------------------------------------------------------------------------

app = FastAPI(
    title="한국 주식 매매 대시보드 API",
    description=(
        "KIS(한국투자증권) OpenAPI를 사용하는 주식 매매 대시보드 백엔드. "
        "프론트엔드(Next.js) 와 100% 타입 호환 응답을 제공합니다."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS 설정
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js 개발 서버
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# 라우터 등록
# ---------------------------------------------------------------------------

app.include_router(indices.router,   prefix="/api", tags=["indices"])
app.include_router(stocks.router,    prefix="/api", tags=["stocks"])
app.include_router(movers.router,    prefix="/api", tags=["movers"])
app.include_router(candles.router,   prefix="/api", tags=["candles"])
app.include_router(technical.router, prefix="/api", tags=["technical"])
app.include_router(news.router,      prefix="/api", tags=["news"])
app.include_router(ws.router,        tags=["websocket"])  # /ws/realtime (prefix 없음)


# ---------------------------------------------------------------------------
# 헬스체크
# ---------------------------------------------------------------------------

@app.get("/health", tags=["system"], summary="헬스체크")
async def health() -> dict[str, str]:
    """서버 상태 확인. 프론트엔드 연결 전 동작 확인용."""
    return {"status": "ok"}
