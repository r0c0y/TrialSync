'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WsMessage {
  id: string;
  type: 'message' | 'event';
  senderName: string;
  senderType: 'User' | 'Agent';
  content: string;
  messageType?: string;
  metadata?: any;
  timestamp: string;
}

interface UseBandWsOptions {
  roomId: string | null;
  wsUrl: string;
  enabled?: boolean;
}

export function useBandWebSocket({ roomId, wsUrl, enabled = true }: UseBandWsOptions) {
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const refCounter = useRef(1);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);

  const nextRef = useCallback(() => String(refCounter.current++), []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const handleLocalMsg = (e: Event) => {
      const customEvent = e as CustomEvent<WsMessage>;
      // Prevent duplicate messages by verifying ID doesn't already exist
      setMessages(prev => {
        if (prev.some(m => m.id === customEvent.detail.id)) return prev;
        return [...prev, customEvent.detail];
      });
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('local-band-message', handleLocalMsg);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('local-band-message', handleLocalMsg);
      }
    };
  }, []);

  useEffect(() => {
    if (!roomId || !wsUrl || !enabled) {
      setConnected(false);
      return;
    }

    let reconnectCount = 0;
    const maxReconnect = 5;

    function connect() {
      if (!mountedRef.current) return;

      if (roomId && roomId.startsWith('mock_')) {
        setConnected(true);
        setError(null);
        return;
      }

      if (wsRef.current) {
        wsRef.current.close();
      }

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!mountedRef.current) { ws.close(); return; }
          setConnected(true);
          setError(null);
          reconnectCount = 0;

          send(['1', '1', `chat_room:${roomId}`, 'phx_join', {}]);

          heartbeatRef.current = setInterval(() => {
            send([null, nextRef(), 'phoenix', 'heartbeat', {}]);
          }, 30000);
        };

        ws.onmessage = (event) => {
          if (!mountedRef.current) return;
          try {
            const [, , topic, evt, payload] = JSON.parse(event.data);
            if (!topic || !evt) return;

            if (evt === 'message_created' && payload?.message) {
              const m = payload.message;
              if (m.sender_type !== 'User') {
                setMessages(prev => {
                  if (prev.some(x => x.id === m.id)) return prev;
                  return [...prev, {
                    id: m.id,
                    type: 'message',
                    senderName: m.sender_name || 'Agent',
                    senderType: m.sender_type,
                    content: m.content,
                    messageType: m.message_type,
                    timestamp: m.inserted_at || new Date().toISOString(),
                  }];
                });
              }
            } else if (evt === 'event_created' && payload?.event) {
              const e = payload.event;
              setMessages(prev => {
                if (prev.some(x => x.id === e.id)) return prev;
                return [...prev, {
                  id: e.id,
                  type: 'event',
                  senderName: e.sender_name || 'System',
                  senderType: e.sender_type || 'Agent',
                  content: e.content,
                  messageType: e.message_type,
                  metadata: e.metadata,
                  timestamp: e.inserted_at || new Date().toISOString(),
                }];
              });
            } else if (evt === 'phx_reply' && payload?.status === 'error') {
              setError(`Channel join failed: ${payload.response?.reason || 'unknown'}`);
            }
          } catch { }
        };

        ws.onerror = () => {
          if (!mountedRef.current) return;
          setError('WebSocket connection error');
        };

        ws.onclose = () => {
          if (!mountedRef.current) return;
          setConnected(false);
          clearInterval(heartbeatRef.current);

          if (reconnectCount < maxReconnect) {
            reconnectCount++;
            const delay = Math.min(1000 * Math.pow(2, reconnectCount), 10000);
            reconnectTimerRef.current = setTimeout(connect, delay);
          }
        };
      } catch (err: any) {
        setError(err.message);
      }
    }

    connect();

    return () => {
      clearInterval(heartbeatRef.current);
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
    };
  }, [roomId, wsUrl, enabled, send, nextRef]);

  return { messages, connected, error };
}
