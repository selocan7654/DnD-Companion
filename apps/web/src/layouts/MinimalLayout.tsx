import { Outlet } from 'react-router-dom';

export function MinimalLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <main id="main-content" className="w-full max-w-md" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
