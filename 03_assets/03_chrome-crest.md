# 03 — Chrome Crest Emblem Set

> **✅ DIRECTION APPROVED (2026-07-24): Direction B — "Threshold Arch."** Two mirrored chrome curves meeting at an apex with a central stem: crossing into action, not earning a rank. Abstract, calm, ceremonial, non-game-like. See §Threshold Arch SVG below for the locked layer spec, and [07_asset-group-1-approved-manifest.md](07_asset-group-1-approved-manifest.md) for provenance. The per-level generation prompts further down are retained for optional hero-size *texture* exploration only — the emblem itself is the authored SVG.

The streak identity. A calm, premium abstract emblem (no literal shield) that gains **botanical + cobalt + prismatic** detail as sessions-kept grow. **No swords, no shields, no fire, no crowns, no badges, no game iconography.**

---

## Threshold Arch — locked layered SVG specification (production emblem)

Authored in-repo as one SVG with **7 cumulative layers**; crest level = how many layers are visible. Silhouette constant; levels only add. `viewBox="0 0 64 64"`, stroke-based (no fills except inlay/buds), `stroke-linecap="round"`, min stroke 1.5 units so levels 1–4 stay legible at 24px.

| # | Layer (level) | Geometry (reference paths — Kimi may refine curves, not structure) | Paint |
|---|---|---|---|
| L0 | **Unmarked** — faint central stem | `M32 16 V50` | `--aur-steel-400`, stroke 1.5, opacity .45 |
| L1 | **First Mark** — closed silver arch | `M18 50 C18 28 24 15 32 12 C40 15 46 28 46 50` + baseline `M18 50 H46` | `--aur-silver-200`, stroke 2 |
| L2 | **Polished Mark** — reflective chrome edge | Partial inner highlight along upper-left arc: `M21 40 C21 27 26 17 32 14` | `--aur-chrome-50`, stroke 1.5, opacity .9 |
| L3 | **Silver Crest** — restrained inner geometry | Inner arch echo `M23 50 C23 32 27 21 32 18 C37 21 41 32 41 50` | `--aur-silver-200`, stroke 1.5, opacity .8 |
| L4 | **Cobalt Crest** — thin cobalt channel | Inlay path centered between L1 and L3: `M20.5 50 C20.5 30 25.5 18 32 15 C38.5 18 43.5 30 43.5 50` | `--aur-cobalt-500`, stroke 1.25 |
| L5 | **Prismatic Crest** — one controlled edge-light | Re-stroke of L1's **right arc only**: `M32 12 C40 15 46 28 46 50` | `--aur-prism` linearGradient, stroke 1.25, opacity .85 — never both sides, never a fill |
| L6 | **Ascendant Crest** — botanical buds from the stem | Two micro-sprigs off the stem: `M32 40 C29 38 27.5 36.5 27 34.5` + bud circle r1.6 at (26.6,33.8); `M32 34 C34.5 32.5 36 30.8 36.4 28.8` + bud r1.6 at (36.8,28) | sprigs `--aur-silver-200` stroke 1.25; buds fill `--aur-cobalt-300` |

Rules: level-up = reveal next layer (crossfade; sweep TX-4 across on milestone). Reduced-motion = static swap. Export sizes 24/48 inline, 256 card, 1024 hero (same SVG, scaled). Colors via CSS custom properties so themes/tokens control paint — nothing hardcoded.

**Structure is authored as layered SVG in-repo** (see `02_strategy/05` §5) so levels are crisp and code-controlled. The briefs below are for **optional generated texture/backplate overlays** and for **Fable concept exploration** of the 7 states. Generated art decorates the SVG; it is never the sole source.

Reference universal rules in `00_asset-strategy.md`.

---

## ⚠️ SUPERSEDED SECTION (pre-approval exploration — kept for history only)
Everything below predates the Direction B approval and still describes a **shield** silhouette. It must **not** be used for generation or implementation. The locked levels are: Unmarked = faint central stem only · First Mark = closed silver arch · Polished Mark = cleaner reflective chrome edge · Silver Crest = complete arch + restrained inner geometry · Cobalt Crest = thin cobalt channel/inlay · Prismatic Crest = one controlled prismatic edge-light · Ascendant Crest = minimal botanical buds/filigree grown from the central stem. Any future hero-size texture prompts must be rewritten around the **Threshold Arch** and follow the Reference Selection Rule (00 §1a: chrome/cobalt/prismatic refs — M4, M8, sparing M6 material cues; no meadow/horse/action refs unless they genuinely improve a subtle material or color decision).

## Shared crest rules (superseded)
- One recognizable silhouette across all 7 levels; growth is **additive and subtle**.
- Material progression: faint outline → etched silver → polished chrome → full silver crest → cobalt enamel inlay → thin prismatic edge → botanical filigree + soft bloom.
- Prismatic appears **only** from Prismatic Crest (level 6) as a thin edge accent.
- Botanical = original wildflower/leaf filigree (echoes the meadow), never weapons or real heraldry.

---

## CR-0 — Unmarked  ·  ESSENTIAL (concept + optional texture)
- **Screen:** Today header (24px), Proof card, empty-streak state.
- **Aspect ratio:** 1:1, generate 1024×1024.
- **Safe area:** emblem centered within 80% with padding.
- **Prompt:** *A faint engraved abstract shield/crest silhouette in dim brushed steel, barely visible, cool cobalt-black background, no ornament, no detail inside, matte, film grain, textless, minimalist, sacred-calm.*
- **Negatives:** no sword/weapon/fire, no letters/numbers, no real coat-of-arms, no bright color, no logo/watermark.
- **Format/compression:** SVG (authored) + optional PNG texture ≤ 30 KB.
- **Mobile fallback:** SVG only.
- **Essential/optional:** ESSENTIAL state; texture OPTIONAL.

## CR-1 — First Mark (1–2)  ·  ESSENTIAL state
- **Prompt:** *The same abstract crest silhouette with a single clean silver etched notch appearing, otherwise plain brushed steel, cobalt-black background, restrained, film grain, textless.*
- Adds: one engraved line. Negatives/format/fallback as CR-0.

## CR-2 — Polished Mark (3–6)  ·  ESSENTIAL state
- **Prompt:** *The abstract crest buffed to bright polished chrome with a soft inset highlight and subtle cobalt reflection, clean, premium, cobalt-black background, film grain, textless.*
- Adds: reflectivity/shine.

## CR-3 — Silver Crest (7–13)  ·  ESSENTIAL state
- **Prompt:** *A fully defined silver crest form with a crisp bevel and gentle chrome sheen, elegant and complete, faint silver bloom behind, cobalt-black background, film grain, textless.*
- Adds: complete shield form + bevel.

## CR-4 — Cobalt Crest (14–29)  ·  ESSENTIAL state
- **Prompt:** *The silver crest with deep cobalt enamel inlay filling its interior facets, jewel-like but restrained, polished chrome frame, soft glow, cobalt-black background, film grain, textless.*
- Adds: cobalt color inlay.

## CR-5 — Prismatic Crest (30–59)  ·  ESSENTIAL state
- **Prompt:** *The cobalt-and-silver crest with a very thin, restrained spectrum of refracted light running along its outer edges only, like light on polished chrome, low saturation, elegant, cobalt-black background, soft bloom, film grain, textless.*
- Adds: thin prismatic **edge** light (not fill).
- Extra negative: no full rainbow, no neon, keep spectrum to the edge.

## CR-6 — Ascendant Crest (60+)  ·  ESSENTIAL state (hero)
- **Prompt:** *The prismatic silver-cobalt crest wreathed in delicate original wildflower-and-leaf filigree, a soft prismatic bloom radiating gently outward, sacred and premium, ceremonial calm, cobalt-black background, film grain, textless.*
- Adds: botanical filigree + soft prismatic bloom.
- Extra negative: no real heraldic wreath, no roses copied from references, no thorns.

---

## Sizes to export (each level)
- **Inline** 48×48 (Today header) · **Card** 256×256 (Proof) · **Hero** 1024×1024 (level-up + Ascendant celebration).
- SVG scales for the first two; hero may layer an optional generated bloom/filigree texture behind the SVG.

## Completion & level-up motion (asset-relevant)
- **Completion moment** (every qualifying session): 450–650ms — silver edge-light → one botanical/cobalt detail resolves → one restrained prismatic glint (uses TX-4). Persist-to-DB first, then animate.
- **Level-up** (crossing a tier): ~900ms single prismatic sweep + gentle scale settle.
- **Reduced-motion:** crossfade/static swap to the new level, no sweep.

## QA
Reject any crest reading as a badge/medal/game-rank, containing a weapon, using fire, baking in numbers/letters, or showing a full-frame rainbow. The silhouette must stay identical across levels so progression feels like the *same* crest maturing.
