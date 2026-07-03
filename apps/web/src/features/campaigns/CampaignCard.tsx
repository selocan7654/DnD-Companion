import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CampaignListItem } from '@/types/api';

interface CampaignCardProps {
  campaign: CampaignListItem;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  return (
    <Link to={`/campaigns/${campaign.id}`} className="block focus-visible:outline-none">
      <Card className="h-full transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring">
        <div
          className="h-24 rounded-t-lg bg-gradient-to-br from-violet-600 to-indigo-800"
          style={
            campaign.bannerUrl
              ? { backgroundImage: `url(${campaign.bannerUrl})`, backgroundSize: 'cover' }
              : undefined
          }
          aria-hidden="true"
        />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{campaign.name}</CardTitle>
            <Badge variant={campaign.role === 'DM' ? 'default' : 'secondary'}>
              {campaign.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {campaign.setting ? <p>{campaign.setting}</p> : null}
          <p>
            {campaign.memberCount} {campaign.memberCount === 1 ? 'member' : 'members'}
          </p>
          <p className="text-xs">Created {formatDate(campaign.createdAt)}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
