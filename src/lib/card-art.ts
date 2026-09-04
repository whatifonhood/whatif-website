/**
 * The artwork every share card is built from.
 *
 * Four cards leave this site — the Machine, the question generator, the wallet
 * lookup and the coin pull — and they used to end with the same posed figure
 * dropped in the corner. This replaces it with the motif the coin actually
 * belongs to: the timeline portal from the memes, and the galaxy from the
 * landing page. Drawn rather than loaded, so a card needs no image to fetch and
 * can never render half-finished.
 *
 * Everything here is DETERMINISTIC. The same inputs draw the same card, every
 * time, on every device — a share card that shuffled its own stars between the
 * preview and the download would look broken.
 */

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 675;

export const INK = '#E9F0DD';
export const LIME = '#8FCE02';
export const FAINT = '#7D8C6E';
export const VOID = '#080B07';

/**
 * A small deterministic generator.
 *
 * Seeded from the card's own content, so the starfield behind a question is
 * always that question's starfield.
 */
export function seeded(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/** Turns any text into a seed, so a card can seed itself from its own words. */
export function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return Math.abs(value);
}

/** The ground every card sits on: void, a faint grid, and a lime bloom. */
export function paintBackdrop(context: CanvasRenderingContext2D, seed: number): void {
  context.fillStyle = VOID;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.save();
  context.strokeStyle = 'rgba(34,48,18,0.55)';
  context.lineWidth = 1;
  for (let x = 0; x <= CARD_WIDTH; x += 60) {
    context.beginPath();
    context.moveTo(x + 0.5, 0);
    context.lineTo(x + 0.5, CARD_HEIGHT);
    context.stroke();
  }
  for (let y = 0; y <= CARD_HEIGHT; y += 60) {
    context.beginPath();
    context.moveTo(0, y + 0.5);
    context.lineTo(CARD_WIDTH, y + 0.5);
    context.stroke();
  }
  context.restore();

  paintStars(context, seed);
}

/** Stars, thinning towards the left so text stays readable over them. */
export function paintStars(context: CanvasRenderingContext2D, seed: number): void {
  const random = seeded(seed || 1);
  context.save();
  for (let i = 0; i < 90; i += 1) {
    const x = random() * CARD_WIDTH;
    const y = random() * CARD_HEIGHT;
    // Left third is where the words go; keep it quiet.
    const room = Math.min(1, x / (CARD_WIDTH * 0.45));
    const size = random() * 1.6 + 0.4;
    context.globalAlpha = (0.12 + random() * 0.5) * room;
    context.fillStyle = random() > 0.82 ? LIME : INK;
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

/**
 * The portal.
 *
 * The same shape the memes use for the other timeline: concentric rings that
 * brighten inwards, with one bright arc riding the rim. It carries the card's
 * accent colour, so a loss and a win read differently at a glance.
 */
export function paintPortal(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  options: { accent?: string; sweep?: number; seed?: number } = {},
): void {
  const accent = options.accent ?? LIME;
  const sweep = options.sweep ?? 0.68;
  const random = seeded(options.seed ?? 7);

  context.save();

  // The bloom behind it.
  const bloom = context.createRadialGradient(x, y, 0, x, y, radius * 1.5);
  bloom.addColorStop(0, `${accent}22`);
  bloom.addColorStop(0.55, `${accent}0D`);
  bloom.addColorStop(1, 'rgba(8,11,7,0)');
  context.fillStyle = bloom;
  context.beginPath();
  context.arc(x, y, radius * 1.5, 0, Math.PI * 2);
  context.fill();

  // Rings, brightening inwards.
  for (let i = 8; i >= 1; i -= 1) {
    const r = (radius * i) / 8;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.strokeStyle = `${accent}${Math.round(6 + (8 - i) * 5)
      .toString(16)
      .padStart(2, '0')}`;
    context.lineWidth = i === 1 ? 2 : 1;
    context.stroke();
  }

  // Specks caught in the pull.
  for (let i = 0; i < 40; i += 1) {
    const angle = random() * Math.PI * 2;
    const distance = radius * (0.15 + random() * 0.95);
    context.globalAlpha = 0.15 + random() * 0.5;
    context.fillStyle = random() > 0.6 ? accent : INK;
    context.beginPath();
    context.arc(
      x + Math.cos(angle) * distance,
      y + Math.sin(angle) * distance,
      random() * 1.7,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.globalAlpha = 1;

  // The track the arc runs on. Without it a small figure reads as a stray mark
  // rather than as a little of a whole, which is exactly the wrong impression
  // for a wallet holding a fraction of a percent.
  const start = -Math.PI / 2;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.strokeStyle = `${accent}26`;
  context.lineWidth = 6;
  context.stroke();

  // The bright arc on the rim — how far round it goes is the card's one number.
  context.beginPath();
  context.arc(x, y, radius, start, start + Math.PI * 2 * Math.max(0, Math.min(1, sweep)));
  context.strokeStyle = accent;
  context.lineWidth = 6;
  context.lineCap = 'round';
  context.shadowColor = accent;
  context.shadowBlur = 24;
  context.stroke();

  context.restore();
}

/** Wraps text to a width, at a given font. */
export function wrap(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) line = candidate;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Shrinks a font until the text fits the box, and returns the lines.
 *
 * Every card carries something whose length we do not control — a question, a
 * coin name, a number with an unknown number of digits — so nothing is set at a
 * fixed size and hoped for.
 */
export function fitLines(
  context: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  maxWidth: number,
  maxHeight: number,
  from: number,
  to: number,
): { lines: string[]; size: number } {
  let size = from;
  let lines: string[] = [];
  while (size > to) {
    context.font = font(size);
    lines = wrap(context, text, maxWidth);
    if (lines.length * size * 1.28 <= maxHeight) break;
    size -= 2;
  }
  context.font = font(size);
  return { lines, size };
}

/** The site's name, bottom left, on every card. */
export function paintFooter(context: CanvasRenderingContext2D, path: string, note?: string): void {
  context.save();
  context.textAlign = 'left';
  context.strokeStyle = 'rgba(34,48,18,0.9)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(72, CARD_HEIGHT - 104);
  context.lineTo(CARD_WIDTH - 72, CARD_HEIGHT - 104);
  context.stroke();

  context.font = '700 19px "JetBrains Mono", monospace';
  context.fillStyle = LIME;
  context.fillText(path.toUpperCase(), 72, CARD_HEIGHT - 62);

  if (note) {
    context.font = '400 15px "JetBrains Mono", monospace';
    context.fillStyle = FAINT;
    context.fillText(note.toUpperCase(), 72, CARD_HEIGHT - 34);
  }
  context.restore();
}

/** The eyebrow every card opens with. */
export function paintEyebrow(context: CanvasRenderingContext2D, text: string): void {
  context.save();
  context.textAlign = 'left';
  context.font = '700 20px "JetBrains Mono", monospace';
  context.fillStyle = LIME;
  context.fillText(text.toUpperCase(), 72, 96);
  context.restore();
}

/**
 * A coin medallion, dropped into the middle of a portal.
 *
 * The artwork is the existing coin set — the same circular pieces the pull
 * hands out — so a card carries a real piece of the coin's own world rather
 * than a stock pose. Which one is chosen is up to the card: the Machine uses
 * "aped earlier" on a win and "this is fine" on a loss, the question generator
 * uses the thinker, the wallet card uses whichever band the holding falls in.
 */
export function paintMedallion(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  size: number,
  accent = LIME,
): void {
  context.save();

  // A pool of shadow, so the medallion sits in the portal rather than on it.
  const shadow = context.createRadialGradient(x, y, size * 0.3, x, y, size * 0.72);
  shadow.addColorStop(0, 'rgba(8,11,7,0.92)');
  shadow.addColorStop(1, 'rgba(8,11,7,0)');
  context.fillStyle = shadow;
  context.beginPath();
  context.arc(x, y, size * 0.72, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.arc(x, y, size / 2, 0, Math.PI * 2);
  context.closePath();
  context.clip();
  context.drawImage(image, x - size / 2, y - size / 2, size, size);
  context.restore();

  context.save();
  context.beginPath();
  context.arc(x, y, size / 2, 0, Math.PI * 2);
  context.strokeStyle = `${accent}66`;
  context.lineWidth = 3;
  context.stroke();
  context.restore();
}
