/**
 * The roadmap.
 *
 * One list, four states. Shipped items stay on it rather than being deleted —
 * a roadmap that only shows the future is a wish list, and the most persuasive
 * thing on it is the record of what actually landed.
 *
 * `date` is only set on shipped items. Nothing here promises a date for
 * anything that has not happened; this is a meme coin and dates are the easiest
 * promise in crypto to break.
 *
 * To update: change a `status`, and add the date if it shipped.
 */
export type RoadmapStatus = 'shipped' | 'building' | 'next' | 'later';

export interface RoadmapItem {
  title: string;
  body: string;
  status: RoadmapStatus;
  /** ISO date, shipped items only. */
  date?: string;
  href?: string;
}

/** Display order of the columns. */
export const ROADMAP_STATUSES = ['building', 'next', 'later', 'shipped'] as const;

export const ROADMAP: RoadmapItem[] = [
  // ---------------------------------------------------------------- shipped
  {
    status: 'shipped',
    date: '2026-08-31',
    title: 'The live dashboard',
    body: 'Holder count, concentration, every burn since launch read from the chain, and the biggest buy and sell of the day.',
    href: '/stats/',
  },
  {
    status: 'shipped',
    date: '2026-08-31',
    title: 'Wallet lookup',
    body: 'Paste any address and see what it holds. No connection, no signature, nothing to approve.',
    href: '/holdings/',
  },
  {
    status: 'shipped',
    date: '2026-08-31',
    title: 'A page for every meme',
    body: 'The vault used to hand out raw image files. Each meme now has a real page and its own preview card.',
    href: '/memes/',
  },
  {
    status: 'shipped',
    date: '2026-08-31',
    title: 'The Learn section',
    body: 'How to spot a scam, self-custody, how to read the dashboard — every claim linking to where you can check it.',
    href: '/learn/',
  },
  {
    status: 'shipped',
    date: '2026-08-31',
    title: 'Four languages',
    body: 'English, 中文, Türkçe and Español across every tool on the site.',
  },

  // --------------------------------------------------------------- building
  {
    status: 'building',
    title: 'The meme engine',
    body: 'A proper generator with real templates, replacing the first attempt. Make one in ten seconds, post it, no upload.',
  },
  {
    status: 'building',
    title: 'More of the market in the Machine',
    body: 'Nearly five hundred coins so far, $IF among them. The long tail of DEX-only tokens is the part still missing.',
    href: '/machine/',
  },

  // ------------------------------------------------------------------- next
  {
    status: 'next',
    title: 'The community wall',
    body: 'Real posts on the homepage, rendered in our own type rather than embedded — no tracker, no iframe.',
  },
  {
    status: 'next',
    title: 'Learn in every language',
    body: 'The tools are translated; the writing is not. Safety guidance gets translated by people, not by a machine.',
  },
  {
    status: 'next',
    title: 'Deeper chart',
    body: 'Longer ranges, a moving average, and burns marked on the timeline where they happened.',
    href: '/stats/',
  },

  // ------------------------------------------------------------------ later
  {
    status: 'later',
    title: 'The trait creator',
    body: 'Build your own $IF character from layered artwork, rather than pulling one that already exists. Waiting on the art.',
  },
  {
    status: 'later',
    title: 'Holder features',
    body: 'Wallet connection, signed login, and things that unlock by balance. Parked deliberately — the lookup tests whether anyone wants it first.',
  },
];
