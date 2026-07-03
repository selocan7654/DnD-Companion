import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HomebrewListItem } from '@/types/api';

import { formatHomebrewSource, formatHomebrewType, truncateText } from './homebrewUtils';

interface HomebrewCardProps {
  item: HomebrewListItem;
  showStatus?: boolean;
  actionSlot?: React.ReactNode;
}

export function HomebrewStatusBadge({ status }: { status: 'DRAFT' | 'PUBLISHED' }) {
  if (status === 'DRAFT') {
    return (
      <Badge variant="outline" className="border-amber-500 text-amber-700">
        Draft
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="border-green-600 text-green-700">
      Published
    </Badge>
  );
}

export function HomebrewCard({ item, showStatus = false, actionSlot }: HomebrewCardProps) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <Link
        to={`/homebrew/${item.id}`}
        className="block flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          className="flex h-24 items-center justify-center rounded-t-lg bg-gradient-to-br from-amber-600 to-orange-800"
          style={
            item.imageUrl
              ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover' }
              : undefined
          }
          aria-hidden="true"
        >
          {!item.imageUrl ? (
            <span className="text-sm font-medium text-white/90">
              {formatHomebrewType(item.type)}
            </span>
          ) : null}
        </div>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight">{item.name}</CardTitle>
            <div className="flex flex-wrap gap-1">
              {showStatus ? <HomebrewStatusBadge status={item.status} /> : null}
              <Badge variant="outline">{formatHomebrewType(item.type)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{formatHomebrewSource(item.source)}</Badge>
          </div>
          {item.description ? <p>{truncateText(item.description, 100)}</p> : null}
          {item.ownerUsername ? <p>by @{item.ownerUsername}</p> : null}
        </CardContent>
      </Link>
      {actionSlot ? <div className="border-t p-3">{actionSlot}</div> : null}
    </Card>
  );
}
