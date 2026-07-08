import type {
  ApiResponse,
  CollectionItem,
  CollectionQuery,
  PaginatedResponse,
} from '../../types/api';
import { baseApi } from './baseApi';

export const collectionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCollection: builder.query<PaginatedResponse<CollectionItem>, CollectionQuery | void>({
      query: (params) => ({
        url: '/collections',
        params: params ?? {},
      }),
      providesTags: ['Collection'],
    }),
    addToCollection: builder.mutation<ApiResponse<CollectionItem>, string>({
      query: (homebrewItemId) => ({
        url: `/collections/${homebrewItemId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Collection'],
    }),
    removeFromCollection: builder.mutation<void, string>({
      query: (homebrewItemId) => ({
        url: `/collections/${homebrewItemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Collection'],
    }),
  }),
});

export const {
  useGetCollectionQuery,
  useAddToCollectionMutation,
  useRemoveFromCollectionMutation,
} = collectionsApi;
