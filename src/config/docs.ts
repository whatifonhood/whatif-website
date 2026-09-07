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

/**
 * The sidebar headings are ids, not words.
 *
 * The paper is published in four languages, so a group's label belongs in
 * src/content/<language>.ts with everything else a reader sees. Adding a group
 * here fails typecheck until all four have named it.
 */
export const DOCS_GROUP_IDS = ['coin', 'proof', 'underTheHood', 'using', 'straight'] as const;
export type DocsGroupId = (typeof DOCS_GROUP_IDS)[number];

export interface DocsGroup {
  id: DocsGroupId;
  slugs: string[];
}

export const DOCS_GROUPS: DocsGroup[] = [
  {
    id: 'coin',
    slugs: ['introduction', 'the-thesis', 'the-token'],
  },
  {
    id: 'proof',
    slugs: ['supply-and-burn', 'who-holds-it', 'verify-it-yourself'],
  },
  {
    id: 'underTheHood',
    slugs: ['the-chain', 'the-launch', 'liquidity-and-the-lock', 'how-the-burn-works'],
  },
  {
    id: 'using',
    slugs: ['how-to-buy', 'wallets-and-custody', 'the-tools'],
  },
  {
    id: 'straight',
    slugs: ['risks', 'what-we-do-not-claim', 'reference'],
  },
];

/** Every slug, in reading order — the order prev/next walks. */
export const DOCS_ORDER: string[] = DOCS_GROUPS.flatMap((group) => group.slugs);
