import type {
  ApiResponse,
  HomebrewGalleryQuery,
  HomebrewItem,
  HomebrewListItem,
  MyCreationsQuery,
  PaginatedResponse,
} from '../../types/api';
import type { CreateHomebrewInput, UpdateHomebrewInput } from '@dnd-companion/shared';
import { baseApi } from './baseApi';

export const homebrewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHomebrewGallery: builder.query<
      PaginatedResponse<HomebrewListItem>,
      HomebrewGalleryQuery | void
    >({
      query: (params) => ({
        url: '/homebrew',
        params: params ?? {},
      }),
      providesTags: ['HomebrewList'],
    }),
    getHomebrewDetail: builder.query<ApiResponse<HomebrewItem>, string>({
      query: (id) => `/homebrew/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Homebrew', id }],
    }),
    getMyCreations: builder.query<PaginatedResponse<HomebrewItem>, MyCreationsQuery | void>({
      query: (params) => ({
        url: '/homebrew/my-creations',
        params: params ?? {},
      }),
      providesTags: ['MyCreations'],
    }),
    createHomebrew: builder.mutation<ApiResponse<HomebrewItem>, CreateHomebrewInput>({
      query: (body) => ({
        url: '/homebrew',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['HomebrewList', 'MyCreations'],
    }),
    updateHomebrew: builder.mutation<
      ApiResponse<HomebrewItem>,
      { id: string; body: UpdateHomebrewInput }
    >({
      query: ({ id, body }) => ({
        url: `/homebrew/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'HomebrewList',
        'MyCreations',
        { type: 'Homebrew', id },
      ],
    }),
    deleteHomebrew: builder.mutation<void, string>({
      query: (id) => ({
        url: `/homebrew/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['HomebrewList', 'MyCreations'],
    }),
    publishHomebrew: builder.mutation<
      ApiResponse<{ id: string; status: string; publishedAt?: string }>,
      string
    >({
      query: (id) => ({
        url: `/homebrew/${id}/publish`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        'HomebrewList',
        'MyCreations',
        { type: 'Homebrew', id },
      ],
    }),
    unpublishHomebrew: builder.mutation<ApiResponse<{ id: string; status: string }>, string>({
      query: (id) => ({
        url: `/homebrew/${id}/unpublish`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        'HomebrewList',
        'MyCreations',
        { type: 'Homebrew', id },
      ],
    }),
  }),
});

export const {
  useGetHomebrewGalleryQuery,
  useGetHomebrewDetailQuery,
  useGetMyCreationsQuery,
  useCreateHomebrewMutation,
  useUpdateHomebrewMutation,
  useDeleteHomebrewMutation,
  usePublishHomebrewMutation,
  useUnpublishHomebrewMutation,
} = homebrewApi;
