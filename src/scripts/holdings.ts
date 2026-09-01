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

/**
 * Fits a line of text to a width by stepping the size down.
 *
 * The balance is the hero of the card and its length varies enormously — three
 * digits or eleven — so the size has to follow the number rather than the number
 * being trusted to fit a fixed size.
 */
function fitLine(
  context: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  maxWidth: number,
  start: number,
  min = 24,
): number {
  let size = start;
  while (size > min) {
    context.font = font(size);
    if (context.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  context.font = font(size);
  return size;
}

/** Wraps text to a width, for the verdict line. */
function wrapLines(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * The share-of-supply ring.
 *
 * This is what makes the card worth posting: the number alone is abstract, but
 * a holding drawn against the whole billion says something a figure cannot.
 * It is real data, different for everybody, and it is the graphic rather than
 * a decoration sitting next to one.
 *
 * Tiny holdings still get a visible sliver — an arc of literally zero length
 * would read as a rendering failure rather than as a small position.
 */
function drawSupplyRing(
  context: CanvasRenderingContext2D,
  centreX: number,
  centreY: number,
  radius: number,
  share: number,
): void {
  const width = 26;
  const start = -Math.PI / 2;
  const sweep = Math.max(0.045, Math.min(1, share)) * Math.PI * 2;

  context.lineCap = 'round';

  // The whole supply.
  context.beginPath();
  context.arc(centreX, centreY, radius, 0, Math.PI * 2);
  context.strokeStyle = '#1B2610';
  context.lineWidth = width;
  context.stroke();

  // Their part of it.
  const sweepGradient = context.createLinearGradient(
    centreX - radius,
    centreY - radius,
    centreX + radius,
    centreY + radius,
  );
  sweepGradient.addColorStop(0, '#C4DC43');
  sweepGradient.addColorStop(1, '#5F9A05');

  context.beginPath();
  context.arc(centreX, centreY, radius, start, start + sweep);
  context.strokeStyle = sweepGradient;
  context.lineWidth = width;
  context.stroke();

  // Tick marks every ten percent, so the ring reads as a scale not a doughnut.
  context.lineWidth = 2;
  context.strokeStyle = 'rgba(233,240,221,0.10)';
  for (let i = 0; i < 4; i += 1) {
    const angle = start + (i / 4) * Math.PI * 2;
    context.beginPath();
    context.moveTo(
      centreX + Math.cos(angle) * (radius - width / 2 - 6),
      centreY + Math.sin(angle) * (radius - width / 2 - 6),
    );
    context.lineTo(
      centreX + Math.cos(angle) * (radius - width / 2 - 16),
      centreY + Math.sin(angle) * (radius - width / 2 - 16),
    );
    context.stroke();
  }
}

/**
 * The share card.
 *
 * Laid out as two columns that never overlap: words on the left, the ring on
 * the right. The previous version pasted the character over the middle of the
 * card and the verdict ran straight through his arm.
 */
async function drawCard(
  canvas: HTMLCanvasElement,
  data: {
    tokens: number;
    usd?: number;
    band: string;
    pose: string;
    verdict: string;
    supplyShare: number;
    sharePercent: string;
  },
): Promise<void> {
  const context = canvas.getContext('2d');
  if (!context) return;
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const PAD = 76;
  const TEXT_W = 600;
  const RING_X = 930;
  const RING_Y = 338;
  const RING_R = 158;

  const display = (size: number) => `italic 900 ${size}px 'Archivo', sans-serif`;
  const mono = (size: number) => `700 ${size}px 'JetBrains Mono', monospace`;

  // Ground
  context.fillStyle = '#080B07';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const glow = context.createRadialGradient(RING_X, RING_Y, 0, RING_X, RING_Y, 420);
  glow.addColorStop(0, 'rgba(143,206,2,0.16)');
  glow.addColorStop(1, 'rgba(8,11,7,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Barely-there texture, so the ground is not flat black. Any stronger and it
  // reads as a spreadsheet and competes with the ring.
  context.strokeStyle = 'rgba(34,48,18,0.30)';
  context.lineWidth = 1;
  for (let x = 0; x < CARD_WIDTH; x += 80) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, CARD_HEIGHT);
    context.stroke();
  }
  for (let y = 0; y < CARD_HEIGHT; y += 80) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(CARD_WIDTH, y);
    context.stroke();
  }

  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';

  // Band
  context.font = mono(22);
  context.fillStyle = '#8FCE02';
  context.fillText(data.band.toUpperCase(), PAD, 118);

  // Balance — the hero, sized to whatever the number turns out to be.
  const balance = formatCount(data.tokens, 'en');
  fitLine(context, balance, display, TEXT_W, 104, 44);
  context.fillStyle = '#E9F0DD';
  context.fillText(balance, PAD, 226);

  // Value
  context.font = mono(26);
  context.fillStyle = '#9AA889';
  context.fillText(
    `$IF${data.usd === undefined ? '' : `   ·   ${formatUsd(data.usd, 'en')}`}`,
    PAD,
    278,
  );

  // Verdict, wrapped inside the text column so it can never reach the ring.
  context.font = display(46);
  const lines = wrapLines(context, data.verdict.toUpperCase(), TEXT_W).slice(0, 3);
  context.fillStyle = '#E9F0DD';
  for (const [index, line] of lines.entries()) {
    context.fillText(line, PAD, 412 + index * 52);
  }

  // A hairline above the footer, to close the text column off.
  context.strokeStyle = 'rgba(34,48,18,0.9)';
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(PAD, CARD_HEIGHT - 108);
  context.lineTo(PAD + TEXT_W, CARD_HEIGHT - 108);
  context.stroke();

  // Mark
  context.font = mono(21);
  context.fillStyle = '#8FCE02';
  context.fillText('WHATIFONHOOD.COM', PAD, CARD_HEIGHT - 62);

  // The character signs the card rather than sitting behind the words: small,
  // sharp, tucked under the ring where nothing else is competing for room.
  try {
    const figure = await loadImage(`/machine/poses/${data.pose}.webp`);
    // Clears the ring above it and the card edge below it, both deliberately.
    const height = 132;
    const width = (figure.width / figure.height) * height;
    context.drawImage(figure, RING_X - width / 2, CARD_HEIGHT - height - 22, width, height);
  } catch {
    /* the card reads fine without it */
  }

  // The ring, and the share it represents.
  drawSupplyRing(context, RING_X, RING_Y, RING_R, data.supplyShare);

  context.textAlign = 'center';
  context.font = display(64);
  context.fillStyle = '#E9F0DD';
  context.fillText(data.sharePercent, RING_X, RING_Y + 6);

  context.font = mono(17);
  context.fillStyle = '#7D8C6E';
  context.fillText('OF ALL $IF', RING_X, RING_Y + 44);
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

    // Clear the previous answer before fetching the next. It used to stay on
    // screen while a new address loaded, so for a second or two the page showed
    // one wallet's balance under another wallet's request.
    result.hidden = true;
    root.dataset.loading = 'true';

    // A slow first lookup must not overwrite a faster second one.
    const request = ++latest;

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
      root.dataset.loading = 'false';
      if (request === latest) fail(labels.errorNetwork ?? '');
      return;
    }

    root.dataset.loading = 'false';
    if (request !== latest) return; // A newer lookup has already started.

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
      const supplyShare = tokens / TOKEN.totalSupply;
      await drawCard(canvas, {
        tokens,
        usd,
        band: bands[band.key] ?? '',
        pose: band.pose,
        verdict: verdicts[band.key] ?? '',
        supplyShare,
        // Small holdings would all render as "0.0%" and say nothing.
        sharePercent:
          supplyShare >= 0.001
            ? `${(supplyShare * 100).toFixed(2)}%`
            : supplyShare > 0
              ? '<0.1%'
              : '0%',
      });

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
      url.searchParams.set('url', 'https://whatifonhood.com/holdings/');
      share.href = url.toString();
      share.hidden = false;
    }
  });
}
