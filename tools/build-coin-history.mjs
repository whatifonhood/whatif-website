/**
 * Builds the coin dataset the What $IF Machine runs on.
 *
 * Sources, in the order they are tried per coin:
 *  1. Binance monthly closes — keyless and goes back years, which is what makes
 *     "what if you had bought in 2019" answerable at all.
 *  2. CoinGecko daily closes — needs the key in .env, and a free key only
 *     reaches back 365 days, but it covers coins no major exchange lists, which
 *     is most memecoins.
 *
 * So Binance provides the depth and CoinGecko provides the breadth. Names, ranks
 * and logos always come from CoinGecko, which needs no key for those.
 *
 * The key is read here, at build time, and never reaches the browser — the site
 * itself still runs with no environment variables at all.
 *
 * Output, all committed to the repo so the page needs no API at runtime:
 *  public/machine/index.json      the searchable list (small, loaded once)
 *  public/machine/h/<SYMBOL>.json one coin's monthly prices, loaded on demand
 *  public/machine/logos/<SYMBOL>.webp
 *
 * Refresh with `npm run history`.
 */
import { execFileSync } from 'node:child_process';

import { TOKEN } from '../src/config/site.ts';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = join(root, 'public', 'machine');

/** Reads .env without a dependency; it holds one optional key. */
function readEnv() {
  const file = resolve(here, '..', '.env');
  const values = { ...process.env };
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match) values[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
  return values;
}

const env = readEnv();
const COINGECKO_KEY = (env.COINGECKO_API_KEY || '').trim();
const COINGECKO_PRO = (env.COINGECKO_PLAN || 'demo').trim() === 'pro';
const COINGECKO_BASE = COINGECKO_PRO
  ? 'https://pro-api.coingecko.com/api/v3'
  : 'https://api.coingecko.com/api/v3';
const COINGECKO_HEADERS = COINGECKO_KEY
  ? { [COINGECKO_PRO ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key']: COINGECKO_KEY }
  : {};

/** How many coins to include, ordered by how much they actually trade. */
const MAX_COINS = Number(env.MACHINE_COIN_COUNT) || 1500;
const MIN_QUOTE_VOLUME_USD = 300_000;
/** A coin needs enough history for the question to be interesting. */
const MIN_MONTHS = 6;

/**
 * Coins there is no point regretting.
 *
 * Stablecoins are always 1x, and wrapped or staked wrappers just mirror the
 * asset they wrap — offering them makes the tool look broken.
 */
const SKIP = new Set([
  'USDT',
  'USDC',
  'DAI',
  'USDS',
  'USD1',
  'USDE',
  'USDG',
  'FDUSD',
  'BUSD',
  'TUSD',
  'PYUSD',
  'RLUSD',
  'USDD',
  'FRAX',
  'LUSD',
  'EURI',
  'EURC',
  'XUSD',
  'BFUSD',
  'USDF',
  'WBTC',
  'WETH',
  'WBETH',
  'WEETH',
  'STETH',
  'WSTETH',
  'RETH',
  'CBBTC',
  'SOLVBTC',
  'LBTC',
  'BSC-USD',
  'BUIDL',
  'WBT',
  'JITOSOL',
  'MSOL',
  'BNSOL',
  'RSETH',
  'EZETH',
  'PAXG',
  'XAUT',
]);

/** Anything whose whole history sits within a couple of percent of $1. */
function looksLikeAStablecoin(points) {
  const prices = points.map(([, price]) => price);
  return prices.every((price) => price > 0.94 && price < 1.06);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, attempt = 1, headers = {}) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  if (response.status === 429 && attempt <= 4) {
    await sleep(4000 * attempt);
    return getJson(url, attempt + 1, headers);
  }
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return response.json();
}

process.stdout.write(
  COINGECKO_KEY
    ? `Using a CoinGecko ${COINGECKO_PRO ? 'pro' : 'demo'} key — history comes from CoinGecko.\n`
    : 'No CoinGecko key in .env — history comes from Binance, which limits the set to coins it lists.\n',
);
process.stdout.write('Reading CoinGecko for names, ranks and logos…\n');
const meta = new Map();
for (const page of [1, 2, 3, 4]) {
  const rows = await getJson(
    `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}`,
    1,
    COINGECKO_HEADERS,
  );
  for (const row of rows) {
    const symbol = String(row.symbol).toUpperCase();
    // Keep the highest-ranked coin for a symbol; symbols are not unique.
    if (!meta.has(symbol)) {
      meta.set(symbol, { id: row.id, name: row.name, image: row.image, rank: row.market_cap_rank });
    }
  }
  await sleep(2500);
}
process.stdout.write(`  ${meta.size} coins with metadata\n`);

process.stdout.write('Reading Binance for tradeable pairs…\n');
const binancePairs = new Map();
try {
  const tickers = await getJson('https://api.binance.com/api/v3/ticker/24hr');
  for (const ticker of tickers) {
    if (!ticker.symbol.endsWith('USDT')) continue;
    if (Number(ticker.quoteVolume) < MIN_QUOTE_VOLUME_USD) continue;
    binancePairs.set(ticker.symbol.slice(0, -4), ticker.symbol);
  }
} catch {
  process.stdout.write('  Binance unreachable; falling back to CoinGecko for everything.\n');
}
process.stdout.write(`  ${binancePairs.size} pairs with real volume\n`);

/** Top coins by market cap. Binance depth where it exists, CoinGecko elsewhere. */
const candidates = [...meta.entries()]
  .map(([symbol, info]) => ({
    symbol,
    id: info.id,
    rank: info.rank ?? 9999,
    pair: binancePairs.get(symbol),
  }))
  .filter((coin) => !SKIP.has(coin.symbol))
  .filter((coin) => coin.pair || COINGECKO_KEY)
  .sort((a, b) => a.rank - b.rank)
  .slice(0, MAX_COINS);
process.stdout.write(
  `  ${candidates.length} coins selected · ${candidates.filter((c) => c.pair).length} with deep history\n`,
);

// Clear only what this tool owns. public/machine also holds the character
// poses the share card draws, which are not generated here.
for (const owned of ['h', 'logos']) {
  rmSync(join(outDir, owned), { recursive: true, force: true });
}
rmSync(join(outDir, 'index.json'), { force: true });
mkdirSync(join(outDir, 'h'), { recursive: true });
mkdirSync(join(outDir, 'logos'), { recursive: true });

const monthKey = (ms) => new Date(ms).toISOString().slice(0, 7);
const index = [];

for (const [position, coin] of candidates.entries()) {
  let points = null;
  let usedCoinGecko = false;

  if (coin.pair) {
    try {
      const klines = await getJson(
        `https://api.binance.com/api/v3/klines?symbol=${coin.pair}&interval=1M&limit=200`,
      );
      points = klines
        .map((k) => [monthKey(k[0]), Number(k[4])])
        .filter(([, price]) => Number.isFinite(price) && price > 0);
    } catch {
      points = null;
    }
  }

  // A free CoinGecko key only reaches back 365 days, so it is the fallback for
  // coins no exchange we can read lists — better than not offering them at all.
  if ((!points || points.length < MIN_MONTHS) && COINGECKO_KEY) {
    try {
      const chart = await getJson(
        `${COINGECKO_BASE}/coins/${coin.id}/market_chart?vs_currency=usd&days=365&interval=daily`,
        1,
        COINGECKO_HEADERS,
      );
      const byMonth = new Map();
      for (const [ms, price] of chart.prices ?? []) {
        if (Number.isFinite(price) && price > 0) byMonth.set(monthKey(ms), price);
      }
      points = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      usedCoinGecko = true;
    } catch {
      // Leave whatever Binance gave us, if anything.
    }
  }

  if (!points || points.length < MIN_MONTHS) continue;
  if (looksLikeAStablecoin(points)) continue;

  const info = meta.get(coin.symbol);
  writeFileSync(join(outDir, 'h', `${coin.symbol}.json`), JSON.stringify(points));

  // Logos are downloaded, never hotlinked — the site serves its own images.
  try {
    const image = await fetch(info.image, { signal: AbortSignal.timeout(20_000) });
    if (image.ok) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const temp = join(outDir, 'logos', `${coin.symbol}.tmp`);
      writeFileSync(temp, buffer);
      execFileSync('magick', [
        temp,
        '-resize',
        '64x64',
        '-quality',
        '80',
        '-strip',
        join(outDir, 'logos', `${coin.symbol}.webp`),
      ]);
      rmSync(temp, { force: true });
    }
  } catch {
    // A missing logo is cosmetic; the coin still works.
  }

  index.push({
    s: coin.symbol,
    n: info.name,
    r: info.rank ?? 9999,
    f: points[0][0],
  });

  process.stdout.write(`\r  ${position + 1}/${candidates.length} ${coin.symbol.padEnd(10)}`);
  // Only CoinGecko calls need pacing; the free tier allows 30 a minute.
  await sleep(usedCoinGecko ? (COINGECKO_PRO ? 200 : 2200) : 120);
}

/**
 * $IF itself.
 *
 * The whole site asks "what if you had bought earlier", so the one coin it must
 * be able to answer that about is this one. It is not on any exchange the loop
 * above reads, so it comes straight from its own pool.
 *
 * It is also too young for monthly points — two of them would be useless — so
 * this writes DAILY points. The key shape "YYYY-MM-DD" is understood alongside
 * "YYYY-MM" everywhere the dataset is read.
 */
try {
  process.stdout.write('\nReading $IF from its own pool…\n');
  const pool = TOKEN.primaryPool.toLowerCase();
  const body = await getJson(
    `https://api.geckoterminal.com/api/v2/networks/robinhood/pools/${pool}/ohlcv/day?aggregate=1&limit=1000`,
  );

  const rows = body?.data?.attributes?.ohlcv_list ?? [];
  const points = rows
    .map((row) => [new Date(Number(row[0]) * 1000).toISOString().slice(0, 10), Number(row[4])])
    .filter(([, price]) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a[0].localeCompare(b[0]));

  if (points.length >= 2) {
    writeFileSync(join(outDir, 'h', `${TOKEN.symbol}.json`), JSON.stringify(points));
    // Rank 0 so it sorts to the top of an empty search box.
    index.push({ s: TOKEN.symbol, n: 'What $IF', r: 0, f: points[0][0] });

    // Its logo is already in the repo; the coin master is the same mark.
    execFileSync('magick', [
      join(root, 'public', 'favicon-192.png'),
      '-resize',
      '64x64',
      '-quality',
      '80',
      '-strip',
      join(outDir, 'logos', `${TOKEN.symbol}.webp`),
    ]);
    process.stdout.write(`  ${points.length} daily points, from ${points[0][0]}\n`);
  } else {
    process.stdout.write('  not enough history yet; skipped\n');
  }
} catch (error) {
  process.stdout.write(`  could not read the $IF pool: ${error.message}\n`);
}

index.sort((a, b) => a.r - b.r);
writeFileSync(
  join(outDir, 'index.json'),
  JSON.stringify({ captured: new Date().toISOString().slice(0, 10), coins: index }),
);

writeFileSync(
  join(root, 'src', 'config', 'coin-history.ts'),
  `// Generated by tools/build-coin-history.mjs — do not edit by hand.
// The dataset itself lives in public/machine/ and is fetched by the page;
// this file records only what the build produced.

export const HISTORY_CAPTURED = '${new Date().toISOString().slice(0, 10)}';
export const HISTORY_COIN_COUNT = ${index.length};
`,
);

process.stdout.write(`\n${index.length} coins written to public/machine\n`);
