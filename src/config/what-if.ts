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
    'the one everyone called a scam',
    'the one with a cat on it',
    'the coin named after a typo',
    'the ticker I could not pronounce',
    'the thing I called a bubble',
    'whatever was trending that week',
    'the one my barber mentioned',
  ],
  when: [
    'on day one',
    'in 2013',
    'in 2017',
    'in 2021',
    'last Tuesday',
    'this morning',
    'the day I first heard of it',
    'when it was still funny',
    'before the group chat knew',
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

  { category: 'deep', text: 'What if the life you have is the one you were hoping for?' },
  { category: 'deep', text: 'What if you are in the middle of the good years right now?' },
  { category: 'deep', text: 'What if nothing is wasted, only used differently?' },
  { category: 'deep', text: 'What if the detour was the route?' },
  { category: 'deep', text: 'What if you are further along than the version of you who set out?' },
  {
    category: 'deep',
    text: 'What if the thing you call luck is just other people helping quietly?',
  },
  {
    category: 'deep',
    text: "What if you have been someone's answered prayer without hearing about it?",
  },
  { category: 'deep', text: 'What if you are remembered for the thing you did not think counted?' },
  { category: 'deep', text: 'What if the smallest promise you kept held someone together?' },
  {
    category: 'deep',
    text: 'What if the person you were short with was carrying something enormous?',
  },
  { category: 'deep', text: 'What if everyone you envy is envying someone too?' },
  { category: 'deep', text: 'What if nobody has it figured out, and that is the shared secret?' },
  { category: 'deep', text: 'What if confidence is just the willingness to be wrong in public?' },
  { category: 'deep', text: 'What if you are allowed to start again on a Wednesday?' },
  { category: 'deep', text: 'What if the deadline was invented and you agreed to it?' },
  { category: 'deep', text: 'What if you outlive the thing you are worried about?' },
  { category: 'deep', text: 'What if the fear never fully goes and you go anyway?' },
  { category: 'deep', text: 'What if courage is mostly just doing it while afraid?' },
  { category: 'deep', text: 'What if the hardest year taught you the thing you now use daily?' },
  { category: 'deep', text: 'What if pain is not a lesson and does not have to be?' },
  { category: 'deep', text: 'What if you are allowed to be tired without earning it?' },
  { category: 'deep', text: 'What if rest is not the reward for the work but part of it?' },
  { category: 'deep', text: 'What if enough arrived years ago and nobody rang a bell?' },
  { category: 'deep', text: 'What if wanting more is not a flaw but a feature you can aim?' },
  { category: 'deep', text: 'What if the ambition was borrowed and you can give it back?' },
  {
    category: 'deep',
    text: 'What if success looked nothing like the picture and you got it anyway?',
  },
  { category: 'deep', text: 'What if the ordinary day is the one you will miss?' },
  { category: 'deep', text: 'What if this is the story you tell your grandchildren?' },
  { category: 'deep', text: 'What if the boring years are the ones that hold everything up?' },
  { category: 'deep', text: 'What if the good life is mostly maintenance?' },
  { category: 'deep', text: 'What if love is a decision you make repeatedly and quietly?' },
  { category: 'deep', text: 'What if being known is worth more than being admired?' },
  { category: 'deep', text: 'What if the friendship you did not maintain was still real?' },
  { category: 'deep', text: 'What if they think about you as often as you think about them?' },
  { category: 'deep', text: 'What if the message you never sent was the one they needed?' },
  { category: 'deep', text: 'What if forgiveness is something you do for your own future?' },
  { category: 'deep', text: 'What if you can love someone and still let them go?' },
  { category: 'deep', text: 'What if grief is love with nowhere left to put itself?' },
  { category: 'deep', text: 'What if the ones we lost are still doing work through us?' },
  { category: 'deep', text: 'What if you carry more of them than you realise?' },
  { category: 'deep', text: 'What if remembering someone properly is a form of keeping them?' },
  { category: 'deep', text: 'What if the last conversation was ordinary and that was a mercy?' },
  { category: 'deep', text: 'What if you get to decide what your life was about?' },
  { category: 'deep', text: 'What if meaning is not discovered but assembled?' },
  { category: 'deep', text: 'What if the point of the question is that it keeps you moving?' },
  { category: 'deep', text: 'What if certainty would have been a smaller life?' },
  { category: 'deep', text: 'What if doubt is what honesty feels like from the inside?' },
  { category: 'deep', text: 'What if changing your mind is the whole skill?' },
  { category: 'deep', text: 'What if being wrong in public is cheaper than being wrong quietly?' },
  { category: 'deep', text: 'What if the truth was available the entire time and inconvenient?' },
  { category: 'deep', text: 'What if you already know and are waiting for permission?' },
  { category: 'deep', text: 'What if nobody is going to give you permission?' },
  { category: 'deep', text: 'What if you gave it to yourself this afternoon?' },
  { category: 'deep', text: 'What if the version of you in ten years is grateful for today?' },
  { category: 'deep', text: 'What if the version of you from ten years ago would be amazed?' },
  { category: 'deep', text: "What if you are somebody's proof that it can be done?" },
  { category: 'deep', text: 'What if consistency beats intensity every single time?' },
  { category: 'deep', text: 'What if the compound interest was never about money?' },
  { category: 'deep', text: 'What if attention is the most valuable thing you own?' },
  { category: 'deep', text: 'What if what you look at is what you become?' },
  { category: 'deep', text: 'What if the algorithm is not choosing for you unless you let it?' },
  { category: 'deep', text: 'What if you closed the app and nothing bad happened?' },
  { category: 'deep', text: 'What if the news does not need you to hold it every hour?' },
  { category: 'deep', text: 'What if you are allowed to not have an opinion?' },
  { category: 'deep', text: 'What if silence is a position?' },
  { category: 'deep', text: 'What if listening is the rarer talent?' },
  { category: 'deep', text: 'What if the person who changed your life does not know?' },
  { category: 'deep', text: 'What if you told them this week?' },
  { category: 'deep', text: 'What if gratitude is a practice and not a mood?' },
  { category: 'deep', text: 'What if noticing is most of it?' },
  { category: 'deep', text: 'What if the walk is the answer more often than the thinking?' },
  { category: 'deep', text: 'What if your body has been telling you for months?' },
  { category: 'deep', text: 'What if sleep fixes more than strategy?' },
  { category: 'deep', text: 'What if you are one honest conversation away from lighter?' },
  { category: 'deep', text: 'What if the thing you are avoiding is smaller than the avoiding?' },
  { category: 'deep', text: 'What if starting badly is the only way to start?' },
  { category: 'deep', text: 'What if the first draft is supposed to be embarrassing?' },
  { category: 'deep', text: 'What if nobody remembers your worst day but you?' },
  { category: 'deep', text: 'What if the humiliation you replay was invisible to everyone else?' },
  { category: 'deep', text: 'What if you are the only one keeping score?' },
  { category: 'deep', text: 'What if the universe is large enough for this to matter anyway?' },
  { category: 'deep', text: 'What if scale is not the same as significance?' },
  { category: 'deep', text: 'What if a single life is the correct unit?' },
  { category: 'deep', text: 'What if you are a rounding error and still the whole point?' },
  { category: 'deep', text: 'What if consciousness happening at all is the strange part?' },
  { category: 'deep', text: 'What if the odds against you existing make this a windfall?' },
  { category: 'deep', text: 'What if every person alive is a coincidence that worked?' },
  { category: 'deep', text: 'What if being here at all was the improbable bit?' },
  { category: 'deep', text: 'What if there is no plan and it is still worth doing well?' },
  { category: 'deep', text: 'What if the absence of a script is the freedom?' },
  { category: 'deep', text: 'What if you get to choose what counts?' },
  { category: 'deep', text: 'What if the meaning was in the making and not the made?' },
  { category: 'deep', text: 'What if the cathedral builders were fine never seeing it?' },
  { category: 'deep', text: 'What if you plant something you will not sit under?' },
  { category: 'deep', text: 'What if the future is people you will never meet?' },
  { category: 'deep', text: 'What if you owe them the same thing you were given?' },
  { category: 'deep', text: 'What if progress is just a lot of people refusing to quit?' },
  { category: 'deep', text: 'What if the world got better and nobody announced it?' },
  { category: 'deep', text: 'What if the good news is quiet by nature?' },
  { category: 'deep', text: 'What if despair is a habit and not an analysis?' },
  { category: 'deep', text: 'What if hope is the more rigorous position?' },
  { category: 'deep', text: 'What if optimism is a discipline rather than a temperament?' },
  { category: 'deep', text: 'What if cynicism is just fear wearing a clever coat?' },
  { category: 'deep', text: 'What if trying and looking stupid is the price of everything good?' },
  { category: 'deep', text: 'What if the people who changed things were also unsure?' },
  { category: 'deep', text: 'What if they did it anyway and that is the entire trick?' },
  { category: 'deep', text: 'What if you are early and it feels identical to being wrong?' },
  { category: 'deep', text: 'What if patience is a form of belief?' },
  { category: 'deep', text: 'What if the seed does nothing visible for a long time?' },
  { category: 'deep', text: 'What if you are in the part before it shows?' },
  { category: 'deep', text: 'What if the work counts even when nobody claps?' },
  { category: 'deep', text: 'What if craft is its own payment?' },
  { category: 'deep', text: 'What if you would do it anyway, and that is how you know?' },
  { category: 'deep', text: 'What if the thing you do when procrastinating is the actual thing?' },
  { category: 'deep', text: 'What if your taste is ahead of your ability and that is normal?' },
  { category: 'deep', text: 'What if the gap closes only by continuing?' },
  { category: 'deep', text: 'What if talent is mostly staying interested for longer?' },
  { category: 'deep', text: 'What if the ones who made it just did not stop?' },
  { category: 'deep', text: 'What if quitting the right thing is also brave?' },
  { category: 'deep', text: 'What if leaving well is a skill nobody teaches?' },
  { category: 'deep', text: 'What if the door you closed needed closing?' },
  { category: 'deep', text: 'What if no was the kindest word available?' },
  { category: 'deep', text: 'What if boundaries are how you keep loving people?' },
  { category: 'deep', text: 'What if you can be generous and still finite?' },
  { category: 'deep', text: 'What if you are not required to be available?' },
  { category: 'deep', text: 'What if the guilt is old and belongs to someone else?' },
  { category: 'deep', text: 'What if you inherited a fear that was never yours?' },
  { category: 'deep', text: 'What if the story about you was written by someone who left?' },
  { category: 'deep', text: 'What if you can revise it?' },
  { category: 'deep', text: 'What if you already have, and have not updated the label?' },
  { category: 'deep', text: 'What if the identity you defend is out of date?' },
  { category: 'deep', text: 'What if you are allowed to outgrow the thing that saved you?' },
  { category: 'deep', text: 'What if you contain more than one true version?' },
  { category: 'deep', text: 'What if consistency is overrated and integrity is not?' },
  { category: 'deep', text: 'What if you can hold two things and not resolve them?' },
  { category: 'deep', text: 'What if the paradox is the accurate description?' },
  { category: 'deep', text: 'What if not knowing is a legitimate place to stand?' },
  { category: 'deep', text: 'What if the honest answer is I do not know yet?' },
  { category: 'deep', text: 'What if that is the beginning of every good thing?' },

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

// ---------------------------------------------------------------------------
// Choosing a question
// ---------------------------------------------------------------------------

/**
 * How often each register comes up.
 *
 * The philosophical one leads: it is the question the whole coin is built on.
 * Money is the regret the Machine already answers in detail, and the market
 * jokes are garnish, so they take the smallest share.
 */
export const WEIGHTS: Record<Category, number> = { deep: 0.62, money: 0.24, market: 0.14 };

export interface Question {
  text: string;
  /**
   * A short, opaque handle for this exact question, used in the share URL.
   *
   * Indices, never the text itself. A URL carrying raw words would let anyone
   * render whatever they liked onto a card wearing our branding — which is a
   * way to make $IF appear to say anything. Decoding checks every index against
   * the real data, so a tampered link falls back to a fresh question.
   */
  id: string;
}

/** Deterministic generator, so a date always produces the same question. */
function seeded(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

/** Builds one question from a source of randomness, so date and dice share code. */
function build(random: () => number): Question {
  let roll = random();
  let category: Category = 'deep';
  for (const entry of Object.entries(WEIGHTS) as [Category, number][]) {
    roll -= entry[1];
    if (roll <= 0) {
      category = entry[0];
      break;
    }
  }

  const lines = LINES.map((line, index) => ({ line, index })).filter(
    (entry) => entry.line.category === category,
  );
  const patterns = PATTERNS.map((pattern, index) => ({ pattern, index })).filter(
    (entry) => entry.pattern.category === category,
  );

  const total = lines.length + patterns.length;
  if (total === 0) return { text: LINES[0]!.text, id: 'l0' };

  const choice = Math.floor(random() * total);

  if (choice < lines.length) {
    const entry = lines[choice]!;
    return { text: entry.line.text, id: `l${entry.index}` };
  }

  const entry = patterns[choice - lines.length]!;
  const slots = [...entry.pattern.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
  const picked: number[] = [];
  const text = slots.reduce((current, slot) => {
    const bank = BANKS[slot] ?? [];
    const index = Math.floor(random() * bank.length);
    picked.push(index);
    return current.replace(`{${slot}}`, bank[index] ?? '');
  }, entry.pattern.text);

  return { text, id: `p${entry.index}.${picked.join('.')}` };
}

/** A question at random. */
export function randomQuestion(): Question {
  return build(Math.random);
}

/**
 * The question for a given day.
 *
 * Everyone who opens the site on the same date sees the same one, which is what
 * makes it worth posting about together. `iso` is a plain YYYY-MM-DD string so
 * the caller decides the timezone rather than this guessing.
 */
export function questionForDate(iso: string): Question {
  return build(seeded(hash(iso)));
}

/**
 * Rebuilds the exact question behind an id.
 *
 * Every index is checked against the real data. Anything malformed, out of
 * range, or invented returns null and the caller shows a fresh question.
 */
export function questionFromId(id: string): Question | null {
  if (typeof id !== 'string' || !/^[lp][0-9.]{1,40}$/.test(id)) return null;

  if (id.startsWith('l')) {
    const index = Number(id.slice(1));
    const line = LINES[index];
    if (!Number.isInteger(index) || !line) return null;
    return { text: line.text, id };
  }

  const parts = id.slice(1).split('.').map(Number);
  const patternIndex = parts[0];
  if (patternIndex === undefined || !Number.isInteger(patternIndex)) return null;
  const pattern = PATTERNS[patternIndex];
  if (!pattern) return null;

  const slots = [...pattern.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
  if (parts.length - 1 !== slots.length) return null;

  let text = pattern.text;
  for (const [position, slot] of slots.entries()) {
    const bank = BANKS[slot] ?? [];
    const index = parts[position + 1];
    if (index === undefined || !Number.isInteger(index) || !bank[index]) return null;
    text = text.replace(`{${slot}}`, bank[index]);
  }

  return { text, id };
}
