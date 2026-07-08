import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePageTitle } from '@/hooks/usePageTitle';

export function ServerErrorPage() {
  usePageTitle('Server Error — DnD Companion');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <main id="main-content" className="w-full max-w-md" tabIndex={-1}>
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight">
              Something went wrong
            </CardTitle>
            <CardDescription className="text-base">
              An unexpected error occurred. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
