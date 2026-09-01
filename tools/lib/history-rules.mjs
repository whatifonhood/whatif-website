/**
 * The rules that decide which price points the What $IF Machine may use.
 *
 * These live apart from the builder because two scripts need them and the
 * builder is a long-running download: `build-coin-history.mjs` applies them to
 * data as it arrives, and `clean-coin-history.mjs` re-applies them to the files
 * already committed when a rule gets sharper. Importing the builder to reach
 * them would start a nine-hundred-coin download as a side effect.
 *
 * Every rule here answers the same question: would publishing this point make
 * the Machine state a return that never happened to anybody?
 */

/** A month-on-month move past this is treated as bad data, not a price. */
export const OUTLIER_RATIO = 50;

/**
 * A jump this large in a single month is not a price move.
 *
 * Tokens get redenominated — a 1:1000 swap, a contract migration — and the
 * series either side is measured in different units. Splicing them gives the
 * Machine a 2,628x "return" that never happened to anybody, which is exactly
 * the kind of plausible lie this tool cannot afford.
 *
 * Nothing distinguishes a redenomination from a real move in the numbers
 * alone, so the threshold is set where no honest monthly candle reaches.
 */
export const REDENOMINATION_RATIO = 200;

/** The fewest months worth keeping — below this the slider has nothing to say. */
export const MIN_POINTS = 6;

/**
 * Drops single points that disagree with the months on both sides of them.
 *
 * Both sides matter: a price that disagrees with one neighbour is a move, and
 * moves are the whole point of the tool. Only a point that contradicts its own
 * past and its own future is a bad reading.
 */
export function dropOutliers(points) {
  if (points.length < 3) return points;

  const wild = (a, b) => {
    if (!(a > 0) || !(b > 0)) return true;
    const ratio = a > b ? a / b : b / a;
    return ratio > OUTLIER_RATIO;
  };

  return points.filter(([, price], index) => {
    const before = points[index - 1]?.[1];
    const after = points[index + 1]?.[1];
    if (before === undefined) return !(after !== undefined && wild(price, after));
    if (after === undefined) return !wild(price, before);
    return !(wild(price, before) && wild(price, after));
  });
}

/**
 * Cuts a history back to its most recent consistent scale.
 *
 * Returns null when what is left is too short to use, which means the coin
 * should not be offered at all rather than offered with a broken history.
 */
export function trimAtRedenomination(points) {
  let start = 0;
  for (let i = 1; i < points.length; i += 1) {
    const before = points[i - 1][1];
    const after = points[i][1];
    if (!(before > 0) || !(after > 0)) continue;
    const ratio = before > after ? before / after : after / before;
    if (ratio > REDENOMINATION_RATIO) start = i;
  }

  const kept = points.slice(start);
  return kept.length >= MIN_POINTS ? kept : null;
}
