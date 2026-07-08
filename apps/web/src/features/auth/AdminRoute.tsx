import { Navigate, Outlet } from 'react-router-dom';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

/** UX-only guard — backend RolesGuard is the security boundary. */
export function AdminRoute() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading session" />;
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/my-campaigns" replace />;
  }

  return <Outlet />;
}
