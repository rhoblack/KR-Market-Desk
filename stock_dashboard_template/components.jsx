// Reusable visual components: sparkline, candle chart, small atoms.

const { useState, useMemo, useRef, useEffect } = React;

// ────────────── format helpers ──────────────
const fmt = {
  price(n) {
    return n.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  },
  signed(n, digits = 2) {
    const s = n >= 0 ? "+" : "−";
    return s + Math.abs(n).toLocaleString("ko-KR", { maximumFractionDigits: digits });
  },
  pct(n) {
    const s = n >= 0 ? "+" : "−";
    return s + Math.abs(n).toFixed(2) + "%";
  },
};

// Up = red (positive), Down = blue (negative) — Korean convention
function dirColor(n) {
  if (n > 0) return "var(--up)";
  if (n < 0) return "var(--down)";
  return "var(--muted)";
}
function dirArrow(n) {
  if (n > 0) return "▲";
  if (n < 0) return "▼";
  return "—";
}

// ────────────── Sparkline ──────────────
function Sparkline({ data, color = "currentColor", height = 36, fill = true }) {
  const w = 120, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return [x, y];
  });
  const path = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(2) + " " + p[1].toFixed(2)).join(" ");
  const area = path + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      {fill && (
        <path d={area} fill={color} opacity="0.12" />
      )}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ────────────── Candle Chart (SVG) ──────────────
function CandleChart({ candles, height = 380, support, resistance, ma20 = true, ma60 = true }) {
  const containerRef = useRef(null);
  const [w, setW] = useState(900);
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setW(Math.floor(e.contentRect.width));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const padL = 56, padR = 16, padT = 16, padB = 24;
  const chartH = height - padT - padB;
  const volH = 60;
  const priceH = chartH - volH - 12;

  const lows = candles.map(c => c.low);
  const highs = candles.map(c => c.high);
  let min = Math.min(...lows), max = Math.max(...highs);
  // Pad scale
  const pad = (max - min) * 0.06;
  min -= pad; max += pad;
  const yScale = v => padT + ((max - v) / (max - min)) * priceH;

  const maxVol = Math.max(...candles.map(c => c.volume));
  const vScale = v => padT + priceH + 12 + (1 - v / maxVol) * volH;

  const innerW = w - padL - padR;
  const cw = innerW / candles.length;
  const bodyW = Math.max(2, cw * 0.62);

  // Moving averages
  function ma(period) {
    return candles.map((_, i) => {
      const start = Math.max(0, i - period + 1);
      const slice = candles.slice(start, i + 1);
      const avg = slice.reduce((s, c) => s + c.close, 0) / slice.length;
      return avg;
    });
  }
  const ma20Data = useMemo(() => ma(20), [candles]);
  const ma60Data = useMemo(() => ma(60), [candles]);

  function maPath(arr) {
    return arr.map((v, i) => {
      const x = padL + i * cw + cw / 2;
      const y = yScale(v);
      return (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2);
    }).join(" ");
  }

  // Gridlines
  const gridCount = 4;
  const gridY = Array.from({ length: gridCount + 1 }, (_, i) => {
    const v = min + ((max - min) / gridCount) * i;
    return { v, y: yScale(v) };
  });

  return (
    <div ref={containerRef} className="candle-wrap">
      <svg width={w} height={height} className="candle-svg">
        {/* gridlines + y-axis labels */}
        {gridY.map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={g.y} y2={g.y} stroke="var(--border)" strokeDasharray="2 4" opacity="0.5" />
            <text x={padL - 8} y={g.y + 4} textAnchor="end" className="axis-label">{fmt.price(Math.round(g.v))}</text>
          </g>
        ))}

        {/* support / resistance lines */}
        {support != null && (
          <g>
            <line x1={padL} x2={w - padR} y1={yScale(support)} y2={yScale(support)} stroke="var(--down)" strokeDasharray="4 4" opacity="0.55" />
            <text x={w - padR - 4} y={yScale(support) - 4} textAnchor="end" className="axis-label" fill="var(--down)">지지 {fmt.price(support)}</text>
          </g>
        )}
        {resistance != null && (
          <g>
            <line x1={padL} x2={w - padR} y1={yScale(resistance)} y2={yScale(resistance)} stroke="var(--up)" strokeDasharray="4 4" opacity="0.55" />
            <text x={w - padR - 4} y={yScale(resistance) - 4} textAnchor="end" className="axis-label" fill="var(--up)">저항 {fmt.price(resistance)}</text>
          </g>
        )}

        {/* moving averages */}
        {ma20 && <path d={maPath(ma20Data)} fill="none" stroke="var(--ma20)" strokeWidth="1.2" opacity="0.9" />}
        {ma60 && <path d={maPath(ma60Data)} fill="none" stroke="var(--ma60)" strokeWidth="1.2" opacity="0.7" />}

        {/* candles */}
        {candles.map((c, i) => {
          const x = padL + i * cw + cw / 2;
          const up = c.close >= c.open;
          const color = up ? "var(--up)" : "var(--down)";
          const yO = yScale(c.open), yC = yScale(c.close);
          const yH = yScale(c.high), yL = yScale(c.low);
          const bodyTop = Math.min(yO, yC);
          const bodyH = Math.max(1, Math.abs(yC - yO));
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={yH} y2={yL} stroke={color} strokeWidth="1" />
              <rect
                x={x - bodyW / 2}
                y={bodyTop}
                width={bodyW}
                height={bodyH}
                fill={up ? color : color}
                opacity={up ? 1 : 1}
              />
            </g>
          );
        })}

        {/* volume bars */}
        {candles.map((c, i) => {
          const x = padL + i * cw + cw / 2;
          const up = c.close >= c.open;
          const yTop = vScale(c.volume);
          const yBase = padT + priceH + 12 + volH;
          return (
            <rect
              key={"v" + i}
              x={x - bodyW / 2}
              y={yTop}
              width={bodyW}
              height={Math.max(1, yBase - yTop)}
              fill={up ? "var(--up)" : "var(--down)"}
              opacity="0.45"
            />
          );
        })}

        {/* volume label */}
        <text x={padL} y={padT + priceH + 8} className="axis-label" opacity="0.6">거래량</text>

        {/* legend */}
        <g transform={`translate(${padL + 4}, ${padT + 14})`}>
          <rect x="0" y="-9" width="68" height="14" fill="var(--surface-2)" rx="3" />
          <text x="6" y="1" className="axis-label" fill="var(--ma20)">─ MA20</text>
          <rect x="74" y="-9" width="68" height="14" fill="var(--surface-2)" rx="3" />
          <text x="80" y="1" className="axis-label" fill="var(--ma60)">─ MA60</text>
        </g>
      </svg>
    </div>
  );
}

// ────────────── Misc atoms ──────────────
function Tag({ children, tone = "neutral" }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

function ImpactDot({ impact }) {
  const tone = impact === "긍정" ? "up" : impact === "부정" ? "down" : "neutral";
  return <span className={`impact-dot impact-${tone}`} title={impact} />;
}

// Expose
Object.assign(window, { Sparkline, CandleChart, Tag, ImpactDot, fmt, dirColor, dirArrow });
