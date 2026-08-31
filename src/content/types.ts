import type { ToolId } from '../config/navigation.ts';
import type { BackdropId, FieldId, PoseId } from '../config/meme-templates.ts';

/**
 * The shape of every word on the site.
 *
 * Each language file (`en.ts`, `zh.ts`, `tr.ts`, `es.ts`) must satisfy this type, so
 * TypeScript fails the build when a translation is missing a line or has a stale
 * key. To change wording, edit the language file — never a component.
 *
 * Rules for anything written here:
 *  - No claim that cannot be checked on-chain. If it can't be linked to proof,
 *    it does not go on the site.
 *  - Never truncate the contract address.
 *  - The question is the brand: leave it open, don't answer it.
 */

/** A heading written as two halves so the second can be tinted lime. */
export interface SplitHeading {
  /** Plain text, rendered in the body colour. */
  lead: string;
  /** Rendered in the accent colour. */
  accent: string;
}

export interface SiteCopy {
  /** Used on <html lang> and for the social card locale. */
  htmlLang: string;

  nav: {
    /** In-page anchors, in header order. */
    links: { label: string; href: string }[];
    /** The header dropdown that holds the tools. */
    toolsLabel: string;
    /** One entry per route in src/config/navigation.ts. */
    tools: Record<ToolId, { label: string; blurb: string }>;
    buy: string;
    pfp: string;
    openMenu: string;
    closeMenu: string;
    languageLabel: string;
  };

  hero: {
    /** Live badge, e.g. "Live on Robinhood Chain". */
    liveOn: string;
    titleLead: string;
    titleTail: string;
    description: string;
    buy: string;
    chart: string;
    /** Small print under the stat strip. */
    statsNote: string;
  };

  /** Words that scroll across the band under the hero. */
  marquee: string[];

  /** The rotating "what if" lines beside the hero. */
  cosmic: { kicker: string; statements: string[] };

  thesis: {
    eyebrow: string;
    heading: SplitHeading;
    intro: string;
    pillars: { title: string; body: string }[];
  };

  numbers: {
    eyebrow: string;
    heading: SplitHeading;
    intro: string;
    contractLabel: string;
    /** Instruction shown beside the contract address. Never remove this. */
    verifyNote: string;
    copy: string;
    copied: string;
    viewOnExplorer: string;
    /** Labels for the live figures. */
    stats: {
      price: string;
      marketCap: string;
      liquidity: string;
      volume: string;
      supply: string;
      burned: string;
      holders: string;
      chain: string;
    };
    burnHeadline: string;
    burnBody: string;
    asOf: string;
    live: string;
  };

  buy: {
    eyebrow: string;
    heading: SplitHeading;
    intro: string;
    steps: { title: string; body: string; action?: string }[];
    venuesTitle: string;
    venues: { label: string; blurb: string }[];
    /** Reassurance that the site itself never asks for a wallet. */
    safetyNote: string;
  };

  pfpTeaser: {
    eyebrow: string;
    heading: SplitHeading;
    body: string;
    cta: string;
  };

  vaultTeaser: {
    eyebrow: string;
    heading: SplitHeading;
    body: string;
    cta: string;
  };

  ecosystem: {
    eyebrow: string;
    heading: SplitHeading;
    intro: string;
    /** Keyed by the tool name in `ECOSYSTEM` — see src/config/ecosystem.ts. */
    blurbs: Record<string, string>;
  };

  roadmap: {
    eyebrow: string;
    heading: SplitHeading;
    fileName: string;
    lastEdited: string;
    quarters: string[];
    stamp: string;
    footnote: string;
  };

  faq: {
    eyebrow: string;
    heading: SplitHeading;
    items: { q: string; a: string }[];
  };

  footer: {
    heading: SplitHeading;
    subtitle: string;
    buy: string;
    telegram: string;
    follow: string;
    chart: string;
    /** Anti-phishing line naming the one real domain. */
    canonical: string;
    disclaimer: string;
    builtBy: string;
  };

  /** Page-level copy for the sub-pages. */
  pages: {
    memes: {
      title: string;
      heading: SplitHeading;
      intro: string;
      download: string;
      all: string;
      searchLabel: string;
      empty: string;
      count: string;
    };
    brand: {
      title: string;
      heading: SplitHeading;
      intro: string;
      download: string;
      /** One line describing what the kit holds, without listing it all. */
      kitNote: string;
      /** The short version of the rules, for people using the marks. */
      rulesTitle: string;
      rules: string[];
    };
    stats: {
      title: string;
      heading: SplitHeading;
      intro: string;
      /** Explains where each figure comes from and how often it refreshes. */
      sourceNote: string;
      poolLabel: string;
      openExplorer: string;
      openChart: string;
      /** Chart timeframe buttons. */
      timeframes: { day: string; week: string; month: string; all: string };
      /** Candles or a line. */
      chartTypes: { candles: string; line: string };
      /** Toggles the price axis between linear and logarithmic. */
      logScale: string;
      chartTitle: string;
      feedTitle: string;
      biggestBuy: string;
      buys: string;
      sells: string;
      buyLabel: string;
      sellLabel: string;
      viewTx: string;
      loading: string;
      failed: string;
      /** Shown above the trade feed to say how far back it reaches. */
      feedNote: string;
      /** The other side of the biggest-trade pair. */
      biggestSell: string;
      /**
       * How far back the biggest-trade figures actually reach. The size filter
       * is not a time window, so the page states the span it really has.
       * `{hours}` is replaced at runtime.
       */
      windowHours: string;
      holdersTitle: string;
      concentration: string;
      /** Holder bands, largest first. */
      bands: { top10: string; next20: string; next20More: string; rest: string };
      /** When the holder figures were last recalculated by the source. */
      holdersUpdated: string;
      pressureTitle: string;
      pressureNote: string;
      burnHistoryTitle: string;
      burnHistoryNote: string;
      trustTitle: string;
      /** Says who is attesting, because we are not. */
      trustNote: string;
      checks: { verified: string; honeypot: string; supply: string; burn: string };
      checkPass: string;
    };
    machine: {
      title: string;
      heading: SplitHeading;
      intro: string;
      coinLabel: string;
      /** Placeholder in the coin search box. */
      searchPlaceholder: string;
      noResults: string;
      amountLabel: string;
      dateLabel: string;
      calculate: string;
      /** Shown before anything has been worked out. */
      emptyState: string;
      /** Labels around the result. */
      investedLabel: string;
      worthLabel: string;
      boughtLabel: string;
      entryLabel: string;
      todayLabel: string;
      coinCount: string;
      resultLead: string;
      multiplier: string;
      /** The line offered as the X post. */
      shareText: (
        amount: string,
        coin: string,
        month: string,
        value: string,
        multiple: string,
      ) => string;
      /** The regret verdict on the share card, worst last. */
      verdicts: { dodged: string; fine: string; ouch: string; painful: string; unbearable: string };
      shareOnX: string;
      /** The turn back towards $IF under the result. */
      pivot: string;
      pivotCta: string;
      disclaimer: string;
    };
    pfp: {
      title: string;
      heading: SplitHeading;
      intro: string;
      /** Rarity line under the intro. */
      subline: string;
      generate: string;
      again: string;
      hint: string;
      /** Rarity names, in the order they are drawn. */
      tiers: { common: string; uncommon: string; rare: string; legendary: string };
      found: (found: number, total: number) => string;
      showPool: string;
      hidePool: string;
      locked: string;
      download: string;
      shareCard: string;
      postOnX: string;
      /** The line offered as the X post. */
      shareText: (name: string, tier: string) => string;
      odds: string;
      openGenerator: string;
    };
    holdings: {
      title: string;
      eyebrow: string;
      heading: SplitHeading;
      intro: string;
      inputLabel: string;
      check: string;
      /** Stated before anyone types, because it is the first question asked. */
      privacy: string;
      download: string;
      postOnX: string;
      /** `{tokens}` and `{symbol}` are replaced at runtime. */
      shareText: string;
      /** Holding bands. No rank is claimed — no public endpoint gives one. */
      bands: { whale: string; shark: string; holder: string; curious: string; empty: string };
      verdicts: { whale: string; shark: string; holder: string; curious: string; empty: string };
      /** Says what is wrong with what was pasted, rather than returning zero. */
      errors: {
        empty: string;
        ens: string;
        txHash: string;
        prefix: string;
        shape: string;
        network: string;
      };
    };
    notFound: {
      title: string;
      eyebrow: string;
      heading: SplitHeading;
      intro: string;
      /** Heading above the list of routes that do exist. */
      tryThese: string;
    };
    meme: {
      /** Shown under the title on a single meme's page. */
      intro: string;
      /** Meta description, built from the meme's own title and series. */
      description: (title: string, series: string) => string;
      download: string;
      postOnX: string;
      /** Heading above the rest of the series, e.g. "More from". */
      more: string;
      backToVault: string;
      shareText: (title: string) => string;
    };
    memeMaker: {
      title: string;
      heading: SplitHeading;
      intro: string;
      /** Group headings above each row of controls. */
      templateLabel: string;
      poseLabel: string;
      backdropLabel: string;
      /** One per template in src/config/meme-templates.ts. */
      templates: Record<string, string>;
      /** Input labels, shared across templates so copy stays generic. */
      fields: Record<FieldId, string>;
      poses: Record<PoseId, string>;
      backdrops: Record<BackdropId, string>;
      download: string;
      share: string;
      shuffle: string;
      /** Confirmation after the file is written. */
      saved: string;
      failed: string;
      /** Offered as the X post when the image is shared. */
      shareText: string;
      /** Says plainly that nothing is uploaded. */
      privacy: string;
      /** Link from the vault page. */
      cta: string;
    };
  };

  /** Shared UI strings. */
  common: {
    skipToContent: string;
    externalLink: string;
  };
}
