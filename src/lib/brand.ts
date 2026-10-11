import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { withBase } from '../i18n/config';

/** Logo files in public/brand/ (originals, never edited). */
export const logos = {
  horizontalColor: '/brand/DamasGroupStorage_Horizontal_Color.svg',
  horizontalOnDark: '/brand/DamasGroupStorage_Horizontal_OnDark.svg',
  stackedColor: '/brand/DamasGroupStorage_Stacked_Color.svg',
  iconColor: '/brand/DamasGroupStorage_Icon_Color.svg',
  iconOnDark: '/brand/DamasGroupStorage_Icon_OnDark.svg',
} as const;

/**
 * Reads width/height from an SVG's viewBox at build time, so <img> gets the
 * correct aspect ratio (no layout shift) whatever logo file is dropped in.
 */
/** URL of a logo for <img src>, including the base path. */
export const logoSrc = (publicPath: string): string => withBase(publicPath);

export function svgSize(publicPath: string): { width: number; height: number } {
  try {
    const svg = readFileSync(join(process.cwd(), 'public', publicPath), 'utf8');
    const viewBox = svg.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (viewBox) return { width: Math.round(Number(viewBox[1])), height: Math.round(Number(viewBox[2])) };
    const w = svg.match(/<svg[^>]*\swidth\s*=\s*["']([\d.]+)/i);
    const h = svg.match(/<svg[^>]*\sheight\s*=\s*["']([\d.]+)/i);
    if (w && h) return { width: Math.round(Number(w[1])), height: Math.round(Number(h[1])) };
  } catch {
    // fall through to a sensible default
  }
  return { width: 300, height: 64 };
}
