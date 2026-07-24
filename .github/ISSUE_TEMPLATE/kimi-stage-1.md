---
name: "Kimi Stage 1 — App Shell"
about: "Frontend Stage 1: iPhone-first, local-first AURELIS app shell (no feature logic)"
title: "frontend-v1: Stage 1 app shell"
labels: ["frontend", "stage-1", "app-shell"]
assignees: []
---

## Goal
Build the AURELIS **app shell** per [`prompts/kimi-stage-1.md`](../../prompts/kimi-stage-1.md): navigation, Ceremonial Chrome design tokens, the Threshold Arch crest SVG, backplate/atmosphere layering, a static Today screen with **clearly labeled mock data**, and a Dexie **init/migration shell only**. **No feature logic.**

Acceptance: [`docs/kimi-stage-1-acceptance.md`](../../docs/kimi-stage-1-acceptance.md) (every box must pass).

## Required reading before any code
Read **every tracked file**, in the order listed in `prompts/kimi-stage-1.md` §1 (README → INDEX → 06 build brief → 01 product spec → 05 design system → 04 data model → 03 crest §Threshold Arch → 06/07/09/12 asset docs → 10 completion brief as future contract → context files).

## Branch & workflow
- [ ] Work only on `frontend-v1/stage-1-app-shell`, based on current `main` (report base SHA).
- [ ] Post a concise implementation plan + exact expected changed-file list **before editing**.
- [ ] Small, logically grouped commits; never commit to `main`.
- [ ] Run typecheck, lint, tests, and a production build before completion.
- [ ] Test at 390px mobile and a desktop viewport.
- [ ] Open a PR into `main`; **do not merge**.
- [ ] Stop and report any missing dependency, asset, version conflict, or ambiguity — do not improvise.

## In scope
- [ ] React + Vite + TS + Tailwind + Framer Motion + Zustand + Dexie shell + UUID + test setup + build/typecheck/lint/test scripts
- [ ] Bottom nav: Today, Train, Forge, Proof, Settings
- [ ] Static Today with labeled mock data; honest placeholders for Train/Forge/Proof/Settings
- [ ] Semantic Ceremonial Chrome tokens (color/type/spacing/radii/elevation/scrim/motion/chrome/cobalt/prismatic/grain)
- [ ] Threshold Arch layered SVG (7 levels, `viewBox 0 0 64 64`, token-painted)
- [ ] Group 1 grain/bloom/glint as optional enhancement; Group 2 meadow on Today only; Group 4 Forge night on Forge only
- [ ] Solid cobalt CSS fallback everywhere; Save-Data skip; LQIP; reduced-motion; safe-area; 44px; AA contrast; focus/keyboard; 390px no-overflow
- [ ] Dexie init/migration shell (no real feature persistence); documented mock-data boundary

## Out of scope (placeholders only)
Workout logger · sets/reps/RPE/rest/history/plans · ASF parser/import · real persistence · completion/streak/records/proof animation · Forge engine/safety/crisis UI · auth/accounts/sync/backend/API/AI/analytics/payments/notifications/secrets · Pages/deploy · new assets/video/WebGL/3D · rewriting approved docs.

## Definition of done
All acceptance boxes in `docs/kimi-stage-1-acceptance.md` pass; PR into `main` open and unmerged; final report delivered (changed files, commit hashes, commands, test/build results, known limitations, iPhone QA checklist).
