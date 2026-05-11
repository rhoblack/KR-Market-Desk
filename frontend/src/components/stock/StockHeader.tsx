'use client';

import { Tag } from '@/components/ui/Tag';
import { fmt, dirColor, dirArrow } from '@/lib/format';
import type { Stock } from '@/types';

interface StockHeaderProps {
  stock: Stock;
  onBack: () => void;
}

export function StockHeader({ stock, onBack }: StockHeaderProps) {
  const chgColor = dirColor(stock.change);

  return (
    <section className="stock-hero">
      <button className="back-btn" onClick={onBack}>
        ← 대시보드
      </button>

      <div className="stock-head">
        <div className="stock-head-left">
          <div className="stock-title">
            <div className="stock-title-row">
              <h1 className="stock-name">{stock.name}</h1>
              <span className="stock-code-pill">{stock.code}</span>
              <Tag tone="neutral">{stock.sector}</Tag>
            </div>
            <div className="stock-meta-row">
              <span className="stock-meta-item">
                <span className="stock-meta-label">시가총액</span>
                <span className="stock-meta-val">{stock.marketCap}</span>
              </span>
              <span className="stock-meta-sep">·</span>
              <span className="stock-meta-item">
                <span className="stock-meta-label">거래량</span>
                <span className="stock-meta-val">{stock.volume}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="stock-price-block">
          <div className="stock-price">
            {fmt.price(stock.price)}
            <span className="krw">원</span>
          </div>
          <div className="stock-chg" style={{ color: chgColor }}>
            {dirArrow(stock.change)}{' '}
            {fmt.signed(stock.change, 0)}{' '}
            ({fmt.pct(stock.changePct)})
          </div>
        </div>
      </div>
    </section>
  );
}
