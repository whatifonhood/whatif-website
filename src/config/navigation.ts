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
