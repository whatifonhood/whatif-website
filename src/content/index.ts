import type { Locale } from '../config/site.ts';
import type { SiteCopy } from './types.ts';
import { en } from './en.ts';
import { zh } from './zh.ts';
import { tr } from './tr.ts';
import { es } from './es.ts';

/**
 * Every language, keyed by locale. TypeScript guarantees each one is complete:
 * add a line to `SiteCopy` and the build fails until every language is translated.
 */
const COPY: Record<Locale, SiteCopy> = { en, zh, tr, es };

/** The words for one language. This is the only way components read copy. */
export function getCopy(locale: Locale): SiteCopy {
  return COPY[locale];
}

export type { SiteCopy } from './types.ts';
