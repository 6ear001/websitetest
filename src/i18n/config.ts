/**
 * Languages and URLs.
 *
 * To add a language (e.g. English):
 *  1. add it to `locales` and `localeMeta`
 *  2. add its URL for every page in `routes`
 *  3. create src/i18n/<code>.ts (copy de.ts, translate) and register it in src/i18n/index.ts
 * Pages, sitemap, hreflang and the language switcher pick it up automatically.
 */

export const locales = ['de', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';

export const localeMeta: Record<
  Locale,
  { label: string; short: string; dir: 'ltr' | 'rtl'; ogLocale: string; hreflang: string }
> = {
  de: { label: 'Deutsch', short: 'DE', dir: 'ltr', ogLocale: 'de_DE', hreflang: 'de' },
  ar: { label: 'العربية', short: 'AR', dir: 'rtl', ogLocale: 'ar_AR', hreflang: 'ar' },
};

export const pageKeys = ['home', 'services', 'about', 'contact', 'imprint', 'privacy'] as const;
export type PageKey = (typeof pageKeys)[number];

/** URL of every page in every language (always with leading and trailing slash). */
export const routes: Record<PageKey, Record<Locale, string>> = {
  home: { de: '/', ar: '/ar/' },
  services: { de: '/leistungen/', ar: '/ar/services/' },
  about: { de: '/ueber-uns/', ar: '/ar/about/' },
  contact: { de: '/kontakt/', ar: '/ar/contact/' },
  imprint: { de: '/impressum/', ar: '/ar/imprint/' },
  privacy: { de: '/datenschutz/', ar: '/ar/privacy/' },
};

export const pathFor = (page: PageKey, lang: Locale): string => routes[page][lang];

export const isLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);
