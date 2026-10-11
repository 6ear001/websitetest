/**
 * ============================================================================
 *  COMPANY & SITE CONFIGURATION – the single source of truth
 * ============================================================================
 *  Every page, the Impressum, the Datenschutzerklärung, the JSON-LD data and
 *  the contact form read their company data from this file.
 *
 *  Values wrapped in `todo(…)` are NOT known yet. They are never published
 *  as facts. While `showTodoNotices` is true, the pages that need them show a
 *  visible TODO marker. Run `npm run todos` to list all of them.
 *  Full checklist: docs/TODO-before-launch.md
 * ============================================================================
 */

export interface Todo {
  readonly todo: string;
}

/** Marks an unknown value. Rendered as a visible TODO, never as a fact. */
export const todo = (note: string): Todo => ({ todo: note });

/** A value that may still be unknown. */
export type MaybeTodo<T = string> = T | Todo;

export const isTodo = (value: unknown): value is Todo =>
  typeof value === 'object' && value !== null && 'todo' in value;

export const site = {
  /**
   * Public URL of the live site, without trailing slash.
   * TODO: final domain not decided yet. Can also be set via the SITE_URL env variable.
   */
  url: 'https://www.example.com',

  /**
   * Where the quote form is POSTed to. Empty string = mailto fallback
   * (the visitor's e-mail program opens with the request pre-filled).
   * TODO: optional – set a form endpoint (or PUBLIC_FORM_ENDPOINT env variable).
   * Do not add a third-party service without updating the Datenschutzerklärung.
   */
  formEndpoint: '',

  /**
   * Shows the TODO markers (e.g. missing USt-IdNr., lawyer review) on the pages.
   * Set to false only once docs/TODO-before-launch.md is done.
   */
  showTodoNotices: true,

  /** Date of the current privacy policy version (shown as "Stand"). */
  privacyPolicyDate: todo('Datum der finalen, anwaltlich geprüften Fassung eintragen') as MaybeTodo,
} as const;

export const company = {
  /** Brand / trading name. */
  name: 'D-Group Storage & Shipping',
  /** Official Arabic brand name. */
  nameAr: 'داماس جروب للتخزين والشحن',
  /** Group the company belongs to. */
  group: 'D-Group',

  owner: 'Baschir Qassab',
  /** TODO: optional – Arabic spelling of the owner's name for the /ar/ pages (until then the Latin spelling is used). */
  ownerAr: todo('Arabische Schreibweise des Inhabernamens (optional)') as MaybeTodo,

  address: {
    /** TODO: verify spelling – the usual form is "Darmstädter Straße 3". */
    street: 'Darmstädterstraße 3',
    postalCode: '64385',
    city: 'Reichelsheim',
    country: 'Deutschland',
    countryAr: 'ألمانيا',
    countryCode: 'DE',
  },

  phone: {
    /**
     * As displayed on the site.
     * TODO: verify the number – 06461 is the Biedenkopf area code, Reichelsheim (Odenwald) uses 06164.
     */
    display: '+49 6461 620230 9',
    /** Same number for tel: links, digits only with country code. */
    href: '+4964616202309',
  },

  /**
   * Public contact address.
   * TODO: placeholder – the company may get its own domain and mailbox later.
   * Never put the internal invoices mailbox here.
   */
  email: 'info@d-group-it-solutions.de',

  /** Umsatzsteuer-Identifikationsnummer (§ 27a UStG). */
  vatId: todo('USt-IdNr. noch nicht vergeben – eintragen, sobald vorhanden') as MaybeTodo,
  /** Steuernummer – not required in the Impressum; only shown if you decide to publish it. */
  taxNumber: todo('Steuernummer noch nicht vergeben – muss im Impressum nicht angegeben werden') as MaybeTodo,
  /** Commercial register entry, if any (court + number). */
  register: todo('Handelsregistereintrag? Falls vorhanden: Registergericht und Nummer') as MaybeTodo,

  /** Sister company, linked in the footer and on the about page. */
  sister: {
    name: 'D-Group IT Solutions',
    url: 'https://www.d-group-it-solutions.de',
  },
} as const;

/**
 * Facts that are deliberately NOT on the website because they are unknown.
 * Fill them in here first, then add them to the copy in src/i18n/*.ts.
 */
export const unknownFacts = {
  openingHours: todo('Öffnungs- bzw. Erreichbarkeitszeiten'),
  serviceArea: todo('Liefergebiete / Einzugsgebiet'),
  warehouseLocation: todo('Liegt das Lager an der Firmenadresse? Lagerfläche/Kapazität'),
  goodsAccepted: todo('Welche Waren werden eingelagert (Kartons, Paletten, Sperrgut, …)? Ausschlüsse?'),
  shippingPartners: todo('Versanddienstleister / Versandarten'),
  pricing: todo('Preise – bisher nur auf Anfrage'),
  hosting: todo('Hosting-Anbieter (für die Datenschutzerklärung)'),
} as const;

/** Postal address as one line, e.g. for the footer. */
export const addressLine = `${company.address.street}, ${company.address.postalCode} ${company.address.city}`;

/** OpenStreetMap search link (plain link, nothing is loaded until clicked). */
export const mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(
  `${company.address.street}, ${company.address.postalCode} ${company.address.city}`,
)}`;
