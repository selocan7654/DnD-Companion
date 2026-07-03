import { HomebrewType, Source } from '@dnd-companion/shared';

export const HOMEBREW_TYPE_OPTIONS = [
  { value: HomebrewType.SPELL, label: 'Spell' },
  { value: HomebrewType.MONSTER, label: 'Monster' },
  { value: HomebrewType.FEAT, label: 'Feat' },
  { value: HomebrewType.BACKGROUND, label: 'Background' },
  { value: HomebrewType.MAGIC_ITEM, label: 'Magic Item' },
  { value: HomebrewType.SUBCLASS, label: 'Subclass' },
] as const;

export const GALLERY_SOURCE_OPTIONS = [
  { value: '', label: 'All sources' },
  { value: Source.HOMEBREW, label: 'Homebrew' },
  { value: Source.PHB, label: 'PHB' },
  { value: Source.DMG, label: 'DMG' },
  { value: Source.MM, label: 'MM' },
  { value: Source.XGTE, label: 'XGtE' },
  { value: Source.TCOE, label: 'TCoE' },
] as const;

export function formatHomebrewType(type: string): string {
  const match = HOMEBREW_TYPE_OPTIONS.find((option) => option.value === type);
  return match?.label ?? type;
}

export function formatHomebrewSource(source: string): string {
  if (source === Source.HOMEBREW) {
    return 'Homebrew';
  }
  return source;
}

export function getDefaultHomebrewData(type: HomebrewType): Record<string, unknown> {
  switch (type) {
    case HomebrewType.SPELL:
      return {
        level: 0,
        school: '',
        casting_time: '',
        range: '',
        components: { V: false, S: false, M: false },
        duration: '',
        concentration: false,
        ritual: false,
        classes: [],
        description: '',
      };
    case HomebrewType.MONSTER:
      return {
        size: '',
        creature_type: '',
        alignment: '',
        armor_class: 10,
        hit_points: '',
        speed: { walk: '30 ft.' },
        ability_scores: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
        challenge_rating: '',
      };
    case HomebrewType.FEAT:
      return {
        prerequisite: '',
        benefit: '',
        category: '',
      };
    case HomebrewType.BACKGROUND:
      return {
        skill_proficiencies: [],
        feature_name: '',
        feature_description: '',
      };
    case HomebrewType.MAGIC_ITEM:
      return {
        rarity: '',
        type: '',
        attunement: false,
        properties: '',
      };
    case HomebrewType.SUBCLASS:
      return {
        parent_class: '',
        features: [{ level: 3, name: '', description: '' }],
      };
    default:
      return {};
  }
}

export function truncateText(text: string | null | undefined, maxLength = 120): string {
  if (!text) {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}…`;
}
