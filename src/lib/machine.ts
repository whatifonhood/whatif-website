/**
 * The dataset behind the What $IF Machine.
 *
 * Both files are static, generated at build time by tools/build-coin-history.mjs
 * and served from this origin: the page makes no third-party request, cannot be
 * rate-limited, and works with the network flaky.
 */

export interface CoinEntry {
  /** Ticker, e.g. DOGE. Also the history and logo file name. */
  symbol: string;
  name: string;
  /** Market-cap rank at build time; used to order search results. */
  rank: number;
  /** First month with a price, "YYYY-MM". */
  firstMonth: string;
}

/** [month, closing price in USD], oldest first. */
export type PricePoint = [string, number];

let indexPromise: Promise<CoinEntry[]> | null = null;
const historyCache = new Map<string, PricePoint[]>();

async function fetchLocalJson(path: string): Promise<unknown> {
  const response = await fetch(path, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`${path} -> ${response.status}`);
  return response.json();
}

/** The searchable list. Fetched once, then reused. */
export function getCoinIndex(): Promise<CoinEntry[]> {
  indexPromise ??= fetchLocalJson('/machine/index.json').then((body) => {
    if (typeof body !== 'object' || body === null) return [];
    const coins = (body as { coins?: unknown }).coins;
    if (!Array.isArray(coins)) return [];

    return coins.flatMap((entry): CoinEntry[] => {
      if (typeof entry !== 'object' || entry === null) return [];
      const { s, n, r, f } = entry as Record<string, unknown>;
      if (typeof s !== 'string' || typeof n !== 'string' || typeof f !== 'string') return [];
      return [{ symbol: s, name: n, rank: typeof r === 'number' ? r : 9999, firstMonth: f }];
    });
  });
  return indexPromise;
}

/** One coin's monthly prices. */
export async function getCoinHistory(symbol: string): Promise<PricePoint[]> {
  const cached = historyCache.get(symbol);
  if (cached) return cached;

  // The symbol comes from our own index, never from user input, but it goes
  // into a URL — so it is checked against the shape we generate anyway.
  if (!/^[A-Z0-9]{1,15}$/.test(symbol)) return [];

  const body = await fetchLocalJson(`/machine/h/${symbol}.json`);
  if (!Array.isArray(body)) return [];

  const points = body.flatMap((row): PricePoint[] => {
    if (!Array.isArray(row) || row.length < 2) return [];
    const [month, price] = row;
    if (typeof month !== 'string' || typeof price !== 'number' || !(price > 0)) return [];
    return [[month, price]];
  });

  historyCache.set(symbol, points);
  return points;
}

/**
 * Strips everything that is not a letter or a digit.
 *
 * Names in this set are full of punctuation — "What $IF", "yearn.finance",
 * "0x". Somebody typing "what if" should find "What $IF", and without this they
 * do not, because the dollar sign sits in the middle of the word.
 */
function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Ranks matches: exact ticker first, then name starts-with, then contains. */
export function searchCoins(coins: CoinEntry[], query: string, limit = 8): CoinEntry[] {
  const raw = query.trim().toLowerCase();
  if (raw === '') return coins.slice(0, limit);
  const needle = normalise(raw);
  if (needle === '') return coins.slice(0, limit);

  const scored = coins
    .map((coin) => {
      const symbol = normalise(coin.symbol);
      const name = normalise(coin.name);
      let score = -1;
      if (symbol === needle) score = 0;
      else if (name === needle) score = 1;
      else if (symbol.startsWith(needle)) score = 2;
      else if (name.startsWith(needle)) score = 3;
      else if (name.includes(needle)) score = 4;
      else if (symbol.includes(needle)) score = 5;
      return { coin, score };
    })
    .filter((entry) => entry.score >= 0);

  scored.sort((a, b) => a.score - b.score || a.coin.rank - b.coin.rank);
  return scored.slice(0, limit).map((entry) => entry.coin);
}
