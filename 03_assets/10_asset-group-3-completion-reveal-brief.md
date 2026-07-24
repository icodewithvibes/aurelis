# Asset Group 3 — Completion Reveal Visual Kit (PREPARED, NOT GENERATED)

> **STATUS: brief only. No image generated. Awaiting approval before any generation.** This defines the 450–650ms "Proof recorded" moment after an **intentional** session completion (the "Record proof / Complete session" confirm → persist to IndexedDB → *then* this reveal). Ref: `02_strategy/05` §5 (LOCKED completion moment), `02_strategy/01` §5, `02_strategy/04` §Completion, `03_assets/03` §Threshold Arch SVG (approved in PR #2).

## 0. Intent
**Feels like:** a private vow / ceremonial threshold crossed · chrome becoming alive for one second · cobalt night with subtle botanical emergence and one restrained prismatic refraction · calm conviction.
**Never:** XP / coins / level-up-fanfare / achievement-unlocked · fire / explosions / particles / confetti / neon / fantasy HUD / combat / sword / crown / shield / loot / casino · a full-screen cinematic that blocks the user from continuing.

Core object = the **approved Threshold Arch SVG** (`03_assets/03` §Threshold Arch — viewBox `0 0 64 64`, layers L0 stem → L6 buds, token-painted). This is a **completion** reveal (fires every qualifying session at the crest's *current* level); it is **not** the tier level-up flourish (~900ms, separate, `02_strategy/05` §5).

---

## 1. Composition (layers, back → front)
1. **(Optional) distant atmosphere** — approved meadow backplate `aur_backplate_meadow-bluehour_v1@1080x1910.webp` at very low opacity (≤0.12), heavily darkened, **never a required dependency**; omit on Save-Data or if absent. Fallback: flat `--aur-night`.
2. **Cobalt stage** — radial `--aur-night → --aur-cobalt-900` behind the crest (CSS).
3. **Soft bloom** — approved `aur_texture_bloom_v1@1024x1024.webp`, `mix-blend-mode: screen`, animated opacity/scale only.
4. **Threshold Arch crest** — authored SVG, current level; the animated subject.
5. **Prismatic refraction** — a single hairline of `--aur-prism` (or approved `aur_texture_glint_v1@1024x128.webp`) **masked to the arch's right arc**, one pass.
6. **Film grain** — approved `aur_texture_grain_v1@128x128.png`, static tile, `overlay` 0.04–0.06.
7. **Result line** — text "Proof recorded — N session(s) kept." (`--font-display`/`--font-ui`, `--aur-ink`).

Presented as an **inline, non-blocking** overlay on the completion/Proof surface — not full-screen, dismissible/skippable at any moment.

---

## 2. Exact timeline (total 650ms; easing `--ease-ceremonial` = cubic-bezier(0.16,1,0.30,1))
All motion is **transform + opacity only**. Fires **after** the IndexedDB write resolves.

| t | Phase | Crest / edge-light | Botanical + cobalt | Bloom | Prismatic | Result line |
|---|---|---|---|---|---|---|
| **0ms** | Trigger / breath-in | overlay opacity 0→; crest scale 0.96; silver edge-light begins tracing arch stroke from the apex (`stroke-dashoffset` reveal) | at rest | opacity ~0 | none | hidden |
| **120ms** | Chrome waking | edge-light ~60% down both legs; crest scale→1.0 | — | rising ~0.15 | none | hidden |
| **250ms** | **Peak — "chrome alive"** | full arch outline lit, settles to chrome sheen | one detail resolves: single L6 bud (or L4 cobalt channel) fades+scales 0.8→1 from the stem base | **peak ~0.22** | none | begins fade/rise (opacity 0→, y+4→0) |
| **450ms** | Refraction settle | chrome holds | botanical detail holds | easing down ~0.12 | **single hairline `--aur-prism` pass completes across the right arc (250→450ms) and fades** | fully visible |
| **650ms** | **Resolved / at rest** | edge-light dims to normal chrome; no motion | botanical detail persists | resting glow ~0.08 | gone | visible; Done/continue affordance active |

- The one prismatic refraction is clipped to the arch stroke (SVG `mask`/`clipPath`) so it reads as light **on** the chrome, never a floating rainbow. Right arc only (matches crest L5 rule).
- **Non-blocking / skippable:** the surface is interactive throughout; a tap or the Done control jumps immediately to the 650ms rest state. It does **not** auto-dismiss — the user leaves when ready.
- **Do not** loop, replay, or add any element after 650ms.

---

## 3. Reduced-motion static equivalent (`prefers-reduced-motion` OR in-app `reducedMotion`)
No trace, no sweep, no scale, no bloom pulse. **Render the end state immediately:**
- Threshold Arch crest at final level (botanical/cobalt detail already present).
- A **static** soft bloom behind it (single opacity, ~0.10).
- A **static** thin prismatic accent rendered in place on the right arc (no motion).
- Result line "Proof recorded — N session(s) kept." shown at once, announced via `aria-live="polite"`.
- Same Done/continue affordance. Grain static as normal.

---

## 4. Code-vs-asset map

### Kimi builds with SVG / CSS / Framer Motion (no imagery) — the majority
- **Threshold Arch crest** — authored SVG (`03_assets/03` §Threshold Arch).
- **Silver edge-light trace** — SVG `stroke-dashoffset` reveal (or masked linear-gradient sweep) along the arch stroke; `--aur-silver-200`/`--aur-chrome-50`.
- **Botanical/cobalt resolve** — animate opacity/scale of the L6 bud / L4 cobalt-channel SVG layers (Framer variants).
- **Prismatic refraction pass** — **preferred: pure code** — `--aur-prism` gradient masked to a hairline on the right arc, translated once via CSS transform. (Approved `aur_texture_glint_v1` is an acceptable drop-in alternative if a photographic refraction is wanted.)
- **Cobalt stage, overlay, scrim, non-blocking/skip logic, result line, reduced-motion branch, haptic gate** — all code.

### Approved assets reused as-is (no new generation)
- `aur_texture_bloom_v1@1024x1024.webp` — bloom layer (screen blend; animated by transform/opacity).
- `aur_texture_grain_v1@128x128.png` — static grain overlay.
- `aur_texture_glint_v1@1024x128.webp` — optional prismatic pass source (if not using the CSS `--aur-prism` path).
- `aur_backplate_meadow-bluehour_v1@1080x1910.webp` — **optional** distant atmosphere only; never required.

---

## 5. New generated asset — is one genuinely needed?
**No.** The entire Completion Reveal Kit is buildable from the **approved asset library + SVG/CSS/Framer Motion**. Recommended path spends **0 credits**.

### Optional (NOT recommended for V1) — one narrowly-scoped candidate, only if you want extra peak polish
A single pre-baked **"chrome caustic bloom-burst" sprite** for the 250ms peak — a soft silver caustic flare that reads as chrome briefly catching light behind the arch. Rationale to **skip**: the approved TX-2 bloom + the SVG edge-light already deliver "chrome alive"; adding a sprite risks tipping toward "reward flash." Provided only so you have the option.
- **If approved:** 1 image, square 1:1, on black (screen-blend), ≤30 KB WebP after compression.

---

## 6. Reference-selection plan (only if §5 optional asset is approved)
Per `00_asset-strategy` §1a, select **2** private references:
- **`M4_chrome-knight-meadow-prism.jpg`** → borrow: chrome caustic sparkle, cobalt-shadow light, restrained prismatic refraction on metal. Not the knight/armor/pose.
- **`M2_garden-bokeh-bubbles-bloom.jpg`** → borrow: soft gauzy bloom + diffusion falloff. Not the bubbles/composition.
Uploaded as **style guidance only**; output is an original abstract light sprite, textless. `01_references/` never committed or shipped.

### Proposed generation prompt (only if approved)
> A soft abstract burst of silver-white chrome caustic light on pure black, gentle cobalt-tinted falloff, one very restrained thread of prismatic refraction low in the glow, diffuse and premium, no hard edges, screen-blend compositing, centered, textless. No lens-flare streaks, no full rainbow, no neon, no star shape, no rays, no particles, no confetti, no text, no watermark, no logo.

- **Model:** Nano Banana Pro (2 credits) is sufficient for a soft on-black sprite; GPT Image 2 only if a richer caustic is wanted.
- **Estimated credits:** **~2** (Nano Banana Pro, 1 image) — or 0 if you take the recommended no-generation path.

---

## 7. Performance & accessibility (iPhone)
- **Transform + opacity only.** No layout thrash, no animated `backdrop-filter`, no canvas, no per-frame JS. SVG `stroke-dashoffset` + CSS transforms are GPU-cheap.
- Single run ≤650ms then fully static; `will-change` applied only during the run and removed after.
- **Persist first:** IndexedDB write completes before the reveal starts (never gate the DB on animation).
- **Non-blocking:** pointer events stay live; tap/Done jumps to rest; move focus to the result line/Done; announce the result via `aria-live="polite"` (announce text, not motion).
- **Reduced-motion / reducedMotion** → §3 static branch. **Save-Data / cellular** → drop the optional backplate; keep bloom/grain (tiny).
- **Contrast:** result line `--aur-ink` on cobalt (AA+).
- **No audio.** Optional single subtle `navigator.vibrate(8)` at the 250ms peak — capability-gated, non-essential, off under reduced-motion.
- **Added weight** (backplate excluded): grain 25 KB + bloom 17 KB + glint 4 KB ≈ **46 KB**, all cached; the CSS-`--aur-prism` path drops the glint to ~42 KB.

## 8. Compliance
No XP/coins/level-up-fanfare/achievement/loot/casino; no fire/particles/confetti/neon/HUD/sword/crown/shield/combat; no full-screen blocker; no text baked into any asset; no reference likeness; core app correct if every image layer is absent (crest SVG + tokens alone still deliver the moment).
