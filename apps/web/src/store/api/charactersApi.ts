import type { CreateCharacterInput, UpdateCharacterInput } from '@dnd-companion/shared';

import type { ApiResponse, Character } from '../../types/api';
import { baseApi } from './baseApi';

export const charactersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
});

export const { useGetCharacterQuery, useCreateCharacterMutation, useUpdateCharacterMutation } =
  charactersApi;
