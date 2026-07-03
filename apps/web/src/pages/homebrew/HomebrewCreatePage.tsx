import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import type { HomebrewFormValues } from '@dnd-companion/shared';

import { HomebrewForm } from '@/features/homebrew/HomebrewForm';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import { useCreateHomebrewMutation } from '@/store/api/homebrewApi';

/** S-HOMEBREW-CREATE — create homebrew draft */
export function HomebrewCreatePage() {
  usePageTitle('Create Homebrew — DnD Companion');
  const navigate = useNavigate();
  const { isEmailVerified } = useAuth();
  const [createHomebrew, { isLoading }] = useCreateHomebrewMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  if (!isEmailVerified) {
    return <Navigate to="/homebrew" replace />;
  }

  const handleSubmit = async (values: HomebrewFormValues) => {
    setApiError(null);
    try {
      const result = await createHomebrew({
        name: values.name,
        type: values.type,
        description: values.description,
        data: values.data,
      }).unwrap();
      toast({ title: 'Homebrew created as draft' });
      navigate(`/homebrew/${result.data.id}`, { replace: true });
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Failed to create homebrew'));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link to="/homebrew" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to Gallery
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create Homebrew</h1>
      </div>

      <HomebrewForm
        submitLabel="Create as Draft"
        isSubmitting={isLoading}
        apiError={apiError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
