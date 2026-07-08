import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { ProfilePage } from '@/pages/profile/ProfilePage';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';

const verifiedUser = {
  id: 'user-1',
  email: 'player@example.com',
  username: 'player42',
  role: 'USER' as const,
  avatarUrl: null,
  emailVerifiedAt: '2026-06-14T10:05:00.000Z',
};

const mockUseGetMeQuery = vi.fn();
const mockUseUpdateProfileMutation = vi.fn();
const mockUseChangePasswordMutation = vi.fn();
const mockUseDeactivateAccountMutation = vi.fn();

vi.mock('@/store/api/usersApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/api/usersApi')>();
  return {
    ...actual,
    useGetMeQuery: (...args: unknown[]) => mockUseGetMeQuery(...args),
    useUpdateProfileMutation: (...args: unknown[]) => mockUseUpdateProfileMutation(...args),
    useChangePasswordMutation: (...args: unknown[]) => mockUseChangePasswordMutation(...args),
    useDeactivateAccountMutation: (...args: unknown[]) => mockUseDeactivateAccountMutation(...args),
  };
});

vi.mock('@/store/api/authApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/api/authApi')>();
  return {
    ...actual,
    useResendVerificationMutation: () => [vi.fn(), { isLoading: false }],
  };
});

function renderProfilePage() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: {
      auth: {
        user: verifiedUser,
        accessToken: 'test-token',
        isInitializing: false,
        sessionExpired: false,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('ProfilePage', () => {
  beforeEach(() => {
    mockUseGetMeQuery.mockReturnValue({
      data: {
        data: {
          ...verifiedUser,
          isActive: true,
          createdAt: '2026-06-14T10:00:00.000Z',
        },
      },
      isLoading: false,
      isError: false,
    });
    mockUseUpdateProfileMutation.mockReturnValue([vi.fn(), { isLoading: false }]);
    mockUseChangePasswordMutation.mockReturnValue([vi.fn(), { isLoading: false }]);
    mockUseDeactivateAccountMutation.mockReturnValue([vi.fn(), { isLoading: false }]);
  });

  it('shows English validation error when new password is shorter than 8 characters', async () => {
    const user = userEvent.setup();
    renderProfilePage();

    expect(await screen.findByRole('heading', { name: 'My Profile' })).toBeInTheDocument();

    const passwordForm = screen.getByRole('button', { name: 'Change Password' }).closest('form');
    const currentInput = passwordForm?.querySelector('#current-password') as HTMLInputElement;
    const newInput = passwordForm?.querySelector('#new-password') as HTMLInputElement;
    const confirmInput = passwordForm?.querySelector('#confirm-new-password') as HTMLInputElement;

    await user.type(currentInput, 'OldPassword1');
    await user.type(newInput, 'short');
    await user.type(confirmInput, 'short');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('shows mismatch error when confirm password differs', async () => {
    const user = userEvent.setup();
    renderProfilePage();

    await screen.findByRole('heading', { name: 'My Profile' });

    const passwordForm = screen.getByRole('button', { name: 'Change Password' }).closest('form');
    const currentInput = passwordForm?.querySelector('#current-password') as HTMLInputElement;
    const newInput = passwordForm?.querySelector('#new-password') as HTMLInputElement;
    const confirmInput = passwordForm?.querySelector('#confirm-new-password') as HTMLInputElement;

    await user.type(currentInput, 'OldPassword1');
    await user.type(newInput, 'NewPassword1');
    await user.type(confirmInput, 'DifferentPass');
    await user.click(screen.getByRole('button', { name: 'Change Password' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  it('opens deactivate confirmation dialog with English copy', async () => {
    const user = userEvent.setup();
    renderProfilePage();

    await screen.findByRole('heading', { name: 'My Profile' });

    await user.click(screen.getByRole('button', { name: 'Deactivate Account' }));

    expect(
      await screen.findByRole('dialog', { name: 'Deactivate your account?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This will log you out and prevent future login. Your content will be hidden. Are you sure?',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });
});
