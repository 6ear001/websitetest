/**
 * Lighthouse (mobile) for every page of the built site.
 *
 *   npm run build && npm run lighthouse
 *
 * Uses the Chromium that Playwright installed, runs `lighthouse` via npx
 * (not a project dependency), writes reports to reports/lighthouse/ and
 * fails if any category is below MIN_SCORE (default 95).
 */
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { startStaticServer } from './serve.mjs';

const run = promisify(execFile);
const root = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.env.PORT || 4330);
const ORIGIN = `http://127.0.0.1:${PORT}`;
// Build and check with the same BASE_PATH (e.g. /websitetest/ for GitHub Pages).
const BASE = `${ORIGIN}${(process.env.BASE_PATH || '/').replace(/\/$/, '')}`;
const MIN = Number(process.env.MIN_SCORE || 95);
const OUT = `${root}reports/lighthouse`;
const ONLY = process.env.PAGES?.split(',');

async function htmlPages(dir = `${root}dist`, prefix = '/') {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...(await htmlPages(`${dir}/${entry.name}`, `${prefix}${entry.name}/`)));
    else if (entry.name === 'index.html') out.push(prefix);
  }
  return out.sort();
}

const server = await startStaticServer(PORT);

await mkdir(OUT, { recursive: true });
const failures = [];
try {
  const pages = ONLY ?? (await htmlPages());
  for (const path of pages) {
    const name = path === '/' ? 'home' : path.replace(/^\/|\/$/g, '').replace(/\//g, '-');
    const file = `${OUT}/${name}.json`;
    await run(
      'npx',
      [
        '--yes',
        'lighthouse@13.5.0',
        `${BASE}${path}`,
        '--quiet',
        '--output=json',
        `--output-path=${file}`,
        '--only-categories=performance,accessibility,best-practices,seo',
        '--chrome-flags=--headless=new --no-sandbox --no-proxy-server',
      ],
      { env: { ...process.env, CHROME_PATH: chromium.executablePath() }, maxBuffer: 64 * 1024 * 1024 },
    );
    const report = JSON.parse(await readFile(file, 'utf8'));
    const scores = Object.fromEntries(
      Object.entries(report.categories).map(([k, v]) => [k, Math.round(v.score * 100)]),
    );
    const failed = Object.entries(report.audits)
      .filter(([, a]) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'manual' && a.scoreDisplayMode !== 'notApplicable')
      .map(([id, a]) => `${id}(${a.score})`);
    console.log(`${path.padEnd(18)} ${Object.entries(scores).map(([k, v]) => `${k}=${v}`).join('  ')}`);
    if (failed.length) console.log(`  audits below 1: ${failed.join(', ')}`);
    for (const [k, v] of Object.entries(scores)) if (v < MIN) failures.push(`${path} ${k}=${v}`);
  }
} finally {
  server.close();
}

if (failures.length) {
  console.error(`\n✗ Below ${MIN}:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`\n✓ All categories ≥ ${MIN}. Reports: reports/lighthouse/`);
