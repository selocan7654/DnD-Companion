/**
 * One-off converter: 5e-bits SRD JSON → apps/api/prisma/seed-data/*.json
 * Run: node scripts/generate-official-seed.mjs
 * Not used at runtime — seed.ts only reads the generated JSON.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srd2014 = path.join(root, 'tmp/5e-database/src/2014/en');
const srd2024 = path.join(root, 'tmp/5e-database/src/2024/en');
const outDir = path.join(root, 'apps/api/prisma/seed-data');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function joinDesc(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join('\n\n');
  if (typeof value === 'string') return value;
  return '';
}

function capitalizeWords(s) {
  return String(s)
    .split(/[\s-]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function formatSenses(senses) {
  if (!senses || typeof senses !== 'object') return undefined;
  const parts = [];
  for (const [key, val] of Object.entries(senses)) {
    if (key === 'passive_perception') {
      parts.push(`passive Perception ${val}`);
    } else {
      parts.push(`${key.replace(/_/g, ' ')} ${val}`);
    }
  }
  return parts.join(', ') || undefined;
}

function parseArmorClass(armorClass) {
  if (typeof armorClass === 'number') return armorClass;
  if (Array.isArray(armorClass) && armorClass.length > 0) {
    return Number(armorClass[0].value) || 10;
  }
  return 10;
}

function formatHitPoints(monster) {
  if (typeof monster.hit_points === 'string') return monster.hit_points;
  const hp = monster.hit_points ?? 1;
  if (monster.hit_points_roll) return `${hp} (${monster.hit_points_roll})`;
  if (monster.hit_dice) return `${hp} (${monster.hit_dice})`;
  return String(hp);
}

function mapNamedActions(list) {
  if (!Array.isArray(list)) return undefined;
  return list
    .filter((x) => x?.name && x?.desc)
    .map((x) => ({ name: x.name, description: joinDesc(x.desc) || String(x.desc) }));
}

function savingThrowsAndSkills(proficiencies) {
  const saving_throws = {};
  const skills = {};
  if (!Array.isArray(proficiencies)) return { saving_throws, skills };
  for (const p of proficiencies) {
    const name = p.proficiency?.name ?? '';
    const value = p.value;
    if (name.startsWith('Saving Throw:')) {
      const abil = name.replace('Saving Throw:', '').trim();
      saving_throws[abil] = value;
    } else if (name.startsWith('Skill:')) {
      const skill = name.replace('Skill:', '').trim();
      skills[skill] = value;
    }
  }
  return {
    saving_throws: Object.keys(saving_throws).length ? saving_throws : undefined,
    skills: Object.keys(skills).length ? skills : undefined,
  };
}

function convertSpell(raw, source) {
  const components = { V: false, S: false, M: false };
  for (const c of raw.components ?? []) {
    if (c === 'V') components.V = true;
    if (c === 'S') components.S = true;
    if (c === 'M') components.M = raw.material ? raw.material : true;
  }

  const description = joinDesc(raw.desc);
  const atHigher = joinDesc(raw.higher_level);

  return {
    name: raw.name,
    type: 'SPELL',
    source,
    description: description.slice(0, 280) || raw.name,
    data: {
      level: raw.level ?? 0,
      school: raw.school?.name ?? 'Evocation',
      casting_time: raw.casting_time ?? '1 action',
      range: raw.range ?? 'Self',
      components,
      duration: raw.duration ?? 'Instantaneous',
      concentration: Boolean(raw.concentration),
      ritual: Boolean(raw.ritual),
      classes: (raw.classes ?? []).map((c) => c.name).filter(Boolean),
      description: description || raw.name,
      ...(atHigher ? { at_higher_levels: atHigher } : {}),
    },
  };
}

function convertMonster(raw, source) {
  const { saving_throws, skills } = savingThrowsAndSkills(raw.proficiencies);
  const traits = mapNamedActions(raw.special_abilities);
  const actions = mapNamedActions(raw.actions);
  const legendary = mapNamedActions(raw.legendary_actions);
  const lair = mapNamedActions(raw.lair_actions);
  const regional = mapNamedActions(raw.regional_effects);

  const data = {
    size: raw.size ?? 'Medium',
    creature_type: capitalizeWords(raw.type ?? 'unknown'),
    alignment: capitalizeWords(raw.alignment ?? 'unaligned'),
    armor_class: parseArmorClass(raw.armor_class),
    hit_points: formatHitPoints(raw),
    speed: Object.fromEntries(
      Object.entries(raw.speed ?? { walk: '30 ft.' }).map(([k, v]) => [k, String(v)]),
    ),
    ability_scores: {
      STR: raw.strength ?? 10,
      DEX: raw.dexterity ?? 10,
      CON: raw.constitution ?? 10,
      INT: raw.intelligence ?? 10,
      WIS: raw.wisdom ?? 10,
      CHA: raw.charisma ?? 10,
    },
    ...(saving_throws ? { saving_throws } : {}),
    ...(skills ? { skills } : {}),
    ...(raw.damage_immunities?.length ? { damage_immunities: raw.damage_immunities } : {}),
    ...(raw.condition_immunities?.length
      ? {
          condition_immunities: raw.condition_immunities.map((c) =>
            typeof c === 'string' ? c : c.name,
          ),
        }
      : {}),
    ...(formatSenses(raw.senses) ? { senses: formatSenses(raw.senses) } : {}),
    ...(raw.languages ? { languages: raw.languages } : {}),
    challenge_rating: String(raw.challenge_rating ?? 0),
    ...(traits?.length ? { traits } : {}),
    ...(actions?.length ? { actions } : {}),
    ...(legendary?.length ? { legendary_actions: legendary } : {}),
    ...(lair?.length ? { lair_actions: lair } : {}),
    ...(regional?.length ? { regional_effects: regional } : {}),
  };

  return {
    name: raw.name,
    type: 'MONSTER',
    source,
    description: `${data.size} ${data.creature_type}, CR ${data.challenge_rating}`,
    data,
  };
}

function convertFeat(raw, source) {
  const prereqParts = [];
  const prereqs = Array.isArray(raw.prerequisites) ? raw.prerequisites : [];
  for (const p of prereqs) {
    if (p?.ability_score?.name && p.minimum_score != null) {
      prereqParts.push(`${p.ability_score.name} ${p.minimum_score} or higher`);
    } else if (typeof p === 'string') {
      prereqParts.push(p);
    }
  }
  const benefit =
    joinDesc(raw.desc) || (typeof raw.description === 'string' ? raw.description : '') || raw.name;
  const category =
    typeof raw.type === 'string' && raw.type.length > 0 ? capitalizeWords(raw.type) : 'General';
  return {
    name: raw.name,
    type: 'FEAT',
    source,
    description: benefit.slice(0, 280),
    data: {
      ...(prereqParts.length ? { prerequisite: prereqParts.join('; ') } : {}),
      benefit,
      category,
    },
  };
}

function convertBackground(raw, source) {
  const allProfs = [...(raw.starting_proficiencies ?? []), ...(raw.proficiencies ?? [])];
  const skillProficiencies = allProfs
    .filter((p) => p.name?.startsWith('Skill:'))
    .map((p) => p.name.replace(/^Skill:\s*/i, ''));

  const tools = allProfs
    .filter((p) => p.name?.startsWith('Tool:'))
    .map((p) => p.name.replace(/^Tool:\s*/i, ''));

  const equipmentParts = [];
  for (const e of raw.starting_equipment ?? []) {
    const name = e.equipment?.name ?? e.name;
    if (name) equipmentParts.push(`${e.quantity ?? 1}× ${name}`);
  }
  if (raw.starting_gold?.quantity) {
    equipmentParts.push(`${raw.starting_gold.quantity} ${raw.starting_gold.unit ?? 'gp'}`);
  }
  if (Array.isArray(raw.equipment_options) && raw.equipment_options[0]?.desc) {
    equipmentParts.push(raw.equipment_options[0].desc);
  }

  const featureName = raw.feature?.name ?? raw.feat?.name ?? 'Feature';
  const featureDescription =
    joinDesc(raw.feature?.desc) ||
    (typeof raw.description === 'string' ? raw.description : '') ||
    (raw.feat ? `Includes the ${raw.feat.name} feat.` : featureName);

  const pickOptions = (optSet) => {
    if (!optSet?.from?.options) return [];
    return optSet.from.options
      .map((o) => o.string ?? o.desc ?? o.ideal?.desc ?? '')
      .filter(Boolean);
  };

  const suggested = {
    personality_traits: pickOptions(raw.personality_traits),
    ideals: pickOptions(raw.ideals),
    bonds: pickOptions(raw.bonds),
    flaws: pickOptions(raw.flaws),
  };

  const hasSuggested = Object.values(suggested).some((a) => a.length > 0);

  return {
    name: raw.name,
    type: 'BACKGROUND',
    source,
    description: featureDescription.slice(0, 280),
    data: {
      skill_proficiencies: skillProficiencies.length ? skillProficiencies : ['Insight'],
      ...(tools.length ? { tool_proficiencies: tools } : {}),
      ...(equipmentParts.length ? { equipment: equipmentParts.join(', ') } : {}),
      feature_name: featureName,
      feature_description: featureDescription || featureName,
      ...(hasSuggested ? { suggested_characteristics: suggested } : {}),
    },
  };
}

function isAttunement(descArr) {
  const text = joinDesc(descArr).toLowerCase();
  return text.includes('requires attunement');
}

function attunementRequirement(descArr) {
  const text = joinDesc(descArr);
  const match = text.match(/requires attunement([^.]*\.)/i);
  if (!match) return null;
  const rest = match[1].trim();
  return rest ? `requires attunement${rest}` : 'requires attunement';
}

function convertMagicItem(raw, source) {
  const desc = joinDesc(raw.desc);
  const typeLine =
    Array.isArray(raw.desc) && raw.desc[0]
      ? raw.desc[0]
      : (raw.equipment_category?.name ?? 'Wondrous Item');
  const rarity = raw.rarity?.name ?? 'Varies';
  const attunement = isAttunement(raw.desc);
  const properties = desc || raw.name;

  return {
    name: raw.name,
    type: 'MAGIC_ITEM',
    source,
    description: properties.slice(0, 280),
    data: {
      rarity,
      type: typeLine,
      attunement,
      attunement_requirement: attunement ? attunementRequirement(raw.desc) : null,
      properties,
      charges: null,
      recharge: null,
    },
  };
}

function convertSubclass(raw, featuresBySubclassIndex, source) {
  const index = raw.index;
  let features = (featuresBySubclassIndex.get(index) ?? []).map((f) => {
    const level =
      typeof f.level === 'number'
        ? f.level
        : typeof f.level?.name === 'string'
          ? Number(String(f.level.name).match(/(\d+)\s*$/)?.[1] ?? 1)
          : 1;
    return {
      level: Number.isFinite(level) && level >= 1 ? level : 1,
      name: f.name,
      description:
        joinDesc(f.desc) || (typeof f.description === 'string' ? f.description : '') || f.name,
    };
  });

  // 2024 embeds features on subclass
  if ((!features.length || features.every((f) => !f.description)) && Array.isArray(raw.features)) {
    features = raw.features.map((f) => ({
      level: f.level ?? 3,
      name: f.name,
      description: typeof f.description === 'string' ? f.description : joinDesc(f.desc) || f.name,
    }));
  }

  if (features.length === 0) {
    features.push({
      level: 3,
      name: `${raw.name} Features`,
      description:
        joinDesc(raw.desc) ||
        (typeof raw.description === 'string' ? raw.description : '') ||
        `Features of the ${raw.name} subclass.`,
    });
  }

  const flavor =
    joinDesc(raw.desc) ||
    (typeof raw.description === 'string' ? raw.description : '') ||
    (typeof raw.summary === 'string' ? raw.summary : '');

  return {
    name: raw.name,
    type: 'SUBCLASS',
    source,
    description: (flavor || raw.name).slice(0, 280),
    data: {
      parent_class: raw.class?.name ?? 'Unknown',
      ...(flavor ? { flavor_text: flavor } : {}),
      features,
    },
  };
}

function dedupeByKey(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const key = `${item.name}::${item.type}::${item.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function writeOut(filename, items) {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
  fs.writeFileSync(path.join(outDir, filename), `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${filename}: ${sorted.length}`);
}

function main() {
  const spells2014 = readJson(path.join(srd2014, '5e-SRD-Spells.json')).map((s) =>
    convertSpell(s, 'PHB'),
  );
  const monsters = readJson(path.join(srd2014, '5e-SRD-Monsters.json')).map((m) =>
    convertMonster(m, 'MM'),
  );
  const magicItems2014 = readJson(path.join(srd2014, '5e-SRD-Magic-Items.json'))
    .filter((m) => !m.variant)
    .map((m) => convertMagicItem(m, 'DMG'));

  const feats2014 = readJson(path.join(srd2014, '5e-SRD-Feats.json')).map((f) =>
    convertFeat(f, 'PHB'),
  );
  const feats2024 = readJson(path.join(srd2024, '5e-SRD-Feats.json')).map((f) =>
    convertFeat(f, 'PHB2024'),
  );

  const backgrounds2014 = readJson(path.join(srd2014, '5e-SRD-Backgrounds.json')).map((b) =>
    convertBackground(b, 'PHB'),
  );
  const backgrounds2024 = readJson(path.join(srd2024, '5e-SRD-Backgrounds.json')).map((b) =>
    convertBackground(b, 'PHB2024'),
  );

  const features = readJson(path.join(srd2014, '5e-SRD-Features.json'));
  const featuresBySubclass = new Map();
  for (const f of features) {
    if (!f.subclass?.index) continue;
    const list = featuresBySubclass.get(f.subclass.index) ?? [];
    list.push(f);
    featuresBySubclass.set(f.subclass.index, list);
  }

  const subclasses2014 = readJson(path.join(srd2014, '5e-SRD-Subclasses.json')).map((s) =>
    convertSubclass(s, featuresBySubclass, 'PHB'),
  );

  const features2024 = readJson(path.join(srd2024, '5e-SRD-Features.json'));
  const featuresBySubclass2024 = new Map();
  for (const f of features2024) {
    if (!f.subclass?.index) continue;
    const list = featuresBySubclass2024.get(f.subclass.index) ?? [];
    list.push(f);
    featuresBySubclass2024.set(f.subclass.index, list);
  }
  const subclasses2024 = readJson(path.join(srd2024, '5e-SRD-Subclasses.json')).map((s) =>
    convertSubclass(s, featuresBySubclass2024, 'PHB2024'),
  );

  // Spell count is the full SRD 5.1 corpus (~319). Licensed PHB+XGTE+TCoE text is not
  // redistributed in-repo; expanding beyond SRD requires Source enum + licensed data.

  writeOut('spells.json', dedupeByKey(spells2014));
  writeOut('monsters.json', dedupeByKey(monsters));
  writeOut('feats.json', dedupeByKey([...feats2014, ...feats2024]));
  writeOut('backgrounds.json', dedupeByKey([...backgrounds2014, ...backgrounds2024]));
  writeOut('magic-items.json', dedupeByKey(magicItems2014));
  writeOut('subclasses.json', dedupeByKey([...subclasses2014, ...subclasses2024]));
}

main();
