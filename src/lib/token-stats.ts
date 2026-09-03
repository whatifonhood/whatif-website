/**
 * Live token figures, read in the browser from public read-only APIs.
 *
 * Security notes, because this is the only place the site talks to the network:
 *  - Both endpoints are keyless and public. The site holds no credentials, so
 *    there is nothing here that could leak.
 *  - Every response is checked field by field before a single value is used. A
 *    malformed or hostile response is discarded, not rendered.
 *  - Every request has a hard timeout and no retries, so a slow API can never
 *    hold the page.
 *  - Nothing is written to the DOM as HTML — callers set `textContent`.
 *
 * The checks below are written by hand rather than with a schema library: there
 * are two response shapes and a handful of fields, and a validation dependency
 * would have been the single largest thing on the page.
 *
 * When a call fails the page keeps showing the build-time snapshot from
 * src/config/site.ts, labelled with its date. It never shows a spinner or a gap.
 */
import { DATA_APIS, TOKEN } from '../config/site.ts';

const REQUEST_TIMEOUT_MS = 6000;

export interface LiveStats {
  priceUsd?: number;
  marketCapUsd?: number;
  liquidityUsd?: number;
  volume24hUsd?: number;
  burnedTokens?: number;
  holders?: number;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** A finite, non-negative number, or undefined if the field is anything else. */
export function asPositiveNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

/**
 * Set while a public API is rate-limiting us, so the page stops asking.
 *
 * These endpoints answer 429 when a client is too eager. Continuing to poll
 * through it keeps the limit tripped and helps nobody, so a 429 puts every
 * caller on this origin on hold and the page keeps showing what it already had.
 */
const throttledUntil = new Map<string, number>();

/** How long a 429 stops us asking that origin. */
const BACKOFF_MS = 60_000;

/**
 * The largest response we will read into memory.
 *
 * These endpoints answer in single-digit kilobytes. The cap is not about them
 * behaving normally — it is what stops a compromised or simply broken upstream
 * from handing the tab an unbounded stream and freezing the phone it is running
 * on. 2 MB is roughly a thousand times the largest real response.
 */
const MAX_BYTES = 2_000_000;

/**
 * Backoff is per-origin.
 *
 * It used to be a single module-level timestamp, so one 429 from GeckoTerminal
 * also stopped the site reading DexScreener and the chain itself for a minute —
 * three unrelated services silenced by one of them being busy.
 */
function originOf(url: string): string {
  try {
    return new URL(url, window.location.origin).origin;
  } catch {
    return url;
  }
}

export function isThrottled(url: string): boolean {
  return Date.now() < (throttledUntil.get(originOf(url)) ?? 0);
}

export async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  if (isThrottled(url)) throw new Error('rate-limited; holding off');

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { accept: 'application/json', ...(init?.headers ?? {}) },
      /*
       * Three deliberate restrictions on how this request may behave.
       *
       * `credentials: 'omit'` — never attach cookies or HTTP auth to a
       * third-party call. Nothing here needs them, and a request that carries
       * an ambient credential is a request that can be made to act on the
       * user's behalf by whoever receives it.
       *
       * `redirect: 'error'` — these endpoints answer 200 directly (checked),
       * so a redirect means something has changed that we did not agree to.
       * Following it would let a hijacked or misconfigured API point us at an
       * origin the CSP was written before anybody had heard of. Failing instead
       * costs nothing: the caller already has to survive a failed request.
       *
       * `referrerPolicy: 'no-referrer'` — the page URL says which coin, wallet
       * or question the reader is looking at. That is the reader's business,
       * not the data provider's.
       */
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
    });
  } catch (error) {
    /*
     * A throw here is usually a rate limit wearing a disguise.
     *
     * GeckoTerminal's 429 carries no `access-control-allow-origin`, so the
     * browser blocks the response before any code sees it and `fetch` rejects
     * with a bare TypeError — the status below is unreachable in a browser, and
     * the backoff it sets never engaged. Every retry then hammered an endpoint
     * that was already refusing us. Offline and DNS failures land here too, and
     * backing off is the right answer for those as well.
     */
    throttledUntil.set(originOf(url), Date.now() + BACKOFF_MS);
    throw error;
  }

  if (response.status === 429) {
    throttledUntil.set(originOf(url), Date.now() + BACKOFF_MS);
    throw new Error(`${url} responded 429`);
  }
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);

  /*
   * Check what arrived before parsing it.
   *
   * `response.json()` will happily parse a body served as text/html, which is
   * how a captive portal or an error page ends up being treated as data. And it
   * reads the whole stream first, so a body with no end is a frozen tab. Read
   * the text with a cap, confirm the type, then parse.
   */
  const type = response.headers.get('content-type') ?? '';
  if (!/^application\/(json|.*\+json)/i.test(type)) {
    throw new Error(`${url} answered ${type || 'no content type'}, not JSON`);
  }

  const body = await response.text();
  if (body.length > MAX_BYTES) throw new Error(`${url} answered more than ${MAX_BYTES} bytes`);
  return JSON.parse(body);
}

/** Price, market cap, liquidity and volume for the main IF/WETH pool. */
async function fetchPairStats(): Promise<LiveStats> {
  const body = await fetchJson(DATA_APIS.dexscreenerPair);
  if (!isRecord(body) || !isRecord(body.pair)) return {};

  const pair = body.pair;
  const liquidity = isRecord(pair.liquidity) ? pair.liquidity.usd : undefined;
  const volume = isRecord(pair.volume) ? pair.volume.h24 : undefined;

  return {
    priceUsd: asPositiveNumber(pair.priceUsd),
    marketCapUsd: asPositiveNumber(pair.marketCap) ?? asPositiveNumber(pair.fdv),
    liquidityUsd: asPositiveNumber(liquidity),
    volume24hUsd: asPositiveNumber(volume),
  };
}

/**
 * The burn balance, read straight from the chain.
 *
 * `0x70a08231` is the 4-byte selector for `balanceOf(address)`; the argument is
 * the burn address left-padded to 32 bytes. This is a read-only `eth_call` — it
 * signs nothing and costs nothing.
 */
async function fetchBurnedTokens(): Promise<number | undefined> {
  const paddedAddress = TOKEN.burnAddress.slice(2).toLowerCase().padStart(64, '0');
  const body = await fetchJson(DATA_APIS.rpc, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: TOKEN.address, data: `0x70a08231${paddedAddress}` }, 'latest'],
    }),
  });

  if (!isRecord(body) || typeof body.result !== 'string') return undefined;
  // Reject anything that is not a hex quantity before handing it to BigInt.
  if (!/^0x[0-9a-fA-F]*$/.test(body.result)) return undefined;
  if (body.result === '0x' || body.result === '0x0') return 0;

  // BigInt keeps full precision; dividing by the decimals gives whole tokens.
  const raw = BigInt(body.result);
  return Number(raw / 10n ** BigInt(TOKEN.decimals));
}

/**
 * Everything the page needs, in one call. Individual failures are tolerated:
 * whatever succeeds is returned, and the caller keeps the snapshot for the rest.
 */
/** Holder count. The same keyless endpoint the dashboard reads. */
async function fetchHolders(): Promise<number | undefined> {
  const body = await fetchJson(
    `https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/${TOKEN.address}/info`,
  );
  if (!isRecord(body) || !isRecord(body.data) || !isRecord(body.data.attributes)) return undefined;
  const holders = body.data.attributes.holders;
  return isRecord(holders) ? asPositiveNumber(holders.count) : undefined;
}

export async function getLiveStats(): Promise<LiveStats> {
  // The holder tile on the landing page was a build constant sitting under a
  // heading that says the figures come from the chain. It is fetched now.
  const [pair, burned, holders] = await Promise.allSettled([
    fetchPairStats(),
    fetchBurnedTokens(),
    fetchHolders(),
  ]);

  return {
    ...(pair.status === 'fulfilled' ? pair.value : {}),
    ...(burned.status === 'fulfilled' && burned.value !== undefined
      ? { burnedTokens: burned.value }
      : {}),
    ...(holders.status === 'fulfilled' && holders.value !== undefined
      ? { holders: holders.value }
      : {}),
  };
}
