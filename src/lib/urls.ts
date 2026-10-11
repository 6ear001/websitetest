import { locales, pathFor, type Locale, type PageKey } from '../i18n/config';

/** Absolute URL for a site path, based on `site` in astro.config.mjs. */
export const absolute = (path: string, site: URL | undefined): string =>
  new URL(path, site ?? 'https://www.example.com').href;

/** hreflang alternates of a page (all languages + x-default → German). */
export const alternates = (page: PageKey, site: URL | undefined) => [
  ...locales.map((lang: Locale) => ({ hreflang: lang as string, href: absolute(pathFor(page, lang), site) })),
  { hreflang: 'x-default', href: absolute(pathFor(page, 'de'), site) },
];
