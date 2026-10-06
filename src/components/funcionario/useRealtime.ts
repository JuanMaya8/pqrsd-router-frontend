import { useEffect, useRef, useState } from 'react';
import { socketOrigin } from '@/lib/api';

export interface SocketLike {
  on(event: string, cb: (payload: unknown) => void): void;
  close(): void;
}
/** Injectable so the browser verification can drive events without a real socket.io server. */
export type SocketFactory = (origin: string, staffKey: string) => SocketLike | Promise<SocketLike>;

export const EVENTS = ['pqrsd.created', 'pqrsd.updated', 'stats.changed'];

export const defaultSocketFactory: SocketFactory = async (origin, staffKey) => {
  const { io } = await import('socket.io-client');
  const s = io(`${origin}/realtime`, { auth: { staffKey }, transports: ['websocket', 'polling'], reconnectionDelayMax: 10_000 });
  return { on: (e, cb) => void s.on(e, cb), close: () => void s.close() };
};

/** Subscribes to the backend's staff room. `onEvent` is debounced by the caller; returns whether the socket is connected. */
export function useRealtime(staffKey: string, onEvent: () => void, factory: SocketFactory = defaultSocketFactory): boolean {
  const [live, setLive] = useState(false);
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    let socket: SocketLike | null = null;
    let cancelled = false;
    void Promise.resolve(factory(socketOrigin(), staffKey))
      .then((s) => {
        if (cancelled) return s.close();
        socket = s;
        s.on('connect', () => setLive(true));
        s.on('disconnect', () => setLive(false));
        for (const e of EVENTS) s.on(e, () => cb.current());
      })
      .catch(() => setLive(false));
    return () => {
      cancelled = true;
      socket?.close();
    };
  }, [staffKey, factory]);

  return live;
}
