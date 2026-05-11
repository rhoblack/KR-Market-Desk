'use client';

import { useRouter } from 'next/navigation';
import { useIndices, useWatchlist, useMovers, useNews } from '@/lib/queries';
import { MOCK_INDICES, MOCK_WATCHLIST, MOCK_MOVERS, MOCK_MARKET_NEWS } from '@/lib/mock';
import { IndexCard } from './IndexCard';
import { MoversPanel } from './MoversPanel';
import { NewsPanel } from './NewsPanel';
import { WatchlistGrid } from './WatchlistGrid';

const WATCHLIST_CODES = [
  '005930', '000660', '035420', '035720', '207940',
  '005380', '051910', '373220',
];

export function DashboardView() {
  const router = useRouter();

  const indicesQuery = useIndices();
  const watchlistQuery = useWatchlist(WATCHLIST_CODES);
  const moversQuery = useMovers();
  const newsQuery = useNews();

  // API 실패 시 mock 데이터 fallback
  const indices = indicesQuery.data ?? MOCK_INDICES;
  const watchlist = watchlistQuery.data ?? MOCK_WATCHLIST;
  const movers = moversQuery.data ?? MOCK_MOVERS;
  const news = newsQuery.data ?? MOCK_MARKET_NEWS;

  const handlePickStock = (code: string) => {
    router.push(`/stocks/${code}`);
  };

  return (
    <div className="dash">
      {/* 지수 카드 4개 */}
      <section className="dash-indices">
        {indices.map(idx => (
          <IndexCard
            key={idx.code}
            idx={idx}
            featured={idx.code === 'KOSPI' || idx.code === 'KOSDAQ'}
          />
        ))}
      </section>

      {/* 관심종목 그리드 */}
      <WatchlistGrid stocks={watchlist} onPickStock={handlePickStock} />

      {/* 본문 2열 레이아웃 */}
      <section className="dash-body">
        {/* 좌측: 뉴스 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-2)' }}>
          <NewsPanel news={news} />
        </div>

        {/* 우측: 등락 상위 */}
        <aside className="dash-aside">
          <MoversPanel movers={movers} onPickStock={handlePickStock} />
        </aside>
      </section>
    </div>
  );
}
