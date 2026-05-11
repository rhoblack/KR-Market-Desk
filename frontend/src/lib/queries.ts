import { useQuery } from '@tanstack/react-query';
import {
  fetchIndices,
  fetchWatchlist,
  fetchStock,
  fetchMovers,
  fetchCandles,
  fetchTechnical,
  fetchNews,
  fetchStockNews,
} from './api';
import type { Index, Stock, Movers, Candle, TechnicalAnalysis, NewsItem } from '@/types';

/** 지수 4개 (코스피/코스닥/코스피200/원달러) */
export function useIndices() {
  return useQuery<Index[]>({
    queryKey: ['indices'],
    queryFn: fetchIndices,
    staleTime: 30_000,
    retry: false,
  });
}

/** 관심종목 목록 */
export function useWatchlist(codes: string[]) {
  return useQuery<Stock[]>({
    queryKey: ['watchlist', codes],
    queryFn: () => fetchWatchlist(codes),
    staleTime: 30_000,
    enabled: codes.length > 0,
    retry: false,
  });
}

/** 개별 종목 */
export function useStock(code: string) {
  return useQuery<Stock>({
    queryKey: ['stock', code],
    queryFn: () => fetchStock(code),
    staleTime: 30_000,
    enabled: !!code,
    retry: false,
  });
}

/** 등락 상위 */
export function useMovers(limit?: number) {
  return useQuery<Movers>({
    queryKey: ['movers', limit],
    queryFn: () => fetchMovers(limit),
    staleTime: 60_000,
    retry: false,
  });
}

/** 캔들 OHLCV */
export function useCandles(code: string, period: string) {
  return useQuery<Candle[]>({
    queryKey: ['candles', code, period],
    queryFn: () => fetchCandles(code, period),
    staleTime: 5 * 60_000,
    enabled: !!code,
    retry: false,
  });
}

/** 기술적 지표 */
export function useTechnical(code: string) {
  return useQuery<TechnicalAnalysis>({
    queryKey: ['technical', code],
    queryFn: () => fetchTechnical(code),
    staleTime: 5 * 60_000,
    enabled: !!code,
    retry: false,
  });
}

/** 시장 뉴스 */
export function useNews(limit?: number) {
  return useQuery<NewsItem[]>({
    queryKey: ['news', limit],
    queryFn: () => fetchNews(limit),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** 종목 뉴스 */
export function useStockNews(code: string) {
  return useQuery<NewsItem[]>({
    queryKey: ['stockNews', code],
    queryFn: () => fetchStockNews(code),
    staleTime: 5 * 60_000,
    enabled: !!code,
    retry: false,
  });
}
