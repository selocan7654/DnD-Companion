import { Link } from 'react-router-dom';
import { Eye, EyeOff, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Character } from '@/types/api';

interface CharacterCardProps {
  character: Character;
}

function formatClassLevel(character: Character): string {
  const classPart = character.className?.trim() || 'Unclassed';
  return `${classPart} Lvl ${character.level}`;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const hpCurrent = character.hitPointsCurrent ?? 0;
  const hpMax = character.hitPointsMax ?? 0;
  const hpPercent = hpMax > 0 ? Math.min(100, Math.round((hpCurrent / hpMax) * 100)) : 0;

  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-tight">
            <Link
              to={`/characters/${character.id}`}
              className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {character.name}
            </Link>
          </CardTitle>
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
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">{formatClassLevel(character)}</p>
        {character.race ? <Badge variant="outline">{character.race}</Badge> : null}
        {character.campaignId ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" aria-hidden="true" />
            Assigned to campaign
          </p>
        ) : null}
        {hpMax > 0 ? (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>HP</span>
              <span>
                {hpCurrent} / {hpMax}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={hpCurrent}
              aria-valuemin={0}
              aria-valuemax={hpMax}
              aria-label={`Hit points ${hpCurrent} of ${hpMax}`}
            >
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        ) : null}
        <div className="flex gap-2 pt-1">
          <Link
            to={`/characters/${character.id}/builder`}
            className="text-xs font-medium text-primary hover:underline"
          >
            Edit sheet
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
