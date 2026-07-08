import type {
  ApiResponse,
  AdminCampaignListItem,
  AdminCampaignListQuery,
  AdminCharacterListItem,
  AdminCharacterListQuery,
  AdminHomebrewListItem,
  AdminHomebrewListQuery,
  AdminUser,
  AdminUserListQuery,
  HomebrewStatus,
  PaginatedResponse,
} from '../../types/api';
import { baseApi } from './baseApi';

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminUsers: builder.query<PaginatedResponse<AdminUser>, AdminUserListQuery | void>({
      query: (params) => ({
        url: '/admin/users',
        params: params ?? {},
      }),
      providesTags: ['AdminUsers'],
    }),
    changeAdminUserRole: builder.mutation<
      ApiResponse<AdminUser>,
      { id: string; role: 'ADMIN' | 'USER' }
    >({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    deactivateAdminUser: builder.mutation<ApiResponse<AdminUser>, string>({
      query: (id) => ({
        url: `/admin/users/${id}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    reactivateAdminUser: builder.mutation<ApiResponse<AdminUser>, string>({
      query: (id) => ({
        url: `/admin/users/${id}/reactivate`,
        method: 'POST',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    getAdminCampaigns: builder.query<
      PaginatedResponse<AdminCampaignListItem>,
      AdminCampaignListQuery | void
    >({
      query: (params) => ({
        url: '/admin/campaigns',
        params: params ?? {},
      }),
      providesTags: ['AdminContent'],
    }),
    updateAdminCampaign: builder.mutation<
      ApiResponse<AdminCampaignListItem>,
      { id: string; body: { name?: string; description?: string | null; setting?: string | null } }
    >({
      query: ({ id, body }) => ({
        url: `/admin/campaigns/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminContent'],
    }),
    deleteAdminCampaign: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/campaigns/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminContent'],
    }),
    getAdminCharacters: builder.query<
      PaginatedResponse<AdminCharacterListItem>,
      AdminCharacterListQuery | void
    >({
      query: (params) => ({
        url: '/admin/characters',
        params: params ?? {},
      }),
      providesTags: ['AdminContent'],
    }),
    updateAdminCharacter: builder.mutation<
      ApiResponse<AdminCharacterListItem>,
      {
        id: string;
        body: { name?: string; visibility?: 'PUBLIC' | 'PRIVATE'; level?: number };
      }
    >({
      query: ({ id, body }) => ({
        url: `/admin/characters/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminContent'],
    }),
    deleteAdminCharacter: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/characters/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminContent'],
    }),
    getAdminHomebrew: builder.query<
      PaginatedResponse<AdminHomebrewListItem>,
      AdminHomebrewListQuery | void
    >({
      query: (params) => ({
        url: '/admin/homebrew',
        params: params ?? {},
      }),
      providesTags: ['AdminContent'],
    }),
    updateAdminHomebrew: builder.mutation<
      ApiResponse<AdminHomebrewListItem>,
      { id: string; body: { name?: string; description?: string | null } }
    >({
      query: ({ id, body }) => ({
        url: `/admin/homebrew/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminContent'],
    }),
    updateAdminHomebrewStatus: builder.mutation<
      ApiResponse<AdminHomebrewListItem>,
      { id: string; status: HomebrewStatus }
    >({
      query: ({ id, status }) => ({
        url: `/admin/homebrew/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['AdminContent'],
    }),
    deleteAdminHomebrew: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/homebrew/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminContent'],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useChangeAdminUserRoleMutation,
  useDeactivateAdminUserMutation,
  useReactivateAdminUserMutation,
  useGetAdminCampaignsQuery,
  useUpdateAdminCampaignMutation,
  useDeleteAdminCampaignMutation,
  useGetAdminCharactersQuery,
  useUpdateAdminCharacterMutation,
  useDeleteAdminCharacterMutation,
  useGetAdminHomebrewQuery,
  useUpdateAdminHomebrewMutation,
  useUpdateAdminHomebrewStatusMutation,
  useDeleteAdminHomebrewMutation,
} = adminApi;
