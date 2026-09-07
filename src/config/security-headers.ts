/**
 * The one place response headers are defined.
 *
 * Netlify reads public/_headers and Vercel reads vercel.json. They were
 * maintained by hand, in parallel, and had already drifted: three of the four
 * per-path policies disagreed between the two hosts, and the test only ever
 * compared the site-wide one, so nobody noticed. A policy that differs by host
 * is a policy nobody can reason about.
 *
 * Both files are generated from this module by `npm run headers`, and a test
 * fails if either has been edited by hand since.
 *
 * A note on ordering, because the two hosts disagree: Netlify applies the FIRST
 * matching rule for a header, Vercel the LAST. The generator emits each host's
 * order accordingly — do not "tidy" one to match the other.
 */

/** Everything the browser is allowed to reach, and why it is on the list. */
export const CONNECT_SRC = [
  "'self'",
  'https://api.dexscreener.com', // price, liquidity, volume
  'https://api.geckoterminal.com', // candles, trades, holders, concentration
  'https://rpc.mainnet.chain.robinhood.com', // the chain: burn, balances, supply
] as const;

/** The policy every page gets. `img-src` is the only part that ever varies. */
function policy(imgSrc: string): string {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    `img-src ${imgSrc}`,
    "font-src 'self'",
    `connect-src ${CONNECT_SRC.join(' ')}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "object-src 'none'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
    /*
     * Trusted Types: the browser refuses to let a string reach innerHTML at all.
     *
     * `script-src 'self'` stops an attacker loading a script. It does nothing
     * about DOM XSS, where the payload never becomes a script tag — it is a
     * string written into an existing sink. This directive closes that door in
     * the engine rather than in review: assigning a plain string to innerHTML,
     * outerHTML, insertAdjacentHTML or a script src throws a TypeError.
     *
     * `trusted-types 'none'` is the strict form — not one policy may be created,
     * so there is no escape hatch to be abused later. The site can afford the
     * strict form because it already writes every dynamic value with
     * textContent; see src/lib/live-text.ts, which exists to make that the only
     * way to put an API response on the page. This turns that convention from
     * something a reviewer has to notice into something the browser enforces.
     *
     * Cross-browser since February 2026 (Firefox last). Older browsers ignore
     * the directive, so nothing is broken by shipping it — they simply keep the
     * protection the rest of the policy already gives them.
     */
    "require-trusted-types-for 'script'",
    "trusted-types 'none'",
  ].join('; ');
}

export const SITE_POLICY = policy("'self' data:");

/**
 * Pages that draw a card on a canvas and hand it over as a blob: URL.
 * Exactly one extra image source; nothing else is widened.
 */
export const CANVAS_POLICY = policy("'self' data: blob:");
export const CANVAS_PATHS = ['/pfp', '/ask', '/holdings'] as const;

export const SECURITY_HEADERS: [string, string][] = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  [
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
  ],
  ['Cross-Origin-Opener-Policy', 'same-origin'],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload'],
];

/** Fingerprinted or content-addressed: safe to cache forever. */
export const IMMUTABLE_PATHS = ['/_astro'] as const;

/**
 * Artwork, replaced by uploading a new file rather than by editing one.
 * Scoped to the image directories — a rule on /memes would also match the meme
 * PAGES and hide every deploy behind a week-old HTML cache.
 */
export const WEEK_PATHS = [
  '/memes/full',
  '/memes/thumb',
  '/memes/thumb15x',
  '/memes/thumb2x',
  '/memes/display',
  '/memes/og',
  '/coins/full',
  '/coins/thumb',
  '/coins/og',
  '/art',
  '/posts',
] as const;

/*
 * Deliberately NOT cached for a week:
 *   /coins/ — an HTML route. A prefix rule on them put every
 *   deploy behind a seven-day cache, which is the bug this list was split to fix.
 */

export const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
export const WEEK_CACHE = 'public, max-age=604800';
/** HTML always revalidates, so a deploy is live immediately. */
export const HTML_CACHE = 'public, max-age=0, must-revalidate';
