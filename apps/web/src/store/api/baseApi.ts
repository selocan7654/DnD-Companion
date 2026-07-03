import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

import type { RootState } from '../index';
import { clearCredentials, setAccessToken, setCredentials, setSessionExpired } from '../authSlice';
import type { ApiResponse } from '../../types/api';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const url = typeof args === 'string' ? args : args.url;
  const isRefreshRequest = url === '/auth/refresh';

  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && !isRefreshRequest) {
    const refreshResult = await baseQuery(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      const refreshData = refreshResult.data as ApiResponse<{ accessToken: string }>;
      const state = api.getState() as RootState;

      if (state.auth.user) {
        api.dispatch(
          setCredentials({
            user: state.auth.user,
            accessToken: refreshData.data.accessToken,
          }),
        );
      } else {
        api.dispatch(setAccessToken(refreshData.data.accessToken));
      }

      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearCredentials());
      api.dispatch(setSessionExpired(true));
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Campaign', 'CampaignList', 'CampaignMember', 'Character', 'CharacterList'],
  endpoints: () => ({}),
});
