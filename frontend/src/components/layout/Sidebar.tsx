'use client';
import { useRouter, usePathname } from 'next/navigation';
import { MOCK_WATCHLIST } from '@/lib/mock';
import { fmt, dirColor, dirArrow } from '@/lib/format';

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <svg width="22" height="22" viewBox="0 0 22 22">
            <circle cx="11" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 13 L9 9 L13 12 L17 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="brand-name">
          <div className="brand-line1">시세관측소</div>
          <div className="brand-line2">KR Market Desk</div>
        </div>
      </div>

      <nav className="nav">
        <button
          className={`nav-item ${pathname === '/' ? 'active' : ''}`}
          onClick={() => router.push('/')}
        >
          <span className="nav-ico">◫</span> 대시보드
        </button>

        <button
          className={`nav-item ${pathname === '/news' ? 'active' : ''}`}
          onClick={() => router.push('/news')}
        >
          <span className="nav-ico">◈</span> 시장 뉴스
        </button>

        <div className="nav-section">
          <div className="nav-label">
            관심 종목 <span className="nav-count">{MOCK_WATCHLIST.length}</span>
          </div>
          <div className="watchlist">
            {MOCK_WATCHLIST.map(s => (
              <button
                key={s.code}
                className={`wl-row ${pathname === `/stocks/${s.code}` ? 'active' : ''}`}
                onClick={() => router.push(`/stocks/${s.code}`)}
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
        <div className="foot-row"><span>데이터</span><span className="foot-val">Mock</span></div>
        <div className="foot-row"><span>환경</span><span className="foot-val">개발</span></div>
      </div>
    </aside>
  );
}
