import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  label?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  className,
  label = 'Loading',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      role="status"
      aria-label={label}
      className={cn('flex flex-col items-center justify-center gap-2', className)}
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">{spinner}</div>
    );
  }

  return spinner;
}
