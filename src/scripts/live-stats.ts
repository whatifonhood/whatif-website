/**
 * Replaces the build-time snapshot figures with live ones once they arrive.
 *
 * Every element that can be updated is marked `data-stat="<key>"` in the markup
 * and already contains the snapshot value, so the page is complete before this
 * runs and stays complete if the network is down. Values are written with
 * `textContent` — never innerHTML — so a hostile API response cannot inject
 * markup.
 */
import { getLiveStats } from '../lib/token-stats.ts';
import { formatCompact, formatCount, formatPercent, formatUsd } from '../lib/format.ts';
import { setLiveText } from '../lib/live-text.ts';
import { TOKEN } from '../config/site.ts';

/** How often the landing figures refresh while the tab is being looked at. */
const REFRESH_MS = 30_000;

export async function initLiveStats(locale: string): Promise<void> {
  // Nothing to update on this page; do not start a poll for it.
  if (document.querySelector('[data-stat]') === null) return;

  await update(locale);

  // Same reasoning as the dashboard: poll only while the tab is visible, and
  // refresh the moment it comes back rather than showing stale figures.
  let timer: number | undefined;
  const start = () => {
    timer ??= window.setInterval(() => void update(locale), REFRESH_MS);
  };
  const stop = () => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      void update(locale);
      start();
    }
  });
  window.addEventListener('focus', () => void update(locale));
  start();
}

/**
 * Fetches the live figures and writes whatever arrived.
 *
 * The badge that says "Live" is only allowed to appear if something actually
 * came back. It used to flip unconditionally, which meant a total API failure
 * left the build-time snapshot on screen with the honest "as of <date>" label
 * REMOVED and a live indicator in its place — a price from the last deploy,
 * asserted as current, on a page about money. It never corrected itself and got
 * worse the longer since the last build.
 *
 * `getLiveStats` uses Promise.allSettled and so can never reject; a total
 * failure returns an empty object. That is why the test here is "did any value
 * arrive", not "did this throw".
 */
async function update(locale: string): Promise<void> {
  const stats = await getLiveStats();

  const burnedPercent =
    stats.burnedTokens === undefined ? undefined : (stats.burnedTokens / TOKEN.totalSupply) * 100;

  const formatted: Record<string, string | undefined> = {
    price: stats.priceUsd === undefined ? undefined : formatUsd(stats.priceUsd, locale),
    marketCap: stats.marketCapUsd === undefined ? undefined : formatUsd(stats.marketCapUsd, locale),
    liquidity: stats.liquidityUsd === undefined ? undefined : formatUsd(stats.liquidityUsd, locale),
    volume: stats.volume24hUsd === undefined ? undefined : formatUsd(stats.volume24hUsd, locale),
    burned:
      stats.burnedTokens === undefined ? undefined : formatCompact(stats.burnedTokens, locale),
    burnedExact:
      stats.burnedTokens === undefined ? undefined : formatCount(stats.burnedTokens, locale),
    burnedPercent: burnedPercent === undefined ? undefined : formatPercent(burnedPercent, locale),
    holders: stats.holders === undefined ? undefined : formatCompact(stats.holders, locale),
  };

  for (const [key, value] of Object.entries(formatted)) {
    if (value) setLiveText(document, 'data-stat', key, value);
  }

  // Only claim "live" when something actually arrived, and go back to the dated
  // label when a later poll fails — otherwise a page left open overnight keeps
  // asserting a figure it stopped being able to confirm hours ago.
  const arrived = Object.values(formatted).some((value) => value !== undefined);
  for (const note of document.querySelectorAll<HTMLElement>('[data-stat-freshness]')) {
    const snapshot = note.querySelector<HTMLElement>('[data-freshness-snapshot]');
    const live = note.querySelector<HTMLElement>('[data-freshness-live]');
    if (snapshot) snapshot.hidden = arrived;
    if (live) live.hidden = !arrived;
  }
}
