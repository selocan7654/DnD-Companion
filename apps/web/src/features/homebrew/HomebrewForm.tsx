import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HomebrewType, homebrewFormSchema, type HomebrewFormValues } from '@dnd-companion/shared';

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

import { getDefaultHomebrewData, HOMEBREW_TYPE_OPTIONS } from './homebrewUtils';

interface HomebrewFormProps {
  defaultValues?: Partial<HomebrewFormValues>;
  typeDisabled?: boolean;
  submitLabel: string;
  isSubmitting?: boolean;
  apiError?: string | null;
  onSubmit: (values: HomebrewFormValues) => void | Promise<void>;
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinList(values: string[] | undefined): string {
  return values?.join(', ') ?? '';
}

function TypeSpecificFields({
  form,
  type,
}: {
  form: UseFormReturn<HomebrewFormValues>;
  type: HomebrewType;
}) {
  switch (type) {
    case HomebrewType.SPELL:
      return (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="data.level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spell level</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={9}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={typeof field.value === 'number' ? field.value : 0}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.school"
            render={({ field }) => (
              <FormItem>
                <FormLabel>School of magic</FormLabel>
                <FormControl>
                  <Input placeholder="Evocation" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.casting_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Casting time</FormLabel>
                <FormControl>
                  <Input placeholder="1 action" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.range"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Range</FormLabel>
                <FormControl>
                  <Input placeholder="120 feet" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <FormControl>
                  <Input placeholder="Instantaneous" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.classes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Classes (comma-separated)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Wizard, Sorcerer"
                    value={joinList(field.value as string[] | undefined)}
                    onChange={(e) => field.onChange(splitList(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spell description</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    case HomebrewType.FEAT:
      return (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="data.prerequisite"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prerequisite (optional)</FormLabel>
                <FormControl>
                  <Input {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="General" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.benefit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Benefit</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    case HomebrewType.MAGIC_ITEM:
      return (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="data.rarity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rarity</FormLabel>
                <FormControl>
                  <Input placeholder="Rare" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item type</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Weapon (longsword)"
                    {...field}
                    value={String(field.value ?? '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.properties"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Properties</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    case HomebrewType.BACKGROUND:
      return (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="data.skill_proficiencies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skill proficiencies (comma-separated)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Insight, Religion"
                    value={joinList(field.value as string[] | undefined)}
                    onChange={(e) => field.onChange(splitList(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.feature_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feature name</FormLabel>
                <FormControl>
                  <Input {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.feature_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feature description</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    case HomebrewType.SUBCLASS:
      return (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="data.parent_class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent class</FormLabel>
                <FormControl>
                  <Input placeholder="Fighter" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.features.0.level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feature level</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={typeof field.value === 'number' ? field.value : 3}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.features.0.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feature name</FormLabel>
                <FormControl>
                  <Input {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.features.0.description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feature description</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    case HomebrewType.MONSTER:
      return (
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="data.size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Size</FormLabel>
                <FormControl>
                  <Input placeholder="Medium" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.creature_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Creature type</FormLabel>
                <FormControl>
                  <Input placeholder="humanoid" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.alignment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alignment</FormLabel>
                <FormControl>
                  <Input placeholder="neutral evil" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.armor_class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Armor class</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={typeof field.value === 'number' ? field.value : 10}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.hit_points"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hit points</FormLabel>
                <FormControl>
                  <Input placeholder="45 (6d8 + 18)" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data.challenge_rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Challenge rating</FormLabel>
                <FormControl>
                  <Input placeholder="3" {...field} value={String(field.value ?? '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      );

    default:
      return null;
  }
}

/** S-HOMEBREW-CREATE / S-HOMEBREW-EDIT — dynamic homebrew form */
export function HomebrewForm({
  defaultValues,
  typeDisabled = false,
  submitLabel,
  isSubmitting = false,
  apiError,
  onSubmit,
}: HomebrewFormProps) {
  const form = useForm<HomebrewFormValues>({
    resolver: zodResolver(homebrewFormSchema),
    defaultValues: {
      name: '',
      type: HomebrewType.FEAT,
      description: '',
      data: getDefaultHomebrewData(HomebrewType.FEAT),
      ...defaultValues,
    },
  });

  const selectedType = form.watch('type');

  useEffect(() => {
    if (defaultValues?.data) {
      return;
    }
    form.setValue('data', getDefaultHomebrewData(selectedType));
  }, [selectedType, defaultValues?.data, form]);

  return (
    <Form {...form}>
      <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="space-y-6" noValidate>
        {apiError ? (
          <Alert variant="destructive">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content type</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={typeDisabled}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value as HomebrewType)}
                  aria-required="true"
                >
                  {HOMEBREW_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Custom content name"
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
                <Textarea rows={3} placeholder="Short summary for the gallery" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-lg border p-4">
          <h3 className="font-medium">Type-specific details</h3>
          <TypeSpecificFields form={form} type={selectedType} />
        </div>

        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
    </Form>
  );
}
