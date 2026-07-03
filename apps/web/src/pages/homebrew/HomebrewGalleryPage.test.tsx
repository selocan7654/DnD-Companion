import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { HomebrewGalleryContent } from '@/pages/homebrew/HomebrewGalleryPage';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';

const mockUseGetHomebrewGalleryQuery = vi.fn();

vi.mock('@/store/api/homebrewApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/api/homebrewApi')>();
  return {
    ...actual,
    useGetHomebrewGalleryQuery: (...args: unknown[]) => mockUseGetHomebrewGalleryQuery(...args),
  };
});

describe('HomebrewGalleryContent', () => {
  beforeEach(() => {
    mockUseGetHomebrewGalleryQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 'item-1',
            name: 'Custom Fireball',
            type: 'SPELL',
            source: 'HOMEBREW',
            status: 'PUBLISHED',
            description: 'A stronger fireball.',
            imageUrl: null,
            ownerUsername: 'wizard42',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        nextCursor: null,
        hasMore: false,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('renders gallery content without auth token', async () => {
    const store = configureStore({
      reducer: {
        auth: authReducer,
        [baseApi.reducerPath]: baseApi.reducer,
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
      preloadedState: {
        auth: {
          user: null,
          accessToken: null,
          isInitializing: false,
          sessionExpired: false,
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <HomebrewGalleryContent />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: 'Homebrew Gallery' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Custom Fireball')).toBeInTheDocument();
    });

    expect(screen.queryByRole('link', { name: /create homebrew/i })).not.toBeInTheDocument();
  });
});
