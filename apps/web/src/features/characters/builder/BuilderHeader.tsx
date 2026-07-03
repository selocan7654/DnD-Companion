import { Link } from 'react-router-dom';
import type { UseFormReturn } from 'react-hook-form';

import { AutoSaveIndicator } from '@/features/characters/builder/AutoSaveIndicator';
import type { CharacterBuilderFormValues } from '@/features/characters/builder/characterBuilderForm';
import type { SaveStatus } from '@/hooks/useAutoSave';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface BuilderHeaderProps {
  form: UseFormReturn<CharacterBuilderFormValues>;
  saveStatus: SaveStatus;
  onNameBlur: () => void;
}

export function BuilderHeader({ form, saveStatus, onNameBlur }: BuilderHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-3">
        <Link
          to="/my-characters"
          className="text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ← Back to Characters
        </Link>

        <FormField
          control={form.control}
          name="name"
          rules={{ required: 'Character name is required' }}
          render={({ field }) => (
            <FormItem className="max-w-md">
              <FormLabel>Character name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Aragorn"
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.name}
                  {...field}
                  onBlur={() => {
                    field.onBlur();
                    onNameBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <AutoSaveIndicator status={saveStatus} />
    </div>
  );
}
