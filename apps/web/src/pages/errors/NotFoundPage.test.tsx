import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { MinimalLayout } from '@/layouts/MinimalLayout';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';

function createTestStore(accessToken: string | null = null) {
  return configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: {
      auth: {
        user: null,
        accessToken,
        isInitializing: false,
        sessionExpired: false,
      },
    },
  });
}

function renderNotFoundPage(accessToken: string | null = null) {
  const store = createTestStore(accessToken);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/unknown-route']}>
        <Routes>
          <Route element={<MinimalLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('NotFoundPage', () => {
  it('renders the 404 message and guest home link', () => {
    renderNotFoundPage();

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(
      screen.getByText("The page you're looking for doesn't exist or you don't have access."),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go Home' })).toHaveAttribute('href', '/homebrew');
  });

  it('links authenticated users to my campaigns', () => {
    renderNotFoundPage('access-token');

    expect(screen.getByRole('link', { name: 'Go Home' })).toHaveAttribute('href', '/my-campaigns');
  });
});
