/**
 * End-to-end check of the built site (run `npm run build` first):
 *
 *   npm run verify
 *
 * - serves dist/ with a small static server (scripts/serve.mjs)
 * - opens every page at 375, 768 and 1440 px and saves full-page screenshots to reports/screenshots/
 * - fails on: horizontal overflow, console errors, failed or 4xx/5xx requests,
 *   ANY request to a third-party host, broken internal links/anchors,
 *   missing/duplicate <title>/description, wrong lang/dir, missing canonical/hreflang, ≠ 1 <h1>
 *
 * Needs a Chromium for Playwright: `npx playwright install chromium` (once).
 */
import { mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startStaticServer } from './serve.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 4329);
const ORIGIN = `http://127.0.0.1:${PORT}`;
// Build and check with the same BASE_PATH (e.g. /websitetest/ for GitHub Pages).
const BASE = `${ORIGIN}${(process.env.BASE_PATH || '/').replace(/\/$/, '')}`;
const WIDTHS = [375, 768, 1440];
const SHOTS = `${root}reports/screenshots`;

async function htmlPages(dir = `${root}dist`, prefix = '/') {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...(await htmlPages(`${dir}/${entry.name}`, `${prefix}${entry.name}/`)));
    else if (entry.name === 'index.html') out.push(prefix);
    else if (entry.name.endsWith('.html')) out.push(`${prefix}${entry.name}`);
  }
  return out.sort();
}

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

const server = await startStaticServer(PORT);
const browser = await chromium.launch();
await mkdir(SHOTS, { recursive: true });

try {
  const pages = await htmlPages();
  const titles = new Map();
  const descriptions = new Map();
  const links = new Map(); // url → first page that links to it

  for (const path of pages) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const where = `${path} @${width}`;

      page.on('console', (msg) => {
        if (msg.type() === 'error' && !(path === '/404.html' && /404/.test(msg.text()))) fail(where, `console error: ${msg.text()}`);
      });
      page.on('pageerror', (err) => fail(where, `page error: ${err.message}`));
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (!['localhost', '127.0.0.1'].includes(url.hostname) && !['data:', 'blob:'].includes(url.protocol)) {
          fail(where, `THIRD-PARTY REQUEST: ${req.url()}`);
        }
      });
      page.on('requestfailed', (req) => fail(where, `request failed: ${req.url()} (${req.failure()?.errorText})`));
      page.on('response', (res) => {
        if (res.status() >= 400 && !(path === '/404.html' && res.url().endsWith('/404.html'))) {
          fail(where, `HTTP ${res.status()}: ${res.url()}`);
        }
      });

      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      const info = await page.evaluate(() => {
        const doc = document.documentElement;
        const overflowing = [...document.querySelectorAll('body *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1);
          })
          .filter((el) => !el.closest('[aria-hidden="true"], .hp, svg'))
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join('.')}`);
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
          overflowing,
          lang: doc.lang,
          dir: doc.dir,
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '',
          hreflangs: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.getAttribute('hreflang')),
          h1: document.querySelectorAll('h1').length,
          hrefs: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
          imagesWithoutAlt: [...document.querySelectorAll('img:not([alt])')].length,
        };
      });

      if (info.scrollWidth > info.clientWidth) {
        fail(where, `horizontal overflow ${info.scrollWidth}px > ${info.clientWidth}px ${info.overflowing.join(', ')}`);
      }
      if (info.imagesWithoutAlt) fail(where, `${info.imagesWithoutAlt} <img> without alt`);

      if (width === WIDTHS[0]) {
        const isAr = path.startsWith('/ar/');
        if (info.lang !== (isAr ? 'ar' : 'de')) fail(path, `lang="${info.lang}"`);
        if (info.dir !== (isAr ? 'rtl' : 'ltr')) fail(path, `dir="${info.dir}"`);
        if (info.h1 !== 1) fail(path, `${info.h1} <h1> elements`);
        if (!info.title) fail(path, 'missing <title>');
        if (!info.description) fail(path, 'missing meta description');
        if (titles.has(info.title)) fail(path, `duplicate title with ${titles.get(info.title)}`);
        if (descriptions.has(info.description)) fail(path, `duplicate description with ${descriptions.get(info.description)}`);
        titles.set(info.title, path);
        descriptions.set(info.description, path);
        if (path !== '/404.html') {
          if (!info.canonical) fail(path, 'missing canonical');
          for (const h of ['de', 'ar', 'x-default']) if (!info.hreflangs.includes(h)) fail(path, `missing hreflang ${h}`);
        }
        for (const href of info.hrefs) if (!links.has(href)) links.set(href, path);
      }

      const name = path === '/' ? 'de-home' : path.replace(/^\/|\/$/g, '').replace(/\.html$/, '').replace(/\//g, '-');
      await page.screenshot({ path: `${SHOTS}/${name.startsWith('ar') ? name : `de-${name}`}-${width}.png`.replace('de-de-', 'de-'), fullPage: true });
      await context.close();
    }
  }

  // Internal links and #anchors
  const external = new Set();
  for (const [href, from] of links) {
    if (/^(mailto|tel):/.test(href)) continue;
    const url = new URL(href, `${BASE}${from}`);
    if (url.origin !== ORIGIN) {
      external.add(url.href);
      continue;
    }
    const res = await fetch(url.href);
    if (res.status !== 200) {
      fail(from, `broken link ${href} → HTTP ${res.status}`);
      continue;
    }
    if (url.hash) {
      const html = await res.text();
      if (!html.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)) fail(from, `missing anchor ${href}`);
    }
  }

  console.log(`Checked ${pages.length} pages × ${WIDTHS.length} widths. Screenshots: reports/screenshots/`);
  console.log(`External links (not loaded, only linked):\n  ${[...external].join('\n  ')}`);
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('\n✓ No overflow, no console errors, no broken links, zero third-party requests.');
