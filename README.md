# D-Group Storage & Shipping – Website

Marketing website for **D-Group Storage & Shipping** (داماس جروب للتخزين والشحن), Reichelsheim (Odenwald),
a company of the D-Group (sister company: [D-Group IT Solutions](https://www.d-group-it-solutions.de)).

- **Static site**: [Astro](https://astro.build) + [Tailwind CSS 4](https://tailwindcss.com). No backend, no database; the build output is plain HTML/CSS/JS.
- **Languages**: German (default, `/`) and Arabic (`/ar/`, right-to-left), with a language switcher, `hreflang` and translated meta data.
- **Privacy by default**: no third-party requests at all. Fonts are self-hosted, and there are no analytics, maps, videos or CDNs, so **no cookie banner is needed**.
- **Quality**: semantic HTML, WCAG AA, visible focus, `prefers-reduced-motion` support, JSON-LD `LocalBusiness`, `sitemap.xml`, `robots.txt`.

> ⚠️ **Before going live**, work through [docs/TODO-before-launch.md](docs/TODO-before-launch.md).
> The logos in `public/brand/` are still **placeholders**, and the domain, legal review and a few company details are still open.

---

## Quick start

Requirements: **Node.js ≥ 22.12** (npm comes with it).

```bash
npm install
npm run dev        # http://localhost:4321 (live reload)
npm run build      # → dist/ (brand assets + type check + build)
npm run preview    # serves dist/ locally
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Generates favicon/OG image from the logo, runs `astro check`, builds to `dist/` |
| `npm run preview` | Preview of the built site |
| `npm run brand` | Only regenerates favicon, apple-touch-icon, app icons and `og-image.png` |
| `npm run check` | TypeScript / Astro type check |
| `npm run todos` | Lists every open TODO in the source |
| `npm run verify` | E2E check of `dist/` (see [Quality checks](#quality-checks)) |
| `npm run lighthouse` | Lighthouse (mobile) for every page, fails below 95 |

## Where to edit what

| What | File |
| --- | --- |
| **Company data** (name, owner, address, phone, e-mail, USt-IdNr., domain, form endpoint) | [`src/config/site.ts`](src/config/site.ts), the single source of truth, used by every page, the Impressum, the privacy policy and the JSON-LD |
| **German copy** (all texts, titles, meta descriptions, legal texts) | [`src/i18n/de.ts`](src/i18n/de.ts) |
| **Arabic copy** | [`src/i18n/ar.ts`](src/i18n/ar.ts) |
| **URLs per language** | [`src/i18n/config.ts`](src/i18n/config.ts) → `routes` |
| Page layouts | [`src/views/`](src/views) (`Home`, `Services`, `About`, `Contact`, `Imprint`, `Privacy`) |
| Header, footer, form, illustrations | [`src/components/`](src/components) |
| Colours, fonts, buttons, motion | [`src/styles/global.css`](src/styles/global.css) |
| Logos | [`public/brand/`](public/brand) (see [docs/BRAND.md](docs/BRAND.md)) |

Unknown values are written as `todo('…')` in `site.ts`. They are never shown as facts. While
`site.showTodoNotices` is `true`, the affected spots show a visible dashed **TODO** marker.

### Contact data

Change it in `src/config/site.ts` → `company`, and every page updates. Example:

```ts
email: 'info@d-group-storage.de',      // new mailbox
vatId: 'DE123456789',                  // as soon as it's assigned → shown in the Impressum automatically
```

### Contact / quote form

`src/components/ContactForm.astro`: client-side validation (translated messages), honeypot field and GDPR consent checkbox.

- **Default (no endpoint):** after validation, the visitor's e-mail program opens with a pre-filled message to `company.email` (mailto fallback). No data goes to a server.
- **With an endpoint:** set `PUBLIC_FORM_ENDPOINT=https://…` in `.env` (see `.env.example`) or `site.formEndpoint`.
  The form then sends `multipart/form-data` via `fetch` (or as a normal POST without JavaScript) and shows a success or error message.
  No third-party service is wired in. If you use one, **update section 6 of the privacy policy**.

### Logos, favicon, Open Graph image

Put the original SVGs into `public/brand/` (exact file names in [docs/BRAND.md](docs/BRAND.md)) and run `npm run build`.
`scripts/brand-assets.mjs` derives `favicon.svg/.ico`, `apple-touch-icon.png`, `icon-192/512.png` and `og-image.png` from the icon.
The logo itself is only scaled, never redrawn or recoloured.

## Adding a language (e.g. English)

1. **`src/i18n/config.ts`**: add `'en'` to `locales`, add an entry to `localeMeta` (`label`, `dir: 'ltr'`, `ogLocale: 'en_GB'`, …)
   and an `en` URL for every page in `routes` (e.g. `services: { …, en: '/en/services/' }`).
2. **`src/i18n/en.ts`**: copy `de.ts`, rename the export to `en`, set `lang = 'en'`, translate.
   TypeScript (`npm run check`) reports any missing key.
3. **`src/i18n/index.ts`**: `import { en } from './en'` and add it to `dictionaries`.
4. `npm run build`. Pages, language switcher, `hreflang`, sitemap and Open Graph locales are generated automatically
   (`src/pages/[...path].astro` creates every page for every language).

For an RTL language, set `dir: 'rtl'`. All layouts use CSS logical properties (`ms-`, `ps-`, `start-`, `end-`, `text-start`),
and arrows/illustrations mirror via `rtl:` variants. Wrap Latin data inside RTL text (phone, e-mail, addresses) in `dir="ltr"`,
as `ar.ts` does with `ltr()`.

## Deployment

The site is static: upload the contents of **`dist/`** to any web host.

```bash
SITE_URL=https://www.your-domain.de npm run build
```

`SITE_URL` (or `site.url` in `site.ts`) must be the live domain. Canonical, `hreflang`, sitemap, robots.txt and Open Graph all depend on it.

- **Classic hosting (Apache, e.g. IONOS, Strato, all-inkl):** upload `dist/` via (S)FTP into the web root. `dist/.htaccess` sets the 404 page,
  compression, caching and security headers; the HTTPS redirect is in there commented out.
- **Netlify / Cloudflare Pages / Vercel / GitHub Pages:** build command `npm run build`, output directory `dist`, environment variable `SITE_URL`.
  `404.html` is picked up automatically.
- Hosting in the EU and an AV-Vertrag (data processing agreement) with the host are recommended (see the privacy policy TODO).

## Quality checks

```bash
npm run build
npm run verify       # all pages × 375/768/1440 px, screenshots in reports/screenshots/
npm run lighthouse   # mobile, reports in reports/lighthouse/
```

`verify` fails on horizontal overflow, console errors, failed or 4xx requests, **any request to a third-party host**,
broken internal links or anchors, wrong `lang`/`dir`, missing or duplicate titles and descriptions, missing canonical/`hreflang`, or ≠ 1 `<h1>`.
Both scripts need a Chromium for Playwright (once: `npx playwright install chromium`).

Last run (mobile, simulated throttling): every page has **Performance 98–99, Accessibility 100, Best Practices 100, SEO 100**.

## Brand rules (short)

- Colours: red `#FF3131`, black `#000000`, white `#FFFFFF`, neutral greys only.
  Red on white is only ~3.6:1, so use it for large text, icons, buttons and accents only. Body text is black or near-black.
  Red buttons carry **black** text (5.7:1).
- Fonts: Montserrat (Latin), Noto Kufi Arabic (Arabic), self-hosted variable fonts in `public/fonts/` (SIL OFL, licences included).
- Shapes: rounded "crates" (10–12 px radius) and the arrow as motifs. **Don't redraw or recolour the logo.**

## Project structure

```
public/            static files (brand/, fonts/, favicons, og-image.png, .htaccess, site.webmanifest)
scripts/           brand-assets, verify, lighthouse, serve (static server), list-todos
src/config/        site.ts – company data & TODOs
src/i18n/          config.ts (languages, URLs), de.ts, ar.ts, types.ts
src/layouts/       BaseLayout.astro – <head>, SEO, JSON-LD, header/footer
src/components/    header, footer, form, illustrations, …
src/views/         page contents (language-independent)
src/pages/         [...path].astro (all pages), 404.astro, sitemap.xml.ts, robots.txt.ts
docs/              TODO-before-launch.md, BRAND.md
```

Note: the Astro CLI collects anonymous usage statistics **on the developer's machine** (this does not affect the website).
To turn it off: `npx astro telemetry disable`.
