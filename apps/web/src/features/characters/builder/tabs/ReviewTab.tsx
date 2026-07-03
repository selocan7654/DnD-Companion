import type { UseFormReturn } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CharacterBuilderFormValues } from '@/features/characters/builder/characterBuilderForm';
import {
  ABILITY_SCORE_KEYS,
  abilityModifier,
  formatModifier,
  proficiencyBonusFromLevel,
} from '@/lib/character-utils';

interface ReviewTabProps {
  form: UseFormReturn<CharacterBuilderFormValues>;
}

export function ReviewTab({ form }: ReviewTabProps) {
  const values = form.watch();
  const derivedProficiency = proficiencyBonusFromLevel(values.level || 1);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Character summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Name:</span> {values.name || '—'}
          </p>
          <p>
            <span className="font-medium">Race / Class:</span>{' '}
            {[values.race, values.className].filter(Boolean).join(' ') || '—'}
            {values.subclass ? ` (${values.subclass})` : ''}
          </p>
          <p>
            <span className="font-medium">Level:</span> {values.level}
          </p>
          <p>
            <span className="font-medium">Background:</span> {values.background || '—'}
          </p>
          <p>
            <span className="font-medium">Alignment:</span> {values.alignment || '—'}
          </p>
          <p>
            <span className="font-medium">Proficiency bonus:</span> +
            {values.proficiencyBonus !== '' ? values.proficiencyBonus : derivedProficiency}
          </p>
          <div>
            <p className="font-medium">Ability scores</p>
            <ul className="mt-1 grid grid-cols-2 gap-1 text-muted-foreground">
              {ABILITY_SCORE_KEYS.map((key) => (
                <li key={key}>
                  {key}: {values.abilityScores[key]} (
                  {formatModifier(abilityModifier(values.abilityScores[key]))})
                </li>
              ))}
            </ul>
          </div>
          <p>
            <span className="font-medium">Equipment items:</span> {values.equipment.length}
          </p>
          <p>
            <span className="font-medium">Known spells:</span> {values.knownSpells.length}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Hit points</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="hitPointsMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max HP</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value === '' ? '' : Number(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hitPointsCurrent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current HP</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value === '' ? '' : Number(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="temporaryHitPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temp HP</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value === '' ? '' : Number(value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <FormField
          control={form.control}
          name="proficiencyBonus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proficiency bonus (optional override)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder={String(derivedProficiency)}
                  value={field.value}
                  onChange={(event) => {
                    const value = event.target.value;
                    field.onChange(value === '' ? '' : Number(value));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
