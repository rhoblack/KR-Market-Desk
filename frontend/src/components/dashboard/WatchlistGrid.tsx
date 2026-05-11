'use client';

import type { Stock } from '@/types';
import { fmt, dirColor, dirArrow } from '@/lib/format';

interface WatchlistGridProps {
  stocks: Stock[];
  onPickStock: (code: string) => void;
}

export function WatchlistGrid({ stocks, onPickStock }: WatchlistGridProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>관심 종목</h2>
        <div className="panel-sub">탭하여 차트 분석</div>
      </div>
      <div className="wl-grid">
        {stocks.slice(0, 6).map(s => (
          <button
            key={s.code}
            className="wl-card"
            onClick={() => onPickStock(s.code)}
          >
            <div className="wl-card-top">
              <span className="wl-card-name">{s.name}</span>
              <span className="wl-card-code">{s.code}</span>
            </div>
            <div className="wl-card-price">{fmt.price(s.price)}</div>
            <div className="wl-card-chg" style={{ color: dirColor(s.changePct) }}>
              {dirArrow(s.changePct)} {fmt.signed(s.change)} ({fmt.pct(s.changePct)})
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
