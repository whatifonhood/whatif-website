/**
 * Copy-to-clipboard for the contract address and chain parameters.
 *
 * The value copied comes from a data attribute rendered by the server, never
 * from anything the user or a URL supplied.
 */
const RESET_AFTER_MS = 1800;

export function initCopyButtons(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('.js-copy')) {
    button.addEventListener('click', () => {
      const value = button.dataset.copyValue;
      const copiedLabel = button.dataset.copiedLabel ?? 'Copied';
      const idleLabel = button.dataset.copyLabel ?? 'Copy';
      if (!value) return;

      void navigator.clipboard
        .writeText(value)
        .then(() => {
          button.textContent = copiedLabel;
          const status = button.parentElement?.querySelector<HTMLElement>('[data-copy-status]');
          if (status) status.textContent = button.textContent;
          button.classList.add('text-lime');
          window.setTimeout(() => {
            button.textContent = idleLabel;
            button.classList.remove('text-lime');
          }, RESET_AFTER_MS);
        })
        .catch(() => {
          // Clipboard blocked (insecure context or denied permission). The value
          // is on screen in full, so the user can still select it by hand.
        });
    });
  }
}
