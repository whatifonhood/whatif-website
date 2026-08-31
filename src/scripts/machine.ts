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
  searchAllCoins,
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
/**
 * Formats a point's key.
 *
 * Most coins are priced monthly ("2021-05"). $IF is too young for that to say
 * anything, so it is priced daily ("2026-07-14") — both shapes are formatted
 * here rather than the caller having to know which it has.
 */
function monthLabel(key: string, locale: string): string {
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month) return key;

  const options: Intl.DateTimeFormatOptions = day
    ? { day: 'numeric', month: 'short', year: 'numeric' }
    : { month: 'short', year: 'numeric' };

  return new Intl.DateTimeFormat(locale, options).format(
    new Date(Date.UTC(year, month - 1, day || 1)),
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
/**
 * Draws the share card: the number, the arithmetic, and IF Man reacting to it.
 *
 * The card is the point of the tool — it is what travels. The character is what
 * makes it a joke rather than a screenshot of a calculator.
 */
/** Fits one line to a width by stepping the size down. */
function fitLine(
  context: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  maxWidth: number,
  start: number,
  min = 22,
): void {
  let size = start;
  while (size > min) {
    context.font = font(size);
    if (context.measureText(text).width <= maxWidth) return;
    size -= 2;
  }
  context.font = font(size);
}

/** Wraps text to a width. */
function wrapToWidth(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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
 * The coin's actual price history, with the entry marked.
 *
 * This is what makes the card worth posting. The number on its own is abstract;
 * the curve shows the thing that happened — and it is different for every coin
 * and every date somebody picks, which a character pose is not.
 */
function drawHistoryCurve(
  context: CanvasRenderingContext2D,
  history: PricePoint[],
  entryIndex: number,
  box: { x: number; y: number; w: number; h: number },
  accent: string,
): void {
  if (history.length < 2) return;

  const prices = history.map(([, price]) => price);
  // Log scale, because these series cover several orders of magnitude and a
  // linear axis renders every early month as a flat line on the floor.
  const logs = prices.map((price) => Math.log(Math.max(price, Number.MIN_VALUE)));
  const low = Math.min(...logs);
  const high = Math.max(...logs);
  const span = high - low || 1;

  const x = (i: number) => box.x + (i / (history.length - 1)) * box.w;
  const y = (i: number) => box.y + box.h - ((logs[i]! - low) / span) * box.h;

  const path = new Path2D();
  history.forEach((_, i) => (i === 0 ? path.moveTo(x(i), y(i)) : path.lineTo(x(i), y(i))));

  const fill = new Path2D(path);
  fill.lineTo(x(history.length - 1), box.y + box.h);
  fill.lineTo(box.x, box.y + box.h);
  fill.closePath();

  const gradient = context.createLinearGradient(0, box.y, 0, box.y + box.h);
  gradient.addColorStop(0, `${accent}3D`);
  gradient.addColorStop(1, `${accent}00`);
  context.fillStyle = gradient;
  context.fill(fill);

  context.strokeStyle = accent;
  context.lineWidth = 3;
  context.lineJoin = 'round';
  context.stroke(path);

  // Where they would have bought.
  const ex = x(entryIndex);
  const ey = y(entryIndex);
  context.strokeStyle = 'rgba(233,240,221,0.28)';
  context.lineWidth = 1.5;
  context.setLineDash([5, 5]);
  context.beginPath();
  context.moveTo(ex, box.y);
  context.lineTo(ex, box.y + box.h);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = '#080B07';
  context.strokeStyle = '#E9F0DD';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(ex, ey, 8, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  // And where it ended.
  const lx = x(history.length - 1);
  const ly = y(history.length - 1);
  context.fillStyle = accent;
  context.beginPath();
  context.arc(lx, ly, 8, 0, Math.PI * 2);
  context.fill();
}

/**
 * The share card.
 *
 * Two columns that never overlap: the arithmetic on the left, the coin's own
 * price curve on the right. The previous version pasted the character across
 * the middle and the verdict ran straight through him.
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
    history: PricePoint[];
    entryIndex: number;
  },
  locale: string,
): Promise<void> {
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const regret = data.multiple > 1;
  const accent = regret ? '#8FCE02' : '#F0A06A';

  const PAD = 76;
  const TEXT_W = 560;
  const display = (size: number) => `italic 900 ${size}px Archivo, sans-serif`;
  const mono = (size: number) => `700 ${size}px "JetBrains Mono", monospace`;

  context.fillStyle = '#080B07';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glow = context.createRadialGradient(880, 300, 0, 880, 300, 520);
  glow.addColorStop(0, `${accent}26`);
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

  context.fillStyle = accent;
  context.font = mono(20);
  context.fillText('THE WHAT $IF MACHINE', PAD, 92);

  // A separator rather than a preposition: "in Jul 2019" is right for a month
  // and wrong for a day, and the fix would need a second word in four languages.
  const line = `${formatUsd(data.amount, locale)} of ${data.symbol}  ·  ${monthLabel(data.month, locale)}`;
  context.fillStyle = '#9AA889';
  fitLine(context, line, (size) => `400 ${size}px Archivo, sans-serif`, TEXT_W, 26, 16);
  context.fillText(line, PAD, 142);

  const multiple =
    data.multiple >= 100 ? `${Math.round(data.multiple)}×` : `${data.multiple.toFixed(1)}×`;
  fitLine(context, multiple, display, TEXT_W, 132, 60);
  context.fillStyle = accent;
  context.fillText(multiple, PAD, 268);

  const arrow = `${formatUsd(data.amount, locale)} → ${formatUsd(data.value, locale)}`;
  fitLine(context, arrow, mono, TEXT_W, 34, 18);
  context.fillStyle = '#E9F0DD';
  context.fillText(arrow, PAD, 326);

  context.font = display(50);
  const verdictLines = wrapToWidth(context, data.verdict.toUpperCase(), TEXT_W).slice(0, 2);
  context.fillStyle = '#E9F0DD';
  verdictLines.forEach((text, i) => context.fillText(text, PAD, 442 + i * 56));

  context.strokeStyle = 'rgba(34,48,18,0.9)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(PAD, CARD_HEIGHT - 108);
  context.lineTo(PAD + TEXT_W, CARD_HEIGHT - 108);
  context.stroke();

  context.font = mono(19);
  context.fillStyle = accent;
  context.fillText('WHATIFONHOOD.COM/MACHINE', PAD, CARD_HEIGHT - 66);

  context.font = mono(14);
  context.fillStyle = '#5C6B4F';
  context.fillText('HISTORICAL PRICES · NOT FINANCIAL ADVICE', PAD, CARD_HEIGHT - 36);

  // The graphic: the coin's own history, with the entry marked.
  drawHistoryCurve(
    context,
    data.history,
    data.entryIndex,
    { x: 700, y: 150, w: 430, h: 300 },
    accent,
  );

  // The coin, on the curve's baseline.
  try {
    const logo = await loadImage(`/machine/logos/${data.symbol}.webp`);
    context.drawImage(logo, 700, 92, 40, 40);
  } catch {
    /* a missing logo is cosmetic */
  }
  context.font = mono(20);
  context.fillStyle = '#9AA889';
  context.fillText(data.symbol, 752, 120);

  // The character signs the card rather than being pasted across it.
  try {
    const pose = await loadImage(`/machine/poses/${data.pose}.webp`);
    const height = 150;
    const width = (pose.width / pose.height) * height;
    context.drawImage(pose, CARD_WIDTH - width - 70, CARD_HEIGHT - height - 34, width, height);
  } catch {
    /* the numbers still read without it */
  }
}

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

  // Either shape: a month for most coins, a day for a young one like $IF.
  const month = params.get('from');
  if (month && /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/.test(month)) {
    state.month = month;
  }

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

  /** Guards against an older, slower search overwriting a newer one. */
  let searchToken = 0;

  const renderResults = async (query: string) => {
    const token = ++searchToken;
    const matches = await searchAllCoins(coins, query);
    // A slow long-tail lookup must not clobber what the user has since typed.
    if (token !== searchToken) return;
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
    const history = await getCoinHistory(coin.symbol, coin.coingeckoId);
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
          history: selection.history,
          entryIndex: index,
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

  search.addEventListener('input', () => void renderResults(search.value));
  search.addEventListener('focus', () => void renderResults(search.value));
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
