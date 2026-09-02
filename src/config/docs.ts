/**
 * The white paper, as a set of documentation pages.
 *
 * Order and grouping live here rather than in frontmatter, because a docs
 * sidebar is a reading order somebody decided on — not an alphabetical
 * accident. Adding a page is two edits: the Markdown file in src/docs/, and a
 * slug in the right group below. TypeScript will not let you reference a page
 * that does not exist, and `npm run docs` fails the build if a file is left out
 * of this list.
 *
 * Every factual claim in these pages is either derived from src/config/site.ts
 * or checkable on the chain by the reader. Nothing here asserts a promise the
 * site cannot evidence — see docs/what-we-do-not-claim.md, which exists to say
 * so out loud.
 */

export interface DocsGroup {
  /** Shown as the sidebar heading. */
  title: string;
  slugs: string[];
}

export const DOCS_GROUPS: DocsGroup[] = [
  {
    title: 'The coin',
    slugs: ['introduction', 'the-thesis', 'the-token'],
  },
  {
    title: 'Proof',
    slugs: ['supply-and-burn', 'who-holds-it', 'verify-it-yourself'],
  },
  {
    title: 'Under the hood',
    slugs: ['the-chain', 'the-launch', 'liquidity-and-the-lock', 'how-the-burn-works'],
  },
  {
    title: 'Using it',
    slugs: ['how-to-buy', 'wallets-and-custody', 'the-tools'],
  },
  {
    title: 'Straight answers',
    slugs: ['risks', 'what-we-do-not-claim', 'reference'],
  },
];

/** Every slug, in reading order — the order prev/next walks. */
export const DOCS_ORDER: string[] = DOCS_GROUPS.flatMap((group) => group.slugs);
