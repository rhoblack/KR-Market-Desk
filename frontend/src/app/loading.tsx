export default function DashboardLoading() {
  return (
    <div className="dash">
      {/* 지수 카드 4개 스켈레톤 */}
      <section className="dash-indices">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="idx-card skeleton-card">
            <div className="sk-line sk-w60" />
            <div className="sk-line sk-w80 sk-lg" />
            <div className="sk-line sk-w40" />
          </div>
        ))}
      </section>

      {/* 본문 스켈레톤 */}
      <section className="dash-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pad-2)' }}>
          <div className="panel sk-panel" />
        </div>
        <aside className="dash-aside">
          <div className="panel sk-panel" />
        </aside>
      </section>
    </div>
  );
}
