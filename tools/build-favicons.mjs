/**
 * Builds the browser icons from the brand pack master.
 *
 * The coin carries a lot of detail, and a plain downsample turns it to mush in a
 * browser tab, so the icons are sharpened after resizing. The .ico deliberately
 * contains no 16px frame — a browser downscaling our good 32px image beats a
 * hand-made 16px one, which is all mud whatever you do to it.
 *
 * THE CROP IS THE THING THAT GOES WRONG. The coin fills 1832px of the 2048px
 * master, so any fixed percentage crop smaller than that slices through the rim
 * and the circle comes out with flat sides. A previous version cropped to 80%
 * (1638px) and did exactly that. So the crop is measured, not guessed: trim to
 * the artwork's own bounding box, then fill the square exactly. The rim is what
 * makes the mark read as a coin — it must survive intact.
 *
 * Run with `npm run favicons` (needs ImageMagick 7).
 */
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const master = process.env.BRAND_PACK_DIR
  ? resolve(process.env.BRAND_PACK_DIR, 'favicon', 'favicon-master-2048.png')
  : resolve(root, '..', 'what-if-meme', 'brand-pack', 'favicon', 'favicon-master-2048.png');
const outDir = join(root, 'public');

/**
 * Trim to the artwork, fill the square, sharpen.
 *
 * `-fuzz 10% -trim` finds the coin's real edges instead of assuming them, so the
 * circle arrives whole. It is then scaled to INSET, not to fill: a circle drawn
 * exactly to the frame edge has its outermost arc clipped at top, bottom, left
 * and right, and reads as a circle with four flat sides. The margin below is
 * what makes it read as round.
 */
const COIN_SHARE = 0.88;
function render(size, output, sharpen) {
  execFileSync('magick', [
    master,
    '-fuzz',
    '10%',
    '-trim',
    '+repage',
    '-modulate',
    '106,118,100',
    '-filter',
    'Lanczos',
    '-resize',
    `${Math.round(size * COIN_SHARE)}x${Math.round(size * COIN_SHARE)}`,
    '-background',
    '#080B07',
    '-gravity',
    'center',
    '-extent',
    `${size}x${size}`,
    '-unsharp',
    sharpen,
    '-strip',
    output,
  ]);
}

const SIZES = [
  [32, '0x0.7+1.5+0.02'],
  [48, '0x0.7+1.3+0.02'],
  [96, '0x0.6+1.0+0.02'],
  [180, '0x0.5+0.7+0.02'],
  [192, '0x0.5+0.7+0.02'],
  [512, '0x0.4+0.4+0.02'],
];

for (const [size, sharpen] of SIZES) {
  render(size, join(outDir, `favicon-${size}.png`), sharpen);
  process.stdout.write(`  favicon-${size}.png\n`);
}

// apple-touch-icon needs an opaque background: iOS does not composite alpha.
execFileSync('magick', [
  join(outDir, 'favicon-180.png'),
  '-background',
  '#080B07',
  '-alpha',
  'remove',
  '-alpha',
  'off',
  '-strip',
  join(outDir, 'apple-touch-icon.png'),
]);
process.stdout.write('  apple-touch-icon.png\n');

// 32 and 48 only — see the note above about 16px.
execFileSync('magick', [
  join(outDir, 'favicon-32.png'),
  join(outDir, 'favicon-48.png'),
  join(outDir, 'favicon.ico'),
]);
process.stdout.write('  favicon.ico (32, 48)\n');
