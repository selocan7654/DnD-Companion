import { Link, NavLink, Outlet } from 'react-router-dom';
import { LogOut, Swords } from 'lucide-react';

import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLogoutMutation } from '@/store/api/authApi';
import { clearCredentials } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4"
      >
        Skip to main content
      </a>

      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
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

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6">
        <nav className="hidden w-48 shrink-0 lg:block" aria-label="Main navigation">
          <ul className="space-y-1">
            <li>
              <NavLink to="/my-campaigns" className={navLinkClass}>
                My Campaigns
              </NavLink>
            </li>
          </ul>
        </nav>

        <main id="main-content" className="min-w-0 flex-1 pb-8" tabIndex={-1}>
          <EmailVerificationBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
