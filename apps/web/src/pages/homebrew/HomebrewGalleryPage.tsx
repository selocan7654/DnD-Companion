import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Search } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { HomebrewCard } from '@/features/homebrew/HomebrewCard';
import { GALLERY_SOURCE_OPTIONS, HOMEBREW_TYPE_OPTIONS } from '@/features/homebrew/homebrewUtils';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AppChrome } from '@/layouts/AppChrome';
import { PublicLayout } from '@/layouts/PublicLayout';
import { useGetHomebrewGalleryQuery } from '@/store/api/homebrewApi';
import type { HomebrewListItem, HomebrewSource, HomebrewType } from '@/types/api';

export function HomebrewGalleryContent() {
  usePageTitle('Homebrew Gallery — DnD Companion');
  const { isAuthenticated, isEmailVerified } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedType, setSelectedType] = useState<HomebrewType | ''>('');
  const [selectedSource, setSelectedSource] = useState<HomebrewSource | ''>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [allItems, setAllItems] = useState<HomebrewListItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

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
  }, [debouncedSearch, selectedType, selectedSource, sortBy, sortOrder]);

  const { data, isLoading, isFetching, isError, refetch } = useGetHomebrewGalleryQuery({
    search: debouncedSearch || undefined,
    type: selectedType || undefined,
    source: selectedSource || undefined,
    sort: sortBy,
    order: sortOrder,
    cursor,
    limit: 20,
  });

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

  const hasMore = data?.hasMore ?? false;
  const isInitialLoading = isLoading && allItems.length === 0;
  const hasActiveFilters = Boolean(debouncedSearch || selectedType || selectedSource);

  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedType('');
    setSelectedSource('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCursor(undefined);
    setAllItems([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Homebrew Gallery</h1>
        {isAuthenticated && isEmailVerified ? (
          <Button asChild>
            <Link to="/homebrew/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Homebrew
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-4 rounded-lg border p-4" aria-label="Gallery filters">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              placeholder="Search by name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search homebrew"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="type-filter" className="text-sm font-medium">
              Type
            </label>
            <select
              id="type-filter"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as HomebrewType | '')}
            >
              <option value="">All types</option>
              {HOMEBREW_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="source-filter" className="text-sm font-medium">
              Source
            </label>
            <select
              id="source-filter"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value as HomebrewSource | '')}
            >
              {GALLERY_SOURCE_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="sort-filter" className="text-sm font-medium">
              Sort
            </label>
            <select
              id="sort-filter"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split(':') as [
                  'createdAt' | 'name',
                  'asc' | 'desc',
                ];
                setSortBy(sort);
                setSortOrder(order);
              }}
            >
              <option value="createdAt:desc">Newest</option>
              <option value="createdAt:asc">Oldest</option>
              <option value="name:asc">A–Z</option>
              <option value="name:desc">Z–A</option>
            </select>
          </div>
        </aside>

        <div className="space-y-4">
          {isError ? (
            <Alert variant="destructive">
              <AlertDescription className="flex flex-wrap items-center gap-3">
                Failed to load gallery.
                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {isInitialLoading ? (
            <LoadingSpinner label="Loading gallery" />
          ) : allItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'No items match your filters.' : 'No published homebrew yet.'}
              </p>
              {hasActiveFilters ? (
                <Button variant="link" className="mt-2" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {allItems.map((item) => (
                  <HomebrewCard key={item.id} item={item} />
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
      </div>
    </div>
  );
}

/** S-HOMEBREW-GALLERY — published homebrew gallery (public) */
export function HomebrewGalleryPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const content = <HomebrewGalleryContent />;

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading session" />;
  }

  if (isAuthenticated) {
    return <AppChrome>{content}</AppChrome>;
  }

  return <PublicLayout>{content}</PublicLayout>;
}
