/**
 * Market data for the dashboard.
 *
 * Two public, keyless APIs, both CORS-open, both read-only:
 *  - DexScreener for the pair snapshot (price, changes, volume, trade counts)
 *  - GeckoTerminal for price history and recent trades
 *
 * Every response is checked field by field before anything is displayed, every
 * request has a timeout, and a failure leaves the page showing what it already
 * had. The site holds no API keys, so there is nothing here to leak.
 */
import { TOKEN } from '../config/site.ts';
import { asPositiveNumber, fetchJson, isRecord } from './token-stats.ts';

const GECKO = `https://api.geckoterminal.com/api/v2/networks/robinhood/pools/${TOKEN.primaryPool.toLowerCase()}`;
const DEXSCREENER = `https://api.dexscreener.com/latest/dex/pairs/robinhood/${TOKEN.primaryPool.toLowerCase()}`;

export interface PairSnapshot {
  priceUsd?: number;
  marketCapUsd?: number;
  liquidityUsd?: number;
  volume24hUsd?: number;
  /** Percentage change over each window. */
  change: { h1?: number; h6?: number; h24?: number };
  /** Trade counts over the last 24 hours. */
  trades24h: { buys?: number; sells?: number };
  /** $IF held in the pool. */
  poolTokens?: number;
}

export interface Candle {
  /** Unix seconds. */
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volumeUsd: number;
}

export interface Trade {
  kind: 'buy' | 'sell';
  usd: number;
  tokens: number;
  time: number;
  wallet: string;
  txHash: string;
}

export type Timeframe = 'day' | 'week' | 'month' | 'all';

/** GeckoTerminal's endpoint and candle count for each timeframe we offer. */
const TIMEFRAMES: Record<Timeframe, { path: string; limit: number }> = {
  day: { path: 'hour?aggregate=1', limit: 24 },
  week: { path: 'hour?aggregate=4', limit: 42 },
  month: { path: 'day?aggregate=1', limit: 30 },
  // Everything the pool has. It opened in July 2026, so this is currently about
  // fifty daily candles; the limit is set high so it keeps working as it ages.
  all: { path: 'day?aggregate=1', limit: 1000 },
};

export async function getPairSnapshot(): Promise<PairSnapshot> {
  const body = await fetchJson(DEXSCREENER);
  const empty: PairSnapshot = { change: {}, trades24h: {} };
  if (!isRecord(body) || !isRecord(body.pair)) return empty;

  const pair = body.pair;
  const change = isRecord(pair.priceChange) ? pair.priceChange : {};
  const txns = isRecord(pair.txns) && isRecord(pair.txns.h24) ? pair.txns.h24 : {};
  const liquidity = isRecord(pair.liquidity) ? pair.liquidity : {};
  const volume = isRecord(pair.volume) ? pair.volume : {};

  const asChange = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;

  return {
    priceUsd: asPositiveNumber(pair.priceUsd),
    marketCapUsd: asPositiveNumber(pair.marketCap) ?? asPositiveNumber(pair.fdv),
    liquidityUsd: asPositiveNumber(liquidity.usd),
    volume24hUsd: asPositiveNumber(volume.h24),
    change: { h1: asChange(change.h1), h6: asChange(change.h6), h24: asChange(change.h24) },
    trades24h: {
      buys: asPositiveNumber(txns.buys),
      sells: asPositiveNumber(txns.sells),
    },
    poolTokens: asPositiveNumber(liquidity.base),
  };
}

/** Closing prices, oldest first, for the chart. */
export async function getPriceHistory(timeframe: Timeframe): Promise<Candle[]> {
  const { path, limit } = TIMEFRAMES[timeframe];
  const body = await fetchJson(`${GECKO}/ohlcv/${path}&limit=${limit}`);
  if (!isRecord(body) || !isRecord(body.data) || !isRecord(body.data.attributes)) return [];

  const list = body.data.attributes.ohlcv_list;
  if (!Array.isArray(list)) return [];

  const candles: Candle[] = [];
  for (const row of list) {
    // [timestamp, open, high, low, close, volume]
    if (!Array.isArray(row) || row.length < 6) continue;
    const [time, open, high, low, close, volumeUsd] = row.map(Number) as (number | undefined)[];
    if ([time, open, high, low, close].some((value) => value === undefined)) continue;
    if (![time, open, high, low, close].every((v) => Number.isFinite(v) && (v as number) > 0)) {
      continue;
    }
    candles.push({
      time: time as number,
      open: open as number,
      close: close as number,
      high: high as number,
      low: low as number,
      volumeUsd: volumeUsd ?? 0,
    });
  }
  // GeckoTerminal returns newest first; a chart reads oldest to newest.
  return candles.reverse();
}

/** The most recent trades on the pool, newest first. */
export async function getRecentTrades(): Promise<Trade[]> {
  const body = await fetchJson(`${GECKO}/trades`);
  if (!isRecord(body) || !Array.isArray(body.data)) return [];

  const trades: Trade[] = [];
  for (const entry of body.data) {
    if (!isRecord(entry) || !isRecord(entry.attributes)) continue;
    const a = entry.attributes;

    const kind = a.kind === 'buy' ? 'buy' : a.kind === 'sell' ? 'sell' : undefined;
    const usd = asPositiveNumber(a.volume_in_usd);
    const time = typeof a.block_timestamp === 'string' ? Date.parse(a.block_timestamp) : NaN;
    const wallet = typeof a.tx_from_address === 'string' ? a.tx_from_address : '';
    const txHash = typeof a.tx_hash === 'string' ? a.tx_hash : '';
    if (
      !kind ||
      usd === undefined ||
      !Number.isFinite(time) ||
      !/^0x[a-fA-F0-9]{40}$/.test(wallet)
    ) {
      continue;
    }

    // On a buy the pool gives out $IF; on a sell it takes $IF in.
    const tokens = asPositiveNumber(kind === 'buy' ? a.to_token_amount : a.from_token_amount) ?? 0;

    trades.push({ kind, usd, tokens, time, wallet, txHash });
  }
  return trades;
}
