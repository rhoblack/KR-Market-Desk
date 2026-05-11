# 주식 매매 대시보드 — 프로젝트 개요

한국 주식 매매 대시보드. 프론트엔드를 먼저 완성한 뒤 백엔드를 연결하는 방식으로 개발 중.

## 모노레포 구조

```
4. 주식 매매 분석/
├── frontend/          # Next.js 16 + TypeScript (개발 중)
├── backend/           # FastAPI (Python) — 골격 + KIS REST 클라이언트 구현 완료
├── stock_dashboard_template/  # 원본 프로토타입 (참고용, 수정 금지)
└── dev.bat            # 개발 서버 실행 + 브라우저 오픈
```

## 개발 원칙

- **프론트엔드 우선**: UI/UX 완성 후 백엔드 연결
- **단계별 확인**: 기능 하나 완성 → 사용자 확인 → 다음 단계
- **Mock 데이터**: 현재 모든 데이터는 `frontend/src/lib/mock.ts`에서 공급. 백엔드 연결 시 이 파일의 인터페이스를 유지하며 API 호출로 교체
- **참고 소스**: `stock_dashboard_template/`이 원본 프로토타입. 동일한 UX를 Next.js로 이식하는 것이 목표

## 데이터 소스 계획 (백엔드 구현 시)

| 데이터 | 소스 |
|--------|------|
| 과거 OHLCV | pykrx → SQLite 캐시 |
| 현재가 / 지수 | KIS REST API |
| 실시간 체결가 | KIS WebSocket API (모의투자 계정) |
| 뉴스 | 네이버 금융 RSS |

## 현재 진행 상황

- [x] 1단계: 프로젝트 세팅 + 디자인 시스템 + 레이아웃 뼈대
- [x] 2단계: 대시보드 — 지수 카드 + Sparkline
- [x] 3단계: 대시보드 — 관심종목 그리드 + 등락 상위
- [x] 4단계: 대시보드 — 뉴스 패널
- [x] 5단계: 종목 상세 — 헤더 + 가격 정보
- [x] 6단계: 종목 상세 — 캔들차트 (Lightweight Charts)
- [x] 7단계: 종목 상세 — 기술적 분석 패널
- [x] 8단계: 종목 상세 — 관련 뉴스 탭
- [x] 9단계: 반응형 + 로딩 스켈레톤 + 마무리 polish
- [x] 10단계: 백엔드 — FastAPI 골격 + KIS REST 클라이언트
- [x] 11단계: 백엔드 — pykrx SQLite 캐시 + 캔들 API + pandas-ta 기술적 지표
- [ ] 12단계: 백엔드 — 네이버 뉴스 RSS + KIS WebSocket 실시간
- [ ] 13단계: 프론트엔드 ↔ 백엔드 연결 (mock.ts → API 교체)
