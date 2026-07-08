import { Link, NavLink } from 'react-router-dom';
import {
  BookMarked,
  BookOpen,
  Library,
  LayoutGrid,
  LogOut,
  ScrollText,
  Shield,
  Swords,
  UserCircle,
  Users,
} from 'lucide-react';

import { EmailVerificationBanner } from '@/components/EmailVerificationBanner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { disconnectSocket } from '@/lib/socket';
import { useLogoutMutation } from '@/store/api/authApi';
import { clearCredentials } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

const APP_NAV_ITEMS = [
  { to: '/my-campaigns', label: 'My Campaigns', icon: LayoutGrid },
  { to: '/my-characters', label: 'My Characters', icon: Users },
  { to: '/reference/spells', label: 'Reference', icon: Library },
  { to: '/homebrew', label: 'Homebrew Gallery', icon: BookOpen },
  { to: '/my-creations', label: 'My Creations', icon: ScrollText },
  { to: '/my-collection', label: 'My Collection', icon: BookMarked },
  { to: '/profile', label: 'Profile', icon: UserCircle },
] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
  }`;

interface AppChromeProps {
  children: React.ReactNode;
}

export function AppChrome({ children }: AppChromeProps) {
  const { user, isAdmin } = useAuth();
  const dispatch = useAppDispatch();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Session may already be invalid — still clear local state.
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
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/my-campaigns" className="flex items-center gap-2 text-lg font-semibold">
            <Swords className="h-5 w-5" aria-hidden="true" />
            DnD Companion
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/profile"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {user.username}
              </Link>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-6 pb-20 lg:pb-6">
        <nav className="hidden w-48 shrink-0 lg:block" aria-label="Main navigation">
          <ul className="space-y-1">
            {APP_NAV_ITEMS.map(({ to, label }) => (
              <li key={to}>
                <NavLink to={to} className={navLinkClass}>
                  {label}
                </NavLink>
              </li>
            ))}
            {isAdmin ? (
              <li>
                <NavLink to="/admin/users" className={navLinkClass}>
                  <span className="inline-flex items-center gap-2">
                    <Shield className="h-4 w-4" aria-hidden="true" />
                    Admin Panel
                  </span>
                </NavLink>
              </li>
            ) : null}
          </ul>
        </nav>

        <main id="main-content" className="min-w-0 flex-1 pb-8" tabIndex={-1}>
          <EmailVerificationBanner />
          {children}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background lg:hidden"
        aria-label="Main navigation"
      >
        <ul className="mx-auto flex max-w-6xl">
          {APP_NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink to={to} className={mobileNavLinkClass}>
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
