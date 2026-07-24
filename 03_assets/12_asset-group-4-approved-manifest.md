# Asset Group 4 — APPROVED Manifest (2026-07-24)

Approved by Yuriel (Candidate 1, as-is; no retouch). Scope: the **Forge / Night Atmosphere backplate** — fulfills `BP-2` (`01_hero-backplates.md`). The calm optional atmosphere behind Forge journaling, response cards, and **safety mode**.

---

## 1. Files & actual sizes

| Role | Filename | Format | Dimensions | Size |
|---|---|---|---|---|
| **Primary (ship)** | `aur_backplate_forge-night_v1@1080x1910.webp` | WebP q82 | 1080×1910 | **57.3 KB** (≤180 ✓) |
| **Fallback** | `aur_backplate_forge-night_v1@1080x1910.jpg` | JPEG q82 progressive | 1080×1910 | **133.6 KB** |
| **LQIP** | `aur_backplate_forge-night_v1_lqip@24x42.webp` | WebP | 24×42 | **0.13 KB** |
| **Source (never app-loaded)** | `../candidates/asset-group-4/aur_backplate_forge-night_cand1@1520x2688.png` | PNG | 1520×2688 | 5.20 MB |

All exports in `03_assets/approved/asset-group-4/`; **0 EXIF tags** on every file (verified); no watermark, no embedded text, no credentials, no reference imagery.

## 2. Intended screen & crop behavior
- **Screen:** Forge — state chips, journal note input, ack/reframe/action cards, Next-rep flow, and **safety mode** (988/911 gentle flow). Optional enhancement only; never required.
- **Crop:** `object-fit: cover; object-position: center`. At 9:19.5 the sides trim slightly (edge foliage), top/bottom stay dark under status/tab bars.

## 3. Text-safe areas
- **Upper ~55% + center column:** empty cobalt gradient — journal input, chips, and cards sit here; verified calm and artifact-free after compression; white text AA+.
- **Lower ~20% (dew sparkle):** busiest zone — any card/button placed there carries the standard TX-3 cobalt scrim (design-system default).
- Safety-mode copy renders over the calm center; the image never competes with it.

## 4. Loading, fallback & reduced-data (documented behavior)
- **Real background = solid ceremonial-cobalt CSS:** `radial-gradient(ellipse at 50% 85%, var(--aur-cobalt-900), var(--aur-night) 70%)`. Image is a lazy progressive enhancement via `<picture>` (WebP → JPEG) + inline LQIP blur-up; dimensions reserved (no layout shift).
- **Save-Data / cellular:** skip the raster entirely; CSS gradient + LQIP only. Never blocks first paint.
- **Static asset** — no motion, no parallax, no animated overlays (Forge, especially safety mode, stays still).

## 5. Accepted exceptions (LOCKED, this asset only)
- The distant horizon reads as **abstract moonlit dew / water-like reflective shimmer** — intentionally not a literal location.
- The active foliage/dew zone extends into the **lower ~35–40%**; approved because the center/upper text-safe zones take priority and are clean.
- **One low prismatic thread + two faint prismatic bokeh specks accepted for this asset only** — prismatic bokeh specks must **not** become a repeated default motif in future AURELIS assets (same rule as the Group 2 horizon glints).

## 6. Reference-derived principles (user-directed pair)
- **`M2_garden-bokeh-bubbles-bloom.jpg`** → dreamlike analog bloom, wet-foliage presence, gentle haze/bokeh, sparse translucent orb forms, diffused illumination. *Not* its garden composition or bubbles-as-subject.
- **`M8_knight-sword-prismatic-flare.jpg`** → deep cobalt night, silver/chrome light behavior, one controlled prismatic refraction, quiet-endurance mood. *Not* the knight/sword/armor/pose/typography/composition.
- Uploaded privately as style guidance only; output is an original scene. `01_references/` never committed or shipped.

## 7. Provenance & credits
- **Model:** GPT Image 2 (`gpt_image_2`), 9:16, 2k, quality high. Job `fb1bfe76-cec4-4e18-b623-ccb396f8af05` · source `hf_20260724_134611_fb1bfe76….png` · src sha256 `ee8f4f9029d3a245…`.
- **Credits:** Group 4 = **7**. Running total: Group 1 (10) + Group 2 (7) + Group 3 (0) + Group 4 (7) = **24**. Balance after: **545.29**.
- Exports produced locally (Pillow): resize 1520×2688 → 1080×1910 (Lanczos) → WebP/JPEG/LQIP; metadata-free.

## 8. Accessibility
- Decorative → `alt=""` / `aria-hidden="true"`; conveys no information; all meaning stays in text/UI.
- AA contrast maintained for text over the reserved zones; TX-3 scrim under any low-placed card.
- Calm/static by design — appropriate behind gentle safety copy; nothing urgent, dramatic, or attention-pulling.

## 9. Compliance
No person/figure/armor/horse/weapon/combat/flames/candle/ritual/church/dungeon/neon/HUD/crisis imagery; textless; no watermark; original (no reference subject/framing/object reproduced); optional behind the CSS fallback — Forge fully correct without it.
