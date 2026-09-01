/**
 * Re-applies the history cleaner to the price files already committed.
 *
 * The rules in `build-coin-history.mjs` get sharper each time a bad number is
 * found, and the histories on disk took hundreds of API calls to fetch. This
 * re-cleans what is already there instead of downloading it all again.
 *
 * A coin whose history no longer survives the cleaner is removed from the
 * Machine, file and index both — a coin with a broken history is worse than a
 * coin that is not offered.
 *
 * Run with `npm run history:clean`.
 */
import { readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import { trimAtRedenomination } from './lib/history-rules.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const machineDir = join(root, 'public', 'machine');
const historyDir = join(machineDir, 'h');

const dropped = [];
let rewritten = 0;

for (const name of readdirSync(historyDir).filter((f) => f.endsWith('.json'))) {
  const symbol = name.replace(/\.json$/, '');
  const before = JSON.parse(readFileSync(join(historyDir, name), 'utf8'));
  const after = trimAtRedenomination(before);

  if (!after) {
    rmSync(join(historyDir, name));
    dropped.push(symbol);
    continue;
  }
  if (after.length === before.length) continue;

  writeFileSync(join(historyDir, name), JSON.stringify(after));
  rewritten += 1;
  console.warn(`  ${symbol}: kept ${after.length} of ${before.length} months`);
}

// The index has to forget the dropped coins too, or the page offers a coin
// whose history 404s.
if (dropped.length > 0) {
  const indexPath = join(machineDir, 'index.json');
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  index.coins = index.coins.filter((coin) => !dropped.includes(coin.s));
  writeFileSync(indexPath, JSON.stringify(index));

  const allPath = join(machineDir, 'all.json');
  const all = JSON.parse(readFileSync(allPath, 'utf8'));
  const remaining = Array.isArray(all) ? all : all.coins;
  const kept = remaining.filter((coin) => !dropped.includes(coin.s ?? coin.symbol));
  writeFileSync(allPath, JSON.stringify(Array.isArray(all) ? kept : { ...all, coins: kept }));

  console.warn(`  dropped entirely: ${dropped.join(', ')}`);
}

console.warn(`${rewritten} histories trimmed, ${dropped.length} coins dropped.`);
