import type { Locale, PageKey } from './config';

/**
 * Shape of a translation file. TypeScript reports every missing or misspelled
 * key, so a new language cannot silently miss copy.
 *
 * Strings marked "HTML" may contain simple inline markup (<strong>, <a>, <br>).
 */

export interface PageMeta {
  /** <title>, max. ~60 characters */
  title: string;
  /** meta description, max. ~155 characters */
  description: string;
}

export interface Hero {
  eyebrow: string;
  title: string;
  /** Part of the title that is highlighted in red (must be contained in `title`). */
  highlight?: string;
  lead: string;
}

export interface Item {
  title: string;
  text: string;
}

export interface FaqItem {
  question: string;
  /** HTML */
  answer: string;
}

export interface LegalSection {
  heading: string;
  /** HTML paragraphs */
  paragraphs: string[];
  /** optional bullet list (HTML) */
  list?: string[];
  /** optional HTML paragraphs after the list */
  after?: string[];
  /** optional TODO note shown as marker under the section */
  todo?: string;
}

export interface CtaBlock {
  title: string;
  text: string;
  button: string;
}

export interface Dictionary {
  lang: Locale;
  /** Brand name as written in this language. */
  brandName: string;

  ui: {
    skipToContent: string;
    mainNavLabel: string;
    nav: Record<'home' | 'services' | 'about' | 'contact', string>;
    legal: Record<'imprint' | 'privacy', string>;
    ctaQuote: string;
    menuOpen: string;
    menuClose: string;
    languageLabel: string;
    homeLinkLabel: string;
    phone: string;
    email: string;
    address: string;
    openMap: string;
    externalHint: string;
    todoLabel: string;
    footer: {
      tagline: string;
      servicesHeading: string;
      companyHeading: string;
      legalHeading: string;
      contactHeading: string;
      groupLine: string;
      groupLinkLabel: string;
      copyright: string;
    };
  };

  meta: Record<PageKey, PageMeta>;

  home: {
    hero: Hero & { primary: string; secondary: string; note: string };
    services: {
      eyebrow: string;
      title: string;
      intro: string;
      storage: Item & { link: string };
      shipping: Item & { link: string };
    };
    process: { eyebrow: string; title: string; intro: string; steps: [Item, Item, Item, Item] };
    why: { eyebrow: string; title: string; intro: string; items: Item[] };
    cta: CtaBlock;
  };

  services: {
    hero: Hero;
    jumpLabel: string;
    storage: {
      title: string;
      lead: string;
      listTitle: string;
      list: string[];
      note: string;
    };
    shipping: {
      title: string;
      lead: string;
      listTitle: string;
      list: string[];
      note: string;
    };
    combined: Item;
    faq: { title: string; items: FaqItem[] };
    cta: CtaBlock;
  };

  about: {
    hero: Hero;
    group: {
      eyebrow: string;
      title: string;
      /** HTML paragraphs */
      paragraphs: string[];
      sisterTag: string;
      sisterText: string;
      sisterLink: string;
      selfTag: string;
      selfText: string;
      selfBadge: string;
    };
    owner: {
      eyebrow: string;
      title: string;
      role: string;
      /** HTML paragraphs */
      paragraphs: string[];
      monogram: string;
    };
    values: { eyebrow: string; title: string; items: Item[] };
    location: { eyebrow: string; title: string; text: string };
    cta: CtaBlock;
  };

  contact: {
    hero: Hero;
    formTitle: string;
    formIntro: string;
    fields: {
      name: string;
      company: string;
      email: string;
      phone: string;
      topic: string;
      topicOptions: { value: string; label: string }[];
      goods: string;
      goodsHint: string;
      quantity: string;
      quantityHint: string;
      timeframe: string;
      timeframeHint: string;
      message: string;
      messageHint: string;
      consent: string; // HTML, contains link to privacy page via {privacyUrl}
      honeypot: string;
    };
    optional: string;
    requiredNote: string;
    submit: string;
    sending: string;
    mailtoNote: string;
    endpointNote: string;
    errors: {
      summary: string;
      required: string;
      email: string;
      consent: string;
      topic: string;
    };
    success: string;
    successMailto: string;
    failure: string;
    mailSubject: string;
    directTitle: string;
    directText: string;
    nextTitle: string;
    nextSteps: string[];
  };

  imprint: {
    title: string;
    lawRef: string;
    ownerLabel: string;
    contactHeading: string;
    taxHeading: string;
    vatLabel: string;
    taxNumberLabel: string;
    registerHeading: string;
    disputeHeading: string;
    disputeText: string;
    translationNote?: string;
  };

  privacy: {
    title: string;
    lawyerNote: string;
    translationNote?: string;
    updatedLabel: string;
    sections: LegalSection[];
  };

  notFound: {
    meta: PageMeta;
    title: string;
    text: string;
    home: string;
    contact: string;
  };
}
