/**
 * Reads every question the generator can produce, and checks each one.
 *
 * The browser test that used to do this pressed the button forty times, which
 * covered under 2% of the output and could only ever fail by luck. There are
 * only a couple of thousand possibilities, so there is no reason to sample:
 * this walks all of them in under a second.
 *
 * A combinatorial generator fails by writing sentences that are wrong, not by
 * throwing, so the rules below are the mistakes it has actually made. Add to
 * them whenever a bad sentence gets through; that is what stops it recurring.
 *
 * Run with `npm run questions`. It is part of `npm run check`.
 */
import { BANKS, LINES, PATTERNS, questionFromId } from '../src/config/what-if.ts';

/** Each rule gets a sentence and returns a complaint, or nothing. */
const RULES = [
  ['unfilled slot', (t) => /\{\w+\}/.test(t)],
  ['not a question', (t) => !t.endsWith('?')],
  ['spacing', (t) => / {2}| ,| \?/.test(t)],
  // Case-sensitive on purpose: "Okay but What if" is the bug.
  ['capitalised mid-sentence', (t) => /[a-z,] What if/.test(t)],
  ['contradiction', (t) => /(sold|held)[^?]*never sold/.test(t)],
  // The failure the generator was rebuilt to remove: two unrelated ideas
  // stapled together, which is grammatical and meaningless.
  ['two ideas', (t) => (t.match(/ and /g) ?? []).length > 1],
  ['too long', (t) => t.length > 105],
  ['agreement', (t) => /\b(we|they) was\b|\bI is\b|\beveryone were\b/.test(t)],
  ['double negative', (t) => /\bnobody\b[^?]*\bnever\b/.test(t)],
  ['doubled word', (t) => /\b(\w+) \1\b/i.test(t)],
];

/** Every id the generator can mint, in order. */
function* everyId() {
  for (let i = 0; i < LINES.length; i += 1) yield `l${i}`;

  for (const [index, pattern] of PATTERNS.entries()) {
    const banks = [...pattern.text.matchAll(/\{(\w+)\}/g)].map((m) => BANKS[m[1]] ?? []);
    // Odometer over the slots: every combination exactly once.
    const counters = banks.map(() => 0);
    for (;;) {
      yield `p${index}.${counters.join('.')}`;
      let slot = counters.length - 1;
      while (slot >= 0 && counters[slot] === banks[slot].length - 1) {
        counters[slot] = 0;
        slot -= 1;
      }
      if (slot < 0) break;
      counters[slot] += 1;
    }
  }
}

const problems = [];
const texts = new Map();
let checked = 0;

for (const id of everyId()) {
  const question = questionFromId(id);
  if (!question) {
    problems.push(`${id}: no question — the id scheme and the data disagree`);
    continue;
  }
  checked += 1;

  for (const [name, fails] of RULES) {
    if (fails(question.text)) problems.push(`${name}: ${question.text}  [${id}]`);
  }

  // Two ids producing the same sentence means the count on the page is a lie.
  const seen = texts.get(question.text);
  if (seen) problems.push(`duplicate of ${seen}: ${question.text}  [${id}]`);
  else texts.set(question.text, id);
}

if (problems.length > 0) {
  console.error(`${problems.length} problem(s) in ${checked} questions:\n`);
  for (const problem of problems.slice(0, 25)) console.error(`  ${problem}`);
  if (problems.length > 25) console.error(`  …and ${problems.length - 25} more`);
  process.exit(1);
}

console.warn(`${checked} questions checked against ${RULES.length} rules. All read correctly.`);
