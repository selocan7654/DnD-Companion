import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { InviteLinkManager } from '@/features/campaigns/InviteLinkManager';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';

function renderWithStore(ui: React.ReactElement) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('InviteLinkManager', () => {
  it('does not render invite controls for non-DM users', () => {
    renderWithStore(
      <InviteLinkManager campaignId="campaign-1" inviteToken="abc123" isOwner={false} />,
    );

    expect(
      screen.queryByRole('button', { name: 'Regenerate invite link' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Invite players')).not.toBeInTheDocument();
  });

  it('renders invite controls for campaign owner', () => {
    renderWithStore(
      <InviteLinkManager campaignId="campaign-1" inviteToken="abc123" isOwner={true} />,
    );

    expect(screen.getByText('Invite players')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Regenerate invite link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy invite link' })).toBeInTheDocument();
  });
});
