# AURELIS — NEXT SESSION BRIEF (resume here)

Rewritten 2026-07-25 (session 2, second half). Read this first, then `02_strategy/00_INDEX.md`. Supersedes the previous brief.

---

## 0. Where things stand

**Repo:** `icodewithvibes/aurelis` (PRIVATE, Pages disabled, owner-only). `gh` is at `"C:\Program Files\GitHub CLI\gh.exe"` — **not on PATH**.

**PowerShell gotchas:** `<` and `>` in a here-string break `git commit -m` — write the message to a file and use `git commit -F`. Multi-part `-q` jq strings mangle too.

**Merge state — one trap:**
- PR **#7** (Stage 1) and **#8** (Stage 2) are **MERGED**, but #8 landed in `frontend-v1/stage-1-app-shell`, **not `main`** — GitHub only retargets a stacked PR when its base branch is deleted, and it wasn't. `main` still contains Stage 1 only.
- PR **#9** is still **OPEN**, based on `frontend-v1/stage-2-core-workflows`.
- **To finish:** merge #9 into `frontend-v1/stage-2-core-workflows`, then open ONE PR from `frontend-v1/stage-2-core-workflows` → `main` (it carries Stage 1+2+3), then retarget this branch.
- Working branch `frontend-v1/stage-3-proof-forge-and-visual-assets`, tip `7db3df6`.

**Toolchain:** Node 24, Vite 6 + React 18 + TS strict + Tailwind v4 + Framer Motion + Zustand + Dexie + Vitest. **179 tests pass**, typecheck and lint clean.

**Dev server:** Vite ignores the harness-assigned port and picks its own — read `preview_logs` for the real URL. Hash routing: set `location.hash`, don't navigate to `/#/path`. Note each localhost **port is its own origin, so each has its own IndexedDB** — data from one port won't appear on another.

**Credits:** ~**381** (147 spent on 21 GPT Image 2 renders; no renders since).

---

## 1. STAGE 3 IS COMPLETE

All four items in `docs/stage-3-product-and-ux-plan.md` §5 are built, plus editing.

**1. Proof engine + surface + completion reveal**
- `features/proof/engine.ts` — pure folds: `resolveDayStatus`, `computeStreak`, `computeBestStreak`, `weekCompletion`, `countKeptDays`, Epley `est1RM`, PR detection. Nothing derived is stored as truth.
- `recordProof()` persists session status, PRs, events, records and crest level **before** the reveal plays.
- `CompletionReveal` — 550 ms edge-light trace, prismatic glint, 900 ms flourish on a tier crossing, skippable, reduced-motion safe.
- Proof screen: tier, exact count, current/best run, week completion, all-time totals, timeline.

**2. Beginner logger UX** — was already delivered (prefilled reps, weight-first, RPE behind "Advanced details", ghost defaults, units, rest timer).

**3. Typography** — no component declares a font family inline. New `.aur-heading`; `.aur-label` and `.aur-metric` replace the ad-hoc patterns. Verified: Fraunces 36/470 display, Fraunces 18.4/440 date-context, Inter 11 labels, IBM Plex Mono metrics, Inter 16 body.

**4. Forge engine + safety** (`features/forge/`, per `02_strategy/02` exactly)
- `route() → safetyScreen() → generateResponse()`. `generateResponse` is the only AI-swappable unit; the safety screen can't be bypassed.
- Seven states × three variants, `hash(stateKey + localDate + note) % 3`. No randomness anywhere.
- Voice rules are **enforced by tests**: the 12/24/16 word budget and a forbidden-lexicon check.
- Safety: four categories, curated lexicon, word-boundary matching, and **deliberately narrow negation** — only short symptom words ("not suicidal", "no pain") can be cancelled; multi-word phrases that carry their own negation ("i dont want to be here anymore") are never cancellable. A flagged note gets no task, no time box, gentle tone, and can never become a commitment. US/MA copy (988 / 911 / a trusted person), seeded into settings. The UI states plainly it is not a diagnosis.
- Daily commitments feed the streak: kept counts as a kept day, open doesn't, skipped never becomes an unmet obligation.

**Plus: editable sessions with deterministic replay.** `replayDerivedState()` rebuilds the PR table and its events from the log in order, then the records row, so a fat-fingered 225 that was really 125 cannot leave a personal best behind. Today's primary action on a kept day opens the recorded session for review/edit.

---

## 2. NOT built — pick up here

1. **Split editing** — reorder days, rename, edit exercises after import. Currently import-only. The last unbuilt item from the old split-logic list.
2. **Notes** — still explicitly out of scope in the plan; confirm before building.
3. **Stage 4 backlog** (highest value first): exercise history & progress chart, PR timeline surface, plate calculator, warm-up suggestions, supersets/circuits, per-exercise + session notes, JSON export/import backup, weekly review, body-weight log, rest-timer presets + haptics, quick-add exercise mid-session, wire the Settings units toggle (still read-only).
4. **Worth a look:** the Proof timeline shows the last 50 events with no paging, and `collectDayFacts` walks every day since the first activity on each load — both are fine now and would want attention with a year of data.

---

## 3. Standing rules (unchanged)

- Local-only. No backend, accounts, analytics, sync, or deploy. PWA install works; no service worker yet.
- Images always optional: solid CSS fallback, Save-Data skips rasters, LQIP blur-up, reduced-motion static.
- 44 px targets, no 390 px overflow, one-handed iPhone.
- **`01_references/` and `03_assets/candidates/` are git-ignored — never commit, never redistribute.** Only compressed approved exports ship.
- Asset policy: **`gpt_image_2` at 2k/high** (~7 credits). Max **8 concurrent jobs**; 2–8 min each. Review candidates with Yuriel **before** compressing or committing.
- Prompt recipe: name the exact qualities to borrow, give an explicit compositional zone plan, name specific materials, list strict exclusions (always `no watermark, no reversed text`). For emblems add "flat centred, orthographic, generous margin, must read at 48 px".
- Berserk is an **abstract register only** — never a character, armour design, panel composition, or the name/logo.
- **Safety copy is binding.** Any change to `features/forge/safety/` or the crisis copy should be reviewed against `02_strategy/02` §4–5, never loosened casually, and the negation rule in `lexicon.ts` must stay narrow.
