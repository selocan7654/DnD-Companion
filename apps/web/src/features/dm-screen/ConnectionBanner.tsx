import { WifiOff } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConnectionBannerProps {
  isConnected: boolean;
}

export function ConnectionBanner({ isConnected }: ConnectionBannerProps) {
  if (isConnected) {
    return null;
  }

  return (
    <Alert
      className="border-amber-500/50 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>Live updates disconnected. Reconnecting...</AlertDescription>
    </Alert>
  );
}
