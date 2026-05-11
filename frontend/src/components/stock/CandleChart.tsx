'use client';

import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  CrosshairMode,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from 'lightweight-charts';
import type { Candle } from '@/types';

interface CandleChartProps {
  candles: Candle[];
  levels: { support: number; resistance: number };
}

type Period = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y';

const PERIODS: Period[] = ['1D', '1W', '1M', '3M', '6M', '1Y'];

const PERIOD_BARS: Record<Period, number> = {
  '1D': 1,
  '1W': 5,
  '1M': 22,
  '3M': 60,
  '6M': 60,
  '1Y': 60,
};

function calcMA(
  candles: (Candle & { time: string })[],
  period: number
): { time: Time; value: number }[] {
  return candles
    .map((c, i) => {
      if (i < period - 1) return null;
      const avg =
        candles.slice(i - period + 1, i + 1).reduce((s, x) => s + x.close, 0) / period;
      return { time: c.time as Time, value: avg };
    })
    .filter((x): x is { time: Time; value: number } => x !== null);
}

export function CandleChart({ candles, levels }: CandleChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ma20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ma60SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const supportSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const resistanceSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [active, setActive] = useState<Period>('1M');

  // time 필드가 있는 캔들만 필터링
  const validCandles = candles.filter(
    (c): c is Candle & { time: string } => typeof c.time === 'string' && c.time.length > 0
  );

  function getFiltered(period: Period): (Candle & { time: string })[] {
    const n = PERIOD_BARS[period];
    return validCandles.slice(-n);
  }

  function updateSeriesData(period: Period) {
    const filtered = getFiltered(period);
    if (!filtered.length) return;

    // 캔들 시리즈
    const candleData = filtered.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candleSeriesRef.current?.setData(candleData);

    // 거래량 히스토그램
    const volumeData = filtered.map((c) => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? '#ef444466' : '#3b82f666',
    }));
    volumeSeriesRef.current?.setData(volumeData);

    // MA20
    const ma20 = calcMA(filtered, 20);
    ma20SeriesRef.current?.setData(ma20);

    // MA60
    const ma60 = calcMA(filtered, 60);
    ma60SeriesRef.current?.setData(ma60);

    // 지지선 / 저항선 — 첫 번째와 마지막 시간 포인트로 수평선 구성
    if (filtered.length >= 2 && levels.support > 0 && levels.resistance > 0) {
      const firstTime = filtered[0].time as Time;
      const lastTime = filtered[filtered.length - 1].time as Time;

      supportSeriesRef.current?.setData([
        { time: firstTime, value: levels.support },
        { time: lastTime, value: levels.support },
      ]);
      resistanceSeriesRef.current?.setData([
        { time: firstTime, value: levels.resistance },
        { time: lastTime, value: levels.resistance },
      ]);
    }
  }

  // 차트 초기화 (마운트 시 1회)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: '#121826' },
        textColor: '#b6bfd1',
      },
      grid: {
        vertLines: { color: '#232c40' },
        horzLines: { color: '#232c40' },
      },
      crosshair: { mode: CrosshairMode.Magnet },
      rightPriceScale: { borderColor: '#232c40' },
      timeScale: {
        borderColor: '#232c40',
        timeVisible: true,
      },
    });
    chartRef.current = chart;

    // 캔들 시리즈
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#ef4444',
      downColor: '#3b82f6',
      borderUpColor: '#ef4444',
      borderDownColor: '#3b82f6',
      wickUpColor: '#ef4444',
      wickDownColor: '#3b82f6',
    });
    candleSeriesRef.current = candleSeries;

    // 거래량 히스토그램
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceScaleId: 'volume',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // MA20
    const ma20Series = chart.addSeries(LineSeries, {
      color: '#f7c948',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    ma20SeriesRef.current = ma20Series;

    // MA60
    const ma60Series = chart.addSeries(LineSeries, {
      color: '#b083f0',
      lineWidth: 2,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    ma60SeriesRef.current = ma60Series;

    // 지지선 (파랑 점선)
    const supportSeries = chart.addSeries(LineSeries, {
      color: '#3b82f6',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    supportSeriesRef.current = supportSeries;

    // 저항선 (빨강 점선)
    const resistanceSeries = chart.addSeries(LineSeries, {
      color: '#ef4444',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      crosshairMarkerVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    });
    resistanceSeriesRef.current = resistanceSeries;

    // ResizeObserver로 컨테이너 크기 변경 대응
    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: container.clientWidth });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ma20SeriesRef.current = null;
      ma60SeriesRef.current = null;
      supportSeriesRef.current = null;
      resistanceSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 기간 변경 또는 데이터 변경 시 시리즈 데이터 갱신
  useEffect(() => {
    if (!chartRef.current) return;
    updateSeriesData(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, candles, levels]);

  return (
    <div className="candle-wrap panel">
      <div className="chart-toolbar panel-head">
        <span style={{ fontSize: 13, fontWeight: 600 }}>차트</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {PERIODS.map((p) => (
            <button
              key={p}
              className={`chip${active === p ? ' active' : ''}`}
              onClick={() => setActive(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div style={{ padding: '12px 16px 16px' }}>
        <div ref={containerRef} style={{ height: 420, width: '100%' }} />
        <div className="chart-legend">
          <span className="legend-item" style={{ color: '#f7c948' }}>
            <span className="legend-line" style={{ background: '#f7c948' }} />
            MA20
          </span>
          <span className="legend-item" style={{ color: '#b083f0' }}>
            <span className="legend-line" style={{ background: '#b083f0' }} />
            MA60
          </span>
          <span className="legend-item" style={{ color: '#3b82f6' }}>
            <span className="legend-dash" style={{ borderColor: '#3b82f6' }} />
            지지
          </span>
          <span className="legend-item" style={{ color: '#ef4444' }}>
            <span className="legend-dash" style={{ borderColor: '#ef4444' }} />
            저항
          </span>
        </div>
      </div>
    </div>
  );
}
