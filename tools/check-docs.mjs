/**
 * Checks the white paper hangs together.
 *
 * A docs section fails quietly: a page drops out of the sidebar and nobody
 * notices because every other page still works. These are the three ways that
 * happens, all of them caught before a build ships.
 *
 * Run with `npm run docs`. It is part of `npm run check`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { DOCS_ORDER } from '../src/config/docs.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(root, 'src', 'docs');

const files = readdirSync(docsDir)
  .filter((name) => name.endsWith('.md'))
  .map((name) => name.replace(/\.md$/, ''));

const problems = [];

// 1. Every page in the reading order exists, and every file is in the order.
for (const slug of DOCS_ORDER) {
  if (!files.includes(slug)) problems.push(`${slug}: in the sidebar with no Markdown behind it`);
}
for (const slug of files) {
  if (!DOCS_ORDER.includes(slug)) problems.push(`${slug}: has a page but no place in the sidebar`);
}

// 2. Frontmatter, and internal links that point at something real.
const known = new Set([
  ...DOCS_ORDER.map((slug) => `/docs/${slug}/`),
  '/docs/',
  '/stats/',
  '/holdings/',
  '/ask/',
  '/pfp/',
  '/memes/',
  '/brand/',
  '/roadmap/',
]);

for (const slug of files) {
  const text = readFileSync(join(docsDir, `${slug}.md`), 'utf8');
  const front = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '';
  if (!/^title: .+$/m.test(front)) problems.push(`${slug}: no title in the frontmatter`);
  if (!/^summary: .+$/m.test(front)) problems.push(`${slug}: no summary in the frontmatter`);

  for (const [, href] of text.matchAll(/\]\((\/[^)#]*)\)/g)) {
    const path = href.endsWith('/') ? href : `${href}/`;
    if (!known.has(path)) problems.push(`${slug}: links to ${href}, which is not a page`);
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) in the white paper:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.warn(`${files.length} white paper pages checked. Sidebar, frontmatter and links all hold.`);
