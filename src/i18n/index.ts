import { ar } from './ar';
import { de } from './de';
import type { Locale } from './config';
import type { Dictionary } from './types';

const dictionaries: Record<Locale, Dictionary> = { de, ar };

/** All texts of one language. */
export const t = (lang: Locale): Dictionary => dictionaries[lang];

export * from './config';
export type * from './types';
