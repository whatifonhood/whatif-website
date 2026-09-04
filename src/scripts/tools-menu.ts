/**
 * The header tools dropdown.
 *
 * CSS handles opening and closing; this keeps `aria-expanded` truthful, closes
 * the menu on Escape or an outside click — the two things a keyboard or
 * screen-reader user needs and CSS cannot do — and mirrors the open state onto
 * the container as `data-open`.
 *
 * That mirror is not redundant. The panel used to be revealed only by
 * `.tools-menu:has([aria-expanded='true'])`, and `:has()` did not reach Firefox
 * until version 121 — so on any older build, including the 115 ESR that ships
 * as the default browser on several long-term Linux releases, the site's main
 * navigation could not be opened at all. A dropdown is not the place to depend
 * on a selector.
 */
export function initToolsMenu(): void {
  const menus = document.querySelectorAll<HTMLElement>('.tools-menu');
  if (menus.length === 0) return;

  const setOpen = (menu: HTMLElement, toggle: HTMLButtonElement, open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    if (open) menu.dataset.open = '';
    else delete menu.dataset.open;
  };

  for (const menu of menus) {
    const toggle = menu.querySelector<HTMLButtonElement>('[data-tools-toggle]');
    if (!toggle) continue;

    const close = (control: HTMLButtonElement) => setOpen(menu, control, false);

    // Tabbing out of an open menu closes it; otherwise it stays expanded behind

    // the focus, which a screen reader reports as still open.

    menu.addEventListener('focusout', (event) => {
      if (!menu.contains(event.relatedTarget as Node | null)) close(toggle);
    });

    toggle.addEventListener('click', () => {
      setOpen(menu, toggle, toggle.getAttribute('aria-expanded') !== 'true');
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
