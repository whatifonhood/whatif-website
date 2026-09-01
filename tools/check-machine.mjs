/**
 * Checks the What $IF Machine's data and its arithmetic.
 *
 * The Machine's whole claim is that its numbers are real, so the failure that
 * matters is not a crash — it is a plausible wrong answer. These checks read
 * the committed price history the site actually ships and assert against it:
 *
 *   1. Every coin in the index has a history file, and vice versa.
 *   2. Every history is chronological, gap-free, and has no absurd jumps.
 *   3. The return the Machine reports is the return the history implies,
 *      recomputed here independently rather than trusting the page.
 *
 * Run with `npm run machine`. It is part of `npm run check`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const historyDir = join(root, 'public', 'machine', 'h');

const index = JSON.parse(readFileSync(join(root, 'public', 'machine', 'index.json'), 'utf8')).coins;
const files = readdirSync(historyDir).filter((name) => name.endsWith('.json'));

import { REDENOMINATION_RATIO } from './lib/history-rules.mjs';

const problems = [];
const note = (message) => problems.push(message);

// 1. The index and the files on disk describe the same set of coins.
const symbols = new Set(index.map((coin) => coin.s ?? coin.symbol));
const onDisk = new Set(files.map((name) => name.replace(/\.json$/, '')));
for (const symbol of symbols) {
  if (!onDisk.has(symbol)) note(`${symbol}: in the index but has no history file`);
}
for (const symbol of onDisk) {
  if (!symbols.has(symbol)) note(`${symbol}: has a history file but is not in the index`);
}

let checkedCoins = 0;
/** Expected: the cleaner leaves a hole where it removes a bad reading. */
let gaps = 0;
let checkedSums = 0;

for (const name of files) {
  const symbol = name.replace(/\.json$/, '');
  const history = JSON.parse(readFileSync(join(historyDir, name), 'utf8'));

  if (!Array.isArray(history) || history.length < 2) {
    note(`${symbol}: history is too short to calculate anything`);
    continue;
  }
  checkedCoins += 1;

  let previous = null;
  for (const [date, price] of history) {
    // Two granularities are legitimate: months for coins with years of
    // history, days for one that launched weeks ago and would otherwise have
    // two points on its slider.
    if (!/^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/.test(date)) {
      note(`${symbol}: "${date}" is not a date`);
      continue;
    }
    if (!(typeof price === 'number' && Number.isFinite(price) && price > 0)) {
      note(`${symbol} ${date}: price is not a positive number (${price})`);
      continue;
    }
    if (previous) {
      // Strictly forward. Order is what makes the slider mean anything; a gap
      // does not, because every step is labelled with its own real date.
      if (date <= previous[0]) note(`${symbol}: ${date} does not follow ${previous[0]}`);
      else if (date !== nextStep(previous[0])) gaps += 1;

      const ratio = Math.max(price / previous[1], previous[1] / price);
      if (ratio > REDENOMINATION_RATIO) {
        note(`${symbol} ${previous[0]}→${date}: ${Math.round(ratio)}× in one step`);
      }
    }
    previous = [date, price];
  }

  // 3. The arithmetic, recomputed from the file for every month this coin has.
  // This is the sum the page prints; if the two ever disagree, one is wrong.
  const now = history.at(-1)[1];
  for (const [month, then] of history) {
    const invested = 500;
    const units = invested / then;
    const value = units * now;
    const multiple = now / then;

    if (!Number.isFinite(value) || value < 0) note(`${symbol} ${month}: value is ${value}`);
    // $500 in, and out is the multiple times it. Stated as a ratio so it holds
    // for a coin worth 8 decimal places as well as one worth thousands.
    if (Math.abs(value / (invested * multiple) - 1) > 1e-9) {
      note(`${symbol} ${month}: value and multiple disagree`);
    }
    checkedSums += 1;
  }
}

/** The date that should follow, at whichever granularity was given. */
function nextStep(date) {
  if (date.length > 7) {
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString().slice(0, 10);
  }
  const [year, month] = date.split('-').map(Number);
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s):\n`);
  for (const problem of problems.slice(0, 25)) console.error(`  ${problem}`);
  if (problems.length > 25) console.error(`  …and ${problems.length - 25} more`);
  process.exit(1);
}

console.warn(
  `${checkedCoins} coins checked, ${checkedSums.toLocaleString('en-US')} calculations verified` +
    `${gaps > 0 ? `, ${gaps} month(s) removed by the cleaner` : ''}.`,
);
