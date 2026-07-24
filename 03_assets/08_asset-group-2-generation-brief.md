# Asset Group 2 — Generation Brief (PREPARED, NOT GENERATED)

> **STATUS: awaiting explicit "Generate Asset Group 2" approval. No job submitted.** This file defines the first real image-generation batch. Nothing here has been generated.

Scope: **one** asset — the primary mobile meadow backplate (BP-1 family, blue-hour variant). Single deliverable, so review is tight before any credits are spent.

---

## 1. Purpose & required emotion
- **Asset:** `BP-1` — AURELIS primary meadow backplate, blue-hour / moonlit variant.
- **Screen:** **Today** and **onboarding** background — *visual enhancement only*, never behind the active workout logger, controls, or dense data.
- **Emotion:** quiet sacred resolve at the edge of night — calm, spacious, "equipped and at rest." Not sunset-bright, not dramatic.

## 2. Reference Selection (per 00_asset-strategy §1a)
**Selected private inputs (2 of 8):**
- **`01_references/mood-images/M4_chrome-knight-meadow-prism.jpg`** — borrow *only* the abstract qualities: dark cobalt-shadow meadow atmosphere, wildflowers/daisies sitting in shade, restrained prismatic caustic sparkle, faint reflective-metal glints of light on dew. **Do NOT copy** the knight/armor subject, its pose, or its framing.
- **`01_references/mood-images/M1_field-figure-sunset-wildflowers.jpg`** — borrow *only*: low-through-the-flowers wildflower foreground, analog film grain, atmospheric bloom, deep open sky with generous negative space, the sense of one small presence in a vast field. **Do NOT copy** the human figure, the lens-scratch pattern, or the sunset palette (shift to blue-hour).

**Optional third (bloom quality only, use if the batch needs softer light):** `M2_garden-bokeh-bubbles-bloom.jpg` — borrow gauzy bloom + restrained prismatic diffraction; never its bubbles or composition.

**Abstract qualities being borrowed (summary):** cobalt-night meadow mood, pale wildflowers, reflective-metal light glints, soft bloom + film grain, restrained prismatic sparkle, deep negative space. **Original scene — no subject, armor, horse, weapon, pose, composition, logo, watermark, or art reproduced from any reference.**

*(References are private style inputs. In the actual generation call they inform the prompt language; if fed as image inputs to the model, they are style guidance only and the output must be an original scene. `01_references/` is never uploaded to GitHub or shipped.)*

## 3. Layout constraints
- **Aspect ratio:** 9:16 portrait (mobile primary). Generate at 2k for a full-screen background.
- **Text-safe area: the UPPER THIRD** must stay dark, low-detail, and low-contrast — it holds the Today greeting/date/status and the first onboarding line. Put visual interest in the **lower two-thirds** (meadow, wildflowers, faint horizon glow).
- **Low contrast behind UI** everywhere; nothing that competes with white text or forged-glass cards.
- **Optional asset:** must degrade to a **ceremonial-cobalt CSS gradient fallback** (`--aur-night → --aur-cobalt-900`, radial silver hint) + a ~2 KB LQIP blur-up. App is fully correct if it never loads.

## 4. Exact generation prompt (draft — for the approval call)
**Model:** `nano_banana_pro` · **aspect_ratio:** `9:16` · **resolution:** `2k` · **count:** 3 (pick 1, keep 1 alt)

> A serene blue-hour meadow at the edge of night, deep cobalt and midnight-blue sky filling the upper portion and darkening smoothly toward near-black, calm and empty above for text, a low field of pale silver-white and soft-blue wildflowers across the lower portion catching faint moonlight, a whisper of reflective silver-chrome light glinting on dew, gentle mist, a very restrained thread of prismatic light refraction low near the horizon only, soft cinematic bloom, analog 35mm film grain, quiet sacred stillness, luxury editorial wellness photography, deep negative space, no subject, textless.

## 5. Negative constraints (hard)
`no people, no human figure, no face, no knight, no armor, no horse, no sword, no weapon, no combat, no fire, no crown, no shield, no badge, no game HUD, no XP, no logo, no watermark, no signature, no text, no full rainbow, no neon or high saturation, no bright sunset/golden-hour, no busy or bright upper third, no lens-flare streaks, no copied composition or subject from any reference image.`

## 6. Output, format & budget
- **Target format:** ship **WebP** (primary) + **JPEG** fallback via `<picture>`; sRGB.
- **Compression budget:** **≤ 220 KB** at ship width (per 06 §5, BP-1). Generate large → compress hard (same PNG→WebP pipeline used for Group 1).
- **Also export:** a ~2 KB LQIP blur-up (24px) for progressive load.
- **iPhone fallback:** if not loaded / Save-Data / cellular → the ceremonial-cobalt CSS gradient + LQIP; never blocks first paint.

## 7. Estimated credit cost
- Preflight (no job submitted): **2 credits per candidate** at 9:16 (same for 1k and 2k) on `nano_banana_pro`.
- Batch of **3 candidates → ~6 credits**. (Current balance: 559.29.)

## 8. Post-generation steps (only after approval)
1. Generate 3 candidates → display → you pick 1.
2. Verify text-safe upper third is dark/low-contrast; check white-text AA over it.
3. Compress to WebP ≤220 KB + JPEG fallback + LQIP; strip metadata; verify no watermark/reference likeness.
4. Stage to `03_assets/approved/asset-group-2/`, record in a Group 2 manifest, and open a separate `assets/group-2-*` PR.

---
**Do not generate until Yuriel says "Generate Asset Group 2."**
