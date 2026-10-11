/**
 * Tiny static file server for dist/ (used by verify.mjs and lighthouse.mjs).
 * Behaves like a typical static host: /path/ → /path/index.html, unknown → 404.html.
 *
 *   node scripts/serve.mjs [port]
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist', import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
};

async function resolve(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  let file = join(dist, clean);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    await stat(file);
    return file;
  } catch {
    return null;
  }
}

export function startStaticServer(port) {
  const server = createServer(async (req, res) => {
    const file = await resolve(req.url ?? '/');
    const target = file ?? join(dist, '404.html');
    const body = await readFile(target);
    res.writeHead(file ? 200 : 404, {
      'Content-Type': types[extname(target)] ?? 'application/octet-stream',
      'Cache-Control': target.includes('/_astro/') || target.includes('/fonts/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    res.end(body);
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 4321);
  await startStaticServer(port);
  console.log(`Serving dist/ on http://127.0.0.1:${port}`);
}
