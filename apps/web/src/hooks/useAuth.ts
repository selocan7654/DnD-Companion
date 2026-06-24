import { useAppSelector } from '../store/hooks';

export function useAuth() {
  const { user, accessToken, isInitializing, sessionExpired } = useAppSelector(
    (state) => state.auth,
  );

  return {
    user,
    accessToken,
    isAuthenticated: !!accessToken,
    isAdmin: user?.role === 'ADMIN',
    isEmailVerified: !!user?.emailVerifiedAt,
    isLoading: isInitializing,
    sessionExpired,
  };
}
