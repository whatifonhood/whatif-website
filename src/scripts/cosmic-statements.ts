/**
 * The "what if…" lines that cross-fade beside the hero.
 *
 * The statements are rendered into a data attribute by the server so this file
 * carries no copy of its own and works in every language.
 */
const HOLD_MS = 5200;
const FADE_MS = 800;

export function initCosmicStatements(): void {
  const root = document.querySelector<HTMLElement>('[data-cosmic]');
  const line = root?.querySelector<HTMLElement>('[data-cosmic-line]');
  const dots = root?.querySelectorAll<HTMLElement>('[data-cosmic-dot]');
  if (!root || !line || !dots || dots.length === 0) return;

  let statements: string[];
  try {
    const parsed: unknown = JSON.parse(root.dataset.cosmic ?? '[]');
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) return;
    statements = parsed;
  } catch {
    return;
  }
  if (statements.length === 0) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  let index = 0;
  const show = (next: number) => {
    line.style.opacity = '0';
    window.setTimeout(() => {
      line.textContent = statements[next] ?? '';
      line.style.opacity = '1';
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === next));
    }, FADE_MS);
  };

  window.setInterval(() => {
    index = (index + 1) % statements.length;
    show(index);
  }, HOLD_MS);
}
