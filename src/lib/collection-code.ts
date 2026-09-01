/**
 * Moving a coin collection between browsers.
 *
 * What somebody has pulled lives in their own browser's `localStorage`, which
 * means a cleared cache or a new phone destroys it. This turns a collection
 * into a short string they can copy anywhere — a note, a message to
 * themselves — and paste back in.
 *
 * A copied string rather than a downloaded file, deliberately: the site has no
 * file input and no upload anywhere, and a text field keeps it that way. It
 * also survives being sent between devices by any means at all.
 *
 * SECURITY: a pasted code is untrusted input from outside. Every slug in it is
 * checked against the real coin list, everything unrecognised is dropped, and
 * the counters are clamped. The worst a hostile code can do is give somebody a
 * collection they did not earn, which is a game with no prize.
 */
import { COINS } from '../config/coins.ts';

/** Bumped only if the shape changes in a way old codes cannot satisfy. */
const VERSION = 1;

export interface Collection {
  found: string[];
  sinceRare: number;
  sinceLegendary: number;
}

/** Pity counters cannot sensibly exceed the pool. */
const MAX_COUNTER = 1000;

/**
 * Slugs rather than a bitmap of positions.
 *
 * A bitmap would be far shorter, but it would be read against whatever coin
 * order the build happens to have — so adding artwork would silently turn
 * everybody's collection into a different set of coins. Names cannot do that.
 */
export function encodeCollection(collection: Collection): string {
  const payload = {
    v: VERSION,
    f: collection.found,
    r: collection.sinceRare,
    l: collection.sinceLegendary,
  };
  // btoa is Latin-1 only. Slugs are ASCII today, but going through UTF-8
  // bytes keeps this correct if one ever is not.
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return btoa(String.fromCharCode(...bytes));
}

/** Returns null for anything that is not a code this version understands. */
export function decodeCollection(code: string): Collection | null {
  let parsed: unknown;
  try {
    const binary = atob(code.trim());
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;
  const payload = parsed as Record<string, unknown>;
  if (payload.v !== VERSION) return null;
  if (!Array.isArray(payload.f)) return null;

  // Allowlisted against the real pool. A code naming a coin that does not
  // exist is not an error worth reporting — that coin simply is not counted.
  const real = new Set(COINS.map((coin) => coin.slug));
  const found = [
    ...new Set(payload.f.filter((s): s is string => typeof s === 'string' && real.has(s))),
  ];

  const counter = (value: unknown) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? Math.min(Math.floor(n), MAX_COUNTER) : 0;
  };

  return { found, sinceRare: counter(payload.r), sinceLegendary: counter(payload.l) };
}
