/**
 * A copy button on every command block in the white paper.
 *
 * The commands are 700–1000px wide at 12.5px, so on a phone they scroll
 * sideways inside their box and cannot be selected by hand. The text copied is
 * the block's own content as rendered from the repository's Markdown.
 */
const RESET_AFTER_MS = 1800;

export function initDocsCopy(): void {
  const article = document.querySelector<HTMLElement>('.docs-body');
  if (!article) return;
  const idle = article.dataset.copyLabel ?? 'Copy';
  const done = article.dataset.copiedLabel ?? 'Copied';

  for (const pre of article.querySelectorAll<HTMLPreElement>('.docs-prose pre')) {
    const wrap = document.createElement('div');
    wrap.className = 'docs-pre';
    pre.replaceWith(wrap);
    wrap.append(pre);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'docs-pre-copy';
    button.textContent = idle;
    button.addEventListener('click', () => {
      void navigator.clipboard
        ?.writeText(pre.textContent ?? '')
        .then(() => {
          button.textContent = done;
          window.setTimeout(() => {
            button.textContent = idle;
          }, RESET_AFTER_MS);
        })
        .catch(() => {
          /* clipboard refused; the text is still on screen */
        });
    });
    wrap.append(button);
  }
}
