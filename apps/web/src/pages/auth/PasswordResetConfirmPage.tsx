import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

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
import {
  passwordResetConfirmFormSchema,
  type PasswordResetConfirmFormInput,
} from '@/features/auth/schemas';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getApiErrorMessage } from '@/lib/api-error';
import { useConfirmPasswordResetMutation } from '@/store/api/authApi';

/** S-PW-RESET-CONF — Password reset confirmation page */
export function PasswordResetConfirmPage() {
  usePageTitle('Reset password — DnD Companion');
  const { token: pathToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const token = pathToken ?? searchParams.get('token') ?? '';
  const [confirmReset, { isLoading }] = useConfirmPasswordResetMutation();
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<PasswordResetConfirmFormInput>({
    resolver: zodResolver(passwordResetConfirmFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: PasswordResetConfirmFormInput) => {
    if (!token) {
      setApiError('Invalid or expired reset token.');
      return;
    }

    setApiError(null);
    try {
      await confirmReset({ token, newPassword: values.newPassword }).unwrap();
      setSuccess(true);
    } catch (error) {
      setApiError(getApiErrorMessage(error, 'Invalid or expired reset token.'));
    }
  };

  if (!token) {
    return (
      <Card className="mx-auto w-full sm:p-6">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>Invalid or expired reset token.</AlertDescription>
          </Alert>
          <Button asChild variant="outline" className="w-full">
            <Link to="/forgot-password">Request a new reset link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full sm:p-6">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Password reset successfully!</p>
            <Button asChild className="w-full">
              <Link to="/login">Go to login</Link>
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
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading} aria-busy={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Resetting...
                    </>
                  ) : (
                    'Reset password'
                  )}
                </Button>
              </form>
            </Form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link
                to="/forgot-password"
                className="text-primary underline-offset-4 hover:underline"
              >
                Request a new reset link
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
