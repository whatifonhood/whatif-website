import type { GetStaticPaths, InferGetStaticPropsType } from 'astro';
import { LOCALES } from '../config/site.ts';

/**
 * One page per non-English locale, for every route that has a translation.
 *
 * Eight route files used to carry this block verbatim, each followed by
 * `Astro.props as { locale: Locale }`; the cast was the only `as` in most of
 * them. The props type is inferred from the paths, so there is nothing to cast.
 */
export const localeStaticPaths = (() =>
  LOCALES.filter((locale) => locale !== 'en').map((locale) => ({
    params: { locale },
    props: { locale },
  }))) satisfies GetStaticPaths;

export type LocaleProps = InferGetStaticPropsType<typeof localeStaticPaths>;
