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
  { id: 'machine', href: '/machine/', group: 'play' },
  { id: 'memes', href: '/memes/', group: 'assets' },
  { id: 'brand', href: '/brand/', group: 'assets' },
  { id: 'learn', href: '/learn/', group: 'read' },
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
