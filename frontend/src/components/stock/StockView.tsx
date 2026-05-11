'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStock, useCandles, useTechnical, useStockNews } from '@/lib/queries';
import { MOCK_WATCHLIST, MOCK_CANDLES, MOCK_TECHNICAL, MOCK_STOCK_NEWS } from '@/lib/mock';
import { StockHeader } from './StockHeader';
import { CandleChart } from './CandleChart';
import { TechnicalPanel } from './TechnicalPanel';
import { StockNewsPanel } from './StockNewsPanel';

interface StockViewProps {
  code: string;
}

export function StockView({ code }: StockViewProps) {
  const [tab, setTab] = useState<'technical' | 'news'>('technical');
  const [candlePeriod] = useState('3M');
  const router = useRouter();

  const stockQuery = useStock(code);
  const candlesQuery = useCandles(code, candlePeriod);
  const technicalQuery = useTechnical(code);
  const stockNewsQuery = useStockNews(code);

  // API 실패 시 mock 데이터 fallback
  const mockStock = MOCK_WATCHLIST.find(s => s.code === code);
  const stock = stockQuery.data ?? mockStock;
  const candles = candlesQuery.data ?? MOCK_CANDLES[code] ?? [];
  const analysis = technicalQuery.data ?? MOCK_TECHNICAL[code];
  const news = stockNewsQuery.data ?? MOCK_STOCK_NEWS[code] ?? [];
  const levels = analysis?.levels ?? { support: 0, resistance: 0 };

  if (!stock) {
    return (
      <div className="stock-not-found">
        <div className="stock-not-found-icon">◎</div>
        <p>종목을 찾을 수 없습니다</p>
        <span className="stock-not-found-code">{code}</span>
      </div>
    );
  }

  return (
    <div className="stock-view">
      {/* 헤더 — 전체 너비 */}
      <StockHeader stock={stock} onBack={() => router.push('/')} />

      {/* 2열 레이아웃 */}
      <div className="stock-body">
        {/* 좌측: 캔들차트 */}
        <CandleChart candles={candles} levels={levels} />

        {/* 우측: 탭 패널 */}
        <div className="analysis-panel">
          <div className="tabs">
            <button
              className={`tab${tab === 'technical' ? ' on' : ''}`}
              onClick={() => setTab('technical')}
            >
              기술적 분석
            </button>
            <button
              className={`tab${tab === 'news' ? ' on' : ''}`}
              onClick={() => setTab('news')}
            >
              관련 뉴스
            </button>
          </div>
          {tab === 'technical'
            ? (analysis
                ? <TechnicalPanel analysis={analysis} />
                : <div className="panel" style={{ padding: 'var(--pad-3)', color: 'var(--muted)' }}>데이터 없음</div>
              )
            : <StockNewsPanel news={news} />
          }
        </div>
      </div>
    </div>
  );
}
