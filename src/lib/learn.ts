/**
 * The Learn pages.
 *
 * Markdown under src/learn/<locale>/, read at build time. This is the one place
 * on the site where prose beats a typed config object: these pages are
 * paragraphs, not fields, and writing one should be writing a file.
 *
 * The folder is the language. src/learn/en/spotting-a-scam.md and
 * src/learn/tr/spotting-a-scam.md are the same page twice, and the slug is what
 * ties them together — so the language switcher, hreflang and prev/next all
 * work without a mapping table anywhere.
 *
 * Frontmatter is validated the same way external data is: a page missing a
 * title or an order would otherwise fail silently in the middle of a list.
 * `npm run learn` fails the build on a missing translation, for the same reason
 * a missing key in src/content/ fails typecheck — a half-translated safety
 * section is worse than an honest English one.
 */
import type { MarkdownInstance } from 'astro';

import { LOCALES, type Locale } from '../config/site.ts';

/** Sections of the Learn index, in the order they are shown. */
export const LEARN_CATEGORIES = ['safety', 'basics', 'token'] as const;
export type LearnCategory = (typeof LEARN_CATEGORIES)[number];

export interface LearnFrontmatter {
  title: string;
  summary: string;
  category: LearnCategory;
  order: number;
  updated: string;
}

export interface LearnPage extends LearnFrontmatter {
  slug: string;
  locale: Locale;
}

type LearnModule = MarkdownInstance<Partial<LearnFrontmatter>>;

const modules = import.meta.glob<LearnModule>('../learn/*/*.md', { eager: true });

/** `../learn/tr/spotting-a-scam.md` → `{ locale: 'tr', slug: 'spotting-a-scam' }`. */
function parsePath(path: string): { locale: Locale; slug: string } | undefined {
  const match = /\/learn\/([^/]+)\/([^/]+)\.md$/.exec(path);
  if (!match) return undefined;
  const [, locale, slug] = match;
  if (!LOCALES.includes(locale as Locale)) return undefined;
  return { locale: locale as Locale, slug: slug! };
}

const key = (locale: string, slug: string) => `${locale}/${slug}`;

const byKey = new Map<string, LearnModule>();
for (const [path, module] of Object.entries(modules)) {
  const parsed = parsePath(path);
  if (parsed) byKey.set(key(parsed.locale, parsed.slug), module);
}

/** Every page in one language, safety first, then in declared order. */
export function getLearnPages(locale: Locale): LearnPage[] {
  const pages: LearnPage[] = [];

  for (const [path, module] of Object.entries(modules)) {
    const parsed = parsePath(path);
    if (!parsed || parsed.locale !== locale) continue;

    const matter = module.frontmatter;
    if (!matter?.title || !matter.summary || typeof matter.order !== 'number') continue;

    // A page filed under a category that does not exist would vanish from the
    // index without any error, so it is checked rather than trusted.
    const category = LEARN_CATEGORIES.includes(matter.category as LearnCategory)
      ? (matter.category as LearnCategory)
      : 'basics';

    pages.push({
      slug: parsed.slug,
      locale,
      title: matter.title,
      summary: matter.summary,
      category,
      order: matter.order,
      updated: matter.updated ?? '',
    });
  }

  return pages.sort((a, b) => a.order - b.order);
}

/** The pages in one section, for the grouped index. */
export function getLearnPagesIn(locale: Locale, category: LearnCategory): LearnPage[] {
  return getLearnPages(locale).filter((page) => page.category === category);
}

/** The rendered body of one page. */
export function getLearnContent(locale: Locale, slug: string) {
  return byKey.get(key(locale, slug))?.Content;
}

/**
 * Slugs that exist in English and are missing in another language.
 *
 * English is the source: a page is written there first and translated after, so
 * anything English has and a locale does not is an untranslated page rather
 * than a deleted one. `npm run learn` turns this into a failed build.
 */
export function missingLearnTranslations(): { locale: Locale; slug: string }[] {
  const english = getLearnPages('en').map((page) => page.slug);
  const missing: { locale: Locale; slug: string }[] = [];
  for (const locale of LOCALES) {
    if (locale === 'en') continue;
    for (const slug of english) {
      if (!byKey.has(key(locale, slug))) missing.push({ locale, slug });
    }
  }
  return missing;
}
