# AURELIS

**A private, local-first execution and workout tool.** Know exactly what to train today, log the work honestly, turn resistance into one concrete next action (Forge), and build proof through kept sessions. Mobile-first (iPhone), offline-capable, calm and ceremonial — not a game, not a military app.

> **Status: planning locked. Asset generation and frontend build NOT started.** This repository currently contains strategy, references, and production briefs only. No frontend code exists yet. Do not generate assets or spend Fable/Higgsfield credits until Yuriel gives the go.

---

## Core promise
AURELIS is *your* execution instrument. It runs entirely on your device, keeps your training and commitments private, and rewards consistency with quiet, premium feedback (the **Chrome Crest**) — never streaks-as-dopamine, never shame.

## V1 scope
- Import a training split via **AURELIS Split Format (ASF)** + a guided review editor.
- **Today**: the one thing to do now (workout / recovery / rest).
- **Logger**: sets, reps, weight, RPE, notes, rest timer, session completion.
- **Forge**: deterministic, on-device resistance → acknowledgment → reframe → **one next action** → proof. With safety rails.
- **Proof**: completion bar, sessions-kept streak, Chrome Crest, chronological timeline; strength progress (V1.5).
- **Notes**, **Settings**, **JSON export/import**.

## Explicit non-goals (V1)
Accounts · servers · cloud sync · social/sharing · real AI or any network call carrying user data · API keys/secrets in the client · wearables/HealthKit/calendar · multiple simultaneous active programs · OCR/screenshot/messy-note parsing · fire/swords/XP/coins/confetti/game reward mechanics.

## Folder map
| Folder | Contents |
|---|---|
| `00_brief/` | Original project-intent note. |
| `01_references/` | Mood images (`M1–M8`) + 3 MotionSites prompts. **Style/principle references ONLY — never copy.** |
| `02_strategy/` | The build spec (source of truth). Index: [`02_strategy/00_INDEX.md`](02_strategy/00_INDEX.md). Includes ASF parser fixtures in `02_strategy/fixtures/`. |
| `03_assets/` | Original production briefs for Fable 5 / Higgsfield. Briefs only — no generated assets yet. |

## Locked architecture
React 18 · Vite · TypeScript · Tailwind CSS · Framer Motion · **Zustand** (UI/ephemeral state) · **Dexie/IndexedDB** (persistence). Deploy: **static GitHub Pages** (set Vite `base`; SPA 404 fallback). Installable PWA, fully offline after first load.

## Data & privacy
- **IndexedDB on the current device is the only source of truth.** No account, no server, no background sync, no shared data, no cloud, no AI keys.
- Sync-*ready* hygiene is kept (UUIDs, timestamps, schema version, soft-delete, versioned JSON export/import) **but no sync/auth/backend is built** in V1.
- No analytics; no network request carries user data.
- Forge is deterministic and local; its response layer is isolated so a future *private* AI can replace only that function later.

## Build-role split
- **Claude Opus** — strategy, planning, spec, review; later backend/security. (Author of `02_strategy/` + `03_assets/`.)
- **Fable 5 / Higgsfield** — original visual concepts + assets, from the `03_assets/` briefs. Nothing traces the references.
- **Kimi K3** — frontend implementation, strictly from `02_strategy/`.

## Required reading order for Kimi
1. [`02_strategy/00_INDEX.md`](02_strategy/00_INDEX.md) — locked decisions + build gate
2. [`02_strategy/06_kimi-build-brief.md`](02_strategy/06_kimi-build-brief.md) — architecture, structure, build order, IP rules
3. [`02_strategy/01_product-spec-v1.md`](02_strategy/01_product-spec-v1.md) — screens, behaviors, acceptance
4. [`02_strategy/04_data-model.md`](02_strategy/04_data-model.md) — Dexie schema, streak algorithm, recompute
5. [`02_strategy/03_asf-spec.md`](02_strategy/03_asf-spec.md) + [`02_strategy/07_asf-parser-test-fixtures.md`](02_strategy/07_asf-parser-test-fixtures.md) — import format + acceptance suite
6. [`02_strategy/02_forge-engine-and-safety.md`](02_strategy/02_forge-engine-and-safety.md) — Forge voice, templates, **safety rails**
7. [`02_strategy/05_design-system-ceremonial-chrome.md`](02_strategy/05_design-system-ceremonial-chrome.md) — tokens, materials, motion, Chrome Crest
8. [`03_assets/`](03_assets/) — asset usage/perf (`06`) matters even before assets exist

## Git / GitHub safety rules
- **Private repository only.** Never make public.
- **Never commit secrets** — there are none in V1 by design; keep it that way. No API keys, tokens, credentials, or `.env` with secrets.
- Commit user data **never** — no real training logs, no personal notes, no exported JSON dumps in the repo. Add them to `.gitignore`.
- Keep the `01_references/` images out of any public artifact; they are private mood refs.
- Deploy only the built static frontend to GitHub Pages; do not expose the strategy/reference folders in the deployed site if the repo is ever opened up.
- Conventional, reviewable commits; no force-push to the default branch; branch for changes.

## Definition of done — planning phase
- [x] Product understanding + reference analysis complete (`02_strategy`).
- [x] All V1 decisions locked (Forge, Proof/Chrome Crest, ASF, Ceremonial Chrome, local-only).
- [x] `[A]` local-only + sync-ready, `[B]` sessions-kept streak, `[C]` US/MA crisis copy — resolved.
- [x] Data model, streak algorithm, and edit-recompute specified.
- [x] ASF grammar + full parser fixture/acceptance suite + Kimi test checklist.
- [x] Design system + Chrome Crest + motion/perf rules.
- [x] Original asset production briefs (`03_assets/`).
- [x] Root README orienting all collaborators.
- [ ] Yuriel's final green light to leave planning. ← only remaining gate.

## Exact next phases, in order
1. **Repo init** — private GitHub repo, Vite+TS+Tailwind scaffold, `.gitignore` (node, dist, data dumps), tokens + reduced-motion plumbing. *(No product code yet — scaffold only.)*
2. **Asset generation** — Fable/Higgsfield produce essentials first (texture kit → Chrome Crest → primary backplate) per `03_assets/`. *(Requires Yuriel's go + credit approval.)*
3. **Kimi frontend build** — follow `02_strategy/06` build order (foundation → import → Today → logger → proof → forge → notes/settings → recompute+tests). Parser must pass the `07` fixture suite.
4. **Review & hardening** — Claude Opus reviews against acceptance criteria; a11y, reduced-motion, offline/PWA, iPhone perf passes.
5. **Backend (future, separate)** — only if/when accounts, sync, or private AI are wanted; nothing in V1 depends on it.
