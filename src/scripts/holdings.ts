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
import { TOKEN } from '../config/site.ts';

const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 675;

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
  { atLeast: 1, pose: 'thinking', key: 'curious' },
  { atLeast: 0, pose: 'facepalm', key: 'empty' },
] as const;

function bandFor(tokens: number) {
  return BANDS.find((band) => tokens >= band.atLeast) ?? BANDS[BANDS.length - 1]!;
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(src));
    image.src = src;
  });
}

async function drawCard(
  canvas: HTMLCanvasElement,
  data: { tokens: number; usd?: number; band: string; pose: string; verdict: string },
): Promise<void> {
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  context.fillStyle = '#080B07';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glow = context.createRadialGradient(360, 320, 0, 360, 320, 620);
  glow.addColorStop(0, 'rgba(143,206,2,0.20)');
  glow.addColorStop(1, 'rgba(8,11,7,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.font = "700 22px 'JetBrains Mono', monospace";
  context.fillStyle = '#8FCE02';
  context.textAlign = 'left';
  context.fillText(data.band.toUpperCase(), 76, 96);

  context.font = "italic 900 108px 'Archivo', sans-serif";
  context.fillStyle = '#E9F0DD';
  context.fillText(formatCompact(data.tokens, 'en'), 76, 226);

  context.font = "700 30px 'JetBrains Mono', monospace";
  context.fillStyle = '#9AA889';
  context.fillText(
    `$IF${data.usd === undefined ? '' : `  ·  ${formatUsd(data.usd, 'en')}`}`,
    76,
    282,
  );

  context.font = "italic 900 58px 'Archivo', sans-serif";
  context.fillStyle = '#E9F0DD';
  context.fillText(data.verdict.toUpperCase(), 76, 430);

  context.font = "700 22px 'JetBrains Mono', monospace";
  context.fillStyle = '#8FCE02';
  context.fillText('WHATIFONHOOD.COM', 76, 590);

  try {
    const figure = await loadImage(`/machine/poses/${data.pose}.webp`);
    const height = 520;
    const width = (figure.width / figure.height) * height;
    context.drawImage(figure, CARD_WIDTH - width - 60, CARD_HEIGHT - height - 30, width, height);
  } catch {
    /* the card reads fine without the figure */
  }
}

export function initHoldings(locale: string): void {
  const root = document.querySelector<HTMLElement>('[data-holdings]');
  if (!root) return;

  const form = root.querySelector<HTMLFormElement>('[data-holdings-form]');
  const input = root.querySelector<HTMLInputElement>('[data-holdings-input]');
  const result = root.querySelector<HTMLElement>('[data-holdings-result]');
  const error = root.querySelector<HTMLElement>('[data-holdings-error]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-holdings-card]');
  const download = root.querySelector<HTMLAnchorElement>('[data-holdings-download]');
  const share = root.querySelector<HTMLAnchorElement>('[data-holdings-share]');
  if (!form || !input || !result) return;

  const labels: Record<string, string> = JSON.parse(root.dataset.labels ?? '{}');
  const bands: Record<string, string> = JSON.parse(root.dataset.bands ?? '{}');
  const verdicts: Record<string, string> = JSON.parse(root.dataset.verdicts ?? '{}');

  const setText = (key: string, value: string) => {
    const node = root.querySelector<HTMLElement>(`[data-out="${key}"]`);
    if (node) node.textContent = value;
  };

  const fail = (message: string) => {
    result.hidden = true;
    if (error) {
      error.textContent = message;
      error.hidden = false;
    }
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const address = input.value.trim();

    if (!ADDRESS.test(address)) {
      fail(diagnose(address, labels));
      return;
    }
    if (error) error.hidden = true;

    let tokens: number | undefined;
    let priceUsd: number | undefined;
    try {
      [tokens, priceUsd] = await Promise.all([
        getBalanceOf(address),
        getPairSnapshot()
          .then((snapshot) => snapshot.priceUsd)
          .catch(() => undefined),
      ]);
    } catch {
      fail(labels.errorNetwork ?? '');
      return;
    }

    if (tokens === undefined) {
      fail(labels.errorNetwork ?? '');
      return;
    }

    const band = bandFor(tokens);
    const usd = priceUsd === undefined ? undefined : tokens * priceUsd;

    setText('tokens', formatCount(tokens, locale));
    setText('usd', usd === undefined ? '—' : formatUsd(usd, locale));
    setText('band', bands[band.key] ?? '');
    setText('verdict', verdicts[band.key] ?? '');
    result.hidden = false;

    // Records that a lookup happened. The address is deliberately not included.
    track('Wallet Lookup');

    if (canvas) {
      await drawCard(canvas, {
        tokens,
        usd,
        band: bands[band.key] ?? '',
        pose: band.pose,
        verdict: verdicts[band.key] ?? '',
      });

      canvas.toBlob((blob) => {
        if (!blob || !download) return;
        download.href = URL.createObjectURL(blob);
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
      url.searchParams.set('url', 'https://whatifonhood.com/holdings/');
      share.href = url.toString();
      share.hidden = false;
    }
  });
}
