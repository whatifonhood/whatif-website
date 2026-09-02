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
  // englishOnly: these two have no translated build yet, so a locale prefix
  // would point at a page that does not exist. Sending a reader to the English
  // one is worse than a translation and far better than a 404.
  { id: 'learn', href: '/learn/', group: 'read', englishOnly: true },
  { id: 'docs', href: '/docs/', group: 'read', englishOnly: true },
  { id: 'roadmap', href: '/roadmap/', group: 'read' },
] as const satisfies readonly {
  id: string;
  href: string;
  group: ToolGroup;
  englishOnly?: boolean;
}[];

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
 * Every route that exists in English only.
 *
 * `localePath` prefixes blindly, which is right for the pages that are built in
 * four languages and wrong for the ones that are not — it produced 438 links to
 * /zh/learn/, /es/docs/ and the like, none of which exist. Anything listed here
 * keeps its English path whatever locale the reader is in.
 */
export const ENGLISH_ONLY: readonly string[] = TOOL_ROUTES.filter(
  (tool) => 'englishOnly' in tool && tool.englishOnly,
).map((tool) => tool.href);

/** Like `localePath`, but never invents a translation that was not built. */
export function toolPath(href: string, locale: string): string {
  return ENGLISH_ONLY.includes(href) ? href : localePath(href, locale);
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
