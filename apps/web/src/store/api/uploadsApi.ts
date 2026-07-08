import type { ApiResponse } from '../../types/api';
import type { PresignRequestInput, PresignResponse } from '@dnd-companion/shared';
import { baseApi } from './baseApi';

export const uploadsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    presignUpload: builder.mutation<ApiResponse<PresignResponse>, PresignRequestInput>({
      query: (body) => ({
        url: '/uploads/presign',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { usePresignUploadMutation } = uploadsApi;
