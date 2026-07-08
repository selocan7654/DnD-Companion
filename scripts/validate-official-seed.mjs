/**
 * Validates generated seed-data against shared Zod schemas.
 * Run after generate-official-seed.mjs: node scripts/validate-official-seed.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

// Use built shared package (CJS)
const shared = require(path.join(root, 'packages/shared/dist/index.js'));

const { HomebrewType, homebrewDataSchemas } = shared;
const seedDir = path.join(root, 'apps/api/prisma/seed-data');

const files = {
  'spells.json': HomebrewType.SPELL,
  'monsters.json': HomebrewType.MONSTER,
  'feats.json': HomebrewType.FEAT,
  'backgrounds.json': HomebrewType.BACKGROUND,
  'magic-items.json': HomebrewType.MAGIC_ITEM,
  'subclasses.json': HomebrewType.SUBCLASS,
};

let totalOk = 0;
let totalFail = 0;

for (const [file, type] of Object.entries(files)) {
  const items = JSON.parse(fs.readFileSync(path.join(seedDir, file), 'utf8'));
  const schema = homebrewDataSchemas[type];
  let ok = 0;
  let fail = 0;
  for (const item of items) {
    const parsed = schema.safeParse(item.data);
    if (parsed.success) {
      ok++;
    } else {
      fail++;
      console.warn(`FAIL ${file} ${item.name}:`, parsed.error.issues.slice(0, 3));
    }
  }
  console.log(`${file}: ${ok} ok, ${fail} fail (of ${items.length})`);
  totalOk += ok;
  totalFail += fail;
}

console.log(`TOTAL ${totalOk} ok, ${totalFail} fail`);
process.exit(totalFail > 0 ? 1 : 0);
