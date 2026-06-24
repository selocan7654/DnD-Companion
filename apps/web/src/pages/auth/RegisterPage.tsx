import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
import { registerFormSchema, type RegisterFormInput } from '@/features/auth/schemas';
import { usePageTitle } from '@/hooks/usePageTitle';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import type { ApiErrorBody } from '@/types/api';
import { useLoginMutation, useRegisterMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

/** S-REGISTER — Create account page */
export function RegisterPage() {
  usePageTitle('Create account — DnD Companion');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const isLoading = isRegistering || isLoggingIn;

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      passwordConfirm: '',
    },
  });

  const onSubmit = async (values: RegisterFormInput) => {
    setApiError(null);
    try {
      await register({
        username: values.username,
        email: values.email,
        password: values.password,
      }).unwrap();

      const loginResult = await login({
        email: values.email,
        password: values.password,
      }).unwrap();

      dispatch(
        setCredentials({
          accessToken: loginResult.data.accessToken,
          user: loginResult.data.user,
        }),
      );
      navigate('/', { replace: true });
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 429) {
        toast({
          title: 'Too many requests',
          description: 'Too many requests. Please try again later.',
        });
        setApiError('Too many requests. Please try again later.');
        return;
      }

      if (status === 409 && error && typeof error === 'object' && 'data' in error) {
        const body = (error as { data: ApiErrorBody }).data;
        if (body.details?.length) {
          for (const detail of body.details) {
            const field = detail.field.replace('body.', '') as keyof RegisterFormInput;
            if (field in form.getValues()) {
              form.setError(field, { message: detail.issue });
            }
          }
          return;
        }
      }

      setApiError(getApiErrorMessage(error, 'Registration failed. Please try again.'));
    }
  };

  return (
    <Card className="mx-auto w-full sm:p-6">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Join DnD Companion to manage campaigns and characters.</CardDescription>
      </CardHeader>
      <CardContent>
        {apiError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input autoComplete="username" placeholder="player42" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordConfirm"
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
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
