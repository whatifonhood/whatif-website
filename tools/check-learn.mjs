/**
 * Checks the Learn section hangs together in every language.
 *
 * Learn is the safety section: how to spot a scam, what a recovery phrase does,
 * how to read the dashboard. A half-translated safety section fails quietly —
 * the index still renders, the missing page simply is not in it, and a Turkish
 * reader never learns the page existed. So a missing translation is a failed
 * build, exactly like a missing key in src/content/.
 *
 * Run with `npm run learn`. It is part of `npm run check`.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { LOCALES } from '../src/config/site.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const learnDir = join(root, 'src', 'learn');

/** Pages the articles are allowed to link to, before the locale prefix. */
const SITE_ROUTES = [
  '/stats/',
  '/holdings/',
  '/ask/',
  '/pfp/',
  '/memes/',
  '/brand/',
  '/roadmap/',
  '/learn/',
];

/** Built in English only, so a translated article links to it unprefixed. */
const ENGLISH_ONLY = ['/docs/'];

const slugsIn = (locale) => {
  const dir = join(learnDir, locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.replace(/\.md$/, ''))
    .sort();
};

const read = (locale, slug) => readFileSync(join(learnDir, locale, `${slug}.md`), 'utf8');
const frontmatter = (text) => /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '';
const field = (front, name) => new RegExp(`^${name}: (.+)$`, 'm').exec(front)?.[1]?.trim();
const headings = (text) => (text.match(/^## /gm) ?? []).length;

const problems = [];
const english = slugsIn('en');

if (english.length === 0) problems.push('src/learn/en/ has no pages at all');

for (const locale of LOCALES) {
  const slugs = slugsIn(locale);

  // 1. Every English page is translated, and nothing exists that English lacks.
  for (const slug of english) {
    if (!slugs.includes(slug)) problems.push(`${locale}/${slug}: not translated`);
  }
  for (const slug of slugs) {
    if (!english.includes(slug)) problems.push(`${locale}/${slug}: has no English original`);
  }

  for (const slug of slugs.filter((s) => english.includes(s))) {
    const text = read(locale, slug);
    const front = frontmatter(text);
    const source = read('en', slug);
    const sourceFront = frontmatter(source);

    // 2. Frontmatter: the prose fields are translated, the wiring is not.
    for (const name of ['title', 'summary', 'category', 'order', 'updated']) {
      if (field(front, name) === undefined) {
        problems.push(`${locale}/${slug}: frontmatter has no ${name}`);
      }
    }
    for (const name of ['category', 'order', 'updated']) {
      const theirs = field(front, name);
      const ours = field(sourceFront, name);
      if (theirs !== undefined && theirs !== ours) {
        problems.push(`${locale}/${slug}: ${name} is "${theirs}", English says "${ours}"`);
      }
    }
    if (locale !== 'en') {
      for (const name of ['title', 'summary']) {
        if (field(front, name) === field(sourceFront, name)) {
          problems.push(`${locale}/${slug}: ${name} is still the English text`);
        }
      }
    }

    // 3. Same shape as the original. A translation that quietly dropped a
    //    section would still build and still read fine on its own.
    if (headings(text) !== headings(source)) {
      problems.push(
        `${locale}/${slug}: ${headings(text)} sections, English has ${headings(source)}`,
      );
    }

    // 4. Links point at a page that exists, in the reader's own language.
    const known = new Set([
      ...ENGLISH_ONLY,
      ...SITE_ROUTES.map((route) => (locale === 'en' ? route : `/${locale}${route}`)),
      ...english.map((other) =>
        locale === 'en' ? `/learn/${other}/` : `/${locale}/learn/${other}/`,
      ),
    ]);
    for (const [, href] of text.matchAll(/\]\((\/[^)#]*)\)/g)) {
      const path = href.endsWith('/') ? href : `${href}/`;
      if (!known.has(path))
        problems.push(`${locale}/${slug}: links to ${href}, which is not a page`);
    }
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) in the Learn section:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.warn(
  `${english.length} Learn pages checked in ${LOCALES.length} languages. Nothing untranslated, nothing orphaned, every link real.`,
);
