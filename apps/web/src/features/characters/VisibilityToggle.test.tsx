import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import { VisibilityToggle } from '@/features/characters/VisibilityToggle';
import authReducer from '@/store/authSlice';
import { baseApi } from '@/store/api/baseApi';
import type { Character } from '@/types/api';

const baseCharacter: Character = {
  id: 'char-1',
  ownerId: 'owner-1',
  ownerUsername: 'player1',
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

describe('VisibilityToggle', () => {
  it('renders visibility controls for character owner context', () => {
    renderWithStore(<VisibilityToggle character={baseCharacter} />);

    expect(screen.getByRole('heading', { name: 'Visibility' })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /private/i })).toBeInTheDocument();
    expect(screen.getByText('Make public')).toBeInTheDocument();
  });

  it('shows public state when character is public', () => {
    renderWithStore(<VisibilityToggle character={{ ...baseCharacter, visibility: 'PUBLIC' }} />);

    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /public/i })).toBeInTheDocument();
    expect(screen.getByText('Make private')).toBeInTheDocument();
  });
});
