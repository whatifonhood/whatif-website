/**
 * Small per-browser preferences, stored where they cannot fail loudly.
 *
 * Every read and write of localStorage has to be wrapped: it throws outright in
 * private browsing and wherever site data is blocked, and a chart toolbar is
 * not worth a broken page. That wrapper was written out longhand at each of the
 * nine call sites in the dashboard, which is how one of them ended up saving
 * under a neighbour's key — see wireToggle in src/scripts/chart-interaction.ts.
 *
 * Naming the keys here rather than spelling the strings at each call site means
 * a typo is a compile error, and there is one list of what this site keeps on a
 * reader's device.
 */

/** Everything the site stores locally. Nothing here identifies anybody. */
export const PREFS = {
  chartType: 'whatif.chartType',
  chartAverage: 'whatif.chartAverage',
  chartEma: 'whatif.chartEma',
  chartHeight: 'whatif.chartHeight',
  chartLog: 'whatif.chartLog',
  motion: 'whatif.motion',
} as const;

export type PrefKey = keyof typeof PREFS;

/** Stores a preference, or does nothing if this browser will not allow it. */
export function remember(key: PrefKey, value: string): void {
  try {
    localStorage.setItem(PREFS[key], value);
  } catch {
    // Private browsing, or site data disabled. The control still works; it
    // just will not be remembered next time.
  }
}

/** Reads a preference back. Missing and unavailable are the same answer. */
export function recall(key: PrefKey): string | null {
  try {
    return localStorage.getItem(PREFS[key]);
  } catch {
    return null;
  }
}
