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
import { TOKEN } from '../config/site.ts';

export async function initLiveStats(locale: string): Promise<void> {
  const nodes = document.querySelectorAll<HTMLElement>('[data-stat]');
  if (nodes.length === 0) return;

  let stats;
  try {
    stats = await getLiveStats();
  } catch {
    return; // Snapshot stays on screen.
  }

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
  };

  for (const node of nodes) {
    const key = node.dataset.stat;
    const value = key ? formatted[key] : undefined;
    if (value) node.textContent = value;
  }

  // Now the figures are current, swap the "as of <date>" note for a live badge.
  for (const note of document.querySelectorAll<HTMLElement>('[data-stat-freshness]')) {
    const snapshot = note.querySelector<HTMLElement>('[data-freshness-snapshot]');
    const live = note.querySelector<HTMLElement>('[data-freshness-live]');
    if (snapshot) snapshot.hidden = true;
    if (live) live.hidden = false;
  }
}
