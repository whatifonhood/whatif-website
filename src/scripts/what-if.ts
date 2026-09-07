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
import { CARD_COINS, coinArt, drawAskCard, readyFonts } from '../lib/card-designs.ts';
import { canvasBlob, shareOrDownload } from '../lib/share.ts';

/** How many recent questions to avoid repeating. */
const MEMORY = 60;

/** The most a visitor can type after "What if". The card fits it; a novel would not. */
const OWN_MAX = 120;

/**
 * A visitor's own line, made into a question.
 *
 * Whatever they typed is trimmed, relieved of a "what if" they may have typed
 * anyway, and given the one question mark. Empty in, empty out.
 */
export function ownQuestion(raw: string): string {
  const rest = raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^what\s+\$?if\b[\s,:]*/i, '')
    .replace(/[\s?.!…]+$/u, '')
    .slice(0, OWN_MAX)
    .trim();
  return rest ? `What if ${rest}?` : '';
}

/** Avoids showing the same question twice in a session. */
function nextQuestion(recent: string[]): Question {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const question = randomQuestion();
    if (!recent.includes(question.id)) return question;
  }
  return randomQuestion();
}

/**
 * The share card.
 *
 * Layout and artwork live in src/lib/card-designs.ts, shared with the Machine,
 * the wallet lookup and the coin pull so the four stay one family.
 */
async function drawCard(
  canvas: HTMLCanvasElement,
  question: string,
  answer: string,
): Promise<void> {
  await readyFonts();
  drawAskCard(canvas, question, answer, await cardCoin(CARD_COINS.ask));
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
  /*
   * True while the question on screen was typed rather than drawn. An own line
   * has no id, so it gets no `?q=` in the address bar and no "copy link" —
   * this site never serves a URL that shows words it did not write.
   */
  let own = false;
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
    const todays = questionForDate(iso);
    daily.textContent = todays.text;
    // One tap to answer it, instead of archive → day → back.
    const answerToday = root.querySelector<HTMLAnchorElement>('[data-ask-daily-answer]');
    if (answerToday) answerToday.href = `?q=${encodeURIComponent(todays.id)}`;
  }

  const render = () => {
    // A "Link copied." from the last question is not true of this one.
    if (status) status.textContent = '';
    output.textContent = current.text;
    // Re-triggering the animation is what makes each one feel like an arrival.
    output.classList.remove('is-new');
    void output.offsetWidth;
    output.classList.add('is-new');

    // The address bar matches the screen, so the question can be sent to
    // somebody. The id is indices, never the words — see the note in the config.
    const url = new URL(window.location.href);
    if (own) url.searchParams.delete('q');
    else url.searchParams.set('q', current.id);
    window.history.replaceState(null, '', url);
    if (copyButton) copyButton.hidden = own;

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
    // Space works from the question itself; focusing it after each ask is what
    // makes the hint true on a fresh load.
    output?.focus({ preventScroll: true });
    own = false;
    current = nextQuestion(recent);
    recent.push(current.id);
    if (recent.length > MEMORY) recent.shift();
    if (answerInput) answerInput.value = '';
    render();
    track('Question Asked');
  };

  again?.addEventListener('click', ask);

  const ownForm = root.querySelector<HTMLFormElement>('[data-ask-own]');
  const ownInput = ownForm?.querySelector<HTMLInputElement>('[data-ask-own-input]');
  ownForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = ownQuestion(ownInput?.value ?? '');
    if (!text) {
      ownInput?.focus();
      return;
    }
    own = true;
    // Everything but the words comes from a drawn question, so the card and
    // the share text see the same shape they always do.
    current = { ...randomQuestion(), id: '', text };
    render();
    track('Own Question Drawn');
    // On a phone the card is a screen below the form; show the person what they made.
    canvas?.scrollIntoView({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  });

  // The download hands the card to the share sheet where the device has one.
  download?.addEventListener('click', (event) => {
    if (!canvas) return;
    event.preventDefault();
    void canvasBlob(canvas).then((blob) => {
      if (blob) void shareOrDownload(blob, 'what-if.png', current.text);
    });
  });

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

/**
 * The card's own coin, fetched once and kept.
 *
 * A card still draws without it — the artwork is optional in every design — so
 * a slow or missing image delays nothing and breaks nothing.
 */
const coinCache = new Map<string, Promise<HTMLImageElement | undefined>>();
function cardCoin(slug: string): Promise<HTMLImageElement | undefined> {
  let pending = coinCache.get(slug);
  if (!pending) {
    pending = new Promise<HTMLImageElement | undefined>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(undefined);
      image.src = coinArt(slug);
    });
    coinCache.set(slug, pending);
  }
  return pending;
}
