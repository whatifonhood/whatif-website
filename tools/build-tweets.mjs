/**
 * Fetches the posts listed in src/config/tweets.ts, with their pictures.
 *
 * X's syndication endpoint — the same one X's own embed widget calls — answers
 * without a key or a token and returns the post as STRUCTURED DATA rather than
 * a block of HTML: the text, the author, and direct links to the media. Using
 * it instead of oEmbed means there is no third-party markup to sanitise, and it
 * is the only way to get the pictures at all.
 *
 * The pictures are then DOWNLOADED and re-encoded into public/posts/, so the
 * page serves them from our own origin. That is the whole point: a visitor sees
 * the full post, and X never learns they were here. An <iframe> or X's widget
 * script would show the same thing while loading a tracker on every visit and
 * forcing a hole in the Content-Security-Policy the rest of the site is built
 * around.
 *
 * SECURITY. Everything below arrives from outside:
 *   - the text is plain text, entity-decoded and stripped of characters that
 *     change how the rest of the line is displayed;
 *   - a media URL is used only after its host is checked against an allowlist;
 *   - downloaded bytes are re-encoded by sharp, which either produces an image
 *     or throws — so nothing reaches public/ that is not a real picture;
 *   - every filename is built from the post id in OUR list, never from the
 *     response, so a hostile payload cannot choose where a file lands.
 *
 * A failure here must never fail a deploy: a post deleted on X leaves the wall,
 * and anything else keeps whatever is already committed.
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { TWEET_URLS } from '../src/config/tweets.ts';
import { TWEET_CARDS as COMMITTED } from '../src/config/tweet-cards.ts';
import { writeConfig } from './lib/write-config.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const output = join(root, 'src', 'config', 'tweet-cards.ts');
const mediaDir = join(root, 'public', 'posts');

/** Only real post URLs are ever requested. */
// Status ids have no minimum length — the earliest posts on the platform are
// only two digits, and rejecting those is a bug rather than a safety check.
const POST_URL = /^https:\/\/(x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/status\/(\d{1,25})$/;

/** The only host a picture may be fetched from. */
const MEDIA_HOST = 'pbs.twimg.com';

/** X allows four pictures per post; anything beyond that is a malformed reply. */
const MAX_PHOTOS = 4;

/** Refuse anything larger than this rather than pulling an unbounded download. */
const MAX_BYTES = 12 * 1024 * 1024;

/** Wide enough for a full-width card on a large screen, and no wider. */
const PHOTO_WIDTH = 1200;
const AVATAR_SIZE = 96;

/** 404 and 410 mean the post is gone for good. Everything else is a bad day. */
const GONE = new Set([404, 410]);

// The endpoint refuses a bare script, the same as the block explorer does.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

/** Tidies the post text. It arrives as text, so nothing here is sanitising markup. */
function clean(text) {
  return (
    String(text ?? '')
      .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity.toLowerCase()] ?? ' ')
      // Invisible characters that change how the rest of the line is DISPLAYED.
      // U+202A-U+202E and U+2066-U+2069 can reverse or reorder what follows, so
      // a post can be made to read as something its author did not write, and
      // the zero-width ones can hide text inside a word. ZWNJ and ZWJ are
      // deliberately left alone: Persian and Indic scripts need them, and the
      // bidi algorithm handles real Arabic and Hebrew without any of these.
      //
      // Written as escapes, never as the characters themselves: a source
      // file carrying literal bidi controls is the exact trick this line
      // exists to defeat, and it would be invisible to whoever reviewed it.
      .replace(/[\u202A-\u202E\u2066-\u2069\u200B\uFEFF]/g, '')
      // Control characters, keeping the newlines and tabs that carry meaning.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/** Downloads one picture and re-encodes it into public/posts/. */
async function saveImage(url, name, width, { round = false } = {}) {
  // Checked before the request is made, not after: this is the line between a
  // URL we chose and a URL somebody else did.
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== MEDIA_HOST) {
    throw new Error(`refusing media from ${parsed.hostname}`);
  }

  const response = await fetch(url, {
    headers: { 'user-agent': BROWSER_UA },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`media ${response.status}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) throw new Error('media too large');

  // sharp either decodes a real image or throws, so nothing that is not a
  // picture can reach public/.
  const pipeline = round
    ? sharp(bytes).resize(width, width, { fit: 'cover' })
    : sharp(bytes).resize({ width, withoutEnlargement: true });

  const file = join(mediaDir, `${name}.webp`);
  const info = await pipeline.webp({ quality: 82 }).toFile(file);
  if (!round) {
    // Phones show a photo 370–393px wide, so the 1200px file alone was roughly
    // twice the pixels any small screen used. Posts.astro picks by srcset.
    await sharp(bytes)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(file.replace(/\.webp$/, '@800.webp'));
  }
  return { src: `/posts/${name}.webp`, width: info.width, height: info.height };
}

mkdirSync(mediaDir, { recursive: true });

/**
 * What is already on the wall, so a bad day cannot take a post off it.
 *
 * A fetch can fail for two very different reasons and they deserve opposite
 * treatment: a post DELETED on X should leave, but a rate limit or a
 * five-hundred should change nothing.
 */
const alreadyOnTheWall = new Map(COMMITTED.map((card) => [card.url, card]));

const cards = [];
let failed = 0;
/** Posts X says are gone for good. These are meant to leave the wall. */
let dropped = 0;

for (const url of TWEET_URLS) {
  const match = POST_URL.exec(url);
  if (!match) {
    console.warn(`Skipping, not a post URL: ${url}`);
    continue;
  }
  const id = match[2];

  try {
    const endpoint = new URL('https://cdn.syndication.twimg.com/tweet-result');
    endpoint.searchParams.set('id', id);
    endpoint.searchParams.set('lang', 'en');
    // The endpoint wants the parameter present; its value is not checked.
    endpoint.searchParams.set('token', 'a');

    const response = await fetch(endpoint, {
      headers: { accept: 'application/json', 'user-agent': BROWSER_UA },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) {
      const error = new Error(String(response.status));
      error.status = response.status;
      throw error;
    }
    const body = await response.json();

    // `display_text_range` is where the post itself ends and the media
    // shortlink X appends begins. Without it every card ends in a t.co URL.
    const range = Array.isArray(body.display_text_range) ? body.display_text_range : null;
    const raw = String(body.text ?? '');
    const text = clean(range ? raw.slice(range[0], range[1]) : raw);

    const photos = [];
    for (const [index, photo] of (body.photos ?? []).slice(0, MAX_PHOTOS).entries()) {
      photos.push(await saveImage(photo.url, `${id}-${index + 1}`, PHOTO_WIDTH));
    }

    if (!text && photos.length === 0) throw new Error('no text and no picture');

    let avatar;
    const avatarUrl = body.user?.profile_image_url_https;
    if (typeof avatarUrl === 'string') {
      try {
        // `_normal` is the 48px thumbnail. Ask for the full one and let sharp
        // size it, so it stays sharp on a retina screen.
        const full = avatarUrl.replace(/_(normal|bigger|mini)\.(jpg|jpeg|png|webp)$/i, '.$2');
        avatar = (await saveImage(full, `${id}-avatar`, AVATAR_SIZE, { round: true })).src;
      } catch {
        // A missing avatar is cosmetic; the card reads fine without one.
      }
    }

    cards.push({
      text,
      authorName: String(body.user?.name ?? '').slice(0, 80),
      authorHandle: String(body.user?.screen_name ?? '').slice(0, 15),
      avatar,
      postedAt: String(body.created_at ?? '').slice(0, 10),
      photos,
      url,
    });
    process.stdout.write(`  ✓ ${id}${photos.length ? ` (+${photos.length} image)` : ''}\n`);
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
 * TWEET_URLS by hand.
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
const header = previous.slice(0, previous.indexOf('export interface TweetCard'));

await writeConfig(
  output,
  `${header}export interface TweetCardPhoto {
  src: string;
  width: number;
  height: number;
}

export interface TweetCard {
  text: string;
  authorName: string;
  /** Without the @. */
  authorHandle: string;
  /** Served from our own origin, or absent when it could not be fetched. */
  avatar?: string;
  /** YYYY-MM-DD. */
  postedAt: string;
  photos: TweetCardPhoto[];
  url: string;
}

export const TWEET_CARDS: TweetCard[] = ${JSON.stringify(cards, null, 2)};\n`,
);
console.warn(`\n${cards.length} posts written${failed ? `, ${failed} failed` : ''}`);
