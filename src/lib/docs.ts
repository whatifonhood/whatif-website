/**
 * Reads the white paper's Markdown at build time.
 *
 * The pages are ordinary Markdown rendered through Astro's own pipeline, so the
 * prose stays prose and nothing is injected as HTML from outside this
 * repository.
 *
 * The folder is the language: src/docs/en/the-token.md and src/docs/tr/the-token.md
 * are the same page twice, and the slug is what ties them together — so the
 * sidebar, prev/next, hreflang and the language picker all work without a
 * mapping table anywhere. Same shape the Learn section used.
 *
 * `npm run docs` fails the build on a page that was never translated, for the
 * same reason a missing key in src/content/ fails typecheck: half a paper is
 * worse than an honest English one.
 */
import type { MarkdownInstance } from 'astro';

import { DOCS_GROUPS, DOCS_ORDER } from '../config/docs.ts';
import { LOCALES, type Locale } from '../config/site.ts';

export interface DocsPage {
  slug: string;
  locale: Locale;
  title: string;
  summary: string;
  /** Position in the whole paper, 1-based. Shown in the sidebar. */
  number: number;
  /** The group's id; the label for it lives in src/content/<language>.ts. */
  group: string;
  headings: { depth: number; slug: string; text: string }[];
}

type DocModule = MarkdownInstance<{ title?: string; summary?: string }>;

const modules = import.meta.glob<DocModule>('../docs/*/*.md', { eager: true });

/** `../docs/tr/the-token.md` → `{ locale: 'tr', slug: 'the-token' }`. */
function parsePath(path: string): { locale: Locale; slug: string } | undefined {
  const match = /\/docs\/([^/]+)\/([^/]+)\.md$/.exec(path);
  if (!match) return undefined;
  const [, locale, slug] = match;
  if (!LOCALES.includes(locale as Locale)) return undefined;
  return { locale: locale as Locale, slug: slug! };
}

const key = (locale: string, slug: string) => `${locale}/${slug}`;

const byKey = new Map<string, DocModule>();
for (const [path, module] of Object.entries(modules)) {
  const parsed = parsePath(path);
  if (parsed) byKey.set(key(parsed.locale, parsed.slug), module);
}

/** Every page in one language, in the reading order src/config/docs.ts sets. */
export function getDocsPages(locale: Locale): DocsPage[] {
  return DOCS_ORDER.map((slug, index) => {
    const module = byKey.get(key(locale, slug));
    const group = DOCS_GROUPS.find((entry) => entry.slugs.includes(slug))?.id ?? '';
    return {
      slug,
      locale,
      title: module?.frontmatter?.title ?? slug,
      summary: module?.frontmatter?.summary ?? '',
      number: index + 1,
      group,
      // Only H2s: an "on this page" list that also carries H3s stops being a
      // glance and becomes a second document.
      headings: (module?.getHeadings?.() ?? []).filter((heading) => heading.depth === 2),
    };
  });
}

/** The rendered body of one page. */
export function getDocsContent(locale: Locale, slug: string) {
  return byKey.get(key(locale, slug))?.Content;
}

/**
 * Slugs with a Markdown file but no place in the sidebar.
 *
 * A page nothing links to is a page nobody reads, so `npm run docs` treats this
 * as a failure rather than quietly building it.
 */
export function orphanedDocs(): string[] {
  const orphans = new Set<string>();
  for (const composite of byKey.keys()) {
    const slug = composite.split('/')[1] ?? '';
    if (!DOCS_ORDER.includes(slug)) orphans.add(composite);
  }
  return [...orphans];
}

/** Slugs listed in the sidebar with no English Markdown behind them. */
export function missingDocs(): string[] {
  return DOCS_ORDER.filter((slug) => !byKey.has(key('en', slug)));
}

/**
 * Pages that exist in English and are missing in another language.
 *
 * English is the source: a page is written there first and translated after, so
 * anything English has and a locale does not is untranslated rather than
 * deleted.
 */
export function missingDocsTranslations(): { locale: Locale; slug: string }[] {
  const missing: { locale: Locale; slug: string }[] = [];
  for (const locale of LOCALES) {
    if (locale === 'en') continue;
    for (const slug of DOCS_ORDER) {
      if (!byKey.has(key(locale, slug))) missing.push({ locale, slug });
    }
  }
  return missing;
}
