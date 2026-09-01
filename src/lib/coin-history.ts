/**
 * Reads the Machine's committed price history at build time.
 *
 * The histories are plain JSON in `public/machine/h/`, written by
 * `tools/build-coin-history.mjs` and checked by `tools/check-machine.mjs`.
 * Pages read them straight off disk so a coin page is fully rendered in the
 * HTML — no fetch, no spinner, and a crawler sees the real numbers.
 *
 * This module only runs during the build. Nothing here reaches the browser.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const HISTORY_DIR = join(process.cwd(), 'public', 'machine', 'h');
const INDEX_FILE = join(process.cwd(), 'public', 'machine', 'index.json');

/** `["2024-03", 0.1612]` — the month, and the price in USD at its close. */
export type PricePoint = [string, number];

export type MachineCoin = {
  symbol: string;
  name: string;
  /** Market-cap rank when the index was built. Lower is bigger. */
  rank: number;
  /** The first month with a price. */
  from: string;
};

type RawCoin = { s: string; n: string; r: number; f: string };

/**
 * Coins worth a page of their own.
 *
 * A coin needs enough history for the "what if you had bought N years ago"
 * table to say anything; below a year there is one row and no story.
 */
export const MIN_MONTHS_FOR_PAGE = 12;

let cachedCoins: MachineCoin[] | undefined;

/** Every coin in the Machine, biggest first. */
export function machineCoins(): MachineCoin[] {
  if (cachedCoins) return cachedCoins;
  const raw = JSON.parse(readFileSync(INDEX_FILE, 'utf8')) as { coins: RawCoin[] };
  cachedCoins = raw.coins
    .map((coin) => ({ symbol: coin.s, name: coin.n, rank: coin.r, from: coin.f }))
    .sort((a, b) => a.rank - b.rank);
  return cachedCoins;
}

/** One coin's history, or undefined if it has no file. */
export function coinHistory(symbol: string): PricePoint[] | undefined {
  // The symbol comes from our own index, never from a request, but this is the
  // one place a name becomes a path — so it is checked anyway.
  if (!/^[\w$.-]{1,24}$/.test(symbol)) return undefined;
  const file = join(HISTORY_DIR, `${symbol}.json`);
  if (!existsSync(file)) return undefined;
  return JSON.parse(readFileSync(file, 'utf8')) as PricePoint[];
}

/** What $1 put in at `then` would be worth at `now`. */
export function multiple(then: number, now: number): number {
  return now / then;
}

export type Row = {
  /** How far back, in months. */
  months: number;
  month: string;
  price: number;
  value: number;
  multiple: number;
};

/**
 * The "what if you had bought N years ago" table.
 *
 * Anchored to whole years plus the very first month the coin traded, and
 * skipping any anchor older than the history — a row the data cannot support
 * is left out rather than filled in.
 */
export function returnsTable(history: PricePoint[], amount: number): Row[] {
  const latest = history.at(-1);
  if (!latest) return [];
  const now = latest[1];

  // A clean yearly ladder — one row per year back, as far as the data goes.
  const wanted = [12, 24, 36, 48, 60, 72, 84, 96, 108, 120];
  const rows: Row[] = [];
  const seen = new Set<string>();

  const add = (index: number, months: number) => {
    const point = history[index];
    if (!point || seen.has(point[0])) return;
    seen.add(point[0]);
    rows.push({
      months,
      month: point[0],
      price: point[1],
      value: (amount / point[1]) * now,
      multiple: multiple(point[1], now),
    });
  };

  for (const months of wanted) {
    const index = history.length - 1 - months;
    if (index >= 0) add(index, months);
  }
  // Always offer the beginning, however long ago that is.
  add(0, history.length - 1);

  return rows.sort((a, b) => a.months - b.months);
}
