import type { ApiResponse } from '../../types/api';
import type { ChangePasswordInput, UpdateProfileInput } from '@dnd-companion/shared';
import { baseApi } from './baseApi';

export interface MeProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface PublicUserProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<ApiResponse<MeProfile>, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation<ApiResponse<MeProfile>, UpdateProfileInput>({
      query: (body) => ({
        url: '/users/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation<void, ChangePasswordInput>({
      query: (body) => ({
        url: '/users/me/password',
        method: 'PATCH',
        body,
      }),
    }),
    getPublicUser: builder.query<ApiResponse<PublicUserProfile>, string>({
      query: (id) => `/users/${id}`,
    }),
  }),
});

export const {
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useGetPublicUserQuery,
} = usersApi;
