'use client';

import { useEffect, useRef, useState } from 'react';

export interface RealtimePrice {
  price: number;
  change: number;
  changePct: number;
  volume: string;
}

/** WebSocket 실시간 체결가 훅
 *
 * - ws://localhost:8000/ws/realtime 연결
 * - 연결 후 {"action":"subscribe","codes":[...]} 전송
 * - 수신 메시지: {code, price, change, changePct, volume, time}
 * - 백엔드가 없으면 조용히 실패 (오류 미전파)
 */
export function useRealtimePrice(codes: string[]): Record<string, RealtimePrice> {
  const [prices, setPrices] = useState<Record<string, RealtimePrice>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const codesKey = codes.join(',');

  useEffect(() => {
    if (codes.length === 0) return;

    const wsUrl =
      (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
        .replace(/^http/, 'ws') + '/ws/realtime';

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'subscribe', codes }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          code: string;
          price: number;
          change: number;
          changePct: number;
          volume: string;
          time: string;
        };
        if (!msg.code) return;
        setPrices(prev => ({
          ...prev,
          [msg.code]: {
            price: msg.price,
            change: msg.change,
            changePct: msg.changePct,
            volume: msg.volume,
          },
        }));
      } catch {
        // JSON 파싱 오류 무시
      }
    };

    ws.onerror = () => {
      // 백엔드 미실행 시 조용히 실패
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codesKey]);

  return prices;
}
