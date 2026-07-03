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
