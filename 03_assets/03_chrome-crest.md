# 03 — Chrome Crest Emblem Set

The streak identity. A calm, premium **crest/shield** abstract emblem that gains **botanical + cobalt + prismatic** detail as sessions-kept grow. **No swords, no fire, no game iconography.**

**Structure is authored as layered SVG in-repo** (see `02_strategy/05` §5) so levels are crisp and code-controlled. The briefs below are for **optional generated texture/backplate overlays** and for **Fable concept exploration** of the 7 states. Generated art decorates the SVG; it is never the sole source.

Reference universal rules in `00_asset-strategy.md`.

---

## Shared crest rules
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
