import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorBoundary } from '@/components/ErrorBoundary';

const { captureException } = vi.hoisted(() => ({
  captureException: vi.fn(),
}));

vi.mock('@sentry/react', () => ({
  captureException,
  init: vi.fn(),
}));

function ThrowWhenTriggered({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test render error');
  }

  return <div>Safe content</div>;
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when no error occurs', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowWhenTriggered shouldThrow={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Safe content')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('renders the server error fallback and reports to Sentry', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowWhenTriggered shouldThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload Page' })).toBeInTheDocument();
    expect(captureException).toHaveBeenCalledTimes(1);

    consoleError.mockRestore();
  });
});
