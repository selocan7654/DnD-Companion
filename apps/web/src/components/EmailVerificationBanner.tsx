import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

export function EmailVerificationBanner() {
  const { isEmailVerified } = useAuth();

  if (isEmailVerified) {
    return null;
  }

  return (
    <Alert
      role="alert"
      aria-live="assertive"
      className="mb-4 border-amber-500/50 bg-amber-50 text-amber-900"
    >
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertDescription>
        Please verify your email to create campaigns and join invites. Check your inbox for the
        verification link.
      </AlertDescription>
    </Alert>
  );
}
