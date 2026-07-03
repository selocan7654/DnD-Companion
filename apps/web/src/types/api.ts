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
