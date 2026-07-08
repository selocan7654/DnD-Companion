export type LiveFieldsPayload = {
  hitPointsCurrent?: number | null;
  temporaryHitPoints?: number;
  deathSaves?: { successes: number; failures: number };
  conditions?: string[];
};

export type LiveUpdatePayload = {
  characterId: string;
  characterName: string;
  fields: LiveFieldsPayload;
  updatedBy: string;
};

export type MemberJoinedPayload = {
  userId: string;
  username: string;
  avatarUrl: string | null;
};

export type MemberLeftPayload = {
  userId: string;
  username: string;
};
