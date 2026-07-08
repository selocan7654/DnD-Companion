import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { ReferenceListContent } from '@/pages/reference/ReferenceListPage';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';

const mockUseGetReferenceListQuery = vi.fn();
const mockUseGetReferenceClassesQuery = vi.fn();
const mockUseGetReferenceRacesQuery = vi.fn();

vi.mock('@/store/api/referenceApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/api/referenceApi')>();
  return {
    ...actual,
    useGetReferenceListQuery: (...args: unknown[]) => mockUseGetReferenceListQuery(...args),
    useGetReferenceClassesQuery: (...args: unknown[]) => mockUseGetReferenceClassesQuery(...args),
    useGetReferenceRacesQuery: (...args: unknown[]) => mockUseGetReferenceRacesQuery(...args),
  };
});

describe('ReferenceListContent', () => {
  beforeEach(() => {
    mockUseGetReferenceListQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 'spell-1',
            name: 'Fireball',
            type: 'SPELL',
            source: 'PHB',
            description: 'A bright streak flashes from your pointing finger.',
            imageUrl: null,
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
    mockUseGetReferenceClassesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUseGetReferenceRacesQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it('renders reference list without auth token', async () => {
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
        <MemoryRouter initialEntries={['/reference/spells']}>
          <Routes>
            <Route path="/reference/:type" element={<ReferenceListContent />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: 'D&D 5e Reference' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Fireball')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Spells' })).toHaveAttribute('aria-current', 'page');
  });
});
