/**
 * Posts to show on the site.
 *
 * Paste the URL of any public post here, then run `npm run tweets`. That fetches
 * the post as structured data from X's syndication endpoint at BUILD TIME (the
 * same one X's own embed widget calls), re-encodes its pictures into
 * public/posts/, and writes src/config/tweet-cards.ts, which is what the page
 * actually renders.
 *
 * Why not X's own embed widget: it is a third-party script that tracks every
 * visitor, loads an iframe per post, renders in X's design rather than ours, and
 * would force a hole in the Content-Security-Policy the whole site is built
 * around. Fetching the text once at build time costs the page nothing and keeps
 * the cards in our own type and colours.
 *
 * Freshness comes from rebuilding, not from a live script — a scheduled build
 * hook is enough for a wall of posts.
 */
export const TWEET_URLS: string[] = [
  'https://x.com/WhatIFonHOOD/status/2094772271722434583',
  'https://x.com/WhatIFonHOOD/status/2094455176971362440',
  'https://x.com/WhatIFonHOOD/status/2094442732940927202',
  'https://x.com/WhatIFonHOOD/status/2094394783137677653',
  'https://x.com/WhatIFonHOOD/status/2093803407362625946',
  'https://x.com/WhatIFonHOOD/status/2089569584860799369',
];
