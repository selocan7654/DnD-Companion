import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InviteLinkManager } from '@/features/campaigns/InviteLinkManager';
import { MemberList } from '@/features/campaigns/MemberList';
import { CampaignAssignedCharacters } from '@/features/campaigns/CampaignAssignedCharacters';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import { useDeleteCampaignMutation, useGetCampaignQuery } from '@/store/api/campaignsApi';

/** S-CAMPAIGN-DETAIL — Campaign detail */
export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, isError } = useGetCampaignQuery(id!, { skip: !id });
  const [deleteCampaign, { isLoading: isDeleting }] = useDeleteCampaignMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const campaign = data?.data;
  const isOwner = !!user && !!campaign && campaign.ownerId === user.id;

  usePageTitle(campaign ? `${campaign.name} — DnD Companion` : 'Campaign — DnD Companion');

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Campaign not found.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading campaign" />;
  }

  if (isError || !campaign) {
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

  const handleDelete = async () => {
    try {
      await deleteCampaign(id).unwrap();
      toast({ title: 'Campaign deleted' });
      navigate('/my-campaigns', { replace: true });
    } catch (error) {
      toast({
        title: 'Failed to delete campaign',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-8">
      <div
        className="h-40 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-800"
        style={
          campaign.bannerUrl
            ? { backgroundImage: `url(${campaign.bannerUrl})`, backgroundSize: 'cover' }
            : undefined
        }
        role="img"
        aria-label={`${campaign.name} banner`}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
          {campaign.setting ? <Badge variant="outline">{campaign.setting}</Badge> : null}
          {campaign.description ? (
            <p className="max-w-2xl text-muted-foreground">{campaign.description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {isOwner ? (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to={`/campaigns/${id}/edit`}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Link>
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {showDeleteConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h2 id="delete-dialog-title" className="text-lg font-semibold">
              Delete campaign?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This action cannot be undone. All members and DM notes will be removed.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                aria-busy={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-8">
          {isOwner ? (
            <InviteLinkManager
              campaignId={id}
              inviteToken={campaign.inviteToken}
              isOwner={isOwner}
            />
          ) : null}

          {user ? <MemberList campaignId={id} currentUserId={user.id} isOwner={isOwner} /> : null}
        </div>

        <section className="space-y-3" aria-labelledby="characters-section-heading">
          <h2 id="characters-section-heading" className="text-lg font-semibold">
            Assigned Characters ({campaign.assignedCharacterCount ?? 0})
          </h2>
          <CampaignAssignedCharacters campaignId={id} />
        </section>
      </div>
    </div>
  );
}
