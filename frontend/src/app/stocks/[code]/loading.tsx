export default function StockLoading() {
  return (
    <div className="app">
      {/* 사이드바 자리 */}
      <div
        style={{
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
        }}
      />

      <main className="main">
        {/* 탑바 자리 */}
        <div
          style={{
            height: 52,
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            flexShrink: 0,
          }}
        />

        <div className="content">
          <div className="stock-view">
            {/* 종목 헤더 스켈레톤 */}
            <div className="sk-hero" />

            {/* 본문 스켈레톤 */}
            <div className="stock-body">
              <div className="panel sk-panel sk-chart" />
              <div className="panel sk-panel" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
