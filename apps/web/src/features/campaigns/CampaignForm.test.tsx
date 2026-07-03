import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { CampaignForm } from '@/features/campaigns/CampaignForm';
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

describe('CampaignForm', () => {
  it('shows English validation errors when name is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(<CampaignForm submitLabel="Create Campaign" onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Create Campaign' }));

    expect(await screen.findByText('Campaign name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
