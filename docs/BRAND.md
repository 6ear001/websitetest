# Brand files

> **The SVGs in this folder are PLACEHOLDERS** (dashed box + "D-GROUP" text).
> The original logo files could not be copied automatically because they live on a local drive.

Copy the original, unmodified files from

```
E:\هوية بصرية مجموعة دماس للحلول التقنية\Storage-Shipping\Vector\SVG\
```

into this folder, **keeping the exact file names** (overwrite the placeholders):

| File | Used for |
| --- | --- |
| `DamasGroupStorage_Horizontal_Color.svg` | logo on light backgrounds (about page) |
| `DamasGroupStorage_Horizontal_OnDark.svg` | header and footer (black background) |
| `DamasGroupStorage_Stacked_Color.svg` | about page (D-Group family card) |
| `DamasGroupStorage_Icon_Color.svg` | `favicon.svg`, `favicon.ico` |
| `DamasGroupStorage_Icon_OnDark.svg` | `apple-touch-icon.png`, app icons, Open Graph image |

Optionally add `DamasGroupStorage_BrandIdentity_preview.png` to `docs/brand/` for reference
(it is not published on the website).

Then run `npm run build` (or just `npm run brand`). The script `scripts/brand-assets.mjs`
regenerates favicon, apple-touch-icon, app icons and the Open Graph image from the icon files.
Width/height of the logos are read from each SVG's `viewBox`, so the layout adapts automatically.

**Never redraw, recolor or edit the logo files.**
