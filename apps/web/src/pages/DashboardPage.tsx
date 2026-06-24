import { usePageTitle } from '@/hooks/usePageTitle';
import { useAuth } from '@/hooks/useAuth';

/** Protected dashboard placeholder — campaign list comes in Faz 2 */
export function DashboardPage() {
  usePageTitle('Dashboard — DnD Companion');
  const { user } = useAuth();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        {user
          ? `Welcome back, ${user.username}! Campaign management will be available in a future update.`
          : 'Welcome! Campaign management will be available in a future update.'}
      </p>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Campaign list placeholder — coming in Phase 2.
      </div>
    </div>
  );
}
