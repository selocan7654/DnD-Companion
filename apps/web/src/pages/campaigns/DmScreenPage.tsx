import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CharacterLiveCard } from '@/features/dm-screen/CharacterLiveCard';
import { ConnectionBanner } from '@/features/dm-screen/ConnectionBanner';
import { DmNotesPanel } from '@/features/dm-screen/DmNotesPanel';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useGetCampaignQuery } from '@/store/api/campaignsApi';
import { useGetCharactersQuery } from '@/store/api/charactersApi';
import type { Character, PaginatedResponse } from '@/types/api';

function PlayersPanel({
  characters,
  canEdit,
  isLoading,
  isError,
}: {
  characters: PaginatedResponse<Character> | undefined;
  canEdit: boolean;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <LoadingSpinner label="Loading characters" />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load assigned characters.</AlertDescription>
      </Alert>
    );
  }

  const list = characters?.data ?? [];

  return (
    <section className="space-y-4" aria-labelledby="players-heading">
      <h2 id="players-heading" className="text-lg font-semibold">
        Players ({list.length})
      </h2>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No characters assigned to this campaign yet. Players need to assign their characters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((character) => (
            <CharacterLiveCard key={character.id} character={character} canEdit={canEdit} />
          ))}
        </div>
      )}
    </section>
  );
}

/** S-DM-SCREEN — DM Screen with live character fields and DM notes */
export function DmScreenPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [mobileTab, setMobileTab] = useState('players');

  const {
    data: campaignData,
    isLoading: campaignLoading,
    isError: campaignError,
  } = useGetCampaignQuery(id!, { skip: !id });

  const campaign = campaignData?.data;
  const isDm = !!user && !!campaign && campaign.ownerId === user.id;

  const {
    data: charactersData,
    isLoading: charactersLoading,
    isError: charactersError,
  } = useGetCharactersQuery({ campaignId: id!, limit: 50 }, { skip: !id || !isDm });

  const { isConnected } = useWebSocket(isDm ? id : undefined);

  usePageTitle(campaign ? `DM Screen — ${campaign.name}` : 'DM Screen — DnD Companion');

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Campaign not found.</AlertDescription>
      </Alert>
    );
  }

  if (campaignLoading) {
    return <LoadingSpinner label="Loading DM Screen" />;
  }

  if (campaignError || !campaign) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Campaign not found</h1>
        <p className="text-muted-foreground">
          This campaign does not exist or you do not have access.
        </p>
        <Button asChild variant="outline">
          <Link to="/my-campaigns">Back to My Campaigns</Link>
        </Button>
      </div>
    );
  }

  // DM-only screen — non-DM members get 404 UX (docs/06 §6.1)
  if (!isDm) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Campaign not found</h1>
        <p className="text-muted-foreground">
          This campaign does not exist or you do not have access.
        </p>
        <Button asChild variant="outline">
          <Link to={`/campaigns/${id}`}>Back to Campaign</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/campaigns/${id}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Campaign
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
        <span className="text-sm text-muted-foreground">DM Screen</span>
      </div>

      <ConnectionBanner isConnected={isConnected} />

      {/* Desktop / tablet: two columns (md+) */}
      <div className="hidden gap-6 md:grid md:grid-cols-[2fr_1fr]">
        <PlayersPanel
          characters={charactersData}
          canEdit={isDm}
          isLoading={charactersLoading}
          isError={charactersError}
        />
        <DmNotesPanel campaignId={id} />
      </div>

      {/* Mobile: tab switch */}
      <div className="md:hidden">
        <Tabs value={mobileTab} onValueChange={setMobileTab}>
          <TabsList aria-label="DM Screen sections" className="w-full">
            <TabsTrigger value="players" className="flex-1">
              Players
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex-1">
              Notes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="players">
            <PlayersPanel
              characters={charactersData}
              canEdit={isDm}
              isLoading={charactersLoading}
              isError={charactersError}
            />
          </TabsContent>
          <TabsContent value="notes">
            <DmNotesPanel campaignId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
