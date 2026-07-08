import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';

export function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  const homePath = isAuthenticated ? '/my-campaigns' : '/homebrew';

  usePageTitle('Page Not Found — DnD Companion');

  return (
    <Card className="text-center">
      <CardHeader>
        <CardTitle className="text-6xl font-bold tracking-tight">404</CardTitle>
        <CardDescription className="text-base">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to={homePath}>Go Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
