import { HomebrewType } from '@dnd-companion/shared';

import { Badge } from '@/components/ui/badge';
import type { HomebrewItem } from '@/types/api';

import { formatHomebrewType } from './homebrewUtils';

interface StatBlockProps {
  item: HomebrewItem;
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-1 border-b py-2 text-sm last:border-b-0 sm:grid-cols-3">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="sm:col-span-2">{value}</dd>
    </div>
  );
}

function SpellStatBlock({ data }: { data: Record<string, unknown> }) {
  const components = data.components as Record<string, unknown> | undefined;
  const componentParts = [
    components?.V ? 'V' : null,
    components?.S ? 'S' : null,
    components?.M ? (typeof components.M === 'string' ? `M (${components.M})` : 'M') : null,
  ].filter(Boolean);

  return (
    <dl className="divide-y rounded-lg border">
      <StatRow label="Level" value={String(data.level ?? '')} />
      <StatRow label="School" value={data.school as string} />
      <StatRow label="Casting Time" value={data.casting_time as string} />
      <StatRow label="Range" value={data.range as string} />
      <StatRow label="Components" value={componentParts.join(', ')} />
      <StatRow label="Duration" value={data.duration as string} />
      {data.concentration ? (
        <StatRow label="Tags" value={<Badge variant="secondary">Concentration</Badge>} />
      ) : null}
      {data.ritual ? <StatRow label="" value={<Badge variant="secondary">Ritual</Badge>} /> : null}
      <StatRow
        label="Classes"
        value={Array.isArray(data.classes) ? (data.classes as string[]).join(', ') : ''}
      />
      <StatRow label="Description" value={data.description as string} />
      {data.at_higher_levels ? (
        <StatRow label="At Higher Levels" value={data.at_higher_levels as string} />
      ) : null}
    </dl>
  );
}

function MonsterStatBlock({ data }: { data: Record<string, unknown> }) {
  const scores = data.ability_scores as Record<string, number> | undefined;
  const speed = data.speed as Record<string, string> | undefined;

  return (
    <dl className="divide-y rounded-lg border">
      <StatRow label="Size" value={data.size as string} />
      <StatRow label="Type" value={data.creature_type as string} />
      <StatRow label="Alignment" value={data.alignment as string} />
      <StatRow label="Armor Class" value={String(data.armor_class ?? '')} />
      <StatRow label="Hit Points" value={data.hit_points as string} />
      <StatRow
        label="Speed"
        value={
          speed
            ? Object.entries(speed)
                .map(([key, val]) => `${key} ${val}`)
                .join(', ')
            : ''
        }
      />
      {scores ? (
        <StatRow
          label="Ability Scores"
          value={Object.entries(scores)
            .map(([key, val]) => `${key} ${val}`)
            .join(' · ')}
        />
      ) : null}
      <StatRow label="Challenge Rating" value={data.challenge_rating as string} />
    </dl>
  );
}

function FeatStatBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <dl className="divide-y rounded-lg border">
      {data.prerequisite ? (
        <StatRow label="Prerequisite" value={data.prerequisite as string} />
      ) : null}
      <StatRow label="Category" value={data.category as string} />
      <StatRow label="Benefit" value={data.benefit as string} />
    </dl>
  );
}

function BackgroundStatBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <dl className="divide-y rounded-lg border">
      <StatRow
        label="Skill Proficiencies"
        value={
          Array.isArray(data.skill_proficiencies)
            ? (data.skill_proficiencies as string[]).join(', ')
            : ''
        }
      />
      <StatRow label="Feature" value={data.feature_name as string} />
      <StatRow label="Feature Description" value={data.feature_description as string} />
    </dl>
  );
}

function MagicItemStatBlock({ data }: { data: Record<string, unknown> }) {
  return (
    <dl className="divide-y rounded-lg border">
      <StatRow label="Rarity" value={data.rarity as string} />
      <StatRow label="Type" value={data.type as string} />
      <StatRow label="Attunement" value={data.attunement ? 'Required' : 'Not required'} />
      {data.attunement_requirement ? (
        <StatRow label="Attunement Requirement" value={data.attunement_requirement as string} />
      ) : null}
      <StatRow label="Properties" value={data.properties as string} />
    </dl>
  );
}

function SubclassStatBlock({ data }: { data: Record<string, unknown> }) {
  const features = Array.isArray(data.features)
    ? (data.features as Array<{ level: number; name: string; description: string }>)
    : [];

  return (
    <div className="space-y-4">
      <dl className="divide-y rounded-lg border">
        <StatRow label="Parent Class" value={data.parent_class as string} />
        {data.flavor_text ? <StatRow label="Flavor" value={data.flavor_text as string} /> : null}
      </dl>
      {features.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Features</h3>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={`${feature.name}-${index}`} className="rounded-lg border p-4">
                <p className="font-medium">
                  Level {feature.level}: {feature.name}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/** S-HOMEBREW-DETAIL — type-specific stat block (MVP minimal render) */
export function StatBlock({ item }: StatBlockProps) {
  const data = item.data ?? {};

  return (
    <section aria-labelledby="stat-block-heading" className="space-y-3">
      <h2 id="stat-block-heading" className="text-xl font-semibold">
        {formatHomebrewType(item.type)} Details
      </h2>
      {item.type === HomebrewType.SPELL ? <SpellStatBlock data={data} /> : null}
      {item.type === HomebrewType.MONSTER ? <MonsterStatBlock data={data} /> : null}
      {item.type === HomebrewType.FEAT ? <FeatStatBlock data={data} /> : null}
      {item.type === HomebrewType.BACKGROUND ? <BackgroundStatBlock data={data} /> : null}
      {item.type === HomebrewType.MAGIC_ITEM ? <MagicItemStatBlock data={data} /> : null}
      {item.type === HomebrewType.SUBCLASS ? <SubclassStatBlock data={data} /> : null}
    </section>
  );
}
