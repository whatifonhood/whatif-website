/**
 * Refreshes the build-time figures in src/config/site.ts.
 *
 * The site shows these instantly and replaces them with live values once the
 * chain answers, so they only need to be roughly current — run this before a
 * release so the page is never wrong for the moment before JavaScript runs.
 *
 * Holder count comes from Blockscout, which sits behind a bot challenge and
 * sends no CORS header. That is exactly why it is fetched here, at build time,
 * rather than from the browser.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(here, '..', 'src', 'config', 'site.ts');
const config = readFileSync(configPath, 'utf8');

const readValue = (key) => {
  const match =
    config.match(new RegExp(`${key}: '([^']+)'`)) ??
    config.match(new RegExp(`${key}: (0x[0-9a-fA-F]+|[0-9_]+)`));
  return match?.[1]?.replace(/_/g, '');
};

const tokenAddress = readValue('address');
const poolAddress = readValue('primaryPool');
const burnAddress = readValue('burnAddress');
const rpcUrl = readValue('rpcUrl');
const explorerUrl = readValue('explorerUrl');

const timeout = { signal: AbortSignal.timeout(20_000) };

async function fetchPair() {
  const url = `https://api.dexscreener.com/latest/dex/pairs/robinhood/${poolAddress}`;
  const { pair } = await (await fetch(url, timeout)).json();
  if (!pair) throw new Error('DexScreener returned no pair');
  return {
    priceUsd: Number(pair.priceUsd),
    marketCapUsd: Math.round(pair.marketCap ?? pair.fdv ?? 0),
    liquidityUsd: Math.round(pair.liquidity?.usd ?? 0),
    volume24hUsd: Math.round(pair.volume?.h24 ?? 0),
  };
}

async function fetchBurned() {
  const data = `0x70a08231${burnAddress.slice(2).toLowerCase().padStart(64, '0')}`;
  const response = await fetch(rpcUrl, {
    ...timeout,
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to: tokenAddress, data }, 'latest'],
    }),
  });
  const { result } = await response.json();
  return Number(BigInt(result) / 10n ** 18n);
}

async function fetchHolders() {
  const url = `${explorerUrl}/api/v2/tokens/${tokenAddress}`;
  const response = await fetch(url, {
    ...timeout,
    headers: { accept: 'application/json', 'user-agent': 'whatifonhood-build/1.0' },
  });
  if (!response.ok) throw new Error(`Blockscout HTTP ${response.status}`);
  const body = await response.json();
  return Number(body.holders_count ?? body.holders);
}

const [pair, burned, holders] = await Promise.all([
  fetchPair(),
  fetchBurned(),
  fetchHolders().catch((error) => {
    console.warn(`  holders: keeping the existing value (${error.message})`);
    return null;
  }),
]);

const today = new Date().toISOString().slice(0, 10);
const previousHolders = Number(readValue('holders'));

const snapshot = `export const TOKEN_SNAPSHOT = {
  capturedAt: '${today}',
  priceUsd: ${pair.priceUsd},
  marketCapUsd: ${pair.marketCapUsd.toLocaleString('en-US').replace(/,/g, '_')},
  liquidityUsd: ${pair.liquidityUsd.toLocaleString('en-US').replace(/,/g, '_')},
  volume24hUsd: ${pair.volume24hUsd.toLocaleString('en-US').replace(/,/g, '_')},
  burnedTokens: ${burned.toLocaleString('en-US').replace(/,/g, '_')},
  holders: ${holders ?? previousHolders},
} as const;`;

const updated = config.replace(/export const TOKEN_SNAPSHOT = \{[\s\S]*?\} as const;/, snapshot);

if (updated === config) throw new Error('TOKEN_SNAPSHOT block not found in site.ts');
writeFileSync(configPath, updated);

console.warn(`Snapshot updated ${today}:`);
console.warn(`  price      $${pair.priceUsd}`);
console.warn(`  market cap $${pair.marketCapUsd.toLocaleString('en-US')}`);
console.warn(`  burned     ${burned.toLocaleString('en-US')}`);
console.warn(`  holders    ${holders ?? `${previousHolders} (unchanged)`}`);
