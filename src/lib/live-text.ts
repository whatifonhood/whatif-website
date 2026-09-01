/**
 * The one way a live number reaches the page.
 *
 * There are two marker attributes, and the difference is *who owns the value*:
 *
 *   data-stat="<key>"    the token's own figures — price, market cap, burn.
 *                        Rendered from the snapshot at build time so the page
 *                        is complete before JavaScript runs, then refreshed
 *                        site-wide by `live-stats.ts`.
 *
 *   data-metric="<key>"  values that only exist on the dashboard — trade
 *                        counts, holder distribution, pool size. Written by
 *                        `dashboard.ts`, scoped to the dashboard element.
 *
 * They are not merged because the stats page carries both, and a site-wide
 * updater that also claimed `data-metric` would overwrite dashboard values
 * with token figures whenever the two happened to share a key name.
 *
 * Both write through `setLiveText`, which uses `textContent` and never
 * `innerHTML` — an API response is untrusted input and must not be able to put
 * markup on the page.
 */
export function setLiveText(
  scope: ParentNode,
  attribute: 'data-stat' | 'data-metric',
  key: string,
  value: string,
): void {
  for (const node of scope.querySelectorAll<HTMLElement>(`[${attribute}="${CSS.escape(key)}"]`)) {
    node.textContent = value;
  }
}
