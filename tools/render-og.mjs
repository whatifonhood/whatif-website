/**
 * Renders every social sharing card the site uses.
 *
 * Three kinds, all at 1200x630 and all committed to the repo, so a deploy never
 * depends on this script running:
 *
 *   public/og-default.jpg        the site-wide card        (tools/og-card.html)
 *   public/og-<page>.jpg         one per top-level page    (tools/card-page.html)
 *   public/memes/og/<slug>.jpg   one per meme              (tools/card-meme.html)
 *   public/coins/og/<slug>.jpg   one per coin              (tools/card-coin.html)
 *
 * Run with `npm run og`. Add `--memes` or `--coins` to also rebuild those sets,
 * which take a minute each and only change when the artwork does.
 *
 * The coin cards carry "#38 of 150", so ALL of them are rebuilt when artwork is
 * added — leaving the old ones alone would leave them claiming a total that is
 * no longer true.
 *
 * The meme list is read from src/config/memes.ts — the same file the site reads,
 * so a card can never describe a meme that is not in the vault.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { MEMES } from '../src/config/memes.ts';
import { COINS, COIN_TIERS } from '../src/config/coins.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const publicDir = join(root, 'public');

/**
 * One card per top-level page.
 *
 * Titles are written here rather than read from src/content, because a card is
 * an image baked at build time and only ever exists in English — the translated
 * pages share the landing card.
 */
const PAGES = [
  {
    file: 'og-stats.jpg',
    kicker: 'Stats',
    title: 'Every number, live',
    sub: 'Read straight from Robinhood Chain',
  },
  {
    file: 'og-machine.jpg',
    kicker: 'The What $IF Machine',
    title: 'What $IF you aped earlier?',
    sub: 'The arithmetic you have been avoiding',
  },
  {
    file: 'og-memes.jpg',
    kicker: 'The vault',
    title: 'Every meme. Free to steal.',
    sub: 'Full resolution, no watermark, no credit needed',
  },
  {
    file: 'og-pfp.jpg',
    kicker: 'The pool',
    title: 'Find the coin that is you',
    sub: 'Four rarities. Every pull is free.',
  },
  {
    file: 'og-roadmap.jpg',
    kicker: 'Roadmap',
    title: 'What is built, and what is next',
    sub: 'Everything shipped stays on the page',
  },
  {
    file: 'og-brand.jpg',
    kicker: 'Brand',
    title: 'The marks, and how to use them',
    sub: 'Logos, artwork and the rules',
  },
];

const wantMemes = process.argv.includes('--memes');
const wantCoins = process.argv.includes('--coins');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

/** Loads a template, waits for fonts and images, and writes the JPEG. */
async function shoot(template, query, outputPath) {
  const url = new URL(`file://${join(here, template)}`);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

  await page.goto(url.href, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    // Runs inside the browser page, where `document` exists.
    // eslint-disable-next-line no-undef
    await document.fonts.ready;
    // eslint-disable-next-line no-undef
    await Promise.all([...document.images].map((i) => (i.complete ? null : i.decode())));
  });
  const buffer = await page.screenshot({ type: 'jpeg', quality: 86 });
  writeFileSync(outputPath, buffer);
}

// 1. The site-wide card.
await shoot('og-card.html', {}, join(publicDir, 'og-default.jpg'));
console.warn('Wrote og-default.jpg');

// 2. One per page.
for (const entry of PAGES) {
  await shoot(
    'card-page.html',
    { kicker: entry.kicker, title: entry.title, sub: entry.sub },
    join(publicDir, entry.file),
  );
  console.warn(`Wrote ${entry.file}`);
}

// 3. One per meme.
if (wantMemes) {
  const memeDir = join(publicDir, 'memes', 'og');
  mkdirSync(memeDir, { recursive: true });

  for (const [index, meme] of MEMES.entries()) {
    await shoot(
      'card-meme.html',
      { slug: meme.slug, title: meme.title, series: meme.series },
      join(memeDir, `${meme.slug}.jpg`),
    );
    process.stdout.write(`\r  ${index + 1}/${MEMES.length} ${meme.slug.padEnd(44)}`);
  }
  process.stdout.write(`\n${MEMES.length} meme cards written\n`);
} else {
  console.warn('Skipped meme cards — pass --memes to rebuild them.');
}

// 4. One per coin.
if (wantCoins) {
  const coinDir = join(publicDir, 'coins', 'og');
  mkdirSync(coinDir, { recursive: true });

  for (const [index, coin] of COINS.entries()) {
    const tier = COIN_TIERS[coin.tier];
    await shoot(
      'card-coin.html',
      {
        slug: coin.slug,
        name: coin.name,
        tier: tier.label,
        odds: String(tier.weight),
        index: String(index + 1),
        total: String(COINS.length),
      },
      join(coinDir, `${coin.slug}.jpg`),
    );
    process.stdout.write(`\r  ${index + 1}/${COINS.length} ${coin.slug.padEnd(28)}`);
  }
  process.stdout.write(`\n${COINS.length} coin cards written\n`);
} else {
  console.warn('Skipped coin cards — pass --coins to rebuild them.');
}

await browser.close();
