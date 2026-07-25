# Asset Group 6 — Chrome Crest Render Kit (STRATEGY — awaiting approval, NOT generated)

Goal: give the seven Threshold Arch levels **real polished chrome-material presence** in the Proof/streak system, without replacing the approved SVG geometry, state logic, accessibility, or small-size rendering.

Locked constraints: exact Threshold Arch silhouette + additive 7-level progression (`03_assets/03`); the **authored SVG remains the source of truth** for geometry/state/a11y/small sizes; no shield/crown/sword/badge/gate/game-icon/text/watermark; one coherent family (not seven unrelated designs); any generated art original + consistent across all seven.

---

## Two options assessed

### Option A — Seven generated art renders (one per level)
Generate 7 transparent/black-bg chrome crest renders (Unmarked → Ascendant).
- **Pros:** each level can be richly painterly.
- **Cons (significant):** generative models **drift** — holding the *exact same silhouette* and *strictly additive* progression across 7 separate generations is unreliable; lighting/material consistency across 7 renders is hard; likely many regenerations; **~14–49 credits** (7 images × 1 candidate, more with retries); larger asset weight; the art can diverge from the code SVG geometry, breaking the "same object maturing" feel and the a11y parity.

### Option B — One chrome-material texture + code/SVG compositing  ★ RECOMMENDED
Keep the authored Threshold Arch SVG as geometry/state/a11y. Composite a **single premium chrome-material** into it per level via SVG mask/fill, layering the already-approved cobalt tokens + prismatic glint (TX-4) + bloom (TX-2):
- L0–L3 use silver/chrome material + edge-light; L4 adds cobalt-channel fill; L5 adds the restrained prismatic edge (approved glint / `--aur-prism`); L6 adds botanical buds + soft bloom (TX-2).
- **Pros:** perfect consistency (one geometry, one material) → the *same crest maturing*; the locked additive progression is **code-guaranteed**; tiny weight (1 texture + SVG); **a11y + small-size fallback preserved by construction**; on-brand (real chrome); cheap.
- **Cons:** less hand-painted than bespoke art — but more premium, consistent, and controllable, which matters more here.

## Recommendation: **Option B**, code-first.
1. **First try 0 credits:** build the chrome material as a CSS/SVG treatment (layered silver linear/conic gradients + specular highlight + the existing grain/bloom/glint) masked to the Threshold Arch. This may already read as premium chrome.
2. **If not premium enough, generate exactly ONE** seamless **liquid-chrome sheen material** tile (square, on black, screen-blend) and mask it into the SVG for all seven levels.

**Predicted credits: 0–2.** (0 if the CSS/SVG chrome treatment suffices; ~2 for one Nano Banana Pro chrome-sheen texture if needed — Nano Banana Pro is ideal for a soft abstract material tile.) No 7× generation, no per-level art.

### If Option B is approved, the one texture prompt (only if the 0-credit path is insufficient)
> A seamless square tile of soft liquid-silver chrome sheen: brushed-and-polished reflective metal with gentle cool cobalt reflections and a soft anisotropic highlight sweeping across, smooth and premium, on pure black for screen-blend compositing, no seams, abstract material only. No object, no shape, no text, no logo, no watermark, no rainbow.

- Model: **Nano Banana Pro** (2k) — best for a clean soft material tile. Export ≤30 KB WebP.
- The SVG stays the accessible fallback; the texture is an optional enhancement layer (Save-Data → CSS chrome fallback).

**Do not generate until you approve Option B and the 0-credit-first approach.**
