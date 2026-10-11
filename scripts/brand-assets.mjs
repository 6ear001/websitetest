/**
 * Generates favicon, apple-touch-icon, app icons and the Open Graph image
 * from the brand icon SVGs in public/brand/. Runs automatically before every build.
 *
 *   npm run brand
 *
 * The logo itself is only scaled – never redrawn or recolored.
 */
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const pub = (p) => `${root}public/${p}`;

const ICON_COLOR = pub('brand/DamasGroupStorage_Icon_Color.svg');
const ICON_DARK = pub('brand/DamasGroupStorage_Icon_OnDark.svg');

const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** Render an SVG into a square PNG of `size` px, logo scaled to `inner` px and centered. */
async function renderSquare(svgPath, size, inner, background) {
  const svg = await readFile(svgPath);
  const logo = await sharp(svg, { density: 1200 })
    .resize(inner, inner, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Minimal ICO writer: embeds PNG images (supported by all current browsers). */
function toIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

/** Open Graph image (1200×630): brand icon on black with the crate motif. */
async function renderOg() {
  const W = 1200;
  const H = 630;
  const iconSize = 300;
  const icon = await sharp(await readFile(ICON_DARK), { density: 1200 })
    .resize(iconSize, iconSize, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer();

  // Decorative background only (rounded "crates" + arrow) – the logo is composited untouched on top.
  const deco = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="#262626"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="#000"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <g fill="none" stroke-width="4">
    <rect x="770" y="380" width="300" height="170" rx="12" stroke="#3a3a3a"/>
    <rect x="800" y="232" width="240" height="132" rx="12" stroke="#3a3a3a"/>
    <rect x="830" y="110" width="180" height="106" rx="12" stroke="#FF3131"/>
    <rect x="80" y="440" width="150" height="110" rx="12" stroke="#262626"/>
    <rect x="100" y="80" width="110" height="80" rx="12" stroke="#262626"/>
  </g>
  <path d="M640 548 C 700 548 720 470 760 470" fill="none" stroke="#FF3131" stroke-width="10" stroke-linecap="round"/>
  <path d="M748 446 L 782 470 L 748 494 Z" fill="#FF3131"/>
  <rect x="0" y="${H - 14}" width="${W}" height="14" fill="#FF3131"/>
</svg>`);

  return sharp(deco)
    .composite([{ input: icon, left: Math.round(W / 2 - iconSize / 2 - 120), top: Math.round(H / 2 - iconSize / 2 - 10) }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function main() {
  // favicon.svg = the color icon, unchanged
  await copyFile(ICON_COLOR, pub('favicon.svg'));

  const ico = [];
  for (const size of [16, 32, 48]) {
    ico.push({ size, data: await renderSquare(ICON_COLOR, size, size, TRANSPARENT) });
  }
  await writeFile(pub('favicon.ico'), toIco(ico));

  await writeFile(pub('apple-touch-icon.png'), await renderSquare(ICON_DARK, 180, 144, BLACK));
  await writeFile(pub('icon-192.png'), await renderSquare(ICON_DARK, 192, 154, BLACK));
  await writeFile(pub('icon-512.png'), await renderSquare(ICON_DARK, 512, 410, BLACK));
  await writeFile(pub('og-image.png'), await renderOg());

  console.log('brand assets: favicon.svg, favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png, og-image.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
