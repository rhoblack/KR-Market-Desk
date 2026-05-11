// Main app — dashboard + chart view + watchlist
const { useState: useS, useMemo: useM, useEffect: useE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "accent": "#9b7cff",
  "showMovers": true
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ["#9b7cff", "#f4b740", "#3ec5b0", "#a3d75c"];

function App() {
  const [view, setView] = useS({ kind: "dashboard" }); // {kind:'dashboard'} | {kind:'stock', code}
  const [tweaks, setTweaks] = window.useTweaks(TWEAK_DEFAULTS);
  const [now, setNow] = useS(new Date(2026, 4, 11, 14, 35, 12));
  useE(() => {
    const id = setInterval(() => setNow(n => new Date(n.getTime() + 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useE(() => {
    document.documentElement.style.setProperty("--accent", tweaks.accent);
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.accent, tweaks.density]);

  const stock = view.kind === "stock" ? MOCK.watchlist.find(s => s.code === view.code) : null;

  const marketOpen = (() => {
    const h = now.getHours(), m = now.getMinutes();
    const minutes = h * 60 + m;
    return minutes >= 9 * 60 && minutes < 15 * 60 + 30;
  })();

  return (
    <div className="app">
      <Sidebar
        view={view}
        onNav={setView}
      />
      <main className="main">
        <Topbar now={now} marketOpen={marketOpen} />
        <div className="content">
          {view.kind === "dashboard"
            ? <DashboardView onPickStock={code => setView({ kind: "stock", code })} showMovers={tweaks.showMovers} />
            : <StockView stock={stock} onBack={() => setView({ kind: "dashboard" })} onPickStock={code => setView({ kind: "stock", code })} />}
        </div>
      </main>
      <TweaksPanel>
        <TweakSection label="화면">
          <TweakRadio label="밀도" value={tweaks.density} options={[
            { value: "compact", label: "Compact" },
            { value: "comfortable", label: "Comfort" }
          ]} onChange={v => setTweaks("density", v)} />
          <TweakToggle label="시장 등락 종목" value={tweaks.showMovers} onChange={v => setTweaks("showMovers", v)} />
        </TweakSection>
        <TweakSection label="강조 색상">
          <TweakColor
            label="Accent"
            value={tweaks.accent}
            options={ACCENT_OPTIONS}
            onChange={v => setTweaks("accent", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// ─────── Sidebar ───────
function Sidebar({ view, onNav }) {
  const watchlist = MOCK.watchlist;
  return (
    <aside className="sidebar" data-screen-label="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M5 13 L9 9 L13 12 L17 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </div>
        <div className="brand-name">
          <div className="brand-line1">시세관측소</div>
          <div className="brand-line2">KR Market Desk</div>
        </div>
      </div>

      <nav className="nav">
        <button className={"nav-item " + (view.kind === "dashboard" ? "active" : "")} onClick={() => onNav({ kind: "dashboard" })}>
          <span className="nav-ico">◫</span> 대시보드
        </button>
        <div className="nav-section">
          <div className="nav-label">관심 종목 <span className="nav-count">{watchlist.length}</span></div>
          <div className="watchlist">
            {watchlist.map(s => (
              <button
                key={s.code}
                className={"wl-row " + (view.kind === "stock" && view.code === s.code ? "active" : "")}
                onClick={() => onNav({ kind: "stock", code: s.code })}
              >
                <div className="wl-left">
                  <div className="wl-name">{s.name}</div>
                  <div className="wl-code">{s.code} · {s.sector}</div>
                </div>
                <div className="wl-right">
                  <div className="wl-price">{fmt.price(s.price)}</div>
                  <div className="wl-chg" style={{ color: dirColor(s.change) }}>
                    {dirArrow(s.change)} {fmt.pct(s.changePct)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="sidebar-foot">
        <div className="foot-row"><span>데이터</span><span className="foot-val">실시간 (Mock)</span></div>
        <div className="foot-row"><span>지연시간</span><span className="foot-val">~ 12ms</span></div>
      </div>
    </aside>
  );
}

// ─────── Topbar ───────
function Topbar({ now, marketOpen }) {
  const indices = MOCK.indices;
  return (
    <header className="topbar">
      <div className="market-status">
        <span className={"dot " + (marketOpen ? "live" : "closed")} />
        <span className="status-label">{marketOpen ? "장중" : "장마감"}</span>
        <span className="status-time">
          {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })} ·{" "}
          {now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
        </span>
      </div>
      <div className="ticker-strip">
        {indices.map(idx => (
          <div key={idx.code} className="ticker-item">
            <span className="ticker-name">{idx.name}</span>
            <span className="ticker-value">{fmt.price(idx.value)}</span>
            <span className="ticker-chg" style={{ color: dirColor(idx.change) }}>
              {dirArrow(idx.change)} {fmt.pct(idx.changePct)}
            </span>
          </div>
        ))}
      </div>
    </header>
  );
}

// ─────── Dashboard ───────
function DashboardView({ onPickStock, showMovers }) {
  const indices = MOCK.indices;
  const news = MOCK.marketNews;
  return (
    <div className="dash" data-screen-label="01 dashboard">
      <section className="dash-indices">
        {indices.map(idx => <IndexCard key={idx.code} idx={idx} featured={idx.code === "KOSPI" || idx.code === "KOSDAQ"} />)}
      </section>

      <section className="dash-body">
        <div className="news-panel panel">
          <div className="panel-head">
            <h2>주요 뉴스</h2>
            <div className="panel-sub">시장 · 기업 · 정책 · 글로벌</div>
          </div>
          <ul className="news-list">
            {news.map(n => (
              <li key={n.id} className="news-item">
                <div className="news-meta">
                  <Tag tone={n.category === "시장" ? "accent" : n.category === "기업" ? "neutral" : n.category === "정책" ? "warn" : "info"}>{n.category}</Tag>
                  <span className="news-time">{n.time}</span>
                  <span className="news-source">{n.source}</span>
                  <ImpactDot impact={n.impact} />
                </div>
                <div className="news-title">{n.title}</div>
                <div className="news-summary">{n.summary}</div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="dash-aside">
          {showMovers && (
            <div className="panel">
              <div className="panel-head"><h2>등락 상위</h2></div>
              <div className="movers">
                <div className="mover-col">
                  <div className="mover-head" style={{ color: "var(--up)" }}>▲ 상승</div>
                  {MOCK.movers.gainers.map(m => (
                    <div key={m.code} className="mover-row" onClick={() => MOCK.watchlist.find(s => s.code === m.code) && onPickStock(m.code)}>
                      <div className="mover-name">{m.name}</div>
                      <div className="mover-pct" style={{ color: "var(--up)" }}>{fmt.pct(m.changePct)}</div>
                    </div>
                  ))}
                </div>
                <div className="mover-col">
                  <div className="mover-head" style={{ color: "var(--down)" }}>▼ 하락</div>
                  {MOCK.movers.losers.map(m => (
                    <div key={m.code} className="mover-row" onClick={() => MOCK.watchlist.find(s => s.code === m.code) && onPickStock(m.code)}>
                      <div className="mover-name">{m.name}</div>
                      <div className="mover-pct" style={{ color: "var(--down)" }}>{fmt.pct(m.changePct)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-head">
              <h2>관심 종목</h2>
              <div className="panel-sub">탭하여 차트 분석</div>
            </div>
            <div className="wl-grid">
              {MOCK.watchlist.slice(0, 6).map(s => (
                <button key={s.code} className="wl-card" onClick={() => onPickStock(s.code)}>
                  <div className="wl-card-top">
                    <div className="wl-card-name">{s.name}</div>
                    <div className="wl-card-code">{s.code}</div>
                  </div>
                  <div className="wl-card-price">{fmt.price(s.price)}</div>
                  <div className="wl-card-chg" style={{ color: dirColor(s.change) }}>
                    {dirArrow(s.change)} {fmt.signed(s.change, 0)} ({fmt.pct(s.changePct)})
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function IndexCard({ idx, featured }) {
  const color = dirColor(idx.change);
  return (
    <div className={"idx-card " + (featured ? "featured" : "")}>
      <div className="idx-top">
        <div>
          <div className="idx-name">{idx.name}</div>
          <div className="idx-code">{idx.code}</div>
        </div>
        <div className="idx-spark" style={{ color }}>
          <Sparkline data={idx.spark} color={color} height={36} />
        </div>
      </div>
      <div className="idx-value">{fmt.price(idx.value)}</div>
      <div className="idx-chg" style={{ color }}>
        {dirArrow(idx.change)} {fmt.signed(idx.change)} ({fmt.pct(idx.changePct)})
      </div>
      <div className="idx-meta">
        <div><span>고</span> <em>{fmt.price(idx.high)}</em></div>
        <div><span>저</span> <em>{fmt.price(idx.low)}</em></div>
        <div><span>거래대금</span> <em>{idx.volume}</em></div>
      </div>
    </div>
  );
}

// ─────── Stock view ───────
function StockView({ stock, onBack, onPickStock }) {
  const [tab, setTab] = useS("analysis"); // 'analysis' | 'news'
  const candles = MOCK.candles[stock.code];
  const tech = MOCK.technical[stock.code];
  const news = MOCK.stockNews[stock.code] || [];

  return (
    <div className="stock-view" data-screen-label={"stock " + stock.name}>
      <section className="stock-head">
        <div className="stock-head-left">
          <button className="back-btn" onClick={onBack}>← 대시보드</button>
          <div className="stock-title">
            <div className="stock-name-row">
              <h1 className="stock-name">{stock.name}</h1>
              <span className="stock-code-pill">{stock.code}</span>
              <Tag tone="neutral">{stock.sector}</Tag>
            </div>
            <div className="stock-meta-row">시가총액 {stock.marketCap} · 거래량 {stock.volume}</div>
          </div>
        </div>
        <div className="stock-head-right">
          <div className="stock-price">{fmt.price(stock.price)}<span className="krw">원</span></div>
          <div className="stock-chg" style={{ color: dirColor(stock.change) }}>
            {dirArrow(stock.change)} {fmt.signed(stock.change, 0)} ({fmt.pct(stock.changePct)})
          </div>
        </div>
      </section>

      <section className="stock-body">
        <div className="panel chart-panel">
          <div className="panel-head">
            <h2>일봉 차트</h2>
            <div className="chart-toolbar">
              {["1D","1W","1M","3M","6M","1Y"].map((p, i) => (
                <button key={p} className={"chip " + (i === 2 ? "on" : "")}>{p}</button>
              ))}
            </div>
          </div>
          <CandleChart candles={candles} height={420} support={tech.levels.support} resistance={tech.levels.resistance} />
        </div>

        <aside className="analysis-panel panel">
          <div className="tabs">
            <button className={"tab " + (tab === "analysis" ? "on" : "")} onClick={() => setTab("analysis")}>기술적 분석</button>
            <button className={"tab " + (tab === "news" ? "on" : "")} onClick={() => setTab("news")}>관련 뉴스</button>
          </div>

          {tab === "analysis" ? (
            <div className="analysis">
              <div className="ta-summary">
                <div className="ta-score-wrap">
                  <div className="ta-score-ring">
                    <ScoreRing score={tech.score} />
                  </div>
                  <div className="ta-score-text">
                    <div className="ta-score-label">종합 의견</div>
                    <div className="ta-score-value" data-tone={biasTone(tech.summary)}>{tech.summary}</div>
                    <div className="ta-score-num">{tech.score} / 100</div>
                  </div>
                </div>
                <div className="ta-levels">
                  <div className="ta-level">
                    <span className="ta-level-label">저항</span>
                    <span className="ta-level-val" style={{ color: "var(--up)" }}>{fmt.price(tech.levels.resistance)}</span>
                  </div>
                  <div className="ta-level">
                    <span className="ta-level-label">지지</span>
                    <span className="ta-level-val" style={{ color: "var(--down)" }}>{fmt.price(tech.levels.support)}</span>
                  </div>
                </div>
              </div>

              <div className="ta-interp">
                <div className="ta-interp-label">해석</div>
                <p>{tech.interpretation}</p>
              </div>

              <div className="ta-signals">
                <div className="ta-signals-head">
                  <span>지표</span><span>값</span><span>판정</span>
                </div>
                {tech.signals.map((s, i) => (
                  <div key={i} className="ta-row">
                    <div className="ta-row-name">
                      <div className="ta-row-title">{s.name}</div>
                      <div className="ta-row-note">{s.note}</div>
                    </div>
                    <div className="ta-row-val">{s.value}</div>
                    <div className={"ta-row-bias bias-" + biasTone(s.bias)}>{s.bias}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ul className="news-list compact">
              {news.map((n, i) => (
                <li key={i} className="news-item">
                  <div className="news-meta">
                    <span className="news-time">{n.time}</span>
                    <span className="news-source">{n.source}</span>
                    <ImpactDot impact={n.impact} />
                    <span className="news-impact-label" data-tone={n.impact === "긍정" ? "up" : n.impact === "부정" ? "down" : "neutral"}>{n.impact}</span>
                  </div>
                  <div className="news-title">{n.title}</div>
                </li>
              ))}
              {news.length === 0 && <li className="news-empty">관련 뉴스가 없습니다.</li>}
            </ul>
          )}
        </aside>
      </section>
    </div>
  );
}

function biasTone(bias) {
  if (["매수", "강한 매수"].includes(bias)) return "up";
  if (["매도", "약한 매도", "강한 매도"].includes(bias)) return "down";
  if (bias === "주의") return "warn";
  return "neutral";
}

function ScoreRing({ score }) {
  const r = 28, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const tone = score >= 60 ? "var(--up)" : score <= 40 ? "var(--down)" : "var(--muted)";
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r}
        fill="none" stroke={tone} strokeWidth="6"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text x="36" y="41" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--fg)">{score}</text>
    </svg>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
