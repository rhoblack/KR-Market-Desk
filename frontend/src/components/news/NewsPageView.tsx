import type { NewsItem } from '@/types';
import { ImpactDot } from '@/components/ui/ImpactDot';
import { Tag } from '@/components/ui/Tag';

interface NewsPageViewProps {
  news: NewsItem[];
}

export function NewsPageView({ news }: NewsPageViewProps) {
  return (
    <div className="news-page">
      <div className="news-page-head">
        <h1>시장 뉴스</h1>
        <span className="news-page-count">{news.length}건</span>
      </div>
      <div className="news-page-list">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="news-page-item"
          >
            <div className="news-page-item-top">
              <ImpactDot impact={item.impact} />
              {item.category && <Tag tone="neutral">{item.category}</Tag>}
              <span className="news-page-title">{item.title}</span>
            </div>
            {item.summary && (
              <p className="news-page-summary">{item.summary}</p>
            )}
            <div className="news-page-meta">
              <span className="news-source">{item.source}</span>
              <span className="news-time">{item.time}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
