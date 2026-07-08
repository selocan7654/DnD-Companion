import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createCampaignSchema,
  UploadPurpose,
  type CreateCampaignInput,
  updateCampaignSchema,
} from '@dnd-companion/shared';
import type { z } from 'zod';

import { ImageUpload } from '@/components/ImageUpload';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type CampaignFormValues = z.infer<typeof createCampaignSchema> & {
  bannerUrl?: string | null;
};

const campaignFormWithBannerSchema = createCampaignSchema.extend({
  bannerUrl: updateCampaignSchema.shape.bannerUrl,
});

interface CampaignFormProps {
  defaultValues?: Partial<CampaignFormValues>;
  submitLabel: string;
  isSubmitting?: boolean;
  apiError?: string | null;
  showBanner?: boolean;
  onSubmit: (values: CreateCampaignInput & { bannerUrl?: string | null }) => void | Promise<void>;
}

export function CampaignForm({
  defaultValues,
  submitLabel,
  isSubmitting = false,
  apiError,
  showBanner = false,
  onSubmit,
}: CampaignFormProps) {
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(showBanner ? campaignFormWithBannerSchema : createCampaignSchema),
    defaultValues: {
      name: '',
      description: '',
      setting: '',
      bannerUrl: null,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-4">
        {apiError ? (
          <Alert variant="destructive">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Curse of Strahd"
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.name}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A gothic horror adventure..."
                  rows={4}
                  aria-invalid={!!form.formState.errors.description}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="setting"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Setting (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Barovia"
                  aria-invalid={!!form.formState.errors.setting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showBanner ? (
          <FormField
            control={form.control}
            name="bannerUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ImageUpload
                    purpose={UploadPurpose.BANNER}
                    label="Campaign banner (optional)"
                    currentUrl={field.value}
                    previewAlt="Campaign banner preview"
                    onUploadComplete={(publicUrl) => field.onChange(publicUrl)}
                    onClear={() => field.onChange(null)}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </Form>
  );
}
