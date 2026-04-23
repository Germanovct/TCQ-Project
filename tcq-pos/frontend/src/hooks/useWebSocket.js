/**
 * TCQ POS — useWebSocket Hook
 * Real-time connection to the dashboard WebSocket.
 */
import { useEffect, useRef, useCallback, useState } from 'react';

export function useWebSocket(url, onMessage) {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setConnected(true);
        console.log('📡 WebSocket connected');
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch (e) { /* ignore parse errors */ }
      };

      ws.current.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = () => ws.current?.close();
    } catch (e) {
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, [url, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  return { connected };
}
