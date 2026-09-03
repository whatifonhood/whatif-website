/**
 * Everything that turns candles into SVG.
 *
 * These were the first four hundred lines of dashboard.ts, in front of the
 * function that uses them. They came out because they have nothing to do with
 * the dashboard: none of them reads a preference, touches the page, or knows
 * which timeframe is on screen. Each is handed a element, some candles and a
 * scale, and draws. That makes them the part of the chart you can reason about
 * on its own — and the part worth testing directly, which was impossible while
 * they were locked inside a module that starts a polling loop on import.
 *
 * The co-ordinate space is fixed by the SVG viewBox in Stats.astro: 1000 wide,
 * 320 tall, with the price plot in the top 252 and the volume bars below it.
 * Nothing here reads real pixels, so the whole thing scales with the element.
 */
import type { Candle } from '../lib/market.ts';
import { formatUsd } from '../lib/format.ts';

export const SVG_NS = 'http://www.w3.org/2000/svg';

/** Price plot height. The volume lane sits underneath it. */
export const PLOT_H = 252;
/** The SVG's full height, price lane plus volume lane. */
export const CHART_H = 320;
export const VOL_TOP = 264;
export const VOL_H = 52;

/**
 * Maps a price to a y position, linearly or logarithmically.
 *
 * A log axis makes equal percentage moves look equal, which is the honest way
 * to read a chart that has covered several orders of magnitude. Values are
 * floored at the smallest positive price first — a zero would take log to
 * negative infinity and blank the chart.
 */
export function makeScale(min: number, max: number, log: boolean) {
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

/**
 * Round price levels to label an axis with.
 *
 * A scale reading 0.008173, 0.008460, 0.008747 is arithmetically correct and
 * useless — the eye cannot place a price against it. These are the round
 * numbers a person would have chosen: 1, 2, 2.5 or 5 times a power of ten,
 * whichever gives roughly the requested number of lines inside the range.
 */
export function niceLevels(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [];
  const rough = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= rough) ??
    10 * magnitude;

  const levels: number[] = [];
  for (let value = Math.ceil(min / step) * step; value <= max; value += step) {
    levels.push(Number(value.toFixed(12)));
  }
  return levels;
}

/**
 * The price scale down the right, and the lines it names across the plot.
 *
 * On a log axis the levels are placed by the same scale the candles use, so a
 * line always sits exactly where its price is rather than where a linear
 * reading of the label would put it.
 */
export function drawPriceScale(
  svg: SVGSVGElement,
  scaleEl: HTMLElement | null,
  min: number,
  max: number,
  y: (value: number) => number,
  locale: string,
): void {
  const grid = svg.querySelector('[data-grid]');
  if (grid) grid.replaceChildren();
  if (scaleEl) scaleEl.replaceChildren();
  if (!(max > min)) return;

  const levels = niceLevels(min, max);
  const lines: SVGElement[] = [];

  for (const level of levels) {
    const at = y(level);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('x2', '1000');
    line.setAttribute('y1', at.toFixed(2));
    line.setAttribute('y2', at.toFixed(2));
    line.setAttribute('class', 'grid-line');
    lines.push(line);

    if (scaleEl) {
      const label = document.createElement('span');
      // The scale is positioned over the price lane only, so a percentage of
      // PLOT_H puts a label exactly on its own line however tall the box is.
      label.style.top = `${(at / CHART_H) * 100}%`;
      label.textContent = formatUsd(level, locale);
      scaleEl.append(label);
    }
  }
  grid?.append(...lines);
}

/**
 * The dates along the bottom.
 *
 * How many, and how precise, follows the window: hours within a day, days
 * within a quarter, months beyond that.
 */
export function drawTimeAxis(axis: HTMLElement | null, candles: Candle[], locale: string): void {
  if (!axis) return;
  axis.replaceChildren();
  if (candles.length < 2) return;

  const span = (candles[candles.length - 1]!.time - candles[0]!.time) * 1000;
  const day = 86_400_000;
  const format = new Intl.DateTimeFormat(locale, {
    ...(span <= 2 * day
      ? { hour: '2-digit', minute: '2-digit' }
      : span <= 120 * day
        ? { day: 'numeric', month: 'short' }
        : { month: 'short', year: '2-digit' }),
  });

  const wanted = 5;
  const step = Math.max(1, Math.floor(candles.length / wanted));
  for (let i = Math.floor(step / 2); i < candles.length; i += step) {
    const candle = candles[i];
    if (!candle) continue;
    const label = document.createElement('span');
    label.style.left = `${((i + 0.5) / candles.length) * 100}%`;
    label.textContent = format.format(new Date(candle.time * 1000));
    axis.append(label);
  }
}

/** An exponential moving average, which reacts faster than a flat one. */
export function drawEma(
  svg: SVGSVGElement,
  candles: Candle[],
  y: (v: number) => number,
  period = 21,
): void {
  const layer = svg.querySelector('[data-ema]');
  if (!layer) return;
  layer.replaceChildren();
  if (candles.length < period) return;

  const k = 2 / (period + 1);
  let ema = candles.slice(0, period).reduce((sum, c) => sum + c.close, 0) / period;
  const points: string[] = [];
  for (const [index, candle] of candles.entries()) {
    if (index >= period) ema = candle.close * k + ema * (1 - k);
    if (index < period - 1) continue;
    const x = ((index + 0.5) / candles.length) * 1000;
    points.push(`${points.length === 0 ? 'M' : 'L'}${x.toFixed(2)},${y(ema).toFixed(2)}`);
  }

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', points.join(' '));
  path.setAttribute('class', 'ema-line');
  layer.append(path);
}

/** Volume bars under the price, coloured by whether the candle closed up. */
export function drawVolume(svg: SVGSVGElement, candles: Candle[]): void {
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
export function drawCandles(
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
export function drawLine(
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

/**
 * A moving average over the visible candles.
 *
 * Averaged over the window on screen, so zooming in gives a line that follows
 * what you are actually looking at rather than one computed once and stretched.
 */
export function drawAverage(
  svg: SVGSVGElement,
  candles: Candle[],
  y: (value: number) => number,
  period: number,
): void {
  const layer = svg.querySelector('[data-average]');
  if (!layer) return;
  layer.replaceChildren();
  if (candles.length < period) return;

  const width = 1000;
  const step = width / candles.length;
  const points: string[] = [];

  for (let i = period - 1; i < candles.length; i += 1) {
    let sum = 0;
    for (let back = 0; back < period; back += 1) sum += candles[i - back]!.close;
    points.push(`${(step * (i + 0.5)).toFixed(2)},${y(sum / period).toFixed(2)}`);
  }
  if (points.length < 2) return;

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', `M${points.join(' L')}`);
  path.setAttribute('class', 'ma-line');
  layer.append(path);
}

/**
 * Burns, marked where they happened.
 *
 * Only the ones inside the visible window, so zooming in reveals individual
 * burns rather than a smear of ticks across the whole axis.
 */
export function drawBurnMarks(
  svg: SVGSVGElement,
  candles: Candle[],
  burns: { time: number; tokens: number }[],
  locale: string,
  /** e.g. "{amount} burned", from the copy files. */
  template: string,
): void {
  const layer = svg.querySelector('[data-burn-marks]');
  if (!layer || candles.length < 2) return;

  const first = candles[0]!.time;
  const last = candles[candles.length - 1]!.time;
  const span = last - first || 1;

  const marks = burns
    .filter((burn) => burn.time >= first && burn.time <= last)
    .map((burn) => {
      const x = ((burn.time - first) / span) * 1000;
      const mark = document.createElementNS(SVG_NS, 'line');
      mark.setAttribute('x1', x.toFixed(2));
      mark.setAttribute('x2', x.toFixed(2));
      mark.setAttribute('y1', String(PLOT_H - 16));
      mark.setAttribute('y2', String(PLOT_H));
      mark.setAttribute('class', 'burn-mark');

      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent = template.replace(
        '{amount}',
        Math.round(burn.tokens).toLocaleString(locale),
      );
      mark.append(title);
      return mark;
    });

  layer.replaceChildren(...marks);
}
