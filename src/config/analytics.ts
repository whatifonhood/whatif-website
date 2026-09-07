/**
 * Analytics configuration.
 *
 * The site uses Plausible, proxied through our own domain so that no
 * third-party script is ever loaded and no third-party origin appears in the
 * Content-Security-Policy. The two rewrite rules that make that work live in
 * public/_redirects.
 *
 * Nothing here is a secret: the domain is public, there is no key, and no
 * personal data is collected. No cookies are set, so no consent banner is
 * needed.
 *
 * TO TURN IT ON: set `enabled` to true after the Plausible site is created and
 * the placeholder in public/_redirects is replaced with the real script id.
 * Until then `track()` is a no-op and no request is made.
 */
export const ANALYTICS = {
  enabled: false,
  /** The site name registered with Plausible; must match exactly. */
  domain: 'whatifonhood.com',
  /** First-party paths. These are rewritten to Plausible by public/_redirects. */
  scriptPath: '/js/script.js',
  eventPath: '/api/event',
} as const;

/**
 * The events worth recording, and why each one exists.
 *
 * Pageviews are the least interesting thing here. Each of these answers a
 * question that would otherwise be a guess. None of them carries anything a
 * person typed — see the note in src/lib/analytics.ts.
 */
export const EVENTS = {
  /** Which memes pull people in, and so which series to make more of. */
  memeView: 'Meme View',
  /** Viewing and taking are different signals. */
  memeDownload: 'Meme Download',
  /** Whether the generator gets used, and which formats people reach for. */
  memeMade: 'Meme Made',
  /** Which coins people compare against — a ranked list of what they regret. */
  pfpRoll: 'PFP Roll',
  pfpDownload: 'PFP Download',
  /** What actually gets posted, page by page. */
  shareClick: 'Share Click',
  /** The highest-intent action on the site: someone about to buy. */
  addressCopy: 'Address Copy',
  /** The closest thing to a purchase funnel we can see. */
  marketClick: 'Market Click',
  /** What people actually look at on the dashboard. */
  chartInteract: 'Chart Interact',
  /** Demand for a holder platform, measured before committing to build one. */
  walletLookup: 'Wallet Lookup',
} as const;
