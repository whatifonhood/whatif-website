/**
 * The question generator.
 *
 * Draws a question and draws a card for it. Everything happens on the visitor's
 * device — no request, so it is instant and works offline.
 *
 * The rule that keeps the output sensible lives in src/config/what-if.ts: vary
 * only what is interchangeable within one idea, and never join two ideas. This
 * file picks and renders.
 */
import { BANKS, LINES, PATTERNS, countPossibilities, type Category } from '../config/what-if.ts';
import { track } from '../lib/analytics.ts';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 675;

/** How many recent questions to avoid repeating. */
const MEMORY = 30;

/**
 * How often each register comes up.
 *
 * The philosophical one leads: it is the question the whole coin is built on and
 * the one worth reading twice. Money is the regret the Machine already answers
 * in detail, and the market jokes are garnish, so they take the smallest share.
 */
const WEIGHTS: Record<Category, number> = { deep: 0.62, money: 0.24, market: 0.14 };

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/** Fills a pattern's slots. */
function fill(text: string): string {
  return text.replace(/\{(\w+)\}/g, (_, slot: string) => {
    const bank = BANKS[slot];
    return bank ? pick(bank) : '';
  });
}

function pickCategory(): Category {
  let roll = Math.random();
  for (const entry of Object.entries(WEIGHTS) as [Category, number][]) {
    roll -= entry[1];
    if (roll <= 0) return entry[0];
  }
  return 'deep';
}

/**
 * One question.
 *
 * Written lines and fillable patterns sit in the same pool for the chosen
 * register, so a hand-written thought is as likely to come up as a generated
 * one — which keeps the average quality up where the written ones are.
 */
function generate(recent: string[]): string {
  const draw = (): string => {
    const category = pickCategory();
    const pool = [
      ...LINES.filter((line) => line.category === category).map((line) => line.text),
      ...PATTERNS.filter((pattern) => pattern.category === category).map((p) => p.text),
    ];
    return fill(pool.length > 0 ? pick(pool) : pick(LINES).text);
  };

  // Repeats are possible in a set this size, so a few attempts are worth making.
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const text = draw();
    if (!recent.includes(text)) return text;
  }
  return draw();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

/** Wraps text to a width. */
function wrap(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
 * The share card.
 *
 * Set as prose, not as a headline. Uppercase black italic at this size reads as
 * shouting, and these are meant to be read rather than announced.
 */
async function drawCard(canvas: HTMLCanvasElement, question: string): Promise<void> {
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const PAD = 84;
  const boxWidth = CARD_WIDTH - PAD * 2 - 110;

  context.fillStyle = '#080B07';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glow = context.createRadialGradient(560, 300, 0, 560, 300, 640);
  glow.addColorStop(0, 'rgba(143,206,2,0.15)');
  glow.addColorStop(1, 'rgba(8,11,7,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.strokeStyle = 'rgba(34,48,18,0.3)';
  context.lineWidth = 1;
  for (let x = 0; x < CARD_WIDTH; x += 80) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, CARD_HEIGHT);
    context.stroke();
  }

  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';

  // Short questions get to be large; long ones step down until they fit.
  let size = 66;
  let lines: string[] = [];
  const maxHeight = 320;
  while (size > 26) {
    context.font = `600 ${size}px Archivo, sans-serif`;
    lines = wrap(context, question, boxWidth);
    if (lines.length <= 5 && lines.length * size * 1.3 <= maxHeight) break;
    size -= 2;
  }

  const lineHeight = size * 1.3;
  let y = 218 + (maxHeight - lines.length * lineHeight) / 2;
  context.fillStyle = '#E9F0DD';
  for (const line of lines) {
    context.fillText(line, PAD, y);
    y += lineHeight;
  }

  context.font = '700 20px "JetBrains Mono", monospace';
  context.fillStyle = '#8FCE02';
  context.fillText('STILL ASKING.', PAD, 126);

  context.strokeStyle = 'rgba(34,48,18,0.9)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(PAD, CARD_HEIGHT - 112);
  context.lineTo(CARD_WIDTH - PAD, CARD_HEIGHT - 112);
  context.stroke();

  context.font = '700 19px "JetBrains Mono", monospace';
  context.fillStyle = '#8FCE02';
  context.fillText('WHATIFONHOOD.COM/ASK', PAD, CARD_HEIGHT - 62);

  try {
    const figure = await loadImage('/machine/poses/thinking.webp');
    const height = 200;
    const width = (figure.width / figure.height) * height;
    context.drawImage(figure, CARD_WIDTH - width - PAD, CARD_HEIGHT - height - 28, width, height);
  } catch {
    /* the question reads fine on its own */
  }
}

export function initWhatIf(): void {
  const root = document.querySelector<HTMLElement>('[data-ask]');
  if (!root) return;

  const output = root.querySelector<HTMLElement>('[data-ask-question]');
  const again = root.querySelector<HTMLButtonElement>('[data-ask-again]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-ask-card]');
  const copyButton = root.querySelector<HTMLButtonElement>('[data-ask-copy]');
  const shareLink = root.querySelector<HTMLAnchorElement>('[data-ask-share]');
  const download = root.querySelector<HTMLAnchorElement>('[data-ask-download]');
  const status = root.querySelector<HTMLElement>('[data-ask-status]');
  if (!output) return;

  const labels = {
    copied: root.dataset.labelCopied ?? '',
    shareTemplate: root.dataset.shareText ?? '',
  };

  const recent: string[] = [];
  let cardUrl: string | null = null;

  const ask = () => {
    const question = generate(recent);
    recent.push(question);
    if (recent.length > MEMORY) recent.shift();

    output.textContent = question;
    // Re-triggering the animation is what makes each one feel like an arrival.
    output.classList.remove('is-new');
    void output.offsetWidth;
    output.classList.add('is-new');

    if (shareLink) {
      const url = new URL('https://x.com/intent/post');
      url.searchParams.set('text', labels.shareTemplate.replace('{question}', question));
      url.searchParams.set('url', 'https://whatifonhood.com/ask/');
      shareLink.href = url.toString();
    }

    if (canvas) {
      void drawCard(canvas, question).then(() => {
        canvas.toBlob((blob) => {
          if (!blob || !download) return;
          if (cardUrl) URL.revokeObjectURL(cardUrl);
          cardUrl = URL.createObjectURL(blob);
          download.href = cardUrl;
          download.download = 'what-if.png';
        }, 'image/png');
      });
    }

    track('Question Asked');
  };

  again?.addEventListener('click', ask);

  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.textContent ?? '');
      if (status) status.textContent = labels.copied;
    } catch {
      /* clipboard unavailable; the text is on screen to copy by hand */
    }
  });

  // Space is the natural key for "again" once you have pressed the button once.
  document.addEventListener('keydown', (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
    if (active instanceof HTMLButtonElement || active instanceof HTMLAnchorElement) return;
    event.preventDefault();
    ask();
  });

  const total = root.querySelector<HTMLElement>('[data-ask-total]');
  if (total) total.textContent = countPossibilities().toLocaleString();

  ask();
}
