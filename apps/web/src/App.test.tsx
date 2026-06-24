import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { LoginPage } from '@/pages/auth/LoginPage';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';

describe('App shell', () => {
  it('renders login page content', () => {
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
          <LoginPage />
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByRole('heading', { name: 'Log in to DnD Companion' })).toBeInTheDocument();
  });
});
