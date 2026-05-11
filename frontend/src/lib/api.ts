import axios from 'axios';
import type { Index, Stock, Mover, Movers, Candle, TechnicalAnalysis, NewsItem } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
});

export async function fetchIndices(): Promise<Index[]> {
  const { data } = await api.get<Index[]>('/api/indices');
  return data;
}

export async function fetchWatchlist(codes: string[]): Promise<Stock[]> {
  const { data } = await api.get<Stock[]>('/api/stocks', {
    params: { codes: codes.join(',') },
  });
  return data;
}

export async function fetchStock(code: string): Promise<Stock> {
  const { data } = await api.get<Stock>(`/api/stocks/${code}`);
  return data;
}

export async function fetchMovers(limit?: number): Promise<Movers> {
  const { data } = await api.get<Movers>('/api/movers', {
    params: limit !== undefined ? { limit } : undefined,
  });
  return data;
}

export async function fetchCandles(code: string, period: string): Promise<Candle[]> {
  const { data } = await api.get<Candle[]>(`/api/stocks/${code}/candles`, {
    params: { period },
  });
  return data;
}

export async function fetchTechnical(code: string): Promise<TechnicalAnalysis> {
  const { data } = await api.get<TechnicalAnalysis>(`/api/stocks/${code}/technical`);
  return data;
}

export async function fetchNews(limit?: number): Promise<NewsItem[]> {
  const { data } = await api.get<NewsItem[]>('/api/news', {
    params: limit !== undefined ? { limit } : undefined,
  });
  return data;
}

export async function fetchStockNews(code: string): Promise<NewsItem[]> {
  const { data } = await api.get<NewsItem[]>(`/api/news/${code}`);
  return data;
}
