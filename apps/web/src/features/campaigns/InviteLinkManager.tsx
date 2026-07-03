import { useEffect, useState } from 'react';
import { Copy, Link2, Loader2, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import { useDisableInviteMutation, useRegenerateInviteMutation } from '@/store/api/campaignsApi';

interface InviteLinkManagerProps {
  campaignId: string;
  inviteToken: string | null;
  isOwner: boolean;
}

function buildInviteUrl(token: string): string {
  return `${window.location.origin}/invite/${token}`;
}

export function InviteLinkManager({ campaignId, inviteToken, isOwner }: InviteLinkManagerProps) {
  const [regenerate, { isLoading: isRegenerating }] = useRegenerateInviteMutation();
  const [disable, { isLoading: isDisabling }] = useDisableInviteMutation();
  const [localInviteUrl, setLocalInviteUrl] = useState<string | null>(
    inviteToken ? buildInviteUrl(inviteToken) : null,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLocalInviteUrl(inviteToken ? buildInviteUrl(inviteToken) : null);
  }, [inviteToken]);

  if (!isOwner) {
    return null;
  }

  const inviteUrl = localInviteUrl;
  const isDisabled = !inviteToken && !localInviteUrl;

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: 'Invite link copied' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually.',
      });
    }
  };

  const handleRegenerate = async () => {
    try {
      const result = await regenerate(campaignId).unwrap();
      setLocalInviteUrl(result.data.inviteUrl);
      toast({ title: 'Invite link regenerated' });
    } catch (error) {
      toast({
        title: 'Failed to regenerate invite',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const handleDisable = async () => {
    try {
      await disable(campaignId).unwrap();
      setLocalInviteUrl(null);
      toast({ title: 'Invite link disabled' });
    } catch (error) {
      toast({
        title: 'Failed to disable invite',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  return (
    <section className="space-y-3 rounded-lg border p-4" aria-labelledby="invite-section-heading">
      <h2 id="invite-section-heading" className="text-lg font-semibold">
        Invite players
      </h2>

      {isDisabled ? (
        <Alert>
          <AlertDescription>
            Invitations are disabled. Regenerate a link to invite new players.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Link2
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input readOnly value={inviteUrl ?? ''} className="pl-9" aria-label="Invite link URL" />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleCopy()}
            disabled={!inviteUrl}
            aria-label="Copy invite link"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void handleRegenerate()}
          disabled={isRegenerating || isDisabling}
          aria-label="Regenerate invite link"
        >
          {isRegenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          Regenerate link
        </Button>
        {!isDisabled ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDisable()}
            disabled={isRegenerating || isDisabling}
          >
            {isDisabling ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Disable invite
          </Button>
        ) : null}
      </div>
    </section>
  );
}
