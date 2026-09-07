/**
 * Builds the meme vault from the brand pack.
 *
 * Reads every PNG in the meme pack, writes a 640px thumbnail and a
 * full-resolution WebP into public/memes/, and regenerates
 * src/config/memes.ts so the gallery page always matches what is on disk.
 *
 * To add a meme: drop the PNG into the meme pack and run `npm run memes`.
 *
 * Requires ImageMagick 7 (`brew install imagemagick`).
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { writeConfig } from './lib/write-config.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const source = process.env.BRAND_PACK_DIR
  ? resolve(process.env.BRAND_PACK_DIR, 'meme-pack', 'memes')
  : resolve(root, '..', 'what-if-meme', 'brand-pack', 'meme-pack', 'memes');
// Checked BEFORE the rm loop below. This script deletes and rewrites every
// published meme; run on a machine without the pack it used to delete 828
// committed files and then crash on readdir.
if (!existsSync(source)) {
  console.error(`meme pack not found at ${source} — set BRAND_PACK_DIR to your checkout`);
  process.exit(1);
}
const thumbDir = join(root, 'public', 'memes', 'thumb');
const thumbMidDir = join(root, 'public', 'memes', 'thumb15x');
const thumb2xDir = join(root, 'public', 'memes', 'thumb2x');
const fullDir = join(root, 'public', 'memes', 'full');
// What the meme PAGE shows. /full/ stays as the download; nobody should be
// handed a 1.5 MB master to look at a picture that renders 400–900px wide.
const displayDir = join(root, 'public', 'memes', 'display');
const DISPLAY_WIDTH = 1200;

/*
 * Three thumbnail widths, offered through a srcset.
 *
 * Two was not enough. A phone showing two columns has a slot of about 200 CSS
 * pixels; at the device pixel ratios Android reports that is roughly 530 device
 * pixels, which does not fit 400 and so takes 800 — twice what it can display.
 * Measured on a Pixel 7, the vault pulled 1.6MB of thumbnails before the reader
 * had scrolled at all. The middle rung is what those phones take instead.
 *
 * Safari picks the 400 for the same slot, so the middle rung costs iPhones
 * nothing. Desktop keeps the 800.
 */
const THUMB_WIDTH = 400;
const THUMB_MID_WIDTH = 600;
const THUMB_2X_WIDTH = 800;
const THUMB_QUALITY = 72;
const FULL_QUALITY = 82;

/**
 * Which series a meme belongs to, from its filename prefix. Series are how the
 * vault is filtered, and they mirror the lanes in MEME-CONCEPT-BANK.md.
 */
function seriesFor(slug) {
  if (slug.startsWith('gm-')) return 'gm';
  if (slug.startsWith('meme-macro-')) return 'What $IF';
  if (slug.startsWith('meme-artefact-')) return 'Artefacts';
  if (slug.startsWith('meme-history-')) return 'History';
  if (slug.startsWith('meme-hood-') || slug.startsWith('rh-')) return 'Robinhood';
  if (slug.startsWith('meme-life-')) return 'Real life';
  if (slug.startsWith('meme-face-')) return 'Reactions';
  if (slug.startsWith('meme-card-')) return 'Cards';
  if (slug.startsWith('meme-figure-')) return 'Figures';
  if (slug.startsWith('meme-token-')) return 'Crossovers';
  if (slug.startsWith('meme-reactive-')) return 'Market days';
  if (slug.startsWith('meme-when-')) return 'The impostor';
  if (slug.startsWith('top-of-hood-')) return 'Summit';
  return 'Classics';
}

/** "meme-timeline-sold-vs-held" -> "Timeline sold vs held" */
function titleFor(slug) {
  const words = slug
    .replace(/^(meme|gm)-/, '')
    .replace(/^(figure|token|reactive|when|artefact|history|hood|life|face|card|macro)-/, '')
    .split('-');
  const joined = words.join(' ');
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

function dimensionsOf(file) {
  const output = execFileSync('magick', ['identify', '-format', '%w %h', file]).toString();
  const [width, height] = output.trim().split(' ').map(Number);
  return { width, height };
}

/*
 * Only the four directories this script writes.
 *
 * It used to remove `public/memes` whole. That directory also holds `og/` — the
 * 65 social cards rendered by `npm run cards`, which this script does not
 * produce and cannot put back — so a single run deleted every one of them, and
 * nothing said so. It also replaces the published set with whatever is in the
 * source pack today, and the pack has drifted well past what is committed, so
 * the run left the site linking to files that no longer existed.
 *
 * Same shape of bug as the one in build-coins.mjs: a generator deleting a
 * directory it does not own. If a meme is withdrawn, delete its four files by
 * hand and remove it from src/config/memes.ts.
 */
for (const directory of [thumbDir, thumbMidDir, thumb2xDir, displayDir, fullDir]) {
  rmSync(directory, { recursive: true, force: true });
  mkdirSync(directory, { recursive: true });
}

const files = readdirSync(source)
  .filter((name) => name.endsWith('.png'))
  // Rejected takes are kept in the pack for reference but never published.
  .filter((name) => !/-alt\.png$|ALT/i.test(name))
  .sort();

const entries = [];

for (const [index, file] of files.entries()) {
  const slug = file.replace(/\.png$/, '');
  const input = join(source, file);
  const { width, height } = dimensionsOf(input);

  for (const [width, directory] of [
    [THUMB_WIDTH, thumbDir],
    [THUMB_MID_WIDTH, thumbMidDir],
    [THUMB_2X_WIDTH, thumb2xDir],
    [DISPLAY_WIDTH, displayDir],
  ]) {
    execFileSync('magick', [
      input,
      '-resize',
      `${width}x${width}>`,
      '-quality',
      String(THUMB_QUALITY),
      '-strip',
      join(directory, `${slug}.webp`),
    ]);
  }

  execFileSync('magick', [
    input,
    '-quality',
    String(FULL_QUALITY),
    '-strip',
    join(fullDir, `${slug}.webp`),
  ]);

  entries.push({ slug, title: titleFor(slug), series: seriesFor(slug), width, height });
  process.stdout.write(`\r  ${index + 1}/${files.length} ${slug.padEnd(44)}`);
}

const seriesOrder = [
  'Classics',
  'What $IF',
  'Artefacts',
  'History',
  'Real life',
  'Robinhood',
  'Reactions',
  'Cards',
  'Crossovers',
  'Figures',
  'Market days',
  'The impostor',
  'gm',
  'Summit',
];
const seriesPresent = seriesOrder.filter((name) => entries.some((entry) => entry.series === name));

const output = `// Generated by tools/build-memes.mjs — do not edit by hand.
// Add a PNG to what-if-meme/brand-pack/meme-pack/memes and run \`npm run memes\`.

export interface Meme {
  /** File name without extension; also the thumbnail and download file name. */
  slug: string;
  title: string;
  series: string;
  width: number;
  height: number;
}

/** Every series in the vault, in display order. */
export const MEME_SERIES = ${JSON.stringify(seriesPresent)} as const;

export const MEMES: Meme[] = ${JSON.stringify(entries, null, 2)};
`;

// Through writeConfig, not writeFileSync: JSON.stringify emits double quotes and
// no trailing commas, which is not this repo's Prettier style, so every run left
// `npm run format:check` failing on a file the generator had just written.
await writeConfig(join(root, 'src', 'config', 'memes.ts'), output);
process.stdout.write(`\n${entries.length} memes written\n`);
