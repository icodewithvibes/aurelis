# 06 — Asset Usage & Performance

How assets are named, stored, loaded, and budgeted so AURELIS stays fast on iPhone and light on GitHub Pages. This binds the asset briefs to the build (`02_strategy/06_kimi-build-brief.md`).

---

## 1. Repository placement
```
src/design/assets/
  backplates/   BP-1..4  (webp + jpg + lqip)
  textures/     TX-1..6  (png/webp alpha, svg)
  crest/        CR-0..6  (svg authored; optional webp textures)  + emblem.svg components
  states/       ES-*, CS-*, SF-*  (webp/svg)
  video/        VID-*    (mp4 + webm + poster)   ← optional, may be absent in V1
```
- **SVG** (crest, filigree, dividers) authored in-repo, versioned as text.
- Raster/video are build inputs, referenced by import so Vite fingerprints + cache-busts them.

## 2. Naming (locked)
`aur_<category>_<name>_<variant>@<w>x<h>.<ext>`
e.g. `aur_backplate_today-night_v1@1170x2532.webp`, `aur_texture_grain_v1@512x512.png`, `aur_crest_ascendant_v1@1024x1024.webp`, `aur_video_landing-loop_v1@1080x1920.webm`.

## 3. Loading strategy
- **Critical (above the fold on first paint):** BP-1 + TX-1/TX-2 → preload; ship an inline **LQIP/blur-up** (~2 KB) so the screen is never blank.
- **Per-route:** other backplates lazy-load on navigation.
- **Textures:** tiny, cached long-term (hashed filenames, immutable cache headers).
- **Crest:** SVG inline/rendered instantly; optional hero texture lazy-loads only on level-up/Ascendant.
- **Video:** never in the critical path; poster-first, load clip only on a page that needs it, and only when not reduced-motion / not Save-Data / not cellular.

## 4. Format policy
- Photographic → **WebP** primary (AVIF optional), **JPEG** fallback via `<picture>`.
- Overlays/flat/alpha → **PNG or WebP-alpha**; prefer **CSS gradients** where they suffice (scrim, hairlines).
- Structural/emblem/line-art → **SVG**.
- Video → **WebM (VP9)** first, **MP4 (H.264)** fallback, always with a poster.

## 5. Compression budgets (ship size, per asset)
| Asset | Budget |
|---|---|
| BP-1/BP-3 portrait backplate | ≤ 200–220 KB |
| BP-2 Forge backplate | ≤ 180 KB |
| BP-4 Meadow-Light | ≤ 240 KB |
| TX-1 grain | ≤ 40 KB · TX-2 bloom ≤ 30 KB · TX-4 glint ≤ 24 KB · others ≤ 20 KB |
| Crest per level (raster) | ≤ 30 KB (SVG ~ negligible) |
| Empty/completion states | ≤ 60 KB (many are SVG/texture-composed = ~0) |
| LQIP blur placeholders | ≤ 2 KB each |
| Video per clip | VID-1 ≤ 2.5 MB · VID-2 ≤ 1.5 MB · VID-3 ≤ 600 KB |

**Page budgets:** any core app screen (Today/Train/Forge/Proof) ≤ **~500 KB** of imagery total (excludes optional video). Landing page ≤ **~3 MB** including one video, poster-first.

## 6. Performance rules (bind to design doc §4)
- Effects are **static assets + transform/opacity**, never live filters: no animated `backdrop-filter`, no runtime canvas grain, no per-frame JS glow.
- Rest timer ring = CSS/SVG animation, not rAF redraw.
- Completion/level-up = pre-baked bloom (TX-2) + prismatic glint (TX-4) translated across the crest; 450–650ms completion, ~900ms level-up.
- Respect `prefers-reduced-motion` (and in-app `reducedMotion` setting) everywhere → static fallbacks, no translate/scale.
- Respect `Save-Data` / cellular → posters instead of video, defer non-critical backplates.

## 7. Graceful degradation (must-hold guarantees)
- If **any** raster/video asset fails to load, the screen still renders correctly on token gradients + SVG. No broken-image boxes, no layout shift (reserve dimensions / use LQIP).
- The **entire app** is usable and on-brand with **zero** photographic or video assets — textures + tokens + SVG crest are enough. Photography and video are enhancement layers.

## 8. Accessibility
- Decorative art → `alt=""` / `aria-hidden`. Meaningful state art (completion, safety) conveys meaning through **text**, not the image.
- Maintain AA contrast for any text over imagery (verify against the reserved dark zones); scrim (TX-3) applied where needed.

## 9. Licensing / provenance
- All assets are **original generations** (Fable 5 / Higgsfield). No stock, no scraped art, no reference-image derivatives. Keep the generation prompt + tool + date recorded alongside each final asset for provenance.
