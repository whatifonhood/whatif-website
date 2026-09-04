/**
 * The wallet lookup.
 *
 * Paste any address, see what it holds, take a card away. There is no wallet
 * connection, no signature and no permission: a token balance is public data on
 * a public ledger, and this reads it the same way a block explorer would.
 *
 * What that means in practice, and what the page says out loud:
 *  - the address is typed, never requested from a wallet
 *  - nothing is stored, and nothing is sent anywhere except the chain
 *  - the analytics event records that a lookup happened, never the address
 */
import { getBalanceOf, getPairSnapshot } from '../lib/market.ts';
import { formatCompact, formatCount, formatUsd } from '../lib/format.ts';
import { track } from '../lib/analytics.ts';
import { CHAIN, SITE, TOKEN } from '../config/site.ts';
import { CARD_COINS, coinArt, drawHoldingsCard, readyFonts } from '../lib/card-designs.ts';
import { canvasBlob, shareOrDownload } from '../lib/share.ts';

const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

/**
 * How a holding is described.
 *
 * Bands rather than a leaderboard position: a rank would need the full holder
 * list, which no public endpoint gives us, and inventing one would be a lie.
 */
const BANDS = [
  { atLeast: 10_000_000, pose: 'victory', key: 'whale' },
  { atLeast: 1_000_000, pose: 'victory', key: 'shark' },
  { atLeast: 100_000, pose: 'arms-crossed', key: 'holder' },
  // Anything above nothing. The floor used to be one whole token, so a wallet
  // holding 0.9 $IF was told it held nothing.
  { atLeast: Number.MIN_VALUE, pose: 'thinking', key: 'curious' },
  { atLeast: 0, pose: 'facepalm', key: 'empty' },
] as const;

/**
 * The two addresses people paste first, because both are on the stats page.
 * Calling the burn address a whale was wrong in a way that made the whole tool
 * look unserious, so each gets its own name and verdict.
 */
const KNOWN: Record<string, 'burn' | 'pool'> = {
  [TOKEN.burnAddress.toLowerCase()]: 'burn',
  [TOKEN.primaryPool.toLowerCase()]: 'pool',
};

function bandFor(address: string, tokens: number): string {
  const known = KNOWN[address.toLowerCase()];
  if (known) return known;
  return (BANDS.find((band) => tokens >= band.atLeast) ?? BANDS[BANDS.length - 1]!).key;
}

/** Whole tokens, or the fraction when the fraction is all there is. */
function formatTokens(tokens: number, locale: string): string {
  if (tokens > 0 && tokens < 1) {
    return tokens.toLocaleString(locale, { maximumSignificantDigits: 3 });
  }
  return formatCount(tokens, locale);
}

/** Share of supply, with enough digits for a small wallet to read as more than zero. */
function formatShare(share: number, locale: string): string {
  const percent = share * 100;
  const digits = percent >= 1 ? 2 : percent >= 0.01 ? 3 : 6;
  return `${percent.toLocaleString(locale, { maximumFractionDigits: digits })}%`;
}

/**
 * Explains what was pasted when it is not an address.
 *
 * People paste ENS names, transaction hashes and addresses with a stray space.
 * Returning a confusing zero for all of them is worse than saying what is wrong.
 */
function diagnose(input: string, labels: Record<string, string>): string {
  const value = input.trim();
  if (value === '') return labels.errorEmpty ?? '';
  if (/\.(eth|crypto|x)$/i.test(value)) return labels.errorEns ?? '';
  if (/^0x[a-fA-F0-9]{64}$/.test(value)) return labels.errorTxHash ?? '';
  if (!value.startsWith('0x')) return labels.errorPrefix ?? '';
  return labels.errorShape ?? '';
}

/**
 * The share card.
 *
 * Layout and artwork live in src/lib/card-designs.ts, shared with the Machine,
 * the question generator and the coin pull so the four stay one family.
 */
async function drawCard(
  canvas: HTMLCanvasElement,
  data: {
    tokens: number;
    usd?: number;
    band: string;
    verdict: string;
    supplyShare: number;
  },
  locale: string,
): Promise<void> {
  await readyFonts();
  drawHoldingsCard(
    canvas,
    {
      tokens: formatCompact(data.tokens, locale),
      usd: data.usd === undefined ? undefined : formatUsd(data.usd, locale),
      band: data.band,
      line: data.verdict,
      share: data.supplyShare,
    },
    await cardCoin(CARD_COINS.holdings),
  );
}

export function initHoldings(locale: string): void {
  /** The current card's blob URL, released before the next one replaces it. */
  let cardUrl: string | null = null;
  /** Counter so a slow lookup cannot overwrite a newer one. */
  let latest = 0;
  const root = document.querySelector<HTMLElement>('[data-holdings]');
  if (!root) return;

  const form = root.querySelector<HTMLFormElement>('[data-holdings-form]');
  const input = root.querySelector<HTMLInputElement>('[data-holdings-input]');
  const result = root.querySelector<HTMLElement>('[data-holdings-result]');
  const error = root.querySelector<HTMLElement>('[data-holdings-error]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-holdings-card]');
  const download = root.querySelector<HTMLAnchorElement>('[data-holdings-download]');
  const share = root.querySelector<HTMLAnchorElement>('[data-holdings-share]');
  const explorer = root.querySelector<HTMLAnchorElement>('[data-holdings-explorer]');
  const submit = form?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!form || !input || !result) return;

  const labels: Record<string, string> = JSON.parse(root.dataset.labels ?? '{}');
  const bands: Record<string, string> = JSON.parse(root.dataset.bands ?? '{}');
  const verdicts: Record<string, string> = JSON.parse(root.dataset.verdicts ?? '{}');

  const setText = (key: string, value: string) => {
    const node = root.querySelector<HTMLElement>(`[data-out="${key}"]`);
    if (node) node.textContent = value;
  };

  /**
   * Visible while the chain is being asked. The tap used to change nothing on
   * screen for up to six seconds, and on a phone the answer then appeared below
   * the fold — so "Check it" looked like a button that did nothing.
   */
  const idleLabel = submit?.textContent ?? '';
  const setBusy = (on: boolean) => {
    root.dataset.loading = String(on);
    result.setAttribute('aria-busy', String(on));
    if (submit) {
      submit.disabled = on;
      submit.textContent = on && labels.checking ? labels.checking : idleLabel;
    }
  };

  const fail = (message: string) => {
    result.hidden = true;
    if (error) {
      error.textContent = message;
      error.hidden = false;
      // The message is announced; this ties it to the field it is about.
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', error.id || 'address-error');
    }
  };

  // The download goes through the share sheet where the device has one.
  download?.addEventListener('click', (event) => {
    if (!canvas || download.hidden) return;
    event.preventDefault();
    void canvasBlob(canvas).then((blob) => {
      if (blob) void shareOrDownload(blob, 'what-if-holdings.png');
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    // Chat apps wrap long strings, so a pasted address can arrive with a space
    // or a line break inside it. Strip every kind of whitespace, not just the ends.
    const address = input.value.replace(/\s+/g, '').replace(/^0X/, '0x');

    if (!ADDRESS.test(address)) {
      fail(diagnose(address, labels));
      return;
    }
    if (error) error.hidden = true;
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');

    // Clear the previous answer before fetching the next. It used to stay on
    // screen while a new address loaded, so for a second or two the page showed
    // one wallet's balance under another wallet's request.
    result.hidden = true;
    setBusy(true);

    // A slow first lookup must not overwrite a faster second one.
    const request = ++latest;

    let tokens: number | undefined;
    let priceUsd: number | undefined;
    try {
      [tokens, priceUsd] = await Promise.all([
        // A person's own request, not a poll: see the note on `oneShot`.
        getBalanceOf(address, { oneShot: true }),
        getPairSnapshot()
          .then((snapshot) => snapshot.priceUsd)
          .catch(() => undefined),
      ]);
    } catch {
      setBusy(false);
      if (request === latest) fail(labels.errorNetwork ?? '');
      return;
    }

    setBusy(false);
    if (request !== latest) return; // A newer lookup has already started.

    if (tokens === undefined) {
      fail(labels.errorNetwork ?? '');
      return;
    }

    const band = bandFor(address, tokens);
    const usd = priceUsd === undefined ? undefined : tokens * priceUsd;
    const supplyShare = tokens / TOKEN.totalSupply;

    setText('tokens', formatTokens(tokens, locale));
    setText('usd', usd === undefined ? '—' : formatUsd(usd, locale));
    setText('band', bands[band] ?? '');
    setText('verdict', verdicts[band] ?? '');
    setText(
      'share',
      (labels.shareOfSupply ?? '{share}').replace('{share}', formatShare(supplyShare, locale)),
    );
    if (explorer) explorer.href = `${CHAIN.explorerUrl}/address/${address}`;
    result.hidden = false;
    // On a phone the answer lands below the fold; bring it into view.
    result.scrollIntoView({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });

    // Records that a lookup happened. The address is deliberately not included.
    track('Wallet Lookup');

    if (canvas) {
      await drawCard(
        canvas,
        {
          tokens,
          usd,
          band: bands[band] ?? '',
          verdict: verdicts[band] ?? '',
          supplyShare,
        },
        locale,
      );

      canvas.toBlob((blob) => {
        if (!blob || !download) return;
        // Release the previous one; every other generator in the repo does.
        if (cardUrl) URL.revokeObjectURL(cardUrl);
        cardUrl = URL.createObjectURL(blob);
        download.href = cardUrl;
        download.download = 'what-if-holdings.png';
        download.hidden = false;
      }, 'image/png');
    }

    if (share) {
      const url = new URL('https://x.com/intent/post');
      url.searchParams.set(
        'text',
        (labels.shareText ?? '')
          .replace('{tokens}', formatCompact(tokens, locale))
          .replace('{symbol}', TOKEN.symbol),
      );
      url.searchParams.set('url', `${SITE.url}/holdings/`);
      share.href = url.toString();
      share.hidden = false;
    }
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
