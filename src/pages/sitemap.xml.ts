import type { APIRoute } from 'astro';
import { locales, pageKeys, pathFor } from '../i18n';
import { absolute } from '../lib/urls';

/** sitemap.xml with hreflang alternates for every page. */
export const GET: APIRoute = ({ site }) => {
  const urls = pageKeys.flatMap((page) =>
    locales.map((lang) => {
      const links = [
        ...locales.map(
          (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${absolute(pathFor(page, l), site)}"/>`,
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${absolute(pathFor(page, 'de'), site)}"/>`,
      ];
      return `  <url>\n    <loc>${absolute(pathFor(page, lang), site)}</loc>\n${links.join('\n')}\n  </url>`;
    }),
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
