import { WifiOff } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { getReconnectDelayMs } from '@/lib/socket';

interface ConnectionBannerProps {
  isConnected: boolean;
  /** 1-based Socket.io reconnect_attempt count while disconnected */
  reconnectAttempt?: number;
}

export function ConnectionBanner({ isConnected, reconnectAttempt = 0 }: ConnectionBannerProps) {
  if (isConnected) {
    return null;
  }

  const delayMs = getReconnectDelayMs(Math.max(reconnectAttempt, 1));
  const delayLabel = delayMs >= 1000 ? `${Math.round(delayMs / 1000)}s` : `${delayMs}ms`;
  const attemptLabel = reconnectAttempt > 0 ? ` Retry #${reconnectAttempt} in ~${delayLabel}.` : '';

  return (
    <Alert
      className="border-amber-500/50 bg-amber-50 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
      role="status"
      aria-live="polite"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>Live updates disconnected. Reconnecting…{attemptLabel}</AlertDescription>
    </Alert>
  );
}
