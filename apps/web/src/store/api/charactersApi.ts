import type { CreateCharacterInput, UpdateCharacterInput } from '@dnd-companion/shared';

import type {
  ApiResponse,
  Character,
  CharacterListQuery,
  PaginatedResponse,
} from '../../types/api';
import { baseApi } from './baseApi';

export const charactersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCharacters: builder.query<PaginatedResponse<Character>, CharacterListQuery | void>({
      query: (params) => ({
        url: '/characters',
        params: params ?? {},
      }),
      providesTags: ['CharacterList'],
    }),
    getCharacter: builder.query<ApiResponse<Character>, string>({
      query: (id) => `/characters/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Character', id }],
    }),
    createCharacter: builder.mutation<ApiResponse<Character>, CreateCharacterInput>({
      query: (body) => ({
        url: '/characters',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CharacterList'],
    }),
    updateCharacter: builder.mutation<
      ApiResponse<Character>,
      { id: string; body: UpdateCharacterInput }
    >({
      query: ({ id, body }) => ({
        url: `/characters/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ['CharacterList', { type: 'Character', id }],
    }),
    deleteCharacter: builder.mutation<void, string>({
      query: (id) => ({
        url: `/characters/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CharacterList'],
    }),
    assignCampaign: builder.mutation<
      ApiResponse<Character>,
      { id: string; campaignId: string | null }
    >({
      query: ({ id, campaignId }) => ({
        url: `/characters/${id}/campaign`,
        method: 'PATCH',
        body: { campaignId },
      }),
      invalidatesTags: (_result, _error, { id, campaignId }) => [
        'CharacterList',
        { type: 'Character', id },
        'CampaignList',
        ...(campaignId ? [{ type: 'Campaign' as const, id: campaignId }] : []),
      ],
    }),
    setVisibility: builder.mutation<
      ApiResponse<Character>,
      { id: string; visibility: 'PUBLIC' | 'PRIVATE' }
    >({
      query: ({ id, visibility }) => ({
        url: `/characters/${id}/visibility`,
        method: 'PATCH',
        body: { visibility },
      }),
      invalidatesTags: (_result, _error, { id }) => ['CharacterList', { type: 'Character', id }],
    }),
  }),
});

export const {
  useGetCharactersQuery,
  useGetCharacterQuery,
  useCreateCharacterMutation,
  useUpdateCharacterMutation,
  useDeleteCharacterMutation,
  useAssignCampaignMutation,
  useSetVisibilityMutation,
} = charactersApi;
