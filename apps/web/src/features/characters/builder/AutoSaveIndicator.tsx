import type { SaveStatus } from '@/hooks/useAutoSave';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
}

const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Save failed',
};

export function AutoSaveIndicator({ status }: AutoSaveIndicatorProps) {
  const label = STATUS_LABEL[status];
  if (!label) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      className={
        status === 'error'
          ? 'text-sm font-medium text-destructive'
          : 'text-sm text-muted-foreground'
      }
    >
      {label}
    </span>
  );
}
