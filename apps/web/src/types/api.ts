export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: { field: string; issue: string }[];
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface RegisterResponse {
  id: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface CampaignListItem {
  id: string;
  name: string;
  setting: string | null;
  bannerUrl: string | null;
  role: 'DM' | 'PLAYER';
  memberCount: number;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  bannerUrl: string | null;
  setting: string | null;
  ownerId: string;
  inviteToken: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  assignedCharacterCount?: number;
}

export interface CampaignMember {
  userId: string;
  username: string;
  avatarUrl: string | null;
  joinedAt: string;
  role: 'DM' | 'PLAYER';
}

export interface InvitePreview {
  campaignId: string;
  campaignName: string;
  dmUsername: string;
  memberCount: number;
}

export interface InviteRegenerateResponse {
  inviteToken: string;
  inviteUrl: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CampaignListQuery {
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface CharacterListQuery {
  search?: string;
  campaignId?: string;
  cursor?: string;
  limit?: number;
}

export type AbilityScoreKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface AbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface EquipmentEntry {
  name: string;
  quantity: number;
  equipped?: boolean;
  notes?: string;
}

export interface KnownSpellEntry {
  name: string;
  level: number;
  prepared?: boolean;
}

export interface SpellSlotEntry {
  max: number;
  used: number;
}

export type HomebrewType = 'SPELL' | 'MONSTER' | 'FEAT' | 'BACKGROUND' | 'MAGIC_ITEM' | 'SUBCLASS';

export type HomebrewStatus = 'DRAFT' | 'PUBLISHED';

export type HomebrewSource =
  | 'PHB'
  | 'DMG'
  | 'MM'
  | 'XGTE'
  | 'TCOE'
  | 'FTOD'
  | 'VRGR'
  | 'MPMM'
  | 'SCAG'
  | 'ERLW'
  | 'EGW'
  | 'GGR'
  | 'SAiS'
  | 'SatO'
  | 'AAG'
  | 'BGG'
  | 'PAitM'
  | 'BMT'
  | 'PHB2024'
  | 'DMG2024'
  | 'MM2024'
  | 'HOMEBREW';

export interface HomebrewListItem {
  id: string;
  name: string;
  type: HomebrewType;
  source: HomebrewSource;
  status: HomebrewStatus;
  description: string | null;
  imageUrl: string | null;
  ownerUsername: string | null;
  createdAt: string;
}

export interface HomebrewItem extends HomebrewListItem {
  data: Record<string, unknown>;
  ownerId: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface HomebrewGalleryQuery {
  search?: string;
  type?: HomebrewType;
  source?: HomebrewSource;
  sort?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
  cursor?: string;
  limit?: number;
}

export interface MyCreationsQuery {
  search?: string;
  type?: HomebrewType;
  status?: HomebrewStatus;
  cursor?: string;
  limit?: number;
}

export interface CollectionItem {
  homebrewItemId: string;
  name: string;
  type: HomebrewType;
  source: HomebrewSource;
  status: HomebrewStatus;
  isUnpublished: boolean;
  ownerUsername: string | null;
  addedAt: string;
}

export interface CollectionQuery {
  search?: string;
  type?: HomebrewType;
  cursor?: string;
  limit?: number;
}

export type ReferenceTypeSlug =
  | 'spells'
  | 'monsters'
  | 'feats'
  | 'backgrounds'
  | 'magic-items'
  | 'subclasses'
  | 'classes'
  | 'races';

export interface ReferenceListItem {
  id: string;
  name: string;
  type: HomebrewType;
  source: HomebrewSource;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface ReferenceItem extends ReferenceListItem {
  data: Record<string, unknown>;
  publishedAt: string | null;
  updatedAt: string;
}

export interface ReferenceListQuery {
  search?: string;
  source?: HomebrewSource;
  sort?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
  cursor?: string;
  limit?: number;
  level?: number;
  school?: string;
  class?: string;
  challengeRating?: string;
  creatureType?: string;
  size?: string;
  rarity?: string;
  parentClass?: string;
}

export interface DndClassRef {
  name: string;
  hitDie: number;
  primaryAbility: string;
  savingThrows: [string, string];
}

export interface DndRaceRef {
  name: string;
  speed: number;
  size: string;
  source: string;
}

export interface Character {
  id: string;
  ownerId: string;
  ownerUsername: string;
  ownerAvatarUrl: string | null;
  campaignId: string | null;
  name: string;
  race: string | null;
  className: string | null;
  subclass: string | null;
  level: number;
  background: string | null;
  alignment: string | null;
  experiencePoints: number;
  abilityScores: AbilityScores | null;
  hitPointsMax: number | null;
  hitPointsCurrent: number | null;
  temporaryHitPoints: number | null;
  armorClass: number | null;
  speed: number | null;
  proficiencyBonus: number | null;
  savingThrows: Partial<Record<AbilityScoreKey, boolean>> | null;
  skills: Record<string, { proficient: boolean; expertise?: boolean }> | null;
  featuresAndTraits: Array<{ name: string; description: string; source?: string }> | null;
  equipment: EquipmentEntry[] | null;
  spellSlots: Record<string, SpellSlotEntry> | null;
  knownSpells: KnownSpellEntry[] | null;
  deathSaves: { successes: number; failures: number } | null;
  conditions: string[] | null;
  notes: string | null;
  portraitUrl: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
  updatedAt: string;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface LiveFieldsUpdate {
  hitPointsCurrent?: number | null;
  temporaryHitPoints?: number;
  deathSaves?: DeathSaves;
  conditions?: string[];
}

export interface LiveFieldsResponse {
  hitPointsCurrent: number | null;
  temporaryHitPoints: number | null;
  deathSaves: DeathSaves | null;
  conditions: string[] | null;
}

/** Batch format preferred; single field+value also accepted (docs/03 §14). */
export type LiveUpdatePayload = {
  characterId: string;
  characterName: string;
  updatedBy: string;
} & (
  | { fields: LiveFieldsUpdate; field?: never; value?: never }
  | { field: keyof LiveFieldsUpdate; value: unknown; fields?: never }
);

export interface DmNote {
  id: string;
  campaignId: string;
  title: string;
  content: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDmNoteInput {
  title: string;
  content?: string;
  sortOrder?: number;
}

export interface UpdateDmNoteInput {
  title?: string;
  content?: string;
}
