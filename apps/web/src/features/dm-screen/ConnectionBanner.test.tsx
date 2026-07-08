import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ConnectionBanner } from '@/features/dm-screen/ConnectionBanner';

describe('ConnectionBanner', () => {
  it('renders disconnect warning when not connected', () => {
    render(<ConnectionBanner isConnected={false} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      /Live updates disconnected\. Reconnecting/,
    );
  });

  it('shows retry estimate when reconnectAttempt is set', () => {
    render(<ConnectionBanner isConnected={false} reconnectAttempt={3} />);

    expect(screen.getByRole('status')).toHaveTextContent('Retry #3');
    expect(screen.getByRole('status')).toHaveTextContent('~4s');
  });

  it('renders nothing when connected', () => {
    const { container } = render(<ConnectionBanner isConnected />);
    expect(container).toBeEmptyDOMElement();
  });
});
