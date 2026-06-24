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
