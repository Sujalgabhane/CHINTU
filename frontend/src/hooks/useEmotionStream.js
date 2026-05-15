// useEmotionStream.js – WebSocket hook for real-time emotion data
import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:8000/ws/emotion';

const INITIAL = {
  emotion: 'Scanning…',
  confidence: 0,
  probs: { Angry:0, Confused:0, Excited:0, Fear:0, Happiness:0, Sadness:0, Surprised:0, Thoughtful:0 },
  has_face: false,
  faces: [],
  frame_b64: '',
  color: '#00d4ff',
  fps: 0,
};

export function useEmotionStream() {
  const [data, setData]           = useState(INITIAL);
  const [connected, setConnected] = useState(false);
  const [error, setError]         = useState(null);
  const wsRef                     = useRef(null);
  const retryRef                  = useRef(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        if (retryRef.current) clearTimeout(retryRef.current);
      };

      ws.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data);
          setData(parsed);
        } catch (_) {}
      };

      ws.onerror = () => {
        setError('Connection error');
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        // Auto-reconnect after 3s
        retryRef.current = setTimeout(connect, 3000);
      };
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { data, connected, error };
}
