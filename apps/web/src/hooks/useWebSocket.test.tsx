import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { useWebSocket } from '@/hooks/useWebSocket';
import { charactersApi } from '@/store/api/charactersApi';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';
import type { Character } from '@/types/api';

const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

const mockSocket = {
  connected: false,
  auth: { token: '' } as { token: string },
  on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler);
  }),
  off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
    listeners.get(event)?.delete(handler);
  }),
  emit: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('@/lib/socket', () => ({
  connectSocket: vi.fn(() => {
    mockSocket.connected = false;
    return mockSocket;
  }),
  disconnectSocket: vi.fn(() => {
    mockSocket.connected = false;
  }),
  getSocket: vi.fn(() => mockSocket),
}));

function emit(event: string, ...args: unknown[]) {
  listeners.get(event)?.forEach((handler) => handler(...args));
}

function createStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: {
      auth: {
        user: {
          id: 'user-1',
          email: 'dm@example.com',
          username: 'dm',
          role: 'USER' as const,
          avatarUrl: null,
          emailVerifiedAt: '2026-01-01T00:00:00.000Z',
        },
        accessToken: 'test-access-token',
        isInitializing: false,
        sessionExpired: false,
      },
    },
  });
}

const characterFixture: Character = {
  id: 'char-1',
  ownerId: 'user-2',
  ownerUsername: 'player',
  ownerAvatarUrl: null,
  campaignId: 'camp-1',
  name: 'Thorin',
  race: 'Dwarf',
  className: 'Fighter',
  subclass: null,
  level: 5,
  background: null,
  alignment: null,
  experiencePoints: 0,
  abilityScores: null,
  hitPointsMax: 40,
  hitPointsCurrent: 30,
  temporaryHitPoints: 0,
  armorClass: 16,
  speed: 25,
  proficiencyBonus: 3,
  savingThrows: null,
  skills: null,
  featuresAndTraits: null,
  equipment: null,
  spellSlots: null,
  knownSpells: null,
  deathSaves: { successes: 0, failures: 0 },
  conditions: [],
  notes: null,
  portraitUrl: null,
  visibility: 'PRIVATE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('useWebSocket', () => {
  beforeEach(() => {
    listeners.clear();
    mockSocket.connected = false;
    mockSocket.on.mockClear();
    mockSocket.off.mockClear();
    mockSocket.emit.mockClear();
  });

  it('joins campaign on connect and patches character list on live-update', async () => {
    const store = createStore();
    const listArg = { campaignId: 'camp-1', limit: 50 };

    store.dispatch(
      charactersApi.util.upsertQueryData('getCharacters', listArg, {
        data: [{ ...characterFixture }],
        nextCursor: null,
        hasMore: false,
      }),
    );

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result, unmount } = renderHook(() => useWebSocket('camp-1'), { wrapper });

    expect(result.current.isConnected).toBe(false);

    act(() => {
      mockSocket.connected = true;
      emit('connect');
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('join-campaign', { campaignId: 'camp-1' });

    act(() => {
      emit('character:live-update', {
        characterId: 'char-1',
        characterName: 'Thorin',
        fields: { hitPointsCurrent: 12, conditions: ['Poisoned'] },
        updatedBy: 'dm',
      });
    });

    const cached = charactersApi.endpoints.getCharacters.select(listArg)(store.getState());
    expect(cached.data?.data[0]?.hitPointsCurrent).toBe(12);
    expect(cached.data?.data[0]?.conditions).toEqual(['Poisoned']);

    unmount();
    expect(mockSocket.emit).toHaveBeenCalledWith('leave-campaign', { campaignId: 'camp-1' });
  });

  it('sets isConnected false on disconnect', async () => {
    const store = createStore();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useWebSocket('camp-1'), { wrapper });

    act(() => {
      mockSocket.connected = true;
      emit('connect');
    });

    await waitFor(() => expect(result.current.isConnected).toBe(true));

    act(() => {
      mockSocket.connected = false;
      emit('disconnect');
    });

    await waitFor(() => expect(result.current.isConnected).toBe(false));
  });
});
