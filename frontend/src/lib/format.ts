export const fmt = {
  price(n: number): string {
    return n.toLocaleString('ko-KR', { maximumFractionDigits: 2 });
  },
  signed(n: number, digits = 2): string {
    const s = n >= 0 ? '+' : '−';
    return s + Math.abs(n).toLocaleString('ko-KR', { maximumFractionDigits: digits });
  },
  pct(n: number): string {
    const s = n >= 0 ? '+' : '−';
    return s + Math.abs(n).toFixed(2) + '%';
  },
};

export function dirColor(n: number): string {
  if (n > 0) return 'var(--up)';
  if (n < 0) return 'var(--down)';
  return 'var(--muted)';
}

export function dirArrow(n: number): string {
  if (n > 0) return '▲';
  if (n < 0) return '▼';
  return '—';
}

export function biasTone(bias: string): string {
  if (['매수', '강한 매수'].includes(bias)) return 'up';
  if (['매도', '약한 매도', '강한 매도'].includes(bias)) return 'down';
  if (bias === '주의') return 'warn';
  return 'neutral';
}
