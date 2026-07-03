import { Link, Outlet } from 'react-router-dom';
import { Swords } from 'lucide-react';

interface PublicLayoutProps {
  children?: React.ReactNode;
}

/** Public read-only pages (e.g. PUBLIC character sheet). */
export function PublicLayout({ children }: PublicLayoutProps) {
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
          <Link to="/login" className="flex items-center gap-2 text-lg font-semibold">
            <Swords className="h-5 w-5" aria-hidden="true" />
            DnD Companion
          </Link>
          <Link to="/login" className="text-sm font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-6" tabIndex={-1}>
        {children ?? <Outlet />}
      </main>
    </div>
  );
}
