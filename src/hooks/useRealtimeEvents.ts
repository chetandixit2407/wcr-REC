import { useEffect, useRef, useState, useCallback } from 'react';
import type { UserRole, DomainEvent } from '../types/index.ts';
import { getStoredStaffToken, authenticatedFetch, safeJson } from '../utils/apiClient.ts';

export type RealtimeConnectionStatus = 'connected' | 'reconnecting' | 'disconnected' | 'connecting';

interface RealtimeOptions {
  role?: UserRole;
  userId?: string;
  sessionToken?: string;
  onEvent?: (event: { type: string; payload?: any; eventId?: string; timestamp?: string }) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export function useRealtimeEvents({
  role = 'HR',
  userId = '',
  sessionToken = '',
  onEvent,
  onConnect,
  onDisconnect,
  onError,
}: RealtimeOptions) {
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('connecting');
  const [lastEvent, setLastEvent] = useState<{
    type: string;
    payload?: any;
    eventId?: string;
    timestamp: number;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptsRef = useRef<number>(0);
  const isConnectingRef = useRef<boolean>(false);

  const processedEventIdsRef = useRef<Set<string>>(new Set());
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const onConnectRef = useRef(onConnect);
  onConnectRef.current = onConnect;

  const onDisconnectRef = useRef(onDisconnect);
  onDisconnectRef.current = onDisconnect;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const lastEventTimestampRef = useRef<string>(new Date().toISOString());
  const hasConnectedBeforeRef = useRef<boolean>(false);

  // Request missed events on reconnect
  const resyncMissedEvents = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        since: lastEventTimestampRef.current,
        role: role || '',
      });
      if (userId) queryParams.set('userId', userId);

      const res = await authenticatedFetch(
        `/api/events/resync?${queryParams.toString()}`
      );
      if (res.ok) {
        const data = await safeJson(res, { success: false, events: [] });
        if (data.success && Array.isArray(data.events)) {
          data.events.forEach((evt: DomainEvent) => {
            if (!processedEventIdsRef.current.has(evt.eventId)) {
              processedEventIdsRef.current.add(evt.eventId);
              if (onEventRef.current) {
                onEventRef.current({
                  type: evt.eventType,
                  payload: evt,
                  eventId: evt.eventId,
                  timestamp: evt.timestamp,
                });
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('[SSE] Failed to resync missed events', err);
    }
  }, [role, userId]);

  // Clean up any existing connection & timeouts
  const cleanupConnection = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (readerRef.current) {
      try {
        readerRef.current.cancel();
      } catch {
        // ignore
      }
      readerRef.current = null;
    }
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {
        // ignore
      }
      abortControllerRef.current = null;
    }
    isConnectingRef.current = false;
  }, []);

  // Main SSE Connect implementation using streaming fetch with Bearer token authentication
  const connect = useCallback((isManualRetry = false) => {
    if (isManualRetry) {
      retryAttemptsRef.current = 0;
    }

    cleanupConnection();

    // Check device online status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[SSE] Device is offline. Waiting for network recovery.');
      setConnectionStatus('disconnected');
      return;
    }

    const activeToken = (sessionToken || getStoredStaffToken() || '').trim();
    if (!activeToken) {
      // Without staff authentication token, do not attempt to hit protected /api/events
      console.log('[SSE] No active staff session token available. Awaiting authentication bootstrap.');
      setConnectionStatus('disconnected');
      return;
    }

    isConnectingRef.current = true;
    setConnectionStatus(hasConnectedBeforeRef.current ? 'reconnecting' : 'connecting');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Timeout guard: If handshake is not completed within 12 seconds, abort and handle backoff
    connectTimeoutRef.current = setTimeout(() => {
      if (isConnectingRef.current) {
        console.warn('[SSE] Connection attempt timed out after 12s');
        controller.abort();
      }
    }, 12000);

    const queryParams = new URLSearchParams();
    if (role) queryParams.set('role', role);
    if (userId) queryParams.set('userId', userId);
    // Never expose token in URL parameters
    const url = `/api/events?${queryParams.toString()}`;

    const headers: Record<string, string> = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      Authorization: `Bearer ${activeToken}`,
      'x-staff-token': activeToken,
      'x-session-token': activeToken,
    };
    if (role) headers['x-user-role'] = role;

    (async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers,
          credentials: 'include',
          signal: controller.signal,
        });

        if (connectTimeoutRef.current) {
          clearTimeout(connectTimeoutRef.current);
          connectTimeoutRef.current = null;
        }

        if (response.status === 401 || response.status === 403) {
          console.warn(`[SSE] Server rejected authentication (HTTP ${response.status}). Stream stopped.`);
          isConnectingRef.current = false;
          setConnectionStatus('disconnected');
          onDisconnectRef.current?.();
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported on response body');
        }

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        // Read stream chunks
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('[SSE] Stream ended by server');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split(/\r?\n\r?\n/);
          buffer = parts.pop() || '';

          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed || trimmed.startsWith(':')) {
              // Heartbeat comment
              continue;
            }

            const lines = trimmed.split(/\r?\n/);
            let dataStr = '';
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const content = line.slice(5).trim();
                dataStr = dataStr ? `${dataStr}\n${content}` : content;
              }
            }

            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);

              // Server confirmed connection handshake
              if (data.type === 'CONNECTED') {
                isConnectingRef.current = false;
                retryAttemptsRef.current = 0;
                setConnectionStatus('connected');
                onConnectRef.current?.();

                if (hasConnectedBeforeRef.current) {
                  resyncMissedEvents();
                } else {
                  hasConnectedBeforeRef.current = true;
                }
                continue;
              }

              // Confirm connected state on any valid domain event
              setConnectionStatus('connected');
              isConnectingRef.current = false;
              retryAttemptsRef.current = 0;

              // Deduplicate event by eventId
              const eventId = data.eventId || data.payload?.eventId;
              if (eventId && processedEventIdsRef.current.has(eventId)) {
                continue;
              }

              if (eventId) {
                processedEventIdsRef.current.add(eventId);
                if (processedEventIdsRef.current.size > 500) {
                  const arr = Array.from(processedEventIdsRef.current);
                  processedEventIdsRef.current = new Set(arr.slice(arr.length - 250));
                }
              }

              if (data.timestamp || data.payload?.timestamp) {
                lastEventTimestampRef.current = data.timestamp || data.payload?.timestamp;
              }

              setLastEvent({
                type: data.type,
                payload: data.payload,
                eventId,
                timestamp: Date.now(),
              });

              if (onEventRef.current) {
                onEventRef.current(data);
              }
            } catch (parseErr) {
              console.warn('[SSE] Failed to parse SSE event chunk', parseErr);
            }
          }
        }

        // Stream exited normally or closed
        throw new Error('Stream closed');
      } catch (err: any) {
        if (controller.signal.aborted) {
          // Intentional abort (cleanup or component unmount)
          return;
        }

        isConnectingRef.current = false;
        onErrorRef.current?.(err);

        // Schedule recovery with bounded exponential backoff
        const attempts = retryAttemptsRef.current;
        retryAttemptsRef.current += 1;

        if (attempts >= 10) {
          console.warn('[SSE] Exceeded maximum retry attempts (10). Marking disconnected.');
          setConnectionStatus('disconnected');
          onDisconnectRef.current?.();
          return;
        }

        setConnectionStatus('reconnecting');
        onDisconnectRef.current?.();

        // Bounded exponential backoff with jitter: 1s -> 1.5s -> 2.25s ... up to 30s
        const backoffMs = Math.min(
          1000 * Math.pow(1.5, Math.min(attempts, 8)) + Math.random() * 500,
          30000
        );

        console.log(`[SSE] Reconnecting in ${Math.round(backoffMs)}ms (attempt ${attempts + 1}/10)...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, backoffMs);
      }
    })();
  }, [role, userId, sessionToken, cleanupConnection, resyncMissedEvents]);

  // Connect on mount & whenever credentials change
  useEffect(() => {
    connect();

    // Reconnect immediately on network recovery
    const handleOnline = () => {
      console.log('[SSE] Network back online. Reconnecting immediately...');
      connect(true);
    };

    const handleOffline = () => {
      console.log('[SSE] Network disconnected.');
      cleanupConnection();
      setConnectionStatus('disconnected');
      onDisconnectRef.current?.();
    };

    // Reconnect on tab focus / visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnectingRef.current) {
        // If not connected, attempt gentle reconnect
        setConnectionStatus((curr) => {
          if (curr !== 'connected') {
            connect(false);
          }
          return curr;
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cleanupConnection();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connect, cleanupConnection]);

  return {
    connected: connectionStatus === 'connected',
    connectionStatus,
    lastEvent,
    reconnect: () => connect(true),
    resyncMissedEvents,
  };
}
