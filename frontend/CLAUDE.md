# Frontend — Next.js 16 + TypeScript

## 스택

- **Next.js 16** (App Router), **React 19**
- **TypeScript 5**
- **Lightweight Charts v5** — 캔들차트
- **Zustand v5** — 전역 UI 상태
- **TanStack Query v5** — 서버 상태 (백엔드 연결 시 사용)
- **Axios** — HTTP 클라이언트 (백엔드 연결 시 사용)
- CSS Custom Properties 기반 디자인 시스템 (Tailwind 사용 안 함)

## 폴더 구조

```
src/
├── app/
│   ├── globals.css          # 전체 디자인 시스템 (CSS 변수, 컴포넌트 스타일)
│   ├── layout.tsx
│   ├── page.tsx             # 대시보드 홈
│   └── stocks/[code]/
│       └── page.tsx         # 종목 상세
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx      # 좌측 관심종목 네비게이션
│   │   └── Topbar.tsx       # 상단 지수 티커 + 시계
│   ├── dashboard/
│   │   └── DashboardView.tsx
│   ├── stock/               # 종목 상세 컴포넌트 (구현 예정)
│   └── ui/                  # 공용 원자 컴포넌트 (구현 예정)
├── lib/
│   ├── mock.ts              # Mock 데이터 (백엔드 연결 전까지 사용)
│   └── format.ts            # 숫자/퍼센트 포맷 유틸 (fmt, dirColor, dirArrow, biasTone)
└── types/
    └── index.ts             # 공통 타입 (Index, Stock, Candle, TechnicalAnalysis 등)
```

## 핵심 규칙

### CSS
- **CSS Modules 사용 금지**. 모든 스타일은 `globals.css` 하나에서 관리
- 색상은 반드시 CSS 변수 사용 (`var(--up)`, `var(--down)`, `var(--accent)` 등)
- 한국 주식 색상 관례: **빨강(--up) = 상승**, **파랑(--down) = 하락**
- inline style은 동적 색상(`style={{ color: dirColor(n) }}`)에만 허용

### 컴포넌트
- 상호작용 있는 컴포넌트는 반드시 `'use client'` 선언
- Server Component 기본 원칙 유지 (layout, page는 서버 컴포넌트)
- Next.js 16 동적 라우트: `params`는 `Promise<{ code: string }>` 타입

### 데이터
- 현재는 `@/lib/mock.ts`의 Mock 데이터만 사용
- 백엔드 연결 시 `mock.ts` 인터페이스를 유지하며 API 호출로 교체 (컴포넌트 코드 변경 최소화)

### 포맷 유틸 (`@/lib/format.ts`)
```ts
fmt.price(n)      // "78,400"
fmt.signed(n)     // "+1,200" / "−800"
fmt.pct(n)        // "+1.55%" / "−0.50%"
dirColor(n)       // "var(--up)" / "var(--down)" / "var(--muted)"
dirArrow(n)       // "▲" / "▼" / "—"
biasTone(bias)    // "up" / "down" / "warn" / "neutral"
```

## 디자인 토큰 (주요 CSS 변수)

```
배경: --bg, --bg-2, --surface, --surface-2, --surface-3
테두리: --border, --border-2
텍스트: --fg, --fg-2, --muted, --muted-2
색상: --up(빨강), --down(파랑), --warn(노랑), --info(하늘), --accent(보라)
차트 MA: --ma20(노랑), --ma60(보라)
폰트: --font-sans(Pretendard), --font-mono(JetBrains Mono)
여백: --pad-1(12px), --pad-2(16px), --pad-3(22px)
```

## 개발 서버

```
# 프로젝트 루트의 dev.bat 더블클릭
# 또는
cd frontend && npm run dev
# → http://localhost:3000
```
