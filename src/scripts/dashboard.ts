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
import { recall, remember, type PrefKey } from '../lib/preferences.ts';
import {
  CHART_H,
  PLOT_H,
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
type TaskResult = 'ok' | 'failed' | 'skipped';

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
  /** Set while a pointer is on the chart, so a refresh cannot yank it away. */
  let holding = false;

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
        return 'ok';
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
      holding || panFrom || !slow
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
    const allFailed = tried.length > 0 && tried.every((outcome) => outcome === 'failed');

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

  /**
   * The crosshair.
   *
   * The chart stretches to fill its box, so a pointer position maps to a candle
   * by proportion rather than by pixels. Works with touch as well as a mouse,
   * which is most of the traffic.
   */
  const wrap = root.querySelector<HTMLElement>('[data-chart-wrap]');
  const crosshair = chart?.querySelector<SVGLineElement>('[data-crosshair]');
  const crosshairY = chart?.querySelector<SVGLineElement>('[data-crosshair-y]');
  const tip = root.querySelector<HTMLElement>('[data-tip]');

  /** The two tags that ride the scales with the pointer. */
  const priceTag = document.createElement('span');
  priceTag.className = 'scale-tag';
  const timeTag = document.createElement('span');
  timeTag.className = 'scale-tag';

  const hideCrosshair = () => {
    holding = false;
    crosshair?.setAttribute('opacity', '0');
    crosshairY?.setAttribute('opacity', '0');
    priceTag.remove();
    timeTag.remove();
    if (tip) tip.hidden = true;
    // Back to the most recent candle, so the row is never blank.
    showOhlc(shown[shown.length - 1]);
  };

  const moveCrosshair = (event: PointerEvent) => {
    if (!wrap || !chart || !crosshair || !tip || shown.length === 0) return;
    // While dragging, the pointer is moving the chart, not reading it.
    if (wrap.dataset.panning === 'true') return;
    // Measured against the PLOT, not the wrapper: the wrapper now reserves
    // padding for the two scales, and including it would offset every reading.
    const box = chart.getBoundingClientRect();
    const ratio = Math.min(0.999, Math.max(0, (event.clientX - box.left) / box.width));
    const index = Math.min(shown.length - 1, Math.floor(ratio * shown.length));
    const candle = shown[index];
    if (!candle) return;

    holding = true;
    crosshair.setAttribute('opacity', '1');
    const centre = ((index + 0.5) / shown.length) * 1000;
    crosshair.setAttribute('x1', centre.toFixed(2));
    crosshair.setAttribute('x2', centre.toFixed(2));

    /*
     * The horizontal arm follows the POINTER, not the candle.
     *
     * That is what a crosshair is for: reading off any price on the scale, not
     * only the one the candle closed at. The price it names is derived by
     * inverting the same scale the candles were drawn with, so it agrees with
     * the axis whether the chart is linear or logarithmic.
     */
    const withinPlot = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height));
    const plotY = withinPlot * CHART_H;
    if (crosshairY) {
      crosshairY.setAttribute('y1', plotY.toFixed(2));
      crosshairY.setAttribute('y2', plotY.toFixed(2));
      crosshairY.setAttribute('opacity', plotY <= PLOT_H ? '1' : '0');
    }

    if (priceScale && plotY <= PLOT_H) {
      const padY = 14;
      const usable = PLOT_H - padY * 2;
      const fraction = 1 - (plotY - padY) / usable;
      const log = root.dataset.logScale === 'true';
      const at = log
        ? Math.exp(
            Math.log(Math.max(lastBounds.low, Number.MIN_VALUE)) +
              fraction *
                (Math.log(Math.max(lastBounds.high, Number.MIN_VALUE)) -
                  Math.log(Math.max(lastBounds.low, Number.MIN_VALUE))),
          )
        : lastBounds.low + fraction * (lastBounds.high - lastBounds.low);
      priceTag.style.top = `${(plotY / CHART_H) * 100}%`;
      priceTag.textContent = formatUsd(at, locale);
      priceScale.append(priceTag);
    } else {
      priceTag.remove();
    }

    if (timeAxis) {
      timeTag.style.left = `${(centre / 1000) * 100}%`;
      timeTag.textContent = new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(candle.time * 1000));
      timeAxis.append(timeTag);
    }

    showOhlc(candle);

    const change = ((candle.close - candle.open) / candle.open) * 100;
    tip.replaceChildren();

    const when = document.createElement('b');
    when.textContent = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(candle.time * 1000));

    const price = document.createElement('span');
    price.textContent = formatUsd(candle.close, locale);

    const move = document.createElement('span');
    move.dataset.tipChange = '';
    move.dataset.direction = change >= 0 ? 'up' : 'down';
    move.textContent = `  ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;

    const volume = document.createElement('b');
    volume.textContent = `vol ${formatCompact(candle.volumeUsd, locale)}`;

    tip.append(when, price, move, volume);
    tip.hidden = false;
    // Keep the tooltip inside the chart rather than letting it hang off an edge.
    const clamped = Math.min(box.width - 80, Math.max(80, event.clientX - box.left));
    tip.style.left = `${clamped}px`;
  };

  /**
   * Zooming and panning.
   *
   * The whole series is already in memory, so both just move the window and
   * redraw — no request, no waiting, and the API is untouched however much
   * somebody scrubs around.
   */
  /** The narrowest window the chart will zoom to, in candles. */
  const MIN_SPAN = 8;

  /**
   * Put `width` candles on screen, with candle `index` sitting at `ratio`
   * across the plot.
   *
   * Both zoom gestures land here, because both are the same question asked
   * twice: how wide is the window, and what stays put while it changes. The
   * wheel keeps the candle under the cursor still; a pinch keeps the candle
   * between the two fingers still.
   *
   * Work out the new width first, then place it — clamping the width and the
   * position separately is what keeps this in range. Clamping the two edges
   * independently could leave start past end, which drew an empty chart.
   */
  const placeView = (index: number, ratio: number, width: number) => {
    const total = loaded.length;
    if (total < 2) return;

    const w = Math.max(MIN_SPAN, Math.min(total, Math.round(width)));
    const start = Math.max(0, Math.min(total - w, Math.round(index - ratio * w)));

    view = { start, end: start + w };
    paint();
  };

  const zoomAt = (ratio: number, factor: number) => {
    const span = view.end - view.start;
    placeView(view.start + ratio * span, ratio, span * factor);
  };

  wrap?.addEventListener(
    'wheel',
    (event) => {
      if (loaded.length < 2) return;

      /*
       * The wheel zooms. Plainly, with no modifier held.
       *
       * It used to demand ctrl or cmd, on the reasoning that swallowing every
       * wheel event would trap somebody scrolling down the page. True, but the
       * cure was worse: a chart that does nothing when you scroll on it reads as
       * broken, because every other chart on the internet zooms.
       *
       * The trap is avoided by giving the scroll back at the limits instead.
       * Zoom out to the full range and the next scroll down goes to the page;
       * zoom all the way in and the next scroll up does too. So the chart is
       * never a hole you cannot scroll out of, and it still zooms on a plain
       * wheel the way it should.
       */
      const out = event.deltaY > 0;
      const span = view.end - view.start;
      const spent = out ? span >= loaded.length : span <= MIN_SPAN;
      if (spent) return;

      event.preventDefault();
      const box = wrap.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width));
      zoomAt(ratio, out ? 1.18 : 0.85);
    },
    { passive: false },
  );

  let panFrom: { x: number; start: number; end: number } | null = null;

  /**
   * How far a pointer travels before a touch counts as a drag rather than a read.
   *
   * A finger has no hover state, so every touch on the chart begins with a
   * `pointerdown`. Declaring the pan on that first event meant every tap was a
   * drag, `panning` was set before the crosshair handler ever ran, and the
   * crosshair, the tooltip and the OHLC readout — the things that make the
   * chart readable rather than decorative — could not be reached by a finger at
   * all. A mouse never showed it, because a mouse moves without a button down.
   */
  const PAN_SLOP = 6;

  /**
   * Pinch to zoom.
   *
   * A phone has no wheel, so until this existed the only way to zoom on a touch
   * screen was the small +/- pair in the toolbar — and a finger reaches for a
   * pinch first. That also made the drag look broken rather than merely
   * unzoomed: panning is a no-op while the whole range is already on screen, so
   * somebody who could not zoom in could never pan either, and the chart
   * ignored every gesture they tried.
   *
   * `touch-action: pan-y` on the wrap is what makes this reachable. It leaves
   * vertical scrolling to the browser and keeps the page's own pinch-zoom off
   * this element, so both fingers arrive here as ordinary pointer events.
   */
  const pointers = new Map<number, number>();
  /** Where the pinch began: finger gap, plus the candle held still between them. */
  let pinchFrom: { gap: number; ratio: number; span: number; anchor: number } | null = null;

  /** The gap between the two fingers, in CSS pixels. */
  const fingerGap = (): number => {
    const [a, b] = [...pointers.values()];
    return a === undefined || b === undefined ? 0 : Math.abs(a - b);
  };

  /** Where the midpoint between the fingers falls across the plot, 0 to 1. */
  const fingerRatio = (): number => {
    const [a, b] = [...pointers.values()];
    if (a === undefined || b === undefined || !wrap) return 0.5;
    const box = wrap.getBoundingClientRect();
    return Math.min(1, Math.max(0, ((a + b) / 2 - box.left) / box.width));
  };

  wrap?.addEventListener('pointerdown', (event) => {
    if (loaded.length < 2) return;
    pointers.set(event.pointerId, event.clientX);

    if (pointers.size === 2) {
      // A second finger turns a drag into a pinch. The half-finished drag is
      // abandoned rather than blended in, or the chart lurches sideways as the
      // second finger lands.
      panFrom = null;
      const span = view.end - view.start;
      const ratio = fingerRatio();
      pinchFrom = { gap: fingerGap(), ratio, span, anchor: view.start + ratio * span };
      if (wrap) wrap.dataset.panning = 'true';
      hideCrosshair();
      return;
    }

    panFrom = { x: event.clientX, start: view.start, end: view.end };
  });

  wrap?.addEventListener('pointermove', (event) => {
    if (pointers.has(event.pointerId)) pointers.set(event.pointerId, event.clientX);

    if (pinchFrom) {
      const gap = fingerGap();
      // Fingers apart means fewer candles across the same width, so the window
      // narrows by the same proportion the gap widened.
      if (gap > 0 && pinchFrom.gap > 0) {
        placeView(pinchFrom.anchor, pinchFrom.ratio, pinchFrom.span * (pinchFrom.gap / gap));
      }
      return;
    }

    if (!panFrom || !wrap) return;
    // The drag starts only once the pointer has actually gone somewhere; until
    // then the move belongs to the crosshair, which runs after this handler.
    if (wrap.dataset.panning !== 'true') {
      if (Math.abs(event.clientX - panFrom.x) < PAN_SLOP) return;
      wrap.dataset.panning = 'true';
      // The tap that began this drag put a crosshair on a candle. Once it turns
      // out to be a drag, that reading is of a candle the pointer has left.
      hideCrosshair();
    }
    const box = wrap.getBoundingClientRect();
    const span = panFrom.end - panFrom.start;
    // Move by whole candles, in the opposite direction to the drag.
    const shift = ((panFrom.x - event.clientX) / box.width) * span;
    // Move the window, then clamp its position — never its edges separately.
    const start = Math.max(0, Math.min(loaded.length - span, panFrom.start + shift));
    view = { start, end: start + span };
    paint();
  });

  const endPan = (event?: PointerEvent) => {
    if (event) pointers.delete(event.pointerId);
    // A pinch is over when a finger leaves. The one still down does not take
    // over the drag: it has travelled since the pinch began, and resuming from
    // that stale origin threw the chart across the screen.
    if (pointers.size < 2) pinchFrom = null;
    panFrom = null;
    if (wrap && pointers.size === 0) delete wrap.dataset.panning;
  };
  wrap?.addEventListener('pointerup', endPan);
  wrap?.addEventListener('pointercancel', endPan);
  wrap?.addEventListener('pointerleave', endPan);

  // Double-click is the universal "put it back".
  wrap?.addEventListener('dblclick', () => {
    view = { start: 0, end: loaded.length };
    paint();
  });

  root.querySelector('[data-chart-reset]')?.addEventListener('click', () => {
    view = { start: 0, end: loaded.length };
    paint();
  });

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-chart-zoom]')) {
    button.addEventListener('click', () => {
      zoomAt(0.5, button.dataset.chartZoom === 'in' ? 0.7 : 1.4);
    });
  }

  /**
   * A toolbar button that flips a flag, remembers it, and redraws.
   *
   * There were three of these written out longhand — moving average, EMA and
   * log scale — each about fifteen near-identical lines. The EMA one saved
   * under the moving average's key, so turning the EMA on quietly changed a
   * different setting, and the EMA's own state was never restored because
   * nobody wrote the matching read. Both are what a copied block with one
   * identifier left behind looks like once it has been in the file a while.
   *
   * Written once and called three times, that particular mistake has nowhere
   * left to happen: the key is an argument, given at the call site, next to the
   * flag it belongs to.
   */
  const wireToggle = (
    selector: string,
    pref: PrefKey,
    flag: 'showAverage' | 'showEma' | 'logScale',
    redraw: () => void,
  ) => {
    const button = root.querySelector<HTMLButtonElement>(selector);
    if (!button) return;

    button.addEventListener('click', () => {
      const next = root.dataset[flag] !== 'true';
      root.dataset[flag] = String(next);
      button.setAttribute('aria-pressed', String(next));
      remember(pref, String(next));
      redraw();
    });

    if (recall(pref) === 'true') {
      root.dataset[flag] = 'true';
      button.setAttribute('aria-pressed', 'true');
    }
  };

  // The overlays only change what is drawn over the candles, so they repaint.
  wireToggle('[data-chart-average]', 'chartAverage', 'showAverage', paint);
  wireToggle('[data-chart-ema]', 'chartEma', 'showEma', paint);

  wrap?.addEventListener('pointermove', moveCrosshair);
  wrap?.addEventListener('pointerdown', moveCrosshair);
  wrap?.addEventListener('pointerleave', hideCrosshair);
  wrap?.addEventListener('pointercancel', hideCrosshair);

  /**
   * Resizing the chart by dragging.
   *
   * A fixed "expand" button gives you one other size, which is rarely the one
   * you want. The grip lets you set any height between a glance and most of the
   * screen, and remembers it.
   *
   * It is a real slider element underneath, so arrow keys work and a screen
   * reader announces it — a bare draggable div would be neither.
   */
  const MIN_H = 240;
  const MAX_H = 760;
  const grip = root.querySelector<HTMLElement>('[data-chart-grip]');
  const chartWrap = root.querySelector<HTMLElement>('[data-chart-wrap]');

  const applyHeight = (height: number) => {
    const clamped = Math.round(Math.min(MAX_H, Math.max(MIN_H, height)));
    root.style.setProperty('--chart-height', `${clamped}px`);
    grip?.setAttribute('aria-valuenow', String(clamped));
    remember('chartHeight', String(clamped));
    return clamped;
  };

  if (grip && chartWrap) {
    let dragging = false;

    const onMove = (event: PointerEvent) => {
      if (!dragging) return;
      // Height is the pointer's distance from the top of the plot, so the edge
      // stays under the finger however far it travels.
      applyHeight(event.clientY - chartWrap.getBoundingClientRect().top);
    };

    const stop = () => {
      dragging = false;
      grip.removeAttribute('data-dragging');
      window.removeEventListener('pointermove', onMove);
    };

    grip.addEventListener('pointerdown', (event) => {
      dragging = true;
      grip.dataset.dragging = 'true';
      // Listener first: if capture throws the drag must still work, and capture
      // is only an optimisation for keeping events on the grip.
      window.addEventListener('pointermove', onMove);
      try {
        grip.setPointerCapture(event.pointerId);
      } catch {
        /* not supported here; the window listener covers it */
      }
      event.preventDefault();
    });
    // Releasing outside the grip must end the drag too.
    window.addEventListener('pointerup', stop);
    grip.addEventListener('pointerup', stop);
    grip.addEventListener('pointercancel', stop);

    grip.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 60 : 20;
      const current = Number(grip.getAttribute('aria-valuenow')) || MIN_H;
      // Left/Right as well as Up/Down: a slider that ignores half the arrow
      // keys is a slider some people cannot move.
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') applyHeight(current - step);
      else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') applyHeight(current + step);
      else if (event.key === 'PageUp') applyHeight(current - 100);
      else if (event.key === 'PageDown') applyHeight(current + 100);
      else if (event.key === 'Home') applyHeight(MIN_H);
      else if (event.key === 'End') applyHeight(MAX_H);
      else return;
      event.preventDefault();
    });

    const savedHeight = Number(recall('chartHeight'));
    if (Number.isFinite(savedHeight) && savedHeight > 0) applyHeight(savedHeight);
  }

  // A log scale changes the axis, not just an overlay, so this one re-renders.
  wireToggle('[data-chart-log]', 'chartLog', 'logScale', () => {
    void renderChart((root.dataset.timeframe as Timeframe) ?? 'day');
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
