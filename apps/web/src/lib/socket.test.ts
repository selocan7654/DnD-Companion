import { describe, expect, it } from 'vitest';

import { getReconnectDelayMs, SOCKET_RECONNECT } from '@/lib/socket';

describe('socket reconnect backoff', () => {
  it('follows 1s → 2s → 4s → 8s exponential schedule capped at 30s', () => {
    expect(getReconnectDelayMs(1)).toBe(1000);
    expect(getReconnectDelayMs(2)).toBe(2000);
    expect(getReconnectDelayMs(3)).toBe(4000);
    expect(getReconnectDelayMs(4)).toBe(8000);
    expect(getReconnectDelayMs(5)).toBe(16_000);
    expect(getReconnectDelayMs(6)).toBe(SOCKET_RECONNECT.delayMax);
    expect(getReconnectDelayMs(10)).toBe(SOCKET_RECONNECT.delayMax);
  });
});
