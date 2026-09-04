/**
 * Checks the roadmap says only what it is allowed to say.
 *
 * The page carries four terms — no dates on unshipped work, no price, no
 * partnership before it exists, nothing that wants your wallet. Three of those
 * are judgement. The rest are mechanical, and a rule nothing enforces is a rule
 * that lasts until the first busy afternoon.
 *
 * Run with `npm run roadmap`. It is part of `npm run check`.
 */
import { ROADMAP, ROADMAP_TRACKS } from '../src/config/roadmap.ts';

const problems = [];

/** Words that only ever appear on a roadmap to imply a return. */
const FORBIDDEN = [
  /\bmarket cap\b/i,
  /\bprice target\b/i,
  /\bmoon\b/i,
  /\b\d+x\b/i,
  /\bguarantee/i,
  /\bpartnership with\b/i,
  /\blisting on\b/i,
];

for (const item of ROADMAP) {
  const where = `"${item.title}"`;

  if (!ROADMAP_TRACKS.includes(item.track)) {
    problems.push(`${where}: track "${item.track}" is not one of ${ROADMAP_TRACKS.join(', ')}`);
  }

  if (item.status === 'shipped') {
    // A shipped claim with no date is undated history, and one with nothing to
    // open is a claim the reader has to take on faith — the thing this site
    // exists not to ask for.
    if (!item.date) problems.push(`${where}: shipped with no date`);
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date)) {
      problems.push(`${where}: date "${item.date}" is not YYYY-MM-DD`);
    }
    if (item.needs) problems.push(`${where}: shipped, so it is not waiting on anything`);
    if (item.signal) problems.push(`${where}: shipped, so "done when" is already answered`);
  } else {
    if (item.date) {
      problems.push(
        `${where}: carries a date but has not shipped — the one thing the page promises not to do`,
      );
    }
    if (!item.needs) problems.push(`${where}: unshipped with nothing recorded under "waiting on"`);
    if (!item.signal) problems.push(`${where}: unshipped with no condition for being done`);
  }

  for (const pattern of FORBIDDEN) {
    if (pattern.test(`${item.title} ${item.body} ${item.needs ?? ''} ${item.signal ?? ''}`)) {
      problems.push(
        `${where}: says something matching ${pattern} — the roadmap does not talk about returns`,
      );
    }
  }
}

/**
 * Where a shipped item may open. Same list check-docs keeps, plus the landing
 * page and its anchors. An href that matches nothing here is a link to a 404
 * that nothing else would ever notice.
 */
const ROUTE = /^(\/|\/(stats|holdings|ask|ask\/day|pfp|memes|brand|roadmap|docs)\/)(#[a-z0-9-]+)?$/;
for (const item of ROADMAP) {
  if (item.href && !ROUTE.test(item.href)) {
    problems.push(`"${item.title}": href "${item.href}" is not a page this site builds`);
  }
}

const titles = ROADMAP.map((item) => item.title);
for (const title of new Set(titles)) {
  if (titles.filter((other) => other === title).length > 1) {
    problems.push(`"${title}": listed more than once`);
  }
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) on the roadmap:\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

const shipped = ROADMAP.filter((item) => item.status === 'shipped').length;
console.warn(
  `${ROADMAP.length} roadmap items checked (${shipped} shipped). Every one tracked, dated only where it happened, and nothing promising a return.`,
);
