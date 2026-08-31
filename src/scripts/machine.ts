/**
 * The What $IF Machine: what a missed trade would be worth now.
 *
 * Pick a coin, an amount and a month; it buys at that month's closing price,
 * holds, and values the position at the most recent close. Prices are a
 * build-time snapshot served from this origin (see src/lib/machine.ts), so the
 * page makes no third-party request and cannot be rate-limited.
 */
import {
  getCoinHistory,
  getCoinIndex,
  searchCoins,
  type CoinEntry,
  type PricePoint,
} from '../lib/machine.ts';
import { formatCompact, formatUsd } from '../lib/format.ts';
import { SITE } from '../config/site.ts';

const MAX_AMOUNT = 1_000_000;
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 675;

interface Selection {
  coin: CoinEntry;
  history: PricePoint[];
}

/** "2021-05" -> "May 2021" */
function monthLabel(key: string, locale: string): string {
  const [year, month] = key.split('-').map(Number);
  if (!year || !month) return key;
  return new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

/**
 * How much regret a multiple deserves, and which pose sells it.
 *
 * Below 1x you would have lost money, so the joke inverts: you dodged it.
 */
const VERDICTS = [
  { over: 200, pose: 'facepalm', key: 'unbearable' },
  { over: 25, pose: 'facepalm', key: 'painful' },
  { over: 5, pose: 'thinking', key: 'ouch' },
  { over: 1, pose: 'arms-crossed', key: 'fine' },
  { over: 0, pose: 'victory', key: 'dodged' },
] as const;

function verdictFor(multiple: number) {
  return VERDICTS.find((entry) => multiple > entry.over) ?? VERDICTS[VERDICTS.length - 1]!;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

/** Wraps text to a width, returning the lines. */
function wrap(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Draws the share card: the number, the arithmetic, and IF Man reacting to it.
 *
 * The card is the point of the tool — it is what travels. The character is what
 * makes it a joke rather than a screenshot of a calculator.
 */
async function drawCard(
  canvas: HTMLCanvasElement,
  data: {
    symbol: string;
    month: string;
    amount: number;
    value: number;
    multiple: number;
    verdict: string;
    pose: string;
  },
  locale: string,
): Promise<void> {
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const regret = data.multiple > 1;
  const accent = regret ? '#8FCE02' : '#F0A06A';

  context.fillStyle = '#080B07';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // A deterministic starfield, so the same result always makes the same card.
  let seed = Math.round(data.multiple * 1000) + data.month.charCodeAt(5);
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 130; i += 1) {
    context.globalAlpha = 0.12 + random() * 0.5;
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(
      random() * CARD_WIDTH,
      random() * CARD_HEIGHT,
      random() * 1.3 + 0.2,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.globalAlpha = 1;

  const glow = context.createRadialGradient(900, 620, 0, 900, 620, 520);
  glow.addColorStop(0, `${accent}33`);
  glow.addColorStop(1, 'rgba(8,11,7,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // The character, reacting, bleeding off the bottom right.
  try {
    const pose = await loadImage(`/machine/poses/${data.pose}.webp`);
    const height = 620;
    const width = (pose.width / pose.height) * height;
    context.drawImage(pose, CARD_WIDTH - width - 40, CARD_HEIGHT - height + 40, width, height);
  } catch {
    // No pose is survivable; the numbers still read.
  }

  const left = 76;
  const textWidth = 620;

  context.fillStyle = accent;
  context.font = '700 21px "JetBrains Mono", monospace';
  context.fillText('THE WHAT $IF MACHINE', left, 86);

  context.fillStyle = '#9AA889';
  context.font = '400 27px Archivo, sans-serif';
  context.fillText(
    `${formatUsd(data.amount, locale)} of ${data.symbol} in ${monthLabel(data.month, locale)}`,
    left,
    150,
  );

  context.fillStyle = accent;
  context.font = '900 italic 132px Archivo, sans-serif';
  const multipleText =
    data.multiple >= 100 ? `${Math.round(data.multiple)}×` : `${data.multiple.toFixed(1)}×`;
  context.fillText(multipleText, left, 288);

  context.fillStyle = '#E9F0DD';
  context.font = '500 38px "JetBrains Mono", monospace';
  context.fillText(
    `${formatUsd(data.amount, locale)} → ${formatUsd(data.value, locale)}`,
    left,
    356,
  );

  // The verdict — the line that makes it funny.
  context.fillStyle = '#E9F0DD';
  context.font = '900 italic 62px Archivo, sans-serif';
  let y = 470;
  for (const line of wrap(context, data.verdict.toUpperCase(), textWidth)) {
    context.fillText(line, left, y);
    y += 66;
  }

  context.fillStyle = '#9AA889';
  context.font = '400 20px "JetBrains Mono", monospace';
  context.fillText(`RUN YOURS → ${SITE.url.replace('https://', '')}/machine`, left, 600);
  context.fillStyle = '#7D8C6E';
  context.font = '400 16px "JetBrains Mono", monospace';
  context.fillText('HISTORICAL PRICES · NOT FINANCIAL ADVICE', left, 632);
}

/** A small price line with the entry month marked. */
function drawSpark(svg: SVGSVGElement, history: PricePoint[], entryIndex: number): void {
  const width = 600;
  const height = 120;
  const prices = history.map(([, price]) => price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || max || 1;

  const x = (i: number) => (i / Math.max(1, history.length - 1)) * width;
  // Log scale: over a 1000x move a linear axis is a flat line and a spike.
  const y = (value: number) => {
    const ratio = (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min) || 1);
    return height - 6 - ratio * (height - 16);
  };

  const line = history
    .map(([, p], i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p).toFixed(1)}`)
    .join(' ');
  svg.querySelector('[data-spark-line]')?.setAttribute('d', line);
  svg
    .querySelector('[data-spark-area]')
    ?.setAttribute('d', `${line} L${width},${height} L0,${height} Z`);

  const marker = svg.querySelector('[data-spark-entry]');
  if (marker && history[entryIndex]) {
    marker.setAttribute('cx', x(entryIndex).toFixed(1));
    marker.setAttribute('cy', y(history[entryIndex][1]).toFixed(1));
  }
  void span;
}

/**
 * A result held in the address bar, so a calculation can be linked to.
 *
 * Everything here arrives from the query string, which is untrusted input. The
 * coin is checked against our own index rather than pattern-matched, the amount
 * is clamped to the range the input already enforces, and the month must both
 * look like a month and exist in that coin's history. Anything that fails is
 * dropped and the page opens on its defaults — no value from the URL is ever
 * written into the page.
 */
interface UrlState {
  coin: CoinEntry;
  month?: string;
  amount?: number;
}

function readStateFromUrl(coins: CoinEntry[]): UrlState | null {
  const params = new URLSearchParams(window.location.search);

  const symbol = params.get('coin');
  if (!symbol) return null;
  // Allowlist: the symbol has to be one we actually shipped.
  const coin = coins.find((entry) => entry.symbol === symbol.toUpperCase());
  if (!coin) return null;

  const state: UrlState = { coin };

  const month = params.get('from');
  if (month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) state.month = month;

  const amount = Number(params.get('amount'));
  if (Number.isFinite(amount) && amount >= 1) {
    state.amount = Math.min(Math.round(amount), MAX_AMOUNT);
  }

  return state;
}

function writeStateToUrl(symbol: string, month: string, amount: number): void {
  const url = new URL(window.location.href);
  url.searchParams.set('coin', symbol);
  url.searchParams.set('from', month);
  url.searchParams.set('amount', String(amount));
  // replaceState, not pushState: typing an amount should not fill the back button.
  window.history.replaceState(null, '', url);
}

export function initMachine(locale: string): void {
  const root = document.querySelector<HTMLElement>('[data-machine]');
  if (!root) return;

  const search = root.querySelector<HTMLInputElement>('[data-machine-search]');
  const results = root.querySelector<HTMLElement>('[data-machine-results]');
  const chosen = root.querySelector<HTMLElement>('[data-machine-chosen]');
  const amount = root.querySelector<HTMLInputElement>('[data-machine-amount]');
  const monthRange = root.querySelector<HTMLInputElement>('[data-machine-month]');
  const monthOut = root.querySelector<HTMLElement>('[data-machine-month-label]');
  const run = root.querySelector<HTMLButtonElement>('[data-machine-run]');
  const output = root.querySelector<HTMLElement>('[data-machine-output]');
  const empty = root.querySelector<HTMLElement>('[data-machine-empty]');
  const spark = root.querySelector<SVGSVGElement>('[data-machine-spark]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-machine-card]');
  const shareLink = root.querySelector<HTMLAnchorElement>('[data-machine-share]');
  const downloadLink = root.querySelector<HTMLAnchorElement>('[data-machine-download]');
  if (!search || !results || !amount || !monthRange || !run || !output) return;

  const labels = {
    noResults: results.dataset.noResults ?? '',
    shareText: shareLink?.dataset.template ?? '',
  };

  /** Verdict lines, rendered into the page so they stay translatable. */
  const verdicts: Record<string, string> = JSON.parse(root.dataset.verdicts ?? '{}');

  let coins: CoinEntry[] = [];
  let selection: Selection | null = null;
  let cardUrl: string | null = null;

  const setText = (key: string, value: string) => {
    const node = root.querySelector<HTMLElement>(`[data-out="${key}"]`);
    if (node) node.textContent = value;
  };

  const renderResults = (query: string) => {
    const matches = searchCoins(coins, query);
    results.replaceChildren();

    if (matches.length === 0) {
      const none = document.createElement('li');
      none.className = 'result-empty';
      none.textContent = labels.noResults;
      results.append(none);
      results.hidden = false;
      return;
    }

    for (const coin of matches) {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'result-row';

      const logo = document.createElement('img');
      logo.src = `/machine/logos/${coin.symbol}.webp`;
      logo.alt = '';
      logo.width = 24;
      logo.height = 24;
      logo.loading = 'lazy';
      logo.className = 'result-logo';
      // A missing logo should not leave a broken image icon.
      logo.addEventListener('error', () => logo.remove());

      const name = document.createElement('span');
      name.className = 'result-name';
      name.textContent = coin.name;

      const ticker = document.createElement('span');
      ticker.className = 'result-ticker';
      ticker.textContent = coin.symbol;

      button.append(logo, name, ticker);
      button.addEventListener('click', () => void choose(coin));
      item.append(button);
      results.append(item);
    }
    results.hidden = false;
  };

  const choose = async (coin: CoinEntry, preset?: { month?: string; amount?: number }) => {
    const history = await getCoinHistory(coin.symbol);
    if (history.length < 2) return;

    selection = { coin, history };
    search.value = '';
    results.hidden = true;

    if (chosen) {
      chosen.hidden = false;
      const logo = chosen.querySelector<HTMLImageElement>('[data-chosen-logo]');
      if (logo) {
        logo.src = `/machine/logos/${coin.symbol}.webp`;
        logo.alt = '';
      }
      const name = chosen.querySelector<HTMLElement>('[data-chosen-name]');
      if (name) name.textContent = coin.name;
      const ticker = chosen.querySelector<HTMLElement>('[data-chosen-ticker]');
      if (ticker) ticker.textContent = coin.symbol;
    }

    // Every month except the last, which is the "now" we value against.
    monthRange.max = String(history.length - 2);
    // A month from the URL only counts if this coin actually has it.
    const wanted = preset?.month ? history.findIndex(([month]) => month === preset.month) : -1;
    monthRange.value = String(wanted > -1 && wanted <= history.length - 2 ? wanted : 0);
    monthRange.disabled = false;
    if (preset?.amount !== undefined) amount.value = String(preset.amount);
    updateMonthLabel();
    run.disabled = false;
    calculate();
  };

  const currentMonth = (): string => selection?.history[Number(monthRange.value)]?.[0] ?? '';

  const updateMonthLabel = () => {
    if (monthOut) monthOut.textContent = monthLabel(currentMonth(), locale);
  };

  const calculate = () => {
    if (!selection) return;
    const index = Number(monthRange.value);
    const then = selection.history[index];
    const now = selection.history.at(-1);
    if (!then || !now) return;

    const invested = Math.min(Math.max(Number(amount.value) || 0, 1), MAX_AMOUNT);
    amount.value = String(invested);

    const units = invested / then[1];
    const value = units * now[1];
    const multiple = now[1] / then[1];

    setText('multiple', `${multiple >= 100 ? Math.round(multiple) : multiple.toFixed(1)}×`);
    setText('value', formatUsd(value, locale));
    setText('invested', formatUsd(invested, locale));
    setText('tokens', `${formatCompact(units, locale)} ${selection.coin.symbol}`);
    setText('entry', formatUsd(then[1], locale));
    setText('today', formatUsd(now[1], locale));

    output.dataset.direction = multiple >= 1 ? 'up' : 'down';
    output.hidden = false;
    if (empty) empty.hidden = true;

    if (spark) drawSpark(spark, selection.history, index);

    // The address bar now matches the screen, so the result can be shared.
    writeStateToUrl(selection.coin.symbol, then[0], invested);

    if (canvas) {
      const verdict = verdictFor(multiple);
      const symbol = selection.coin.symbol;
      void drawCard(
        canvas,
        {
          symbol,
          month: then[0],
          amount: invested,
          value,
          multiple,
          verdict: verdicts[verdict.key] ?? '',
          pose: verdict.pose,
        },
        locale,
      ).then(() => {
        canvas.toBlob((blob) => {
          if (!blob || !downloadLink) return;
          if (cardUrl) URL.revokeObjectURL(cardUrl);
          cardUrl = URL.createObjectURL(blob);
          downloadLink.href = cardUrl;
          downloadLink.download = `what-if-${symbol.toLowerCase()}.png`;
        }, 'image/png');
      });
    }

    if (shareLink) {
      const url = new URL('https://x.com/intent/post');
      url.searchParams.set(
        'text',
        labels.shareText
          .replace('{amount}', formatUsd(invested, locale))
          .replace('{coin}', selection.coin.symbol)
          .replace('{month}', monthLabel(then[0], locale))
          .replace('{value}', formatUsd(value, locale))
          .replace('{multiple}', `${multiple.toFixed(1)}×`),
      );
      url.searchParams.set('url', `${SITE.url}/machine`);
      shareLink.href = url.toString();
    }
  };

  search.addEventListener('input', () => renderResults(search.value));
  search.addEventListener('focus', () => renderResults(search.value));
  document.addEventListener('click', (event) => {
    if (!root.contains(event.target as Node)) results.hidden = true;
  });
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') results.hidden = true;
    if (event.key === 'Enter') {
      event.preventDefault();
      results.querySelector<HTMLButtonElement>('.result-row')?.click();
    }
  });

  monthRange.addEventListener('input', () => {
    updateMonthLabel();
    calculate();
  });
  amount.addEventListener('input', calculate);
  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-amount-chip]')) {
    chip.addEventListener('click', () => {
      amount.value = chip.dataset.amountChip ?? '500';
      calculate();
    });
  }
  run.addEventListener('click', calculate);

  void getCoinIndex().then((list) => {
    coins = list;
    // A shared link reopens on its own result; otherwise start on the coin
    // people ask about most, so the page is never empty.
    const shared = readStateFromUrl(list);
    const start = shared?.coin ?? list.find((coin) => coin.symbol === 'DOGE') ?? list[0];
    if (start) void choose(start, shared ?? undefined);
  });
}
