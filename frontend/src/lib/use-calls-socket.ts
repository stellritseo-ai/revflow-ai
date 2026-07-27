"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? `wss://${window.location.hostname}/api/v1`
    : "ws://localhost:8000/api/v1");

export interface CallEvent {
  event: "connected" | "call_created" | "call_updated" | "pong";
  call?: CallRecord;
  message?: string;
}

export interface CallRecord {
  id: string;
  client_id: string;
  call_sid: string;
  from_number: string;
  to_number: string;
  status: "missed" | "queued" | "calling_back" | "recovered" | "failed";
  direction: "inbound" | "outbound";
  duration_seconds: number | null;
  notes: string | null;
  revenue_estimate: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UseCallsSocketOptions {
  clientId: string | null;
  onCallCreated?: (call: CallRecord) => void;
  onCallUpdated?: (call: CallRecord) => void;
}

export function useCallsSocket({ clientId, onCallCreated, onCallUpdated }: UseCallsSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!clientId) return;
    const wsUrl = `${WS_BASE_URL}/calls/live?client_id=${clientId}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data: CallEvent = JSON.parse(event.data);
        if (data.event === "call_created" && data.call && onCallCreated) {
          onCallCreated(data.call);
        } else if (data.event === "call_updated" && data.call && onCallUpdated) {
          onCallUpdated(data.call);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect after 3 seconds
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [clientId, onCallCreated, onCallUpdated]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: "ping" }));
    }
  }, []);

  return { connected, sendPing };
}
