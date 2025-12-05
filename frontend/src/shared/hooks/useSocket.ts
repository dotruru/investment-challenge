import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useLiveStateStore } from '../stores/liveStateStore';
import { api } from '../api/client';

interface UseSocketOptions {
  eventId: string;
  clientType: 'operator' | 'audience' | 'jury';
  juryId?: string;
  onReconnect?: () => void;
}

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  lastError: string | null;
}

export function useSocket({ eventId, clientType, juryId, onReconnect }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    reconnectAttempt: 0,
    lastError: null,
  });

  const {
    setFullState,
    setCurrentStage,
    setCurrentTeam,
    setTimerState,
    setAnimationState,
    setConnectionState: setStoreConnectionState,
  } = useLiveStateStore();

  const connect = useCallback(() => {
    const url = import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

    // Get auth token for operator connections
    const token = clientType === 'operator' ? api.getToken() : undefined;

    const socket = io(`${url}/event`, {
      query: {
        eventId,
        clientType,
        ...(juryId && { juryId }),
      },
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      setConnectionState((prev) => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        lastError: null,
      }));
      setStoreConnectionState({ isConnected: true, isReconnecting: false });

      // Request current state on connect
      socket.emit('join:event', { eventId });
    });

    socket.on('disconnect', () => {
      setConnectionState((prev) => ({
        ...prev,
        isConnected: false,
        isReconnecting: true,
      }));
      setStoreConnectionState({ isConnected: false, isReconnecting: true });
    });

    socket.on('reconnect_attempt', (attempt) => {
      setConnectionState((prev) => ({
        ...prev,
        isReconnecting: true,
        reconnectAttempt: attempt,
      }));
      setStoreConnectionState({ isReconnecting: true, reconnectAttempt: attempt });
    });

    socket.on('reconnect', () => {
      onReconnect?.();
      socket.emit('join:event', { eventId });
    });

    socket.on('reconnect_failed', () => {
      setConnectionState((prev) => ({
        ...prev,
        isReconnecting: false,
        lastError: 'Failed to reconnect after multiple attempts',
      }));
      setStoreConnectionState({ isReconnecting: false, lastError: 'Failed to reconnect' });
    });

    socket.on('connect_error', (error) => {
      setConnectionState((prev) => ({
        ...prev,
        lastError: error.message,
      }));
    });

    // State event handlers
    socket.on('state:update', (state) => {
      setFullState(state);
    });

    socket.on('stage:changed', ({ stage }) => {
      setCurrentStage(stage);
    });

    socket.on('team:selected', ({ team }) => {
      setCurrentTeam(team);
    });

    socket.on('timer:sync', (timerState) => {
      setTimerState(timerState);
    });

    socket.on('animation:trigger', ({ animation, params }) => {
      setAnimationState({
        currentAnimation: animation,
        step: 0,
        totalSteps: params?.totalSteps || 1,
        params,
      });
    });

    socket.on('animation:step', (animationState) => {
      setAnimationState(animationState);
    });

    socketRef.current = socket;
  }, [eventId, clientType, juryId, onReconnect, setFullState, setCurrentStage, setCurrentTeam, setTimerState, setAnimationState, setStoreConnectionState]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave:event', { eventId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [eventId]);

  const forceReconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    connectionState,
    forceReconnect,
  };
}

