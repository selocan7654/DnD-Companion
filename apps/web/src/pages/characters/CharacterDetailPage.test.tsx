import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { CharacterDetailPage } from '@/pages/characters/CharacterDetailPage';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';
import type { Character } from '@/types/api';

const publicCharacter: Character = {
  id: 'char-public-1',
  ownerId: 'owner-1',
  ownerUsername: 'bard42',
  ownerAvatarUrl: null,
  campaignId: null,
  name: 'Lyra Moonwhisper',
  race: 'Elf',
  className: 'Bard',
  subclass: null,
  level: 3,
  background: 'Entertainer',
  alignment: 'Chaotic Good',
  experiencePoints: 0,
  abilityScores: { STR: 8, DEX: 14, CON: 12, INT: 10, WIS: 11, CHA: 16 },
  hitPointsMax: 22,
  hitPointsCurrent: 22,
  temporaryHitPoints: null,
  armorClass: 13,
  speed: 30,
  proficiencyBonus: 2,
  savingThrows: null,
  skills: null,
  featuresAndTraits: null,
  equipment: null,
  spellSlots: null,
  knownSpells: null,
  deathSaves: null,
  conditions: null,
  notes: null,
  portraitUrl: null,
  visibility: 'PUBLIC',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const useGetCharacterQueryMock = vi.fn();

vi.mock('@/store/api/charactersApi', () => ({
  useGetCharacterQuery: (...args: unknown[]) => useGetCharacterQueryMock(...args),
  useDeleteCharacterMutation: () => [vi.fn(), { isLoading: false }],
}));

vi.mock('@/store/api/campaignsApi', () => ({
  useGetCampaignQuery: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isAdmin: false,
    isEmailVerified: false,
    isLoading: false,
  }),
}));

function renderGuestDetail() {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/characters/char-public-1']}>
        <Routes>
          <Route path="/characters/:id" element={<CharacterDetailPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('CharacterDetailPage — guest access', () => {
  beforeEach(() => {
    useGetCharacterQueryMock.mockReturnValue({
      data: { data: publicCharacter },
      isLoading: false,
      isError: false,
    });
  });

  it('renders PUBLIC character without authentication', async () => {
    renderGuestDetail();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Lyra Moonwhisper' })).toBeInTheDocument();
    });

    expect(screen.getByText('Created by @bard42')).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Campaign Assignment' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Visibility' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});
