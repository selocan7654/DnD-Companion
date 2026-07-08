import { io, type Socket } from 'socket.io-client';

/**
 * Socket.io exponential reconnect (docs/05 §14):
 * 1s → 2s → 4s → 8s … capped at 30s (Manager doubles delay each attempt).
 */
export const SOCKET_RECONNECT = {
  delay: 1000,
  delayMax: 30_000,
  randomizationFactor: 0.5,
} as const;

/** Predicted wait before the next attempt (pre-jitter), for UI copy. */
export function getReconnectDelayMs(attempt: number): number {
  if (attempt < 1) return SOCKET_RECONNECT.delay;
  return Math.min(SOCKET_RECONNECT.delay * 2 ** (attempt - 1), SOCKET_RECONNECT.delayMax);
}

let socket: Socket | null = null;

/**
 * Socket.io URL. Prefer same-origin (Vite proxies /socket.io in DEV).
 * Override with VITE_API_WS_URL when the API is on another host.
 */
function resolveSocketUrl(): string {
  if (import.meta.env.VITE_API_WS_URL) {
    return import.meta.env.VITE_API_WS_URL;
  }
  return window.location.origin;
}

export function connectSocket(accessToken: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.auth = { token: accessToken };
    socket.connect();
    return socket;
  }

  socket = io(resolveSocketUrl(), {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: SOCKET_RECONNECT.delay,
    reconnectionDelayMax: SOCKET_RECONNECT.delayMax,
    randomizationFactor: SOCKET_RECONNECT.randomizationFactor,
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
