import { Navigate } from 'react-router-dom';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

export function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading session" />;
  }

  return <Navigate to={isAuthenticated ? '/my-campaigns' : '/login'} replace />;
}
