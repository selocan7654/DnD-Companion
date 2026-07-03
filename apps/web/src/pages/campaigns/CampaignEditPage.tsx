import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import type { CreateCampaignInput } from '@dnd-companion/shared';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CampaignForm } from '@/features/campaigns/CampaignForm';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import { useGetCampaignQuery, useUpdateCampaignMutation } from '@/store/api/campaignsApi';

/** S-CAMPAIGN-EDIT — Edit campaign */
export function CampaignEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, isError } = useGetCampaignQuery(id!, { skip: !id });
  const [updateCampaign, { isLoading: isSaving }] = useUpdateCampaignMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const campaign = data?.data;

  usePageTitle(
    campaign ? `Edit ${campaign.name} — DnD Companion` : 'Edit Campaign — DnD Companion',
  );

  if (!id) {
    return <Navigate to="/my-campaigns" replace />;
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading campaign" />;
  }

  if (isError || !campaign) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Campaign not found.</AlertDescription>
      </Alert>
    );
  }

  if (!user || campaign.ownerId !== user.id) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Campaign not found.</AlertDescription>
      </Alert>
    );
  }

  const handleSubmit = async (values: CreateCampaignInput) => {
    setApiError(null);
    try {
      await updateCampaign({
        id,
        body: {
          name: values.name,
          description: values.description || null,
          setting: values.setting || null,
        },
      }).unwrap();
      toast({ title: 'Campaign updated' });
      navigate(`/campaigns/${id}`, { replace: true });
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Failed to update campaign'));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link
          to={`/campaigns/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Campaign
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Campaign</h1>
      </div>

      <CampaignForm
        submitLabel="Save Changes"
        isSubmitting={isSaving}
        apiError={apiError}
        defaultValues={{
          name: campaign.name,
          description: campaign.description ?? '',
          setting: campaign.setting ?? '',
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
