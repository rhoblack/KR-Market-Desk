import { use } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StockView } from '@/components/stock/StockView';
import { MOCK_WATCHLIST, MOCK_CANDLES, MOCK_TECHNICAL, MOCK_STOCK_NEWS } from '@/lib/mock';

export default function StockPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const stock = MOCK_WATCHLIST.find(s => s.code === code);

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="content">
          {stock ? (
            <StockView
              stock={stock}
              candles={MOCK_CANDLES[code] ?? []}
              levels={MOCK_TECHNICAL[code]?.levels ?? { support: 0, resistance: 0 }}
              analysis={MOCK_TECHNICAL[code]}
              news={MOCK_STOCK_NEWS[code] ?? []}
            />
          ) : (
            <div className="stock-not-found">
              <div className="stock-not-found-icon">◎</div>
              <p>종목을 찾을 수 없습니다</p>
              <span className="stock-not-found-code">{code}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
