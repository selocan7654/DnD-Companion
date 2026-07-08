import type {
  ApiResponse,
  Campaign,
  CampaignListItem,
  CampaignListQuery,
  CampaignMember,
  CreateDmNoteInput,
  DmNote,
  InvitePreview,
  InviteRegenerateResponse,
  PaginatedResponse,
  UpdateDmNoteInput,
} from '../../types/api';
import type { CreateCampaignInput, UpdateCampaignInput } from '@dnd-companion/shared';
import { baseApi } from './baseApi';

export const campaignsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCampaigns: builder.query<PaginatedResponse<CampaignListItem>, CampaignListQuery | void>({
      query: (params) => ({
        url: '/campaigns',
        params: params ?? {},
      }),
      providesTags: ['CampaignList'],
    }),
    getCampaign: builder.query<ApiResponse<Campaign>, string>({
      query: (id) => `/campaigns/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Campaign', id }],
    }),
    createCampaign: builder.mutation<ApiResponse<Campaign>, CreateCampaignInput>({
      query: (body) => ({
        url: '/campaigns',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CampaignList'],
    }),
    updateCampaign: builder.mutation<
      ApiResponse<Campaign>,
      { id: string; body: UpdateCampaignInput }
    >({
      query: ({ id, body }) => ({
        url: `/campaigns/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => ['CampaignList', { type: 'Campaign', id }],
    }),
    deleteCampaign: builder.mutation<void, string>({
      query: (id) => ({
        url: `/campaigns/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CampaignList'],
    }),
    regenerateInvite: builder.mutation<ApiResponse<InviteRegenerateResponse>, string>({
      query: (id) => ({
        url: `/campaigns/${id}/invite/regenerate`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Campaign', id }],
    }),
    disableInvite: builder.mutation<void, string>({
      query: (id) => ({
        url: `/campaigns/${id}/invite/disable`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Campaign', id }],
    }),
    getCampaignMembers: builder.query<ApiResponse<CampaignMember[]>, string>({
      query: (id) => `/campaigns/${id}/members`,
      providesTags: (_result, _error, id) => [{ type: 'CampaignMember', id }],
    }),
    removeCampaignMember: builder.mutation<void, { campaignId: string; userId: string }>({
      query: ({ campaignId, userId }) => ({
        url: `/campaigns/${campaignId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { campaignId }) => [
        'CampaignList',
        { type: 'Campaign', id: campaignId },
        { type: 'CampaignMember', id: campaignId },
      ],
    }),
    previewInvite: builder.query<ApiResponse<InvitePreview>, string>({
      query: (token) => `/invite/${token}`,
    }),
    joinCampaign: builder.mutation<ApiResponse<{ campaignId: string; joinedAt: string }>, string>({
      query: (token) => ({
        url: `/invite/${token}/join`,
        method: 'POST',
      }),
      invalidatesTags: ['CampaignList'],
    }),
    getDmNotes: builder.query<ApiResponse<DmNote[]>, string>({
      query: (campaignId) => `/campaigns/${campaignId}/dm-notes`,
      providesTags: (_result, _error, campaignId) => [{ type: 'DmNote', id: campaignId }],
    }),
    createDmNote: builder.mutation<
      ApiResponse<DmNote>,
      { campaignId: string; body: CreateDmNoteInput }
    >({
      query: ({ campaignId, body }) => ({
        url: `/campaigns/${campaignId}/dm-notes`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { campaignId }) => [{ type: 'DmNote', id: campaignId }],
    }),
    updateDmNote: builder.mutation<
      ApiResponse<DmNote>,
      { campaignId: string; noteId: string; body: UpdateDmNoteInput }
    >({
      query: ({ campaignId, noteId, body }) => ({
        url: `/campaigns/${campaignId}/dm-notes/${noteId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { campaignId }) => [{ type: 'DmNote', id: campaignId }],
    }),
    deleteDmNote: builder.mutation<void, { campaignId: string; noteId: string }>({
      query: ({ campaignId, noteId }) => ({
        url: `/campaigns/${campaignId}/dm-notes/${noteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { campaignId }) => [{ type: 'DmNote', id: campaignId }],
    }),
    reorderDmNotes: builder.mutation<
      ApiResponse<DmNote[]>,
      { campaignId: string; noteIds: string[] }
    >({
      query: ({ campaignId, noteIds }) => ({
        url: `/campaigns/${campaignId}/dm-notes/reorder`,
        method: 'PATCH',
        body: { noteIds },
      }),
      invalidatesTags: (_result, _error, { campaignId }) => [{ type: 'DmNote', id: campaignId }],
    }),
  }),
});

export const {
  useGetCampaignsQuery,
  useGetCampaignQuery,
  useCreateCampaignMutation,
  useUpdateCampaignMutation,
  useDeleteCampaignMutation,
  useRegenerateInviteMutation,
  useDisableInviteMutation,
  useGetCampaignMembersQuery,
  useRemoveCampaignMemberMutation,
  usePreviewInviteQuery,
  useJoinCampaignMutation,
  useGetDmNotesQuery,
  useCreateDmNoteMutation,
  useUpdateDmNoteMutation,
  useDeleteDmNoteMutation,
  useReorderDmNotesMutation,
} = campaignsApi;
