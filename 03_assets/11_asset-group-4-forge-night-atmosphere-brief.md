# Asset Group 4 — Forge / Night Atmosphere

> **✅ GENERATED & APPROVED (2026-07-24, Candidate 1 as-is).** Final record: [12_asset-group-4-approved-manifest.md](12_asset-group-4-approved-manifest.md). Actual generation used the **user-directed reference pair M2 + M8** (superseding §1's original M4/M2/M1 plan) with GPT Image 2 (2k/high, 7 credits). Accepted exceptions (this asset only): abstract water-like moonlit horizon; active zone into the lower ~35–40%; one prismatic thread + two faint prismatic bokeh specks — **specks must not become a recurring default motif.** The rest of this brief is retained as the production record.
> This asset **fulfills and refines the existing `BP-2` Forge Backplate** (`03_assets/01_hero-backplates.md`). It is the atmospheric layer behind the Forge screen: state chips, the short journal note, the ack → reframe → action response cards, and — critically — **safety mode** (`02_strategy/02` §4–5: 988/911 gentle flow). It must never feel urgent, punishing, or melodramatic. One optional, low-contrast, mobile-first 9:16 asset.

## 0. Purpose & required emotion
- **Screen:** Forge (reflection, journaling, emotional reset, and safety copy).
- **Emotion:** a darker **chrome sanctuary** looking out at a **distant moonlit meadow horizon** — calm, private, grounded, safe. Quiet resolve, not drama. Must read as steady and non-alarming behind gentle/safety copy.
- **Relationship to Group 2:** it echoes the approved meadow world but **must not duplicate** `aur_backplate_meadow-bluehour_v1`. Group 2 = a close blue-hour **flower field** with interest in the lower two-thirds. Group 4 = an **enclosed dark night sanctuary** with the meadow pushed to a **distant low horizon band**, far more negative space, reflective-metal light at the margins, and foliage only as edge silhouettes.

## 1. Reference-selection plan (per `00_asset-strategy` §1a)
Selected **3** private references, each contributing one distinct borrowed quality:
- **`M4_chrome-knight-meadow-prism.jpg`** → borrow: **reflective silver-chrome light in cobalt shadow**, deep night-meadow depth, restrained prismatic dew glint. *Not* the knight/armor/pose/framing.
- **`M2_garden-bokeh-bubbles-bloom.jpg`** → borrow: **soft foliage silhouettes, gentle haze, analog bloom/diffusion**. *Not* the bubbles/backlit-garden composition.
- **`M1_field-figure-sunset-wildflowers.jpg`** → borrow: **distant low horizon, deep-sky negative space, breathing room** (shifted from sunset to night). *Not* the human figure or lens-scratches.
- Uploaded as **style guidance only**; output is an original scene, textless. `01_references/` never committed or shipped, never reproduced in subject/framing/objects/composition.

## 2. Exact generation prompt
> A serene dark chrome sanctuary at night looking out toward a distant moonlit meadow horizon, deep blue-black and cobalt atmosphere filling most of the frame, a very faint silver moon-glow low on the far horizon, soft haze and gentle mist, faint reflective silver-metal light catching quietly along the lower edges, subtle dark foliage silhouettes framing the far left and right margins only, restrained analog 35mm film grain, a whisper of prismatic refraction low near the horizon, vast calm negative space through the center and upper frame, meditative stillness, private and grounded, luxury editorial wellness photography, textless.

## 3. Negative constraints (hard)
`no person, no human figure, no face, no armor, no knight, no horse, no sword, no weapon, no combat, no fire, no flames, no candle, no ritual, no gothic church, no dungeon, no interior room, no neon, no high saturation, no bright light source, no full rainbow, no lens-flare streaks, no busy center, no dense foreground flowers (that is Group 2), no text, no logo, no watermark, no signature, no crisis or distress imagery, nothing urgent or dramatic.`

## 4. Recommended Higgsfield model-selection criteria
- Prioritize, in order: **compositional control** (dark negative-space center, meadow confined to a low band), **reference-guided cinematic night atmosphere**, **subtle low-contrast tonal control**, and **originality**. Lowest cost is secondary.
- **Recommended: GPT Image 2** (`gpt_image_2`, 9:16, resolution `2k`, quality `high`) — same rationale as the approved Group 2 primary anchor; strongest at holding a calm dark composition with reserved text zones and delicate reflections.
- **Budget fallback:** Nano Banana Pro (`nano_banana_pro`, 2k) at ~2 credits if you want to trial cheaply first; expect less tonal/compositional control.
- Feed the 3 references as style inputs (guidance only).

## 5. Dimensions, crop & text-safe areas
- **Aspect / gen size:** 9:16 portrait, generate at **2k** (GPT Image 2 outputs ~1152×2048 to ~1520×2688).
- **Ship:** resize to **1080-wide** WebP; `object-fit: cover; object-position: center`.
- **Text-safe areas (Forge content):**
  - **Upper third + entire center column** = deep, low-detail, dark — reserved for the journal input, state chips, and the ack/reframe/action cards + Next-rep button. Keep it unbusy so white text and forged-glass cards read cleanly.
  - **Distant meadow horizon confined to the lower ~20–25%**; foliage silhouettes only at the extreme left/right margins (never intruding into the center).
  - Must also hold **safety-mode copy** (multi-line, calm) in the center without contrast fighting the text.

## 6. Compression target & fallback
- **Format:** WebP (primary) + JPEG fallback via `<picture>`; sRGB; strip metadata (target 0 EXIF).
- **Budget:** **≤ 180 KB** (BP-2 budget; expect ~60–90 KB given how dark it is). Plus a **~2 KB LQIP** blur-up.
- **Fallback:** ceremonial-cobalt CSS gradient `radial-gradient(ellipse at 50% 85%, var(--aur-cobalt-900), var(--aur-night) 70%)` — the Forge screen is fully usable on this alone.

## 7. Optional-behind-solid-CSS (how it stays optional)
- The Forge screen ships with the **CSS cobalt gradient as its real background**; this image is a **progressive enhancement layer** loaded on top (lazy). If it never loads, is disabled, or fails, Forge looks intentional and calm on the gradient. No feature, no legibility, and no safety-copy readability depends on the image.

## 8. Reduced-data & reduced-motion
- **Save-Data / cellular:** skip the raster entirely; keep the CSS gradient + LQIP. Never block first paint.
- **Reduced-motion:** the asset is a **static image** (no motion), so nothing to disable — but note Forge overall, and especially **safety mode**, must remain calm and static; no parallax, no drift, no animated overlay on this backplate.
- Decorative → `alt=""` / `aria-hidden="true"`; conveys no information.

## 9. Estimated credits
- **Recommended:** GPT Image 2 (2k/high), **1 candidate = ~7 credits** (matches the single-candidate approach used for Group 2). Balance: 552.29.
- **Budget option:** Nano Banana Pro, 1 candidate = **~2 credits**.
- No sprite, no batch; one candidate for review.

## 10. Pass/Fail review checklist
- [ ] Upper-third + center column dark, low-detail, text-safe; white body text passes AA; safety-copy block readable.
- [ ] Meadow confined to a **distant low horizon**; **not** a Group-2-style flower field (clearly differentiated).
- [ ] Foliage only as **edge silhouettes**; center stays open.
- [ ] Reflective metal light is **subtle**; prismatic ≤ a tiny low-horizon whisper (no branding rainbow).
- [ ] Reads calm/private/grounded/**safe** — nothing urgent, punishing, or melodramatic; works behind gentle/safety copy.
- [ ] **Excludes** person/armor/horse/weapon/flames/candle/ritual/church/dungeon/neon/text/logo/watermark/crisis imagery.
- [ ] Original — no reference subject/framing/object/composition reproduced.
- [ ] Ship WebP ≤180 KB + JPEG fallback + LQIP; **0 EXIF**; no watermark.
- [ ] Optional: Forge fully correct on the CSS gradient alone.

## 11. Compliance
Optional enhancement only; darker/quieter sibling of the approved meadow world, not a duplicate; no prohibited subjects; textless; core Forge screen (and safety mode) fully functional and calm without it.
