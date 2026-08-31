/**
 * The question generator.
 *
 * Patterns with slots, filled from word banks. Every pattern is written so that
 * any combination of its slots reads as a real sentence — the alternative, one
 * generic pattern with everything poured through it, produces nonsense about
 * nine times in ten.
 *
 * The total is computed from the banks rather than typed in, so the count on the
 * page is always true. Adding a word to a bank raises it automatically.
 *
 * Written in English only for now. Generating grammatical sentences by
 * combination in a language nobody here can check would produce confident
 * nonsense, so the interface is translated and the questions are not.
 */

/**
 * Slots where saying nothing should usually win.
 *
 * The opener and the tail are seasoning. Picked evenly they land on nearly
 * every question at once, which is how "3am thought. What if I say exactly the
 * wrong thing and nothing happens at all, and the answer changes nothing?"
 * happens. The value is the chance of leaving the slot empty.
 */
export const SPARSE_SLOTS: Record<string, number> = {
  opener: 0.74,
  tail: 0.62,
};

export const CATEGORIES = ['money', 'cosmic', 'dread', 'absurd', 'degen'] as const;
export type Category = (typeof CATEGORIES)[number];

/** Slot banks, referenced from patterns as {name}. */
export const BANKS: Record<string, string[]> = {
  /**
   * What comes before the question.
   *
   * The brand phrase itself never changes — this only sets the voice it is
   * asked in, and multiplies across every pattern.
   */
  opener: [
    '',
    'But ',
    'Okay but ',
    'Hear me out. ',
    'Seriously though. ',
    '3am thought. ',
    'Genuine question. ',
    'Nobody asked, but ',
  ],

  amount: [
    'my rent',
    'my lunch money',
    'the holiday fund',
    'a hundred quid',
    'my last fifty',
    'the car deposit',
    'everything I had',
    'my Christmas bonus',
    'the emergency fund',
    'a tenner',
  ],
  asset: [
    '$IF',
    'the one I laughed at',
    'the dog one',
    'the frog one',
    'the one with the terrible logo',
    'the thing everyone said was a scam',
    'literally anything',
    'the one I screenshotted and never bought',
    'the one with a cat on it',
    'the coin named after a typo',
    'whatever was trending that week',
    'the one my barber mentioned',
    'the ticker I could not pronounce',
    'the thing I called a bubble',
  ],
  when: [
    'at launch',
    'in 2013',
    'in 2017',
    'in 2021',
    'last Tuesday',
    'this morning',
    'the day I first heard about it',
    'when it was still funny',
    'before the group chat found it',
    'the week I nearly did',
    'back when it cost nothing',
    'the night I could not sleep',
  ],
  consequence: [
    'it ten-xed overnight',
    'it keeps going',
    'it doubles by Friday',
    'it never comes back',
    'that was the bottom',
    'everyone finds out',
    'nothing happens at all',
    'I have to explain it at Christmas',
    'the chart does the thing',
    'I am the last one holding',
    'it turns out I was early',
    'somebody screenshots it',
    'the group chat goes quiet',
  ],

  /**
   * A closing clause that reads correctly after almost any question above.
   *
   * This is where most of the variety comes from: one bank multiplying across
   * every pattern beats writing hundreds of patterns by hand. The empty string
   * is deliberate — sometimes the question is better on its own.
   */
  tail: [
    '',
    ', and nobody notices',
    ', and that was the whole point',
    ', and we never speak of it again',
    ', and it was always going to be fine',
    ', and I still would not change it',
    ', and the answer changes nothing',
    ', and everyone already knew',
    ', and it only matters to me',
    ', and that is somehow worse',
    ', and I find out on a Tuesday',
    ', and it is funnier that way',
    ', and I would still ask again',
  ],
  profound: [
    'the universe is just checking',
    'we were always going to end up here',
    'hope was never the lie',
    'the answer was the question',
    'somebody is having this exact thought right now',
    'this is the timeline that works',
    'the point was the asking',
    'none of it mattered and that was fine',
    'the version of me that did it is doing fine',
    'every door was open and I only tried one',
    'the good ending needed no decision at all',
    'we are early to something that is not money',
  ],
  dread: [
    'get hit by a car',
    'oversleep the one that matters',
    'say exactly the wrong thing',
    'finally check my balance',
    'run into them',
    'forget the password',
    'get found out',
    'read the group chat',
    'have to explain this to my mother',
    'open the app',
  ],
  absurd: [
    'the cat has been the dev this whole time',
    'we are all in the same group chat',
    'my portfolio is a personality test',
    'the chart is watching me back',
    'the whitepaper was a menu',
    'every candle is a tiny biography',
    'the moon is right there and nobody checked',
    'the bear market was a rehearsal',
    'somebody is holding one token out of politeness',
    'the roadmap was written in the past tense',
  ],
  degen: [
    'the bottom',
    'the top',
    'the one',
    'exactly what it looks like',
    'a bull trap wearing a bull costume',
    'the last good entry',
    'a rounding error in someone else’s week',
    'the part of the story people retell',
  ],
  /**
   * Neutral actors only.
   *
   * Anything self-describing ("the person who sold") contradicts half the verb
   * bank and produces lines like "the person who sold never sold". Every entry
   * here has to read correctly with every verb below.
   */
  person: [
    'I',
    'we',
    'everyone',
    'my future self',
    'the last buyer',
    'the quiet one in the group chat',
    'whoever is reading this',
    'the version of me that waited',
    'my ex',
    'the smartest person I know',
    'the one who never posts',
  ],
  /**
   * Past tense, no copula, no negation.
   *
   * "was early" agrees with "I" and not with "we"; "never sold" turns "nobody"
   * into a double negative. Everything here reads correctly after every subject
   * above, which is the only way a generator can promise a grammatical sentence.
   */
  verb: [
    'got it right',
    'got there early',
    'got there late',
    'held the whole way',
    'sold at the top',
    'knew all along',
    'just got lucky',
    'guessed and got away with it',
    'stopped checking and slept fine',
    'saw it coming',
    'called it and told nobody',
    'looked away at the wrong moment',
  ],
};

export interface Pattern {
  category: Category;
  /** Slot names in braces, e.g. "What $IF I had put {amount} into {asset}?" */
  text: string;
}

export const PATTERNS: Pattern[] = [
  // Money — the regret the whole site is built on.
  { category: 'money', text: '{opener}What if I had put {amount} into {asset} {when}{tail}?' },
  { category: 'money', text: '{opener}What if {amount} into {asset} was all it ever took{tail}?' },
  { category: 'money', text: '{opener}What if I sell {asset} and {consequence}?' },
  { category: 'money', text: '{opener}What if I hold and {consequence}?' },
  {
    category: 'money',
    text: '{opener}What if the only difference was buying {asset} {when}{tail}?',
  },
  { category: 'money', text: '{opener}What if I had spent {amount} on {asset} instead{tail}?' },
  { category: 'money', text: '{opener}What if {person} put {amount} into {asset} {when}?' },

  // Cosmic — the register the landing page opens in.
  { category: 'cosmic', text: '{opener}What if {profound}{tail}?' },
  { category: 'cosmic', text: '{opener}What if {profound}, and nobody had to be told?' },
  { category: 'cosmic', text: '{opener}What if {person} {verb}{tail}?' },
  { category: 'cosmic', text: '{opener}What if {person} {verb} and {profound}?' },

  // Dread — ordinary anxiety, which is where the question usually starts.
  { category: 'dread', text: '{opener}What if I {dread} tomorrow{tail}?' },
  { category: 'dread', text: '{opener}What if I {dread} and {consequence}?' },
  { category: 'dread', text: '{opener}What if today is the day I {dread}{tail}?' },
  { category: 'dread', text: '{opener}What if I {dread} and {person} {verb}?' },

  // Absurd.
  { category: 'absurd', text: '{opener}What if {absurd}{tail}?' },
  { category: 'absurd', text: '{opener}What if {absurd}, and {person} {verb}?' },
  { category: 'absurd', text: '{opener}What if {absurd} and {consequence}?' },

  { category: 'cosmic', text: '{opener}What if {profound} and {person} {verb}?' },
  { category: 'dread', text: '{opener}What if I {dread} and {person} {verb}?' },
  { category: 'absurd', text: '{opener}What if {absurd} and {profound}?' },

  // Degen.
  { category: 'degen', text: '{opener}What if this is {degen}{tail}?' },
  { category: 'degen', text: '{opener}What if this is {degen} and {person} {verb}?' },
  { category: 'degen', text: '{opener}What if {person} {verb} because this was {degen}?' },
  { category: 'degen', text: '{opener}What if this is {degen} and {consequence}?' },
];

/** How many distinct questions the banks can produce. Counted, never guessed. */
export function countPossibilities(patterns: Pattern[] = PATTERNS): number {
  return patterns.reduce((total, pattern) => {
    const slots = [...pattern.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
    const product = slots.reduce((n, slot) => n * (BANKS[slot]?.length ?? 1), 1);
    return total + product;
  }, 0);
}
