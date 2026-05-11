'use client';

import { MOCK_MOVERS, MOCK_WATCHLIST } from '@/lib/mock';
import { fmt } from '@/lib/format';

interface MoversPanelProps {
  onPickStock: (code: string) => void;
}

export function MoversPanel({ onPickStock }: MoversPanelProps) {
  const watchlistCodes = new Set(MOCK_WATCHLIST.map(s => s.code));

  const handleMoverClick = (code: string) => {
    if (watchlistCodes.has(code)) {
      onPickStock(code);
    }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>등락 상위</h2>
      </div>
      <div className="movers">
        {/* 상승 상위 */}
        <div className="mover-col">
          <div className="mover-head" style={{ color: 'var(--up)' }}>▲ 상승</div>
          {MOCK_MOVERS.gainers.map(m => {
            const inWatchlist = watchlistCodes.has(m.code);
            return (
              <div
                key={m.code}
                className="mover-row"
                style={{ cursor: inWatchlist ? 'pointer' : 'default' }}
                onClick={() => handleMoverClick(m.code)}
              >
                <div className="mover-name">{m.name}</div>
                <div className="mover-pct" style={{ color: 'var(--up)' }}>
                  {fmt.pct(m.changePct)}
                </div>
              </div>
            );
          })}
        </div>

        {/* 하락 상위 */}
        <div className="mover-col">
          <div className="mover-head" style={{ color: 'var(--down)' }}>▼ 하락</div>
          {MOCK_MOVERS.losers.map(m => {
            const inWatchlist = watchlistCodes.has(m.code);
            return (
              <div
                key={m.code}
                className="mover-row"
                style={{ cursor: inWatchlist ? 'pointer' : 'default' }}
                onClick={() => handleMoverClick(m.code)}
              >
                <div className="mover-name">{m.name}</div>
                <div className="mover-pct" style={{ color: 'var(--down)' }}>
                  {fmt.pct(m.changePct)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
