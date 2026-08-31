/**
 * Regenerates src/config/coins.ts from the PFP artwork module's manifest.
 *
 * The coin artwork and its manifest live in ../pfp (the module that produced
 * them). This copies the artwork into public/coins and turns the manifest into a
 * typed file the site can import, so the generator page is plain site code with
 * no runtime fetch.
 *
 * Run with `npm run coins` after adding artwork to the module.
 */
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const module_ = resolve(root, '..', 'pfp');
const coinsDir = join(root, 'public', 'coins');

const manifest = JSON.parse(readFileSync(join(module_, 'manifest.json'), 'utf8'));

// Artwork: 800px WebP and PNG for display and download, thumbnails for the pool
// grid, and the pre-rendered social cards for each coin's own page.
rmSync(coinsDir, { recursive: true, force: true });
mkdirSync(coinsDir, { recursive: true });
for (const [from, to] of [
  ['img/800', 'full'],
  ['img/thumb', 'thumb'],
  ['img/og', 'og'],
]) {
  cpSync(join(module_, from), join(coinsDir, to), { recursive: true });
}

const TIER_ORDER = ['common', 'uncommon', 'rare', 'legendary'];

const tierLines = TIER_ORDER.map((key) => {
  const tier = manifest.tiers[key];
  return `  ${key}: { label: '${tier.label}', line: '${tier.line}', weight: ${tier.weight} },`;
}).join('\n');

const coinLines = manifest.variants
  .map((v) => `  { slug: '${v.slug}', name: '${v.name.replace(/'/g, "\\'")}', tier: '${v.tier}' },`)
  .join('\n');

writeFileSync(
  join(root, 'src', 'config', 'coins.ts'),
  `// Generated from the PFP module's manifest by tools/build-coins.mjs.
// Do not edit by hand — add artwork to ../pfp and run \`npm run coins\`.

export type CoinTier = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface Coin {
  /** File name without extension, and the URL segment for its own page. */
  slug: string;
  name: string;
  tier: CoinTier;
}

/** Rarity tiers, rarest last. \`weight\` is the chance of drawing that tier. */
export const COIN_TIERS: Record<CoinTier, { label: string; line: string; weight: number }> = {
${tierLines}
};

export const COIN_TIER_ORDER: CoinTier[] = ${JSON.stringify(TIER_ORDER)};

export const COINS: Coin[] = [
${coinLines}
];
`,
);

process.stdout.write(`${manifest.variants.length} coins written\n`);
