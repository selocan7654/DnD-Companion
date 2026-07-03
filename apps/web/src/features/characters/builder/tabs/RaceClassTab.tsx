import type { UseFormReturn } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { CharacterBuilderFormValues } from '@/features/characters/builder/characterBuilderForm';

interface RaceClassTabProps {
  form: UseFormReturn<CharacterBuilderFormValues>;
}

export function RaceClassTab({ form }: RaceClassTabProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name="race"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Race</FormLabel>
            <FormControl>
              <Input placeholder="Human" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="className"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Class</FormLabel>
            <FormControl>
              <Input placeholder="Fighter" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="subclass"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subclass (optional)</FormLabel>
            <FormControl>
              <Input placeholder="Champion" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="level"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Level</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                max={20}
                aria-invalid={!!form.formState.errors.level}
                {...field}
                onChange={(event) => field.onChange(Number(event.target.value) || 1)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
