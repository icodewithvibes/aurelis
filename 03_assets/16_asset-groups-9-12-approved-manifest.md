# Asset Groups 9–12 — APPROVED Manifest (2026-07-25)

Approved by Yuriel in session. Covers the **time-of-day hero cycle**, the **regenerated nav icon set**, the **app icon / PWA**, and the **Chrome Crest medallion family**.

All generated with **GPT Image 2** (`gpt_image_2`), resolution `2k`, quality `high` — the locked model policy. Nano Banana Pro is no longer used for iconography.

---

## Group 9 — Today hero cycle (8 scenes, 4 bands)

Two scenes per band; `heroForTime()` picks one deterministically per (day, band), so the image is stable within a day and varies across days.

| Band | Scene | id | Job |
|---|---|---|---|
| dawn | back view, rose-gold sunrise | `knight-dawn` | `ce2183e5` |
| dawn | facing viewer, sword point-down | `knight-dawn-facing` | `dd626fc2` |
| day | back view, azure field | `knight-day` | `4b35b87b` |
| day | facing viewer, prismatic flare | `knight-day-facing` | `96a0fc93` |
| dusk | **Chrome Rider** (approved Group 5, unchanged) | `chrome-rider-dusk` | `f9709661` |
| dusk | facing viewer, gold rim-light | `knight-dusk-facing` | `fa9457c3` |
| night | moonlit kneel, dew caustics | `knight-night` | `e901aeaa` |
| night | facing viewer, moon upper-right | `knight-night-facing` | `fb841722` |

- **Export:** 1080×1910, WebP **≤220 KB** (q68–84, stepped down to fit budget) + progressive JPEG fallback (q76) + 24×42 LQIP. No EXIF.
- **`hero_night` is mirrored on export** so the moon clears the top-left, where Today's date and title sit.
- **Bands:** dawn 05–09 · day 09–17 · dusk 17–21 · night 21–05, device-local.
- **Guardrails unchanged:** solid `--aur-fallback-cobalt` is the real background; Save-Data skips rasters entirely; LQIP blur-up; reduced-motion freezes the drift. Only the *active* scene is fetched — the imports resolve to URLs, not bytes.
- **Files:** `03_assets/approved/asset-group-9-heroes/`, shipped copies in `src/design/assets/backplates/`.

**Direction change from Group 5:** swords are now permitted (held at rest, point-down) per the new art direction; combat, raised weapons, gore and violence remain forbidden. Faces are never visible — helms are closed and visors dark.

## Group 10 — Bottom-nav icon set (replaces the rejected Group 8)

One generated sheet (job `a2c77334`) of five monoline glyphs, sliced by bounding box into equal squares.

| Destination | Glyph |
|---|---|
| Today | rising sun |
| Train | barbell |
| Forge | anvil |
| Proof | laurel sprig |
| Settings | gear |

- **Export:** 96×96 WebP q90, 0.7–2.1 KB each, silver-white strokes on solid black.
- The nav **screen-blends** them, so black drops out on the dark bar; active = full, inactive = 0.5 opacity.
- Verified legible at the rendered 26 px.
- **Files:** `03_assets/approved/asset-group-10-nav-icons/`, shipped in `src/design/assets/icons/`.

## Group 11 — App icon + PWA

Armoured gauntlet gripping a barbell (job `0644bf4f`); chosen over an engraved helm and an ogive shield for silhouette strength at 48 px.

| Purpose | File | Size |
|---|---|---|
| PWA any | `icon-192.png` / `icon-512.png` | 48.5 / 302.7 KB |
| PWA maskable | `icon-maskable-512.png` (mark inset to inner 80%) | 204.9 KB |
| iOS | `apple-touch-icon.png` | 43.1 KB |
| Browser | `favicon-32.png`, `favicon.ico` (16/32/48/64) | 1.9 / 13.3 KB |

- Background is the generated flat cobalt field `rgb(2, 40, 136)`; manifest `theme_color` / `background_color` stay `#070C18`.
- **`public/manifest.webmanifest`** + icon links in `index.html`. Installable as a PWA.
- **Still out of scope:** service worker, offline caching, and any deploy (GitHub Pages remains disabled).
- **Files:** `03_assets/approved/asset-group-11-app-icon/`, shipped copies in `public/`.

## Group 12 — Chrome Crest medallions (7 levels)

One silhouette — a pointed-oval (ogive) inside a ring with a central column — with additive detail per tier.

| Level | Tier | Added at this level |
|---|---|---|
| L1 | Unmarked | bare chrome ring, plain column, single spark |
| L2 | First Mark | second concentric ring, thicker ogive |
| L3 | Polished Mark | gold enters — upper half of the column |
| L4 | Silver Crest | full gold column, cobalt channel, faceted diamonds |
| L5 | Cobalt Crest | baroque scrollwork fills the ogive |
| L6 | Prismatic Crest | chrome laurel flourish at the base |
| L7 | Ascendant Crest | gold laurel, prismatic caustics, full ornament |

- L2–L4 were **re-rendered** (jobs `6f16ba0c`, `a62539ce`, `e247f302`) after the first pass made the early tiers nearly indistinguishable.
- **Export:** 320×320 WebP q88 with an anti-aliased circular mask (12–26 KB each).
- **Rendering rule:** `CrestEmblem` uses the medallion at **≥96 px** (Proof hero, completion reveal) and the approved **SVG Threshold Arch** below that or under Save-Data. The SVG remains the accessible source of truth; nothing depends on the network.
- **Files:** `03_assets/approved/asset-group-12-crest/`, shipped in `src/design/assets/crest/`.

---

## Provenance & credits

- **Jobs:** 21 GPT Image 2 generations this session (3 heroes + 4 front heroes + 1 nav sheet + 3 app icons + 7 crest levels + 3 crest re-renders).
- **Credits:** 21 × 7 = **147**. Balance before 528.29 → after ≈ **381**.
- **References** (private, style guidance only, never committed, never redistributed): M4 chrome-knight meadow, M5 gold-knight water/roses, M6 chrome rider (carries a watermark — never reproduced), M8 knight/sword/prismatic flare. Uploaded to the generation service as inputs only.
- Every prompt carried explicit exclusions: no text, letters, numbers, watermark, reversed text, signature, logo, recognisable character or franchise, copied composition, combat, gore, neon, or game UI. **Berserk was an abstract register only** — no character, armour design, panel composition, or branding was reproduced.

## Compliance

Optional, accessible, image-disable-safe. Solid CSS fallbacks everywhere; Save-Data honoured; reduced-motion honoured; 44 px targets unchanged; no 390 px overflow. Raw candidates live in `03_assets/candidates/` and are **git-ignored** as of this session — only compressed approved exports are committed.
