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
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TWEET_URLS } from '../src/config/tweets.ts';
import { TWEET_CARDS as COMMITTED } from '../src/config/tweet-cards.ts';

import { writeConfig } from './lib/write-config.mjs';

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
/** Posts X says are gone for good. These are meant to leave the wall. */
let dropped = 0;

/**
 * What is already on the wall, so a bad day cannot take a post off it.
 *
 * A fetch can fail for two very different reasons, and they deserve opposite
 * treatment: a post DELETED on X should leave the wall, but a rate limit or a
 * five-hundred should change nothing. Without this the daily job would write
 * whatever it happened to get, and the refresh commit would make a transient
 * failure permanent — two posts quietly gone until somebody noticed.
 */
const alreadyOnTheWall = new Map(COMMITTED.map((card) => [card.url, card]));

/** 404 and 410 mean the post is gone for good. Everything else is a bad day. */
const GONE = new Set([404, 410]);

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
    if (!response.ok) {
      const error = new Error(String(response.status));
      error.status = response.status;
      throw error;
    }
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

    if (GONE.has(error.status)) {
      console.warn(`  ✗ ${url} — deleted or unavailable (${error.status}); dropping it`);
      dropped += 1;
      continue;
    }

    const kept = alreadyOnTheWall.get(url);
    if (kept) {
      cards.push(kept);
      console.warn(`  ~ ${url} — ${error.message}; keeping the copy already committed`);
    } else {
      console.warn(`  ✗ ${url} — ${error.message}`);
    }
  }
}

// Leave the committed file alone rather than emptying the wall over a bad day.
if (cards.length === 0 && TWEET_URLS.length > 0) {
  console.warn('\nNothing fetched; keeping the existing tweet-cards.ts.');
  process.exit(0);
}

/*
 * A last guard on the same idea, counted against what we MEANT to end up with
 * rather than against what is already committed.
 *
 * Measuring against the committed file would refuse the two cases that are
 * supposed to shrink the wall: a post deleted on X, and a URL removed from
 * TWEET_URLS by hand. Measuring against the intent catches only the case that
 * matters — a post we still want, that we could not fetch, and have no
 * committed copy of.
 */
const wanted = TWEET_URLS.filter((url) => POST_URL.test(url)).length - dropped;
if (cards.length < wanted) {
  console.warn(
    `\nOnly ${cards.length} of ${wanted} posts survived; ` +
      'keeping the existing tweet-cards.ts rather than publishing a short wall.',
  );
  process.exit(0);
}

const previous = readFileSync(output, 'utf8');
const header = previous.slice(0, previous.indexOf('export const TWEET_CARDS'));

await writeConfig(
  output,
  `${header}export const TWEET_CARDS: TweetCard[] = ${JSON.stringify(cards, null, 2)};\n`,
);
console.warn(`\n${cards.length} posts written${failed ? `, ${failed} failed` : ''}`);
