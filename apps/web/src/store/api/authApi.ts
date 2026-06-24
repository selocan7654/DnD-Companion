import { baseApi } from './baseApi';
import type { ApiResponse, LoginResponse, RegisterResponse } from '../../types/api';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginResponse>, { email: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    register: builder.mutation<
      ApiResponse<RegisterResponse>,
      { email: string; username: string; password: string }
    >({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    refresh: builder.mutation<ApiResponse<{ accessToken: string }>, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    verifyEmail: builder.mutation<ApiResponse<{ message: string }>, { token: string }>({
      query: (body) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body,
      }),
    }),
    resendVerification: builder.mutation<ApiResponse<{ message: string }>, void>({
      query: () => ({
        url: '/auth/resend-verification',
        method: 'POST',
      }),
    }),
    requestPasswordReset: builder.mutation<ApiResponse<{ message: string }>, { email: string }>({
      query: (body) => ({
        url: '/auth/password-reset/request',
        method: 'POST',
        body,
      }),
    }),
    confirmPasswordReset: builder.mutation<
      ApiResponse<{ message: string }>,
      { token: string; newPassword: string }
    >({
      query: (body) => ({
        url: '/auth/password-reset/confirm',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshMutation,
  useLogoutMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useRequestPasswordResetMutation,
  useConfirmPasswordResetMutation,
} = authApi;
