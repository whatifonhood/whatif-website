/**
 * The dashboard: price chart, live figures and a trade feed.
 *
 * Everything is drawn from two public read-only APIs (see src/lib/market.ts).
 * The page renders complete from the build-time snapshot first, then updates in
 * place — so a slow or failing API leaves a readable page rather than a spinner.
 *
 * The chart is hand-drawn SVG. A charting library would be the largest thing on
 * the site by several times, for one line and an area fill.
 */
import {
  committedCandles,
  getLargeTrades,
  LARGE_TRADE_USD,
  getPairSnapshot,
  getPriceHistory,
  getBalanceOf,
  getRecentBurns,
  getRecentTrades,
  getTokenInfo,
  getOwner,
  getTotalSupply,
  type Candle,
  type Timeframe,
  type Trade,
} from '../lib/market.ts';
import { formatCompact, formatCount, formatPercent, formatUsd } from '../lib/format.ts';
import { setLiveText } from '../lib/live-text.ts';
import { BURNS, BURNS_SCANNED_TO } from '../config/burns.ts';
import { CHAIN, TOKEN } from '../config/site.ts';
import { recall, remember } from '../lib/preferences.ts';
import { attachChartInteraction } from './chart-interaction.ts';
import {
  CHART_H,
  SVG_NS,
  drawAverage,
  drawBurnMarks,
  drawCandles,
  drawEma,
  drawLine,
  drawPriceScale,
  drawTimeAxis,
  drawVolume,
  makeScale,
} from './chart-draw.ts';

const REFRESH_MS = 15_000;

/**
 * How many refresh ticks pass between the expensive reads.
 *
 * Everything used to be refetched on every tick, which on a phone left open at
 * the dashboard came to 400-800KB a minute — 20-40MB an hour of somebody's
 * mobile data, to watch a number that moves in the third decimal place.
 *
 * The price snapshot is one small response and stays on the fast tick, because
 * it is the thing the page claims is live. A full candle history, the day's
 * biggest trades and the holder count do not change meaningfully in fifteen
 * seconds and are read once a minute instead. A timeframe change still redraws
 * the chart immediately; this only governs the unattended refresh.
 */
const SLOW_EVERY = 4;

/**
 * What one refresh task reports back.
 *
 * The banner used to be driven by `results.every(r => r.status === 'rejected')`,
 * which could never be true: `renderExtremes` catches its own failures, and the
 * chart task resolves immediately while a pointer is on it. So the dashboard
 * could not tell the visitor that anything was wrong, in any language. Saying
 * so explicitly is the only version of this that stays correct as tasks are
 * added.
 */
/**
 * 'fallback' is a fourth outcome, and the reason it exists is the banner below.
 * When every API is unreachable the chart still draws — the candles ship with
 * the site — and for a while that counted as 'ok', which meant `allFailed` could
 * never be true and the page showed a build-time snapshot price under a live
 * pulse dot with nothing saying the data was old. Drawing from the cache is a
 * success for the chart and a failure for the network, and the banner is about
 * the network.
 */
type TaskResult = 'ok' | 'failed' | 'skipped' | 'fallback';

/** Transaction hashes already on screen, so new ones can be highlighted. */
const seenTrades = new Set<string>();
function formatTradeUsd(value: number, locale: string): string {
  return value < 0.01 ? '<$0.01' : formatUsd(value, locale);
}

/**
 * Draws a closing-price line with an area fill, for people who find candles
 * noisy. Same data, same scale — only the marks change.
 */
function shortWallet(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function timeAgo(timestamp: number, locale: string): string {
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' });
  const minutes = Math.round(seconds / 60);
  if (Math.abs(seconds) < 60) return format.format(seconds, 'second');
  if (Math.abs(minutes) < 60) return format.format(minutes, 'minute');
  return format.format(Math.round(minutes / 60), 'hour');
}

export function initDashboard(locale: string): void {
  const root = document.querySelector<HTMLElement>('[data-dashboard]');
  if (!root) return;

  const chart = root.querySelector<SVGSVGElement>('[data-chart]');
  const chartHigh = root.querySelector<HTMLElement>('[data-chart-high]');
  const chartLow = root.querySelector<HTMLElement>('[data-chart-low]');
  const feed = root.querySelector<HTMLElement>('[data-feed]');
  /** The live dot, and the message that replaces the chart when it has nothing. */
  const feedLive = root.querySelector<HTMLElement>('[data-feed-live]');
  const chartEmpty = root.querySelector<HTMLElement>('[data-chart-empty]');
  const status = root.querySelector<HTMLElement>('[data-dash-status]');
  const labels = {
    buy: root.dataset.labelBuy ?? 'Buy',
    sell: root.dataset.labelSell ?? 'Sell',
    view: root.dataset.labelView ?? 'View',
    failed: root.dataset.labelFailed ?? '',
    holdersUpdated: root.dataset.labelHoldersUpdated ?? '',
    burnMark: root.dataset.labelBurnMark ?? '{amount} burned',
    checkPass: root.dataset.labelCheckPass ?? '',
    ownerNone: root.dataset.labelOwnerNone ?? '',
    ownerSome: root.dataset.labelOwnerSome ?? '',
    windowHours: (hours: number) =>
      (root.dataset.labelWindow ?? '').replace('{hours}', String(hours)),
  };

  const setText = (key: string, value: string) => setLiveText(root, 'data-metric', key, value);

  /** Colours and signs a percentage change. */
  const setChange = (key: string, value: number | undefined) => {
    for (const node of root.querySelectorAll<HTMLElement>(`[data-change="${key}"]`)) {
      if (value === undefined) {
        node.textContent = '—';
        continue;
      }
      node.textContent = `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
      node.dataset.direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
    }
  };

  /** The candles currently drawn, so the crosshair can read them. */
  let shown: Candle[] = [];
  /** The trades renderTrades fetched this cycle, reused by renderExtremes. */
  let lastTrades: Trade[] = [];

  /**
   * The figures worth remembering between visits.
   *
   * Filled in by whichever tasks succeed, then announced once at the end of the
   * cycle — see `src/scripts/since-last-visit.ts`, which listens for it.
   */
  const visitFigures: { price?: number; burned?: number; holders?: number } = {};
  /** The panel describes one visit, so it is told once and not on every refresh. */
  let announcedVisit = false;

  const renderSnapshot = async (): Promise<TaskResult> => {
    const snapshot = await getPairSnapshot().catch(() => null);
    if (!snapshot) return 'failed';
    if (snapshot.priceUsd !== undefined) {
      setText('price', formatUsd(snapshot.priceUsd, locale));
      visitFigures.price = snapshot.priceUsd;
    }
    if (snapshot.marketCapUsd !== undefined)
      setText('marketCap', formatUsd(snapshot.marketCapUsd, locale));
    if (snapshot.liquidityUsd !== undefined)
      setText('liquidity', formatUsd(snapshot.liquidityUsd, locale));
    if (snapshot.volume24hUsd !== undefined)
      setText('volume', formatUsd(snapshot.volume24hUsd, locale));
    if (snapshot.poolTokens !== undefined)
      setText('poolTokens', formatCompact(snapshot.poolTokens, locale));
    setChange('h1', snapshot.change.h1);
    setChange('h6', snapshot.change.h6);
    setChange('h24', snapshot.change.h24);

    const { buys, sells } = snapshot.trades24h;
    if (buys !== undefined) setText('buys', formatCount(buys, locale));
    if (sells !== undefined) setText('sells', formatCount(sells, locale));
    if (buys !== undefined && sells !== undefined && sells > 0) {
      setText('ratio', (buys / sells).toFixed(2));
      // The bar shows the split at a glance; the numbers alone do not.
      const bar = root.querySelector<HTMLElement>('[data-flow-bar]');
      if (bar) bar.style.setProperty('--buy-share', `${(buys / (buys + sells)) * 100}%`);
    }
    return 'ok';
  };

  /**
   * The window on screen, as indices into the fetched candles.
   *
   * Zoom and pan move this rather than refetching: the whole series is already
   * in memory, so navigating is instant and costs the API nothing.
   */
  let loaded: Candle[] = [];
  let view = { start: 0, end: 0 };

  /** The price range the visible candles were drawn against, for the crosshair. */
  let lastBounds = { low: 0, high: 0 };

  const priceScale = root.querySelector<HTMLElement>('[data-price-scale]');
  const timeAxis = root.querySelector<HTMLElement>('[data-time-axis]');
  const ohlcBar = root.querySelector<HTMLElement>('[data-ohlc]');
  const lastLine = root.querySelector<SVGLineElement>('[data-last-line]');

  /**
   * The reading line above the chart.
   *
   * Shows whichever candle the pointer is on, and the most recent one when it
   * is not — so the row is never empty and never has to be discovered.
   */
  const showOhlc = (candle: Candle | undefined) => {
    if (!ohlcBar || !candle) return;
    const change = candle.open === 0 ? 0 : ((candle.close - candle.open) / candle.open) * 100;
    ohlcBar.replaceChildren();
    const pairs: [string, string][] = [
      ['O', formatUsd(candle.open, locale)],
      ['H', formatUsd(candle.high, locale)],
      ['L', formatUsd(candle.low, locale)],
      ['C', formatUsd(candle.close, locale)],
      ['VOL', formatCompact(candle.volumeUsd, locale)],
    ];
    for (const [key, value] of pairs) {
      const label = document.createElement('b');
      label.textContent = key;
      const shown = document.createElement('span');
      shown.textContent = value;
      const group = document.createElement('span');
      group.append(label, ' ', shown);
      ohlcBar.append(group);
    }
    const move = document.createElement('span');
    move.dataset.direction = change >= 0 ? 'up' : 'down';
    move.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    ohlcBar.append(move);
  };

  /** A dashed line and a tag at the most recent close. */
  const markLastPrice = (candles: Candle[], y: (value: number) => number) => {
    const last = candles[candles.length - 1];
    if (!lastLine || !last) return;
    const at = y(last.close);
    lastLine.setAttribute('y1', at.toFixed(2));
    lastLine.setAttribute('y2', at.toFixed(2));
    lastLine.setAttribute('opacity', '1');

    priceScale?.querySelector('[data-last]')?.remove();
    if (!priceScale) return;
    const tag = document.createElement('span');
    tag.className = 'scale-tag';
    tag.dataset.last = '';
    tag.style.top = `${(at / CHART_H) * 100}%`;
    tag.textContent = formatUsd(last.close, locale);
    priceScale.append(tag);
  };

  const clampView = () => {
    const MIN = 8;
    const total = loaded.length;
    if (total === 0) return;
    let { start, end } = view;
    if (end - start < MIN) end = Math.min(total, start + MIN);
    if (end - start < MIN) start = Math.max(0, end - MIN);
    view = { start: Math.max(0, Math.floor(start)), end: Math.min(total, Math.ceil(end)) };
  };

  const paint = () => {
    if (!chart || loaded.length < 2) return;
    clampView();
    const candles = loaded.slice(view.start, view.end);
    if (candles.length < 2) return;

    shown = candles;
    const type = root.dataset.chartType === 'line' ? 'line' : 'candles';
    const log = root.dataset.logScale === 'true';
    const bounds =
      type === 'line' ? drawLine(chart, candles, log) : drawCandles(chart, candles, log);
    drawVolume(chart, candles);

    // Overlays read the same scale the price was drawn with, so they line up.
    const scale = makeScale(bounds.low, bounds.high, log);
    lastBounds = bounds;
    if (root.dataset.showAverage === 'true') {
      drawAverage(chart, candles, scale, Math.max(3, Math.round(candles.length / 8)));
    } else {
      chart.querySelector('[data-average]')?.replaceChildren();
    }
    if (root.dataset.showEma === 'true') {
      // Scaled to the window: a fixed period leaves a short view with almost
      // no line, and a long view with one that never turns.
      drawEma(chart, candles, scale, Math.max(5, Math.round(candles.length / 6)));
    } else {
      chart.querySelector('[data-ema]')?.replaceChildren();
    }
    drawBurnMarks(chart, candles, BURNS, locale, labels.burnMark);

    // The furniture that makes it readable: round price levels down the right
    // with a line each, the dates along the bottom, and the last close marked.
    drawPriceScale(chart, priceScale, bounds.low, bounds.high, scale, locale);
    drawTimeAxis(timeAxis, candles, locale);
    markLastPrice(candles, scale);
    showOhlc(candles[candles.length - 1]);

    chart.dataset.type = type;
    // Only offer "reset" when there is something to reset to.
    root.dataset.zoomed = String(view.start > 0 || view.end < loaded.length);

    if (chartHigh) chartHigh.textContent = formatUsd(bounds.high, locale);
    if (chartLow) chartLow.textContent = formatUsd(bounds.low, locale);
    const rising = (candles.at(-1)?.close ?? 0) >= (candles[0]?.open ?? 0);
    chart.dataset.direction = rising ? 'up' : 'down';
  };

  /**
   * Fetches a timeframe and draws it.
   *
   * `keepView` is what stops the twenty-second refresh throwing away a zoom
   * somebody is in the middle of reading. New candles arrive at the right-hand
   * edge, so the window is shifted by however many were added and the view stays
   * pointed at the same moment in time.
   */
  /**
   * Candles already fetched, per timeframe.
   *
   * Switching back to a timeframe you have seen is instant and needs no network,
   * which is what makes the row of chips feel like a chart rather than a set of
   * page loads. It is also what makes them work at all when the market API is
   * rate-limiting: GeckoTerminal 429s readily, and after one refusal every
   * further click failed for a minute. The chip lit up, the chart did not
   * change, and the label then said 7D over a day of candles.
   */
  const cache = new Map<Timeframe, Candle[]>();

  // Seeded from the candles committed at build time, so every timeframe has
  // something to draw before a single request is made. See committedCandles().
  for (const frame of ['day', 'week', 'month', 'quarter', 'all'] as Timeframe[]) {
    const committed = committedCandles(frame);
    if (committed.length >= 2) cache.set(frame, committed);
  }

  const renderChart = async (timeframe: Timeframe, keepView = false): Promise<TaskResult> => {
    if (!chart) return 'skipped';

    const cached = cache.get(timeframe);
    // Draw what we already have before going to the network, so the switch is
    // immediate and the fetch only refreshes it.
    if (cached && cached.length >= 2 && !keepView) {
      loaded = cached;
      view = { start: 0, end: cached.length };
      if (chartEmpty) chartEmpty.hidden = true;
      paint();
    }

    const candles = await getPriceHistory(timeframe).catch(() => []);
    if (candles.length < 2) {
      // The live call failed. If this timeframe has candles — from the build or
      // from an earlier fetch — they are already on screen and the switch
      // succeeded; only say something when there is genuinely nothing to show.
      const fallback = cache.get(timeframe) ?? [];
      if (fallback.length >= 2) {
        if (loaded !== fallback) {
          loaded = fallback;
          view = { start: 0, end: fallback.length };
          if (chartEmpty) chartEmpty.hidden = true;
          paint();
        }
        return 'fallback';
      }
      if (chartEmpty && loaded.length === 0) chartEmpty.hidden = false;
      return 'failed';
    }
    if (chartEmpty) chartEmpty.hidden = true;
    cache.set(timeframe, candles);

    const zoomed = view.end - view.start < loaded.length;
    if (keepView && zoomed && loaded.length > 0) {
      const added = candles.length - loaded.length;
      const atRightEdge = view.end >= loaded.length;
      const span = Math.min(view.end - view.start, candles.length);
      const start = atRightEdge
        ? Math.max(0, candles.length - span)
        : Math.max(0, Math.min(candles.length - span, view.start + Math.max(0, added)));
      view = { start, end: start + span };
    } else {
      view = { start: 0, end: candles.length };
    }

    loaded = candles;
    paint();
    return 'ok';
  };

  const renderTrades = async (): Promise<TaskResult> => {
    if (!feed) return 'skipped';
    const trades = await getRecentTrades().catch(() => []);
    if (trades.length === 0) {
      // Rows that arrived earlier stay: they are stale, not wrong, and the
      // timestamp beside the title says when. With nothing ever fetched, the
      // placeholder stops saying it is still reading something.
      const status = feed.querySelector<HTMLElement>('[data-feed-status]');
      if (status && seenTrades.size === 0) {
        status.textContent = status.dataset.labelUnavailable ?? status.textContent;
      }
      return 'failed';
    }
    lastTrades = trades;
    if (feedLive) feedLive.hidden = false;

    const firstRun = seenTrades.size === 0;
    const rows = trades.slice(0, 25).map((trade) => {
      const row = document.createElement('li');
      row.className = 'feed-row';
      row.dataset.kind = trade.kind;
      // Highlight arrivals, but not the whole list on the first load.
      if (!firstRun && !seenTrades.has(trade.txHash)) row.dataset.new = '';
      seenTrades.add(trade.txHash);

      const kind = document.createElement('span');
      kind.className = 'feed-kind';
      kind.textContent = trade.kind === 'buy' ? labels.buy : labels.sell;

      const amount = document.createElement('span');
      amount.className = 'feed-amount';
      amount.textContent = formatTradeUsd(trade.usd, locale);

      const tokens = document.createElement('span');
      tokens.className = 'feed-tokens';
      tokens.textContent = `${formatCompact(trade.tokens, locale)} $IF`;

      const wallet = document.createElement('a');
      wallet.className = 'feed-wallet';
      wallet.href = `${CHAIN.explorerUrl}/address/${trade.wallet}`;
      wallet.target = '_blank';
      wallet.rel = 'noopener noreferrer';
      wallet.textContent = shortWallet(trade.wallet);

      const when = document.createElement('span');
      when.className = 'feed-time';
      when.textContent = timeAgo(trade.time, locale);

      row.append(kind, amount, tokens, wallet, when);
      return row;
    });

    feed.replaceChildren(...rows);

    // Re-triggering the pulse animation is what makes the page read as live.
    for (const pulse of root.querySelectorAll<HTMLElement>('[data-live-pulse]')) {
      pulse.classList.remove('is-beating');
      void pulse.offsetWidth;
      pulse.classList.add('is-beating');
    }

    const stamp = root.querySelector<HTMLElement>('[data-feed-updated]');
    if (stamp) {
      stamp.textContent = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date());
    }
    return 'ok';
  };

  /**
   * The biggest buy and sell of the day.
   *
   * The recent-trades list only reaches back a couple of hours on a busy day,
   * so this asks for significant trades instead, which reaches much further for
   * the same number of rows. The span is a consequence of how busy the market
   * was, not a window we chose, so whatever span the data actually covers is
   * printed rather than assumed.
   */
  const renderExtremes = async (): Promise<TaskResult> => {
    // renderTrades has already fetched the recent list this cycle; asking for
    // it again sent two byte-identical requests in the same batch and made the
    // rate limit arrive sooner for everyone.
    const [large, recent] = await Promise.all([
      getLargeTrades().catch(() => [] as Trade[]),
      lastTrades.length > 0 ? Promise.resolve(lastTrades) : getRecentTrades().catch(() => []),
    ]);

    // Merge and de-duplicate; the two queries overlap.
    const byHash = new Map<string, Trade>();
    for (const trade of [...large, ...recent]) byHash.set(trade.txHash, trade);
    const all = [...byHash.values()];
    if (all.length === 0) return 'failed';

    const oldest = Math.min(...all.map((trade) => trade.time));
    const hours = Math.max(1, Math.round((Date.now() - oldest) / 3_600_000));

    for (const side of ['buy', 'sell'] as const) {
      const panel = root.querySelector<HTMLElement>(`[data-biggest="${side}"]`);
      if (!panel) continue;

      const top = all.filter((trade) => trade.kind === side).sort((a, b) => b.usd - a.usd)[0];
      if (!top) continue;

      panel.hidden = false;
      const set = (key: string, value: string) => {
        const node = panel.querySelector<HTMLElement>(`[data-biggest-${key}]`);
        if (node) node.textContent = value;
      };
      set('tokens', `${formatCount(top.tokens, locale)} $IF`);
      set('usd', formatTradeUsd(top.usd, locale));
      set('wallet', shortWallet(top.wallet));
      set('time', timeAgo(top.time, locale));
      set('window', labels.windowHours(hours));

      const link = panel.querySelector<HTMLAnchorElement>('[data-biggest-link]');
      if (link) link.href = `${CHAIN.explorerUrl}/tx/${top.txHash}`;
    }

    renderPressure(all);
    return 'ok';
  };

  /**
   * Hourly buy and sell volume, from trades already fetched. No extra request.
   *
   * Only trades at or above `LARGE_TRADE_USD` are counted, and that filter is
   * the point rather than an optimisation. The list handed in is two queries
   * merged: one for trades over that size reaching back a day, and one for the
   * most recent trades of any size. Bucketing both together measured the last
   * couple of hours by one rule and the rest of the chart by another, so the
   * recent bars were inflated against everything beside them — in a chart whose
   * only job is comparing one hour to another.
   */
  const renderPressure = (trades: Trade[]) => {
    const panel = root.querySelector<HTMLElement>('[data-pressure]');
    const bars = root.querySelector<SVGGElement>('[data-pressure-bars]');
    if (!panel || !bars) return;

    const now = Date.now();
    const buckets = Array.from({ length: 24 }, () => ({ buy: 0, sell: 0 }));
    for (const trade of trades) {
      if (trade.usd < LARGE_TRADE_USD) continue;
      const hoursAgo = Math.floor((now - trade.time) / 3_600_000);
      if (hoursAgo < 0 || hoursAgo > 23) continue;
      buckets[23 - hoursAgo]![trade.kind] += trade.usd;
    }

    const peak = Math.max(...buckets.flatMap((b) => [b.buy, b.sell]), 1);
    const slot = 1000 / buckets.length;
    const mid = 80;
    const parts: SVGElement[] = [];

    for (const [index, bucket] of buckets.entries()) {
      for (const side of ['buy', 'sell'] as const) {
        const height = (bucket[side] / peak) * 74;
        if (height < 0.5) continue;
        const rect = document.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', (slot * index + slot * 0.18).toFixed(2));
        rect.setAttribute('width', (slot * 0.64).toFixed(2));
        rect.setAttribute('y', (side === 'buy' ? mid - height : mid).toFixed(2));
        rect.setAttribute('height', height.toFixed(2));
        rect.setAttribute('class', 'pressure-bar');
        rect.dataset.kind = side;
        parts.push(rect);
      }
    }

    const axis = document.createElementNS(SVG_NS, 'line');
    axis.setAttribute('x1', '0');
    axis.setAttribute('x2', '1000');
    axis.setAttribute('y1', String(mid));
    axis.setAttribute('y2', String(mid));
    axis.setAttribute('class', 'pressure-axis');
    parts.push(axis);

    bars.replaceChildren(...parts);
    panel.hidden = false;
  };

  /**
   * Holders, concentration and the attested checks.
   *
   * All of it comes from one keyless call on an origin the policy already
   * allows, which is why the holder count no longer has to be a build-time
   * snapshot refreshed by hand.
   */
  const renderTokenInfo = async (): Promise<TaskResult> => {
    const info = await getTokenInfo().catch(() => null);
    if (!info) return 'failed';

    if (info.holders !== undefined) {
      visitFigures.holders = info.holders;
      for (const node of root.querySelectorAll<HTMLElement>('[data-metric="holders"]')) {
        node.textContent = formatCount(info.holders, locale);
      }
    }

    if (info.holdersUpdated !== undefined) {
      const stamp = root.querySelector<HTMLElement>('[data-holders-updated]');
      if (stamp) {
        // Showing when it was last recounted means a stale figure reads as stale.
        stamp.textContent = `${labels.holdersUpdated} ${timeAgo(info.holdersUpdated * 1000, locale)}`;
      }
    }

    if (info.distribution) {
      const panel = root.querySelector<HTMLElement>('[data-concentration]');
      if (panel) {
        panel.hidden = false;
        for (const [band, share] of Object.entries(info.distribution)) {
          const segment = panel.querySelector<HTMLElement>(`[data-band="${band}"]`);
          if (segment) segment.style.setProperty('--share', `${share}%`);
          const value = panel.querySelector<HTMLElement>(`[data-band-value="${band}"]`);
          if (value) value.textContent = formatPercent(share, locale);
        }
      }
    }

    // Only fields that mean something on this chain are rendered. The response
    // also carries mint and freeze authority, which are Solana concepts and come
    // back null here — showing a null as a pass would be a false claim.
    // `supply` and `burn` used to be hardcoded `true` under a caption saying
    // these were attested by third parties. They were attested by nobody. Both
    // are now derived from the chain, and a failed read shows as unverified
    // rather than quietly passing — which is what our own scam article tells
    // readers to look out for.
    const [supply, burned, owner] = await Promise.all([
      getTotalSupply().catch(() => undefined),
      getBalanceOf(TOKEN.burnAddress).catch(() => undefined),
      getOwner().catch(() => undefined),
    ]);

    if (burned !== undefined) visitFigures.burned = burned;

    const marks: Record<string, boolean | undefined> = {
      verified: info.isVerified,
      honeypot: info.isHoneypot === undefined ? undefined : !info.isHoneypot,
      // True only if the supply on-chain still matches what the site publishes.
      supply: supply === undefined ? undefined : supply === TOKEN.totalSupply,
      burn: burned === undefined ? undefined : burned > 0,
      // Not a pass/fail: the row states whatever the chain says. A contract
      // with no owner function is the strong case, and an owned one is worth
      // saying plainly rather than leaving for somebody else to discover.
      owner: owner === undefined ? undefined : 'none' in owner,
    };

    for (const [check, passed] of Object.entries(marks)) {
      const row = root.querySelector<HTMLElement>(`[data-check="${check}"]`);
      if (!row || passed === undefined) continue;
      const mark = row.querySelector<HTMLElement>('.trust-mark');
      if (mark) mark.dataset.state = passed ? 'pass' : 'fail';
      const state = row.querySelector<HTMLElement>('[data-check-state]');
      if (state && passed) state.textContent = labels.checkPass;
    }

    // After the loop: this row says what the chain returned rather than a
    // generic "Confirmed", so it must not be overwritten by it.
    const ownerRow = root.querySelector<HTMLElement>('[data-check="owner"] [data-check-state]');
    if (ownerRow && owner) {
      ownerRow.textContent =
        'none' in owner
          ? labels.ownerNone
          : `${labels.ownerSome} ${owner.address.slice(0, 6)}…${owner.address.slice(-4)}`;
    }

    return 'ok';
  };

  /**
   * The burn curve.
   *
   * The committed history covers everything up to the block it was built at;
   * this tops it up with whatever the chain has seen since, so a fresh burn
   * shows without waiting for a deploy.
   */
  const renderBurns = async () => {
    const svg = root.querySelector<SVGSVGElement>('[data-burns]');
    if (!svg || BURNS.length === 0) return;

    let running = 0;
    const points = BURNS.map((burn) => {
      running += burn.tokens;
      return { time: burn.time, total: running, txHash: burn.txHash };
    });

    const newer = await getRecentBurns(BURNS_SCANNED_TO + 1).catch(() => []);
    for (const burn of newer) {
      running += burn.tokens;
      points.push({ time: Math.floor(Date.now() / 1000), total: running, txHash: '' });
    }

    const width = 1000;
    const height = 200;
    const first = points[0]!.time;
    const last = Math.max(points.at(-1)!.time, first + 1);
    const peak = running || 1;

    const x = (time: number) => ((time - first) / (last - first)) * width;
    const y = (total: number) => height - 8 - (total / peak) * (height - 24);

    // A stepped path: a burn is an instant jump, not a gradual slope.
    let d = `M0,${y(0).toFixed(2)}`;
    for (const point of points) {
      d += ` L${x(point.time).toFixed(2)},${y(point.total - 0).toFixed(2)}`;
    }
    d += ` L${width},${y(running).toFixed(2)}`;

    const line = svg.querySelector('[data-burns-line]');
    const area = svg.querySelector('[data-burns-area]');
    if (line) line.setAttribute('d', d);
    if (area) area.setAttribute('d', `${d} L${width},${height} L0,${height} Z`);

    // A dot per burn would be four hundred overlapping circles. Mark the
    // largest ones instead — those are the burns worth opening.
    const sizes = BURNS.map((burn) => burn.tokens).sort((a, b) => b - a);
    const floor = sizes[Math.min(29, sizes.length - 1)] ?? 0;

    const dots = svg.querySelector('[data-burns-dots]');
    if (dots) {
      const marks = points
        .filter((point, index) => point.txHash && (BURNS[index]?.tokens ?? 0) >= floor)
        .map((point) => {
          const anchor = document.createElementNS(SVG_NS, 'a');
          anchor.setAttribute('href', `${CHAIN.explorerUrl}/tx/${point.txHash}`);
          anchor.setAttribute('target', '_blank');
          anchor.setAttribute('rel', 'noopener noreferrer');
          // The dots are a mouse affordance on a chart that is itself role="img".
          // Thirty focusable 7px links inside an image are thirty silent tab
          // stops for a keyboard user; the same transactions are reachable as
          // real links in the burns list under the chart.
          anchor.setAttribute('tabindex', '-1');
          anchor.setAttribute('aria-hidden', 'true');

          const dot = document.createElementNS(SVG_NS, 'circle');
          dot.setAttribute('cx', x(point.time).toFixed(2));
          dot.setAttribute('cy', y(point.total).toFixed(2));
          dot.setAttribute('r', '3');
          dot.setAttribute('class', 'burn-dot');

          const title = document.createElementNS(SVG_NS, 'title');
          title.textContent = `${formatCompact(point.total, locale)} ${TOKEN.symbol}`;

          anchor.append(dot, title);
          return anchor;
        });
      dots.replaceChildren(...marks);
    }
  };

  let tick = 0;

  const refresh = async () => {
    // The first pass reads everything; after that the expensive calls take
    // every fourth turn. See SLOW_EVERY.
    const slow = tick % SLOW_EVERY === 0;
    tick += 1;

    const results = await Promise.allSettled([
      renderSnapshot(),
      // Redrawing under a pointer makes the chart jump while it is being read.
      chartPointer.isEngaged() || !slow
        ? Promise.resolve('skipped' as TaskResult)
        : renderChart((root.dataset.timeframe as Timeframe) ?? 'day', true),
      renderTrades(),
      slow ? renderExtremes() : Promise.resolve('skipped' as TaskResult),
      slow ? renderTokenInfo() : Promise.resolve('skipped' as TaskResult),
    ]);
    // A task that was skipped says nothing about whether the data is reachable,
    // so it does not count either way. The banner appears when everything that
    // actually tried, failed.
    const outcomes = results.map((result) =>
      result.status === 'fulfilled' ? result.value : 'failed',
    );
    const tried = outcomes.filter((outcome) => outcome !== 'skipped');
    const allFailed =
      tried.length > 0 && tried.every((outcome) => outcome === 'failed' || outcome === 'fallback');

    if (status) {
      status.hidden = !allFailed;
      if (allFailed) status.textContent = labels.failed;
    }

    // Announced once per cycle, after every task has had its turn, so the
    // panel compares a complete set of figures rather than a partial one.
    if (!announcedVisit && Object.keys(visitFigures).length > 0) {
      announcedVisit = true;
      document.dispatchEvent(new CustomEvent('if:stats', { detail: { ...visitFigures } }));
    }
  };

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-chart-type]')) {
    button.addEventListener('click', () => {
      root.dataset.chartType = button.dataset.chartType ?? 'candles';
      for (const other of root.querySelectorAll<HTMLButtonElement>('[data-chart-type]')) {
        other.setAttribute('aria-pressed', String(other === button));
      }
      // Remember the choice; it is a preference, not page state.
      remember('chartType', root.dataset.chartType);
      void renderChart((root.dataset.timeframe as Timeframe) ?? 'day');
    });
  }

  const savedType = recall('chartType');
  if (savedType === 'line' || savedType === 'candles') {
    root.dataset.chartType = savedType;
    for (const button of root.querySelectorAll<HTMLButtonElement>('[data-chart-type]')) {
      button.setAttribute('aria-pressed', String(button.dataset.chartType === savedType));
    }
  }

  /**
   * The timeframe chips.
   *
   * The pressed chip is a label for the data on screen, so it is only allowed to
   * move once there is data to match it. It used to be set on click and left
   * there whatever happened next: when the fetch failed the chart kept the
   * previous timeframe's candles under a chip reading 7D, which is a chart
   * lying about what it is showing.
   */
  const timeframeButtons = [...root.querySelectorAll<HTMLButtonElement>('button[data-timeframe]')];

  const markTimeframe = (timeframe: Timeframe) => {
    root.dataset.timeframe = timeframe;
    for (const button of timeframeButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.timeframe === timeframe));
    }
  };

  for (const button of timeframeButtons) {
    button.addEventListener('click', () => {
      const timeframe = button.dataset.timeframe as Timeframe;
      const showing = (root.dataset.timeframe as Timeframe) ?? 'day';
      if (timeframe === showing) return;

      // Busy while it is in flight, so a tap is visibly doing something even on
      // a slow connection.
      root.dataset.chartBusy = '';
      void renderChart(timeframe).then((result) => {
        delete root.dataset.chartBusy;
        // Only relabel if the chart really is showing that timeframe now.
        markTimeframe(result === 'failed' ? showing : timeframe);
        // Say it out loud rather than letting a chip snap back for no visible
        // reason. Reuses the banner the page already has for exactly this.
        if (result === 'failed' && status) {
          status.textContent = labels.failed;
          status.hidden = false;
        }
      });
    });
  }

  /*
   * Everything the pointer can do lives in ./chart-interaction.ts.
   *
   * It is handed functions rather than values because `loaded`, `view`, `shown`
   * and `lastBounds` are all reassigned as data arrives — a snapshot taken here
   * would be stale by the first redraw.
   */
  const chartPointer = attachChartInteraction({
    root,
    chart,
    priceScale,
    timeAxis,
    locale,
    candles: () => loaded,
    drawn: () => shown,
    bounds: () => lastBounds,
    currentView: () => view,
    setView: (next) => {
      view = next;
    },
    repaint: paint,
    rerender: () => void renderChart((root.dataset.timeframe as Timeframe) ?? 'day'),
    showOhlc,
  });

  /**
   * Keeping the page live without anyone reloading it.
   *
   * Polling on a timer alone is not enough: a tab left in the background for an
   * hour comes back showing hour-old numbers, and the timer keeps firing the
   * whole time it is hidden, which is both wasteful and the fastest way to get
   * rate-limited by a public API.
   *
   * So the loop stops while the tab is hidden and refreshes the moment it comes
   * back — which is the point at which somebody is actually looking.
   */
  let timer: number | undefined;

  const start = () => {
    if (timer !== undefined) return;
    timer = window.setInterval(() => void refresh(), REFRESH_MS);
  };

  const stop = () => {
    if (timer === undefined) return;
    window.clearInterval(timer);
    timer = undefined;
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      void refresh();
      start();
    }
  });

  // Coming back from another window, or from sleep, is the same situation.
  window.addEventListener('focus', () => void refresh());
  window.addEventListener('online', () => void refresh());

  void refresh();
  // The burn curve is committed history plus a small live top-up, so it does
  // not need redrawing on every tick.
  void renderBurns().catch(() => {
    /* The committed history still drew; only the live top-up was missed. */
  });
  start();
}

export type { Trade };
