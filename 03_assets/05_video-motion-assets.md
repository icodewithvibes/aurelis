# 05 — Video & Motion Assets

Ambient looping video for a future landing/brand moment and optional in-app ambience. **All OPTIONAL for V1** — the app must be complete and beautiful with zero video. Video is heavy on iPhone and on GitHub Pages bandwidth, so every clip has a strict budget and an image fallback.

Reference universal rules in `00_asset-strategy.md`. Higgsfield generates originals; nothing imitates the MotionSites background clips or their crop/fade tricks.

---

## VID-1 — Landing / Brand Ambient Loop  ·  OPTIONAL (future "share with friends" page)
- **Intended screen:** a standalone landing/brand page (not the daily app).
- **Aspect ratio:** 9:16 portrait master (1080×1920); also export 16:9 (1920×1080) for desktop.
- **Safe text area:** center-lower kept dark/low-motion for a headline; keep motion in the upper/background.
- **Original-generation prompt:**
  > A slow cinematic cobalt-night meadow breathing gently in a light breeze, pale wildflowers swaying softly, faint silver dawn-glow blooming and receding, a whisper of restrained prismatic light drifting across the upper frame, drifting mist and film grain, meditative and sacred, seamless loopable motion, no camera cuts, very slow, textless.
- **Motion character:** slow, weighted, ceremonial; loops seamlessly; no hard cuts.
- **Negative constraints:** universal; no people, no fast motion, no zoom/whip, no lens-flare streaks, no rainbow wash, no on-screen text, no combat/energy.
- **Duration/spec:** 6–10s seamless loop, 24–30fps.
- **File format / compression:** **MP4 (H.264)** + **WebM (VP9)**; target **≤ 2.5 MB** portrait (aggressively compressed); muted, `playsInline`, `loop`. Provide a **poster** (WebP/JPEG ≤ 200 KB, = first frame).
- **Mobile fallback:** on iPhone / reduced-data / reduced-motion, show the **poster image only** (BP-style still); do not autoplay heavy video on cellular. Respect `prefers-reduced-motion` and the Save-Data hint.
- **Essential / optional:** OPTIONAL.

## VID-2 — In-App Ambient Micro-Loop  ·  OPTIONAL
- **Intended screen:** subtle background life behind Today/Proof (very low priority).
- **Aspect ratio:** 9:19.5 portrait, 1170×2532.
- **Original-generation prompt:**
  > An almost-still cobalt-night scene with the faintest drift of light bloom and a single slow prismatic shimmer, barely perceptible motion, film grain, seamless loop, deeply calm, textless.
- **Motion character:** near-static ambience; must never distract from logging.
- **Negative constraints:** universal; nothing that competes with UI or draws the eye during a set.
- **Duration/spec:** 4–8s loop.
- **File format / compression:** MP4 + WebM; **≤ 1.5 MB**; poster required.
- **Mobile fallback:** static backplate (BP-1/BP-3). **Default off** in the daily app to protect battery; opt-in only.
- **Essential / optional:** OPTIONAL (recommend deferring past V1).

## VID-3 — Crest Level-Up Flourish (pre-rendered)  ·  OPTIONAL
- **Intended screen:** the ~900ms level-up celebration (an alternative to the SVG+CSS animation).
- **Aspect ratio:** 1:1, 1080×1080, **transparent** if possible (alpha video) else on cobalt.
- **Original-generation prompt:**
  > A single restrained prismatic light sweep passing once across a polished silver-cobalt crest, a gentle silver bloom, one botanical detail resolving, calm and premium, no particles, seamless, short, textless.
- **Motion character:** one clean sweep + settle; ceremonial, restrained.
- **Negative constraints:** universal; no confetti/particles/sparks/XP, no rainbow fill, no fireworks.
- **Duration/spec:** ~0.9s, 30–60fps.
- **File format / compression:** WebM (VP9 alpha) + MP4 fallback; **≤ 600 KB**; or **prefer the code-driven SVG/CSS version** (0 KB) — this video is only if the coded version can't hit the desired polish.
- **Mobile fallback:** the SVG/CSS crest animation (the default anyway); reduced-motion → static swap.
- **Essential / optional:** OPTIONAL (SVG/CSS is the primary; this is a backup).

---

### Global video rules
- **Never autoplay video with sound.** All muted, `playsInline`, `loop`.
- **Never gate a feature on video.** Every clip has an image fallback; the daily app defaults to stills for battery/data.
- **Honor** `prefers-reduced-motion` and `Save-Data` → serve poster only.
- **Budget discipline:** total video weight on any single page ≤ ~3 MB; generate at 2× then compress hard; two-codec delivery (WebM first, MP4 fallback).
- Keep video **out of the core V1 logger flow** entirely.
