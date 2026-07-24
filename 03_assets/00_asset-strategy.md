# 03_assets — Asset Strategy & Production Rules

Original visual production briefs for **Fable 5** (concepting) and **Higgsfield** (image/video generation). These are **briefs only** — no screens, no code. Every asset here is generated **original**; nothing traces, copies, or closely imitates the Pinterest/MotionSites references.

Art world = **Ceremonial Chrome** (see `02_strategy/05_design-system-ceremonial-chrome.md`): cobalt night, reflective chrome/silver, meadow & wildflower, film grain + soft bloom, **restrained** prismatic light. Quiet sacred resolve — equipped to execute. Luxury editorial wellness, not a game HUD, not military.

---

## 1. Universal generation rules (apply to EVERY brief unless overridden)
**Always:**
- Cobalt/midnight base palette; chrome/silver as the metal; meadow greens, wildflowers, blue sky, foliage, open space as the living world.
- Analog film grain, soft bloom, gentle lens diffusion; prismatic/chromatic light kept to thin edge accents (< ~5% of frame).
- Calm, still, ceremonial energy. Space for UI/text. Dark enough for white text to sit on top.

**Never (hard negatives — put in every prompt):**
- No swords, weapons, blades, combat, violence, aggression, battle poses.
- No fire, flames, embers, sparks, explosions, XP bars, coins, HUDs, game UI, confetti, particles-as-reward.
- No recognizable real armor designs, characters, mascots, franchises, logos, brand marks, watermarks, signatures, or captions.
- No text baked into the image (unless a brief explicitly asks; default = clean, textless).
- No copying the mood images (M1–M8) or MotionSites layouts — principles only.
- No gore, no distress imagery, no people in identifiable detail (faces abstract/obscured/absent).

## 2. Palette anchors (feed as hex to the generator)
`#070C18 night · #0B1430 / #10204A / #2A4FA8 cobalt · #F5F7FB / #D2D9E6 chrome · #4F7D4A meadow · #7FB4E6 sky · #E7C273 sun`. Prismatic = thin spectrum edge only.

## 3. Deliverable conventions (used by every brief)
- **Aspect ratios:** mobile portrait backplates `9:19.5` (iPhone), square emblems `1:1`, wide/hero `16:9` only if noted.
- **Generate large, ship small:** generate at 2× target, then compress to the stated budget.
- **Formats:** photographic backplates → **WebP** (AVIF optional) + JPEG fallback; flat/UI overlays (grain, glow) → **PNG/WebP** with alpha; emblem structure → **SVG** authored in-repo (generated art is optional texture only); video → **MP4 (H.264)** + **WebM (VP9)**, poster JPEG/WebP.
- **Naming:** `aur_<category>_<name>_<variant>@<w>x<h>.<ext>` e.g. `aur_backplate_today-night_v1@1170x2532.webp`.
- **Color/theme:** provide a dark (default) and, where noted, a Meadow-Light variant.

## 4. Essential vs optional (V1)
- **Essential:** app background/backplate for the core screens (01), the grain + cobalt-scrim texture kit (02), the Chrome Crest emblem set (03), the completion + key empty states (04), usage/perf rules (06).
- **Optional/nice-to-have:** hero landing video + ambient loops (05), extra backplate variants, Meadow-Light alternates.
Everything must degrade gracefully: if an optional asset is absent, the app still looks intentional on a flat cobalt token background.

## 5. Handoff order
Produce essentials first (02 texture kit + 03 crest + 01 primary backplate), because Kimi can build the whole app against those. Video (05) is last and optional for V1.

## 6. Review gate (before any asset is accepted)
Reject and regenerate if an asset contains: any weapon/fire/game element, baked text/watermark/logo, an identifiable face, a too-loud/full-frame prismatic wash, or anything that reads as a copy of a reference image. Confirm text-safe area and contrast for overlaid white type.
