<!--
AURELIS pull request. Keep PRs small and logically scoped.
For Kimi Stage 1, this maps to docs/kimi-stage-1-acceptance.md.
-->

## Summary
<!-- What does this PR do, in 1–3 sentences? -->

## Stage / scope
- [ ] This is **Stage 1 (app shell)** — no feature logic (workouts, parser, Forge, streaks, persistence of feature data).
- [ ] If not Stage 1, explain scope: …

## Branch & base
- Branch: `frontend-v1/stage-1-app-shell` (or: …)
- Based on `main` at SHA: `__________`
- [ ] This PR targets `main` and will **not** be merged by the author.

## Changed files
<!-- Paste the exact changed-file list (git diff --name-status main...HEAD). -->

## Commands run & results
- [ ] `typecheck` — result: …
- [ ] `lint` — result: …
- [ ] `test` — result: …
- [ ] `build` (production) — result: …

## Viewports tested
- [ ] 390px mobile (no horizontal overflow)
- [ ] Desktop

## Acceptance (docs/kimi-stage-1-acceptance.md)
- [ ] A. Setup & toolchain
- [ ] B. Navigation (5 destinations)
- [ ] C. Today mock data @390px
- [ ] D. Honest placeholders
- [ ] E. Threshold Arch 7-level SVG
- [ ] F. Backplates scoped + cobalt fallback
- [ ] G. Save-Data / LQIP / no heavy effects
- [ ] H. Reduced-motion
- [ ] I. Safe-area / 44px / AA contrast / focus / keyboard / text-scaling
- [ ] J. Dexie shell only (no real feature persistence)
- [ ] K. Privacy/scope guardrails
- [ ] L. Process

## Privacy & guardrail confirmations
- [ ] No secrets / `.env` real values / API keys / tokens added.
- [ ] No backend, server, auth, accounts, sync, remote IDs, API, AI provider, analytics, payments, or notifications added.
- [ ] No GitHub Pages / deployment / release config added.
- [ ] No approved asset files or strategy/asset docs modified; `01_references/**` not referenced; `03_assets/candidates/**` not loaded.
- [ ] Every visual enhancement can be disabled without breaking the app.

## Known limitations / deferred
<!-- What is intentionally not done (deferred to Stage 2/3/4)? -->

## Manual iPhone QA checklist
<!-- Concise steps a reviewer runs on an iPhone/Safari to sanity-check the shell. -->

🤖 Generated with [Claude Code](https://claude.com/claude-code)
