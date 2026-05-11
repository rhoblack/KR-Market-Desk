import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default function Home() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="content">
          <DashboardView />
        </div>
      </main>
    </div>
  );
}
