/**
 * The Learn pages.
 *
 * Markdown under src/learn/, read at build time. This is the one place on the
 * site where prose beats a typed config object: these pages are paragraphs, not
 * fields, and writing one should be writing a file.
 *
 * Frontmatter is validated the same way external data is — a page missing a
 * title or an order would otherwise fail silently in the middle of a list.
 */
/** Sections of the Learn index, in the order they are shown. */
export const LEARN_CATEGORIES = ['safety', 'basics', 'token'] as const;
export type LearnCategory = (typeof LEARN_CATEGORIES)[number];

export interface LearnFrontmatter {
  title: string;
  summary: string;
  category: LearnCategory;
  order: number;
  updated: string;
}

export interface LearnPage extends LearnFrontmatter {
  slug: string;
}

interface MarkdownModule {
  frontmatter?: Partial<LearnFrontmatter>;
}

const modules = import.meta.glob<MarkdownModule>('../learn/*.md', { eager: true });

/** Every page, safety first, then in declared order. */
export function getLearnPages(): LearnPage[] {
  const pages: LearnPage[] = [];

  for (const [path, module] of Object.entries(modules)) {
    const matter = module.frontmatter;
    const slug = path.split('/').pop()?.replace(/\.md$/, '');
    if (!slug || !matter?.title || !matter.summary || typeof matter.order !== 'number') continue;
    // A page filed under a category that does not exist would vanish from the
    // index without any error, so it is checked rather than trusted.
    const category = LEARN_CATEGORIES.includes(matter.category as LearnCategory)
      ? (matter.category as LearnCategory)
      : 'basics';

    pages.push({
      slug,
      title: matter.title,
      summary: matter.summary,
      category,
      order: matter.order,
      updated: matter.updated ?? '',
    });
  }

  return pages.sort((a, b) => a.order - b.order);
}

/** The pages in one section, for the grouped index. */
export function getLearnPagesIn(category: LearnCategory): LearnPage[] {
  return getLearnPages().filter((page) => page.category === category);
}
