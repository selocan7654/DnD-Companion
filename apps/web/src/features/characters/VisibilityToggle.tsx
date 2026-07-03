import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSetVisibilityMutation } from '@/store/api/charactersApi';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import type { Character } from '@/types/api';

interface VisibilityToggleProps {
  character: Character;
}

export function VisibilityToggle({ character }: VisibilityToggleProps) {
  const [setVisibility, { isLoading }] = useSetVisibilityMutation();
  const isPublic = character.visibility === 'PUBLIC';

  const handleToggle = async () => {
    const nextVisibility = isPublic ? 'PRIVATE' : 'PUBLIC';

    try {
      await setVisibility({ id: character.id, visibility: nextVisibility }).unwrap();
      toast({
        title: nextVisibility === 'PUBLIC' ? 'Character is now public' : 'Character is now private',
      });
    } catch (error) {
      toast({
        title: 'Failed to update visibility',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  return (
    <section className="rounded-lg border p-4" aria-labelledby="visibility-heading">
      <h2 id="visibility-heading" className="text-sm font-semibold">
        Visibility
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isPublic
          ? 'Anyone can view this character sheet without signing in.'
          : 'Only you and campaign members can view this character.'}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm font-medium" id="visibility-status">
          {isPublic ? 'Public' : 'Private'}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          role="switch"
          aria-checked={isPublic}
          aria-labelledby="visibility-status"
          onClick={() => void handleToggle()}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Updating...
            </>
          ) : isPublic ? (
            'Make private'
          ) : (
            'Make public'
          )}
        </Button>
      </div>
    </section>
  );
}
