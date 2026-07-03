import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { VisibilityToggle } from '@/features/characters/VisibilityToggle';
import { useAuth } from '@/hooks/useAuth';
import authReducer, { setCredentials } from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';
import type { Character, User } from '@/types/api';

const owner: User = {
  id: 'owner-1',
  email: 'owner@example.com',
  username: 'owner1',
  role: 'USER',
  avatarUrl: null,
  emailVerifiedAt: '2026-01-01T00:00:00.000Z',
};

const stranger: User = {
  id: 'stranger-1',
  email: 'stranger@example.com',
  username: 'stranger',
  role: 'USER',
  avatarUrl: null,
  emailVerifiedAt: '2026-01-01T00:00:00.000Z',
};

const baseCharacter: Character = {
  id: 'char-1',
  ownerId: 'owner-1',
  ownerUsername: 'owner1',
  ownerAvatarUrl: null,
  campaignId: null,
  name: 'Thorin',
  race: 'Dwarf',
  className: 'Fighter',
  subclass: null,
  level: 5,
  background: null,
  alignment: null,
  experiencePoints: 0,
  abilityScores: null,
  hitPointsMax: 40,
  hitPointsCurrent: 40,
  temporaryHitPoints: null,
  armorClass: 18,
  speed: 25,
  proficiencyBonus: 3,
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
  visibility: 'PRIVATE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function CharacterDetailOwnerControls({ character }: { character: Character }) {
  const { user } = useAuth();
  const isOwner = user?.id === character.ownerId;

  if (!isOwner) {
    return null;
  }

  return <VisibilityToggle character={character} />;
}

function renderOwnerControls(viewer: User) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
  });

  store.dispatch(
    setCredentials({
      user: viewer,
      accessToken: 'test-token',
    }),
  );

  return render(
    <Provider store={store}>
      <CharacterDetailOwnerControls character={baseCharacter} />
    </Provider>,
  );
}

describe('Character detail owner controls', () => {
  it('hides visibility toggle for non-owner viewers', () => {
    renderOwnerControls(stranger);

    expect(screen.queryByRole('heading', { name: 'Visibility' })).not.toBeInTheDocument();
  });

  it('shows visibility toggle for character owner', () => {
    renderOwnerControls(owner);

    expect(screen.getByRole('heading', { name: 'Visibility' })).toBeInTheDocument();
  });
});
