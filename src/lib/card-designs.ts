/**
 * The three share cards.
 *
 * One file so they stay a family: the same ground, the same portal, the same
 * footer, the same type. Each one gets a single hero number or sentence and one
 * piece of artwork that means something — the portal's bright arc is always the
 * card's own figure, not decoration.
 *
 * None of them loads an image except the coin pull, which needs the coin.
 */
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  FAINT,
  INK,
  LIME,
  fitLines,
  hash,
  paintBackdrop,
  paintEyebrow,
  paintFooter,
  paintMedallion,
  paintPortal,
  seeded,
  wrap,
} from './card-art.ts';

const PAD = 72;

/**
 * The coin each card wears.
 *
 * Drawn FOR the cards and used nowhere else. The pull set is a collection
 * people earn, so spending those pieces as card furniture would cheapen both —
 * a coin you can see on any shared card is not much of a pull. These four also
 * carry a gunmetal rim rather than the collection's lime, so a card is never
 * mistaken for somebody's find.
 *
 * Generated from the character reference sheet through the pipeline in
 * what-if-meme/PFP-GENERATION-PLAN.md, same five-block prompt as the pool.
 */
export const CARD_COINS = {
  /** Looking up at a question mark written in stars. Rim: STILL ASKING. */
  ask: 'asking',
  /** One glowing coin cupped at the chest, a chain behind. Rim: READ THE CHAIN. */
  holdings: 'ledger',
} as const;

export const coinArt = (slug: string) => `/cards/${slug}.webp`;

function prepare(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (!context) return null;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  return context;
}

// ---------------------------------------------------------------------------
// The question generator
// ---------------------------------------------------------------------------

/**
 * The Ask card.
 *
 * The question is the whole design, so the portal sits behind it, low and dim,
 * as something the words are falling into rather than an object beside them.
 */
export function drawAskCard(
  canvas: HTMLCanvasElement,
  question: string,
  answer: string,
  coin?: HTMLImageElement,
): void {
  const context = prepare(canvas);
  if (!context) return;

  paintBackdrop(context, hash(question));
  const askX = CARD_WIDTH - 178;
  const askY = CARD_HEIGHT - 168;
  paintPortal(context, askX, askY, 250, { accent: LIME, sweep: 0.5, seed: hash(question) });
  if (coin) paintMedallion(context, coin, askX, askY, 250, LIME);

  paintEyebrow(context, 'Still asking.');

  const reply = answer.trim();
  const box = CARD_WIDTH - PAD * 2 - 120;
  const { lines, size } = fitLines(
    context,
    question,
    (s) => `600 ${s}px Archivo, sans-serif`,
    box,
    reply ? 210 : 300,
    68,
    30,
  );

  let y = (reply ? 210 : 250) + (60 - lines.length * 8);
  context.fillStyle = INK;
  for (const line of lines) {
    context.fillText(line, PAD, y);
    y += size * 1.28;
  }

  if (reply) {
    const rule = y + 6;
    context.strokeStyle = 'rgba(143,206,2,0.5)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(PAD, rule);
    context.lineTo(PAD + 64, rule);
    context.stroke();

    const answerFit = fitLines(
      context,
      reply,
      (s) => `400 ${s}px Archivo, sans-serif`,
      box,
      110,
      34,
      20,
    );
    let answerY = rule + answerFit.size + 26;
    context.fillStyle = LIME;
    for (const line of answerFit.lines.slice(0, 3)) {
      context.fillText(line, PAD, answerY);
      answerY += answerFit.size * 1.3;
    }
  }

  paintFooter(context, 'whatifonhood.com/ask');
}

// ---------------------------------------------------------------------------
// The wallet lookup
// ---------------------------------------------------------------------------

export interface HoldingsCardData {
  tokens: string;
  usd?: string;
  band: string;
  line: string;
  /** 0–1: this wallet's share of the supply, for the ring. */
  share: number;
}

/**
 * The wallet card.
 *
 * The portal's arc is the share of supply held. Most wallets barely open it,
 * which is the honest picture of what one holder is against a billion tokens —
 * and the reason the number beside it is worth reading.
 */
export function drawHoldingsCard(
  canvas: HTMLCanvasElement,
  data: HoldingsCardData,
  coin?: HTMLImageElement,
): void {
  const context = prepare(canvas);
  if (!context) return;

  paintBackdrop(context, hash(data.tokens + data.band));

  const cx = CARD_WIDTH - 250;
  const cy = 262;
  const radius = 176;
  // A share of supply is a tiny number, so the arc is given a floor: enough to
  // be visible, never enough to look like more than it is.
  const sweep = data.share > 0 ? Math.max(0.04, Math.min(1, Math.sqrt(data.share))) : 0;
  paintPortal(context, cx, cy, radius, { accent: LIME, sweep, seed: hash(data.tokens) });

  if (coin) paintMedallion(context, coin, cx, cy, 252, LIME);

  // Under the portal, not inside it: the medallion has the middle now.
  context.save();
  context.textAlign = 'center';
  context.font = '900 italic 54px Archivo, sans-serif';
  context.fillStyle = INK;
  const percent = data.share * 100;
  const shown =
    percent >= 1 ? `${percent.toFixed(1)}%` : percent > 0 ? `${percent.toFixed(3)}%` : '0%';
  context.fillText(shown, cx, cy + radius + 74);
  context.font = '700 17px "JetBrains Mono", monospace';
  context.fillStyle = FAINT;
  context.fillText('OF ALL $IF', cx, cy + radius + 104);
  context.restore();

  paintEyebrow(context, data.band);

  context.font = '900 italic 112px Archivo, sans-serif';
  context.fillStyle = LIME;
  context.fillText(data.tokens, PAD, 246);

  context.font = '400 28px "JetBrains Mono", monospace';
  context.fillStyle = FAINT;
  context.fillText(data.usd ? `$IF  ·  ${data.usd}` : '$IF', PAD, 296);

  // The left column only: the percentage sits under the portal on the right,
  // and a full-width line would run straight through it.
  const { lines, size } = fitLines(
    context,
    data.line,
    (s) => `900 italic ${s}px Archivo, sans-serif`,
    cx - radius - PAD - 48,
    150,
    48,
    26,
  );
  let y = 452;
  context.fillStyle = INK;
  for (const line of lines.slice(0, 3)) {
    context.fillText(line.toUpperCase(), PAD, y);
    y += size * 1.14;
  }

  paintFooter(context, 'whatifonhood.com/holdings', 'Read from the chain · no wallet connected');
}

// ---------------------------------------------------------------------------
// The coin pull
// ---------------------------------------------------------------------------

export interface PfpCardData {
  name: string;
  tier: string;
  tierColor: string;
  odds: string;
}

/**
 * The coin pull card.
 *
 * Here the coin IS the artwork, so the portal sits behind it as a frame and
 * takes the rarity's colour. Nothing else competes with the picture.
 */
export function drawPfpCard(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  data: PfpCardData,
): void {
  const context = prepare(canvas);
  if (!context) return;

  paintBackdrop(context, hash(data.name));

  const cx = CARD_WIDTH - 320;
  const cy = CARD_HEIGHT / 2;
  paintPortal(context, cx, cy, 232, { accent: data.tierColor, sweep: 1, seed: hash(data.name) });

  const size = 300;
  context.save();
  context.beginPath();
  context.arc(cx, cy, size / 2, 0, Math.PI * 2);
  context.closePath();
  context.clip();
  context.drawImage(image, cx - size / 2, cy - size / 2, size, size);
  context.restore();

  context.beginPath();
  context.arc(cx, cy, size / 2, 0, Math.PI * 2);
  context.strokeStyle = data.tierColor;
  context.lineWidth = 4;
  context.stroke();

  paintEyebrow(context, 'Find your coin');

  const { lines, size: nameSize } = fitLines(
    context,
    data.name,
    (s) => `900 italic ${s}px Archivo, sans-serif`,
    CARD_WIDTH - PAD - 560,
    200,
    92,
    40,
  );
  let y = 250;
  context.fillStyle = INK;
  for (const line of lines.slice(0, 2)) {
    context.fillText(line.toUpperCase(), PAD, y);
    y += nameSize * 1.08;
  }

  context.font = '700 30px "JetBrains Mono", monospace';
  context.fillStyle = data.tierColor;
  context.fillText(data.tier.toUpperCase(), PAD, y + 34);

  context.font = '400 22px "JetBrains Mono", monospace';
  context.fillStyle = FAINT;
  context.fillText(data.odds.toUpperCase(), PAD, y + 74);

  paintFooter(context, 'whatifonhood.com/pfp');
}

export { CARD_WIDTH, CARD_HEIGHT, seeded, wrap };
