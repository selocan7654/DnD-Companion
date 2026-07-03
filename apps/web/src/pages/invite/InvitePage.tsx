import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import { useJoinCampaignMutation, usePreviewInviteQuery } from '@/store/api/campaignsApi';

type InvitePageState = 'loading' | 'invite' | 'already-member' | 'invalid';

/** S-INVITE — Campaign invite join */
export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { isEmailVerified } = useAuth();
  const [pageState, setPageState] = useState<InvitePageState>('loading');
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const { data, isLoading, isError, error } = usePreviewInviteQuery(token!, { skip: !token });
  const [joinCampaign, { isLoading: isJoining }] = useJoinCampaignMutation();

  usePageTitle('Campaign Invite — DnD Companion');

  useEffect(() => {
    if (!token) {
      setPageState('invalid');
      return;
    }
    if (isLoading) {
      setPageState('loading');
      return;
    }
    if (isError) {
      const code = getApiErrorCode(error);
      if (code === 'ALREADY_MEMBER') {
        setPageState('already-member');
      } else {
        setPageState('invalid');
      }
      return;
    }
    if (data?.data) {
      setCampaignId(data.data.campaignId);
      setPageState('invite');
    }
  }, [token, isLoading, isError, error, data]);

  const handleJoin = async () => {
    if (!token) return;
    if (!isEmailVerified) {
      toast({
        title: 'Email verification required',
        description: 'Please verify your email to join a campaign.',
      });
      return;
    }

    try {
      const result = await joinCampaign(token).unwrap();
      toast({ title: 'Joined campaign' });
      navigate(`/campaigns/${result.data.campaignId}`, { replace: true });
    } catch (joinError) {
      const code = getApiErrorCode(joinError);
      if (code === 'ALREADY_MEMBER') {
        setPageState('already-member');
        if (campaignId) {
          navigate(`/campaigns/${campaignId}`, { replace: true });
        }
        return;
      }
      toast({
        title: 'Failed to join',
        description: getApiErrorMessage(joinError, 'Something went wrong'),
      });
    }
  };

  if (pageState === 'loading') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-12" role="status">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>Validating invite...</span>
        </CardContent>
      </Card>
    );
  }

  if (pageState === 'invalid') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Invite</CardTitle>
          <CardDescription>This invite link is invalid or has been disabled.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link to="/my-campaigns">Go to My Campaigns</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (pageState === 'already-member') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Already a member</CardTitle>
          <CardDescription>You are already a member of this campaign.</CardDescription>
        </CardHeader>
        <CardContent>
          {campaignId ? (
            <Button asChild className="w-full">
              <Link to={`/campaigns/${campaignId}`}>Go to Campaign</Link>
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link to="/my-campaigns">Go to My Campaigns</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const preview = data!.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>You&apos;ve been invited!</CardTitle>
        <CardDescription>Join this campaign to start your adventure.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-xl font-semibold">{preview.campaignName}</p>
          <p className="text-sm text-muted-foreground">Hosted by @{preview.dmUsername}</p>
          <p className="text-sm text-muted-foreground">
            {preview.memberCount} {preview.memberCount === 1 ? 'member' : 'members'}
          </p>
        </div>

        {!isEmailVerified ? (
          <Alert>
            <AlertDescription>Please verify your email before joining a campaign.</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            disabled={!isEmailVerified || isJoining}
            aria-busy={isJoining}
            onClick={() => void handleJoin()}
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Joining...
              </>
            ) : (
              'Join Campaign'
            )}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to="/my-campaigns">No thanks</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
