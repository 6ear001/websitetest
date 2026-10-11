# TODO before launch – D-Group Storage & Shipping

Everything on this list is **unknown, unconfirmed or legally sensitive**. None of it is published
on the site as a fact. While `site.showTodoNotices` in `src/config/site.ts` is `true`, the affected
pages show a dashed red **TODO** marker. `npm run todos` lists every marker in the source.

Legend: 🔴 must be done before going live · 🟡 confirm or decide · 🟢 optional

---

## 1. Logo files (🔴)

The original SVGs live on a local drive (`E:\هوية بصرية مجموعة دماس للحلول التقنية\Storage-Shipping\Vector\SVG\`)
and could not be copied in automatically. **`public/brand/` currently holds clearly marked placeholders**
(a dashed box with a "D" and the text "D-GROUP / STORAGE & SHIPPING").

- [ ] 🔴 Copy the 5 originals into `public/brand/` and overwrite the placeholders, keeping the exact file names:
      `DamasGroupStorage_Horizontal_Color.svg`, `_Horizontal_OnDark.svg`, `_Stacked_Color.svg`, `_Icon_Color.svg`, `_Icon_OnDark.svg`
- [ ] 🔴 Run `npm run build`. It regenerates `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`,
      `icon-512.png` and `og-image.png` from the icon. Logo sizes are read from each SVG's `viewBox`, so nothing else needs changing.
- [ ] 🟡 Look at the header, footer, the about page and `public/og-image.png` with the real logo.
- [ ] 🟢 Optionally put `DamasGroupStorage_BrandIdentity_preview.png` into `docs/brand/` for reference (not published).

Details: [docs/BRAND.md](BRAND.md)

## 2. Company data – `src/config/site.ts` (🔴/🟡)

| | Item | Current value | Action |
| --- | --- | --- | --- |
| 🔴 | **Domain** | `https://www.example.com` | Set `site.url` (or build with `SITE_URL=https://…`). Canonical, hreflang, sitemap, robots.txt and Open Graph all use it. |
| 🔴 | **Phone number** | `+49 6461 620230 9` | Please double-check. **06461 is the area code of Biedenkopf; Reichelsheim (Odenwald) uses 06164.** If the trailing `9` is an extension, the DIN 5008 format is `+49 6461 620230-9`. |
| 🔴 | **Street** | `Darmstädterstraße 3` | Must match the official address exactly. The usual spelling is `Darmstädter Straße 3`. |
| 🟡 | **E-mail** | `info@d-group-it-solutions.de` | Placeholder until the company has its own domain or mailbox. Change `company.email`. **Never publish the internal invoices mailbox.** |
| 🟡 | **USt-IdNr.** | todo | Add it as soon as it's assigned; the Impressum then shows it automatically. If a Wirtschafts-Identifikationsnummer is assigned, it must be listed too (§ 5 DDG). |
| 🟡 | **Steuernummer** | todo | **Not** required in the Impressum and usually better left out. Keep it as a todo or delete the line in `Imprint.astro`. |
| 🟡 | **Commercial register** | todo | Only if the business is registered (e.g. e.K.). Then add the court and number, and add the suffix to the company name. |
| 🟡 | **Legal form** | "Inhaber: Baschir Qassab" (sole proprietorship assumed) | Confirm. |
| 🟢 | Arabic spelling of the owner's name | todo | `company.ownerAr`. Until then the Latin spelling is used on `/ar/`. |

## 3. Legal review (🔴)

- [ ] 🔴 **Impressum** (`/impressum/`, `src/views/Imprint.astro`): have a lawyer review it (§ 5 DDG).
      Decide on the consumer dispute resolution statement (§ 36 VSBG). The current text says "nicht bereit und nicht verpflichtet".
      There is deliberately no EU ODR platform link: the platform was shut down in July 2025.
- [ ] 🔴 **Datenschutzerklärung** (`/datenschutz/`, text in `src/i18n/de.ts` → `privacy`): this is a standard template for a static site
      **and must be reviewed by a lawyer**. Still to fill in:
  - [ ] hosting provider (name, address) and how long it keeps server logs (section 3)
  - [ ] data processing agreement (AV-Vertrag, Art. 28 GDPR) with the hosting provider
  - [ ] effective date ("Stand", `site.privacyPolicyDate`)
  - [ ] confirm that the supervisory authority is the Hessian Commissioner (HBDI, Wiesbaden)
- [ ] 🔴 The Arabic legal pages (`/ar/imprint/`, `/ar/privacy/`) are translations and say the German version is binding.
      After any legal change, update both `de.ts` and `ar.ts`.
- [ ] 🔴 **HTTPS**: make sure the host serves a valid certificate. On Apache, uncomment the redirect in `public/.htaccess`.
- [ ] Once everything above is done, set `site.showTodoNotices = false`.

## 4. Facts deliberately left off the site

None of these are stated anywhere, by design. Add them only once they're confirmed: first in
`src/config/site.ts` → `unknownFacts`, then in the copy (`src/i18n/de.ts` **and** `ar.ts`).

- [ ] opening or availability hours
- [ ] delivery areas or catchment area
- [ ] is the warehouse at the company address? Floor space or capacity?
- [ ] which goods are accepted (cartons, pallets, bulky items …) and which are excluded
- [ ] shipping carriers and shipping methods
- [ ] prices (currently "on request" only)
- [ ] years in business, certifications, customers or references, testimonials, statistics: **only if real and verifiable**

## 5. Copy to confirm (🟡)

The draft copy makes no factual promises, but the owner should confirm it:

- [ ] **Services lists** (`services.storage.list`, `services.shipping.list`): especially "Verpackung" (packing),
      "Annahme Ihrer Anlieferung" (receiving deliveries) and "Herausgabe oder Versand auf Abruf" (release or shipping on demand).
      Delete anything that isn't offered.
- [ ] **"Why D-Group"** (`home.why.items`): "Persönlich erreichbar" (personally reachable), "Angebot nach Maß" (tailored quote) and so on.
- [ ] **About page**: owner paragraph, the "Unsere Haltung" values, "Reichelsheim im Odenwald".
- [ ] 🟢 If you advise customers in Arabic too, add it as a selling point to "Warum D-Group". This was left out because it isn't confirmed.
- [ ] 🟢 **Arabic proofreading** by a native speaker (company tone, legal terms).
- [ ] 🟢 The "BQ" monogram on the about page is a placeholder; a portrait photo and a short personal statement are optional.

## 6. Contact form (🟡)

- Current behaviour: the form validates in the browser, then opens the visitor's e-mail program with a pre-filled
  message (mailto). **No data reaches a server.**
- [ ] 🟡 Decide whether to keep it this way. If you want a real form submission:
      set `PUBLIC_FORM_ENDPOINT` (or `site.formEndpoint`) to a **self-hosted** handler (e.g. a PHP script on your own host)
      that accepts `multipart/form-data` POST requests, responds with 2xx, and drops the `website` honeypot field.
      **Then update privacy-policy section 6** (provider, purpose, data processing agreement).
- [ ] Test the form on a phone and on a desktop (does the mail app open?).

## 7. Go-live checklist

- [ ] `SITE_URL=https://<domain> npm run build`
- [ ] `npm run verify`: no overflow, console errors, broken links or third-party requests
- [ ] `npm run lighthouse`: all categories ≥ 95 (mobile)
- [ ] Upload `dist/` (see README → Deployment)
- [ ] Check the live site: `https://<domain>/robots.txt`, `/sitemap.xml`, the 404 page, and the language switcher on every page
- [ ] 🟢 Submit the sitemap to Google Search Console / Bing Webmaster Tools (no effect on the site itself)
- [ ] 🟢 Test the link preview (Open Graph) with the real logo, e.g. by sharing a link in a messenger app
