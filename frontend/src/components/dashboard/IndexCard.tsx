import type { Index } from '@/types';
import { fmt, dirColor, dirArrow } from '@/lib/format';
import { Sparkline } from '@/components/ui/Sparkline';

interface IndexCardProps {
  idx: Index;
  featured?: boolean;
}

export function IndexCard({ idx, featured = false }: IndexCardProps) {
  const color = dirColor(idx.change);

  return (
    <div className={`idx-card${featured ? ' featured' : ''}`}>
      <div className="idx-top">
        <div>
          <div className="idx-name">{idx.name}</div>
          <div className="idx-code">{idx.code}</div>
        </div>
        <div className="idx-spark" style={{ color }}>
          <Sparkline data={idx.spark} color={color} height={36} />
        </div>
      </div>
      <div className="idx-value">{fmt.price(idx.value)}</div>
      <div className="idx-chg" style={{ color }}>
        {dirArrow(idx.change)} {fmt.signed(idx.change)} ({fmt.pct(idx.changePct)})
      </div>
      <div className="idx-meta">
        <div><span>고</span> <em>{fmt.price(idx.high)}</em></div>
        <div><span>저</span> <em>{fmt.price(idx.low)}</em></div>
        <div><span>거래대금</span> <em>{idx.volume}</em></div>
      </div>
    </div>
  );
}
