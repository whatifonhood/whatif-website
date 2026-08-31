/**
 * The question generator.
 *
 * THE RULE THIS FILE EXISTS TO ENFORCE: only vary what is interchangeable
 * within a single idea, and never join two ideas.
 *
 * The first version combined freely across slots and joined clauses with "and".
 * Every sentence was grammatical and most were nonsense — "What if my portfolio
 * is a personality test and none of it mattered?" — because meaning does not
 * compose the way grammar does. Two ideas glued together are not a thought.
 *
 * So there are two kinds of question here and nothing else:
 *
 *   PATTERNS  one idea with slots where every value is equally sensible. An
 *             amount, a coin, a date: swap any of them and the question still
 *             means something. These generate the volume.
 *
 *   LINES     one idea, written whole. Jokes and thoughts cannot be decomposed
 *             into slots without losing the thing that made them land, so they
 *             are not.
 *
 * Adding to LINES is the way to make this better. Adding another free-combining
 * slot is the way to make it worse, which is how it went wrong the first time.
 */

/** Kept for balance when picking, not shown as a filter. */
export const CATEGORIES = ['deep', 'money', 'market'] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Slot banks.
 *
 * Every entry has to read correctly in every pattern that uses its slot. If a
 * word only works in one of them, it belongs in a LINE instead.
 */
export const BANKS: Record<string, string[]> = {
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
    'the deposit',
    'a month of coffees',
  ],
  asset: [
    '$IF',
    'the one I laughed at',
    'the dog one',
    'the frog one',
    'the one with the terrible logo',
    'the thing everyone said was a scam',
    'the one with a cat on it',
    'the coin named after a typo',
    'the ticker I could not pronounce',
    'the thing I called a bubble',
    'whatever was trending that week',
    'the one my barber mentioned',
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
    'back when it cost nothing',
    'the week I nearly did',
  ],
  consequence: [
    'it never comes back',
    'that was the bottom',
    'it doubles by Friday',
    'everyone finds out',
    'nothing happens at all',
    'I am the last one holding',
    'the chart does the thing',
    'somebody screenshots it',
    'I was early after all',
    'the group chat goes quiet',
  ],
  dread: [
    'get hit by a car',
    'oversleep the one that matters',
    'say exactly the wrong thing',
    'finally check my balance',
    'run into them',
    'forget the password',
    'read the group chat',
    'open the app',
    'get found out',
    'answer honestly',
  ],
  market: [
    'the bottom',
    'the top',
    'the one',
    'exactly what it looks like',
    'the last good entry',
    'the part people retell later',
    'a bull trap in a bull costume',
    'the quiet bit before it moves',
  ],
  /** Neutral subjects: every one reads correctly with every verb below. */
  person: [
    'I',
    'we',
    'everyone',
    'my future self',
    'the last buyer',
    'the quiet one in the group chat',
    'whoever is reading this',
    'my ex',
    'the smartest person I know',
    'the one who never posts',
    'the person who talked me out of it',
  ],
  /** Past tense, no copula, no negation — see the note on `person`. */
  verb: [
    'got it right',
    'got there early',
    'got there late',
    'held the whole way',
    'sold at the top',
    'knew all along',
    'just got lucky',
    'saw it coming',
    'called it and told nobody',
    'looked away at the wrong moment',
    'guessed and got away with it',
  ],
};

export interface Pattern {
  category: Category;
  /** One idea. Slots only where any value is equally sensible. */
  text: string;
}

/**
 * Every pattern is a single idea.
 *
 * None of these join two clauses. "What if I sell and {consequence}?" is one
 * thought — a cause and its result — not two ideas stapled together, which is
 * why it survives every combination.
 */
export const PATTERNS: Pattern[] = [
  { category: 'money', text: 'What if I had put {amount} into {asset} {when}?' },
  { category: 'money', text: 'What if I had bought {asset} {when}?' },
  { category: 'money', text: 'What if {amount} into {asset} was all it took?' },
  { category: 'money', text: 'What if I sell and {consequence}?' },
  { category: 'money', text: 'What if I hold and {consequence}?' },
  { category: 'money', text: 'What if I had spent {amount} on {asset} instead?' },

  { category: 'deep', text: 'What if I {dread} tomorrow?' },
  { category: 'deep', text: 'What if today is the day I {dread}?' },
  { category: 'deep', text: 'What if I never {dread} again?' },

  { category: 'market', text: 'What if this is {market}?' },
  { category: 'market', text: 'What if that was {market}?' },
  { category: 'market', text: 'What if {person} {verb}?' },
];

/**
 * Questions written whole.
 *
 * These are the ones with a joke or a thought in them, which is exactly what a
 * slot destroys. Adding here is how this gets better — it costs nothing and
 * cannot produce nonsense.
 */
export const LINES: { category: Category; text: string }[] = [
  // ---------------------------------------------------------------- deep
  // The register the landing page opens in, and the one the coin is actually
  // about. The 3am question, not the trading-desk one.
  {
    category: 'deep',
    text: 'What if every choice made another version of you, and they are all fine?',
  },
  { category: 'deep', text: 'What if the point was never to arrive?' },
  {
    category: 'deep',
    text: 'What if someone is alive because of something you have forgotten doing?',
  },
  {
    category: 'deep',
    text: 'What if you have already met the most important person you will ever meet?',
  },
  {
    category: 'deep',
    text: 'What if the day you cannot remember was the one that changed everything?',
  },
  { category: 'deep', text: 'What if being forgotten is not the same as not mattering?' },
  { category: 'deep', text: 'What if kindness is the only thing that compounds?' },
  { category: 'deep', text: 'What if you are already the person you were trying to become?' },
  { category: 'deep', text: 'What if nobody is coming, and that is the good news?' },
  { category: 'deep', text: 'What if the fear was borrowed from someone who is gone?' },
  { category: 'deep', text: 'What if the waiting was the life?' },
  { category: 'deep', text: 'What if you are the ancestor somebody thanks?' },
  { category: 'deep', text: 'What if meaning is made and never found?' },
  { category: 'deep', text: 'What if the universe is not indifferent, only quiet?' },
  { category: 'deep', text: 'What if every stranger is mid-sentence in a story as long as yours?' },
  { category: 'deep', text: 'What if you could see the whole of it and still choose this?' },
  { category: 'deep', text: 'What if regret is just proof you cared about the outcome?' },
  { category: 'deep', text: 'What if the road not taken was worse?' },
  { category: 'deep', text: 'What if you are somebody else’s what if?' },
  { category: 'deep', text: 'What if the last time happened and nobody announced it?' },
  { category: 'deep', text: 'What if love outlives every single one of us?' },
  { category: 'deep', text: 'What if one voice was enough to end it?' },
  { category: 'deep', text: 'What if the broken become the builders?' },
  { category: 'deep', text: 'What if hope was never the stupid option?' },
  { category: 'deep', text: 'What if a child’s idea rewrites the next hundred years?' },
  { category: 'deep', text: 'What if mercy is stronger than power and always was?' },
  { category: 'deep', text: 'What if we remembered every name?' },
  { category: 'deep', text: 'What if the darkest hour is holding the dawn?' },
  { category: 'deep', text: 'What if forgiving them was the cure?' },
  { category: 'deep', text: 'What if nobody had to grieve alone?' },
  { category: 'deep', text: 'What if you could save one life without ever knowing?' },
  { category: 'deep', text: 'What if the small kindness was the enormous one?' },
  { category: 'deep', text: 'What if certainty was the thing holding you back?' },
  { category: 'deep', text: 'What if doubt is how thinking feels from the inside?' },
  { category: 'deep', text: 'What if time is not running out, only running?' },
  { category: 'deep', text: 'What if you are allowed to change your mind?' },
  { category: 'deep', text: 'What if the question is better company than the answer?' },
  { category: 'deep', text: 'What if there is no lesson in it, only weather?' },
  { category: 'deep', text: 'What if the good ending needed no decision at all?' },
  { category: 'deep', text: 'What if you already have enough and nobody told you?' },
  { category: 'deep', text: 'What if the thing you are avoiding takes ten minutes?' },
  { category: 'deep', text: 'What if everyone else is guessing too?' },
  { category: 'deep', text: 'What if the story is better because you did not know?' },
  { category: 'deep', text: 'What if being early feels exactly like being wrong?' },
  { category: 'deep', text: 'What if you only regret the ones you did not try?' },
  { category: 'deep', text: 'What if somebody needed you to speak first?' },
  { category: 'deep', text: 'What if the universe is just checking?' },
  { category: 'deep', text: 'What if this is the good part and you are busy?' },
  { category: 'deep', text: 'What if the worst thing already happened and you survived it?' },
  { category: 'deep', text: 'What if none of it mattered, and that was fine?' },
  { category: 'deep', text: 'What if you go to bed instead, and it is still there tomorrow?' },
  { category: 'deep', text: 'What if the door was open the whole time?' },
  { category: 'deep', text: 'What if you asked for exactly what you wanted?' },
  { category: 'deep', text: 'What if nobody is actually watching?' },
  { category: 'deep', text: 'What if you are not the problem, and never were?' },
  { category: 'deep', text: 'What if it works out and you have no story to tell?' },

  // ---------------------------------------------------------------- money
  { category: 'money', text: 'What if the money was never the point?' },
  { category: 'money', text: 'What if you only ever needed one good decision?' },
  { category: 'money', text: 'What if you already made it and did not notice?' },
  { category: 'money', text: 'What if the sensible choice was the expensive one?' },
  { category: 'money', text: 'What if I make a million and nothing changes?' },
  { category: 'money', text: 'What if I make a million and everything does?' },
  { category: 'money', text: 'What if the person who sold was right?' },
  { category: 'money', text: 'What if I stopped checking for a year?' },
  { category: 'money', text: 'What if I bought the top and it did not matter?' },
  { category: 'money', text: 'What if enough arrived and I kept going anyway?' },

  // ---------------------------------------------------------------- market
  { category: 'market', text: 'What if the chart is watching me back?' },
  { category: 'market', text: 'What if the whitepaper was a menu?' },
  { category: 'market', text: 'What if the bear market was a rehearsal?' },
  { category: 'market', text: 'What if we are early to something that is not money?' },
  { category: 'market', text: 'What if the moon is right there and nobody checked?' },
  { category: 'market', text: 'What if every candle is a tiny biography?' },
  { category: 'market', text: 'What if the meme was the fundamentals?' },
  { category: 'market', text: 'What if nobody knows what they are doing?' },
  { category: 'market', text: 'What if this one is different, for once?' },
  { category: 'market', text: 'What if the answer arrives on a Tuesday?' },
];

/** How many distinct questions exist. Counted, never guessed. */
export function countPossibilities(): number {
  const fromPatterns = PATTERNS.reduce((total, pattern) => {
    const slots = [...pattern.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
    return total + slots.reduce((n, slot) => n * (BANKS[slot]?.length ?? 1), 1);
  }, 0);
  return fromPatterns + LINES.length;
}
