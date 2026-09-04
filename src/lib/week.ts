/**
 * The last seven days, worked out at build time.
 *
 * Everything here comes from files already committed to the repo — the burn
 * event log and $IF's own daily price history — so the panel is in the HTML
 * and needs no request. It moves when the daily refresh runs, which is why the
 * panel states the day it covers rather than implying it is live.
 *
 * Nothing is estimated. Where the data cannot answer something, the field is
 * left undefined and the panel omits that line.
 */

import { BURNS } from '../config/burns.ts';
import { committedCandles } from './market.ts';

const DAY = 86_400;
const WEEK = 7 * DAY;

export interface WeekInSummary {
  /** The last day covered, YYYY-MM-DD. */
  to: string;
  burnCount: number;
  burnedTokens: number;
  /** The single largest burn of the week, if there was one. */
  largestBurn?: { tokens: number; txHash: string };
  /** Price a week ago and at the end, when the history reaches back that far. */
  priceThen?: number;
  priceNow?: number;
}

/**
 * $IF's own daily price history.
 *
 * This used to sit among the What $IF Machine's coin files. It is $IF's own
 * data rather than the Machine's, so when the Machine was removed it moved
 * here instead of going with it. Read at build time only — nothing fetches it.
 */
function ifHistory(): [string, number][] {
  // One close per day, from the same committed candles the chart draws. The
  // previous source was a JSON file left behind by the removed Machine: nothing
  // regenerated it, so it froze on 31 August while the panel above it kept
  // saying "to <today>".
  return committedCandles('all').map((candle) => [
    new Date(candle.time * 1000).toISOString().slice(0, 10),
    candle.close,
  ]);
}

export function weekInSummary(): WeekInSummary {
  // Anchored to the newest thing in the data rather than to today, so the panel
  // never claims a quiet week when what actually happened is a refresh failing.
  const latestBurn = BURNS.reduce((newest, burn) => Math.max(newest, burn.time), 0);
  const history = ifHistory();
  const latestPriceDay = history.at(-1)?.[0];

  const anchor = Math.max(
    latestBurn,
    latestPriceDay ? Date.parse(`${latestPriceDay}T00:00:00Z`) / 1000 : 0,
  );
  const since = anchor - WEEK;

  const week = BURNS.filter((burn) => burn.time >= since);
  const largestBurn = week.reduce<WeekInSummary['largestBurn']>(
    (biggest, burn) =>
      !biggest || burn.tokens > biggest.tokens
        ? { tokens: burn.tokens, txHash: burn.txHash }
        : biggest,
    undefined,
  );

  // Seven entries back in a daily history is a week ago; if the history is
  // shorter than that, the comparison is left out rather than approximated.
  const priceNow = history.at(-1)?.[1];
  const priceThen = history.length > 7 ? history[history.length - 8]?.[1] : undefined;

  return {
    to: new Date(anchor * 1000).toISOString().slice(0, 10),
    burnCount: week.length,
    burnedTokens: week.reduce((total, burn) => total + burn.tokens, 0),
    largestBurn,
    priceThen,
    priceNow,
  };
}
