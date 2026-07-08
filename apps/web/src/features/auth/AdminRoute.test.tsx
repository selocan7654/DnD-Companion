import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AdminRoute } from '@/features/auth/AdminRoute';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';
import type { User } from '@/types/api';

function renderAdminRoute(user: User | null, accessToken: string | null) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: {
      auth: {
        user,
        accessToken,
        isInitializing: false,
        sessionExpired: false,
      },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/admin/users']}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/admin/users" element={<div>Admin content</div>} />
          </Route>
          <Route path="/my-campaigns" element={<div>Campaigns home</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('AdminRoute', () => {
  it('renders children for ADMIN users', () => {
    renderAdminRoute(
      {
        id: 'admin-1',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
        avatarUrl: null,
        emailVerifiedAt: '2026-01-01T00:00:00.000Z',
      },
      'token',
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('redirects USER role away from admin routes', () => {
    renderAdminRoute(
      {
        id: 'user-1',
        email: 'user@example.com',
        username: 'player',
        role: 'USER',
        avatarUrl: null,
        emailVerifiedAt: '2026-01-01T00:00:00.000Z',
      },
      'token',
    );

    expect(screen.getByText('Campaigns home')).toBeInTheDocument();
    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });
});
