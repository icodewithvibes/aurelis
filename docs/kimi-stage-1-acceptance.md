# AURELIS — Kimi Stage 1 Acceptance Criteria

Objectively testable acceptance for the Stage 1 app shell. Every item must pass before the Stage 1 PR is considered complete. Pair with `prompts/kimi-stage-1.md`. Check each box with evidence (command output, screenshot, or file reference).

## A. Setup & toolchain
- [ ] `npm install` (or pnpm/yarn) completes with no errors.
- [ ] `npm run dev` starts the app; it loads with no console errors.
- [ ] `npm run typecheck` passes (0 TS errors).
- [ ] `npm run lint` passes (0 errors).
- [ ] `npm run test` passes (all tests green; at least smoke tests for the crest component, nav, and the mock-data seam).
- [ ] `npm run build` produces a production build with no errors.
- [ ] Scripts `dev`, `build`, `typecheck`, `lint`, `test` all exist in `package.json`.

## B. Navigation & routing
- [ ] Bottom navigation shows exactly five destinations: **Today, Train, Forge, Proof, Settings**.
- [ ] Each destination is reachable and renders its surface; active state is visible.
- [ ] Nav targets are ≥ 44×44px; reachable by keyboard (Tab/Enter) with visible focus.

## C. Today screen (mock data)
- [ ] Today renders with **clearly labeled mock data** (a comment/badge/`data-mock` marker indicates it is placeholder).
- [ ] Renders correctly at **390px** width — no horizontal overflow, no clipped text.
- [ ] Contains a resting Threshold Arch crest, a mock planned-day card, and a calm completion-bar placeholder — none wired to logic.
- [ ] Mock data flows through a single documented seam (`src/mocks/…`) consumed via a data-access layer; screens do not import mock objects directly in a way that would require rewriting to swap in Dexie.

## D. Placeholder surfaces
- [ ] Train, Forge, Proof, Settings each render a design-system-consistent placeholder that honestly signals "later stage" and does not fake completion.
- [ ] No workout controls, journal inputs, safety copy, streak numbers, or completion buttons are present as functional elements.

## E. Threshold Arch SVG
- [ ] A layered SVG crest component exists with a `level: 0..6` prop.
- [ ] All seven levels are demonstrable (e.g., a dev preview route/story) and match the documented additive progression (stem → arch → chrome edge → inner arch → cobalt channel → right-arc prismatic → stem buds).
- [ ] Colors come only from CSS custom properties (no hardcoded hex in the component).
- [ ] Legible at 24px; renders crisply at 24/48/256/1024.
- [ ] No level-up or completion animation is implemented (correctly deferred).

## F. Backplates & atmosphere
- [ ] Meadow backplate appears **only** on Today/onboarding surfaces.
- [ ] Forge night backplate appears **only** on Forge surfaces.
- [ ] Grain/bloom/glint are present only as optional enhancement layers (glint may be parked/unused).
- [ ] Each image-dependent surface has a **solid ceremonial-cobalt CSS fallback** that renders when the image is absent/disabled.
- [ ] With **all images disabled/blocked**, every surface remains readable and usable (verify by blocking image loads).
- [ ] No key UI (form fields, controls, journal, safety copy, primary buttons) sits over a visually busy part of an image; scrim applied where needed.

## G. Performance / progressive enhancement
- [ ] **Save-Data** on (`navigator.connection.saveData === true`, or a forced flag) → optional raster backplates are skipped; CSS fallback shows.
- [ ] LQIP/blur-up is used per manifests; no layout shift when the full image loads (dimensions reserved).
- [ ] No animated `backdrop-filter`, no runtime canvas grain, no per-frame JS visual loop, no WebGL/3D.

## H. Motion & reduced-motion
- [ ] `prefers-reduced-motion: reduce` (and the app `reducedMotion` seam) removes non-essential transitions; nothing depends on motion to function.
- [ ] Any Stage 1 motion is restrained (transform/opacity only) and uses the motion tokens.

## I. iPhone / responsive / a11y
- [ ] `viewport-fit=cover` set; safe-area padding via `env(safe-area-inset-*)` on the top bar and bottom nav (no content under the notch/home indicator).
- [ ] No visible horizontal overflow at 390px on any surface.
- [ ] All interactive targets ≥ 44×44px.
- [ ] Text/labels meet WCAG AA contrast over their backgrounds (including over reserved image zones).
- [ ] Visible keyboard focus on all interactive elements; logical tab order; nav operable by keyboard.
- [ ] Layout holds when the OS text size is increased (rem-based type scales; no clipping).

## J. Data layer (shell only)
- [ ] On boot, a Dexie/IndexedDB database is created with a version and the object stores/indexes from `04_data-model.md` defined.
- [ ] A no-op migration shell exists (upgrade path stubbed).
- [ ] **No real feature data is persisted** (no workouts, sessions, Forge entries, proof, streaks). Verify the DB has stores but no feature writes occur from UI.
- [ ] A typed `db` instance is exported for future stages.

## K. Privacy / scope guardrails
- [ ] No secrets, `.env` with real values, API keys, or tokens added; `.env.example` unchanged except documented placeholders.
- [ ] No backend, server, database server, auth, accounts, sync, remote IDs, API integration, AI provider, analytics, payments, or notifications added.
- [ ] No GitHub Pages / deployment / release configuration added.
- [ ] `01_references/**` is not referenced anywhere; `03_assets/candidates/**` not loaded by the app.
- [ ] No approved asset file or strategy/asset document was modified (originals in `03_assets/approved/**` unchanged).

## L. Process
- [ ] All work on branch `frontend-v1/stage-1-app-shell`, based on current `main` (base SHA reported).
- [ ] Commits are small and logically grouped; nothing committed to `main`.
- [ ] Tested at 390px mobile and a desktop viewport (evidence provided).
- [ ] A PR into `main` is open and **not merged**.
- [ ] Final report includes changed files, commit hashes, commands run, test/build output, known limitations, and a manual iPhone QA checklist.

**Stage 1 is accepted only when every box above is checked with evidence.**
