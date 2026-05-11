import { MOCK_MARKET_NEWS } from '@/lib/mock';
import { Tag } from '@/components/ui/Tag';
import { ImpactDot } from '@/components/ui/ImpactDot';

type TagTone = NonNullable<React.ComponentProps<typeof Tag>['tone']>;

function categoryTone(category: string): TagTone {
  switch (category) {
    case '시장':   return 'accent';
    case '기업':   return 'neutral';
    case '정책':   return 'warn';
    case '글로벌': return 'info';
    default:       return 'neutral';
  }
}

export function NewsPanel() {
  return (
    <div className="panel news-panel">
      <div className="panel-head">
        <h2>주요 뉴스</h2>
        <div className="panel-sub">시장 · 기업 · 정책 · 글로벌</div>
      </div>
      <ul className="news-list">
        {MOCK_MARKET_NEWS.map(n => (
          <li key={n.id} className="news-item">
            <div className="news-meta">
              {n.category && (
                <Tag tone={categoryTone(n.category)}>{n.category}</Tag>
              )}
              <span className="news-time">{n.time}</span>
              <span className="news-source">{n.source}</span>
              <ImpactDot impact={n.impact} />
            </div>
            <a
              href={n.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="news-title news-title-link"
            >
              {n.title}
            </a>
            {n.summary && (
              <div className="news-summary">{n.summary}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
