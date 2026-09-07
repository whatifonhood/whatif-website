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
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { writeConfig } from './lib/write-config.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const module_ = resolve(root, '..', 'pfp');
const coinsDir = join(root, 'public', 'coins');

const manifest = JSON.parse(readFileSync(join(module_, 'manifest.json'), 'utf8'));

/*
 * Artwork: 800px WebP and PNG for display and download, and thumbnails for the
 * pool grid. Both directories are replaced wholesale so artwork removed from
 * the module disappears from the site.
 *
 * public/coins/og/ is NOT touched. Those cards are rendered here by
 * `npm run coincards`, and the module carries a stale copy of them — copying it
 * over deleted 49 live sharing cards and silently replaced the rest with older
 * versions. Only the two directories the module actually owns are its to write.
 */
mkdirSync(coinsDir, { recursive: true });
for (const [from, to] of [
  ['img/800', 'full'],
  ['img/thumb', 'thumb'],
]) {
  rmSync(join(coinsDir, to), { recursive: true, force: true });
  cpSync(join(module_, from), join(coinsDir, to), { recursive: true });
}

/**
 * The download PNGs, made a third of the size.
 *
 * The masters are 800x800 truecolour PNGs of about 880 KB each, and 150 of them
 * were 130 MB — most of everything this site ships, for a file only fetched
 * when somebody presses Download. A palette copy is roughly 320 KB.
 *
 * Nothing visible is lost. Measured against the master, the palette PNG is off
 * by a mean of 1.0 per channel; the WebP on the same page, which is what every
 * visitor actually looks at, is off by 2.4. The download is still the better
 * of the two files, and now it is a quarter of the weight.
 */
const fullDir = join(coinsDir, 'full');
const pngs = readdirSync(fullDir).filter((name) => name.endsWith('.png'));
let saved = 0;
await Promise.all(
  pngs.map(async (name) => {
    const file = join(fullDir, name);
    const before = readFileSync(file);
    const after = await sharp(before).png({ palette: true, quality: 100, effort: 10 }).toBuffer();
    // Never write a bigger file than the one that was there.
    if (after.length < before.length) {
      writeFileSync(file, after);
      saved += before.length - after.length;
    }
  }),
);
process.stdout.write(
  `${pngs.length} download PNGs compressed, ${Math.round(saved / 1024 / 1024)} MB saved\n`,
);

const TIER_ORDER = ['common', 'uncommon', 'rare', 'legendary'];

const tierLines = TIER_ORDER.map((key) => {
  const tier = manifest.tiers[key];
  return `  ${key}: { label: '${tier.label}', line: '${tier.line}', weight: ${tier.weight} },`;
}).join('\n');

const coinLines = manifest.variants
  .map((v) => `  { slug: '${v.slug}', name: '${v.name.replace(/'/g, "\\'")}', tier: '${v.tier}' },`)
  .join('\n');

await writeConfig(
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
