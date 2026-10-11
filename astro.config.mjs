// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { site } from './src/config/site.ts';

// The public URL of the site (used for canonical, hreflang, sitemap, Open Graph).
// Override at build time without touching code:  SITE_URL=https://www.example.de npm run build
const siteUrl = process.env.SITE_URL || site.url;
// Sub-folder the site is served from, e.g. BASE_PATH=/websitetest/ for https://user.github.io/websitetest/
const basePath = process.env.BASE_PATH || '/';

export default defineConfig({
  site: siteUrl,
  base: basePath,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // CSS (~8 kB gzipped) is inlined: no render-blocking request, faster first paint.
    inlineStylesheets: 'always',
  },
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
