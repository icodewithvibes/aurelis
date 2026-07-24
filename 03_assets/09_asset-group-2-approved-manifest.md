# Asset Group 2 — APPROVED Manifest (2026-07-24)

Approved by Yuriel (Candidate 1, as-is). Scope: the primary mobile meadow backplate (`BP-1`, blue-hour variant) — the first primary visual anchor for AURELIS.

---

## 1. Files & actual sizes

| Role | Filename | Format | Dimensions | Size |
|---|---|---|---|---|
| **Primary (ship)** | `aur_backplate_meadow-bluehour_v1@1080x1910.webp` | WebP q82 | 1080×1910 | **81.1 KB** (≤220 ✓) |
| **Fallback** | `aur_backplate_meadow-bluehour_v1@1080x1910.jpg` | JPEG q82 progressive | 1080×1910 | **145.6 KB** |
| **LQIP** | `aur_backplate_meadow-bluehour_v1_lqip@24x42.webp` | WebP | 24×42 | **0.12 KB** |
| **Source (not shipped)** | `../candidates/asset-group-2/aur_backplate_meadow-bluehour_cand1@1520x2688.png` | PNG | 1520×2688 | 4.75 MB |

All in `03_assets/approved/asset-group-2/` except the retained source, which stays in `candidates/asset-group-2/` and **must never be loaded by the app**.

## 2. Intended screen & mobile crop behavior
- **Screen:** Today (home) and onboarding background — **optional visual enhancement only**. Never behind the active workout logger, controls, or dense data.
- **Crop:** `object-fit: cover`, `object-position: center bottom`. At 9:19.5 the ship 9:15.9 crops slightly top/bottom; the flower band stays lower-third, sky fills behind status/greeting. Bottom darkens under the tab bar.

## 3. Upper-third safe-text area
- The **entire upper third is deep-cobalt gradient, near-black at the top, effectively detail-free** — reserved for the Today greeting/date/status and first onboarding line. White text passes AA here; verified intact after compression.

## 4. CSS fallback & loading behavior
- **Fallback (required):** ceremonial-cobalt CSS gradient `linear-gradient(180deg, var(--aur-night) 0%, var(--aur-cobalt-900) 55%, var(--aur-night) 100%)` — the app is fully correct if the image never loads.
- **Loading:** inline LQIP (0.12 KB) as blur-up → `<picture>` WebP with JPEG fallback, lazy unless it is the first paint. Respect `Save-Data`/cellular → skip the raster, keep the CSS fallback.
- Delivered via `<picture>`; dimensions reserved to prevent layout shift.

## 5. Reference selection & abstract qualities used
- **`M4_chrome-knight-meadow-prism.jpg`** → borrowed: cobalt-shadow meadow atmosphere, pale flowers in shade, restrained prismatic caustic sparkle, chrome-like dew glints. Knight/armor/pose/framing **not** used.
- **`M1_field-figure-sunset-wildflowers.jpg`** → borrowed: low-through-the-flowers foreground, analog grain/bloom, deep open-sky negative space. Figure/lens-scratches/sunset palette **not** used (shifted to blue-hour).
- References were uploaded privately to the Higgsfield workspace as **style guidance only**; the output is an original scene. `01_references/` is never committed or shipped.
- **Note on horizon glints:** the low band of soft multicolor refraction bokeh is accepted as a subtle atmospheric detail **for this asset only** — it must stay low in frame and **must not become a recurring default motif** in future assets.

## 6. Provenance & credits
- **Model:** GPT Image 2 (`gpt_image_2`), 9:16, resolution 2k, quality high. Job `37f0a04e-6937-42e3-aa0f-a46f67ed691f` · source `hf_20260724_044953_37f0a04e….png`.
- **Credits:** this asset **7**; Asset Group 1 **10**; **running total 17**. Balance after: 552.29.
- Exports produced locally (Pillow): resize→WebP/JPEG/LQIP. **0 EXIF tags** on every output and the source (verified). No watermark, no reference likeness, no embedded credentials.

## 7. Accessibility / reduced-data
- Decorative → `alt=""` / `aria-hidden="true"`; conveys no information (all meaning is in text/UI).
- `prefers-reduced-motion` unaffected (static image). `Save-Data`/cellular → CSS fallback only.
- Maintain AA contrast for text over the reserved upper third; apply the cobalt scrim (TX-3) beneath any card placed over the flower band.

## 8. Explicit rule
- **No text is embedded in the image** (no words, captions, logos, watermarks, or signatures). Verified.

## 9. Compliance
- No people/figure/face, knight, armor, horse, sword, weapon, combat, fire, crown, shield, badge, HUD, logo, or copied reference composition.
- Optional enhancement layer; core app correct without it.
- Not merged to git; no Pages/Kimi/code/other-group work in this task.
