/**
 * The tools in the header dropdown, in display order.
 *
 * Adding a tool to the site is two edits: add a route here, then add its label
 * and one-line description to `nav.tools` in each file under src/content/.
 * TypeScript will not let you forget the second step.
 */
export const TOOL_ROUTES = [
  { id: 'pfp', href: '/pfp/' },
  { id: 'machine', href: '/machine/' },
  { id: 'memes', href: '/memes/' },
  { id: 'maker', href: '/memes/make/' },
  { id: 'stats', href: '/stats/' },
  { id: 'holdings', href: '/holdings/' },
  { id: 'brand', href: '/brand/' },
] as const;

export type ToolId = (typeof TOOL_ROUTES)[number]['id'];
