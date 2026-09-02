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

  {
    status: 'shipped',
    date: '2026-09-01',
    title: 'The community wall',
    body: 'Real posts on the landing page, in our own type rather than embedded. The text is fetched once at build time — no third-party script, no iframe, nothing watching you read it.',
    href: '/#posts',
  },
  {
    status: 'shipped',
    date: '2026-09-01',
    title: 'The vault in every language',
    body: 'All 65 memes now have a page in Chinese, Turkish and Spanish as well as English. The titles stay as written — they are jokes, not prose.',
    href: '/memes/',
  },
  {
    status: 'shipped',
    date: '2026-09-01',
    title: 'Your collection survives a new phone',
    body: 'Pulls are kept in your own browser, so clearing it used to lose them. Copy a code, paste it in anywhere else, and they come back.',
    href: '/pfp/',
  },
  {
    status: 'shipped',
    date: '2026-09-01',
    title: 'Check every number yourself',
    body: 'The exact command behind each figure on the dashboard, built from the same addresses the page uses. Paste any of them into a terminal and check us.',
    href: '/stats/',
  },
  {
    status: 'shipped',
    date: '2026-09-01',
    title: 'Who holds it',
    body: 'The fifteen largest holdings, with the burn address and the liquidity pool named rather than left looking like whales. Every row links to the address.',
    href: '/stats/',
  },
  {
    status: 'shipped',
    date: '2026-09-01',
    title: 'Who can change the contract',
    body: 'Read from the chain instead of claimed. The contract has no owner function at all — a stronger fact than any promise, and one anyone can check.',
    href: '/stats/',
  },
  {
    status: 'shipped',
    date: '2026-09-01',
    title: 'Every day so far',
    body: 'The daily question now has a page per day, so a shared link unfurls with the question itself and the whole run is readable back to launch.',
    href: '/ask/day/',
  },
  {
    status: 'shipped',
    date: '2026-09-01',
    title: 'Since you were last here',
    body: 'Come back and the dashboard says what moved. Compared against figures your own browser kept — nothing is sent anywhere.',
    href: '/stats/',
  },
  {
    status: 'shipped',
    date: '2026-09-01',
    title: 'The deeper chart',
    body: 'Zoom, pan, a moving average, and every burn marked on the timeline where it happened.',
    href: '/stats/',
  },

  // --------------------------------------------------------------- building
  {
    status: 'building',
    title: 'The meme engine',
    body: 'A proper generator with real templates, replacing the first attempt. Make one in ten seconds, post it, no upload.',
  },

  // ------------------------------------------------------------------- next
  {
    status: 'next',
    title: 'Learn in every language',
    body: 'The tools are translated; the writing is not. Safety guidance gets translated by people, not by a machine.',
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
