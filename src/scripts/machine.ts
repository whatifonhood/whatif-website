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
import { CARD_COINS, coinArt, drawMachineCard } from '../lib/card-designs.ts';

const MAX_AMOUNT = 1_000_000;

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

/** Wraps text to a width, returning the lines. */
/**
 * Draws the share card: the number, the arithmetic, and IF Man reacting to it.
 *
 * The card is the point of the tool — it is what travels. The character is what
 * makes it a joke rather than a screenshot of a calculator.
 */

/**
 * The share card.
 *
 * Layout and artwork live in src/lib/card-designs.ts, shared with the question
 * generator, the wallet lookup and the coin pull so the four stay one family.
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
    history: PricePoint[];
    entryIndex: number;
  },
  locale: string,
): Promise<void> {
  // Won or lost decides which coin he wears, and the card's whole accent.
  const coin = await cardCoin(data.multiple >= 1 ? CARD_COINS.machineWin : CARD_COINS.machineLoss);
  drawMachineCard(
    canvas,
    {
      symbol: data.symbol,
      month: monthLabel(data.month, locale),
      amount: formatUsd(data.amount, locale),
      value: formatUsd(data.value, locale),
      multiple: data.multiple,
      verdict: data.verdict,
      history: data.history,
      entryIndex: data.entryIndex,
    },
    coin,
  );
}

function drawSpark(svg: SVGSVGElement, history: PricePoint[], entryIndex: number): void {
  const width = 600;
  const height = 120;
  const prices = history.map(([, price]) => price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

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

  // Allowlisted against our own index, never trusted from the URL. A coin from
  // the long tail carries its id too, otherwise a shared link for one of the
  // eighteen thousand tail coins silently opened on DOGE showing different
  // numbers than the sender saw.
  const id = params.get('id');
  const coin = coins.find((entry) => entry.symbol === symbol.toUpperCase());
  if (!coin) {
    if (!id || !/^[a-z0-9-]{1,80}$/.test(id)) return null;
    return {
      coin: {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        rank: 99_999,
        firstMonth: '',
        coingeckoId: id,
      },
    };
  }

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

function writeStateToUrl(
  symbol: string,
  month: string,
  amount: number,
  coingeckoId?: string,
): void {
  const url = new URL(window.location.href);
  url.searchParams.set('coin', symbol);
  if (coingeckoId) url.searchParams.set('id', coingeckoId);
  else url.searchParams.delete('id');
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
  const failure = root.querySelector<HTMLElement>('[data-machine-failure]');
  const empty = root.querySelector<HTMLElement>('[data-machine-empty]');
  const spark = root.querySelector<SVGSVGElement>('[data-machine-spark]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-machine-card]');
  const shareLink = root.querySelector<HTMLAnchorElement>('[data-machine-share]');
  const downloadLink = root.querySelector<HTMLAnchorElement>('[data-machine-download]');
  if (!search || !results || !amount || !monthRange || !run || !output) return;

  const labels = {
    noResults: results.dataset.noResults ?? '',
    loadFailed: root.dataset.labelLoadFailed ?? '',
    shareText: shareLink?.dataset.template ?? '',
    since: root.dataset.labelSince ?? 'since',
    onDemand: root.dataset.labelOnDemand ?? 'prices on demand',
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

      /*
       * The mark.
       *
       * Only the coins with committed price history have a logo file — the
       * other seventeen thousand are searched from the long-tail index and
       * have none, and their logos live on a CDN this site's policy does not
       * allow. So a missing logo is replaced by a lettered disc rather than
       * removed, which also tells the two sets apart at a glance instead of
       * leaving most rows with a hole where a picture should be.
       */
      const mark = document.createElement('span');
      mark.className = 'result-mark';
      mark.textContent = coin.symbol.slice(0, 2);

      const logo = document.createElement('img');
      logo.src = `/machine/logos/${coin.symbol}.webp`;
      logo.alt = '';
      logo.width = 28;
      logo.height = 28;
      logo.loading = 'lazy';
      logo.className = 'result-logo';
      logo.addEventListener('error', () => logo.remove());
      logo.addEventListener('load', () => mark.remove());

      const text = document.createElement('span');
      text.className = 'result-text';

      const name = document.createElement('span');
      name.className = 'result-name';
      name.textContent = coin.name;

      // What the row can tell you before you pick it: how big the coin is,
      // and how far back the Machine can actually go.
      const meta = document.createElement('span');
      meta.className = 'result-meta';
      const facts: string[] = [];
      if (coin.rank > 0 && coin.rank < 99_000) facts.push(`#${coin.rank}`);
      if (coin.firstMonth) facts.push(`${labels.since} ${coin.firstMonth.slice(0, 4)}`);
      else facts.push(labels.onDemand);
      meta.textContent = facts.join('  ·  ');

      text.append(name, meta);

      const ticker = document.createElement('span');
      ticker.className = 'result-ticker';
      ticker.textContent = coin.symbol;

      button.append(mark, logo, text, ticker);
      button.addEventListener('click', () => void choose(coin));
      item.append(button);
      results.append(item);
    }
    results.hidden = false;
  };

  const choose = async (coin: CoinEntry, preset?: { month?: string; amount?: number }) => {
    // Close the dropdown first: a slow long-tail fetch used to leave it hanging
    // open with no sign anything had happened.
    search.value = '';
    results.hidden = true;
    if (failure) failure.hidden = true;
    root.dataset.loading = 'true';

    const history = await getCoinHistory(coin.symbol, coin.coingeckoId).catch(() => []);
    root.dataset.loading = 'false';

    if (history.length < 2) {
      // Say so. Silently doing nothing is the worst of the options, and it was
      // the one this took whenever a long-tail price fetch failed.
      if (failure) {
        failure.textContent = labels.loadFailed;
        failure.hidden = false;
      }
      return;
    }

    selection = { coin, history };

    if (chosen) {
      chosen.hidden = false;
      const logo = chosen.querySelector<HTMLImageElement>('[data-chosen-logo]');
      if (logo) {
        logo.hidden = false;
        logo.onerror = () => {
          logo.hidden = true;
        };
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
    const label = monthLabel(currentMonth(), locale);
    if (monthOut) monthOut.textContent = label;
    // Without this the slider announces its index, which names no month.
    monthRange.setAttribute('aria-valuetext', label);
  };

  const calculate = () => {
    if (!selection) return;
    const index = Number(monthRange.value);
    const then = selection.history[index];
    const now = selection.history.at(-1);
    if (!then || !now) return;

    // Clamp for the arithmetic, but do not write back into the field while it is
    // being typed in — rewriting it on every keystroke made clearing the box and
    // entering a new amount fight the user.
    const invested = Math.min(Math.max(Number(amount.value) || 0, 1), MAX_AMOUNT);

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
    writeStateToUrl(selection.coin.symbol, then[0], invested, selection.coin.coingeckoId);

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
  // Tidy the value when they are finished, not while they are still typing.
  amount.addEventListener('blur', () => {
    const value = Number(amount.value);
    if (!Number.isFinite(value) || value < 1) amount.value = '1';
    else if (value > MAX_AMOUNT) amount.value = String(MAX_AMOUNT);
  });
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
