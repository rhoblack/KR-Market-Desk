import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { NewsPageView } from '@/components/news/NewsPageView';
import { MOCK_MARKET_NEWS } from '@/lib/mock';

export default function NewsPage() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="content">
          <NewsPageView news={MOCK_MARKET_NEWS} />
        </div>
      </main>
    </div>
  );
}
