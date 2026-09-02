/**
 * The roadmap.
 *
 * A list of features with a status next to each is a status board, not a
 * roadmap. This carries the three things that make the difference:
 *
 *   track   — what the work is FOR. Four of them, each with an objective stated
 *             in src/content/<language>.ts. An item that fits none of them is an
 *             item nobody asked for.
 *   needs   — what has to be true before it can start. Most roadmaps that slip
 *             slipped on something already known and unwritten.
 *   signal  — how we will know it worked, written before the work rather than
 *             after. "Done" is not a status somebody sets; it is something that
 *             happens.
 *
 * Shipped items stay on the list rather than being deleted. A roadmap showing
 * only the future is a wish list, and the record of what actually landed is the
 * only part of it that has been tested.
 *
 * `date` is set on shipped items ONLY. Nothing here carries a date for
 * something that has not happened — see `terms` in the content files, which
 * says so on the page rather than only in this comment.
 *
 * `href` is passed through `toolPath`, never `localePath`: the white paper and
 * the daily archive are built in English only, and blindly prefixing them
 * produced six links to /zh/docs/ and /tr/ask/day/ that answer 404.
 *
 * To update: change a `status`, add the `date` it shipped, and — wherever there
 * is a page to open — an `href` pointing at the thing itself. A claim on a
 * roadmap with nothing to open is a claim the reader has to take on faith,
 * which is the thing this site exists not to ask for.
 */
export type RoadmapStatus = 'shipped' | 'building' | 'next' | 'later';

/** What a piece of work is for. Labels and objectives live in the content files. */
export const ROADMAP_TRACKS = ['proof', 'tools', 'words', 'craft'] as const;
export type RoadmapTrack = (typeof ROADMAP_TRACKS)[number];

export interface RoadmapItem {
  title: string;
  body: string;
  status: RoadmapStatus;
  track: RoadmapTrack;
  /** ISO date. Shipped items only — the type cannot enforce it, `npm run roadmap` does. */
  date?: string;
  /** The thing itself, so a claim can be opened and checked. */
  href?: string;
  /** What has to be true first. Unshipped items only. */
  needs?: string;
  /** How we will know it worked. Unshipped items only. */
  signal?: string;
}

/** Display order of the sections. */
export const ROADMAP_STATUSES = ['building', 'next', 'later', 'shipped'] as const;

export const ROADMAP: RoadmapItem[] = [
  // ---------------------------------------------------------------- building
  {
    status: 'building',
    track: 'tools',
    title: 'The meme engine',
    body: 'A proper generator with real templates, replacing the first attempt. Pick a template, type a line, post it. Nothing to upload and nothing to install.',
    needs:
      'More poses. Four exist and all four are front-facing, so every template is the same figure standing in the middle of it.',
    signal: 'A meme we did not make turns up in the timeline.',
  },
  {
    status: 'building',
    track: 'craft',
    title: 'Bulletproof on a phone',
    body: 'Most people who open this site open it on a phone, often on a bad connection. Every page, every control and every flow tested on real iOS and Android engines rather than a narrow desktop window.',
    needs: 'Nothing. It is measurement and repair.',
    signal:
      'Every interactive element is thumb-sized, no page scrolls sideways at any width a phone actually is, and every tool completes under a finger.',
  },

  // ------------------------------------------------------------------- next
  {
    status: 'next',
    track: 'words',
    title: 'The white paper in every language',
    body: 'Twelve pages covering the thesis, the token, the supply, how to buy it and what we do not claim — currently English only, while the tools around it are in four languages.',
    needs: 'Nothing. The English is written and the section is built.',
    signal:
      'A reader in Turkish can get from the landing page to the supply figures without leaving their own language.',
  },

  // ------------------------------------------------------------------ later
  {
    status: 'later',
    track: 'tools',
    title: 'The trait creator',
    body: 'Build a $IF character from layered artwork instead of pulling one that already exists. Pick a body, a head and a set of traits, and take away something nobody else has.',
    needs:
      'Layered artwork that does not exist yet. Traits have to be drawn to register against each other, which is a different job from drawing 150 finished coins.',
    signal: 'The pool stops being the only way to get a picture.',
  },
  {
    status: 'later',
    track: 'tools',
    title: 'Holder features',
    body: 'Wallet connection, a signed login, and things that unlock by balance.',
    needs:
      'A reason. The wallet lookup is the test: it answers the same question with nothing to connect and nothing to sign, and if that turns out to be enough then this never needs building.',
    signal: 'Enough people ask for something the lookup genuinely cannot do.',
  },

  // ---------------------------------------------------------------- shipped
  {
    status: 'shipped',
    track: 'proof',
    date: '2026-08-31',
    title: 'The live dashboard',
    body: 'Holder count, concentration, every burn since launch read from the chain, and the biggest buy and sell of the day.',
    href: '/stats/',
  },
  {
    status: 'shipped',
    track: 'tools',
    date: '2026-08-31',
    title: 'Wallet lookup',
    body: 'Paste any address and see what it holds. No connection, no signature, nothing to approve.',
    href: '/holdings/',
  },
  {
    status: 'shipped',
    track: 'craft',
    date: '2026-08-31',
    title: 'A page for every meme',
    body: 'The vault used to hand out raw image files. Each meme now has a real page and its own preview card.',
    href: '/memes/',
  },
  {
    status: 'shipped',
    track: 'words',
    date: '2026-08-31',
    title: 'Four languages',
    body: 'English, 中文, Türkçe and Español across every tool on the site.',
  },
  {
    status: 'shipped',
    track: 'craft',
    date: '2026-09-01',
    title: 'The community wall',
    body: 'Real posts on the landing page, in our own type rather than embedded. The text is fetched once at build time — no third-party script, no iframe, nothing watching you read it.',
    href: '/#posts',
  },
  {
    status: 'shipped',
    track: 'words',
    date: '2026-09-01',
    title: 'The vault in every language',
    body: 'Every meme in the vault now has a page in Chinese, Turkish and Spanish as well as English. The titles stay as written — they are jokes, not prose.',
    href: '/memes/',
  },
  {
    status: 'shipped',
    track: 'tools',
    date: '2026-09-01',
    title: 'Your collection survives a new phone',
    body: 'Pulls are kept in your own browser, so clearing it used to lose them. Copy a code, paste it in anywhere else, and they come back.',
    href: '/pfp/',
  },
  {
    status: 'shipped',
    track: 'proof',
    date: '2026-09-01',
    title: 'Check every number yourself',
    body: 'The exact command behind each figure on the dashboard, built from the same addresses the page uses. Paste any of them into a terminal and check us.',
    href: '/stats/',
  },
  {
    status: 'shipped',
    track: 'proof',
    date: '2026-09-01',
    title: 'Who holds it',
    body: 'The fifteen largest holdings, with the burn address and the liquidity pool named rather than left looking like whales. Every row links to the address.',
    href: '/stats/',
  },
  {
    status: 'shipped',
    track: 'proof',
    date: '2026-09-01',
    title: 'Who can change the contract',
    body: 'Read from the chain instead of claimed. The contract has no owner function at all — a stronger fact than any promise, and one anyone can check.',
    href: '/stats/',
  },
  {
    status: 'shipped',
    track: 'tools',
    date: '2026-09-01',
    title: 'Every day so far',
    body: 'The daily question now has a page per day, so a shared link unfurls with the question itself and the whole run is readable back to launch.',
    href: '/ask/day/',
  },
  {
    status: 'shipped',
    track: 'tools',
    date: '2026-09-01',
    title: 'Since you were last here',
    body: 'Come back and the dashboard says what moved. Compared against figures your own browser kept — nothing is sent anywhere.',
    href: '/stats/',
  },
  {
    status: 'shipped',
    track: 'proof',
    date: '2026-09-01',
    title: 'The deeper chart',
    body: 'Zoom, pan, a moving average, and every burn marked on the timeline where it happened.',
    href: '/stats/',
  },
  {
    status: 'shipped',
    track: 'proof',
    date: '2026-09-02',
    title: 'The white paper',
    body: 'Twelve pages: the thesis, the token, the supply and the burn, who holds it, how to buy it, the risks, and a page listing what this project does not claim.',
    href: '/docs/',
  },
];
