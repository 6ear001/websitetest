/**
 * Lists every open TODO in the source (unknown company data, copy to confirm, legal review).
 *
 *   npm run todos
 *
 * The full, explained checklist is docs/TODO-before-launch.md.
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const patterns = [
  /todo\(\s*'([^']+)'/g, // todo('…') values in src/config/site.ts
  /<Todo note="([^"]+)"/g, // visible markers in templates
  /todo: '([^']+)'/g, // markers in translation files
  /(?:\/\/|\*)\s*TODO:?\s*(.+)$/gm, // code comments
];

async function files(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) out.push(...(await files(p)));
    else if (/\.(ts|astro|mjs)$/.test(e.name)) out.push(p);
  }
  return out;
}

let count = 0;
for (const file of [...(await files(`${root}src`)), `${root}astro.config.mjs`]) {
  const text = await readFile(file, 'utf8');
  const hits = new Map();
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      const line = text.slice(0, m.index).split('\n').length;
      if (!hits.has(line)) hits.set(line, m[1].trim());
    }
  }
  for (const [line, msg] of [...hits].sort((a, b) => a[0] - b[0])) {
    console.log(`${file.replace(root, '')}:${line}  ${msg}`);
    count++;
  }
}
console.log(`\n${count} TODO(s). Checklist: docs/TODO-before-launch.md`);
