import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import type { CreateCampaignInput } from '@dnd-companion/shared';

import { CampaignForm } from '@/features/campaigns/CampaignForm';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import { useCreateCampaignMutation } from '@/store/api/campaignsApi';

/** S-CAMPAIGN-CREATE — Create campaign */
export function CampaignCreatePage() {
  usePageTitle('Create Campaign — DnD Companion');
  const navigate = useNavigate();
  const { isEmailVerified } = useAuth();
  const [createCampaign, { isLoading }] = useCreateCampaignMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isEmailVerified) {
    return <Navigate to="/my-campaigns" replace />;
  }

  const handleSubmit = async (values: CreateCampaignInput) => {
    setApiError(null);
    try {
      const result = await createCampaign(values).unwrap();
      toast({ title: 'Campaign created' });
      navigate(`/campaigns/${result.data.id}`, { replace: true });
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Failed to create campaign'));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link to="/my-campaigns" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Campaigns
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New Campaign</h1>
      </div>

      <CampaignForm
        submitLabel="Create Campaign"
        isSubmitting={isLoading}
        apiError={apiError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
