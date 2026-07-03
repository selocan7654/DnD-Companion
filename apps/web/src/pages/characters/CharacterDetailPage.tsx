import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Pencil, Trash2 } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CampaignAssignment } from '@/features/characters/CampaignAssignment';
import { VisibilityToggle } from '@/features/characters/VisibilityToggle';
import { useAuth } from '@/hooks/useAuth';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AppChrome } from '@/layouts/AppChrome';
import { PublicLayout } from '@/layouts/PublicLayout';
import { ABILITY_SCORE_KEYS, abilityModifier, formatModifier } from '@/lib/character-utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { toast } from '@/hooks/use-toast';
import { useGetCampaignQuery } from '@/store/api/campaignsApi';
import { useDeleteCharacterMutation, useGetCharacterQuery } from '@/store/api/charactersApi';
import type { Character } from '@/types/api';

function formatRaceClassLevel(character: Character): string {
  const parts = [
    character.race?.trim(),
    character.className?.trim(),
    character.level ? `Level ${character.level}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Character';
}

function CharacterDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useGetCharacterQuery(id!, { skip: !id });
  const character = data?.data;
  const { data: campaignData } = useGetCampaignQuery(character?.campaignId ?? '', {
    skip: !character?.campaignId || !isAuthenticated,
  });
  const [deleteCharacter, { isLoading: isDeleting }] = useDeleteCharacterMutation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const campaign = campaignData?.data;

  usePageTitle(character ? `${character.name} — DnD Companion` : 'Character — DnD Companion');

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Character not found.</AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return <LoadingSpinner label="Loading character" />;
  }

  if (isError || !character) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Character not found</h1>
        <p className="text-muted-foreground">
          This character does not exist or you do not have access.
        </p>
        {isAuthenticated ? (
          <Button asChild variant="outline">
            <Link to="/my-characters">Back to My Characters</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/login">Sign in</Link>
          </Button>
        )}
      </div>
    );
  }

  const isOwner = user?.id === character.ownerId;
  const isCampaignDm = !!campaign && user?.id === campaign.ownerId;
  const canEdit = isOwner || isCampaignDm;
  const canDelete = canEdit;
  const showOwnerControls = isOwner && isAuthenticated;

  const handleDelete = async () => {
    try {
      await deleteCharacter(id).unwrap();
      toast({ title: 'Character deleted' });
      navigate(isOwner ? '/my-characters' : '/my-campaigns', { replace: true });
    } catch (error) {
      toast({
        title: 'Failed to delete character',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const abilityScores = character.abilityScores;
  const hasSpells =
    (character.knownSpells && character.knownSpells.length > 0) ||
    (character.spellSlots && Object.keys(character.spellSlots).length > 0);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{character.name}</h1>
            <p className="text-lg text-muted-foreground">{formatRaceClassLevel(character)}</p>
            <div className="flex flex-wrap gap-2">
              {character.background ? (
                <Badge variant="outline">{character.background}</Badge>
              ) : null}
              {character.alignment ? <Badge variant="outline">{character.alignment}</Badge> : null}
              <Badge variant={character.visibility === 'PUBLIC' ? 'default' : 'secondary'}>
                {character.visibility === 'PUBLIC' ? (
                  <>
                    <Eye className="mr-1 h-3 w-3" aria-hidden="true" />
                    Public
                  </>
                ) : (
                  <>
                    <EyeOff className="mr-1 h-3 w-3" aria-hidden="true" />
                    Private
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Created by @{character.ownerUsername}</p>
            {character.campaignId && campaign ? (
              <p className="text-sm">
                Campaign:{' '}
                <Link
                  to={`/campaigns/${campaign.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {campaign.name}
                </Link>
              </p>
            ) : null}
          </div>

          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/characters/${id}/edit`}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Link>
              </Button>
              {canDelete ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {showDeleteConfirm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-character-title"
        >
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h2 id="delete-character-title" className="text-lg font-semibold">
              Delete character?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">This action cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                aria-busy={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showOwnerControls ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <CampaignAssignment character={character} />
          <VisibilityToggle character={character} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {abilityScores ? (
          <section aria-labelledby="ability-scores-heading" className="space-y-3">
            <h2 id="ability-scores-heading" className="text-lg font-semibold">
              Ability Scores
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 lg:grid-cols-3">
              {ABILITY_SCORE_KEYS.map((key) => {
                const score = abilityScores[key];
                const mod = abilityModifier(score);
                return (
                  <div key={key} className="rounded-lg border p-3 text-center">
                    <p className="text-xs font-medium text-muted-foreground">{key}</p>
                    <p className="text-2xl font-bold">{score}</p>
                    <p className="text-sm text-muted-foreground">{formatModifier(mod)}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="combat-stats-heading" className="space-y-3">
          <h2 id="combat-stats-heading" className="text-lg font-semibold">
            Combat Stats
          </h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Hit Points</dt>
              <dd className="text-lg font-semibold">
                {character.hitPointsCurrent ?? '—'} / {character.hitPointsMax ?? '—'}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Armor Class</dt>
              <dd className="text-lg font-semibold">{character.armorClass ?? '—'}</dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Speed</dt>
              <dd className="text-lg font-semibold">
                {character.speed != null ? `${character.speed} ft` : '—'}
              </dd>
            </div>
            <div className="rounded-lg border p-3">
              <dt className="text-muted-foreground">Proficiency</dt>
              <dd className="text-lg font-semibold">
                {character.proficiencyBonus != null
                  ? formatModifier(character.proficiencyBonus)
                  : '—'}
              </dd>
            </div>
          </dl>
          {character.conditions && character.conditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {character.conditions.map((condition) => (
                <Badge key={condition} variant="outline">
                  {condition}
                </Badge>
              ))}
            </div>
          ) : null}
        </section>

        {character.equipment && character.equipment.length > 0 ? (
          <section aria-labelledby="equipment-heading" className="space-y-3 lg:col-span-3">
            <h2 id="equipment-heading" className="text-lg font-semibold">
              Equipment
            </h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th scope="col" className="p-3 font-medium">
                      Item
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      Qty
                    </th>
                    <th scope="col" className="p-3 font-medium">
                      Equipped
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {character.equipment.map((item, index) => (
                    <tr key={`${item.name}-${index}`} className="border-b last:border-0">
                      <td className="p-3">{item.name}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3">{item.equipped ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {hasSpells ? (
          <section aria-labelledby="spells-heading" className="space-y-3 lg:col-span-3">
            <h2 id="spells-heading" className="text-lg font-semibold">
              Spells
            </h2>
            {character.knownSpells && character.knownSpells.length > 0 ? (
              <ul className="space-y-2">
                {character.knownSpells.map((spell, index) => (
                  <li key={`${spell.name}-${index}`} className="rounded-lg border p-3 text-sm">
                    <span className="font-medium">{spell.name}</span>
                    <span className="text-muted-foreground"> — Level {spell.level}</span>
                    {spell.prepared ? (
                      <Badge className="ml-2" variant="secondary">
                        Prepared
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No spells recorded.</p>
            )}
          </section>
        ) : null}

        {isOwner && character.notes ? (
          <section aria-labelledby="notes-heading" className="space-y-3 lg:col-span-3">
            <h2 id="notes-heading" className="text-lg font-semibold">
              Notes
            </h2>
            <p className="whitespace-pre-wrap rounded-lg border p-4 text-sm">{character.notes}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

/** S-CHAR-DETAIL — Character sheet (mixed auth: PUBLIC guests allowed) */
export function CharacterDetailPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const content = <CharacterDetailContent />;

  if (isLoading) {
    return <LoadingSpinner fullScreen label="Loading session" />;
  }

  if (isAuthenticated) {
    return <AppChrome>{content}</AppChrome>;
  }

  return <PublicLayout>{content}</PublicLayout>;
}
