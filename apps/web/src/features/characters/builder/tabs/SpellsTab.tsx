import { Plus, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CharacterBuilderFormValues } from '@/features/characters/builder/characterBuilderForm';

interface SpellsTabProps {
  form: UseFormReturn<CharacterBuilderFormValues>;
}

export function SpellsTab({ form }: SpellsTabProps) {
  const knownSpells = form.watch('knownSpells');

  const addSpell = () => {
    form.setValue('knownSpells', [...knownSpells, { name: '', level: 0, prepared: false }], {
      shouldDirty: true,
    });
  };

  const removeSpell = (index: number) => {
    form.setValue(
      'knownSpells',
      knownSpells.filter((_, spellIndex) => spellIndex !== index),
      { shouldDirty: true },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Known spells</h3>
        <Button type="button" variant="outline" size="sm" onClick={addSpell}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add spell
        </Button>
      </div>

      {knownSpells.length === 0 ? (
        <p className="text-sm text-muted-foreground">No spells added yet.</p>
      ) : (
        <ul className="space-y-3">
          {knownSpells.map((_, index) => (
            <li
              key={index}
              className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_6rem_6rem_auto]"
            >
              <FormField
                control={form.control}
                name={`knownSpells.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Spell name</FormLabel>
                    <FormControl>
                      <Input placeholder="Fire Bolt" aria-label="Spell name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`knownSpells.${index}.level`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Spell level</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={9}
                        aria-label="Spell level"
                        {...field}
                        onChange={(event) => field.onChange(Number(event.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`knownSpells.${index}.prepared`}
                render={({ field }) => (
                  <FormItem className="flex items-end gap-2 pb-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        id={`spell-prepared-${index}`}
                        checked={!!field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="h-4 w-4 rounded border-input"
                      />
                    </FormControl>
                    <FormLabel htmlFor={`spell-prepared-${index}`} className="!mt-0">
                      Prepared
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove spell"
                onClick={() => removeSpell(index)}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
