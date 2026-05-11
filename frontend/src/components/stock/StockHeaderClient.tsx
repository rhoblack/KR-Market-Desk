'use client';

import { useRouter } from 'next/navigation';
import { StockHeader } from './StockHeader';
import type { Stock } from '@/types';

interface StockHeaderClientProps {
  stock: Stock;
}

export function StockHeaderClient({ stock }: StockHeaderClientProps) {
  const router = useRouter();
  return <StockHeader stock={stock} onBack={() => router.push('/')} />;
}
