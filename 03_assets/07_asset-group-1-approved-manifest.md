# Asset Group 1 — APPROVED Manifest (2026-07-24)

Approved by Yuriel. Scope: Chrome Crest direction + essential texture kit. Generated with Higgsfield **Nano Banana Pro** (backend model id `nano_banana_2`, 1k resolution) in the private workspace `53fac193-c1f9-4769-8b35-8ad247aff80e`. **Credits spent: 10** (5 billed generations × 2; two failed grain jobs not billed).

Generated files currently live in the Higgsfield library (CDN URLs below) — move them into the **"AURELIS assets"** project folder in the Higgsfield UI (the API cannot target folders). Local staging for finals: `03_assets/approved/asset-group-1/`.

---

## 1. Chrome Crest — Direction B "Threshold Arch" ✅ APPROVED

**Meaning:** crossing into action, not earning a rank. Abstract, calm, ceremonial, non-game-like.
**Production form:** layered, code-controlled **SVG authored in-repo** (spec locked in [03_chrome-crest.md](03_chrome-crest.md) §Threshold Arch SVG). The three generated images are **direction-picking concepts only** — never shipped as the emblem.

| Concept | Job ID | Status | CDN (private, provenance) |
|---|---|---|---|
| A — Facet Mark | `b0149256-c9e7-4276-93ae-06480b16c4ad` | archived (not selected) | `hf_20260724_041829_b0149256….png` |
| **B — Threshold Arch** | `19c17703-40ee-4be3-9207-fc7f27813417` | **APPROVED direction** | `hf_20260724_041833_19c17703….png` |
| C — Engraved Seal | `7fa9b09c-0dc2-4794-b594-9ed374e045c7` | archived (not selected) | `hf_20260724_041837_7fa9b09c….png` |

**Locked 7-level progression** (cumulative layers, silhouette constant):
Unmarked = faint central stem only → First Mark = closed silver arch → Polished Mark = cleaner reflective chrome edge → Silver Crest = complete arch + restrained inner geometry → Cobalt Crest = thin cobalt channel/inlay → Prismatic Crest = one controlled prismatic edge-light → Ascendant Crest = minimal botanical buds/filigree grown from the central stem.

**Hard requirements:** recognizable at 24px (esp. levels 1–4); no literal gate, shield, sword, crown, badge, fire, HUD, game-reward icon, or copied symbol; geometry simple enough for Kimi to implement directly.

## 2. TX-1 Film Grain ✅ APPROVED — procedural (not generated)

| Field | Value |
|---|---|
| Final filename | `aur_texture_grain_v1@128x128.png` |
| Dimensions / size | 128×128 px · 25.3 KB (≤40 KB budget ✓) |
| Provenance | **Procedurally synthesized locally** (approx-gaussian mono noise, **fixed seed `20260724`** — fully deterministic/reproducible). Higgsfield failed twice on pure-noise prompts (jobs `08e1d014…`, `6455ce75…`, unbilled); no further credits may be spent on grain. |
| Blend / use | Tiled full-bleed on dark surfaces; `mix-blend-mode: overlay`; opacity driven **only** by a `--grain-opacity` token (default 0.04–0.06). |
| Fallback | Omit entirely — purely decorative; app correct without it. |
| Location | `03_assets/approved/asset-group-1/aur_texture_grain_v1@128x128.png` |

## 3. TX-2 Bloom ✅ APPROVED as-is

| Field | Value |
|---|---|
| Final filename | `aur_texture_bloom_v1@1024x1024.webp` |
| Dimensions / size | 1024×1024 · **16.8 KB** (WebP q90; ≤30 KB budget ✓); scale in CSS |
| Provenance | Job `415fbee7-4fe4-4174-a6b4-486ce0050e94` · downloaded from own CDN `hf_20260724_041842_415fbee7-4fe4-4174-a6b4-486ce0050e94.png` (src 801 KB, sha256 `1f785c09e7091e37…`) · re-encoded PNG→WebP RGB, no EXIF/metadata. Text-only prompt (recorded in job). |
| Location | `03_assets/approved/asset-group-1/aur_texture_bloom_v1@1024x1024.webp` |
| Blend / use | On-black master composited with `mix-blend-mode: screen` (no alpha cutting needed). **Low-opacity optional overlay in nonessential visual zones only — never beneath key workout inputs, controls, or dense text.** Positioned/scaled/faded via transform+opacity; never a live filter. |
| Fallback | CSS `radial-gradient` approximation. |

## 4. TX-4 Prismatic Glint ✅ APPROVED with production adjustments

| Field | Value |
|---|---|
| Final filename | `aur_texture_glint_v1@1024x128.webp` |
| Dimensions / size | 1024×128 · **4.1 KB** (WebP q90; ≤24 KB budget ✓) |
| Processing (as approved) | Generated 1584×672 → centered horizontal band crop `1584×198` (8:1) → resized `1024×128` (Lanczos) → **saturation ×0.70** (chrome-light refraction, no rainbow-branding look) → WebP. No EXIF/metadata. |
| Provenance | Job `97a558d3-558f-4cc2-873c-54f8ab275702` · downloaded from own CDN `hf_20260724_041844_97a558d3-558f-4cc2-873c-54f8ab275702.png` (src 691 KB, sha256 `1dfbf4a60a162fc8…`) |
| Location | `03_assets/approved/asset-group-1/aur_texture_glint_v1@1024x128.webp` |
| Blend / use | `mix-blend-mode: screen`; animated by **transform translate only** across the crest/edge. **Reserved exclusively for the 450–650ms completion moment and rare Chrome Crest milestones** — never ambient, never decorative elsewhere. |
| Reduced-motion fallback | **Static**: no sweep; crest shows its new state via crossfade/static swap with the result line. |
| CSS fallback | `--aur-prism` gradient masked to a thin line. |

## 5. TX-3 Cobalt Scrim — no asset (by design)
Pure CSS gradient (0 KB) per [02_texture-kit.md](02_texture-kit.md). Nothing generated; nothing to approve.

---

## Reference-derived principles used (Group 1)
Group 1 was generated **text-only** (no reference images fed to the model). Abstract qualities were drawn from the reference *analysis* (02_strategy reference table), not the files: restrained prismatic edge-light and halftone-era calm (M8), chrome-with-caustics material world (M4), soft bloom/diffusion (M2), cobalt-night ground (M1/M5/M6). Future groups follow the **Reference Selection Rule** in [00_asset-strategy.md](00_asset-strategy.md) §1a — select 1–3 relevant references per asset, state the selection and borrowed qualities, generate original.

## Compliance
- No swords/shields/fire/crowns/XP/coins/HUD/badges/combat/logos/watermarks in any accepted output.
- No Pinterest/MotionSites reproduction; `01_references/` remains local-only and git-ignored.
- All assets optional enhancement — the core app UI is complete with none loaded.
- Not merged to git; no repo/Pages/Kimi/video/hero work performed in this group.
