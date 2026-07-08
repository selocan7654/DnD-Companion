import { useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  useDeleteAdminCampaignMutation,
  useGetAdminCampaignsQuery,
  useUpdateAdminCampaignMutation,
} from '@/store/api/adminApi';
import type { AdminCampaignListItem } from '@/types/api';

type ConfirmAction =
  | { type: 'edit'; campaign: AdminCampaignListItem }
  | { type: 'delete'; campaign: AdminCampaignListItem };

/** S-ADMIN-CAMPAIGNS — Admin campaign management */
export function AdminCampaignsPage() {
  usePageTitle('Admin Campaigns — DnD Companion');

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<AdminCampaignListItem[]>([]);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [editName, setEditName] = useState('');
  const [editSetting, setEditSetting] = useState('');

  const [updateCampaign, { isLoading: isUpdating }] = useUpdateAdminCampaignMutation();
  const [deleteCampaign, { isLoading: isDeleting }] = useDeleteAdminCampaignMutation();

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

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminCampaignsQuery({
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

  const openEdit = (campaign: AdminCampaignListItem) => {
    setEditName(campaign.name);
    setEditSetting(campaign.setting ?? '');
    setConfirmAction({ type: 'edit', campaign });
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'edit') {
        await updateCampaign({
          id: confirmAction.campaign.id,
          body: {
            name: editName.trim(),
            setting: editSetting.trim() || null,
          },
        }).unwrap();
        toast({ title: 'Campaign updated', description: 'Changes saved successfully.' });
      } else {
        await deleteCampaign(confirmAction.campaign.id).unwrap();
        toast({
          title: 'Campaign deleted',
          description: `${confirmAction.campaign.name} and related members/notes were removed.`,
        });
      }
      setConfirmAction(null);
      setCursor(undefined);
      setItems([]);
    } catch (error) {
      toast({
        title: 'Action failed',
        description: getApiErrorMessage(error, 'Failed to update campaign'),
      });
    }
  };

  const isInitialLoading = isLoading && items.length === 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Campaign Management</h1>

      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search campaigns..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-9"
          aria-label="Search campaigns"
        />
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load campaigns.{' '}
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
        <p className="text-muted-foreground">No campaigns found.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th scope="col" className="px-3 py-2 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Owner
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Members
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Created
                  </th>
                  <th scope="col" className="px-3 py-2 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((campaign) => (
                  <tr key={campaign.id} className="border-b">
                    <td className="px-3 py-3 font-medium">{campaign.name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{campaign.ownerUsername}</td>
                    <td className="px-3 py-3">{campaign.memberCount}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {new Date(campaign.createdAt).toLocaleDateString('en-US')}
                    </td>
                    <td className="px-3 py-3">
                      <div
                        className="flex flex-wrap gap-2"
                        aria-label={`Actions for ${campaign.name}`}
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => openEdit(campaign)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          type="button"
                          onClick={() => setConfirmAction({ type: 'delete', campaign })}
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
            {items.map((campaign) => (
              <li key={campaign.id} className="rounded-lg border p-4">
                <p className="font-medium">{campaign.name}</p>
                <p className="text-sm text-muted-foreground">
                  Owner: {campaign.ownerUsername} · {campaign.memberCount} members
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    type="button"
                    onClick={() => openEdit(campaign)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    type="button"
                    onClick={() => setConfirmAction({ type: 'delete', campaign })}
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
            aria-labelledby="edit-campaign-title"
            className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
          >
            <h2 id="edit-campaign-title" className="text-lg font-semibold">
              Edit campaign
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="edit-campaign-name" className="mb-1 block text-sm font-medium">
                  Name
                </label>
                <Input
                  id="edit-campaign-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="edit-campaign-setting" className="mb-1 block text-sm font-medium">
                  Setting
                </label>
                <Input
                  id="edit-campaign-setting"
                  value={editSetting}
                  onChange={(e) => setEditSetting(e.target.value)}
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
        title="Delete campaign?"
        description="This will remove all members and notes. Assigned characters will be unassigned."
        confirmLabel="Delete"
        variant="destructive"
        isPending={isDeleting}
        onConfirm={() => void handleConfirm()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
