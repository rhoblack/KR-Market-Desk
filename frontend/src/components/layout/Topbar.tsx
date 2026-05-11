'use client';
import { useState, useEffect } from 'react';
import { useIndices } from '@/lib/queries';
import { MOCK_INDICES } from '@/lib/mock';
import { fmt, dirColor, dirArrow } from '@/lib/format';

export function Topbar() {
  const [now, setNow] = useState(new Date(2026, 4, 12, 14, 35, 12));

  useEffect(() => {
    const id = setInterval(() => setNow(n => new Date(n.getTime() + 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const { data } = useIndices();
  const indices = data ?? MOCK_INDICES;

  const h = now.getHours(), m = now.getMinutes();
  const minutes = h * 60 + m;
  const marketOpen = minutes >= 9 * 60 && minutes < 15 * 60 + 30;

  return (
    <header className="topbar">
      <div className="market-status">
        <span className={`dot ${marketOpen ? 'live' : 'closed'}`} />
        <span className="status-label">{marketOpen ? '장중' : '장마감'}</span>
        <span className="status-time">
          {now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} ·{' '}
          {now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </span>
      </div>
      <div className="ticker-strip">
        {indices.map(idx => (
          <div key={idx.code} className="ticker-item">
            <span className="ticker-name">{idx.name}</span>
            <span className="ticker-value">{fmt.price(idx.value)}</span>
            <span className="ticker-chg" style={{ color: dirColor(idx.change) }}>
              {dirArrow(idx.change)} {fmt.pct(idx.changePct)}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
}
