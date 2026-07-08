import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';

const mockUseGetAdminUsersQuery = vi.fn();
const mockDeactivate = vi.fn();

vi.mock('@/store/api/adminApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/api/adminApi')>();
  return {
    ...actual,
    useGetAdminUsersQuery: (...args: unknown[]) => mockUseGetAdminUsersQuery(...args),
    useChangeAdminUserRoleMutation: () => [vi.fn(), { isLoading: false }],
    useDeactivateAdminUserMutation: () => [mockDeactivate, { isLoading: false }],
    useReactivateAdminUserMutation: () => [vi.fn(), { isLoading: false }],
  };
});

describe('AdminUsersPage', () => {
  beforeEach(() => {
    mockDeactivate.mockReset();
    mockDeactivate.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          data: {
            id: 'user-1',
            email: 'player@example.com',
            username: 'player',
            role: 'USER',
            avatarUrl: null,
            emailVerifiedAt: '2026-01-01T00:00:00.000Z',
            isActive: false,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        }),
    });

    mockUseGetAdminUsersQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 'user-1',
            email: 'player@example.com',
            username: 'player',
            role: 'USER',
            avatarUrl: null,
            emailVerifiedAt: '2026-01-01T00:00:00.000Z',
            isActive: true,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
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

  it('calls deactivate mutation after confirm dialog', async () => {
    const user = userEvent.setup();
    const store = configureStore({
      reducer: {
        auth: authReducer,
        [baseApi.reducerPath]: baseApi.reducer,
      },
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
      preloadedState: {
        auth: {
          user: {
            id: 'admin-1',
            email: 'admin@example.com',
            username: 'admin',
            role: 'ADMIN' as const,
            avatarUrl: null,
            emailVerifiedAt: '2026-01-01T00:00:00.000Z',
          },
          accessToken: 'token',
          isInitializing: false,
          sessionExpired: false,
        },
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter>
          <AdminUsersPage />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: 'User Management' })).toBeInTheDocument();
    expect(screen.getAllByText('player@example.com').length).toBeGreaterThan(0);

    const deactivateButtons = screen.getAllByRole('button', { name: 'Deactivate' });
    await user.click(deactivateButtons[0]);

    const dialog = screen.getByRole('dialog', { name: 'Deactivate user?' });
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));

    await waitFor(() => {
      expect(mockDeactivate).toHaveBeenCalledWith('user-1');
    });
  });
});
