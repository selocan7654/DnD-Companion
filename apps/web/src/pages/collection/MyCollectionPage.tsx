import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookmarkX, Loader2, Search } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  formatHomebrewSource,
  formatHomebrewType,
  HOMEBREW_TYPE_OPTIONS,
} from '@/features/homebrew/homebrewUtils';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import { useGetCollectionQuery, useRemoveFromCollectionMutation } from '@/store/api/collectionsApi';
import type { CollectionItem, HomebrewType } from '@/types/api';

export function UnpublishedBadge() {
  return (
    <Badge variant="outline" className="border-amber-500 text-amber-700">
      Unpublished by author
    </Badge>
  );
}

function CollectionCard({
  item,
  onRemove,
  isRemoving,
}: {
  item: CollectionItem;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  return (
    <Card
      className={`flex h-full flex-col transition-shadow hover:shadow-md ${
        item.isUnpublished ? 'opacity-75' : ''
      }`}
    >
      <Link
        to={`/homebrew/${item.homebrewItemId}`}
        className="block flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{item.name}</CardTitle>
            <div className="flex flex-wrap gap-1">
              {item.isUnpublished ? <UnpublishedBadge /> : null}
              <Badge variant="outline">{formatHomebrewType(item.type)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{formatHomebrewSource(item.source)}</Badge>
          {item.ownerUsername ? <p>by @{item.ownerUsername}</p> : null}
          <p>Added {new Date(item.addedAt).toLocaleDateString('en-US')}</p>
        </CardContent>
      </Link>
      <div className="border-t p-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Remove ${item.name} from collection`}
          disabled={isRemoving}
          onClick={() => onRemove(item.homebrewItemId)}
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <BookmarkX className="h-4 w-4" aria-hidden="true" />
          )}
          Remove
        </Button>
      </div>
    </Card>
  );
}

/** S-MY-COLLECTION — user's saved published homebrew */
export function MyCollectionPage() {
  usePageTitle('My Collection — DnD Companion');
  const { isEmailVerified } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<HomebrewType | ''>('');
  const [allItems, setAllItems] = useState<CollectionItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [removeFromCollection] = useRemoveFromCollectionMutation();

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
  }, [debouncedSearch, selectedType]);

  const { data, isLoading, isFetching, isError, refetch } = useGetCollectionQuery(
    {
      search: debouncedSearch || undefined,
      type: selectedType || undefined,
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
        const existingIds = new Set(prev.map((item) => item.homebrewItemId));
        const newItems = data.data.filter((item) => !existingIds.has(item.homebrewItemId));
        return [...prev, ...newItems];
      });
    } else {
      setAllItems(data.data);
    }
  }, [data, cursor]);

  const handleRemove = async (homebrewItemId: string) => {
    setRemovingId(homebrewItemId);
    try {
      await removeFromCollection(homebrewItemId).unwrap();
      toast({ title: 'Removed from collection' });
    } catch (error) {
      toast({
        title: 'Failed to remove from collection',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    } finally {
      setRemovingId(null);
    }
  };

  const hasMore = data?.hasMore ?? false;
  const isInitialLoading = isLoading && allItems.length === 0;
  const hasActiveFilters = Boolean(debouncedSearch || selectedType);

  if (!isEmailVerified) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">My Collection</h1>
        <Alert>
          <AlertDescription>
            Please verify your email to view and manage your collection.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Collection</h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-[12rem] flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            placeholder="Search collection"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search my collection"
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
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Failed to load your collection.
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isInitialLoading ? (
        <LoadingSpinner label="Loading collection" />
      ) : allItems.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? 'No items match your filters.'
              : 'Your collection is empty. Browse the Homebrew Gallery to find content you like.'}
          </p>
          {hasActiveFilters ? null : (
            <Button asChild className="mt-4">
              <Link to="/homebrew">Browse Gallery</Link>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {allItems.map((item) => (
              <CollectionCard
                key={item.homebrewItemId}
                item={item}
                onRemove={(id) => void handleRemove(id)}
                isRemoving={removingId === item.homebrewItemId}
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
