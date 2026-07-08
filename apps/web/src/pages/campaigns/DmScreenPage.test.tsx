import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DmScreenPage } from '@/pages/campaigns/DmScreenPage';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';

const mockUseGetCampaignQuery = vi.fn();
const mockUseGetCharactersQuery = vi.fn();
const mockUseGetDmNotesQuery = vi.fn();
const mockUseWebSocket = vi.fn();

vi.mock('@/store/api/campaignsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/api/campaignsApi')>();
  return {
    ...actual,
    useGetCampaignQuery: (...args: unknown[]) => mockUseGetCampaignQuery(...args),
    useGetDmNotesQuery: (...args: unknown[]) => mockUseGetDmNotesQuery(...args),
    useCreateDmNoteMutation: () => [vi.fn(), { isLoading: false }],
    useUpdateDmNoteMutation: () => [vi.fn(), { isLoading: false }],
    useDeleteDmNoteMutation: () => [vi.fn(), { isLoading: false }],
    useReorderDmNotesMutation: () => [vi.fn(), { isLoading: false }],
  };
});

vi.mock('@/store/api/charactersApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/api/charactersApi')>();
  return {
    ...actual,
    useGetCharactersQuery: (...args: unknown[]) => mockUseGetCharactersQuery(...args),
    useUpdateLiveFieldsMutation: () => [vi.fn(), { isLoading: false }],
  };
});

vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: (...args: unknown[]) => mockUseWebSocket(...args),
}));

function renderPage(userId: string) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: {
      auth: {
        user: {
          id: userId,
          email: 'user@example.com',
          username: 'tester',
          role: 'USER' as const,
          avatarUrl: null,
          emailVerifiedAt: '2026-01-01T00:00:00.000Z',
        },
        accessToken: 'token',
        isInitializing: false,
        sessionExpired: false,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/campaigns/camp-1/dm-screen']}>
        <Routes>
          <Route path="/campaigns/:id/dm-screen" element={<DmScreenPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('DmScreenPage', () => {
  beforeEach(() => {
    mockUseWebSocket.mockReturnValue({ isConnected: true });
    mockUseGetDmNotesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
    });
    mockUseGetCharactersQuery.mockReturnValue({
      data: { data: [], nextCursor: null, hasMore: false },
      isLoading: false,
      isError: false,
    });
  });

  it('shows DM Screen for campaign owner', () => {
    mockUseGetCampaignQuery.mockReturnValue({
      data: {
        data: {
          id: 'camp-1',
          name: 'Curse of Strahd',
          description: null,
          bannerUrl: null,
          setting: null,
          ownerId: 'dm-1',
          inviteToken: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      isLoading: false,
      isError: false,
    });

    renderPage('dm-1');

    expect(screen.getByRole('heading', { name: 'Curse of Strahd' })).toBeInTheDocument();
    expect(screen.getByText('DM Screen')).toBeInTheDocument();
    expect(mockUseWebSocket).toHaveBeenCalledWith('camp-1');
  });

  it('shows not found for non-DM member', () => {
    mockUseGetCampaignQuery.mockReturnValue({
      data: {
        data: {
          id: 'camp-1',
          name: 'Curse of Strahd',
          description: null,
          bannerUrl: null,
          setting: null,
          ownerId: 'dm-1',
          inviteToken: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      isLoading: false,
      isError: false,
    });

    renderPage('player-1');

    expect(screen.getByRole('heading', { name: 'Campaign not found' })).toBeInTheDocument();
    expect(mockUseWebSocket).toHaveBeenCalledWith(undefined);
  });

  it('shows reconnect banner when socket disconnected', () => {
    mockUseWebSocket.mockReturnValue({ isConnected: false });
    mockUseGetCampaignQuery.mockReturnValue({
      data: {
        data: {
          id: 'camp-1',
          name: 'Curse of Strahd',
          description: null,
          bannerUrl: null,
          setting: null,
          ownerId: 'dm-1',
          inviteToken: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      isLoading: false,
      isError: false,
    });

    renderPage('dm-1');

    expect(screen.getByRole('status')).toHaveTextContent(
      'Live updates disconnected. Reconnecting...',
    );
  });
});
