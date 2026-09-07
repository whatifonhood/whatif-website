/**
 * Builds the downloadable brand kit at public/brand/what-if-brand-kit.zip.
 *
 * The site does not display the kit's contents — it hands over one file for
 * anyone making $IF content. Everything comes from the canonical brand pack in
 * ../what-if-meme/brand-pack, so the kit can never drift from the source.
 *
 * Run with `npm run brandkit`.
 */
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import {
  cpSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  existsSync,
  statSync,
  readFileSync,
} from 'node:fs';
import { dirname, join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
// The source pack is a private checkout that sits beside this one on the
// maintainer's machine. Anyone else points BRAND_PACK_DIR at their copy; with
// neither, the script says so and stops rather than zipping a README.
const pack = process.env.BRAND_PACK_DIR ?? resolve(root, '..', 'what-if-meme', 'brand-pack');
if (!existsSync(pack)) {
  console.error(`brand pack not found at ${pack} — set BRAND_PACK_DIR to your checkout`);
  process.exit(1);
}
const staging = resolve(root, '.brand-kit-build');
const outFile = join(root, 'public', 'brand', 'what-if-brand-kit.zip');
/** The marks alone — folders 01 to 04 — for anyone who does not need 4K sheets. */
const marksFile = join(root, 'public', 'brand', 'what-if-marks.zip');
/** Sizes for the page, so the "55 MB" on it can never be a typed guess again. */
const sizesFile = join(root, 'src', 'data', 'brand-kit.json');

/** [source in the brand pack, destination in the kit] */
const CONTENTS = [
  ['token-logo/if-token-logo-master-2048.png', '01-token-logo/if-token-logo-2048.png'],
  ['token-logo/if-token-logo-512.png', '01-token-logo/if-token-logo-512.png'],
  ['token-logo/if-token-logo-256.png', '01-token-logo/if-token-logo-256.png'],
  [
    'token-logo/if-token-logo-transparent-2048.png',
    '01-token-logo/if-token-logo-transparent-2048.png',
  ],
  [
    'token-logo/if-token-logo-transparent-512.png',
    '01-token-logo/if-token-logo-transparent-512.png',
  ],

  ['x-avatar/if-x-avatar-zoom-800.png', '02-avatar/if-avatar-800.png'],
  ['x-avatar/if-x-avatar-coin-alt-800.png', '02-avatar/if-avatar-coin-800.png'],

  ['wordmark/if-wordmark-on-dark.svg', '03-wordmark/if-wordmark-dark.svg'],
  ['wordmark/if-wordmark-on-light.svg', '03-wordmark/if-wordmark-light.svg'],
  ['wordmark/if-wordmark-transparent-for-dark.png', '03-wordmark/if-wordmark-dark.png'],
  ['wordmark/if-wordmark-transparent-for-light.png', '03-wordmark/if-wordmark-light.png'],
  ['wordmark/if-monogram-on-dark.svg', '03-wordmark/if-monogram-dark.svg'],
  ['wordmark/if-monogram-on-light.svg', '03-wordmark/if-monogram-light.svg'],

  ['favicon/favicon.ico', '04-favicon/favicon.ico'],
  ['favicon/favicon-512.png', '04-favicon/favicon-512.png'],
  ['favicon/apple-touch-icon.png', '04-favicon/apple-touch-icon.png'],

  [
    'character-reference/if-man-reference-sheet-4k.png',
    '05-character/if-man-reference-sheet-4k.png',
  ],
  [
    'character-reference/if-man-reference-sheet-2k.png',
    '05-character/if-man-reference-sheet-2k.png',
  ],
  ['character-reference/IF-MAN-PROMPT-KIT.md', '05-character/IF-MAN-PROMPT-KIT.md'],

  ['x-banner/if-x-banner-cosmic-wordmark-3000x1000.png', '06-banners/banner-cosmic-wordmark.png'],
  ['x-banner/if-x-banner-scene-3000x1000.png', '06-banners/banner-scene.png'],
  ['x-banner/if-x-banner-dark-tiles-3000x1000.png', '06-banners/banner-dark-tiles.png'],

  ['meme-pack/if-man-thinking-transparent.png', '07-character-cutouts/if-man-thinking.png'],
  ['meme-pack/if-man-pointing-transparent.png', '07-character-cutouts/if-man-pointing.png'],
  ['meme-pack/if-man-shrug-transparent.png', '07-character-cutouts/if-man-shrug.png'],
  ['meme-pack/if-man-facepalm-transparent.png', '07-character-cutouts/if-man-facepalm.png'],
  ['meme-pack/if-man-victory-transparent.png', '07-character-cutouts/if-man-victory.png'],
  ['meme-pack/if-man-arms-crossed-transparent.png', '07-character-cutouts/if-man-arms-crossed.png'],
];

const README = `WHAT $IF — BRAND KIT
====================

Everything you need to make $IF community content. Use it for $IF: posts,
memes, stickers, videos. Not for another token, project or product, and
nothing here implies endorsement — see NOTICE.txt in this kit.

WHAT IS IN HERE
  01-token-logo        The coin. Use for the token: DEX listings, wallets,
                       token lists, price trackers. Always the full coin
                       WITH its rim — the rim is what makes it read as currency.
  02-avatar            The character, cropped so it fills a circular crop.
                       Use for profile pictures.
  03-wordmark          The name, as true vector. Use for headers, overlays,
                       merch and partner placements. The two four-point stars
                       off the F are part of the mark — keep them.
  04-favicon           Browser and app icons.
  05-character         The IF Man reference sheet and the prompt kit. Attach the
                       sheet as an image reference in any AI tool and pair it
                       with the prompt blocks. Generate from the reference,
                       never from memory.
  06-banners           Ready-made social banners.
  07-character-cutouts Transparent poses for memes.

THE PALETTE
  Void Black    #080B07   background
  Bright Lime   #8FCE02   primary
  Mid Lime      #86B50B   support
  Deep Green    #305B05   shadow
  Pale Lime     #C4DC43   highlight
  Galaxy Gold   #E4D98E   accent, sparingly

THE TYPE
  Archivo Black Italic 900, uppercase, tight tracking — headlines and wordmark.
  JetBrains Mono — anything exact or copyable. Never set a contract address in
  a display face.

THE CHARACTER — ALWAYS
  Bald, clean-shaven, lean-athletic, long neck and limbs.
  Flat acid-lime skin, thick black contour, horizontal engraving on skull/neck.
  Black space, green nebulae, gold-white galaxy cores, four-point stars.
  Calm and restrained. He wonders. He does not mug.

THE CHARACTER — NEVER
  Hair, beard, stubble or hair-like eyebrows.
  Suits, armour, jewellery, footwear, capes.
  Glossy 3D or photoreal skin. The coin's metallic render is the one exception.
  The Robinhood feather logo — write "on Robinhood Chain" instead.

VOICE
  Curious, cosmic, slightly deadpan. The question is the brand: leave it open,
  do not answer it.

THE ONLY OFFICIAL SITE IS whatifonhood.com
Contract: 0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1
Always verify the contract address against whatifonhood.com and @WhatIFonHOOD.

$IF is a meme coin with no intrinsic value. Not financial advice.
`;

rmSync(staging, { recursive: true, force: true });
mkdirSync(staging, { recursive: true });

let copied = 0;
const missing = [];
for (const [from, to] of CONTENTS) {
  const source = join(pack, from);
  if (!existsSync(source)) {
    missing.push(from);
    continue;
  }
  const destination = join(staging, to);
  mkdirSync(dirname(destination), { recursive: true });
  if (extname(source) === '.png') {
    // Re-encoded rather than copied. The source PNGs carry text chunks from
    // the generator that made them — an `hf-job-id` per image and creation
    // timestamps — and a zip that is downloaded from the public site is not
    // the place for them. sharp writes a fresh PNG with no ancillary chunks.
    // Maximum lossless compression: the same pixels at a third of the bytes.
    // The 4k reference sheet alone went from 16 MB to 6.
    await sharp(source).png({ compressionLevel: 9, effort: 10 }).toFile(destination);
  } else if (to.endsWith('IF-MAN-PROMPT-KIT.md')) {
    // The prompt kit cites two files that are not in the kit: a head-studies
    // sheet, and the private research document. Those lines go.
    const kept = readFileSync(source, 'utf8')
      .split('\n')
      .filter((line) => !/head-studies|CHARACTER-RESEARCH/.test(line));
    writeFileSync(destination, kept.join('\n'));
  } else {
    cpSync(source, destination);
  }
  copied += 1;
}

if (copied === 0) {
  console.error('nothing copied — refusing to publish a brand kit that is only a README');
  process.exit(1);
}

writeFileSync(join(staging, 'README.txt'), README);
// The licence terms travel with the files rather than being a pointer at a
// repository the reader may never open.
writeFileSync(join(staging, 'NOTICE.txt'), readFileSync(join(root, 'NOTICE'), 'utf8'));

rmSync(outFile, { force: true });
rmSync(marksFile, { force: true });
mkdirSync(dirname(outFile), { recursive: true });
// -X drops the "extra fields" zip records by default: Unix UID/GID and local
// timestamps of whoever ran the build, which is exactly what a public file
// should not say.
execFileSync('zip', ['-r', '-q', '-X', outFile, '.'], { cwd: staging });
execFileSync(
  'zip',
  [
    '-r',
    '-q',
    '-X',
    marksFile,
    '01-token-logo',
    '02-avatar',
    '03-wordmark',
    '04-favicon',
    'README.txt',
    'NOTICE.txt',
  ],
  { cwd: staging },
);
rmSync(staging, { recursive: true, force: true });

const kitBytes = statSync(outFile).size;
const marksBytes = statSync(marksFile).size;
writeFileSync(
  sizesFile,
  `${JSON.stringify({ kitBytes, marksBytes, files: copied + 2 }, null, 2)}\n`,
);
process.stdout.write(
  `${copied} files -> ${outFile} (${(kitBytes / 1024 / 1024).toFixed(1)} MB), marks ${(marksBytes / 1024 / 1024).toFixed(1)} MB\n`,
);
if (missing.length)
  process.stdout.write(`  missing from the brand pack:\n   - ${missing.join('\n   - ')}\n`);
