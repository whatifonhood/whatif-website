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
import {
  countPossibilities,
  questionForDate,
  questionFromId,
  randomQuestion,
  type Question,
} from '../config/what-if.ts';
import { track } from '../lib/analytics.ts';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 675;

/** How many recent questions to avoid repeating. */
const MEMORY = 60;

/** Avoids showing the same question twice in a session. */
function nextQuestion(recent: string[]): Question {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const question = randomQuestion();
    if (!recent.includes(question.id)) return question;
  }
  return randomQuestion();
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
async function drawCard(
  canvas: HTMLCanvasElement,
  question: string,
  answer: string,
): Promise<void> {
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

  // An answer takes room from the question, so the question is sized against
  // whatever is left rather than a fixed box.
  const answerText = answer.trim();
  const maxHeight = answerText ? 220 : 320;
  let size = answerText ? 52 : 66;
  let lines: string[] = [];
  while (size > 26) {
    context.font = `600 ${size}px Archivo, sans-serif`;
    lines = wrap(context, question, boxWidth);
    if (lines.length <= 5 && lines.length * size * 1.3 <= maxHeight) break;
    size -= 2;
  }

  const lineHeight = size * 1.3;
  let y = (answerText ? 196 : 218) + (maxHeight - lines.length * lineHeight) / 2;
  context.fillStyle = '#E9F0DD';
  for (const line of lines) {
    context.fillText(line, PAD, y);
    y += lineHeight;
  }

  // The answer, set apart from the question so the card reads as a reply.
  if (answerText) {
    const rule = y + 14;
    context.strokeStyle = 'rgba(143,206,2,0.5)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(PAD, rule);
    context.lineTo(PAD + 60, rule);
    context.stroke();

    let answerSize = 34;
    let answerLines: string[] = [];
    while (answerSize > 18) {
      context.font = `400 ${answerSize}px Archivo, sans-serif`;
      answerLines = wrap(context, answerText, boxWidth);
      if (answerLines.length <= 3) break;
      answerSize -= 2;
    }
    context.fillStyle = '#8FCE02';
    let answerY = rule + answerSize + 24;
    for (const line of answerLines.slice(0, 3)) {
      context.fillText(line, PAD, answerY);
      answerY += answerSize * 1.32;
    }
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

export function initWhatIf(locale: string): void {
  const root = document.querySelector<HTMLElement>('[data-ask]');
  if (!root) return;

  const output = root.querySelector<HTMLElement>('[data-ask-question]');
  const again = root.querySelector<HTMLButtonElement>('[data-ask-again]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-ask-card]');
  const answerInput = root.querySelector<HTMLTextAreaElement>('[data-ask-answer]');
  const copyButton = root.querySelector<HTMLButtonElement>('[data-ask-copy]');
  const shareLink = root.querySelector<HTMLAnchorElement>('[data-ask-share]');
  const download = root.querySelector<HTMLAnchorElement>('[data-ask-download]');
  const status = root.querySelector<HTMLElement>('[data-ask-status]');
  const daily = root.querySelector<HTMLElement>('[data-ask-daily]');
  if (!output) return;

  const labels = {
    copied: root.dataset.labelCopied ?? '',
    linkCopied: root.dataset.labelLinkCopied ?? '',
    shareTemplate: root.dataset.shareText ?? '',
  };

  const recent: string[] = [];
  let current = randomQuestion();
  let cardUrl: string | null = null;
  let redrawTimer: number | undefined;

  /**
   * Today's question, the same one for everybody.
   *
   * The date is taken locally, so somebody in Sydney gets tomorrow's before
   * somebody in London. That is the right trade — a shared question people can
   * answer together beats one that changes at an arbitrary hour of their night.
   */
  if (daily) {
    const today = new Date();
    const iso = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    daily.textContent = questionForDate(iso).text;
  }

  const render = () => {
    output.textContent = current.text;
    // Re-triggering the animation is what makes each one feel like an arrival.
    output.classList.remove('is-new');
    void output.offsetWidth;
    output.classList.add('is-new');

    // The address bar matches the screen, so the question can be sent to
    // somebody. The id is indices, never the words — see the note in the config.
    const url = new URL(window.location.href);
    url.searchParams.set('q', current.id);
    window.history.replaceState(null, '', url);

    const answer = answerInput?.value.trim() ?? '';

    if (shareLink) {
      const intent = new URL('https://x.com/intent/post');
      const text = labels.shareTemplate.replace('{question}', current.text);
      intent.searchParams.set('text', answer ? `${current.text}\n\n${answer}` : text);
      intent.searchParams.set('url', url.href);
      shareLink.href = intent.toString();
    }

    if (canvas) {
      void drawCard(canvas, current.text, answer).then(() => {
        canvas.toBlob((blob) => {
          if (!blob || !download) return;
          if (cardUrl) URL.revokeObjectURL(cardUrl);
          cardUrl = URL.createObjectURL(blob);
          download.href = cardUrl;
          download.download = 'what-if.png';
        }, 'image/png');
      });
    }
  };

  const ask = () => {
    current = nextQuestion(recent);
    recent.push(current.id);
    if (recent.length > MEMORY) recent.shift();
    if (answerInput) answerInput.value = '';
    render();
    track('Question Asked');
  };

  again?.addEventListener('click', ask);

  // Typing redraws the card, but not on every keystroke.
  answerInput?.addEventListener('input', () => {
    window.clearTimeout(redrawTimer);
    redrawTimer = window.setTimeout(render, 350);
  });

  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      if (status) status.textContent = labels.linkCopied;
    } catch {
      /* clipboard unavailable; the URL is in the address bar */
    }
  });

  /**
   * Space asks for another — but only when the tool has focus.
   *
   * This used to listen on the document and swallow Space whenever nothing
   * interactive was focused, which is the state on every fresh load. Space is
   * the page-down key, so scrolling the page with it silently did nothing.
   */
  root.addEventListener('keydown', (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
    if (active instanceof HTMLButtonElement || active instanceof HTMLAnchorElement) return;
    event.preventDefault();
    ask();
  });

  const total = root.querySelector<HTMLElement>('[data-ask-total]');
  if (total) total.textContent = countPossibilities().toLocaleString(locale);

  // A shared link opens on its own question; anything invalid falls back.
  const shared = questionFromId(new URLSearchParams(window.location.search).get('q') ?? '');
  if (shared) {
    current = shared;
    recent.push(shared.id);
    render();
  } else {
    ask();
  }
}
