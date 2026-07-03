import { Outlet } from 'react-router-dom';

import { AppChrome } from '@/layouts/AppChrome';

export function AppLayout() {
  return (
    <AppChrome>
      <Outlet />
    </AppChrome>
  );
}
