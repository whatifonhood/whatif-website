/**
 * The drifting starfield behind the hero.
 *
 * Performance rules this file follows, because it is the only thing on the page
 * that runs every frame:
 *  - starts on idle, after first paint, so it never competes with the hero image
 *  - device pixel ratio capped at 1.5 (a 3x phone screen would quadruple the work
 *    for no visible gain)
 *  - size is read in a ResizeObserver, never per frame, so it cannot force layout
 *  - pauses when the tab is hidden or the hero scrolls out of view
 *  - honours prefers-reduced-motion by drawing one static frame
 */
const MAX_DPR = 1.5;
const STAR_DENSITY = 3400; // one star per N square pixels

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  twinkle: number;
  phase: number;
  driftX: number;
  bright: boolean;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function initCosmos(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d');
  if (!context) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let stars: Star[] = [];
  let frame = 0;
  let running = false;
  let onScreen = true;

  const build = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (width === 0 || height === 0) return;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(260, Math.round((width * height) / STAR_DENSITY));
    stars = Array.from({ length: count }, () => {
      const bright = Math.random() > 0.82;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: bright ? randomBetween(1.1, 1.8) : randomBetween(0.3, 1),
        baseAlpha: bright ? randomBetween(0.5, 0.9) : randomBetween(0.2, 0.55),
        twinkle: randomBetween(0.15, 0.45),
        phase: Math.random() * Math.PI * 2,
        driftX: randomBetween(0.004, 0.014),
        bright,
      };
    });
  };

  const draw = (time: number) => {
    context.clearRect(0, 0, width, height);

    for (const star of stars) {
      const alpha = star.baseAlpha + Math.sin(time * 0.0012 + star.phase) * star.twinkle;
      if (alpha <= 0.02) continue;

      context.globalAlpha = Math.min(1, Math.max(0, alpha));
      context.fillStyle = star.bright ? '#EFFFF0' : '#FFFFFF';
      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();

      if (!reduceMotion) {
        star.x -= star.driftX;
        if (star.x < -4) star.x = width + 4;
      }
    }
    context.globalAlpha = 1;
  };

  const loop = (time: number) => {
    if (!running) return;
    draw(time);
    frame = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || reduceMotion) return;
    running = true;
    frame = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frame);
  };

  build();
  if (reduceMotion) {
    draw(0);
  } else {
    start();
  }

  // Resize: rebuild the field, but never measure inside the animation loop.
  const resizeObserver = new ResizeObserver(() => {
    build();
    if (reduceMotion) draw(0);
  });
  resizeObserver.observe(canvas);

  // Off-screen or backgrounded tabs cost nothing.
  const visibilityObserver = new IntersectionObserver((entries) => {
    onScreen = entries[0]?.isIntersecting ?? true;
    if (onScreen && !document.hidden) start();
    else stop();
  });
  visibilityObserver.observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !onScreen) stop();
    else start();
  });
}

/** Starts the starfield once the browser is idle. */
export function initCosmosWhenIdle(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-cosmos]');
  if (!canvas) return;

  const begin = () => initCosmos(canvas);
  // Safari still lacks requestIdleCallback; a short timeout is close enough.
  const idle = window.requestIdleCallback;
  if (typeof idle === 'function') {
    idle(begin, { timeout: 2000 });
  } else {
    window.setTimeout(begin, 200);
  }
}
