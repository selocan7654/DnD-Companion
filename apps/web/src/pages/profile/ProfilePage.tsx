import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { UploadPurpose } from '@dnd-companion/shared';

import { ImageUpload } from '@/components/ImageUpload';
import { LoadingSpinner } from '@/components/LoadingSpinner';
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
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import { useResendVerificationMutation } from '@/store/api/authApi';
import {
  useChangePasswordMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
} from '@/store/api/usersApi';
import { updateUser } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';

import {
  changePasswordFormSchema,
  profileFormSchema,
  type ChangePasswordFormInput,
  type ProfileFormInput,
} from './profileSchemas';

/** S-PROFILE — Account profile and password settings */
export function ProfilePage() {
  usePageTitle('My Profile — DnD Companion');

  const dispatch = useAppDispatch();
  const { isEmailVerified } = useAuth();
  const { data, isLoading, isError } = useGetMeQuery();
  const [updateProfile, { isLoading: isSavingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [resendVerification, { isLoading: isResending }] = useResendVerificationMutation();

  const [profileApiError, setProfileApiError] = useState<string | null>(null);
  const [passwordApiError, setPasswordApiError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const profile = data?.data;

  const profileForm = useForm<ProfileFormInput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { username: '' },
  });

  const passwordForm = useForm<ChangePasswordFormInput>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({ username: profile.username });
      setAvatarUrl(profile.avatarUrl);
    }
  }, [profile, profileForm]);

  if (isLoading) {
    return <LoadingSpinner label="Loading profile" />;
  }

  if (isError || !profile) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load profile. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  const onProfileSubmit = async (values: ProfileFormInput) => {
    if (!isEmailVerified) {
      return;
    }

    setProfileApiError(null);

    try {
      const result = await updateProfile({
        username: values.username,
        avatarUrl,
      }).unwrap();

      dispatch(
        updateUser({
          username: result.data.username,
          avatarUrl: result.data.avatarUrl,
        }),
      );

      toast({ title: 'Profile updated' });
    } catch (error) {
      setProfileApiError(getApiErrorMessage(error, 'Failed to update profile'));
    }
  };

  const onPasswordSubmit = async (values: ChangePasswordFormInput) => {
    if (!isEmailVerified) {
      return;
    }

    setPasswordApiError(null);

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();

      passwordForm.reset();
      toast({
        title: 'Password changed',
        description: 'Other sessions have been signed out.',
      });
    } catch (error) {
      setPasswordApiError(getApiErrorMessage(error, 'Failed to change password'));
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerification().unwrap();
      toast({ title: 'Verification email sent' });
    } catch (error) {
      toast({
        title: 'Failed to send verification email',
        description: getApiErrorMessage(error, 'Please try again later'),
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings and password.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your username and avatar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUpload
            purpose={UploadPurpose.AVATAR}
            label="Avatar"
            currentUrl={avatarUrl}
            previewAlt={`${profile.username} avatar`}
            disabled={!isEmailVerified}
            onUploadComplete={(url) => setAvatarUrl(url)}
            onClear={() => setAvatarUrl(null)}
          />

          <Form {...profileForm}>
            <form
              onSubmit={(e) => void profileForm.handleSubmit(onProfileSubmit)(e)}
              className="space-y-4"
              noValidate
            >
              {profileApiError ? (
                <Alert variant="destructive">
                  <AlertDescription>{profileApiError}</AlertDescription>
                </Alert>
              ) : null}

              <FormField
                control={profileForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="username"
                        disabled={!isEmailVerified || isSavingProfile}
                        aria-required="true"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel htmlFor="profile-email">Email</FormLabel>
                <Input
                  id="profile-email"
                  value={profile.email}
                  readOnly
                  disabled
                  aria-readonly="true"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed in this version.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium leading-none">Email verification</span>
                {isEmailVerified ? (
                  <p className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Verified
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-amber-800">
                      Your email is not verified. Verify your email to edit your profile or change
                      your password.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void handleResendVerification()}
                      disabled={isResending}
                      aria-busy={isResending}
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          Sending...
                        </>
                      ) : (
                        'Resend verification email'
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={!isEmailVerified || isSavingProfile}
                aria-busy={isSavingProfile}
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={(e) => void passwordForm.handleSubmit(onPasswordSubmit)(e)}
              className="space-y-4"
              noValidate
            >
              {passwordApiError ? (
                <Alert variant="destructive">
                  <AlertDescription>{passwordApiError}</AlertDescription>
                </Alert>
              ) : null}

              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        disabled={!isEmailVerified || isChangingPassword}
                        aria-required="true"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        disabled={!isEmailVerified || isChangingPassword}
                        aria-required="true"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        id="confirm-new-password"
                        type="password"
                        autoComplete="new-password"
                        disabled={!isEmailVerified || isChangingPassword}
                        aria-required="true"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={!isEmailVerified || isChangingPassword}
                aria-busy={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
