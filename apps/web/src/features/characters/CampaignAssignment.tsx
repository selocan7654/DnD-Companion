import { useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useGetCampaignsQuery } from '@/store/api/campaignsApi';
import { useAssignCampaignMutation } from '@/store/api/charactersApi';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import type { Character } from '@/types/api';

interface CampaignAssignmentProps {
  character: Character;
}

export function CampaignAssignment({ character }: CampaignAssignmentProps) {
  const { data: campaignsData, isLoading: campaignsLoading } = useGetCampaignsQuery({ limit: 50 });
  const [assignCampaign, { isLoading: isAssigning }] = useAssignCampaignMutation();
  const [selectedCampaignId, setSelectedCampaignId] = useState(character.campaignId ?? '');

  const campaigns = campaignsData?.data ?? [];
  const isAssigned = character.campaignId !== null;

  const handleAssign = async () => {
    if (!selectedCampaignId) return;

    try {
      await assignCampaign({ id: character.id, campaignId: selectedCampaignId }).unwrap();
      toast({ title: 'Character assigned to campaign' });
    } catch (error) {
      const code = getApiErrorCode(error);
      toast({
        title: 'Failed to assign campaign',
        description:
          code === 'ALREADY_ASSIGNED_TO_CAMPAIGN'
            ? 'Already assigned to a campaign. Unassign first.'
            : getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const handleUnassign = async () => {
    try {
      await assignCampaign({ id: character.id, campaignId: null }).unwrap();
      setSelectedCampaignId('');
      toast({ title: 'Character unassigned from campaign' });
    } catch (error) {
      toast({
        title: 'Failed to unassign campaign',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  return (
    <section className="rounded-lg border p-4" aria-labelledby="campaign-assignment-heading">
      <h2 id="campaign-assignment-heading" className="text-sm font-semibold">
        Campaign Assignment
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Assign this character to a campaign you belong to.
      </p>

      {isAssigned ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            Currently assigned to campaign{' '}
            <span className="font-medium">
              {campaigns.find((c) => c.id === character.campaignId)?.name ?? 'Unknown'}
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleUnassign()}
            disabled={isAssigning}
            aria-busy={isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Unassigning...
              </>
            ) : (
              'Unassign from campaign'
            )}
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="campaign-select">Campaign</Label>
            <select
              id="campaign-select"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              disabled={campaignsLoading || campaigns.length === 0}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a campaign...</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} ({campaign.role})
                </option>
              ))}
            </select>
          </div>
          {campaigns.length === 0 && !campaignsLoading ? (
            <p className="text-sm text-muted-foreground">
              Join or create a campaign first to assign this character.
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={() => void handleAssign()}
            disabled={!selectedCampaignId || isAssigning}
            aria-busy={isAssigning}
          >
            {isAssigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Assigning...
              </>
            ) : (
              'Assign to campaign'
            )}
          </Button>
        </div>
      )}
    </section>
  );
}
