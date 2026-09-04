/**
 * Hand a file to the device's share sheet, or download it.
 *
 * On a phone the share sheet is how a picture reaches Photos, a chat or a post;
 * a bare download link lands in the Files app on iOS and is never seen again.
 * On a desktop, or where the browser cannot share files, the same call falls
 * back to a plain download. Nothing leaves the device either way: the file is
 * built in the browser and handed to the browser.
 */
export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

export async function shareOrDownload(
  blob: Blob,
  filename: string,
  text?: string,
): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: blob.type });
  const data: ShareData = text ? { files: [file], text } : { files: [file] };

  if (typeof navigator.canShare === 'function' && navigator.canShare(data)) {
    try {
      await navigator.share(data);
      return 'shared';
    } catch (error) {
      // The person closed the sheet. Not an error, and not a reason to download.
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
      // Anything else: fall through to the download.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  // Revoke after the click has been handled, not before.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'downloaded';
}

/**
 * Re-encodes an image the site serves as WebP into a JPEG, for posting.
 *
 * WebP is the right format to serve and the wrong one to hand somebody:
 * Telegram treats a sent .webp as a sticker, and older apps refuse it. The
 * conversion happens on the device from the file already on screen.
 */
export async function asJpeg(url: string, quality = 0.92): Promise<Blob> {
  const response = await fetch(url, { credentials: 'omit' });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  const bitmap = await createImageBitmap(await response.blob());
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('no 2d context');
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))),
      'image/jpeg',
      quality,
    );
  });
}

/** A canvas as a PNG blob, or null if the canvas would not encode. */
export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
