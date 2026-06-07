import { useEffect, useMemo, useRef, useState } from 'react';
import { Room, RoomEvent, ConnectionState } from 'livekit-client';

export type CallStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'assessing'
  | 'alerted'
  | 'disconnected'
  | 'error';

interface UseLiveKitRoomOpts {
  wsUrl?: string;
  token?: string;
  enabled: boolean;
}

interface UseLiveKitRoomReturn {
  room: Room;
  status: CallStatus;
  alertedDept: string | null;
  isAgentSpeaking: boolean;
  isUserSpeaking: boolean;
  disconnect: () => Promise<void>;
}

export function useLiveKitRoom({
  wsUrl,
  token,
  enabled,
}: UseLiveKitRoomOpts): UseLiveKitRoomReturn {
  const room = useMemo(() => new Room({ adaptiveStream: true, dynacast: true }), []);
  const [status, setStatus] = useState<CallStatus>('idle');
  const [alertedDept, setAlertedDept] = useState<string | null>(null);
  const [isAgentSpeaking, setAgentSpeaking] = useState(false);
  const [isUserSpeaking, setUserSpeaking] = useState(false);
  const audioMonitor = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !wsUrl || !token) return;

    let cancelled = false;

    const onConnected = () => {
      if (!cancelled) setStatus('connected');
    };
    const onDisconnected = () => {
      if (!cancelled) setStatus('disconnected');
    };
    const onStateChanged = (state: ConnectionState) => {
      if (cancelled) return;
      if (state === ConnectionState.Connecting) setStatus('connecting');
      else if (state === ConnectionState.Connected) setStatus((s) => (s === 'alerted' ? s : 'connected'));
      else if (state === ConnectionState.Disconnected) setStatus('disconnected');
    };
    const onData = (payload: Uint8Array) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload)) as {
          type?: string;
          department?: string;
        };
        if (msg.type === 'ALERT_SENT' && msg.department) {
          setAlertedDept(msg.department);
          setStatus('alerted');
        }
      } catch {}
    };

    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.ConnectionStateChanged, onStateChanged);
    room.on(RoomEvent.DataReceived, onData);

    setStatus('connecting');
    (async () => {
      try {
        await room.connect(wsUrl, token);
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (e) {
        if (!cancelled) setStatus('error');
      }
    })();

    audioMonitor.current = setInterval(() => {
      let agentLevel = 0;
      room.remoteParticipants.forEach((p) => {
        if (p.audioLevel > agentLevel) agentLevel = p.audioLevel;
      });
      setAgentSpeaking(agentLevel > 0.05);
      setUserSpeaking(room.localParticipant.audioLevel > 0.05);
    }, 100);

    return () => {
      cancelled = true;
      if (audioMonitor.current) clearInterval(audioMonitor.current);
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.ConnectionStateChanged, onStateChanged);
      room.off(RoomEvent.DataReceived, onData);
      void room.disconnect();
    };
  }, [enabled, wsUrl, token, room]);

  // Promote to "assessing" once the user has spoken once
  useEffect(() => {
    if (isUserSpeaking && status === 'connected') {
      setStatus('assessing');
    }
  }, [isUserSpeaking, status]);

  const disconnect = async () => {
    try {
      await room.localParticipant.setMicrophoneEnabled(false);
    } catch {}
    await room.disconnect();
    setStatus('disconnected');
  };

  return {
    room,
    status,
    alertedDept,
    isAgentSpeaking,
    isUserSpeaking,
    disconnect,
  };
}
