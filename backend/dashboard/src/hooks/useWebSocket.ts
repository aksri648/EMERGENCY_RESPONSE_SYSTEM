import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CaseStatus, EmergencyCase, WsMessage } from '../types';
import { playAlertBeep } from './audio';

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3000';
const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000';

interface UseWebSocketReturn {
  cases: EmergencyCase[];
  isConnected: boolean;
  activeAlert: EmergencyCase | null;
  pendingCount: number;
  dismissAlert: () => void;
  updateCaseStatus: (id: string, status: CaseStatus) => Promise<void>;
}

export function useWebSocket(): UseWebSocketReturn {
  const { org } = useAuth();
  const [cases, setCases] = useState<EmergencyCase[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingAlerts, setPendingAlerts] = useState<EmergencyCase[]>([]);
  const [activeAlert, setActiveAlert] = useState<EmergencyCase | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!org?.token) return;

    let cancelled = false;

    const connect = () => {
      const ws = new WebSocket(`${WS_BASE}/ws?token=${encodeURIComponent(org.token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (cancelled) return;
        setIsConnected(true);
        backoffRef.current = 1000;
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as WsMessage;
          if (msg.type === 'NEW_CASE') {
            const c = msg.payload;
            setCases((prev) => [c, ...prev.filter((p) => p.id !== c.id)]);
            setPendingAlerts((prev) =>
              c.severity === 'critical' ? [c, ...prev] : [...prev, c]
            );
            if (c.severity === 'critical') playAlertBeep(3);
            else if (c.severity === 'high') playAlertBeep(2);
            else playAlertBeep(1);
          } else if (msg.type === 'CASE_UPDATE') {
            const { id, status } = msg.payload;
            setCases((prev) =>
              prev.map((c) => (c.id === id ? { ...c, status } : c))
            );
          }
        } catch (e) {
          console.warn('[ws] parse failed', e);
        }
      };

      ws.onclose = () => {
        if (cancelled) return;
        setIsConnected(false);
        const delay = Math.min(backoffRef.current, 30_000);
        backoffRef.current = Math.min(backoffRef.current * 2, 30_000);
        reconnectTimerRef.current = window.setTimeout(connect, delay);
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    };

    // Initial REST fetch
    fetch(`${BACKEND}/cases`, {
      headers: { Authorization: `Bearer ${org.token}` },
    })
      .then((r) => r.json())
      .then((data: EmergencyCase[]) => {
        if (!cancelled && Array.isArray(data)) setCases(data);
      })
      .catch(() => {});

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, [org?.token]);

  useEffect(() => {
    if (activeAlert || pendingAlerts.length === 0) return;
    setActiveAlert(pendingAlerts[0]);
    setPendingAlerts((prev) => prev.slice(1));
  }, [activeAlert, pendingAlerts]);

  const dismissAlert = useCallback(() => setActiveAlert(null), []);

  const updateCaseStatus = useCallback(
    async (id: string, status: CaseStatus) => {
      if (!org?.token) return;
      const r = await fetch(`${BACKEND}/cases/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${org.token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (r.ok) {
        const updated: EmergencyCase = await r.json();
        setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      }
    },
    [org?.token]
  );

  return {
    cases,
    isConnected,
    activeAlert,
    pendingCount: pendingAlerts.length,
    dismissAlert,
    updateCaseStatus,
  };
}
