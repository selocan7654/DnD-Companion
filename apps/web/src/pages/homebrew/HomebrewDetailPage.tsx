import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CollectionToggle } from '@/features/collections/CollectionToggle';
import { HomebrewStatusBadge } from '@/features/homebrew/HomebrewCard';
import { formatHomebrewSource, formatHomebrewType } from '@/features/homebrew/homebrewUtils';
import { StatBlock } from '@/features/homebrew/StatBlock';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AppChrome } from '@/layouts/AppChrome';
import { PublicLayout } from '@/layouts/PublicLayout';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import {
  useDeleteHomebrewMutation,
  useGetHomebrewDetailQuery,
  usePublishHomebrewMutation,
  useUnpublishHomebrewMutation,
} from '@/store/api/homebrewApi';

function HomebrewDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isEmailVerified } = useAuth();
  const { data, isLoading, isError } = useGetHomebrewDetailQuery(id!, { skip: !id });
  const item = data?.data;
  const [publishHomebrew, { isLoading: isPublishing }] = usePublishHomebrewMutation();
  const [unpublishHomebrew, { isLoading: isUnpublishing }] = useUnpublishHomebrewMutation();
  const [deleteHomebrew, { isLoading: isDeleting }] = useDeleteHomebrewMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  usePageTitle(item ? `${item.name} — DnD Companion` : 'Homebrew — DnD Companion');

  const isOwner = Boolean(user && item?.ownerId === user.id);
  const canEditHomebrew = isOwner && item?.source === 'HOMEBREW';

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
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>Homebrew item not found.</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/homebrew">Back to Gallery</Link>
        </Button>
      </div>
    );
  }

  const handlePublish = async () => {
    try {
      await publishHomebrew(item.id).unwrap();
      toast({ title: 'Homebrew published' });
    } catch (error) {
      toast({
        title: 'Failed to publish homebrew',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const handleUnpublish = async () => {
    try {
      await unpublishHomebrew(item.id).unwrap();
      toast({ title: 'Homebrew unpublished' });
    } catch (error) {
      toast({
        title: 'Failed to unpublish homebrew',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteHomebrew(item.id).unwrap();
      toast({ title: 'Homebrew deleted' });
      navigate('/my-creations', { replace: true });
    } catch (error) {
      toast({
        title: 'Failed to delete homebrew',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/homebrew" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to Gallery
      </Link>

      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{formatHomebrewType(item.type)}</Badge>
              <Badge variant="secondary">{formatHomebrewSource(item.source)}</Badge>
              {isOwner ? <HomebrewStatusBadge status={item.status} /> : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <CollectionToggle homebrewItemId={item.id} isPublished={item.status === 'PUBLISHED'} />
            {canEditHomebrew ? (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/homebrew/${item.id}/edit`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </Link>
                </Button>
                {item.status === 'DRAFT' ? (
                  <Button
                    size="sm"
                    disabled={!isEmailVerified || isPublishing}
                    onClick={() => void handlePublish()}
                  >
                    {isPublishing ? 'Publishing…' : 'Publish'}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isUnpublishing}
                    onClick={() => void handleUnpublish()}
                  >
                    {isUnpublishing ? 'Unpublishing…' : 'Unpublish'}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  aria-label="Delete homebrew"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {item.ownerUsername ? (
          <p className="text-sm text-muted-foreground">Created by @{item.ownerUsername}</p>
        ) : null}

        {item.publishedAt ? (
          <p className="text-sm text-muted-foreground">
            Published {new Date(item.publishedAt).toLocaleDateString('en-US')}
          </p>
        ) : null}

        {item.description ? (
          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className="sr-only">
              Description
            </h2>
            <p className="whitespace-pre-wrap text-muted-foreground">{item.description}</p>
          </section>
        ) : null}
      </header>

      <StatBlock item={item} />

      {showDeleteConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h2 id="delete-dialog-title" className="text-lg font-semibold">
              Delete homebrew?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This action cannot be undone. Your homebrew will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Deleting…
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** S-HOMEBREW-DETAIL — homebrew detail (mixed auth) */
export function HomebrewDetailPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const content = <HomebrewDetailContent />;

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading session" />;
  }

  if (isAuthenticated) {
    return <AppChrome>{content}</AppChrome>;
  }

  return <PublicLayout>{content}</PublicLayout>;
}
