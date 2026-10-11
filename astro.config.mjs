// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { site } from './src/config/site.ts';

// The public URL of the site (used for canonical, hreflang, sitemap, Open Graph).
// Override at build time without touching code:  SITE_URL=https://www.example.de npm run build
const siteUrl = process.env.SITE_URL || site.url;

export default defineConfig({
  site: siteUrl,
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
