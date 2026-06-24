import { Link, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/store/api/authApi';
import { clearCredentials } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

export function AppLayout() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Session may already be invalid — still clear local state.
    } finally {
      dispatch(clearCredentials());
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="text-lg font-semibold">
            DnD Companion
          </Link>
          <div className="flex items-center gap-3">
            {user ? <span className="text-sm text-muted-foreground">{user.username}</span> : null}
            <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
