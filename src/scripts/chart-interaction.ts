/**
 * Everything you can do to the chart with a pointer.
 *
 * The crosshair, the wheel, the drag, the pinch, the toolbar toggles and the
 * resize grip — four hundred and fifty lines that were the middle of
 * initDashboard, which was 1237 lines long and growing by a feature a week.
 * Nothing here fetches, and nothing here decides what to draw; it reads the
 * chart's current state through the context below and asks for a repaint.
 *
 * The context is deliberately made of functions rather than values. The
 * dashboard holds `loaded`, `view` and the rest in `let` bindings that it
 * reassigns on every fetch, so a snapshot passed in once would be stale by the
 * first redraw. Asking each time is the whole of the coupling, and it is
 * visible in one interface instead of spread through a closure.
 */
import type { Candle } from '../lib/market.ts';
import { formatCompact, formatUsd } from '../lib/format.ts';
import { CHART_H, PLOT_H } from './chart-draw.ts';
import { recall, remember, type PrefKey } from '../lib/preferences.ts';

export interface ChartContext {
  root: HTMLElement;
  chart: SVGSVGElement | null;
  priceScale: HTMLElement | null;
  timeAxis: HTMLElement | null;
  locale: string;
  /** Every candle fetched for the timeframe on screen. */
  candles: () => Candle[];
  /** The slice actually drawn — what the crosshair reads. */
  drawn: () => Candle[];
  /** The price range that slice was drawn against. */
  bounds: () => { low: number; high: number };
  /** The window on screen, as indices into `candles()`. */
  currentView: () => { start: number; end: number };
  setView: (next: { start: number; end: number }) => void;
  /** Redraw from the candles already held. */
  repaint: () => void;
  /** Fetch and redraw — for changes that alter the axis, not just an overlay. */
  rerender: () => void;
  /** Write one candle into the reading line above the chart. */
  showOhlc: (candle: Candle | undefined) => void;
}

/** What the dashboard needs to know about the pointer, and nothing more. */
export interface ChartPointer {
  /**
   * True while somebody is reading or dragging the chart.
   *
   * The refresh loop asks before redrawing: replacing the candles under a
   * crosshair makes the chart jump out from under whoever is reading it. This
   * used to be a `let holding` shared between the two halves of a 1237-line
   * function, plus a peek at the drag's private state from the other end of it.
   */
  isEngaged: () => boolean;
}

export function attachChartInteraction(ctx: ChartContext): ChartPointer {
  const {
    root,
    chart,
    priceScale,
    timeAxis,
    locale,
    candles,
    drawn,
    bounds,
    currentView,
    setView,
    repaint,
    rerender,
    showOhlc,
  } = ctx;

  /** Set while a pointer is on the chart, so a refresh cannot yank it away. */
  let holding = false;

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
    showOhlc(drawn()[drawn().length - 1]);
  };

  const moveCrosshair = (event: PointerEvent) => {
    if (!wrap || !chart || !crosshair || !tip || drawn().length === 0) return;
    // While dragging, the pointer is moving the chart, not reading it.
    if (wrap.dataset.panning === 'true') return;
    // Measured against the PLOT, not the wrapper: the wrapper now reserves
    // padding for the two scales, and including it would offset every reading.
    const box = chart.getBoundingClientRect();
    const ratio = Math.min(0.999, Math.max(0, (event.clientX - box.left) / box.width));
    const index = Math.min(drawn().length - 1, Math.floor(ratio * drawn().length));
    const candle = drawn()[index];
    if (!candle) return;

    holding = true;
    crosshair.setAttribute('opacity', '1');
    const centre = ((index + 0.5) / drawn().length) * 1000;
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
      const scale = bounds();
      const padY = 14;
      const usable = PLOT_H - padY * 2;
      const fraction = 1 - (plotY - padY) / usable;
      const log = root.dataset.logScale === 'true';
      const at = log
        ? Math.exp(
            Math.log(Math.max(scale.low, Number.MIN_VALUE)) +
              fraction *
                (Math.log(Math.max(scale.high, Number.MIN_VALUE)) -
                  Math.log(Math.max(scale.low, Number.MIN_VALUE))),
          )
        : scale.low + fraction * (scale.high - scale.low);
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
    const total = candles().length;
    if (total < 2) return;

    const w = Math.max(MIN_SPAN, Math.min(total, Math.round(width)));
    const start = Math.max(0, Math.min(total - w, Math.round(index - ratio * w)));

    setView({ start, end: start + w });
    repaint();
  };

  const zoomAt = (ratio: number, factor: number) => {
    const span = currentView().end - currentView().start;
    placeView(currentView().start + ratio * span, ratio, span * factor);
  };

  wrap?.addEventListener(
    'wheel',
    (event) => {
      if (candles().length < 2) return;

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
      const span = currentView().end - currentView().start;
      const spent = out ? span >= candles().length : span <= MIN_SPAN;
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
    if (candles().length < 2) return;
    pointers.set(event.pointerId, event.clientX);

    if (pointers.size === 2) {
      // A second finger turns a drag into a pinch. The half-finished drag is
      // abandoned rather than blended in, or the chart lurches sideways as the
      // second finger lands.
      panFrom = null;
      const span = currentView().end - currentView().start;
      const ratio = fingerRatio();
      pinchFrom = { gap: fingerGap(), ratio, span, anchor: currentView().start + ratio * span };
      if (wrap) wrap.dataset.panning = 'true';
      hideCrosshair();
      return;
    }

    panFrom = { x: event.clientX, start: currentView().start, end: currentView().end };
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
    const start = Math.max(0, Math.min(candles().length - span, panFrom.start + shift));
    setView({ start, end: start + span });
    repaint();
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
    setView({ start: 0, end: candles().length });
    repaint();
  });

  root.querySelector('[data-chart-reset]')?.addEventListener('click', () => {
    setView({ start: 0, end: candles().length });
    repaint();
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
  wireToggle('[data-chart-average]', 'chartAverage', 'showAverage', repaint);
  wireToggle('[data-chart-ema]', 'chartEma', 'showEma', repaint);

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
    rerender();
  });

  return { isEngaged: () => holding || panFrom !== null };
}
