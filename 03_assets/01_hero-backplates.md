# 01 — Hero & Screen Backplates

Full-bleed background imagery that sits **behind** UI on the core screens. Must be dark/quiet enough for white text and forged-glass cards, with a calm focal area and generous negative space. Always textless. Prismatic stays a thin edge accent.

Reference the universal rules in `00_asset-strategy.md` (palette, hard negatives, conventions).

---

## BP-1 — Today / App Ambient Backplate  ·  ESSENTIAL
- **Intended screen:** Today (home) and default app background.
- **Aspect ratio:** 9:19.5 portrait · generate 1170×2532 (2× of layout), ship ~1170-wide.
- **Safe text area:** center + lower third must stay low-detail and dark (UI cards + CTA live here). Keep the focal glow in the **upper 40%**.
- **Original-generation prompt:**
  > A serene cobalt-blue midnight meadow at the edge of dawn, wide open sky deepening to near-black at the bottom, faint silver light blooming softly in the upper sky, a few small out-of-focus white and pale-blue wildflowers along the lower edge, gentle mist, restrained thin prismatic light-refraction near the top horizon only, analog 35mm film grain, soft bloom, cinematic lens diffusion, quiet sacred calm, luxury editorial wellness photography, deep negative space, no subject in center, textless.
- **Negative constraints:** no swords/weapons/combat/fire/game UI/HUD, no people/faces, no logos/watermarks/text, no full-frame rainbow, no bright saturated colors, no busy foreground, nothing in the center-lower area.
- **File format / compression:** WebP (AVIF optional) + JPEG fallback; target **≤ 220 KB** at ship width. sRGB.
- **Mobile fallback:** if not loaded, flat `--aur-night`→`--aur-cobalt-900` CSS gradient. Provide a **blurred 24px LQIP** (~2 KB) for progressive load.
- **Essential / optional:** ESSENTIAL (one variant minimum).

## BP-2 — Forge Backplate  ·  ESSENTIAL
- **Intended screen:** Forge (resistance → one action).
- **Aspect ratio:** 9:19.5 portrait, 1170×2532.
- **Safe text area:** center vertical column reserved for the ack/reframe/action cards — keep it dark and unbusy.
- **Original-generation prompt:**
  > A very dark cobalt void softening into a distant calm horizon, a single faint silver dawn-glow low and far, sparse floating dust and soft bloom, a whisper of chrome reflection at the frame edges, extremely restrained prismatic glint in one corner, analog film grain, meditative stillness, quiet resolve, deep space for text, textless, cinematic wellness aesthetic.
- **Negative constraints:** as universal; especially no energy/lightning/action, nothing that feels urgent or dramatic (Forge must feel calm, including in safety mode).
- **File format / compression:** WebP + JPEG; **≤ 180 KB**.
- **Mobile fallback:** flat cobalt gradient token; LQIP included.
- **Essential / optional:** ESSENTIAL.

## BP-3 — Proof / Crest Stage Backplate  ·  ESSENTIAL
- **Intended screen:** Proof (streak, Chrome Crest, timeline) and the completion-moment stage behind the crest.
- **Aspect ratio:** 9:19.5 portrait, 1170×2532. Also export a **1:1 crop (1080×1080)** for the crest card.
- **Safe text area:** upper-center holds the crest emblem; keep a soft radial darkening around center so the SVG crest reads cleanly on top; lower two-thirds dark for the timeline list.
- **Original-generation prompt:**
  > A ceremonial cobalt-night gradient with a soft central silver bloom like moonlight on chrome, faint botanical filigree of wildflowers dissolving into shadow at the edges, a single restrained prismatic ring of light diffusing outward very subtly, film grain, soft focus, sacred and premium, calm, deep negative space in the center for an emblem, textless.
- **Negative constraints:** universal; no literal shield/crest object (the crest is a separate SVG — this is only the stage), no swords, no fire, no game reward imagery.
- **File format / compression:** WebP + JPEG; **≤ 200 KB** portrait, **≤ 120 KB** square crop.
- **Mobile fallback:** radial cobalt gradient token behind the SVG crest.
- **Essential / optional:** ESSENTIAL.

## BP-4 — Meadow-Light / Recovery Backplate  ·  OPTIONAL
- **Intended screen:** recovery-day mood / Meadow-Light theme (Today + Proof when a recovery day is honored).
- **Aspect ratio:** 9:19.5 portrait, 1170×2532.
- **Safe text area:** center-lower kept soft and low-contrast; the mood is bright, so plan for **dark text** in this theme.
- **Original-generation prompt:**
  > A soft sunlit meadow morning, pale sky-blue and cream light, gentle golden backlight through tall grass and white-and-blue wildflowers, dreamy bloom and haze, a faint chrome shimmer catching the sun, extremely subtle prismatic sparkle on dew, analog film grain, calm restorative wellness photography, airy negative space, textless.
- **Negative constraints:** universal; keep it gentle and restorative, not energetic; no people/faces.
- **File format / compression:** WebP + JPEG; **≤ 240 KB**.
- **Mobile fallback:** cream `--aur` light-mood gradient.
- **Essential / optional:** OPTIONAL (ships only if Meadow-Light theme is enabled).

---

### Variants & QA
- Generate **2–3 candidates** per essential backplate; pick one, keep one alt.
- Verify: white text at body size meets AA over the reserved area; forged-glass card edges remain legible; no detail intrudes into the safe zone; grain visible but not noisy at 1×.
