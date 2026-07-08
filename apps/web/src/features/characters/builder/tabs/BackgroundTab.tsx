import type { UseFormReturn } from 'react-hook-form';
import { UploadPurpose } from '@dnd-companion/shared';

import { ImageUpload } from '@/components/ImageUpload';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { CharacterBuilderFormValues } from '@/features/characters/builder/characterBuilderForm';

interface BackgroundTabProps {
  form: UseFormReturn<CharacterBuilderFormValues>;
  portraitUrl?: string | null;
  onPortraitUploaded?: (publicUrl: string) => void;
  onPortraitClear?: () => void;
  portraitDisabled?: boolean;
}

export function BackgroundTab({
  form,
  portraitUrl,
  onPortraitUploaded,
  onPortraitClear,
  portraitDisabled = false,
}: BackgroundTabProps) {
  return (
    <div className="space-y-6">
      {onPortraitUploaded ? (
        <ImageUpload
          purpose={UploadPurpose.PORTRAIT}
          label="Character portrait (optional)"
          currentUrl={portraitUrl}
          previewAlt="Character portrait preview"
          onUploadComplete={onPortraitUploaded}
          onClear={onPortraitClear}
          disabled={portraitDisabled}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="background"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background</FormLabel>
              <FormControl>
                <Input placeholder="Soldier" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="alignment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alignment</FormLabel>
              <FormControl>
                <Input placeholder="Lawful Good" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Personality traits, ideals, bonds, flaws..."
                  rows={5}
                  {...field}
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
