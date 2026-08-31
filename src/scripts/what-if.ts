/**
 * The question generator.
 *
 * Picks a pattern, fills its slots, draws the result. Everything happens on the
 * visitor's device — there is no request, so it works offline and instantly.
 *
 * Patterns are picked uniformly rather than in proportion to how many
 * combinations each can produce. Weighting by combinations would bury the short,
 * funny categories under the money ones, which have the most slots and would
 * otherwise appear nine times in ten.
 */
import {
  BANKS,
  CATEGORIES,
  PATTERNS,
  countPossibilities,
  type Category,
} from '../config/what-if.ts';
import { track } from '../lib/analytics.ts';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 675;

/** How many recent questions to avoid repeating. */
const MEMORY = 40;

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

/**
 * Fills a pattern's slots.
 *
 * The capital on "What" has to follow whatever the opener left behind: "But
 * what if…" but "Hear me out. What if…". Without this every prefixed question
 * reads "Okay but What if", which is the sort of detail that makes a generator
 * feel generated.
 */
function fill(text: string): string {
  const filled = text
    .replace(/\{(\w+)\}/g, (_, slot: string) => {
      const bank = BANKS[slot];
      return bank ? pick(bank) : '';
    })
    // An empty tail or opener can leave a doubled space behind it.
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,?])/g, '$1')
    .trim();

  // Mid-sentence when the opener runs on, capitalised when it ended.
  return filled.replace(/(^|[.!?]\s+)What if|(\S\s+)What if/g, (_match, start, midway) =>
    midway ? `${midway}what if` : `${start}What if`,
  );
}

/** A question, capitalised however the opener left it. */
function generate(category: Category | 'all', recent: string[]): string {
  const pool = category === 'all' ? PATTERNS : PATTERNS.filter((p) => p.category === category);
  const patterns = pool.length > 0 ? pool : PATTERNS;

  // Try a few times to avoid something already on screen. With a million
  // combinations a collision is rare, so this gives up rather than looping.
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const text = fill(pick(patterns).text);
    if (!recent.includes(text)) return text;
  }
  return fill(pick(patterns).text);
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
 * The question is the whole design: sized to fill the space it has, so a short
 * one lands hard and a long one still fits.
 */
async function drawCard(canvas: HTMLCanvasElement, question: string): Promise<void> {
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const PAD = 84;
  const boxWidth = CARD_WIDTH - PAD * 2;

  context.fillStyle = '#080B07';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glow = context.createRadialGradient(600, 300, 0, 600, 300, 660);
  glow.addColorStop(0, 'rgba(143,206,2,0.17)');
  glow.addColorStop(1, 'rgba(8,11,7,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.strokeStyle = 'rgba(34,48,18,0.32)';
  context.lineWidth = 1;
  for (let x = 0; x < CARD_WIDTH; x += 80) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, CARD_HEIGHT);
    context.stroke();
  }

  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';

  // Largest size at which the question fits four lines in the space available.
  let size = 76;
  let lines: string[] = [];
  const maxHeight = 330;
  while (size > 26) {
    context.font = `italic 900 ${size}px Archivo, sans-serif`;
    lines = wrap(context, question.toUpperCase(), boxWidth);
    if (lines.length <= 4 && lines.length * size * 1.06 <= maxHeight) break;
    size -= 3;
  }

  const lineHeight = size * 1.06;
  let y = 200 + (maxHeight - lines.length * lineHeight) / 2;
  context.fillStyle = '#E9F0DD';
  for (const line of lines) {
    context.fillText(line, PAD, y);
    y += lineHeight;
  }

  context.font = '700 21px "JetBrains Mono", monospace';
  context.fillStyle = '#8FCE02';
  context.fillText('STILL ASKING.', PAD, 128);

  context.strokeStyle = 'rgba(34,48,18,0.9)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(PAD, CARD_HEIGHT - 112);
  context.lineTo(CARD_WIDTH - PAD, CARD_HEIGHT - 112);
  context.stroke();

  context.font = '700 20px "JetBrains Mono", monospace';
  context.fillStyle = '#8FCE02';
  context.fillText('WHATIFONHOOD.COM/ASK', PAD, CARD_HEIGHT - 62);

  try {
    const figure = await loadImage('/machine/poses/thinking.webp');
    const height = 190;
    const width = (figure.width / figure.height) * height;
    context.drawImage(figure, CARD_WIDTH - width - PAD, CARD_HEIGHT - height - 30, width, height);
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

  let category: Category | 'all' = 'all';
  const recent: string[] = [];
  let cardUrl: string | null = null;

  const ask = () => {
    const question = generate(category, recent);
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

    track('Question Asked', { category });
  };

  again?.addEventListener('click', ask);

  root.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLElement>(
      '[data-ask-category]',
    );
    if (!button) return;
    const next = button.dataset.askCategory ?? 'all';
    category = (CATEGORIES as readonly string[]).includes(next) ? (next as Category) : 'all';
    for (const other of root.querySelectorAll<HTMLElement>('[data-ask-category]')) {
      other.setAttribute('aria-pressed', String(other === button));
    }
    ask();
  });

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
