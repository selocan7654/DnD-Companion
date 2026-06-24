import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from '@/hooks/use-toast';
import { useResendVerificationMutation, useVerifyEmailMutation } from '@/store/api/authApi';
import { updateUser } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

type VerifyState = 'loading' | 'success' | 'error';

/** S-VERIFY-EMAIL — Email verification page */
export function VerifyEmailPage() {
  usePageTitle('Verify email — DnD Companion');
  const { token: pathToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const token = pathToken ?? searchParams.get('token') ?? '';
  const { isAuthenticated } = useAuth();
  const dispatch = useAppDispatch();
  const [verifyEmail] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();
  const [state, setState] = useState<VerifyState>('loading');

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        await verifyEmail({ token }).unwrap();
        if (!cancelled) {
          setState('success');
          dispatch(updateUser({ emailVerifiedAt: new Date().toISOString() }));
        }
      } catch {
        if (!cancelled) {
          setState('error');
        }
      }
    };

    void verify();

    return () => {
      cancelled = true;
    };
  }, [token, verifyEmail, dispatch]);

  const handleResend = async () => {
    try {
      await resendVerification().unwrap();
      toast({ title: 'Verification email sent' });
    } catch {
      toast({
        title: 'Failed to send verification email',
      });
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md text-center sm:p-6">
      <CardHeader>
        <CardTitle>Email verification</CardTitle>
        <CardDescription>
          {state === 'loading' ? 'Verifying your email...' : 'Verification result'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {state === 'loading' ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Verifying your email...</p>
          </>
        ) : null}

        {state === 'success' ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600" aria-hidden="true" />
            <p className="text-sm">Email verified successfully!</p>
            <Button asChild>
              <Link to={isAuthenticated ? '/' : '/login'}>
                {isAuthenticated ? 'Go to dashboard' : 'Go to login'}
              </Link>
            </Button>
          </>
        ) : null}

        {state === 'error' ? (
          <>
            <XCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Invalid or expired verification link.</p>
            {isAuthenticated ? (
              <Button onClick={() => void handleResend()} disabled={isResending}>
                {isResending ? 'Sending...' : 'Resend verification email'}
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/login">Go to login</Link>
              </Button>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
