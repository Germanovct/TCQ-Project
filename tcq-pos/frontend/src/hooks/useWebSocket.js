/**
 * TCQ POS — useWebSocket Hook
 * Stable real-time connection to the dashboard WebSocket.
 * Uses refs for callbacks to prevent infinite reconnection loops.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(url, onMessage) {
  const ws = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);
  const pingInterval = useRef(null);
  const onMessageRef = useRef(onMessage);
  const mountedRef = useRef(true);

  // Keep ref in sync without triggering reconnect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      // Clean up any existing connection
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.onerror = null;
        ws.current.close();
      }

      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        console.log('📡 WebSocket connected');

        // Start heartbeat ping every 20 seconds
        clearInterval(pingInterval.current);
        pingInterval.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send('ping');
          }
        }, 20000);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'pong') return; // Ignore pong responses
          onMessageRef.current?.(data);
        } catch (e) { /* ignore parse errors */ }
      };

      ws.current.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        clearInterval(pingInterval.current);
        // Reconnect after 3 seconds
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    } catch (e) {
      if (mountedRef.current) {
        reconnectTimer.current = setTimeout(connect, 5000);
      }
    }
  }, [url]); // Only reconnect when URL changes, NOT when onMessage changes

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      clearInterval(pingInterval.current);
      if (ws.current) {
        ws.current.onclose = null;
        ws.current.close();
      }
    };
  }, [connect]);

  return { connected };
}
