import { HomebrewType } from '../../enums';
import { backgroundDataSchema } from './background.schema';
import { featDataSchema } from './feat.schema';
import { magicItemDataSchema } from './magic-item.schema';
import { monsterDataSchema } from './monster.schema';
import { spellDataSchema } from './spell.schema';
import { subclassDataSchema } from './subclass.schema';

export * from './background.schema';
export * from './feat.schema';
export * from './magic-item.schema';
export * from './monster.schema';
export * from './spell.schema';
export * from './subclass.schema';

export const homebrewDataSchemas = {
  [HomebrewType.SPELL]: spellDataSchema,
  [HomebrewType.MONSTER]: monsterDataSchema,
  [HomebrewType.FEAT]: featDataSchema,
  [HomebrewType.BACKGROUND]: backgroundDataSchema,
  [HomebrewType.MAGIC_ITEM]: magicItemDataSchema,
  [HomebrewType.SUBCLASS]: subclassDataSchema,
} as const;

export function getHomebrewDataSchema(type: HomebrewType) {
  return homebrewDataSchemas[type];
}
