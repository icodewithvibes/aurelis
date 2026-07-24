# AURELIS — Kimi K3 Stage 1 Implementation Handoff (App Shell)

You are **Kimi K3**, implementing **Stage 1 only** of AURELIS: a polished, **iPhone-first, local-first** frontend foundation that makes the approved Ceremonial Chrome visual system real. Stage 1 builds the **app shell** — navigation, design tokens, the Threshold Arch crest, backplate/atmosphere layering, a static Today screen with mock data, placeholder surfaces, and a Dexie initialization/migration shell. **It does not implement any feature logic.**

The existing strategy, privacy, safety, asset, parser, data-model, motion, and accessibility documents are **binding requirements**. Do not silently replace their architecture with your own.

---

## 0. Hard rules (read first — non-negotiable)
- **Local-first, no backend.** No server, database server, auth, accounts, cloud sync, remote IDs, conflict handling, API integration, AI provider, analytics, payments, notifications, or secrets. No network request that carries user data.
- **No secrets.** No `.env` with real values, no API keys/tokens. `.env.example` stays placeholders-only.
- **IP hygiene.** Do NOT copy the MotionSites reference CSS (esp. `.liquid-glass`), do NOT use Instrument Serif, do NOT reproduce any reference-image subject. Use the original AURELIS tokens and fonts (Fraunces / Inter / IBM Plex Mono, all SIL OFL, self-hosted).
- **Do not modify existing asset files** in `03_assets/approved/**` or any `02_strategy` / `03_assets` document. You may **copy** approved rasters into the app's asset dir (originals untouched).
- **Do not enable GitHub Pages, deploy, or release.**
- **Images are never required for usability.** Every image-dependent surface must have a solid CSS ceremonial-cobalt fallback and remain fully readable/usable with all images disabled.
- **Stage 1 is shell only** — see In-Scope / Out-of-Scope below. When something is out of scope, build a labeled placeholder, not a fake feature.

## 1. Required reading order (read every tracked file before changing code; this is the priority order)
1. `README.md` — orientation, privacy/git rules
2. `02_strategy/00_INDEX.md` — locked decisions
3. `02_strategy/06_kimi-build-brief.md` — architecture, structure, IP rules
4. `02_strategy/01_product-spec-v1.md` — screens/IA, NFRs, acceptance
5. `02_strategy/05_design-system-ceremonial-chrome.md` — **tokens, type, materials, motion, crest** (primary Stage 1 source)
6. `02_strategy/04_data-model.md` — Dexie schema (for the init/migration shell only)
7. `03_assets/03_chrome-crest.md` — **§Threshold Arch — locked layered SVG spec** (the crest you build)
8. `03_assets/06_asset-usage-and-performance.md` — naming, loading, budgets, degradation, a11y
9. `03_assets/07_asset-group-1-approved-manifest.md` — grain/bloom/glint usage + blend rules
10. `03_assets/09_asset-group-2-approved-manifest.md` — meadow backplate (Today/onboarding), LQIP/fallback/Save-Data
11. `03_assets/12_asset-group-4-approved-manifest.md` — Forge night backplate (Forge), LQIP/fallback/Save-Data
12. `03_assets/10_asset-group-3-completion-reveal-brief.md` — **FUTURE contract only**; do NOT build the completion flow in Stage 1
13. `02_strategy/02_forge-engine-and-safety.md`, `03_assets/00/01/02/04/05/08/11`, `.gitignore`, `.env.example`, `00_brief/intent-note.md` — context/constraints
14. `02_strategy/03_asf-spec.md` + `07` + `fixtures/**` — **future stage**; read for context, build nothing

## 2. Repository & workflow rules
1. **Read every tracked repository file before changing code.**
2. Work **only** in branch **`frontend-v1/stage-1-app-shell`**.
3. **Confirm the branch is based on current `main`** (`git fetch origin && git switch -c frontend-v1/stage-1-app-shell origin/main`, or rebase the existing branch onto latest `main`). Report the base commit SHA.
4. **Present a concise implementation plan + exact expected changed-file list BEFORE editing.**
5. **Stop and report** any missing dependency, asset, version conflict, or architectural ambiguity — do not improvise around it.
6. Keep commits **small and logically grouped**.
7. **Never commit directly to `main`.**
8. Run **typecheck, lint, relevant tests, and a production build** before completion.
9. Test at a **390px-wide** mobile viewport **and** a desktop viewport.
10. Open a **pull request into `main`** — **never merge it**.
11. Final report: changed files, commit hashes, commands run, test/build results, known limitations, and a concise **manual iPhone QA checklist**.

## 3. Required technology (Stage 1)
React 18 · Vite · TypeScript · Tailwind CSS · Framer Motion · Zustand · Dexie/IndexedDB (**init + migration shell only**) · a UUID utility · a React/Vite/TS test runner (Vitest + React Testing Library recommended). Provide npm scripts: `dev`, `build` (production), `typecheck`, `lint`, `test`. Initialize the app at the **repo root** (package.json at root); leave `00_brief/`, `02_strategy/`, `03_assets/` untouched. Add app-appropriate entries to `.gitignore` (node_modules, dist, coverage) — do not weaken existing ignores.

## 4. Exact approved asset locations (copy into the app; originals stay untouched)
| Purpose | Repo path | Use |
|---|---|---|
| **Threshold Arch crest** | `03_assets/03_chrome-crest.md` §Threshold Arch (authored SVG — no image file) | Build as a layered SVG component (§7) |
| Grain texture | `03_assets/approved/asset-group-1/aur_texture_grain_v1@128x128.png` | Optional global overlay, `mix-blend-mode: overlay`, opacity via `--grain-opacity` |
| Bloom sprite | `03_assets/approved/asset-group-1/aur_texture_bloom_v1@1024x1024.webp` | Optional, `mix-blend-mode: screen`, nonessential zones only |
| Prismatic glint | `03_assets/approved/asset-group-1/aur_texture_glint_v1@1024x128.webp` | Optional; **do not build the completion sweep in Stage 1** — asset may be imported but unused/parked |
| Meadow backplate (Today) | `03_assets/approved/asset-group-2/aur_backplate_meadow-bluehour_v1@1080x1910.webp` + `…@1080x1910.jpg` + `…_lqip@24x42.webp` | **Today / onboarding surfaces only** |
| Forge night backplate | `03_assets/approved/asset-group-4/aur_backplate_forge-night_v1@1080x1910.webp` + `…@1080x1910.jpg` + `…_lqip@24x42.webp` | **Forge surfaces only** |
| Manifests (loading/fallback/Save-Data rules) | `03_assets/07`, `09`, `12` | Follow their documented blend/fallback/LQIP/Save-Data behavior exactly |

Recommended app placement after copying: `src/design/assets/textures/`, `src/design/assets/backplates/`. Import via Vite so files are fingerprinted. **Never** reference `03_assets/candidates/**` or `01_references/**` (the latter is not in the repo and must never be).

## 5. In-scope deliverables (Stage 1)
- Responsive **iPhone-first** application shell.
- **Route/view structure** for: **Today, Train, Forge, Proof, Settings**.
- **Bottom navigation** with those five destinations (thumb-reachable). **BINDING for Stage 1: exactly these five tabs.** Do **not** build the product spec §2 "4 tabs + floating Forge + Notes" structure — that older IA and the **Notes** destination are deferred (not part of Stage 1).
- A **static Today screen** using **clearly labeled mock data only** (greeting/date, a mock planned-day card, a resting Threshold Arch crest, a calm completion-bar placeholder). No real logic.
- **Static placeholder surfaces** for Train, Forge, Proof, Settings — each shows the design system honestly, labeled "coming in a later stage," never faking completion. (Settings may show static, non-functional token examples like a reduced-motion row, but wire nothing.)
- **Semantic Ceremonial Chrome design tokens** (CSS custom properties + Tailwind theme) for: color (cobalt scale, chrome/silver, ink), typography (Fraunces/Inter/IBM Plex Mono + scale), spacing, radii, elevation, **scrims**, **motion** (durations + eases), **chrome**, **cobalt**, **prismatic** accent (`--aur-prism`), and **grain** (`--grain-opacity`). Source of truth: `05` §1–4. Do not hardcode raw hex in components.
- **Threshold Arch** as a layered, code-controlled **SVG component** following the exact `03` §Threshold Arch spec and its **7-level progression** (§7 below).
- Group 1 **grain / bloom / glint** as **optional progressive-enhancement** layers only.
- Group 2 **meadow backplate** on **Today / onboarding-like** surfaces only.
- Group 4 **Forge night backplate** on **Forge** surfaces only.
- A **solid CSS ceremonial-cobalt fallback** for every image-dependent surface.
- **Save-Data** behavior that skips optional raster assets (honor `navigator.connection.saveData`).
- **LQIP / image loading** behavior per the approved manifests (inline blur-up → `<picture>` webp→jpg, dimensions reserved, no layout shift).
- **`prefers-reduced-motion`** behavior (plus an app `reducedMotion` token seam — no functional switcher).
- **iPhone safe-area** support via `env(safe-area-inset-*)` (`viewport-fit=cover`).
- **Minimum 44px touch targets.**
- **Accessible contrast** and visible **keyboard focus** styles.
- Respect **text scaling** (rem-based) and **narrow mobile viewport** behavior (no horizontal overflow at 390px).
- **No theme switcher** — only implement a light/dark policy if the specs already require it; otherwise ship the dark Ceremonial Chrome default. (Meadow-Light is a deferred theme; do not build a toggle.)
- **Dexie schema initialization / migration shell only**: define the object stores + indexes + version from `04_data-model.md`, open the DB on boot, expose a typed `db` instance, run a no-op migration shell — **persist no real feature data**.
- A **clearly documented mock-data boundary**: a single labeled `src/mocks/` module feeds screens through a thin data-access seam, so future stages replace mock→Dexie without rewriting screens.

## 6. Threshold Arch SVG — build spec (from `03_assets/03` §Threshold Arch)
- One SVG, `viewBox="0 0 64 64"`, stroke-based, `stroke-linecap="round"`, min stroke 1.5 units (legible at 24px).
- **7 cumulative layers** L0→L6; `level` prop reveals layers 0..N. Silhouette constant; levels only add. Use the exact reference paths in `03` (you may refine curves, not structure):
  - L0 Unmarked (stem) · L1 First Mark (arch + baseline) · L2 Polished Mark (chrome edge) · L3 Silver Crest (inner arch) · L4 Cobalt Crest (cobalt channel) · L5 Prismatic Crest (right-arc `--aur-prism` stroke, one side only, never a fill) · L6 Ascendant (two stem buds).
- Paint **only** via CSS custom properties (`--aur-steel-400`, `--aur-silver-200`, `--aur-chrome-50`, `--aur-cobalt-500`, `--aur-cobalt-300`, `--aur-prism`). Nothing hardcoded.
- Sizes: inline 24/48, card 256, hero 1024 (same SVG scaled). Provide a `level: 0..6` prop and render statically in Stage 1 (a small dev-only preview of all 7 levels is welcome). **Do not** build level-up animation or the completion sweep (Stage 3+).

## 7. Stage 1 visual rules
- Feels like a **refined motion-graphic product** — not a video game, fantasy dashboard, or generic productivity app.
- **Meadow = invitation/action** (Today); **Forge sanctuary = reflection/reset** (Forge).
- Motion **restrained, meaningful, calm** (use `05` §4 tokens; transform/opacity only; no animated `backdrop-filter`).
- **Forbidden:** confetti, XP, coins, "achievement unlocked," fire, weapon, combat, neon overload, particle spam, heavy WebGL/3D.
- **No** key form field, workout control, Forge journal text, safety copy, or important button may sit over a visually busy portion of an image. Keep the meadow's flower band and the Forge dew band out from under UI; apply the cobalt scrim where a card meets busy imagery.
- Images are enhancement only; core is fully usable with every image disabled.

## 8. Out of scope (Stage 1 — build nothing here; placeholders only)
Workout logger · sets/reps/RPE/rest timers/history/plans · ASF parser or import UI · real persistence of workout/Forge/proof records · completion button behavior, streak calc, records tables, proof animation · Forge engine, safety decision tree, crisis-flow UI · auth/accounts/sync/remote-IDs/conflict/backend/server/API/AI/analytics/payments/notifications/secrets · GitHub Pages/deploy/release · new asset generation, hero video, cinematic loop, WebGL, 3D · rewriting approved strategy/asset docs.

## 9. Definition of done (Stage 1)
- App builds, typechecks, lints, and tests pass; production build succeeds.
- All five destinations reachable via bottom nav; Today renders labeled mock data and works at 390px with no horizontal overflow.
- Threshold Arch SVG renders and visibly supports the 7-level layered system (all levels demonstrable).
- Meadow loads only on Today/onboarding; Forge night only on Forge; each with solid cobalt fallback, LQIP, and Save-Data skip.
- `prefers-reduced-motion`, safe-area insets, 44px targets, AA contrast, visible focus, keyboard nav all verified.
- Dexie init/migration shell exists (DB opens, version set, stores defined) but persists no real feature data.
- No secrets/external APIs/accounts/backend/analytics/deploy config added.
- Every visual enhancement can be disabled without breaking the app.
- All items in `docs/kimi-stage-1-acceptance.md` pass.

## 10. Stop condition
Stop and report (do not improvise) if: a required dependency/version conflicts; an approved asset path is missing or differs from this doc; a spec is ambiguous or appears to contradict another; or any instruction here conflicts with a binding strategy/privacy/safety document. Present the conflict and your recommended resolution, and wait.

---
**Deliver the plan + expected changed-file list first, and wait for approval before editing. Open a PR into `main` at the end; never merge it.**
