import type { APIRoute } from 'astro';
import { withBase } from '../i18n/config';
import { absolute } from '../lib/urls';

export const GET: APIRoute = ({ site }) =>
  new Response(
    process.env.NOINDEX
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\n\nSitemap: ${absolute(withBase('/sitemap.xml'), site)}\n`,
    {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    },
  );
