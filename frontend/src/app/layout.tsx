import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '시세관측소 — KR Market Desk',
  description: '한국 주식 매매 대시보드',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
