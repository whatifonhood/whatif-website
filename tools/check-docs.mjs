/**
 * Checks the white paper hangs together, in every language.
 *
 * A docs section fails quietly: a page drops out of the sidebar and nobody
 * notices because every other page still works. On a paper whose whole argument
 * is that its numbers are checkable, a page that silently is not there — or is
 * there in English on a Chinese reader's screen — is worse than a build error.
 *
 * Run with `npm run docs`. It is part of `npm run check`.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { DOCS_ORDER } from '../src/config/docs.ts';
import { LOCALES } from '../src/config/site.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(root, 'src', 'docs');

/** Pages a chapter may link to, before the locale prefix. */
const SITE_ROUTES = [
  '/stats/',
  '/holdings/',
  '/ask/',
  '/pfp/',
  '/memes/',
  '/brand/',
  '/roadmap/',
  '/docs/',
];

const slugsIn = (locale) => {
  const dir = join(docsDir, locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.replace(/\.md$/, ''))
    .sort();
};

const read = (locale, slug) => readFileSync(join(docsDir, locale, `${slug}.md`), 'utf8');
const frontmatter = (text) => /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '';
const field = (front, name) => new RegExp(`^${name}: (.+)$`, 'm').exec(front)?.[1]?.trim();
const headings = (text) => (text.match(/^## /gm) ?? []).length;

const problems = [];

// Translated pages kept English month names in their sentences for weeks before
// anyone noticed. The lint is cheap; the embarrassment was not.
const ENGLISH_MONTH =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/;
const english = slugsIn('en');

// 1. The reading order and the English files agree.
for (const slug of DOCS_ORDER) {
  if (!english.includes(slug))
    problems.push(`en/${slug}: in the sidebar with no Markdown behind it`);
}
for (const slug of english) {
  if (!DOCS_ORDER.includes(slug))
    problems.push(`en/${slug}: has a page but no place in the sidebar`);
}

for (const locale of LOCALES) {
  const slugs = slugsIn(locale);

  // 2. Every English page is translated, and nothing exists that English lacks.
  for (const slug of english) {
    if (!slugs.includes(slug)) problems.push(`${locale}/${slug}: not translated`);
  }
  for (const slug of slugs) {
    if (!english.includes(slug)) problems.push(`${locale}/${slug}: has no English original`);
  }

  for (const slug of slugs.filter((one) => english.includes(one))) {
    const text = read(locale, slug);
    const front = frontmatter(text);
    const source = read('en', slug);
    // A page quoting a percentage carries the day it was read, so the figure
    // can never look current when it is not. Rendered under the title.
    if (/\d%/.test(text.replace(/^---[\s\S]*?---/, ''))) {
      const snapshot = field(front, 'snapshot')?.replace(/^['"]|['"]$/g, '');
      if (!snapshot) problems.push(`${locale}/${slug}: quotes a percentage with no snapshot: date`);
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot)) {
        problems.push(`${locale}/${slug}: snapshot "${snapshot}" is not YYYY-MM-DD`);
      }
    }
    if (locale !== 'en' && ENGLISH_MONTH.test(text)) {
      problems.push(`${locale}/${slug}: an English month name in a translated page`);
    }

    // 3. Frontmatter: both fields present, and actually translated.
    for (const name of ['title', 'summary']) {
      if (field(front, name) === undefined) {
        problems.push(`${locale}/${slug}: frontmatter has no ${name}`);
      } else if (locale !== 'en' && field(front, name) === field(frontmatter(source), name)) {
        problems.push(`${locale}/${slug}: ${name} is still the English text`);
      }
    }

    // 4. Same shape as the original. A translation that quietly dropped a
    //    section would still build and still read fine on its own.
    if (headings(text) !== headings(source)) {
      problems.push(
        `${locale}/${slug}: ${headings(text)} sections, English has ${headings(source)}`,
      );
    }

    // 5. Links point at a page that exists, in the reader's own language.
    const known = new Set([
      ...SITE_ROUTES.map((route) => (locale === 'en' ? route : `/${locale}${route}`)),
      ...DOCS_ORDER.map((other) =>
        locale === 'en' ? `/docs/${other}/` : `/${locale}/docs/${other}/`,
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
  console.error(`${problems.length} problem(s) in the white paper:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.warn(
  `${english.length} white paper pages checked in ${LOCALES.length} languages. Sidebar, frontmatter and links all hold.`,
);
