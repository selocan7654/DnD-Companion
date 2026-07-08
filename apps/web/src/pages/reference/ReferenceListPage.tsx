import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatHomebrewSource, formatHomebrewType } from '@/features/homebrew/homebrewUtils';
import {
  formatReferenceTypeLabel,
  isValidReferenceType,
  REFERENCE_SOURCE_OPTIONS,
  REFERENCE_TYPE_TABS,
} from '@/features/reference/referenceUtils';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AppChrome } from '@/layouts/AppChrome';
import { PublicLayout } from '@/layouts/PublicLayout';
import {
  isReferenceItemType,
  useGetReferenceClassesQuery,
  useGetReferenceListQuery,
  useGetReferenceRacesQuery,
} from '@/store/api/referenceApi';
import type {
  DndClassRef,
  DndRaceRef,
  HomebrewSource,
  ReferenceListItem,
  ReferenceTypeSlug,
} from '@/types/api';

function TypeTabs({ active }: { active: ReferenceTypeSlug }) {
  return (
    <nav aria-label="Reference types" className="-mx-1 overflow-x-auto">
      <ul className="flex min-w-max gap-1 p-1">
        {REFERENCE_TYPE_TABS.map((tab) => {
          const isActive = tab.slug === active;
          return (
            <li key={tab.slug}>
              <Link
                to={`/reference/${tab.slug}`}
                className={`inline-flex rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ReferenceItemCard({ item, type }: { item: ReferenceListItem; type: string }) {
  return (
    <Link
      to={`/reference/${type}/${item.id}`}
      className="block rounded-lg border p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold leading-tight">{item.name}</h2>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline">{formatHomebrewType(item.type)}</Badge>
          <Badge variant="secondary">{formatHomebrewSource(item.source)}</Badge>
        </div>
      </div>
      {item.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
      ) : null}
    </Link>
  );
}

function ClassesList() {
  const { data, isLoading, isError, refetch } = useGetReferenceClassesQuery();
  const classes = data?.data ?? [];

  if (isLoading) {
    return <LoadingSpinner label="Loading classes" />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex flex-wrap items-center gap-3">
          Failed to load classes.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Name
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Hit Die
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Primary Ability
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Saving Throws
            </th>
          </tr>
        </thead>
        <tbody>
          {classes.map((item: DndClassRef) => (
            <tr key={item.name} className="border-b last:border-b-0">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3">d{item.hitDie}</td>
              <td className="px-4 py-3">{item.primaryAbility}</td>
              <td className="px-4 py-3">{item.savingThrows.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RacesList() {
  const { data, isLoading, isError, refetch } = useGetReferenceRacesQuery();
  const races = data?.data ?? [];

  if (isLoading) {
    return <LoadingSpinner label="Loading races" />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex flex-wrap items-center gap-3">
          Failed to load races.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[28rem] text-left text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Name
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Size
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Speed
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Source
            </th>
          </tr>
        </thead>
        <tbody>
          {races.map((item: DndRaceRef) => (
            <tr key={item.name} className="border-b last:border-b-0">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3">{item.size}</td>
              <td className="px-4 py-3">{item.speed} ft.</td>
              <td className="px-4 py-3">{item.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ItemTypeList({ type }: { type: Exclude<ReferenceTypeSlug, 'classes' | 'races'> }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') ?? '');
  const [selectedSource, setSelectedSource] = useState<HomebrewSource | ''>(
    (searchParams.get('source') as HomebrewSource) || '',
  );
  const [allItems, setAllItems] = useState<ReferenceListItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedSearch) {
      next.set('search', debouncedSearch);
    }
    if (selectedSource) {
      next.set('source', selectedSource);
    }
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, selectedSource, setSearchParams]);

  const isInitialFilter = useRef(true);
  useEffect(() => {
    if (isInitialFilter.current) {
      isInitialFilter.current = false;
      return;
    }
    setCursor(undefined);
    setAllItems([]);
  }, [debouncedSearch, selectedSource, type]);

  const { data, isLoading, isFetching, isError, refetch } = useGetReferenceListQuery({
    type,
    params: {
      search: debouncedSearch || undefined,
      source: selectedSource || undefined,
      sort: 'name',
      order: 'asc',
      cursor,
      limit: 20,
    },
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
  const hasActiveFilters = Boolean(debouncedSearch || selectedSource);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative min-w-[12rem] flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="pl-9"
            placeholder={`Search ${formatReferenceTypeLabel(type).toLowerCase()}`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label={`Search ${formatReferenceTypeLabel(type)}`}
          />
        </div>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value as HomebrewSource | '')}
          aria-label="Filter by source"
        >
          {REFERENCE_SOURCE_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center gap-3">
            Failed to load reference data.
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isInitialLoading ? (
        <LoadingSpinner label="Loading reference" />
      ) : allItems.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? 'No items match your filters.'
              : 'No official reference content available yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {allItems.map((item) => (
              <ReferenceItemCard key={item.id} item={item} type={type} />
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

export function ReferenceListContent() {
  const { type: typeParam } = useParams<{ type?: string }>();
  const activeType: ReferenceTypeSlug = isValidReferenceType(typeParam) ? typeParam : 'spells';

  usePageTitle(`${formatReferenceTypeLabel(activeType)} — Reference — DnD Companion`);

  if (typeParam && !isValidReferenceType(typeParam)) {
    return <Navigate to="/reference/spells" replace />;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">D&D 5e Reference</h1>
        <p className="text-muted-foreground">
          Browse official fifth edition spells, monsters, and more.
        </p>
      </header>

      <TypeTabs active={activeType} />

      {activeType === 'classes' ? (
        <ClassesList />
      ) : activeType === 'races' ? (
        <RacesList />
      ) : isReferenceItemType(activeType) ? (
        <ItemTypeList type={activeType} />
      ) : null}
    </div>
  );
}

/** S-REF-LIST — official 5e reference list (public) */
export function ReferenceListPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const content = <ReferenceListContent />;

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading session" />;
  }

  if (isAuthenticated) {
    return <AppChrome>{content}</AppChrome>;
  }

  return <PublicLayout>{content}</PublicLayout>;
}
