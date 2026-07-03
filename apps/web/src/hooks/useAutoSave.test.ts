import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { useAutoSave } from '@/hooks/useAutoSave';

const updateCharacterMock = vi.fn();

vi.mock('@/store/api/charactersApi', () => ({
  useUpdateCharacterMutation: () => [updateCharacterMock],
}));

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    updateCharacterMock.mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({ data: { id: 'char-1' } }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('debounces PATCH calls by 500ms', async () => {
    const { result } = renderHook(() => useAutoSave('char-1'));

    act(() => {
      result.current.triggerSave({ name: 'Aragorn' });
      result.current.triggerSave({ race: 'Human' });
    });

    expect(updateCharacterMock).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(updateCharacterMock).toHaveBeenCalledTimes(1);
    expect(updateCharacterMock).toHaveBeenCalledWith({
      id: 'char-1',
      body: { name: 'Aragorn', race: 'Human' },
    });
  });

  it('does not save when character id is missing', async () => {
    const { result } = renderHook(() => useAutoSave(undefined));

    act(() => {
      result.current.triggerSave({ name: 'Gandalf' });
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(updateCharacterMock).not.toHaveBeenCalled();
  });
});
