interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 72 }: ScoreRingProps) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  let stroke: string;
  if (score >= 60) {
    stroke = '#ef4444'; /* --up */
  } else if (score <= 40) {
    stroke = '#3b82f6'; /* --down */
  } else {
    stroke = '#7a8499'; /* --muted */
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      className="ta-score-ring"
    >
      {/* 배경 원 */}
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="var(--border-2)"
        strokeWidth="6"
      />
      {/* 진행 원 */}
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
      />
      {/* 중앙 숫자 */}
      <text
        x="36"
        y="36"
        fontSize="16"
        fontWeight="700"
        fill={stroke}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {score}
      </text>
    </svg>
  );
}
