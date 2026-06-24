import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { User } from '../types/api';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitializing: boolean;
  sessionExpired: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isInitializing: true,
  sessionExpired: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.sessionExpired = false;
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      state.sessionExpired = false;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setInitialized: (state) => {
      state.isInitializing = false;
    },
    setSessionExpired: (state, action: PayloadAction<boolean>) => {
      state.sessionExpired = action.payload;
    },
  },
});

export const {
  setCredentials,
  setAccessToken,
  clearCredentials,
  updateUser,
  setInitialized,
  setSessionExpired,
} = authSlice.actions;

export default authSlice.reducer;
