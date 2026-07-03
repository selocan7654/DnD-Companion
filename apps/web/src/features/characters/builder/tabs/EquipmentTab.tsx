import { Plus, Trash2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CharacterBuilderFormValues } from '@/features/characters/builder/characterBuilderForm';

interface EquipmentTabProps {
  form: UseFormReturn<CharacterBuilderFormValues>;
}

export function EquipmentTab({ form }: EquipmentTabProps) {
  const equipment = form.watch('equipment');

  const addRow = () => {
    form.setValue('equipment', [...equipment, { name: '', quantity: 1, equipped: false }], {
      shouldDirty: true,
    });
  };

  const removeRow = (index: number) => {
    form.setValue(
      'equipment',
      equipment.filter((_, rowIndex) => rowIndex !== index),
      { shouldDirty: true },
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="armorClass"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Armor Class</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="16"
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
          name="speed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Speed (ft)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="30"
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

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Equipment</h3>
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add item
          </Button>
        </div>

        {equipment.length === 0 ? (
          <p className="text-sm text-muted-foreground">No equipment added yet.</p>
        ) : (
          <ul className="space-y-3">
            {equipment.map((_, index) => (
              <li
                key={index}
                className="grid gap-3 rounded-md border p-3 sm:grid-cols-[1fr_6rem_6rem_auto]"
              >
                <FormField
                  control={form.control}
                  name={`equipment.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Item name</FormLabel>
                      <FormControl>
                        <Input placeholder="Longsword" aria-label="Item name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`equipment.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          aria-label="Quantity"
                          {...field}
                          onChange={(event) => field.onChange(Number(event.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`equipment.${index}.equipped`}
                  render={({ field }) => (
                    <FormItem className="flex items-end gap-2 pb-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          id={`equipment-equipped-${index}`}
                          checked={!!field.value}
                          onChange={(event) => field.onChange(event.target.checked)}
                          className="h-4 w-4 rounded border-input"
                        />
                      </FormControl>
                      <FormLabel htmlFor={`equipment-equipped-${index}`} className="!mt-0">
                        Equipped
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove equipment item"
                  onClick={() => removeRow(index)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
