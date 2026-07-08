import { useState } from 'react';
import { Loader2, Minus, Plus, RotateCcw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import { useUpdateLiveFieldsMutation } from '@/store/api/charactersApi';
import type { Character, DeathSaves } from '@/types/api';
import { cn } from '@/lib/utils';

const COMMON_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
] as const;

interface CharacterLiveCardProps {
  character: Character;
  canEdit: boolean;
}

function formatClassLevel(character: Character): string {
  const classPart = character.className?.trim() || 'Unclassed';
  return `${classPart} Lvl ${character.level}`;
}

function hpPercent(current: number | null, max: number | null): number {
  if (max == null || max <= 0 || current == null) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function hpBarClass(pct: number): string {
  if (pct > 50) return 'bg-emerald-500';
  if (pct >= 25) return 'bg-amber-400';
  return 'bg-red-500';
}

function normalizeDeathSaves(deathSaves: DeathSaves | null): DeathSaves {
  return {
    successes: deathSaves?.successes ?? 0,
    failures: deathSaves?.failures ?? 0,
  };
}

export function CharacterLiveCard({ character, canEdit }: CharacterLiveCardProps) {
  const [updateLiveFields, { isLoading }] = useUpdateLiveFieldsMutation();
  const [showConditions, setShowConditions] = useState(false);
  const [hpDraft, setHpDraft] = useState<string | null>(null);

  const current = character.hitPointsCurrent;
  const max = character.hitPointsMax;
  const temp = character.temporaryHitPoints ?? 0;
  const pct = hpPercent(current, max);
  const deathSaves = normalizeDeathSaves(character.deathSaves);
  const conditions = character.conditions ?? [];

  const patchLive = async (body: Parameters<typeof updateLiveFields>[0]['body']) => {
    try {
      await updateLiveFields({ id: character.id, body }).unwrap();
    } catch (error) {
      toast({
        title: 'Failed to update live fields',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const adjustHp = (delta: number) => {
    const base = current ?? 0;
    const next = Math.max(0, max != null ? Math.min(max, base + delta) : base + delta);
    void patchLive({ hitPointsCurrent: next });
  };

  const commitHpDraft = () => {
    if (hpDraft === null) return;
    const parsed = Number.parseInt(hpDraft, 10);
    if (Number.isNaN(parsed)) {
      setHpDraft(null);
      return;
    }
    const next = Math.max(0, max != null ? Math.min(max, parsed) : parsed);
    setHpDraft(null);
    void patchLive({ hitPointsCurrent: next });
  };

  const toggleCondition = (condition: string) => {
    const next = conditions.includes(condition)
      ? conditions.filter((c) => c !== condition)
      : [...conditions, condition];
    void patchLive({ conditions: next });
  };

  const setDeathSave = (kind: 'successes' | 'failures', index: number) => {
    const currentCount = deathSaves[kind];
    // Toggle: click filled slot to reduce; empty to set that many
    const nextCount = currentCount === index + 1 ? index : index + 1;
    void patchLive({
      deathSaves: {
        successes: kind === 'successes' ? nextCount : deathSaves.successes,
        failures: kind === 'failures' ? nextCount : deathSaves.failures,
      },
    });
  };

  const resetDeathSaves = () => {
    void patchLive({ deathSaves: { successes: 0, failures: 0 } });
  };

  return (
    <Card aria-label={`Live card for ${character.name}`}>
      <CardHeader className="space-y-1 p-4 pb-2">
        <CardTitle className="text-lg">{character.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{formatClassLevel(character)}</p>
        <p className="text-xs text-muted-foreground">@{character.ownerUsername}</p>
        {character.armorClass != null ? (
          <p className="text-sm">
            AC <span className="font-medium">{character.armorClass}</span>
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <Label htmlFor={`hp-${character.id}`}>Hit points</Label>
            <span className="font-medium" aria-live="polite">
              {current ?? '—'} / {max ?? '—'}
              {temp > 0 ? (
                <Badge variant="secondary" className="ml-2">
                  Temp +{temp}
                </Badge>
              ) : null}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`Hit points ${current ?? 0} of ${max ?? 0}`}
            aria-valuenow={current ?? 0}
            aria-valuemin={0}
            aria-valuemax={max ?? 0}
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn('h-full transition-all', hpBarClass(pct))}
              style={{ width: `${pct}%` }}
            />
          </div>
          {canEdit ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={`Decrease hit points for ${character.name}`}
                disabled={isLoading}
                onClick={() => adjustHp(-1)}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Input
                id={`hp-${character.id}`}
                type="number"
                className="w-20"
                aria-label={`Current hit points for ${character.name}`}
                value={hpDraft ?? current ?? ''}
                onChange={(e) => setHpDraft(e.target.value)}
                onBlur={commitHpDraft}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
                disabled={isLoading}
                min={0}
                max={max ?? undefined}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label={`Increase hit points for ${character.name}`}
                disabled={isLoading}
                onClick={() => adjustHp(1)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
              {isLoading ? (
                <Loader2
                  className="h-4 w-4 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Conditions</p>
          <div className="flex flex-wrap gap-1">
            {conditions.length === 0 ? (
              <span className="text-sm text-muted-foreground">None</span>
            ) : (
              conditions.map((c) => (
                <Badge key={c} variant="outline">
                  {c}
                </Badge>
              ))
            )}
          </div>
          {canEdit ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-expanded={showConditions}
                onClick={() => setShowConditions((v) => !v)}
              >
                Manage conditions
              </Button>
              {showConditions ? (
                <fieldset className="space-y-2 rounded-md border p-3">
                  <legend className="px-1 text-sm font-medium">Active conditions</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {COMMON_CONDITIONS.map((condition) => {
                      const checked = conditions.includes(condition);
                      const id = `${character.id}-cond-${condition}`;
                      return (
                        <label
                          key={condition}
                          htmlFor={id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            id={id}
                            type="checkbox"
                            checked={checked}
                            disabled={isLoading}
                            onChange={() => toggleCondition(condition)}
                            className="h-4 w-4 rounded border"
                          />
                          {condition}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null}
            </>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Death saves</p>
            {canEdit ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                aria-label={`Reset death saves for ${character.name}`}
                disabled={isLoading}
                onClick={resetDeathSaves}
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Reset
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1" role="group" aria-label="Death save successes">
              <span className="sr-only">Successes</span>
              {[0, 1, 2].map((i) => (
                <button
                  key={`s-${i}`}
                  type="button"
                  disabled={!canEdit || isLoading}
                  aria-label={`Death save success ${i + 1} of 3`}
                  aria-pressed={deathSaves.successes > i}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    deathSaves.successes > i
                      ? 'border-emerald-600 bg-emerald-500'
                      : 'border-muted-foreground/40 bg-transparent',
                    !canEdit && 'cursor-default',
                  )}
                  onClick={() => canEdit && setDeathSave('successes', i)}
                />
              ))}
            </div>
            <div className="flex items-center gap-1" role="group" aria-label="Death save failures">
              <span className="sr-only">Failures</span>
              {[0, 1, 2].map((i) => (
                <button
                  key={`f-${i}`}
                  type="button"
                  disabled={!canEdit || isLoading}
                  aria-label={`Death save failure ${i + 1} of 3`}
                  aria-pressed={deathSaves.failures > i}
                  className={cn(
                    'h-6 w-6 rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    deathSaves.failures > i
                      ? 'border-red-600 bg-red-500'
                      : 'border-muted-foreground/40 bg-transparent',
                    !canEdit && 'cursor-default',
                  )}
                  onClick={() => canEdit && setDeathSave('failures', i)}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
