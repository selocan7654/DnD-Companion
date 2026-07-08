import { HomebrewType, Source } from '@dnd-companion/shared';

import type { ReferenceTypeSlug } from '@/types/api';

export const REFERENCE_TYPE_TABS: { slug: ReferenceTypeSlug; label: string }[] = [
  { slug: 'spells', label: 'Spells' },
  { slug: 'monsters', label: 'Monsters' },
  { slug: 'feats', label: 'Feats' },
  { slug: 'backgrounds', label: 'Backgrounds' },
  { slug: 'magic-items', label: 'Magic Items' },
  { slug: 'subclasses', label: 'Subclasses' },
  { slug: 'classes', label: 'Classes' },
  { slug: 'races', label: 'Races' },
];

export const REFERENCE_SOURCE_OPTIONS = [
  { value: '', label: 'All sources' },
  { value: Source.PHB, label: 'PHB' },
  { value: Source.DMG, label: 'DMG' },
  { value: Source.MM, label: 'MM' },
  { value: Source.XGTE, label: 'XGtE' },
  { value: Source.TCOE, label: 'TCoE' },
] as const;

const SLUG_TO_HOMEBREW_TYPE: Record<
  Exclude<ReferenceTypeSlug, 'classes' | 'races'>,
  HomebrewType
> = {
  spells: HomebrewType.SPELL,
  monsters: HomebrewType.MONSTER,
  feats: HomebrewType.FEAT,
  backgrounds: HomebrewType.BACKGROUND,
  'magic-items': HomebrewType.MAGIC_ITEM,
  subclasses: HomebrewType.SUBCLASS,
};

export function formatReferenceTypeLabel(slug: string): string {
  const match = REFERENCE_TYPE_TABS.find((tab) => tab.slug === slug);
  return match?.label ?? slug;
}

export function homebrewTypeToReferenceSlug(
  type: HomebrewType,
): Exclude<ReferenceTypeSlug, 'classes' | 'races'> {
  const entry = Object.entries(SLUG_TO_HOMEBREW_TYPE).find(([, value]) => value === type);
  return (entry?.[0] as Exclude<ReferenceTypeSlug, 'classes' | 'races'>) ?? 'spells';
}

export function isValidReferenceType(value: string | undefined): value is ReferenceTypeSlug {
  return REFERENCE_TYPE_TABS.some((tab) => tab.slug === value);
}
