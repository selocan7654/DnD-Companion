import { Link } from 'react-router-dom';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useGetCharactersQuery } from '@/store/api/charactersApi';
import type { Character } from '@/types/api';

interface CampaignAssignedCharactersProps {
  campaignId: string;
}

function formatClassLevel(character: Character): string {
  const classPart = character.className?.trim() || 'Unclassed';
  return `${classPart} Lvl ${character.level}`;
}

export function CampaignAssignedCharacters({ campaignId }: CampaignAssignedCharactersProps) {
  const { data, isLoading, isError } = useGetCharactersQuery({ campaignId, limit: 50 });

  if (isLoading) {
    return <LoadingSpinner label="Loading assigned characters" />;
  }

  if (isError) {
    return <p className="text-sm text-muted-foreground">Failed to load assigned characters.</p>;
  }

  const characters = data?.data ?? [];

  if (characters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No characters assigned to this campaign yet.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {characters.map((character) => (
        <li
          key={character.id}
          className="flex items-center justify-between gap-4 rounded-lg border p-3"
        >
          <div className="min-w-0 space-y-1">
            <p className="font-medium">{character.name}</p>
            <p className="text-sm text-muted-foreground">{formatClassLevel(character)}</p>
            <p className="text-xs text-muted-foreground">@{character.ownerUsername}</p>
          </div>
          <Link
            to={`/characters/${character.id}`}
            className="shrink-0 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View
          </Link>
        </li>
      ))}
    </ul>
  );
}
