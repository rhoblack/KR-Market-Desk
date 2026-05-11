'use client';

import { useRouter } from 'next/navigation';
import { MOCK_INDICES } from '@/lib/mock';
import { IndexCard } from './IndexCard';
import { MoversPanel } from './MoversPanel';
import { NewsPanel } from './NewsPanel';

export function DashboardView() {
  const router = useRouter();

  const handlePickStock = (code: string) => {
    router.push(`/stocks/${code}`);
  };

  return (
    <div className="dash">
      {/* 지수 카드 4개 */}
      <section className="dash-indices">
        {MOCK_INDICES.map(idx => (
          <IndexCard
            key={idx.code}
            idx={idx}
            featured={idx.code === 'KOSPI' || idx.code === 'KOSDAQ'}
          />
        ))}
      </section>

      {/* 본문 2열 레이아웃 */}
      <section className="dash-body">
        {/* 좌측: 뉴스 패널 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-2)' }}>
          <NewsPanel />
        </div>

        {/* 우측: 등락 상위 */}
        <aside className="dash-aside">
          <MoversPanel onPickStock={handlePickStock} />
        </aside>
      </section>
    </div>
  );
}
