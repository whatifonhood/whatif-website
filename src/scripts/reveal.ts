/**
 * Fades sections in as they enter the viewport.
 *
 * Progressive enhancement: the `.reveal` class starts hidden only once this
 * script has run, so with JavaScript disabled every section is simply visible.
 * Respects prefers-reduced-motion via the stylesheet.
 */
export function initReveal(): void {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (targets.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );

  targets.forEach((el) => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}
