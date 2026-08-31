/**
 * Builds the browser icons from the brand pack master.
 *
 * The coin carries a lot of detail, and a plain downsample turns it to mush in a
 * browser tab. Two things fix that: crop the empty field so the figure fills more
 * of the frame, then sharpen after resizing. The .ico deliberately contains no
 * 16px frame — a browser downscaling our good 32px image beats a hand-made 16px
 * one, which is all mud whatever you do to it.
 *
 * Run with `npm run favicons` (needs ImageMagick 7).
 */
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const master = resolve(
  root,
  '..',
  'what-if-meme',
  'brand-pack',
  'favicon',
  'favicon-master-2048.png',
);
const outDir = join(root, 'public');

/** Crop away the dead field, lift contrast a touch, then resize and sharpen. */
function render(size, output, sharpen) {
  execFileSync('magick', [
    master,
    '-gravity',
    'center',
    '-crop',
    '80%x80%+0+0',
    '+repage',
    '-modulate',
    '106,118,100',
    '-filter',
    'Lanczos',
    '-resize',
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
