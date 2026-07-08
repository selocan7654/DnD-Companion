import { io, type Socket } from 'socket.io-client';

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
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
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
