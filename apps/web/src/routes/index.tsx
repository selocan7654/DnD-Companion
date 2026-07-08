import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/features/auth/PublicOnlyRoute';
import { RootRedirect } from '@/features/auth/RootRedirect';
import { AppLayout } from '@/layouts/AppLayout';
import { AppShell } from '@/layouts/AppShell';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MinimalLayout } from '@/layouts/MinimalLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { PasswordResetConfirmPage } from '@/pages/auth/PasswordResetConfirmPage';
import { PasswordResetRequestPage } from '@/pages/auth/PasswordResetRequestPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { CampaignCreatePage } from '@/pages/campaigns/CampaignCreatePage';
import { CampaignDetailPage } from '@/pages/campaigns/CampaignDetailPage';
import { CampaignEditPage } from '@/pages/campaigns/CampaignEditPage';
import { CampaignListPage } from '@/pages/campaigns/CampaignListPage';
import { CharacterDetailPage } from '@/pages/characters/CharacterDetailPage';
import { CharacterEditRedirect } from '@/pages/characters/CharacterEditRedirect';
import { CharacterListPage } from '@/pages/characters/CharacterListPage';
import { MyCollectionPage } from '@/pages/collection/MyCollectionPage';
import { HomebrewCreatePage } from '@/pages/homebrew/HomebrewCreatePage';
import { HomebrewDetailPage } from '@/pages/homebrew/HomebrewDetailPage';
import { HomebrewEditPage } from '@/pages/homebrew/HomebrewEditPage';
import { HomebrewGalleryPage } from '@/pages/homebrew/HomebrewGalleryPage';
import { MyCreationsPage } from '@/pages/homebrew/MyCreationsPage';
import { InvitePage } from '@/pages/invite/InvitePage';
import { ReferenceDetailPage } from '@/pages/reference/ReferenceDetailPage';
import { ReferenceListPage } from '@/pages/reference/ReferenceListPage';

const CharacterBuilderPage = lazy(() =>
  import('@/pages/characters/CharacterBuilderPage').then((module) => ({
    default: module.CharacterBuilderPage,
  })),
);

function LazyCharacterBuilderPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading character builder" />}>
      <CharacterBuilderPage />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        element: <PublicOnlyRoute />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: '/login', element: <LoginPage /> },
              { path: '/register', element: <RegisterPage /> },
              { path: '/forgot-password', element: <PasswordResetRequestPage /> },
              { path: '/reset-password/:token', element: <PasswordResetConfirmPage /> },
            ],
          },
        ],
      },
      {
        path: '/verify-email',
        element: <AuthLayout />,
        children: [{ index: true, element: <VerifyEmailPage /> }],
      },
      {
        path: '/verify-email/:token',
        element: <AuthLayout />,
        children: [{ index: true, element: <VerifyEmailPage /> }],
      },
      {
        path: '/characters/:id',
        element: <CharacterDetailPage />,
      },
      {
        path: '/homebrew',
        element: <HomebrewGalleryPage />,
      },
      {
        path: '/homebrew/:id',
        element: <HomebrewDetailPage />,
      },
      {
        path: '/reference',
        element: <Navigate to="/reference/spells" replace />,
      },
      {
        path: '/reference/:type',
        element: <ReferenceListPage />,
      },
      {
        path: '/reference/:type/:id',
        element: <ReferenceDetailPage />,
      },
      {
        path: '/',
        element: <RootRedirect />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/my-campaigns', element: <CampaignListPage /> },
              { path: '/campaigns/new', element: <CampaignCreatePage /> },
              { path: '/campaigns/:id', element: <CampaignDetailPage /> },
              { path: '/campaigns/:id/edit', element: <CampaignEditPage /> },
              { path: '/my-characters', element: <CharacterListPage /> },
              { path: '/characters/new', element: <LazyCharacterBuilderPage /> },
              { path: '/characters/:id/builder', element: <LazyCharacterBuilderPage /> },
              { path: '/characters/:id/edit', element: <CharacterEditRedirect /> },
              { path: '/homebrew/new', element: <HomebrewCreatePage /> },
              { path: '/homebrew/:id/edit', element: <HomebrewEditPage /> },
              { path: '/my-creations', element: <MyCreationsPage /> },
              { path: '/my-collection', element: <MyCollectionPage /> },
            ],
          },
          {
            element: <MinimalLayout />,
            children: [{ path: '/invite/:token', element: <InvitePage /> }],
          },
        ],
      },
      {
        path: '*',
        element: <RootRedirect />,
      },
    ],
  },
]);
