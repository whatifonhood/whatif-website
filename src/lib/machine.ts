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
  /**
   * Set for coins without local history.
   *
   * These are the long tail — every other coin CoinGecko lists. Their prices are
   * fetched live when picked, and the free listing only reaches back a year, so
   * the page says so rather than pretending the series is complete.
   */
  coingeckoId?: string;
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

let tailPromise: Promise<CoinEntry[]> | null = null;

/**
 * The long tail: everything CoinGecko lists that we do not ship history for.
 *
 * Roughly eighteen thousand coins, so it is a separate file fetched only when
 * somebody searches past the ones we hold locally — the common case never pays
 * for it.
 */
function getTailIndex(): Promise<CoinEntry[]> {
  tailPromise ??= fetchLocalJson('/machine/all.json')
    .then((body) => {
      if (!Array.isArray(body)) return [];
      return body.flatMap((row): CoinEntry[] => {
        if (!Array.isArray(row) || row.length < 3) return [];
        const [symbol, name, id] = row;
        if (typeof symbol !== 'string' || typeof name !== 'string' || typeof id !== 'string') {
          return [];
        }
        // Ranked last so coins with deep history always win a tie.
        return [{ symbol, name, rank: 99_999, firstMonth: '', coingeckoId: id }];
      });
    })
    .catch(() => []);
  return tailPromise;
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

/**
 * A year of daily prices, straight from CoinGecko.
 *
 * Used for coins we do not ship history for. The endpoint is keyless and sends
 * an open CORS header, so the browser can ask for it directly — no key to leak
 * and no server to run. The free listing caps at 365 days, which is why these
 * coins offer a shorter window than the ones held locally.
 */
async function fetchLiveHistory(coingeckoId: string): Promise<PricePoint[]> {
  // The id comes from our own listing, never from typed input, but it goes into
  // a URL so it is checked against the shape CoinGecko uses anyway.
  if (!/^[a-z0-9-]{1,80}$/.test(coingeckoId)) return [];

  const body = await fetchLocalJson(
    `https://api.coingecko.com/api/v3/coins/${coingeckoId}/market_chart?vs_currency=usd&days=365&interval=daily`,
  );
  if (typeof body !== 'object' || body === null) return [];
  const prices = (body as { prices?: unknown }).prices;
  if (!Array.isArray(prices)) return [];

  const byDay = new Map<string, number>();
  for (const row of prices) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const [ms, price] = row;
    if (typeof ms !== 'number' || typeof price !== 'number' || !(price > 0)) continue;
    byDay.set(new Date(ms).toISOString().slice(0, 10), price);
  }
  return [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

/** One coin's prices, from disk where we have them and from CoinGecko where we do not. */
export async function getCoinHistory(symbol: string, coingeckoId?: string): Promise<PricePoint[]> {
  // Keyed on the id that actually identifies the coin, not the ticker: the
  // long-tail listing has 2,082 duplicated tickers, so "MEOW" alone matches
  // eight different coins. Keying on the symbol meant clicking the second one
  // showed the first one's prices under the second one's name — including on
  // the downloadable share card.
  const key = coingeckoId ?? symbol;
  const cached = historyCache.get(key);
  if (cached) return cached;

  if (coingeckoId) {
    const live = await fetchLiveHistory(coingeckoId).catch(() => []);
    if (live.length >= 2) historyCache.set(key, live);
    return live;
  }

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

  historyCache.set(key, points);
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

/**
 * Search everything, falling through to the long tail.
 *
 * The local set answers instantly and covers what most people ask for. Only when
 * it cannot fill the list does the eighteen-thousand-coin file get loaded, so
 * the usual search never waits for it.
 */
export async function searchAllCoins(
  local: CoinEntry[],
  query: string,
  limit = 8,
): Promise<CoinEntry[]> {
  const found = searchCoins(local, query, limit);
  if (found.length >= limit || query.trim().length < 2) return found;

  const tail = await getTailIndex();
  const seen = new Set(found.map((coin) => coin.symbol));
  const extra = searchCoins(tail, query, limit).filter((coin) => !seen.has(coin.symbol));
  return [...found, ...extra].slice(0, limit);
}
