import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { CampaignCard } from '@/features/campaigns/CampaignCard';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useGetCampaignsQuery } from '@/store/api/campaignsApi';
import type { CampaignListItem } from '@/types/api';

/** S-CAMPAIGN-LIST — My campaigns */
export function CampaignListPage() {
  usePageTitle('My Campaigns — DnD Companion');
  const { isEmailVerified } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [allCampaigns, setAllCampaigns] = useState<CampaignListItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

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
    setAllCampaigns([]);
  }, [debouncedSearch]);

  const { data, isLoading, isFetching, isError, refetch } = useGetCampaignsQuery({
    search: debouncedSearch || undefined,
    cursor,
    limit: 20,
  });

  useEffect(() => {
    if (!data?.data) return;
    if (cursor) {
      setAllCampaigns((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newItems = data.data.filter((c) => !existingIds.has(c.id));
        return [...prev, ...newItems];
      });
    } else {
      setAllCampaigns(data.data);
    }
  }, [data, cursor]);

  const hasMore = data?.hasMore ?? false;
  const isInitialLoading = isLoading && allCampaigns.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Campaigns</h1>
        {isEmailVerified ? (
          <Button asChild>
            <Link to="/campaigns/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Campaign
            </Link>
          </Button>
        ) : (
          <Button disabled title="Please verify your email to perform this action">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Campaign
          </Button>
        )}
      </div>

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
            <span>Failed to load campaigns.</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!isInitialLoading && !isError && allCampaigns.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            {debouncedSearch
              ? `No campaigns matching "${debouncedSearch}".`
              : "You haven't joined or created any campaigns yet."}
          </p>
          {!debouncedSearch && isEmailVerified ? (
            <Button asChild className="mt-4">
              <Link to="/campaigns/new">Create your first campaign</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      {allCampaigns.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
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
