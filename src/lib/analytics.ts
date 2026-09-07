/**
 * Analytics, first-party only.
 *
 * The script and the endpoint are both served from this origin — see the
 * rewrite rules in public/_redirects — so the browser never contacts a third
 * party, the Content-Security-Policy needs no exception, and an ad blocker has
 * nothing to recognise.
 *
 * Two rules this file exists to enforce:
 *
 *  1. NOTHING A PERSON TYPES IS EVER SENT. Not an address pasted into the
 *     wallet lookup, not meme text, not a calculator amount. Events record that
 *     something happened and which template or coin it involved — never the
 *     contents. `track` takes a fixed event name and a small map of properties,
 *     and every call site passes literals.
 *
 *  2. It fails silently. Analytics must never break a page, so every path here
 *     tolerates the script being absent, blocked or switched off.
 */
import { ANALYTICS } from '../config/analytics.ts';

type Props = Record<string, string | number | boolean>;

interface PlausibleQueue {
  (event: string, options?: { props?: Props }): void;
  q?: unknown[][];
  init?: (options: { domain: string; endpoint: string }) => void;
  o?: unknown;
}

declare global {
  interface Window {
    plausible?: PlausibleQueue;
  }
}

/**
 * Loads the counter.
 *
 * The vendor's own snippet is an inline <script>, which this site's policy
 * forbids — inline scripts fail silently in production while working perfectly
 * in development. So the queue shim is written here instead and the script is
 * loaded as a normal same-origin file.
 */
export function initAnalytics(): void {
  if (!ANALYTICS.enabled || typeof window === 'undefined') return;
  if (window.plausible) return;

  const queue: PlausibleQueue = function (...args: unknown[]) {
    (queue.q = queue.q ?? []).push(args);
  } as PlausibleQueue;
  queue.init = (options) => {
    queue.o = options;
  };
  window.plausible = queue;
  queue.init({ domain: ANALYTICS.domain, endpoint: ANALYTICS.eventPath });

  // The <script> tag itself is rendered by BaseLayout.astro when analytics is
  // enabled. Creating it here — `script.src = …` — is a DOM sink, and the CSP's
  // `require-trusted-types-for 'script'` makes the browser throw on it, before
  // the nav and copy buttons had initialised. A tag in the HTML is not a sink.
}

/**
 * Records that something happened.
 *
 * Pass a fixed event name from `EVENTS` and, at most, properties that describe
 * a choice the visitor made from a set we defined — a template id, a coin
 * symbol, a locale. Never free text.
 */
export function track(event: string, props?: Props): void {
  if (!ANALYTICS.enabled || typeof window === 'undefined') return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    /* counting is never worth breaking a page for */
  }
}
