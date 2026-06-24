import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-8">
      <div className="mb-8 text-center">
        <Link to="/" className="text-2xl font-bold tracking-tight text-foreground">
          DnD Companion
        </Link>
      </div>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
