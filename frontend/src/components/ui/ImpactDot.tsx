interface ImpactDotProps {
  impact: '긍정' | '부정' | '중립';
}

export function ImpactDot({ impact }: ImpactDotProps) {
  const tone = impact === '긍정' ? 'up' : impact === '부정' ? 'down' : 'neutral';
  return <span className={`impact-dot impact-${tone}`} title={impact} />;
}
