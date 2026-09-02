/**
 * Reads the white paper's Markdown at build time.
 *
 * The pages are ordinary Markdown rendered through Astro's own pipeline, so the
 * prose stays prose and nothing is injected as HTML from outside this
 * repository — the same rule the Learn section follows.
 */
import type { MarkdownInstance } from 'astro';

import { DOCS_GROUPS, DOCS_ORDER } from '../config/docs.ts';

export interface DocsPage {
  slug: string;
  title: string;
  summary: string;
  /** Position in the whole paper, 1-based. Shown in the sidebar. */
  number: number;
  group: string;
  headings: { depth: number; slug: string; text: string }[];
}

type DocModule = MarkdownInstance<{ title?: string; summary?: string }>;

const modules = import.meta.glob<DocModule>('../docs/*.md', { eager: true });

const bySlug = new Map<string, DocModule>(
  Object.entries(modules).map(([path, module]) => [
    path.split('/').pop()?.replace(/\.md$/, '') ?? '',
    module,
  ]),
);

/** Every page, in the reading order src/config/docs.ts sets. */
export function getDocsPages(): DocsPage[] {
  return DOCS_ORDER.map((slug, index) => {
    const module = bySlug.get(slug);
    const group = DOCS_GROUPS.find((entry) => entry.slugs.includes(slug))?.title ?? '';
    return {
      slug,
      title: module?.frontmatter?.title ?? slug,
      summary: module?.frontmatter?.summary ?? '',
      number: index + 1,
      group,
      // Only H2s: an "on this page" list that also carries H3s stops being a
      // glance and becomes a second document.
      headings: (module?.getHeadings?.() ?? []).filter((heading) => heading.depth === 2),
    };
  });
}

/** The rendered body of one page. */
export function getDocsContent(slug: string) {
  return bySlug.get(slug)?.Content;
}

/**
 * Slugs with a Markdown file but no place in the sidebar.
 *
 * A page nothing links to is a page nobody reads, so `npm run docs` treats this
 * as a failure rather than quietly building it.
 */
export function orphanedDocs(): string[] {
  return [...bySlug.keys()].filter((slug) => !DOCS_ORDER.includes(slug));
}

/** Slugs listed in the sidebar with no Markdown behind them. */
export function missingDocs(): string[] {
  return DOCS_ORDER.filter((slug) => !bySlug.has(slug));
}
