import type { ToolGroup, ToolId } from '../config/navigation.ts';
import type { DocsGroupId } from '../config/docs.ts';
import type { RoadmapTrack as RoadmapTrackKey } from '../config/roadmap.ts';

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

/** One line per holding band on the wallet lookup. */
export interface HoldingBands {
  whale: string;
  shark: string;
  holder: string;
  curious: string;
  empty: string;
  burn: string;
  pool: string;
}

export interface SiteCopy {
  /** Used on <html lang> and for the social card locale. */
  htmlLang: string;
  /** Open Graph wants language_TERRITORY (en_US), not the BCP-47 tag html uses. */
  ogLocale: string;

  nav: {
    /** Accessible name of the header's <nav>; landmarks must be told apart. */
    primaryLabel: string;
    /** In-page anchors, in header order. */
    links: { label: string; href: string }[];
    /** The header dropdown that holds the tools. */
    toolsLabel: string;
    /** One entry per route in src/config/navigation.ts. */
    tools: Record<ToolId, { label: string; blurb: string }>;
    /** Headings inside the tools dropdown. */
    toolGroups: Record<ToolGroup, string>;
    /** The language dropdown's button and label. */
    languageMenu: string;
    buy: string;
    /** The header logo's link, which goes home. */
    home: string;
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
    /**
     * Under the buy button, at body size, in every language. The hero is the
     * regret hook — "what if you aped earlier?" — and a regret hook next to a
     * Buy button with no risk statement in sight is the exact shape financial-
     * promotion rules describe. The footer disclaimer is three screens away.
     */
    riskNote: string;
  };

  /** The wall of posts. Hidden entirely when there is nothing to show. */
  posts: {
    eyebrow: string;
    /** The link under each card, beside its date. */
    readOnX: string;
    heading: SplitHeading;
    intro: string;
    follow: string;
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

  /**
   * One line survives from the site's original joke roadmap: the mantra. The
   * real roadmap's copy lives under `pages.roadmap`.
   */
  roadmap: {
    stamp: string;
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
    /** The button that stops every animation on the site. */
    reduceMotion: string;
    /** Accessible name of the footer's <nav>. */
    navLabel: string;
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
      /** The way out of an empty filter. */
      showAll: string;
      count: string;
    };
    brand: {
      eyebrow: string;
      /** Under the download: format and size. */
      fileNote: string;
      contractLabel: string;
      questions: string;
      title: string;
      heading: SplitHeading;
      intro: string;
      download: string;
      /** The smaller zip of marks only; `{size}` is filled from the build. */
      downloadMarks: string;
      /** One line describing what the kit holds, without listing it all. */
      kitNote: string;
      /** The short version of the rules, for people using the marks. */
      rulesTitle: string;
      rules: string[];
    };
    stats: {
      /** Accessible name of the chart toolbar group. */
      chartTypeLabel: string;
      title: string;
      heading: SplitHeading;
      intro: string;
      /** Explains where each figure comes from and how often it refreshes. */
      sourceNote: string;
      poolLabel: string;
      openExplorer: string;
      openChart: string;
      /** Chart timeframe buttons. */
      timeframes: { day: string; week: string; month: string; quarter: string; all: string };
      /** The drag handle that sets the chart's height. */
      resizeChart: string;
      zoomIn: string;
      zoomOut: string;
      resetZoom: string;
      /** Moving-average overlay toggle. */
      average: string;
      /** The exponential moving average toggle. */
      ema: string;
      /** Explains that the chart can be dragged and scrolled. */
      chartHint: string;
      /** The fold that hides the secondary chart controls on a touchscreen. */
      chartOptions: string;
      /** Shown when the candles on screen are not live; `{time}` is when they end. */
      candlesAsOf: string;
      /** Under the concentration bar: the top ten includes the burn address and the pool. */
      concentrationNote: string;
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
      /** Shown in place of the trade list when the trades never arrive. */
      feedUnavailable: string;
      /** Shown over the chart when there is no price history to draw. */
      chartUnavailable: string;
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
      /** How to reproduce every figure, without this site. */
      reproduceTitle: string;
      reproduceIntro: string;
      reproduceField: string;
      reproduceNote: string;
      /** One label per recipe key in src/lib/reproduce.ts. */
      reproduceLabels: Record<string, string>;
      /** The last seven days, from committed data rather than live. */
      weekTitle: string;
      weekPrice: string;
      weekBurned: string;
      /** Carries `{count}`. */
      weekBurnCount: string;
      weekLargest: string;
      /** Carries `{date}`, the last day covered. */
      weekNote: string;
      /** Who holds the supply, with the top rows identified. */
      holderTableTitle: string;
      holderTableIntro: string;
      /** Carries `{date}`. */
      holderTableNote: string;
      holderAddress: string;
      holderWhat: string;
      holderTokens: string;
      holderShare: string;
      holderKinds: { burn: string; pool: string; contract: string; unknown: string };
      /** The largest burns, each linked to its transaction. */
      latestBurnsTitle: string;
      /**
       * "Since you were last here". Shown only to a returning reader, compared
       * against figures kept in their own browser.
       */
      sinceLead: string;
      /** Carries `{change}` and `{price}`. */
      sincePrice: string;
      /** Carries `{amount}`. */
      sinceBurned: string;
      /** Carries `{change}` and `{total}`. */
      sinceHolders: string;
      sinceNothing: string;
      trustTitle: string;
      /** Says who is attesting, because we are not. */
      trustNote: string;
      checks: {
        verified: string;
        honeypot: string;
        supply: string;
        burn: string;
        owner: string;
      };
      /** Shown when the contract has no owner function at all. */
      ownerNone: string;
      /** Shown, with the address, when it does. */
      ownerSome: string;
      checkPass: string;
      /** Tooltip on a burn tick. Carries `{amount}`. */
      burnMark: string;
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
      /** Announced after a pull. Carries `{name}` and `{tier}`. */
      rolled: string;
      /** Moving a collection to another browser. */
      backupTitle: string;
      backupIntro: string;
      backupCopy: string;
      backupRestore: string;
      backupFieldLabel: string;
      backupPlaceholder: string;
      backupCopied: string;
      backupSelected: string;
      backupBad: string;
      /** Carries `{count}`. */
      backupRestored: string;
      locked: string;
      download: string;
      shareCard: string;
      postOnX: string;
      /** The line offered as the X post. */
      shareText: (name: string, tier: string) => string;
      odds: string;
      openGenerator: string;
      /** On a coin page, when this browser has already pulled it. */
      inCollection: string;
    };
    ask: {
      /** The archive of daily questions. */
      dailyArchiveTitle: string;
      dailyArchiveIntro: string;
      dailyAnswerCta: string;
      title: string;
      eyebrow: string;
      heading: SplitHeading;
      intro: string;
      again: string;
      copyLink: string;
      copied: string;
      linkCopied: string;
      today: string;
      answerLabel: string;
      answerPlaceholder: string;
      postOnX: string;
      download: string;
      /** Follows the counted total, e.g. "possible questions". */
      possibilities: string;
      hint: string;
      /** Writing your own line. The "What if" is fixed; the visitor finishes it. */
      ownLabel: string;
      ownPlaceholder: string;
      ownButton: string;
      /** `{question}` is replaced with the generated line. */
      shareText: string;
    };
    /** The white paper: its contents page, and the furniture around every page. */
    docs: {
      title: string;
      description: string;
      eyebrow: string;
      heading: SplitHeading;
      intro: string;
      /** Above the contract address on the contents page. */
      contractLabel: string;
      contractNote: string;
      /**
       * Sidebar headings, keyed by DOCS_GROUP_IDS in src/config/docs.ts, so a
       * new group cannot ship until all four languages have named it.
       */
      groups: Record<DocsGroupId, string>;
      /** The link at the top of the sidebar, back to the contents page. */
      backToContents: string;
      /** The collapsed contents on a phone. */
      contents: string;
      /** The column listing this page's own headings. */
      onThisPage: string;
      /** Under a chapter title; `{date}` is the day its percentages were read. */
      figuresAsOf: string;
      previous: string;
      next: string;
      /** aria-label for the prev/next pair. */
      moreOfThePaper: string;
    };
    roadmap: {
      title: string;
      eyebrow: string;
      heading: SplitHeading;
      intro: string;
      /** Column headings, keyed by status. */
      statuses: { shipped: string; building: string; next: string; later: string };
      /** Follows the number of shipped items, e.g. "things shipped". */
      shippedCount: string;
      /** The fold holding shipped days older than the two most recent. */
      earlier: string;
      /** The three figures above the list. Each is a label under a number. */
      record: { shipped: string; inProgress: string; latest: string };
      /**
       * What each track of work is for.
       *
       * Keyed by ROADMAP_TRACKS in src/config/roadmap.ts, so adding a track
       * fails the build in four languages until every one of them names it.
       */
      tracks: Record<RoadmapTrackKey, { label: string; objective: string }>;
      /** Above the dependency on an unshipped item, e.g. "Waiting on". */
      needsLabel: string;
      /** Above the success condition, e.g. "Done when". */
      signalLabel: string;
      /** The dated record of everything already shipped. */
      log: { intro: string };
      /** What the roadmap refuses to do — the reason to believe the rest of it. */
      terms: { title: string; items: string[] };
    };
    holdings: {
      title: string;
      eyebrow: string;
      heading: SplitHeading;
      intro: string;
      inputLabel: string;
      check: string;
      /** The button while the chain is being asked. */
      checking: string;
      /** Stated before anyone types, because it is the first question asked. */
      privacy: string;
      download: string;
      postOnX: string;
      /** Opens the address on the block explorer. */
      verify: string;
      /** `{share}` is the wallet's share of supply as a percentage. */
      shareOfSupply: string;
      /** `{tokens}` and `{symbol}` are replaced at runtime. */
      shareText: string;
      /**
       * Holding bands. No rank is claimed — no public endpoint gives one.
       * `burn` and `pool` are the two addresses everyone pastes first.
       */
      bands: HoldingBands;
      verdicts: HoldingBands;
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
      /** Copies the page URL; the X intent cannot attach the picture. */
      copyLink: string;
      /** Heading above the rest of the series, e.g. "More from". */
      more: string;
      backToVault: string;
      shareText: (title: string) => string;
    };
  };

  /** Shared UI strings. */
  common: {
    skipToContent: string;
    externalLink: string;
  };
}
