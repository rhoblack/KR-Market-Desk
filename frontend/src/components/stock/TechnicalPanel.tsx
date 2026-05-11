import type { TechnicalAnalysis } from '@/types';
import { fmt, biasTone } from '@/lib/format';
import { ScoreRing } from '@/components/ui/ScoreRing';

interface TechnicalPanelProps {
  analysis: TechnicalAnalysis;
}

export function TechnicalPanel({ analysis }: TechnicalPanelProps) {
  const tone = biasTone(analysis.summary);

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>기술적 분석</h2>
      </div>

      <div className="analysis">
        {/* 종합 의견 */}
        <div className="ta-summary">
          <div className="ta-score-wrap">
            <ScoreRing score={analysis.score} />
            <div className="ta-score-text">
              <div className="ta-score-label">종합 의견</div>
              <div className="ta-score-value" data-tone={tone}>
                {analysis.summary}
              </div>
              <div className="ta-score-num">{analysis.score} / 100</div>
            </div>
          </div>

          <div className="ta-levels">
            <div className="ta-level">
              <span className="ta-level-label">저항</span>
              <span
                className="ta-level-val"
                style={{ color: 'var(--up)' }}
              >
                {fmt.price(analysis.levels.resistance)}
              </span>
            </div>
            <div className="ta-level">
              <span className="ta-level-label">지지</span>
              <span
                className="ta-level-val"
                style={{ color: 'var(--down)' }}
              >
                {fmt.price(analysis.levels.support)}
              </span>
            </div>
          </div>
        </div>

        {/* 해석 텍스트 */}
        <div className="ta-interp">
          <div className="ta-interp-label">해석</div>
          <p>{analysis.interpretation}</p>
        </div>

        {/* 지표 테이블 */}
        <div className="ta-signals">
          <div className="ta-signals-head">
            <span>지표</span>
            <span>값</span>
            <span>판정</span>
          </div>
          {analysis.signals.map((sig) => (
            <div key={sig.name} className="ta-row">
              <div className="ta-row-name">
                <div className="ta-row-title">{sig.name}</div>
                <div className="ta-row-note">{sig.note}</div>
              </div>
              <div className="ta-row-val">{sig.value}</div>
              <div className={`ta-row-bias bias-${biasTone(sig.bias)}`}>
                {sig.bias}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
