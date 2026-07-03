import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { router } from '@/routes';
import { useRefreshMutation } from '@/store/api/authApi';
import { setAccessToken, setInitialized } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [refresh] = useRefreshMutation();
  const { isLoading } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const result = await refresh().unwrap();
        if (!cancelled) {
          dispatch(setAccessToken(result.data.accessToken));
        }
      } catch {
        // No valid session — user stays logged out.
      } finally {
        if (!cancelled) {
          dispatch(setInitialized());
        }
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [dispatch, refresh]);

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading session" />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <AppBootstrap>
      <RouterProvider router={router} />
    </AppBootstrap>
  );
}
