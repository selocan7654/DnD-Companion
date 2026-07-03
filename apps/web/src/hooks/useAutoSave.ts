import { useCallback, useEffect, useRef, useState } from 'react';
import type { UpdateCharacterInput } from '@dnd-companion/shared';

import { useUpdateCharacterMutation } from '@/store/api/charactersApi';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 500;

export function useAutoSave(characterId: string | undefined) {
  const [updateCharacter] = useUpdateCharacterMutation();
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBodyRef = useRef<UpdateCharacterInput>({});
  const characterIdRef = useRef(characterId);

  characterIdRef.current = characterId;

  const flush = useCallback(
    async (body: UpdateCharacterInput) => {
      const id = characterIdRef.current;
      if (!id || Object.keys(body).length === 0) return;

      setSaveStatus('saving');
      try {
        await updateCharacter({ id, body }).unwrap();
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    },
    [updateCharacter],
  );

  const triggerSave = useCallback(
    (body: UpdateCharacterInput) => {
      if (!characterIdRef.current) return;

      pendingBodyRef.current = { ...pendingBodyRef.current, ...body };

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const pending = pendingBodyRef.current;
        pendingBodyRef.current = {};
        void flush(pending);
      }, DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { saveStatus, triggerSave };
}
