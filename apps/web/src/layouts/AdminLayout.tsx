import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, ScrollText, Shield, Users } from 'lucide-react';

import { AppChrome } from '@/layouts/AppChrome';

const ADMIN_NAV = [
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/campaigns', label: 'Campaigns', icon: Shield },
  { to: '/admin/characters', label: 'Characters', icon: ScrollText },
  { to: '/admin/homebrew', label: 'Homebrew', icon: BookOpen },
] as const;

const adminNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
    isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
  }`;

export function AdminLayout() {
  return (
    <AppChrome>
      <div className="space-y-6">
        <nav aria-label="Admin navigation">
          <ul className="flex flex-wrap gap-2 border-b pb-3">
            {ADMIN_NAV.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} className={adminNavLinkClass}>
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <Outlet />
      </div>
    </AppChrome>
  );
}
