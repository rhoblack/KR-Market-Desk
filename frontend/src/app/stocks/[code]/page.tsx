import { use } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StockView } from '@/components/stock/StockView';

export default function StockPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="content">
          <StockView code={code} />
        </div>
      </main>
    </div>
  );
}
