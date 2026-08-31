/**
 * The header tools dropdown.
 *
 * CSS handles opening and closing; this only keeps `aria-expanded` truthful and
 * closes the menu on Escape or an outside click — the two things a keyboard or
 * screen-reader user needs and CSS cannot do.
 */
export function initToolsMenu(): void {
  const menus = document.querySelectorAll<HTMLElement>('.tools-menu');
  if (menus.length === 0) return;

  const close = (toggle: HTMLButtonElement) => toggle.setAttribute('aria-expanded', 'false');

  for (const menu of menus) {
    const toggle = menu.querySelector<HTMLButtonElement>('[data-tools-toggle]');
    if (!toggle) continue;

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
    });

    // Clicking a link inside should not leave the menu marked open.
    menu.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('a')) close(toggle);
    });

    document.addEventListener('click', (event) => {
      if (!menu.contains(event.target as Node)) close(toggle);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      close(toggle);
      toggle.focus();
    });
  }
}
