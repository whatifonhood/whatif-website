/**
 * Number formatting for the live figures.
 *
 * All of it is locale-aware and uses tabular figures in the UI, so digits do not
 * jump around when a value updates.
 */

/** $6.95M, $407K, $0.00767 — compact where big, precise where small. */
export function formatUsd(value: number, locale = 'en'): string {
  if (!Number.isFinite(value)) return '—';

  if (value >= 1000) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }

  // Ordinary amounts to the cent.
  if (value >= 1) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  // Sub-dollar token prices: two decimals would round every one of them to $0.01.
  // Below a tenth of a cent, fixed decimals round everything to $0.00000 —
  // which is exactly the range memecoins trade in. Significant digits instead.
  if (value < 0.001) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      maximumSignificantDigits: 4,
    }).format(value);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  }).format(value);
}

/** 93,076,893 */
export function formatCount(value: number, locale = 'en'): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale).format(Math.round(value));
}

/** 1B, 93.1M — for headline figures where precision would be noise. */
export function formatCompact(value: number, locale = 'en'): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** 9.31% */
export function formatPercent(value: number, locale = 'en'): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

/**
 * A dollar amount written out in full.
 *
 * `formatUsd` compacts anything over a thousand, which is right for a headline
 * figure but wrong in a column of results: "$16.96K" next to "$652.45" makes
 * two numbers the reader has to convert before they can compare them.
 */
export function formatUsdExact(value: number, locale = 'en'): string {
  if (!Number.isFinite(value)) return '—';
  if (value < 1000) return formatUsd(value, locale);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}
