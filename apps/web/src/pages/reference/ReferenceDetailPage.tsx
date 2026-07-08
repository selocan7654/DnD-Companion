import { Link, Navigate, useParams } from 'react-router-dom';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { CollectionToggle } from '@/features/collections/CollectionToggle';
import { formatHomebrewSource } from '@/features/homebrew/homebrewUtils';
import { StatBlock } from '@/features/homebrew/StatBlock';
import {
  formatReferenceTypeLabel,
  isValidReferenceType,
} from '@/features/reference/referenceUtils';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AppChrome } from '@/layouts/AppChrome';
import { PublicLayout } from '@/layouts/PublicLayout';
import { isReferenceItemType, useGetReferenceDetailQuery } from '@/store/api/referenceApi';
import type { HomebrewItem, ReferenceTypeSlug } from '@/types/api';

function ReferenceDetailContent() {
  const { type: typeParam, id } = useParams<{ type: string; id: string }>();
  const type = isValidReferenceType(typeParam) ? typeParam : undefined;

  const { data, isLoading, isError } = useGetReferenceDetailQuery(
    {
      type: type as Exclude<ReferenceTypeSlug, 'classes' | 'races'>,
      id: id!,
    },
    { skip: !id || !type || !isReferenceItemType(type) },
  );

  const item = data?.data;

  usePageTitle(item ? `${item.name} — Reference — DnD Companion` : 'Reference — DnD Companion');

  if (!type || !isValidReferenceType(type) || !isReferenceItemType(type)) {
    return <Navigate to="/reference/spells" replace />;
  }

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Reference item not found.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading reference" />;
  }

  if (isError || !item) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>Reference item not found.</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to={`/reference/${type}`}>Back to {formatReferenceTypeLabel(type)}</Link>
        </Button>
      </div>
    );
  }

  const statBlockItem: HomebrewItem = {
    id: item.id,
    name: item.name,
    type: item.type,
    source: item.source,
    status: 'PUBLISHED',
    description: item.description,
    imageUrl: item.imageUrl,
    ownerUsername: null,
    createdAt: item.createdAt,
    data: item.data,
    ownerId: null,
    publishedAt: item.publishedAt,
    updatedAt: item.updatedAt,
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link to="/reference/spells" className="hover:text-foreground">
              Reference
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link to={`/reference/${type}`} className="hover:text-foreground">
              {formatReferenceTypeLabel(type)}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="text-foreground" aria-current="page">
            {item.name}
          </li>
        </ol>
      </nav>

      <header className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-base">
                {formatHomebrewSource(item.source)}
              </Badge>
            </div>
          </div>
          <CollectionToggle homebrewItemId={item.id} isPublished />
        </div>

        {item.description ? (
          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className="sr-only">
              Description
            </h2>
            <p className="whitespace-pre-wrap text-muted-foreground">{item.description}</p>
          </section>
        ) : null}
      </header>

      <StatBlock item={statBlockItem} />
    </div>
  );
}

/** S-REF-DETAIL — official 5e reference detail (public) */
export function ReferenceDetailPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const content = <ReferenceDetailContent />;

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading session" />;
  }

  if (isAuthenticated) {
    return <AppChrome>{content}</AppChrome>;
  }

  return <PublicLayout>{content}</PublicLayout>;
}
