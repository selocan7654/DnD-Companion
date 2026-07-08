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
  useDeleteAdminCharacterMutation,
  useGetAdminCharactersQuery,
  useUpdateAdminCharacterMutation,
} from '@/store/api/adminApi';
import type { AdminCharacterListItem } from '@/types/api';

type ConfirmAction =
  | { type: 'edit'; character: AdminCharacterListItem }
  | { type: 'delete'; character: AdminCharacterListItem };

/** S-ADMIN-CHARACTERS — Admin character management */
export function AdminCharactersPage() {
  usePageTitle('Admin Characters — DnD Companion');

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<AdminCharacterListItem[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [editName, setEditName] = useState('');
  const [editVisibility, setEditVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');

  const [updateCharacter, { isLoading: isUpdating }] = useUpdateAdminCharacterMutation();
  const [deleteCharacter, { isLoading: isDeleting }] = useDeleteAdminCharacterMutation();

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
  }, [debouncedSearch]);

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminCharactersQuery({
    search: debouncedSearch || undefined,
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

  const openEdit = (character: AdminCharacterListItem) => {
    setEditName(character.name);
    setEditVisibility(character.visibility);
    setConfirmAction({ type: 'edit', character });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'edit') {
        await updateCharacter({
          id: confirmAction.character.id,
          body: { name: editName.trim(), visibility: editVisibility },
        }).unwrap();
        toast({ title: 'Character updated', description: 'Changes saved successfully.' });
      } else {
        await deleteCharacter(confirmAction.character.id).unwrap();
        toast({
          title: 'Character deleted',
          description: `${confirmAction.character.name} was deleted.`,
        });
      }
      setConfirmAction(null);
      setCursor(undefined);
      setItems([]);
    } catch (error) {
      toast({
        title: 'Action failed',
        description: getApiErrorMessage(error, 'Failed to update character'),
      });
    }
  };

  const isInitialLoading = isLoading && items.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Character Management</h1>

      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search characters..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
          aria-label="Search characters"
        />
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load characters.{' '}
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
        <p className="text-muted-foreground">No characters found.</p>
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
                    Owner
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Class / Level
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Visibility
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((character) => (
                  <tr key={character.id} className="border-b">
                    <td className="px-3 py-3 font-medium">{character.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{character.ownerUsername}</td>
                    <td className="px-3 py-3">
                      {character.className ?? '—'} / {character.level}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="secondary">{character.visibility}</Badge>
                    </td>
                    <td className="px-3 py-3">
                      <div
                        className="flex flex-wrap gap-2"
                        aria-label={`Actions for ${character.name}`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => openEdit(character)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          type="button"
                          onClick={() => setConfirmAction({ type: 'delete', character })}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {items.map((character) => (
              <li key={character.id} className="rounded-lg border p-4">
                <p className="font-medium">{character.name}</p>
                <p className="text-sm text-muted-foreground">
                  {character.ownerUsername} · {character.className ?? '—'} L{character.level}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => openEdit(character)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    type="button"
                    onClick={() => setConfirmAction({ type: 'delete', character })}
                  >
                    Delete
                  </Button>
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
            aria-labelledby="edit-character-title"
            className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
          >
            <h2 id="edit-character-title" className="text-lg font-semibold">
              Edit character
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="edit-character-name" className="mb-1 block text-sm font-medium">
                  Name
                </label>
                <Input
                  id="edit-character-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="edit-character-visibility"
                  className="mb-1 block text-sm font-medium"
                >
                  Visibility
                </label>
                <select
                  id="edit-character-visibility"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={editVisibility}
                  onChange={(e) => setEditVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
                >
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="PUBLIC">PUBLIC</option>
                </select>
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
        title="Delete character?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        isPending={isDeleting}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
