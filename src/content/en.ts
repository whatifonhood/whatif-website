import type { SiteCopy } from './types.ts';

export const en: SiteCopy = {
  htmlLang: 'en',

  nav: {
    links: [
      { label: 'The thesis', href: '#thesis' },
      { label: 'The numbers', href: '#numbers' },
      { label: 'How to buy', href: '#buy' },
      { label: 'FAQ', href: '#faq' },
    ],
    toolsLabel: 'Tools',
    tools: {
      pfp: { label: 'Find your coin', blurb: 'Four rarities, one is yours' },
      machine: { label: 'The What $IF Machine', blurb: 'What you would have made' },
      memes: { label: 'The vault', blurb: 'Free to steal' },
      maker: { label: 'Meme maker', blurb: 'Make one in ten seconds' },
      stats: { label: 'Stats', blurb: 'Every number, live' },
      brand: { label: 'Brand', blurb: 'Logos and artwork' },
    },
    buy: 'Buy $IF',
    pfp: 'Find your coin',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    languageLabel: 'Language',
  },

  hero: {
    liveOn: 'Live on Robinhood Chain',
    titleLead: 'What',
    titleTail: 'this is the one?',
    description:
      'The meme coin for the perpetually curious. What if you aped earlier? What if you held? What if this is the one?',
    buy: 'Buy $IF',
    chart: 'Chart',
    statsNote: 'Live from the chain. Refreshed when you load the page.',
  },

  marquee: [
    'What $IF',
    'you aped earlier?',
    'What if',
    'you held?',
    'What if',
    'this is the one?',
    'What if',
    'we never sold?',
    'What if',
    'it hits a billion?',
  ],

  cosmic: {
    kicker: 'What if',
    statements: [
      'What if I could save a life?',
      'What if I could cure cancer with one wish?',
      'What if love outlived us all?',
      'What if one voice could end a war?',
      'What if the broken became the builders?',
      'What if hope was never the lie?',
      "What if a child's dream rewrote tomorrow?",
      'What if mercy was stronger than power?',
      'What if we remembered every name?',
      'What if the darkest night held the dawn?',
      'What if forgiveness was the cure?',
      'What if no one grieved alone?',
    ],
  },

  thesis: {
    eyebrow: 'The thesis',
    heading: { lead: 'One question.', accent: 'Infinite upside.' },
    intro:
      "$IF isn't a utility token. It's not governance. It's the 3am thought every human has had, minted on the newest chain in the game.",
    pillars: [
      {
        title: 'It starts with a question',
        body: 'Every trade you ever regretted began with "what if?" $IF takes the question seriously enough to put it on a chain.',
      },
      {
        title: 'Built on Robinhood Chain',
        body: 'Fast blocks, cheap gas, and the name that dragged a generation into the market. Robinhood started as a what if too.',
      },
      {
        title: 'Nine percent already gone',
        body: 'Over 93 million $IF sits in a burn address nobody holds the keys to. That is not a promise — it is a balance you can read yourself.',
      },
      {
        title: 'Check everything',
        body: "The contract, the pool, the burn and the holder count are all public. We link to every one of them. Don't trust a website — including this one.",
      },
    ],
  },

  numbers: {
    eyebrow: 'The numbers',
    heading: { lead: 'No tricks.', accent: 'Just the math.' },
    intro:
      'A billion tokens, a public contract, and a burn address anyone can audit. The kind of token where this section is short.',
    contractLabel: 'Contract address',
    verifyNote: 'Check every character against our X and Telegram before you buy.',
    copy: 'Copy',
    copied: 'Copied',
    viewOnExplorer: 'View on Blockscout',
    stats: {
      price: 'Price',
      marketCap: 'Market cap',
      liquidity: 'Liquidity',
      volume: '24h volume',
      supply: 'Total supply',
      burned: 'Burned',
      holders: 'Holders',
      chain: 'Chain',
    },
    burnHeadline: 'burned and unrecoverable',
    burnBody:
      'Sent to 0x…dEaD, an address with no private key. Nobody can move these tokens — not the team, not you, not anyone.',
    asOf: 'as of',
    live: 'Live',
  },

  buy: {
    eyebrow: 'Get your bag',
    heading: { lead: 'Three steps.', accent: "That's it." },
    intro:
      "You need a wallet, some ETH on Robinhood Chain, and thirty seconds. Here's the whole thing.",
    steps: [
      {
        title: 'Get a wallet',
        body: 'MetaMask, OKX or Trust on a computer. Robinhood Wallet on your phone. Any of them will add Robinhood Chain for you the first time you visit a page that uses it.',
        action: 'Get MetaMask',
      },
      {
        title: 'Get ETH onto Robinhood Chain',
        body: 'Withdraw ETH from the Robinhood app and pick the Robinhood Chain network. Holding ETH on another chain? Robinhood publishes the bridging routes.',
        action: 'Bridging guide',
      },
      {
        title: 'Swap on Uniswap',
        body: 'Opens with $IF already selected on Robinhood Chain. Compare the address on that page against the one above before you confirm.',
        action: 'Swap on Uniswap',
      },
    ],
    venuesTitle: 'Track it, chart it, verify it',
    venues: [
      { label: 'Uniswap', blurb: 'The main IF/WETH pool.' },
      { label: 'DexScreener', blurb: 'Live price and liquidity.' },
      { label: 'CoinGecko', blurb: 'Market data and history.' },
      { label: 'CoinMarketCap', blurb: 'Rankings and supply.' },
      { label: 'Blockscout', blurb: 'The contract itself.' },
    ],
    safetyNote:
      'This site will never ask you to connect a wallet, sign a message or enter a seed phrase. If any page claiming to be $IF does, it is not us.',
  },

  pfpTeaser: {
    eyebrow: 'The pool',
    heading: { lead: 'Find the coin', accent: "that's you." },
    body: 'Hand-made $IF coins across four rarities. Tap once, get yours, set it as your profile picture. No wallet, no sign-up, nothing to connect.',
    cta: 'Open the generator',
  },

  vaultTeaser: {
    eyebrow: 'The vault',
    heading: { lead: 'Every meme.', accent: 'Free to steal.' },
    body: "Every meme we've made, in full resolution, ready to post. That is the point of them. Right-click responsibly.",
    cta: 'Open the vault',
  },

  ecosystem: {
    eyebrow: 'Ecosystem',
    heading: { lead: 'Tools we', accent: 'actually use.' },
    intro: 'How we trade, track and verify $IF. Every link opens the real thing.',
    blurbs: {
      Uniswap: 'Swap ETH for $IF on the chain’s main DEX.',
      DexScreener: 'Live price, liquidity and every trade.',
      CoinGecko: 'Price history, market cap, community stats.',
      CoinMarketCap: 'Ranking, supply and market data.',
      Blockscout: 'The contract, the holders, the burn.',
      MetaMask: 'The EVM wallet most people already have.',
      'Robinhood Wallet': 'Holds Robinhood Chain natively, on your phone.',
    },
  },

  roadmap: {
    eyebrow: 'Investors keep asking',
    heading: { lead: 'So…', accent: 'roadmap?' },
    fileName: 'if_roadmap_final_v3.pdf',
    lastEdited: '1 page · last edited: never',
    quarters: ['Q1 — what if', 'Q2 — what if', 'Q3 — still asking', 'Q4 — memes, probably'],
    stamp: 'Still asking.',
    footnote: 'No roadmap. No utility. No promises. For entertainment purposes only.',
  },

  faq: {
    eyebrow: 'No dumb questions',
    heading: { lead: 'Questions,', accent: 'answered.' },
    items: [
      {
        q: 'What is $IF?',
        a: '$IF is a meme coin on Robinhood Chain built around the one question every trader asks themselves at 3am: what if? There is no product roadmap and no utility. There is a question, a community, and a chart.',
      },
      {
        q: 'How do I get ETH onto Robinhood Chain?',
        a: 'This trips up most first-time buyers. The simplest route is to withdraw ETH from the Robinhood app and select the Robinhood Chain network. If your ETH is on another chain, Robinhood documents the bridges that reach it. Either way, leave a little ETH behind for gas.',
      },
      {
        q: 'Where do I buy it?',
        a: 'Uniswap on Robinhood Chain, using the contract address on this page. The deepest market is the IF/WETH pool. Always compare the address character by character — meme coins attract copycats, and one wrong character sends your money to a stranger.',
      },
      {
        q: 'How do I know I have the right token?',
        a: 'The only address we will ever publish is 0x232CDFc415D10b673845D83Dc02ba2eaBe7e30d1, and it appears in full on this page, on our X profile and in our Telegram. If a site shows you a shortened version, or a different one, close it.',
      },
      {
        q: 'Is there a tax?',
        a: "Nothing is added by the $IF contract on top of your trade. The 1% you'll see quoted on the main pool is Uniswap's own fee tier, which goes to the people providing liquidity — not to us. The contract is public on Blockscout; read it rather than taking a website's word for it.",
      },
      {
        q: 'What has been burned?',
        a: 'More than 93 million $IF — over 9% of the total supply — sits at 0x…dEaD, an address with no private key. Those tokens can never move again. It is a live balance on the block explorer, not a claim in a document.',
      },
      {
        q: 'Where is the community?',
        a: 'X is @WhatIFonHOOD and Telegram is t.me/WhatIFonHoodChain. Both are live and both are run by people who hold the coin. Everybody is the dev.',
      },
      {
        q: 'Is $IF an investment?',
        a: 'No. It is a meme coin with no intrinsic value, no team promises and no roadmap. Prices go down as easily as up, and most meme coins end at zero. Never spend more than you would be relaxed about losing entirely.',
      },
    ],
  },

  footer: {
    heading: { lead: 'What', accent: 'you joined?' },
    subtitle: 'The chart is right there. The question is right here.',
    buy: 'Buy $IF',
    telegram: 'Join Telegram',
    follow: 'Follow on X',
    chart: 'Chart',
    canonical: 'The only official site is whatifonhood.com. Everything else is someone else.',
    disclaimer:
      '$IF is a meme coin with no intrinsic value and no expectation of financial return. Nothing here is financial advice. Do your own research.',
    builtBy: 'Everybody is the dev.',
  },

  pages: {
    memes: {
      title: 'The Vault',
      heading: { lead: 'Every meme.', accent: 'Free to steal.' },
      intro:
        'Every $IF meme, full resolution, no watermark, no credit needed. Post them, print them, remix them. That is what they are for.',
      download: 'Download',
      all: 'All',
      searchLabel: 'Search memes',
      empty: 'Nothing matches that. Try another word.',
      count: 'memes',
    },
    brand: {
      title: 'Brand',
      heading: { lead: 'The marks,', accent: 'and how to use them.' },
      intro:
        'One brand, three marks: the coin identifies the token, the character identifies the world, the wordmark identifies the name. Take what you need.',
      download: 'Download',
      kitNote:
        'Logos, the avatar, vector wordmarks, banners, the character reference sheet and transparent poses — with the palette, the type and the rules in a readme.',
      rulesTitle: 'Three things that matter',
      rules: [
        'The coin always keeps its rim. That is what makes it read as currency.',
        'Never set the contract address in a display face, and never truncate it.',
        'No Robinhood feather. Write “on Robinhood Chain” instead.',
      ],
    },
    stats: {
      title: 'Stats',
      heading: { lead: 'Every number,', accent: 'live.' },
      intro: 'Price, liquidity, supply and the burn — read straight from Robinhood Chain.',
      sourceNote:
        'Price, liquidity and volume come from DexScreener; the burn is read straight from the chain. Both refresh when you load this page.',
      poolLabel: 'Main pool',
      openExplorer: 'Open the contract',
      openChart: 'Open the chart',
      timeframes: { day: '24H', week: '7D', month: '30D', all: 'ALL' },
      chartTypes: { candles: 'Candles', line: 'Line' },
      chartTitle: 'Price',
      feedTitle: 'Latest trades',
      biggestBuy: 'Biggest buy',
      buys: 'Buys',
      sells: 'Sells',
      buyLabel: 'Buy',
      sellLabel: 'Sell',
      viewTx: 'View',
      loading: 'Reading the chain…',
      failed:
        'Could not reach the market data just now. The figures above are from the last build.',
      feedNote: 'The most recent trades on the IF/WETH pool.',
    },
    machine: {
      title: 'The What $IF Machine',
      heading: { lead: 'What $IF you', accent: 'aped earlier?' },
      intro:
        'Pick a coin you missed, an amount, and a date. The machine does the arithmetic you have been avoiding.',
      coinLabel: 'The coin you missed',
      searchPlaceholder: 'Search a coin — bitcoin, doge, pepe…',
      noResults: 'Nothing by that name in the set.',
      emptyState: 'Pick a coin, an amount and a month. The machine does the rest.',
      investedLabel: 'You put in',
      worthLabel: 'It would be worth',
      boughtLabel: 'You would have held',
      entryLabel: 'Price then',
      todayLabel: 'Price now',
      coinCount: 'Priced monthly, since each coin started trading.',
      amountLabel: 'What you would have put in',
      dateLabel: 'When',
      calculate: 'Run it',
      resultLead: 'It would be worth',
      multiplier: 'multiplier',
      shareText: (amount, coin, month, value, multiple) =>
        `What $IF I'd put ${amount} into ${coin} in ${month}?\n\n${value}. ${multiple}.\n\nStill asking.`,
      verdicts: {
        dodged: 'You dodged that one.',
        fine: 'You would have been fine.',
        ouch: 'Try not to think about it.',
        painful: 'That one still hurts.',
        unbearable: 'Do not tell anyone about this.',
      },
      shareOnX: 'Post it on X',
      pivot: "What $IF you didn't miss the next one?",
      pivotCta: 'Buy $IF',
      disclaimer:
        'Rough arithmetic on historical prices, for entertainment. Past prices predict nothing.',
    },
    pfp: {
      title: 'PFP Generator',
      heading: { lead: 'Find the coin', accent: "that's you." },
      intro:
        'Tap generate, get a $IF coin, set it as your profile picture. No wallet, no sign-up, nothing to connect.',
      subline: 'Four rarities. Every pull is free.',
      generate: 'Generate my $IF',
      again: 'Again',
      hint: 'One tap. Nothing is stored anywhere but your own browser.',
      tiers: { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', legendary: 'Legendary' },
      found: (found, total) => `Found ${found} of ${total}`,
      showPool: 'Show all coins',
      hidePool: 'Hide coins',
      locked: 'Not found yet',
      download: 'Download PNG',
      shareCard: 'Share card',
      postOnX: 'Post on X',
      shareText: (name, tier) => `I pulled ${name} — ${tier}.\n\nWhat $IF this one's you?`,
      odds: 'odds',
      openGenerator: 'Pull your own',
    },
    notFound: {
      title: 'Page not found',
      eyebrow: '404',
      heading: { lead: 'What $IF this page', accent: 'never existed?' },
      intro: 'It did not. Nothing here has moved — this address was never one of ours.',
      tryThese: 'These do exist',
    },
    meme: {
      intro: 'Full resolution, no watermark, no credit needed. Take it.',
      description: (title, series) =>
        `${title} — a $IF meme from the ${series} series. Full resolution, free to post, no credit needed.`,
      download: 'Download',
      postOnX: 'Post on X',
      more: 'More from',
      backToVault: 'Back to the vault',
      shareText: (title) => `${title}\n\nStill asking.`,
    },
    memeMaker: {
      title: 'Meme Maker',
      heading: { lead: 'Make one.', accent: 'Post it.' },
      intro:
        'Eight formats, four poses, your words. It renders on your own device and saves as a PNG. Nothing is uploaded.',
      templateLabel: 'Format',
      poseLabel: 'Pose',
      backdropLabel: 'Backdrop',
      templates: {
        classic: 'Classic',
        caption: 'Caption',
        'this-or-that': 'This or that',
        statement: 'Statement',
        question: 'The question',
        spotlight: 'Spotlight',
        chart: 'Market day',
        gm: 'gm',
      },
      fields: {
        top: 'Top line',
        bottom: 'Bottom line',
        line: 'Your line',
        first: 'Top panel',
        second: 'Bottom panel',
      },
      poses: {
        'arms-crossed': 'Unbothered',
        facepalm: 'Regret',
        thinking: 'Thinking',
        victory: 'Victory',
      },
      backdrops: {
        glow: 'Glow',
        void: 'Void',
        grid: 'Grid',
        spotlight: 'Spotlight',
        stars: 'Cosmos',
        chart: 'Chart',
      },
      download: 'Download PNG',
      share: 'Share',
      shuffle: 'Shuffle',
      saved: 'Saved. Attach it to your post.',
      failed: 'Could not render that. Try again.',
      shareText: 'Made with the $IF meme maker.\n\nStill asking.',
      privacy: 'Everything is drawn in your browser. No upload, no account, nothing stored.',
      cta: 'Make your own',
    },
  },

  common: {
    skipToContent: 'Skip to content',
    externalLink: 'opens in a new tab',
  },
};
