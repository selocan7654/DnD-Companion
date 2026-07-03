import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Search } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { HomebrewCard } from '@/features/homebrew/HomebrewCard';
import { HOMEBREW_TYPE_OPTIONS } from '@/features/homebrew/homebrewUtils';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import {
  useDeleteHomebrewMutation,
  useGetMyCreationsQuery,
  usePublishHomebrewMutation,
  useUnpublishHomebrewMutation,
} from '@/store/api/homebrewApi';
import type { HomebrewItem, HomebrewStatus, HomebrewType } from '@/types/api';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';

/** S-MY-CREATIONS — user's homebrew drafts and published items */
export function MyCreationsPage() {
  usePageTitle('My Creations — DnD Companion');
  const { isEmailVerified } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<HomebrewType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<HomebrewStatus | ''>('');
  const [allItems, setAllItems] = useState<HomebrewItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const [publishHomebrew] = usePublishHomebrewMutation();
  const [unpublishHomebrew] = useUnpublishHomebrewMutation();
  const [deleteHomebrew] = useDeleteHomebrewMutation();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isInitialFilter = useRef(true);
  useEffect(() => {
    if (isInitialFilter.current) {
      isInitialFilter.current = false;
      return;
    }
    setCursor(undefined);
    setAllItems([]);
  }, [debouncedSearch, selectedType, selectedStatus]);

  const { data, isLoading, isFetching, isError, refetch } = useGetMyCreationsQuery(
    {
      search: debouncedSearch || undefined,
      type: selectedType || undefined,
      status: selectedStatus || undefined,
      cursor,
      limit: 20,
    },
    { skip: !isEmailVerified },
  );

  useEffect(() => {
    if (!data?.data) {
      return;
    }
    if (cursor) {
      setAllItems((prev) => {
        const existingIds = new Set(prev.map((item) => item.id));
        const newItems = data.data.filter((item) => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
    } else {
      setAllItems(data.data);
    }
  }, [data, cursor]);

  const handlePublish = async (id: string) => {
    try {
      await publishHomebrew(id).unwrap();
      toast({ title: 'Homebrew published' });
    } catch (error) {
      toast({
        title: 'Failed to publish homebrew',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await unpublishHomebrew(id).unwrap();
      toast({ title: 'Homebrew unpublished' });
    } catch (error) {
      toast({
        title: 'Failed to unpublish homebrew',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this homebrew? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteHomebrew(id).unwrap();
      toast({ title: 'Homebrew deleted' });
    } catch (error) {
      toast({
        title: 'Failed to delete homebrew',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const hasMore = data?.hasMore ?? false;
  const isInitialLoading = isLoading && allItems.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Creations</h1>
        <Button asChild>
          <Link to="/homebrew/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Homebrew
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-[12rem] flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            placeholder="Search creations"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search my creations"
          />
        </div>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as HomebrewType | '')}
          aria-label="Filter by type"
        >
          <option value="">All types</option>
          {HOMEBREW_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as HomebrewStatus | '')}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Failed to load your creations.
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isInitialLoading ? (
        <LoadingSpinner label="Loading creations" />
      ) : allItems.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">You have not created any homebrew yet.</p>
          <Button asChild className="mt-4">
            <Link to="/homebrew/new">Create your first homebrew</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {allItems.map((item) => (
              <HomebrewCard
                key={item.id}
                item={item}
                showStatus
                actionSlot={
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/homebrew/${item.id}/edit`}>Edit</Link>
                    </Button>
                    {item.status === 'DRAFT' ? (
                      <Button size="sm" onClick={() => void handlePublish(item.id)}>
                        Publish
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleUnpublish(item.id)}
                      >
                        Unpublish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      aria-label={`Delete ${item.name}`}
                      onClick={() => void handleDelete(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
          {hasMore ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                disabled={isFetching}
                onClick={() => setCursor(data?.nextCursor ?? undefined)}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading…
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
