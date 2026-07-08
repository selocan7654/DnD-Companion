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
const mockChangeRole = vi.fn();
const mockToast = vi.fn();

vi.mock('@/hooks/use-toast', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}));

vi.mock('@/store/api/adminApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/api/adminApi')>();
  return {
    ...actual,
    useGetAdminUsersQuery: (...args: unknown[]) => mockUseGetAdminUsersQuery(...args),
    useChangeAdminUserRoleMutation: () => [mockChangeRole, { isLoading: false }],
    useDeactivateAdminUserMutation: () => [mockDeactivate, { isLoading: false }],
    useReactivateAdminUserMutation: () => [vi.fn(), { isLoading: false }],
  };
});

function renderPage() {
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

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    mockToast.mockReset();
    mockDeactivate.mockReset();
    mockChangeRole.mockReset();
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
    renderPage();

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

  it('shows empty state when no users match filters', () => {
    mockUseGetAdminUsersQuery.mockReturnValue({
      data: { data: [], nextCursor: null, hasMore: false },
      isLoading: false,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('No users found');
    expect(screen.getByText(/Try clearing search or filters/i)).toBeInTheDocument();
  });

  it('toasts LAST_ADMIN message when demoting the last admin fails', async () => {
    mockUseGetAdminUsersQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 'admin-2',
            email: 'other-admin@example.com',
            username: 'otheradmin',
            role: 'ADMIN',
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

    mockChangeRole.mockReturnValue({
      unwrap: () =>
        Promise.reject({
          status: 422,
          data: {
            statusCode: 422,
            error: 'LAST_ADMIN',
            message: 'Cannot remove the last admin from the system',
          },
        }),
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByRole('button', { name: 'Change to User' })[0]);
    const dialog = screen.getByRole('dialog', { name: 'Change role to USER?' });
    await user.click(within(dialog).getByRole('button', { name: 'Change to USER' }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Cannot change last admin',
          description: 'Cannot remove the last admin from the system',
        }),
      );
    });
  });
});
