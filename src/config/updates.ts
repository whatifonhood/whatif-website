/**
 * What changed, newest first.
 *
 * Kept as typed data rather than as a content collection: an update is three
 * short fields, and the rest of the site already keeps facts in src/config and
 * words in src/content. A collection would be more machinery than the content
 * justifies.
 *
 * To add one: put a new object at the top of the array. Dates are ISO so they
 * sort and format predictably; `href` is optional and may be internal.
 */
export interface Update {
  /** ISO date, YYYY-MM-DD. */
  date: string;
  title: string;
  /** One or two sentences. If it needs more, it wants a Learn page instead. */
  body: string;
  /** Optional link to the thing being announced. */
  href?: string;
}

export const UPDATES: Update[] = [
  {
    date: '2026-08-31',
    title: 'The dashboard reads the chain properly now',
    body: 'Live holder count, a concentration breakdown, every burn since launch drawn from the chain’s own logs, and the biggest buy and sell of the day over a real 24 hours rather than the last few minutes.',
    href: '/stats/',
  },
  {
    date: '2026-08-31',
    title: 'Look up any wallet, without connecting one',
    body: 'Paste an address and see what it holds. A balance is public data on a public ledger, so there is nothing to connect, sign or approve.',
    href: '/holdings/',
  },
  {
    date: '2026-08-31',
    title: 'Every meme has its own page',
    body: 'The vault used to hand you a raw image file. Now each meme has a real page and its own preview card, so a shared meme carries a way back.',
    href: '/memes/',
  },
  {
    date: '2026-08-31',
    title: 'The site speaks Spanish',
    body: 'Español joins English, 中文 and Türkçe. The wordplay lands best here: $IF reads as “si”.',
    href: '/es/',
  },
];
