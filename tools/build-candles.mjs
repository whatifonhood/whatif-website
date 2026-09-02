/**
 * Commits the chart's candles, so the dashboard always has something to draw.
 *
 * GeckoTerminal rate-limits hard and, worse, its 429 carries no CORS headers at
 * all — so in a browser a refusal is indistinguishable from a dead network, the
 * status is unreadable, and no amount of client-side backoff can even detect
 * it. Measured from one machine, three of four requests came back 429. That is
 * what made the chart's timeframe buttons look broken: the click fired, the
 * fetch was blocked, and the chart kept the candles it already had.
 *
 * So the candles ship with the site. The chart draws them instantly, every
 * timeframe, with no network at all; a live fetch still runs and replaces them
 * when it succeeds. Same approach the burn history already takes, and for the
 * same reason: freshness comes from rebuilding.
 *
 * Run with `npm run candles`. It is part of the daily refresh.
 */
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TOKEN } from '../src/config/site.ts';
import { writeConfig } from './lib/write-config.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pool = TOKEN.primaryPool.toLowerCase();
const base = `https://api.geckoterminal.com/api/v2/networks/robinhood/pools/${pool}/ohlcv`;

/** Exactly what src/lib/market.ts asks for, so the committed data matches. */
const TIMEFRAMES = {
  day: 'hour?aggregate=1&limit=24',
  week: 'hour?aggregate=4&limit=42',
  month: 'day?aggregate=1&limit=30',
  quarter: 'day?aggregate=1&limit=90',
  all: 'day?aggregate=1&limit=1000',
};

/** Long enough that the next call is not refused for being too soon. */
const PACE_MS = 2500;
const ATTEMPTS = 6;

const wait = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * One timeframe, retried through the rate limit.
 *
 * Here the 429 is readable — it is only in a browser that the missing CORS
 * header hides it — so this can back off properly instead of guessing.
 */
async function fetchCandles(name, query) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    const response = await fetch(`${base}/${query}`, {
      headers: { accept: 'application/json' },
    });

    if (response.status === 429) {
      const backoff = PACE_MS * 2 ** (attempt - 1);
      process.stdout.write(`  ${name}: 429, waiting ${backoff / 1000}s\n`);
      await wait(backoff);
      continue;
    }
    if (!response.ok) throw new Error(`${name}: responded ${response.status}`);

    const body = await response.json();
    const list = body?.data?.attributes?.ohlcv_list;
    if (!Array.isArray(list)) throw new Error(`${name}: no ohlcv_list in the response`);

    // [time, open, high, low, close, volume], oldest last from the API. The
    // site reverses on read, so store exactly what the API returned and let one
    // place own the ordering.
    const rows = list
      .filter((row) => Array.isArray(row) && row.length >= 6)
      .map((row) => row.map(Number))
      .filter((row) => row.slice(0, 5).every((value) => Number.isFinite(value) && value > 0));

    if (rows.length < 2) throw new Error(`${name}: only ${rows.length} usable candles`);
    return rows;
  }
  throw new Error(`${name}: still rate limited after ${ATTEMPTS} attempts`);
}

const out = {};
for (const [name, query] of Object.entries(TIMEFRAMES)) {
  out[name] = await fetchCandles(name, query);
  process.stdout.write(`  ${name.padEnd(8)} ${out[name].length} candles\n`);
  await wait(PACE_MS);
}

// Through writeConfig so the file it writes is already in the repo's Prettier
// style; otherwise every refresh would leave `npm run format:check` failing on
// a file the generator had just produced.
await writeConfig(join(root, 'src', 'data', 'candles.json'), JSON.stringify(out));
process.stdout.write(
  `${Object.values(out).reduce((sum, rows) => sum + rows.length, 0)} candles written to src/data/candles.json\n`,
);
