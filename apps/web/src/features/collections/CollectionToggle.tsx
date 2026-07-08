import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import {
  useAddToCollectionMutation,
  useGetCollectionQuery,
  useRemoveFromCollectionMutation,
} from '@/store/api/collectionsApi';

interface CollectionToggleProps {
  homebrewItemId: string;
  isPublished: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/** Bookmark toggle for published homebrew / official reference items. */
export function CollectionToggle({
  homebrewItemId,
  isPublished,
  variant = 'outline',
  size = 'sm',
}: CollectionToggleProps) {
  const { isAuthenticated, isEmailVerified } = useAuth();
  const { data, isLoading: isCollectionLoading } = useGetCollectionQuery(
    { limit: 50 },
    { skip: !isAuthenticated || !isEmailVerified },
  );
  const [addToCollection, { isLoading: isAdding }] = useAddToCollectionMutation();
  const [removeFromCollection, { isLoading: isRemoving }] = useRemoveFromCollectionMutation();

  if (!isAuthenticated) {
    return null;
  }

  if (!isPublished) {
    return null;
  }

  const isInCollection = data?.data.some((item) => item.homebrewItemId === homebrewItemId) ?? false;
  const isBusy = isAdding || isRemoving;

  const handleToggle = async () => {
    if (!isEmailVerified) {
      toast({
        title: 'Email verification required',
        description: 'Please verify your email to manage your collection',
      });
      return;
    }

    try {
      if (isInCollection) {
        await removeFromCollection(homebrewItemId).unwrap();
        toast({ title: 'Removed from collection' });
      } else {
        await addToCollection(homebrewItemId).unwrap();
        toast({ title: 'Added to collection' });
      }
    } catch (error) {
      if (getApiErrorCode(error) === 'ALREADY_IN_COLLECTION') {
        toast({ title: 'Already in your collection' });
        return;
      }
      toast({
        title: isInCollection ? 'Failed to remove from collection' : 'Failed to add to collection',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={!isEmailVerified || isBusy || isCollectionLoading}
      onClick={() => void handleToggle()}
      aria-label={isInCollection ? 'Remove from collection' : 'Add to collection'}
      title={
        !isEmailVerified
          ? 'Please verify your email to perform this action'
          : isInCollection
            ? 'Remove from collection'
            : 'Add to collection'
      }
    >
      {isBusy ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : isInCollection ? (
        <BookmarkCheck className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Bookmark className="h-4 w-4" aria-hidden="true" />
      )}
      {isInCollection ? 'In Collection' : 'Add to Collection'}
    </Button>
  );
}
