import { useState } from 'react';
import { Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordResetRequestSchema } from '@dnd-companion/shared';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error';
import { useRequestPasswordResetMutation } from '@/store/api/authApi';

type FormValues = z.infer<typeof passwordResetRequestSchema>;

/** S-PW-RESET-REQ — Password reset request page */
export function PasswordResetRequestPage() {
  usePageTitle('Forgot password — DnD Companion');
  const [requestReset, { isLoading }] = useRequestPasswordResetMutation();
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    try {
      await requestReset(values).unwrap();
      setSubmitted(true);
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 429) {
        setApiError('Too many requests. Please try again later.');
      } else {
        setApiError(getApiErrorMessage(error, 'Something went wrong. Please try again.'));
      }
    }
  };

  return (
    <Card className="mx-auto w-full sm:p-6">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email address and we will send you a reset link if an account exists.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              If an account exists with that email, we&apos;ve sent a password reset link. Check
              your inbox.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Back to login</Link>
            </Button>
          </div>
        ) : (
          <>
            {apiError ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            ) : null}

            <Form {...form}>
              <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
