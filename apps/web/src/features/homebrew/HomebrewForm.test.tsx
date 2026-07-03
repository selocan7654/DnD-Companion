import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { HomebrewForm } from '@/features/homebrew/HomebrewForm';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';

function renderWithProviders(ui: ReactElement) {
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

  return render(<Provider store={store}>{ui}</Provider>);
}

describe('HomebrewForm', () => {
  it('shows English validation errors when name is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(<HomebrewForm submitLabel="Create as Draft" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Create as Draft' }));

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
