import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { MyCollectionPage, UnpublishedBadge } from '@/pages/collection/MyCollectionPage';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';

const mockUseGetCollectionQuery = vi.fn();
const mockUseRemoveFromCollectionMutation = vi.fn();

vi.mock('@/store/api/collectionsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/api/collectionsApi')>();
  return {
    ...actual,
    useGetCollectionQuery: (...args: unknown[]) => mockUseGetCollectionQuery(...args),
    useRemoveFromCollectionMutation: (...args: unknown[]) =>
      mockUseRemoveFromCollectionMutation(...args),
  };
});

function renderWithStore(
  ui: React.ReactElement,
  authOverrides?: Partial<{
    user: {
      id: string;
      email: string;
      username: string;
      role: 'ADMIN' | 'USER';
      avatarUrl: string | null;
      emailVerifiedAt: string | null;
    } | null;
  }>,
) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: {
      auth: {
        user: authOverrides?.user ?? {
          id: 'user-1',
          email: 'user@example.com',
          username: 'collector',
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
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>,
  );
}

describe('MyCollectionPage', () => {
  beforeEach(() => {
    mockUseRemoveFromCollectionMutation.mockReturnValue([vi.fn(), { isLoading: false }]);
    mockUseGetCollectionQuery.mockReturnValue({
      data: { data: [], nextCursor: null, hasMore: false },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('renders empty state with Browse Gallery CTA', async () => {
    renderWithStore(<MyCollectionPage />);

    expect(screen.getByRole('heading', { name: 'My Collection' })).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText(
          'Your collection is empty. Browse the Homebrew Gallery to find content you like.',
        ),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /browse gallery/i })).toHaveAttribute(
      'href',
      '/homebrew',
    );
  });

  it('renders Unpublished by author badge for unpublished items', async () => {
    mockUseGetCollectionQuery.mockReturnValue({
      data: {
        data: [
          {
            homebrewItemId: 'item-1',
            name: 'Shadow Bolt',
            type: 'SPELL',
            source: 'HOMEBREW',
            status: 'DRAFT',
            isUnpublished: true,
            ownerUsername: 'wizard42',
            addedAt: '2026-01-01T00:00:00.000Z',
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

    renderWithStore(<MyCollectionPage />);

    await waitFor(() => {
      expect(screen.getByText('Shadow Bolt')).toBeInTheDocument();
    });

    expect(screen.getByText('Unpublished by author')).toBeInTheDocument();
  });
});

describe('UnpublishedBadge', () => {
  it('shows Unpublished by author label', () => {
    render(<UnpublishedBadge />);
    expect(screen.getByText('Unpublished by author')).toBeInTheDocument();
  });
});
