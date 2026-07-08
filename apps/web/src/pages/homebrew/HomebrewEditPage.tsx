import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import type { HomebrewFormValues } from '@dnd-companion/shared';
import { HomebrewType } from '@dnd-companion/shared';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { HomebrewForm } from '@/features/homebrew/HomebrewForm';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import { useGetHomebrewDetailQuery, useUpdateHomebrewMutation } from '@/store/api/homebrewApi';

/** S-HOMEBREW-EDIT — edit owned homebrew */
export function HomebrewEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isEmailVerified } = useAuth();
  const { data, isLoading, isError } = useGetHomebrewDetailQuery(id!, { skip: !id });
  const [updateHomebrew, { isLoading: isSaving }] = useUpdateHomebrewMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const item = data?.data;
  usePageTitle(item ? `Edit ${item.name} — DnD Companion` : 'Edit Homebrew — DnD Companion');

  if (!isEmailVerified) {
    return <Navigate to="/homebrew" replace />;
  }

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Homebrew item not found.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading homebrew" />;
  }

  if (isError || !item) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Homebrew item not found.</AlertDescription>
      </Alert>
    );
  }

  if (item.source !== 'HOMEBREW' || item.ownerId !== user?.id) {
    return <Navigate to={`/homebrew/${id}`} replace />;
  }

  const handleSubmit = async (values: HomebrewFormValues) => {
    setApiError(null);
    try {
      await updateHomebrew({
        id: item.id,
        body: {
          name: values.name,
          description: values.description,
          imageUrl: values.imageUrl ?? null,
          data: values.data,
        },
      }).unwrap();
      toast({ title: 'Homebrew saved' });
      navigate(`/homebrew/${item.id}`, { replace: true });
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Failed to save homebrew'));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          to={`/homebrew/${item.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Detail
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Homebrew</h1>
      </div>

      <HomebrewForm
        typeDisabled
        defaultValues={{
          name: item.name,
          type: item.type as HomebrewType,
          description: item.description ?? '',
          imageUrl: item.imageUrl,
          data: item.data,
        }}
        submitLabel="Save Changes"
        isSubmitting={isSaving}
        apiError={apiError}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
