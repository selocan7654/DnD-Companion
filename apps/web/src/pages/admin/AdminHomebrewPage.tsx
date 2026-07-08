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
  useDeleteAdminHomebrewMutation,
  useGetAdminHomebrewQuery,
  useUpdateAdminHomebrewMutation,
  useUpdateAdminHomebrewStatusMutation,
} from '@/store/api/adminApi';
import type { AdminHomebrewListItem, HomebrewStatus, HomebrewType } from '@/types/api';

type ConfirmAction =
  | { type: 'edit'; item: AdminHomebrewListItem }
  | { type: 'delete'; item: AdminHomebrewListItem }
  | { type: 'status'; item: AdminHomebrewListItem; status: HomebrewStatus };

const HOMEBREW_TYPES: HomebrewType[] = [
  'SPELL',
  'MONSTER',
  'FEAT',
  'BACKGROUND',
  'MAGIC_ITEM',
  'SUBCLASS',
];

/** S-ADMIN-HOMEBREW — Admin homebrew management */
export function AdminHomebrewPage() {
  usePageTitle('Admin Homebrew — DnD Companion');

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | HomebrewType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | HomebrewStatus>('ALL');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<AdminHomebrewListItem[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [updateHomebrew, { isLoading: isUpdating }] = useUpdateAdminHomebrewMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateAdminHomebrewStatusMutation();
  const [deleteHomebrew, { isLoading: isDeleting }] = useDeleteAdminHomebrewMutation();

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
    setItems([]);
  }, [debouncedSearch, typeFilter, statusFilter]);

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminHomebrewQuery({
    search: debouncedSearch || undefined,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    cursor,
    limit: 20,
  });

  useEffect(() => {
    if (!data?.data) return;
    if (cursor) {
      setItems((prev) => {
        const ids = new Set(prev.map((c) => c.id));
        return [...prev, ...data.data.filter((c) => !ids.has(c.id))];
      });
    } else {
      setItems(data.data);
    }
  }, [data, cursor]);

  const openEdit = (item: AdminHomebrewListItem) => {
    setEditName(item.name);
    setEditDescription(item.description ?? '');
    setConfirmAction({ type: 'edit', item });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'edit') {
        await updateHomebrew({
          id: confirmAction.item.id,
          body: {
            name: editName.trim(),
            description: editDescription.trim() || null,
          },
        }).unwrap();
        toast({ title: 'Homebrew updated', description: 'Changes saved successfully.' });
      } else if (confirmAction.type === 'status') {
        await updateStatus({
          id: confirmAction.item.id,
          status: confirmAction.status,
        }).unwrap();
        toast({
          title: 'Status updated',
          description: `${confirmAction.item.name} is now ${confirmAction.status}.`,
        });
      } else {
        await deleteHomebrew(confirmAction.item.id).unwrap();
        toast({
          title: 'Homebrew deleted',
          description: `${confirmAction.item.name} was deleted.`,
        });
      }
      setConfirmAction(null);
      setCursor(undefined);
      setItems([]);
    } catch (error) {
      toast({
        title: 'Action failed',
        description: getApiErrorMessage(error, 'Failed to update homebrew'),
      });
    }
  };

  const isPending = isUpdating || isUpdatingStatus || isDeleting;
  const isInitialLoading = isLoading && items.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Homebrew Management</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="relative max-w-md flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search homebrew..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            aria-label="Search homebrew"
          />
        </div>
        <div>
          <label htmlFor="homebrew-type-filter" className="mb-1 block text-sm font-medium">
            Type
          </label>
          <select
            id="homebrew-type-filter"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          >
            <option value="ALL">All</option>
            {HOMEBREW_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="homebrew-status-filter" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="homebrew-status-filter"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="ALL">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load homebrew.{' '}
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
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">No homebrew found.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Source
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Owner
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-3 py-3 font-medium">{item.name}</td>
                    <td className="px-3 py-3">{item.type}</td>
                    <td className="px-3 py-3">{item.source}</td>
                    <td className="px-3 py-3 text-muted-foreground">{item.ownerUsername ?? '—'}</td>
                    <td className="px-3 py-3">
                      <Badge variant={item.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {item.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <HomebrewActions item={item} onAction={setConfirmAction} onEdit={openEdit} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((item) => (
              <li key={item.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant={item.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                    {item.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.type} · {item.source} · {item.ownerUsername ?? '—'}
                </p>
                <div className="mt-3">
                  <HomebrewActions item={item} onAction={setConfirmAction} onEdit={openEdit} />
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
              Load more
            </Button>
          ) : null}
        </>
      )}

      {confirmAction?.type === 'edit' ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !isUpdating) setConfirmAction(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-homebrew-title"
            className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
          >
            <h2 id="edit-homebrew-title" className="text-lg font-semibold">
              Edit homebrew
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="edit-homebrew-name" className="mb-1 block text-sm font-medium">
                  Name
                </label>
                <Input
                  id="edit-homebrew-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-homebrew-description"
                  className="mb-1 block text-sm font-medium"
                >
                  Description
                </label>
                <Input
                  id="edit-homebrew-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmAction(null)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={isUpdating || !editName.trim()}
                aria-busy={isUpdating}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmAction?.type === 'delete'}
        title="Delete homebrew?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isPending={isDeleting}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction?.type === 'status'}
        title={
          confirmAction?.type === 'status' && confirmAction.status === 'PUBLISHED'
            ? 'Publish homebrew?'
            : 'Unpublish homebrew?'
        }
        description={
          confirmAction?.type === 'status'
            ? `Set ${confirmAction.item.name} status to ${confirmAction.status}.`
            : ''
        }
        confirmLabel={
          confirmAction?.type === 'status' && confirmAction.status === 'PUBLISHED'
            ? 'Publish'
            : 'Unpublish'
        }
        isPending={isPending}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

function HomebrewActions({
  item,
  onAction,
  onEdit,
}: {
  item: AdminHomebrewListItem;
  onAction: (action: ConfirmAction) => void;
  onEdit: (item: AdminHomebrewListItem) => void;
}) {
  const nextStatus: HomebrewStatus = item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
  return (
    <div className="flex flex-wrap gap-2" aria-label={`Actions for ${item.name}`}>
      <Button size="sm" variant="outline" type="button" onClick={() => onEdit(item)}>
        Edit
      </Button>
      <Button
        size="sm"
        variant="secondary"
        type="button"
        onClick={() => onAction({ type: 'status', item, status: nextStatus })}
      >
        {item.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        type="button"
        onClick={() => onAction({ type: 'delete', item })}
      >
        Delete
      </Button>
    </div>
  );
}
