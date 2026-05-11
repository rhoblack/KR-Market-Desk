'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StockHeader } from './StockHeader';
import { CandleChart } from './CandleChart';
import { TechnicalPanel } from './TechnicalPanel';
import { StockNewsPanel } from './StockNewsPanel';
import type { Stock, Candle, TechnicalAnalysis, NewsItem } from '@/types';

interface StockViewProps {
  stock: Stock;
  candles: Candle[];
  levels: { support: number; resistance: number };
  analysis: TechnicalAnalysis | undefined;
  news: NewsItem[];
}

export function StockView({ stock, candles, levels, analysis, news }: StockViewProps) {
  const [tab, setTab] = useState<'technical' | 'news'>('technical');
  const router = useRouter();

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
