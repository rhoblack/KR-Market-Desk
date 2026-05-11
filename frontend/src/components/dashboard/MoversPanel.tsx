'use client';

import type { Movers } from '@/types';
import { fmt } from '@/lib/format';

interface MoversPanelProps {
  movers: Movers;
  onPickStock: (code: string) => void;
}

export function MoversPanel({ movers, onPickStock }: MoversPanelProps) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>등락 상위</h2>
      </div>
      <div className="movers">
        {/* 상승 상위 */}
        <div className="mover-col">
          <div className="mover-head" style={{ color: 'var(--up)' }}>▲ 상승</div>
          {movers.gainers.map(m => (
            <div
              key={m.code}
              className="mover-row"
              style={{ cursor: 'pointer' }}
              onClick={() => onPickStock(m.code)}
            >
              <div className="mover-name">{m.name}</div>
              <div className="mover-pct" style={{ color: 'var(--up)' }}>
                {fmt.pct(m.changePct)}
              </div>
            </div>
          ))}
        </div>

        {/* 하락 상위 */}
        <div className="mover-col">
          <div className="mover-head" style={{ color: 'var(--down)' }}>▼ 하락</div>
          {movers.losers.map(m => (
            <div
              key={m.code}
              className="mover-row"
              style={{ cursor: 'pointer' }}
              onClick={() => onPickStock(m.code)}
            >
              <div className="mover-name">{m.name}</div>
              <div className="mover-pct" style={{ color: 'var(--down)' }}>
                {fmt.pct(m.changePct)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
