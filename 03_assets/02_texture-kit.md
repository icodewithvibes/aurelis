# 02 — Texture Kit (grain, bloom, scrims, glints)

Small, reusable, mostly tiling/alpha overlays that give every screen the Ceremonial Chrome finish **cheaply**. These are the highest-priority assets: with the texture kit + tokens, Kimi can style the whole app even before backplates land.

Reference universal rules in `00_asset-strategy.md`.

---

## TX-1 — Film Grain Tile  ·  ESSENTIAL
- **Intended screen:** global overlay on all dark surfaces.
- **Aspect ratio:** seamless **square tile**, 512×512 (tiles across viewport).
- **Safe text area:** n/a (full-bleed low-opacity overlay).
- **Original-generation prompt:**
  > Seamless tileable fine analog 35mm monochrome film grain texture, neutral gray on transparent, subtle organic noise, no visible seams, even distribution, no clumps, high detail, flat scan.
- **Negative constraints:** no color, no vignette, no pattern/repetition artifacts, no dust scratches (kept separate), no text.
- **File format / compression:** **PNG with alpha** (or grayscale WebP-alpha); **≤ 40 KB**. Used at `opacity 0.04–0.06`, `mix-blend-mode: overlay`.
- **Mobile fallback:** omit entirely (purely decorative) — app still correct without it.
- **Essential / optional:** ESSENTIAL (defines the analog feel; extremely cheap).

## TX-2 — Soft Bloom / Glow Sprite  ·  ESSENTIAL
- **Intended screen:** behind hero glow, completion moment, crest stage.
- **Aspect ratio:** square 1024×1024, radial, centered.
- **Safe text area:** n/a.
- **Original-generation prompt:**
  > A soft circular silver-white light bloom fading smoothly to transparent, gentle cobalt-tinted outer falloff, no hard edges, diffuse cinematic glow, centered radial gradient, on transparent background.
- **Negative constraints:** no lens flare streaks, no rainbow, no star shape, no rays, no text.
- **File format / compression:** **PNG/WebP alpha**; **≤ 30 KB**. Positioned, scaled, faded via CSS (never a live filter).
- **Mobile fallback:** CSS `radial-gradient` approximation.
- **Essential / optional:** ESSENTIAL.

## TX-3 — Cobalt Scrim Gradient  ·  ESSENTIAL
- **Intended screen:** legibility scrim placed over any photographic backplate under text.
- **Aspect ratio:** portrait 9:19.5 (or pure CSS).
- **Original-generation prompt:** (prefer CSS; asset only if a richer edge is wanted)
  > A vertical gradient from transparent at top to deep cobalt-black at bottom, smooth, subtle grain, for text legibility overlay, on transparent.
- **Negative constraints:** no banding, no color shift to purple, no text.
- **File format / compression:** ideally **pure CSS gradient** (0 KB); if raster, PNG **≤ 20 KB**.
- **Mobile fallback:** the CSS gradient itself is the default.
- **Essential / optional:** ESSENTIAL (CSS-first).

## TX-4 — Prismatic Edge Glint Strip  ·  ESSENTIAL
- **Intended screen:** the single restrained prismatic glint on completion, focus rings, chrome divider highlights.
- **Aspect ratio:** wide thin strip 1024×128 (swept across an element).
- **Original-generation prompt:**
  > A very thin, elegant horizontal sliver of restrained rainbow spectrum light — soft blue, violet, rose, amber, mint — low saturation, diffuse, fading to transparent at both ends, like light refracting on a polished chrome edge, on transparent background.
- **Negative constraints:** no full rainbow block, no high saturation, no neon, no lens flare, no text; must read as *restraint*, not a pride flag or a game bar.
- **File format / compression:** **PNG/WebP alpha**; **≤ 24 KB**. Animated by translating across an element (transform only, 450–650ms).
- **Mobile fallback:** CSS gradient using `--aur-prism` masked to a thin line.
- **Essential / optional:** ESSENTIAL (this is the app's signature accent).

## TX-5 — Brushed Chrome Bar / Divider  ·  OPTIONAL
- **Intended screen:** hairline section dividers, card top-edges, tab bar rule.
- **Aspect ratio:** wide thin 1024×48.
- **Original-generation prompt:**
  > A polished brushed silver-chrome horizontal bar with a soft anisotropic sheen, cool cobalt reflection, subtle highlight running along its length, seamless left-right tiling, on transparent.
- **Negative constraints:** no rivets, no ornament, no engraving, no text, no warm gold.
- **File format / compression:** WebP/PNG alpha; **≤ 20 KB**, horizontally tileable.
- **Mobile fallback:** 1px CSS gradient hairline.
- **Essential / optional:** OPTIONAL (CSS hairline is an acceptable default).

## TX-6 — Botanical Filigree Elements  ·  OPTIONAL (feeds crest + Ascendant states)
- **Intended screen:** decorative wildflower/leaf filigree used around the Ascendant Crest and empty states.
- **Aspect ratio:** individual elements on transparent, ~512×512 each, a small set (3–5 sprigs).
- **Original-generation prompt:**
  > A small set of delicate original wildflower and leaf filigree sprigs — fine silver line-art with faint cobalt tint — elegant, botanical, symmetrical enough to frame an emblem, not any real heraldic crest, on transparent background.
- **Negative constraints:** no real heraldry/coats-of-arms, no roses styled like the reference images, no thorns/weapons, no text, no logos.
- **File format / compression:** **SVG preferred** (crisp, tiny) or PNG alpha ≤ 20 KB each.
- **Mobile fallback:** omit; crest still renders without filigree below Ascendant.
- **Essential / optional:** OPTIONAL (becomes essential only if the Ascendant Crest uses raster filigree instead of authored SVG).

---

### QA
Every overlay must be verified at 1× on a real iPhone: grain not noisy, bloom not banded, prismatic strip genuinely subtle. All are decorative — the app must remain correct if any single texture fails to load.
