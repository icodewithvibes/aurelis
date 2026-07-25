# Asset Group 5 — APPROVED Manifest (2026-07-24)

Approved by Yuriel ("approve all assets… for the background I like the new knight generation, use that"). The **Chrome Rider Today Hero** — the primary luminous visual anchor for the Today surface.

## Files & sizes
| Role | Filename | Format | Dims | Size |
|---|---|---|---|---|
| Primary (ship) | `aur_backplate_today-hero_v1@1080x1910.webp` | WebP q84 | 1080×1910 | **157.5 KB** (≤220 ✓) |
| Fallback | `aur_backplate_today-hero_v1@1080x1910.jpg` | JPEG q84 prog. | 1080×1910 | **224 KB** |
| LQIP | `aur_backplate_today-hero_v1_lqip@24x42.webp` | WebP | 24×42 | **0.23 KB** |
| Source (not shipped) | `../candidates/asset-group-5/aur_hero_chrome-rider_cand1@1520x2688.png` | PNG | 1520×2688 | 5.05 MB |

Ship copies in `src/design/assets/backplates/hero_*`; **0 EXIF**, no watermark/text. App copies are separate from `03_assets/approved`; originals untouched.

## Use
- **Today surface only** (`Backplate variant="hero"`), `object-fit: cover; object-position: center bottom`.
- Text-safe: upper third is deep-cobalt sky (`--veil-hero` keeps it readable); Today greeting + crest live there.
- Optional: solid `--aur-fallback-cobalt` CSS fallback; Save-Data skips the raster; LQIP blur-up; slow atmospheric drift (reduced-motion static).

## Provenance & credits
- GPT Image 2 (2k/high). Job `f9709661-70f4-4227-87b5-fc66a040b523`. **7 credits** (balance 538.29).
- References (private, style-guidance only, never committed/uploaded): M6 (cobalt cape motion + chrome silhouette; not the horse/watermark), M4 (chrome material + prismatic dew), M2 (dreamy bloom/haze). Original subject + composition.

## Compliance
No horse, sword, weapon, combat, raised arms, crown, banner, recognizable character, face detail, text, logo, or watermark. Luminous (not gloomy). Optional, accessible, image-disable-safe.
