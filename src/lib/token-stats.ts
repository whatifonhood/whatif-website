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

export async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { accept: 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return response.json();
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
export async function getLiveStats(): Promise<LiveStats> {
  const [pair, burned] = await Promise.allSettled([fetchPairStats(), fetchBurnedTokens()]);

  return {
    ...(pair.status === 'fulfilled' ? pair.value : {}),
    ...(burned.status === 'fulfilled' && burned.value !== undefined
      ? { burnedTokens: burned.value }
      : {}),
  };
}
