/**
 * How to reproduce every number on this site, without this site.
 *
 * The landing page says "don't trust a website — including this one", and until
 * now gave nobody the means to act on it. Every figure here comes from a public,
 * keyless, read-only endpoint, so the exact call can simply be published.
 *
 * The commands are BUILT from the same constants the running code uses — the
 * pool address, the contract address, the RPC URL. They cannot drift into being
 * wrong without the site itself being wrong in the same way, which is the only
 * version of this worth publishing.
 *
 * Anything requiring a key, an account, or a signature does not belong here.
 */
import { CHAIN, TOKEN } from '../config/site.ts';

export interface Recipe {
  /** Which figure on the page this produces. Keyed to a copy string. */
  key: string;
  /** A shell command anyone can paste. */
  command: string;
  /** Where in the response the number is. */
  field: string;
}

const POOL = TOKEN.primaryPool.toLowerCase();
const GECKO_POOL = `https://api.geckoterminal.com/api/v2/networks/robinhood/pools/${POOL}`;
// Holders hang off the TOKEN, not the pool — a different endpoint entirely.
const GECKO_TOKEN = `https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/${TOKEN.address}`;
const DEX = `https://api.dexscreener.com/latest/dex/pairs/robinhood/${POOL}`;

/** An `eth_call`, written out as the curl anybody would run. */
function ethCall(to: string, data: string, note: string): string {
  return [
    `curl -s -X POST ${CHAIN.rpcUrl} \\`,
    `  -H 'content-type: application/json' \\`,
    `  -d '{"jsonrpc":"2.0","id":1,"method":"eth_call","params":[{"to":"${to}",`,
    `       "data":"${data}"},"latest"]}'`,
    `# ${note}`,
  ].join('\n');
}

export const RECIPES: Recipe[] = [
  {
    key: 'price',
    command: `curl -s '${DEX}'`,
    field: 'pairs[0].priceUsd',
  },
  {
    key: 'marketCap',
    command: `curl -s '${DEX}'`,
    field: 'pairs[0].marketCap',
  },
  {
    key: 'liquidity',
    command: `curl -s '${DEX}'`,
    field: 'pairs[0].liquidity.usd',
  },
  {
    key: 'volume',
    command: `curl -s '${DEX}'`,
    field: 'pairs[0].volume.h24',
  },
  {
    key: 'holders',
    command: `curl -s '${GECKO_TOKEN}/info'`,
    field: 'data.attributes.holders.count',
  },
  {
    key: 'burned',
    // balanceOf(0x…dEaD): selector 0x70a08231, then the address padded to 32 bytes.
    command: ethCall(
      TOKEN.address,
      `0x70a08231${TOKEN.burnAddress.slice(2).toLowerCase().padStart(64, '0')}`,
      'balanceOf(0x…dEaD) — hex wei, divide by 1e18',
    ),
    field: 'result',
  },
  {
    key: 'supply',
    command: ethCall(TOKEN.address, '0x18160ddd', 'totalSupply() — hex wei, divide by 1e18'),
    field: 'result',
  },
  {
    key: 'owner',
    command: ethCall(
      TOKEN.address,
      '0x8da5cb5b',
      'owner() — this contract reverts, because it has none',
    ),
    field: 'error.message',
  },
  {
    key: 'trades',
    command: `curl -s '${GECKO_POOL}/trades'`,
    field: 'data[].attributes',
  },
  {
    key: 'holderList',
    command: `curl -s '${CHAIN.explorerUrl}/api/v2/tokens/${TOKEN.address}/holders'`,
    field: 'items[].address.hash',
  },
];
