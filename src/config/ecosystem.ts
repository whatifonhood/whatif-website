/**
 * The tools listed in the Ecosystem section, in display order.
 *
 * Every one carries its own logo, served from this origin.
 *
 * `name` is the key used to look up the description in the language files, so
 * adding a tool means adding it here and adding one line to each `blurbs` block
 * in src/content/*.ts — TypeScript will not catch a missing blurb, but the card
 * falls back to showing no description rather than breaking.
 *
 * `logo` is a file in src/assets/logos. Tools without a logo get a lime arrow
 * tile instead; we do not fetch third-party logos at runtime.
 */
import { MARKETS, ONRAMPS } from './site.ts';

export interface EcosystemTool {
  name: string;
  url: string;
  /** A file in src/assets/logos, served from this origin — never hotlinked. */
  logo:
    | 'uniswap'
    | 'dexscreener'
    | 'coingecko'
    | 'coinmarketcap'
    | 'blockscout'
    | 'metamask'
    | 'robinhood';
}

export const ECOSYSTEM: EcosystemTool[] = [
  { name: 'Uniswap', url: MARKETS.uniswap, logo: 'uniswap' },
  { name: 'DexScreener', url: MARKETS.dexscreener, logo: 'dexscreener' },
  { name: 'CoinGecko', url: MARKETS.coingecko, logo: 'coingecko' },
  { name: 'CoinMarketCap', url: MARKETS.coinmarketcap, logo: 'coinmarketcap' },
  { name: 'Blockscout', url: MARKETS.contract, logo: 'blockscout' },
  { name: 'MetaMask', url: ONRAMPS.metamask, logo: 'metamask' },
  { name: 'Robinhood Wallet', url: ONRAMPS.robinhoodWallet, logo: 'robinhood' },
];
