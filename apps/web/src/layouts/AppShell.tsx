import { Outlet } from 'react-router-dom';

import { Toaster } from '@/components/ui/toaster';
import { SessionExpiredModal } from '@/features/auth/SessionExpiredModal';

export function AppShell() {
  return (
    <>
      <Outlet />
      <SessionExpiredModal />
      <Toaster />
    </>
  );
}
