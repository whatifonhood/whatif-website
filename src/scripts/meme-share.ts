/**
 * Download and share for memes, on the vault grid and on a meme's own page.
 *
 * Every download link in the markup works without this script: it points at
 * the WebP file. With it, a tap builds a JPEG on the device and hands it to the
 * share sheet where there is one, or downloads the JPEG where there is not.
 */
import { asJpeg, shareOrDownload } from '../lib/share.ts';

export function initMemeShare(root: ParentNode = document): void {
  root.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[data-meme-file]');
    if (!link) return;
    event.preventDefault();
    const filename = (link.getAttribute('download') || 'what-if-meme.webp').replace(
      /\.webp$/,
      '.jpg',
    );
    link.setAttribute('aria-busy', 'true');
    void asJpeg(link.href)
      .then((blob) => shareOrDownload(blob, filename))
      .catch(() => {
        // The conversion failed; the plain link still works, so follow it.
        window.location.href = link.href;
      })
      .finally(() => link.removeAttribute('aria-busy'));
  });
}
