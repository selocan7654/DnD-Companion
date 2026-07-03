import type { UseFormReturn } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CharacterBuilderFormValues } from '@/features/characters/builder/characterBuilderForm';
import { ABILITY_SCORE_KEYS, abilityModifier, formatModifier } from '@/lib/character-utils';
import type { AbilityScoreKey } from '@/types/api';

interface AbilityScoresTabProps {
  form: UseFormReturn<CharacterBuilderFormValues>;
}

export function AbilityScoresTab({ form }: AbilityScoresTabProps) {
  const scores = form.watch('abilityScores');

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ABILITY_SCORE_KEYS.map((key: AbilityScoreKey) => (
        <FormField
          key={key}
          control={form.control}
          name={`abilityScores.${key}`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{key}</FormLabel>
              <div className="flex items-center gap-3">
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    className="w-24"
                    aria-label={`${key} score`}
                    {...field}
                    onChange={(event) => field.onChange(Number(event.target.value) || 10)}
                  />
                </FormControl>
                <span className="text-sm text-muted-foreground" aria-live="polite">
                  {formatModifier(abilityModifier(scores[key] ?? 10))}
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
