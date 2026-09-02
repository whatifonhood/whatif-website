import { LOCALES } from './site.ts';

/**
 * The tools in the header dropdown, grouped.
 *
 * The list outgrew a single flat column — eight items with no structure is a
 * wall. Groups give the menu a shape, and room to keep growing without another
 * redesign.
 *
 * Adding a tool is three edits: a route here, its label and blurb in `nav.tools`
 * in each file under src/content/, and a group label if you invent a new group.
 * TypeScript will not let you forget any of them.
 */
export const TOOL_GROUPS = ['data', 'play', 'assets', 'read'] as const;
export type ToolGroup = (typeof TOOL_GROUPS)[number];

export const TOOL_ROUTES = [
  { id: 'stats', href: '/stats/', group: 'data' },
  { id: 'holdings', href: '/holdings/', group: 'data' },
  { id: 'ask', href: '/ask/', group: 'play' },
  { id: 'pfp', href: '/pfp/', group: 'play' },
  { id: 'memes', href: '/memes/', group: 'assets' },
  { id: 'brand', href: '/brand/', group: 'assets' },
  { id: 'docs', href: '/docs/', group: 'read' },
  { id: 'roadmap', href: '/roadmap/', group: 'read' },
] as const satisfies readonly { id: string; href: string; group: ToolGroup }[];

export type ToolId = (typeof TOOL_ROUTES)[number]['id'];

/** The tools in one group, in declared order. */
export function toolsIn(group: ToolGroup) {
  return TOOL_ROUTES.filter((tool) => tool.group === group);
}

/**
 * A tool's URL in a given language.
 *
 * English is served from the root; every other language lives under its own
 * prefix. Linking to the bare route from a translated page dropped the visitor
 * back into English, and meant nothing on the site linked to the 24 translated
 * sub-pages at all — they existed, and nothing reached them.
 */
export function localePath(href: string, locale: string): string {
  return locale === 'en' ? href : `/${locale}${href}`;
}

/**
 * The routes that exist in English only.
 *
 * `localePath` prefixes blindly, which is right for everything built in four
 * languages and wrong for everything that is not. Blind prefixing produced 438
 * tool links to /zh/learn/ and /es/docs/, and 36 hreflang tags advertising
 * white-paper translations nobody had written — two different symptoms of the
 * same missing question, which is why the answer lives in one place now.
 *
 * Every pattern here is a route with no twin under src/pages/[locale]/. Adding
 * a translated build means deleting a line. tests/smoke.spec.ts walks the built
 * output and fails if this list stops matching what Astro actually produced, so
 * it cannot quietly go stale.
 */
const ENGLISH_ONLY: readonly RegExp[] = [
  /^\/ask\/day\//, // the archive of past questions
  /^\/404\/?$/,
  /^\/rss\.xml$/,
];

/** Whether a page was built in the given language. */
export function hasTranslation(pathname: string, locale: string): boolean {
  if (locale === 'en') return true;
  const base = basePath(pathname);
  return !ENGLISH_ONLY.some((pattern) => pattern.test(base));
}

/** Like `localePath`, but never invents a translation that was not built. */
export function toolPath(href: string, locale: string): string {
  return hasTranslation(href, locale) ? localePath(href, locale) : href;
}

/**
 * The page you are on, in another language.
 *
 * The language switcher used to go to that language's home page from wherever
 * you were, so switching language on any sub-page — a Learn article, a meme, the
 * dashboard — silently threw away your place. It keeps it now, and falls back to
 * the home page only where there is genuinely nothing to keep.
 */
export function translatedPath(pathname: string, locale: string): string {
  const base = basePath(pathname);
  return hasTranslation(base, locale) ? localePath(base, locale) : localePath('/', locale);
}

/**
 * Strips a locale prefix, giving the path as it exists in English.
 *
 * `/es/machine/` and `/machine/` are the same page in two languages, and
 * several things — hreflang, the language switcher — need to get from one to
 * the other. Pairs with `localePath`, which goes the other way.
 */
export function basePath(pathname: string): string {
  const match = /^\/([a-z]{2})(\/.*)?$/.exec(pathname);
  if (!match) return pathname;
  const [, code, rest] = match;
  if (!LOCALES.includes(code as (typeof LOCALES)[number]) || code === 'en') return pathname;
  return rest && rest !== '/' ? rest : '/';
}
