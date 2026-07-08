import { useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  useChangeAdminUserRoleMutation,
  useDeactivateAdminUserMutation,
  useGetAdminUsersQuery,
  useReactivateAdminUserMutation,
} from '@/store/api/adminApi';
import type { AdminUser } from '@/types/api';

type ConfirmAction =
  | { type: 'role'; user: AdminUser; role: 'ADMIN' | 'USER' }
  | { type: 'deactivate'; user: AdminUser }
  | { type: 'reactivate'; user: AdminUser };

/** S-ADMIN-USERS — Admin user management */
export function AdminUsersPage() {
  usePageTitle('Admin Users — DnD Companion');

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DEACTIVATED'>('ALL');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const [changeRole, { isLoading: isChangingRole }] = useChangeAdminUserRoleMutation();
  const [deactivateUser, { isLoading: isDeactivating }] = useDeactivateAdminUserMutation();
  const [reactivateUser, { isLoading: isReactivating }] = useReactivateAdminUserMutation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isInitial = useRef(true);
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    setCursor(undefined);
    setAllUsers([]);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminUsersQuery({
    search: debouncedSearch || undefined,
    role: roleFilter === 'ALL' ? undefined : roleFilter,
    isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
    cursor,
    limit: 20,
  });

  useEffect(() => {
    if (!data?.data) return;
    if (cursor) {
      setAllUsers((prev) => {
        const existingIds = new Set(prev.map((u) => u.id));
        return [...prev, ...data.data.filter((u) => !existingIds.has(u.id))];
      });
    } else {
      setAllUsers(data.data);
    }
  }, [data, cursor]);

  const isPending = isChangingRole || isDeactivating || isReactivating;

  const handleConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'role') {
        await changeRole({ id: confirmAction.user.id, role: confirmAction.role }).unwrap();
        toast({
          title: 'Role updated',
          description: `${confirmAction.user.username} is now ${confirmAction.role}.`,
        });
      } else if (confirmAction.type === 'deactivate') {
        await deactivateUser(confirmAction.user.id).unwrap();
        toast({
          title: 'User deactivated',
          description: `${confirmAction.user.username} has been deactivated.`,
        });
      } else {
        await reactivateUser(confirmAction.user.id).unwrap();
        toast({
          title: 'User reactivated',
          description: `${confirmAction.user.username} has been reactivated.`,
        });
      }
      setConfirmAction(null);
      setCursor(undefined);
      setAllUsers([]);
    } catch (error) {
      toast({
        title: 'Action failed',
        description: getApiErrorMessage(error, 'Failed to update user'),
      });
    }
  };

  const confirmCopy = (() => {
    if (!confirmAction)
      return { title: '', description: '', confirmLabel: '', variant: 'default' as const };
    if (confirmAction.type === 'role') {
      return {
        title: `Change role to ${confirmAction.role}?`,
        description: `This will change ${confirmAction.user.username}'s role to ${confirmAction.role}.`,
        confirmLabel: `Change to ${confirmAction.role}`,
        variant: 'default' as const,
      };
    }
    if (confirmAction.type === 'deactivate') {
      return {
        title: 'Deactivate user?',
        description: `${confirmAction.user.username} will lose access until reactivated.`,
        confirmLabel: 'Deactivate',
        variant: 'destructive' as const,
      };
    }
    return {
      title: 'Reactivate user?',
      description: `${confirmAction.user.username} will regain access.`,
      confirmLabel: 'Reactivate',
      variant: 'default' as const,
    };
  })();

  const isInitialLoading = isLoading && allUsers.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">User Management</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative max-w-md flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search by email or username..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="Search users"
          />
        </div>
        <div>
          <label htmlFor="role-filter" className="mb-1 block text-sm font-medium">
            Role
          </label>
          <select
            id="role-filter"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          >
            <option value="ALL">All</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>
        </div>
        <div>
          <label htmlFor="status-filter" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status-filter"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="ALL">All</option>
            <option value="ACTIVE">Active</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load users.{' '}
            <button type="button" className="underline" onClick={() => void refetch()}>
              Retry
            </button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isInitialLoading ? (
        <div role="status" aria-label="Loading" className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : allUsers.length === 0 ? (
        <p className="text-muted-foreground">No users found.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Username
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Email
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Role
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Verified
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-3 py-3 font-medium">{user.username}</td>
                    <td className="px-3 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-3 py-3">
                      <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {user.role === 'ADMIN' ? 'Admin' : 'User'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={user.isActive ? 'secondary' : 'outline'}>
                        {user.isActive ? 'Active' : 'Deactivated'}
                      </Badge>
                    </td>
                    <td
                      className="px-3 py-3"
                      aria-label={user.emailVerifiedAt ? 'Verified' : 'Not verified'}
                    >
                      {user.emailVerifiedAt ? '✓' : '✗'}
                    </td>
                    <td className="px-3 py-3">
                      <UserActions user={user} onAction={setConfirmAction} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {allUsers.map((user) => (
              <li key={user.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{user.username}</span>
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {user.role === 'ADMIN' ? 'Admin' : 'User'}
                  </Badge>
                  <Badge variant={user.isActive ? 'secondary' : 'outline'}>
                    {user.isActive ? 'Active' : 'Deactivated'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
                <div className="mt-3">
                  <UserActions user={user} onAction={setConfirmAction} />
                </div>
              </li>
            ))}
          </ul>

          {data?.hasMore ? (
            <Button
              variant="outline"
              disabled={isFetching}
              onClick={() => setCursor(data.nextCursor ?? undefined)}
            >
              {isFetching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Loading…
                </>
              ) : (
                'Load more'
              )}
            </Button>
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        variant={confirmCopy.variant}
        isPending={isPending}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

function UserActions({
  user,
  onAction,
}: {
  user: AdminUser;
  onAction: (action: ConfirmAction) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label={`Actions for ${user.username}`}>
      {user.role === 'USER' ? (
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => onAction({ type: 'role', user, role: 'ADMIN' })}
        >
          Change to Admin
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => onAction({ type: 'role', user, role: 'USER' })}
        >
          Change to User
        </Button>
      )}
      {user.isActive ? (
        <Button
          size="sm"
          variant="destructive"
          type="button"
          onClick={() => onAction({ type: 'deactivate', user })}
        >
          Deactivate
        </Button>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          type="button"
          onClick={() => onAction({ type: 'reactivate', user })}
        >
          Reactivate
        </Button>
      )}
    </div>
  );
}
