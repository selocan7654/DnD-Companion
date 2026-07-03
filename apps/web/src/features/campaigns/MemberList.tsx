import { Loader2, UserMinus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  useGetCampaignMembersQuery,
  useRemoveCampaignMemberMutation,
} from '@/store/api/campaignsApi';
import type { CampaignMember } from '@/types/api';

interface MemberListProps {
  campaignId: string;
  currentUserId: string;
  isOwner: boolean;
}

function formatJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function MemberRow({
  member,
  isOwner,
  currentUserId,
  onRemove,
  isRemoving,
}: {
  member: CampaignMember;
  isOwner: boolean;
  currentUserId: string;
  onRemove: (userId: string) => void;
  isRemoving: boolean;
}) {
  const isSelf = member.userId === currentUserId;
  const canKick = isOwner && member.role === 'PLAYER';
  const canLeave = !isOwner && isSelf && member.role === 'PLAYER';

  return (
    <li className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium"
          aria-hidden="true"
        >
          {member.username.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{member.username}</p>
          <p className="text-xs text-muted-foreground">
            Joined {formatJoinedDate(member.joinedAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={member.role === 'DM' ? 'default' : 'secondary'}>{member.role}</Badge>
        {canKick ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${member.username} from campaign`}
            disabled={isRemoving}
            onClick={() => onRemove(member.userId)}
          >
            <UserMinus className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
        {canLeave ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isRemoving}
            onClick={() => onRemove(member.userId)}
          >
            Leave
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function MemberList({ campaignId, currentUserId, isOwner }: MemberListProps) {
  const { data, isLoading, isError, refetch } = useGetCampaignMembersQuery(campaignId);
  const [removeMember, { isLoading: isRemoving }] = useRemoveCampaignMemberMutation();

  const handleRemove = async (userId: string) => {
    const isSelf = userId === currentUserId;
    const confirmed = window.confirm(
      isSelf
        ? 'Leave this campaign? Your assigned characters will be unlinked.'
        : 'Remove this player from the campaign?',
    );
    if (!confirmed) return;

    try {
      await removeMember({ campaignId, userId }).unwrap();
      toast({
        title: isSelf ? 'You left the campaign' : 'Member removed',
      });
      if (isSelf) {
        window.location.href = '/my-campaigns';
      }
    } catch (error) {
      toast({
        title: 'Action failed',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading members...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">Failed to load members.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const members = data?.data ?? [];
  const players = members.filter((m) => m.role === 'PLAYER');

  return (
    <section className="space-y-3" aria-labelledby="members-section-heading">
      <h2 id="members-section-heading" className="text-lg font-semibold">
        Members ({members.length})
      </h2>
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No players have joined yet. Share the invite link to get started.
        </p>
      ) : null}
      <ul className="space-y-2" aria-label="Campaign members">
        {members.map((member) => (
          <MemberRow
            key={member.userId}
            member={member}
            isOwner={isOwner}
            currentUserId={currentUserId}
            onRemove={(userId) => void handleRemove(userId)}
            isRemoving={isRemoving}
          />
        ))}
      </ul>
    </section>
  );
}
