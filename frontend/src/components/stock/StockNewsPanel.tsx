import type { NewsItem } from '@/types';
import { ImpactDot } from '@/components/ui/ImpactDot';

interface StockNewsPanelProps {
  news: NewsItem[];
}

export function StockNewsPanel({ news }: StockNewsPanelProps) {
  if (news.length === 0) {
    return (
      <div className="panel">
        <div className="news-empty">관련 뉴스가 없습니다</div>
      </div>
    );
  }

  return (
    <div className="news-panel panel">
      <ul className="news-list">
        {news.map((item, i) => (
          <li key={i} className="news-item">
            <div className="news-item-top">
              <ImpactDot impact={item.impact} />
              <a
                href={item.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="news-title news-title-link"
              >
                {item.title}
              </a>
            </div>
            <div className="news-meta">
              <span className="news-source">{item.source}</span>
              <span className="news-time">{item.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
