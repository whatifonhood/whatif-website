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
  getPairSnapshot,
  getPriceHistory,
  getRecentTrades,
  type Candle,
  type Timeframe,
  type Trade,
} from '../lib/market.ts';
import { formatCompact, formatCount, formatUsd } from '../lib/format.ts';
import { CHAIN } from '../config/site.ts';

const REFRESH_MS = 20_000;

/** Transaction hashes already on screen, so new ones can be highlighted. */
const seenTrades = new Set<string>();

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Draws candlesticks into an SVG.
 *
 * A wick from low to high, a body from open to close, lime when the candle
 * closed up and warm when it closed down. Drawn by hand rather than with a
 * charting library, which would be several times the weight of the whole page.
 */
function drawCandles(svg: SVGSVGElement, candles: Candle[]): { high: number; low: number } {
  const width = 1000;
  const height = 260;
  const padY = 14;

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const span = max - min || max || 1;

  const y = (value: number) => padY + (1 - (value - min) / span) * (height - padY * 2);
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
function drawLine(svg: SVGSVGElement, candles: Candle[]): { high: number; low: number } {
  const width = 1000;
  const height = 260;
  const padY = 14;

  const closes = candles.map((c) => c.close);
  const max = Math.max(...candles.map((c) => c.high));
  const min = Math.min(...candles.map((c) => c.low));
  const span = max - min || max || 1;

  const x = (i: number) => (i / Math.max(1, candles.length - 1)) * width;
  const y = (value: number) => padY + (1 - (value - min) / span) * (height - padY * 2);

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
  const biggest = root.querySelector<HTMLElement>('[data-biggest]');
  const status = root.querySelector<HTMLElement>('[data-dash-status]');
  const labels = {
    buy: root.dataset.labelBuy ?? 'Buy',
    sell: root.dataset.labelSell ?? 'Sell',
    view: root.dataset.labelView ?? 'View',
    failed: root.dataset.labelFailed ?? '',
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

    const type = root.dataset.chartType === 'line' ? 'line' : 'candles';
    const bounds = type === 'line' ? drawLine(chart, candles) : drawCandles(chart, candles);
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

    // The biggest buy in the window we can see.
    const buys = trades.filter((trade) => trade.kind === 'buy');
    const top = buys.sort((a, b) => b.usd - a.usd)[0];
    if (top && biggest) {
      biggest.hidden = false;
      const set = (key: string, value: string) => {
        const node = biggest.querySelector<HTMLElement>(`[data-biggest-${key}]`);
        if (node) node.textContent = value;
      };
      set('tokens', `${formatCount(top.tokens, locale)} $IF`);
      set('usd', formatTradeUsd(top.usd, locale));
      set('wallet', shortWallet(top.wallet));
      set('time', timeAgo(top.time, locale));
      const link = biggest.querySelector<HTMLAnchorElement>('[data-biggest-link]');
      if (link) link.href = `${CHAIN.explorerUrl}/tx/${top.txHash}`;
    }
  };

  const refresh = async () => {
    const results = await Promise.allSettled([
      renderSnapshot(),
      renderChart((root.dataset.timeframe as Timeframe) ?? 'day'),
      renderTrades(),
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

  void refresh();
  window.setInterval(() => void refresh(), REFRESH_MS);
}

export type { Trade };
