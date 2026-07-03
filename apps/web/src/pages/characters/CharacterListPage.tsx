import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Search } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CharacterCard } from '@/features/characters/CharacterCard';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useGetCampaignsQuery } from '@/store/api/campaignsApi';
import { useGetCharactersQuery } from '@/store/api/charactersApi';
import type { Character } from '@/types/api';

/** S-CHAR-LIST — My characters */
export function CharacterListPage() {
  usePageTitle('My Characters — DnD Companion');
  const { isEmailVerified } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data: campaignsData } = useGetCampaignsQuery({ limit: 50 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const isInitialDebouncedSearch = useRef(true);
  useEffect(() => {
    if (isInitialDebouncedSearch.current) {
      isInitialDebouncedSearch.current = false;
      return;
    }
    setCursor(undefined);
    setAllCharacters([]);
  }, [debouncedSearch]);

  const isInitialCampaignFilter = useRef(true);
  useEffect(() => {
    if (isInitialCampaignFilter.current) {
      isInitialCampaignFilter.current = false;
      return;
    }
    setCursor(undefined);
    setAllCharacters([]);
  }, [selectedCampaignId]);

  const { data, isLoading, isFetching, isError, refetch } = useGetCharactersQuery({
    search: debouncedSearch || undefined,
    campaignId: selectedCampaignId || undefined,
    cursor,
    limit: 20,
  });

  useEffect(() => {
    if (!data?.data) return;
    if (cursor) {
      setAllCharacters((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newItems = data.data.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newItems];
      });
    } else {
      setAllCharacters(data.data);
    }
  }, [data, cursor]);

  const hasMore = data?.hasMore ?? false;
  const isInitialLoading = isLoading && allCharacters.length === 0;
  const campaigns = campaignsData?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Characters</h1>
        {isEmailVerified ? (
          <Button asChild>
            <Link to="/characters/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Character
            </Link>
          </Button>
        ) : (
          <Button disabled title="Please verify your email to perform this action">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Character
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative max-w-md flex-1">
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
        <div className="w-full max-w-xs space-y-2">
          <Label htmlFor="campaign-filter">Campaign</Label>
          <select
            id="campaign-filter"
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All campaigns</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isInitialLoading ? (
        <div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          role="status"
          aria-label="Loading"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" aria-hidden="true" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>Failed to load characters.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!isInitialLoading && !isError && allCharacters.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {debouncedSearch || selectedCampaignId
              ? 'No characters matching your filters.'
              : "You haven't created any characters yet."}
          </p>
          {!debouncedSearch && !selectedCampaignId && isEmailVerified ? (
            <Button asChild className="mt-4">
              <Link to="/characters/new">Create your first character</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {allCharacters.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allCharacters.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
          {hasMore ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={isFetching}
                onClick={() => setCursor(data?.nextCursor ?? undefined)}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
