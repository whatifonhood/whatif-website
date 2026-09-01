/**
 * Fetches the posts listed in src/config/tweets.ts.
 *
 * X's oEmbed endpoint still answers without a key or a token, and returns the
 * post's text and author. This takes that, reduces it to PLAIN TEXT, and writes
 * src/config/tweet-cards.ts.
 *
 * SECURITY, and the reason this file exists at all: oEmbed hands back a block of
 * HTML written by someone else. It is never injected. Everything below strips it
 * to text, and the page renders that text as text — third-party markup rendered
 * into our page would be the one cross-site scripting hole in an otherwise
 * airtight site, arriving from a source we do not control.
 *
 * A failure here must never fail a deploy: if X is unreachable the previously
 * committed file is left exactly as it is and the build carries on.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TWEET_URLS } from '../src/config/tweets.ts';

const here = dirname(fileURLToPath(import.meta.url));
const output = resolve(here, '..', 'src', 'config', 'tweet-cards.ts');

/** Only real post URLs are ever requested. */
// Status ids have no minimum length — the earliest posts on the platform are
// only two digits, and rejecting those is a bug rather than a safety check.
const POST_URL = /^https:\/\/(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/status\/\d{1,25}$/;

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/** Reduces the returned HTML to the words in it. Nothing else survives. */
function toPlainText(html) {
  const source = String(html ?? '');

  // oEmbed wraps the post in <p> and then appends its own attribution line —
  // "— name (@handle) date". We render the author ourselves, so take only the
  // paragraph and drop everything after it.
  const paragraph = source.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

  return (
    (paragraph ? paragraph[1] : source)
      // A media link X appends is not part of what was written.
      .replace(/<a[^>]*>\s*[^<]*pic\.(twitter|x)\.com[^<]*<\/a>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

const cards = [];
let failed = 0;

for (const url of TWEET_URLS) {
  if (!POST_URL.test(url)) {
    console.warn(`Skipping, not a post URL: ${url}`);
    continue;
  }

  try {
    const endpoint = new URL('https://publish.x.com/oembed');
    endpoint.searchParams.set('url', url);
    endpoint.searchParams.set('omit_script', '1');
    endpoint.searchParams.set('dnt', 'true');

    const response = await fetch(endpoint, {
      headers: { accept: 'application/json' },
      redirect: 'follow',
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(String(response.status));
    const body = await response.json();

    const text = toPlainText(body.html);
    if (!text) throw new Error('no text');

    cards.push({
      text,
      authorName: String(body.author_name ?? '').slice(0, 80),
      authorUrl: String(body.author_url ?? ''),
      url,
    });
    process.stdout.write(`  ✓ ${url.split('/').pop()}\n`);
  } catch (error) {
    failed += 1;
    console.warn(`  ✗ ${url} — ${error.message}`);
  }
}

// Leave the committed file alone rather than emptying the wall over a bad day.
if (cards.length === 0 && TWEET_URLS.length > 0) {
  console.warn('\nNothing fetched; keeping the existing tweet-cards.ts.');
  process.exit(0);
}

const previous = readFileSync(output, 'utf8');
const header = previous.slice(0, previous.indexOf('export const TWEET_CARDS'));

writeFileSync(
  output,
  `${header}export const TWEET_CARDS: TweetCard[] = ${JSON.stringify(cards, null, 2)};\n`,
);
console.warn(`\n${cards.length} posts written${failed ? `, ${failed} failed` : ''}`);
