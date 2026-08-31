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
  getLargeTrades,
  getPairSnapshot,
  getPriceHistory,
  getRecentBurns,
  getRecentTrades,
  getTokenInfo,
  type Candle,
  type Timeframe,
  type Trade,
} from '../lib/market.ts';
import { formatCompact, formatCount, formatPercent, formatUsd } from '../lib/format.ts';
import { BURNS, BURNS_SCANNED_TO } from '../config/burns.ts';
import { CHAIN, TOKEN } from '../config/site.ts';

const REFRESH_MS = 20_000;

/** Transaction hashes already on screen, so new ones can be highlighted. */
const seenTrades = new Set<string>();

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Price plot height. The volume lane sits underneath it. */
const PLOT_H = 252;
const VOL_TOP = 264;
const VOL_H = 52;

/**
 * Maps a price to a y position, linearly or logarithmically.
 *
 * A log axis makes equal percentage moves look equal, which is the honest way
 * to read a chart that has covered several orders of magnitude. Values are
 * floored at the smallest positive price first — a zero would take log to
 * negative infinity and blank the chart.
 */
function makeScale(min: number, max: number, log: boolean) {
  const padY = 14;
  const height = PLOT_H;
  if (log) {
    const lo = Math.log(Math.max(min, Number.MIN_VALUE));
    const hi = Math.log(Math.max(max, Number.MIN_VALUE));
    const span = hi - lo || 1;
    return (value: number) =>
      padY + (1 - (Math.log(Math.max(value, Number.MIN_VALUE)) - lo) / span) * (height - padY * 2);
  }
  const span = max - min || max || 1;
  return (value: number) => padY + (1 - (value - min) / span) * (height - padY * 2);
}

/** Volume bars under the price, coloured by whether the candle closed up. */
function drawVolume(svg: SVGSVGElement, candles: Candle[]): void {
  const layer = svg.querySelector('[data-volume]');
  if (!layer) return;

  const peak = Math.max(...candles.map((c) => c.volumeUsd), 1);
  const slot = 1000 / candles.length;
  const width = Math.max(1, Math.min(20, slot * 0.62));

  const bars = candles.map((candle, index) => {
    const height = (candle.volumeUsd / peak) * VOL_H;
    const bar = document.createElementNS(SVG_NS, 'rect');
    bar.setAttribute('x', (slot * (index + 0.5) - width / 2).toFixed(2));
    bar.setAttribute('width', width.toFixed(2));
    bar.setAttribute('y', (VOL_TOP + VOL_H - height).toFixed(2));
    bar.setAttribute('height', Math.max(0.5, height).toFixed(2));
    bar.setAttribute('class', 'vol-bar');
    bar.dataset.rising = String(candle.close >= candle.open);
    return bar;
  });
  layer.replaceChildren(...bars);
}

/**
 * Draws candlesticks into an SVG.
 *
 * A wick from low to high, a body from open to close, lime when the candle
 * closed up and warm when it closed down. Drawn by hand rather than with a
 * charting library, which would be several times the weight of the whole page.
 */
function drawCandles(
  svg: SVGSVGElement,
  candles: Candle[],
  log = false,
): { high: number; low: number } {
  const width = 1000;

  const max = Math.max(...candles.map((c) => c.high));
  const min = Math.min(...candles.map((c) => c.low));
  const y = makeScale(min, max, log);
  const slot = width / candles.length;
  const bodyWidth = Math.max(2, Math.min(22, slot * 0.62));

  const layer = svg.querySelector('[data-candles]');
  if (!layer) return { high: max, low: min };

  const parts: SVGElement[] = [];
  for (const [index, candle] of candles.entries()) {
    const centre = slot * (index + 0.5);
    const rising = candle.close >= candle.open;

    const wick = document.createElementNS(SVG_NS, 'line');
    wick.setAttribute('x1', centre.toFixed(2));
    wick.setAttribute('x2', centre.toFixed(2));
    wick.setAttribute('y1', y(candle.high).toFixed(2));
    wick.setAttribute('y2', y(candle.low).toFixed(2));
    wick.setAttribute('class', 'candle-wick');
    wick.dataset.rising = String(rising);

    const top = y(Math.max(candle.open, candle.close));
    const bottom = y(Math.min(candle.open, candle.close));
    const body = document.createElementNS(SVG_NS, 'rect');
    body.setAttribute('x', (centre - bodyWidth / 2).toFixed(2));
    body.setAttribute('y', top.toFixed(2));
    body.setAttribute('width', bodyWidth.toFixed(2));
    // A doji would be invisible at zero height.
    body.setAttribute('height', Math.max(1.5, bottom - top).toFixed(2));
    body.setAttribute('class', 'candle-body');
    body.dataset.rising = String(rising);

    parts.push(wick, body);
  }
  layer.replaceChildren(...parts);

  return { high: max, low: min };
}

/**
 * Trade sizes, not token prices.
 *
 * The shared formatter keeps four significant digits below a tenth of a cent so
 * memecoin prices stay meaningful — but applied to a dust trade that renders as
 * "$0.000000002497", which is noise in a feed of dollar amounts.
 */
function formatTradeUsd(value: number, locale: string): string {
  return value < 0.01 ? '<$0.01' : formatUsd(value, locale);
}

/**
 * Draws a closing-price line with an area fill, for people who find candles
 * noisy. Same data, same scale — only the marks change.
 */
function drawLine(
  svg: SVGSVGElement,
  candles: Candle[],
  log = false,
): { high: number; low: number } {
  const width = 1000;
  const height = PLOT_H;

  const closes = candles.map((c) => c.close);
  const max = Math.max(...candles.map((c) => c.high));
  const min = Math.min(...candles.map((c) => c.low));

  const x = (i: number) => (i / Math.max(1, candles.length - 1)) * width;
  const y = makeScale(min, max, log);

  const path = closes
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(2)},${y(c).toFixed(2)}`)
    .join(' ');

  const layer = svg.querySelector('[data-candles]');
  if (!layer) return { high: max, low: min };

  const area = document.createElementNS(SVG_NS, 'path');
  area.setAttribute('d', `${path} L${width},${height} L0,${height} Z`);
  area.setAttribute('class', 'line-area');

  const line = document.createElementNS(SVG_NS, 'path');
  line.setAttribute('d', path);
  line.setAttribute('class', 'line-stroke');

  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('r', '4');
  dot.setAttribute('cx', x(candles.length - 1).toFixed(2));
  dot.setAttribute('cy', y(closes[closes.length - 1] ?? min).toFixed(2));
  dot.setAttribute('class', 'line-dot');

  layer.replaceChildren(area, line, dot);
  return { high: max, low: min };
}

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
  const status = root.querySelector<HTMLElement>('[data-dash-status]');
  const labels = {
    buy: root.dataset.labelBuy ?? 'Buy',
    sell: root.dataset.labelSell ?? 'Sell',
    view: root.dataset.labelView ?? 'View',
    failed: root.dataset.labelFailed ?? '',
    holdersUpdated: root.dataset.labelHoldersUpdated ?? '',
    checkPass: root.dataset.labelCheckPass ?? '',
    windowHours: (hours: number) =>
      (root.dataset.labelWindow ?? '').replace('{hours}', String(hours)),
  };

  const setText = (key: string, value: string) => {
    for (const node of root.querySelectorAll<HTMLElement>(`[data-metric="${key}"]`)) {
      node.textContent = value;
    }
  };

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
  /** Set while a pointer is on the chart, so a refresh cannot yank it away. */
  let holding = false;

  const renderSnapshot = async () => {
    const snapshot = await getPairSnapshot();
    if (snapshot.priceUsd !== undefined) setText('price', formatUsd(snapshot.priceUsd, locale));
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
  };

  const renderChart = async (timeframe: Timeframe) => {
    if (!chart) return;
    const candles = await getPriceHistory(timeframe);
    if (candles.length < 2) return;

    shown = candles;
    const type = root.dataset.chartType === 'line' ? 'line' : 'candles';
    const log = root.dataset.logScale === 'true';
    const bounds =
      type === 'line' ? drawLine(chart, candles, log) : drawCandles(chart, candles, log);
    drawVolume(chart, candles);
    chart.dataset.type = type;
    if (chartHigh) chartHigh.textContent = formatUsd(bounds.high, locale);
    if (chartLow) chartLow.textContent = formatUsd(bounds.low, locale);

    // Lime when the window closed up, warm when it closed down.
    const rising = (candles.at(-1)?.close ?? 0) >= (candles[0]?.open ?? 0);
    chart.dataset.direction = rising ? 'up' : 'down';
  };

  const renderTrades = async () => {
    if (!feed) return;
    const trades = await getRecentTrades();
    if (trades.length === 0) return;

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

    const stamp = root.querySelector<HTMLElement>('[data-feed-updated]');
    if (stamp) {
      stamp.textContent = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date());
    }
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
  const renderExtremes = async () => {
    const [large, recent] = await Promise.all([
      getLargeTrades().catch(() => [] as Trade[]),
      getRecentTrades().catch(() => [] as Trade[]),
    ]);

    // Merge and de-duplicate; the two queries overlap.
    const byHash = new Map<string, Trade>();
    for (const trade of [...large, ...recent]) byHash.set(trade.txHash, trade);
    const all = [...byHash.values()];
    if (all.length === 0) return;

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
  };

  /** Hourly buy and sell volume, from trades already fetched. No extra request. */
  const renderPressure = (trades: Trade[]) => {
    const panel = root.querySelector<HTMLElement>('[data-pressure]');
    const bars = root.querySelector<SVGGElement>('[data-pressure-bars]');
    if (!panel || !bars) return;

    const now = Date.now();
    const buckets = Array.from({ length: 24 }, () => ({ buy: 0, sell: 0 }));
    for (const trade of trades) {
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
  const renderTokenInfo = async () => {
    const info = await getTokenInfo();

    if (info.holders !== undefined) {
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
    const marks: Record<string, boolean | undefined> = {
      verified: info.isVerified,
      honeypot: info.isHoneypot === undefined ? undefined : !info.isHoneypot,
      supply: true,
      burn: true,
    };
    for (const [check, passed] of Object.entries(marks)) {
      const row = root.querySelector<HTMLElement>(`[data-check="${check}"]`);
      if (!row || passed === undefined) continue;
      const mark = row.querySelector<HTMLElement>('.trust-mark');
      if (mark) mark.dataset.state = passed ? 'pass' : 'fail';
      const state = row.querySelector<HTMLElement>('[data-check-state]');
      if (state && passed) state.textContent = labels.checkPass;
    }
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

  const refresh = async () => {
    const results = await Promise.allSettled([
      renderSnapshot(),
      // Redrawing under a pointer makes the chart jump while it is being read.
      holding ? Promise.resolve() : renderChart((root.dataset.timeframe as Timeframe) ?? 'day'),
      renderTrades(),
      renderExtremes(),
      renderTokenInfo(),
    ]);
    const everythingFailed = results.every((result) => result.status === 'rejected');
    if (status) {
      status.hidden = !everythingFailed;
      if (everythingFailed) status.textContent = labels.failed;
    }
  };

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-chart-type]')) {
    button.addEventListener('click', () => {
      root.dataset.chartType = button.dataset.chartType ?? 'candles';
      for (const other of root.querySelectorAll<HTMLButtonElement>('[data-chart-type]')) {
        other.setAttribute('aria-pressed', String(other === button));
      }
      // Remember the choice; it is a preference, not page state.
      try {
        localStorage.setItem('whatif.chartType', root.dataset.chartType);
      } catch {
        /* storage unavailable — the choice just will not persist */
      }
      void renderChart((root.dataset.timeframe as Timeframe) ?? 'day');
    });
  }

  try {
    const saved = localStorage.getItem('whatif.chartType');
    if (saved === 'line' || saved === 'candles') {
      root.dataset.chartType = saved;
      for (const button of root.querySelectorAll<HTMLButtonElement>('[data-chart-type]')) {
        button.setAttribute('aria-pressed', String(button.dataset.chartType === saved));
      }
    }
  } catch {
    /* storage unavailable */
  }

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-timeframe]')) {
    button.addEventListener('click', () => {
      const timeframe = button.dataset.timeframe as Timeframe;
      root.dataset.timeframe = timeframe;
      for (const other of root.querySelectorAll<HTMLButtonElement>('[data-timeframe]')) {
        other.setAttribute('aria-pressed', String(other === button));
      }
      void renderChart(timeframe);
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
  const tip = root.querySelector<HTMLElement>('[data-tip]');

  const hideCrosshair = () => {
    holding = false;
    crosshair?.setAttribute('opacity', '0');
    if (tip) tip.hidden = true;
  };

  const moveCrosshair = (event: PointerEvent) => {
    if (!wrap || !chart || !crosshair || !tip || shown.length === 0) return;
    const box = wrap.getBoundingClientRect();
    const ratio = Math.min(0.999, Math.max(0, (event.clientX - box.left) / box.width));
    const index = Math.min(shown.length - 1, Math.floor(ratio * shown.length));
    const candle = shown[index];
    if (!candle) return;

    holding = true;
    crosshair.setAttribute('opacity', '1');
    const centre = ((index + 0.5) / shown.length) * 1000;
    crosshair.setAttribute('x1', centre.toFixed(2));
    crosshair.setAttribute('x2', centre.toFixed(2));

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

  wrap?.addEventListener('pointermove', moveCrosshair);
  wrap?.addEventListener('pointerdown', moveCrosshair);
  wrap?.addEventListener('pointerleave', hideCrosshair);
  wrap?.addEventListener('pointercancel', hideCrosshair);

  const logButton = root.querySelector<HTMLButtonElement>('[data-chart-log]');
  logButton?.addEventListener('click', () => {
    const next = root.dataset.logScale !== 'true';
    root.dataset.logScale = String(next);
    logButton.setAttribute('aria-pressed', String(next));
    try {
      localStorage.setItem('whatif.chartLog', String(next));
    } catch {
      /* storage unavailable — the choice just will not persist */
    }
    void renderChart((root.dataset.timeframe as Timeframe) ?? 'day');
  });

  try {
    if (localStorage.getItem('whatif.chartLog') === 'true') {
      root.dataset.logScale = 'true';
      logButton?.setAttribute('aria-pressed', 'true');
    }
  } catch {
    /* storage unavailable */
  }

  void refresh();
  // The burn curve is committed history plus a small top-up; it does not need
  // to be redrawn every twenty seconds.
  void renderBurns().catch(() => {
    /* The committed history still drew; only the live top-up was missed. */
  });
  window.setInterval(() => void refresh(), REFRESH_MS);
}

export type { Trade };
