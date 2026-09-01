/**
 * Writes the full CoinGecko listing to public/machine/all.json.
 *
 * The Machine ships deep history for the top few hundred coins (see
 * build-coin-history.mjs). This is the long tail: every other coin CoinGecko
 * knows about, searchable, with its history fetched live when somebody actually
 * picks one.
 *
 * Only id, symbol and name are kept — the file is loaded by the browser and the
 * rest of the listing is dead weight. Coins that already have local history are
 * left out entirely, because those are answered from disk.
 *
 * Run with `npm run coinlist`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = join(root, 'public', 'machine');

const response = await fetch('https://api.coingecko.com/api/v3/coins/list', {
  headers: { accept: 'application/json' },
  signal: AbortSignal.timeout(60_000),
});
if (!response.ok) throw new Error(`CoinGecko responded ${response.status}`);
const listing = await response.json();

// Whatever already has deep history locally is answered from disk, so it does
// not need to be in the long-tail list as well.
const local = new Set(
  JSON.parse(readFileSync(join(outDir, 'index.json'), 'utf8')).coins.map((c) => c.s.toUpperCase()),
);

const rows = [];
for (const coin of listing) {
  const symbol = String(coin.symbol ?? '').toUpperCase();
  const name = String(coin.name ?? '');
  const id = String(coin.id ?? '');
  if (!symbol || !name || !id) continue;
  if (local.has(symbol)) continue;
  // Tuples rather than objects: the same data, about a third of the bytes.
  rows.push([symbol, name, id]);
}

writeFileSync(join(outDir, 'all.json'), JSON.stringify(rows));
const kb = Math.round(JSON.stringify(rows).length / 1024);
process.stdout.write(
  `${rows.length} more coins written (${kb} KB), on top of ${local.size} with deep history\n`,
);
