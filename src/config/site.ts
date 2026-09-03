/**
 * The single source of truth for every fact about $IF.
 *
 * If a contract address, link, handle or chain parameter appears anywhere on the
 * site, it comes from this file. Nothing else in the repo hard-codes one, so
 * changing a link here changes it everywhere — and `tests/smoke.spec.ts` fails the
 * build if a page ever shows a contract address that disagrees with this file.
 *
 * Editing this file is the most common change anyone will make. It needs no
 * knowledge of the rest of the codebase.
 */

/** The site itself. */
export const SITE = {
  name: 'What $IF',
  ticker: '$IF',
  /** Canonical origin. Used for sitemap, canonical tags and social card URLs. */
  url: 'https://whatifonhood.com',
  /** Shown in the browser tab and as the social card title. */
  title: 'What $IF — the meme coin on Robinhood Chain',
  description:
    'The meme coin for the perpetually curious. What if you aped earlier? What if you held? $IF on Robinhood Chain.',
  /** Repeated under holder posts; the one line that never changes. */
  mantra: 'Still asking.',
} as const;

/**
 * The token.
 *
 * `address` is the checksummed (EIP-55) contract address. It is always rendered
 * in full, in a monospace face, next to a copy button — never truncated, never in
 * a display font, so that a reader can compare it character by character against
 * the official channels.
 */
export const TOKEN = {
  address: '0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1',
  symbol: 'IF',
  decimals: 18,
  /** 1,000,000,000 — fixed at launch, no mint function. */
  totalSupply: 1_000_000_000,
  /** Tokens sent here are unrecoverable; this balance is the live burn counter. */
  burnAddress: '0x000000000000000000000000000000000000dEaD',
  /** The deepest market: Uniswap v3 IF/WETH, 1% fee tier. */
  primaryPool: '0x39A200271525E9641e799127bdAB299DAeF21953',
} as const;

/**
 * Robinhood Chain network parameters.
 *
 * These are the exact values a wallet needs, and the same object is passed to
 * `wallet_addEthereumChain` by the "Add Robinhood Chain" button. That call is a
 * standard browser wallet API: it adds a network, it does not connect a wallet,
 * and this site never asks anyone to connect one.
 *
 * Source: https://docs.robinhood.com/chain/add-network-to-wallet
 */
export const CHAIN = {
  name: 'Robinhood Chain',
  /** 4663 decimal. Wallets expect the hex form. */
  id: 4663,
  idHex: '0x1237',
  rpcUrl: 'https://rpc.mainnet.chain.robinhood.com',
  currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://robinhoodchain.blockscout.com',
} as const;

/** Official channels. Anything not on this list is not us. */
export const LINKS = {
  x: 'https://x.com/WhatIFonHOOD',
  xHandle: '@WhatIFonHOOD',
  telegram: 'https://t.me/WhatIFonHoodChain',
  telegramHandle: 't.me/WhatIFonHoodChain',
} as const;

/** Where $IF can be traded, tracked and verified. */
export const MARKETS = {
  uniswap: `https://app.uniswap.org/swap?outputCurrency=${TOKEN.address}&chain=robinhood`,
  dexscreener: `https://dexscreener.com/robinhood/${TOKEN.primaryPool}`,
  coingecko:
    'https://www.coingecko.com/en/coins/what-if-3?chart=type%3Dprice%26mode%3Dline%26timeframe%3Dd30',
  coinmarketcap: 'https://coinmarketcap.com/currencies/what-if/',
  /** The contract on the block explorer — the proof behind every claim on the site. */
  contract: `${CHAIN.explorerUrl}/token/${TOKEN.address}`,
  /** The live burn balance, verifiable by anyone. */
  burn: `${CHAIN.explorerUrl}/token/${TOKEN.address}?tab=holders`,
} as const;

/** Getting ETH onto Robinhood Chain, for the "how to buy" steps. */
export const ONRAMPS = {
  robinhoodApp: 'https://robinhood.com/',
  /** Robinhood's own guide to getting funds onto the chain. */
  bridgingGuide: 'https://docs.robinhood.com/chain/bridging/',
  metamask: 'https://metamask.io/download',
  robinhoodWallet: 'https://robinhood.com/wallet/',
  chainDocs: 'https://docs.robinhood.com/chain/add-network-to-wallet',
} as const;

/**
 * Read-only public APIs used for the live numbers on the page.
 *
 * All of these are keyless: the site has no accounts, no API keys and therefore
 * no secrets to leak. Every response is validated against a schema in
 * `src/lib/` before it reaches the page, and every request has a timeout and a
 * fallback to the figures in `TOKEN_SNAPSHOT` below.
 *
 * Blockscout is the exception: it sits behind a bot challenge and sends no CORS
 * header, so the holder count cannot be fetched from a browser at all. It is
 * shown from the snapshot and refreshed when the site is rebuilt.
 */
export const DATA_APIS = {
  dexscreenerPair: `https://api.dexscreener.com/latest/dex/pairs/robinhood/${TOKEN.primaryPool}`,
  rpc: CHAIN.rpcUrl,
} as const;

/**
 * Figures captured at build time, shown instantly and while the live call is in
 * flight — so the page never renders a spinner or an empty space.
 *
 * Refresh with `npm run snapshot` (see README) whenever the site is rebuilt.
 */
export const TOKEN_SNAPSHOT = {
  capturedAt: '2026-09-03',
  priceUsd: 0.007064,
  marketCapUsd: 6_403_082,
  liquidityUsd: 365_130,
  volume24hUsd: 373_559,
  burnedTokens: 93_578_227,
  holders: 6816,
} as const;

/**
 * How old the snapshot may get before the build complains.
 *
 * These figures are shown instantly and while the live call is in flight, so a
 * stale one is visible to every visitor for a moment and to anyone whose fetch
 * fails for their whole session. `npm run snapshot` is manual, so without a
 * gate nothing forces it to ever run again. Checked by tests/headers.spec.ts.
 */
export const SNAPSHOT_MAX_AGE_DAYS = 30;

/** Percentage of total supply that has been burned. Derived, never typed by hand. */
export const BURNED_PERCENT = (TOKEN_SNAPSHOT.burnedTokens / TOKEN.totalSupply) * 100;

/** Languages the site is published in. Adding one is documented in the README. */
export const LOCALES = ['en', 'zh', 'tr', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

/** Shown in the language switcher. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'EN',
  zh: '中文',
  tr: 'TR',
  es: 'ES',
};

/** The URL prefix for each language. English is served from the root. */
export const LOCALE_PATHS: Record<Locale, string> = {
  en: '/',
  zh: '/zh/',
  tr: '/tr/',
  es: '/es/',
};
