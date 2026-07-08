import { Link, Outlet } from 'react-router-dom';
import { LogOut, Swords } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/store/api/authApi';
import { clearCredentials } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { disconnectSocket } from '@/lib/socket';

/** Full-width shell for DM Screen — sidebar and bottom nav hidden (docs/06 §6.1). */
export function FullWidthLayout() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Session may already be invalid.
    } finally {
      disconnectSocket();
      dispatch(clearCredentials());
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4"
      >
        Skip to main content
      </a>

      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link to="/my-campaigns" className="flex items-center gap-2 text-lg font-semibold">
            <Swords className="h-5 w-5" aria-hidden="true" />
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

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-4" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
