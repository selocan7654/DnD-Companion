import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { clearCredentials, setSessionExpired } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

export function SessionExpiredModal() {
  const { sessionExpired } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  if (!sessionExpired) {
    return null;
  }

  const handleLogin = () => {
    dispatch(clearCredentials());
    dispatch(setSessionExpired(false));
    navigate('/login');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-expired-title"
        className="mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
      >
        <h2 id="session-expired-title" className="text-lg font-semibold">
          Session expired
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your session has expired. Please log in again.
        </p>
        <Button className="mt-6 w-full" onClick={handleLogin}>
          Log in
        </Button>
      </div>
    </div>
  );
}
