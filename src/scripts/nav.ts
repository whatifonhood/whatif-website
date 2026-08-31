/**
 * Header behaviour: frost the bar once the page scrolls, and open/close the
 * mobile menu. Kept deliberately small — the navigation is plain links.
 */
const SCROLL_THRESHOLD_PX = 24;

export function initNav(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');

  if (header) {
    const onScroll = () => {
      header.classList.toggle('glass', window.scrollY > SCROLL_THRESHOLD_PX);
      header.classList.toggle('border-line', window.scrollY > SCROLL_THRESHOLD_PX);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (!toggle || !menu) return;

  const openLabel = toggle.dataset.labelOpen ?? toggle.getAttribute('aria-label') ?? '';
  const closeLabel = toggle.dataset.labelClose ?? openLabel;

  const setOpen = (open: boolean) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? closeLabel : openLabel);
    menu.hidden = !open;
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  // Following a link closes the menu; so does Escape.
  menu.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
}
