import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { abilityScoresSchema } from '@dnd-companion/shared';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BuilderHeader } from '@/features/characters/builder/BuilderHeader';
import {
  buildPatchBody,
  getDefaultBuilderValues,
  mapCharacterToForm,
  type CharacterBuilderFormValues,
} from '@/features/characters/builder/characterBuilderForm';
import { AbilityScoresTab } from '@/features/characters/builder/tabs/AbilityScoresTab';
import { BackgroundTab } from '@/features/characters/builder/tabs/BackgroundTab';
import { EquipmentTab } from '@/features/characters/builder/tabs/EquipmentTab';
import { RaceClassTab } from '@/features/characters/builder/tabs/RaceClassTab';
import { ReviewTab } from '@/features/characters/builder/tabs/ReviewTab';
import { SpellsTab } from '@/features/characters/builder/tabs/SpellsTab';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAutoSave } from '@/hooks/useAutoSave';
import { getApiErrorMessage } from '@/lib/api-error';
import { useCreateCharacterMutation, useGetCharacterQuery } from '@/store/api/charactersApi';

const characterBuilderFormSchema = z.object({
  name: z.string().min(1, 'Character name is required').max(200),
  race: z.string().max(100),
  className: z.string().max(100),
  subclass: z.string().max(100),
  level: z.number().int().min(1).max(20),
  background: z.string().max(100),
  alignment: z.string().max(50),
  notes: z.string(),
  abilityScores: abilityScoresSchema,
  armorClass: z.union([z.number().int().min(0), z.literal('')]),
  speed: z.union([z.number().int().min(0), z.literal('')]),
  equipment: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().int().min(1),
      equipped: z.boolean().optional(),
      notes: z.string().optional(),
    }),
  ),
  knownSpells: z.array(
    z.object({
      name: z.string(),
      level: z.number().int().min(0).max(9),
      prepared: z.boolean().optional(),
    }),
  ),
  hitPointsMax: z.union([z.number().int().min(0), z.literal('')]),
  hitPointsCurrent: z.union([z.number().int().min(0), z.literal('')]),
  temporaryHitPoints: z.union([z.number().int().min(0), z.literal('')]),
  proficiencyBonus: z.union([z.number().int().min(0), z.literal('')]),
});

export function CharacterBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isNewRoute = location.pathname === '/characters/new';
  const characterId = isNewRoute ? undefined : id;

  const [activeTab, setActiveTab] = useState('race-class');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isFormSynced, setIsFormSynced] = useState(false);
  const isCreatingRef = useRef(false);

  const { data, isLoading, isError } = useGetCharacterQuery(characterId!, {
    skip: !characterId,
  });

  const [createCharacter] = useCreateCharacterMutation();
  const { saveStatus, triggerSave } = useAutoSave(characterId);

  const form = useForm<CharacterBuilderFormValues>({
    resolver: zodResolver(characterBuilderFormSchema),
    defaultValues: getDefaultBuilderValues(),
    mode: 'onBlur',
  });

  const characterName = form.watch('name');
  usePageTitle(
    characterName
      ? `${characterName} — Character Builder — DnD Companion`
      : 'Character Builder — DnD Companion',
  );

  useEffect(() => {
    if (!data?.data || isFormSynced) return;
    form.reset(mapCharacterToForm(data.data));
    setIsFormSynced(true);
  }, [data, form, isFormSynced]);

  useEffect(() => {
    if (!characterId || !isFormSynced) return;

    const subscription = form.watch((values) => {
      const patchBody = buildPatchBody(values as CharacterBuilderFormValues);
      triggerSave(patchBody);
    });

    return () => subscription.unsubscribe();
  }, [characterId, isFormSynced, form, triggerSave]);

  const handleCreateIfNeeded = useCallback(async () => {
    if (characterId || isCreatingRef.current) return;

    const isNameValid = await form.trigger('name');
    if (!isNameValid) return;

    const name = form.getValues('name').trim();
    if (!name) return;

    isCreatingRef.current = true;
    setCreateError(null);

    try {
      const result = await createCharacter({ name }).unwrap();
      setIsFormSynced(true);
      navigate(`/characters/${result.data.id}/builder`, { replace: true });
    } catch (error) {
      setCreateError(getApiErrorMessage(error, 'Failed to create character'));
      isCreatingRef.current = false;
    }
  }, [characterId, createCharacter, form, navigate]);

  if (!isNewRoute && !characterId) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Invalid character URL.</AlertDescription>
      </Alert>
    );
  }

  if (characterId && isLoading) {
    return <LoadingSpinner label="Loading character" />;
  }

  if (characterId && isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Character not found or you do not have access.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <Form {...form}>
        <BuilderHeader
          form={form}
          saveStatus={saveStatus}
          onNameBlur={() => void handleCreateIfNeeded()}
        />

        {createError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{createError}</AlertDescription>
          </Alert>
        ) : null}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList aria-label="Character builder steps" className="w-full justify-start">
            <TabsTrigger value="race-class">Race & Class</TabsTrigger>
            <TabsTrigger value="ability-scores">Ability Scores</TabsTrigger>
            <TabsTrigger value="background">Background & Details</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="spells">Spells</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>

          <TabsContent value="race-class">
            <RaceClassTab form={form} />
          </TabsContent>
          <TabsContent value="ability-scores">
            <AbilityScoresTab form={form} />
          </TabsContent>
          <TabsContent value="background">
            <BackgroundTab
              form={form}
              portraitUrl={data?.data.portraitUrl}
              portraitDisabled={!characterId || saveStatus === 'saving'}
              onPortraitUploaded={(publicUrl) => triggerSave({ portraitUrl: publicUrl })}
              onPortraitClear={() => triggerSave({ portraitUrl: null })}
            />
          </TabsContent>
          <TabsContent value="equipment">
            <EquipmentTab form={form} />
          </TabsContent>
          <TabsContent value="spells">
            <SpellsTab form={form} />
          </TabsContent>
          <TabsContent value="review">
            <ReviewTab form={form} />
          </TabsContent>
        </Tabs>
      </Form>
    </div>
  );
}
