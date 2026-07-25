# AURELIS — NEXT SESSION BRIEF (resume here)

Rewritten 2026-07-25 (session 2). Read this first, then `02_strategy/00_INDEX.md`, then `03_assets/16_asset-groups-9-12-approved-manifest.md`. This supersedes the previous brief.

---

## 0. Where things stand

**Repo:** `icodewithvibes/aurelis` (PRIVATE, Pages disabled, owner-only). `gh` is at `"C:\Program Files\GitHub CLI\gh.exe"` — **not on PATH**, call by full path.

**PowerShell gotchas:** `<` and `>` in a here-string break `git commit -m` — write the message to a file and use `git commit -F`. Multi-part `-q` jq strings also mangle; query one field at a time.

**Merge state:**
- PR **#7** (Stage 1) and **#8** (Stage 2) are **MERGED**.
- `main` contains Stage 1 only — **#8 merged into `frontend-v1/stage-1-app-shell`, not into `main`**, because GitHub did not retarget it. `frontend-v1/stage-1-app-shell` now holds Stage 1 + Stage 2.
- PR **#9** (Stage 3 visual) is still **OPEN**, based on `frontend-v1/stage-2-core-workflows`.
- **To finish the stack:** merge #9 into `frontend-v1/stage-2-core-workflows`, then open one PR from `frontend-v1/stage-2-core-workflows` → `main` (it carries Stage 1+2+3), then retarget this branch.
- Working branch: `frontend-v1/stage-3-proof-forge-and-visual-assets`, tip `8e5e9e3`.

**Toolchain:** Node 24, Vite 6 + React 18 + TS strict + Tailwind v4 + Framer Motion + Zustand + Dexie + Vitest. **95 tests pass**, typecheck and lint clean. Python 3.14 + Pillow for all image compression.

**Dev server:** `.claude/launch.json` has `autoPort: true`, but Vite ignores the assigned port and picks its own (5174 when 5173 is taken) — read `preview_logs` for the real URL, then `navigate` there. Hash routing: set `location.hash`, don't navigate to `/#/path`.

**Credits:** ~**381** remaining (147 spent this session on 21 GPT Image 2 renders).

---

## 1. What was built this session

**Assets** (all GPT Image 2 2k/high — see manifest 16 for the full table):
- **8-scene time-of-day hero cycle**: two scenes per band (dawn/day/dusk/night), one back-facing and one facing the viewer in the M8 register. The approved Chrome Rider keeps a dusk slot.
- **Nav icon set regenerated** as flat monoline glyphs (sun/barbell/anvil/laurel/gear), replacing the rejected glossy raster set.
- **App icon**: armoured gauntlet gripping a barbell → PWA 192/512/maskable, apple-touch, favicon. Installable via `public/manifest.webmanifest`.
- **Chrome Crest L1–L7** engraved medallions, one silhouette with additive detail. L2–L4 were re-rendered so the early tiers are actually distinguishable.

**Code:**
- `lib/timeOfDay` + `design/heroes` + `useTimeBand`: deterministic per-day scene selection, re-resolves at band boundaries and on tab focus, empty bands fall back to the Chrome Rider.
- `lib/schedule`: weekday → split-day mapping (Mon/Wed/Fri → Push A/Pull A/Legs A). Splits with more days than weekly slots rotate forward each week, phased from the import week. **Pure function of the date — no stored pointer, no drift, no migration.** (The brief's original `nextDayPointer` idea was deliberately not used; revisit only if "missing a day shouldn't skip that day" turns out to matter.)
- Today leads with one action; rest days get a calm state; both show "Next: <day>, <when>". Train tags today and next.
- **Proof engine** (`features/proof/`): `resolveDayStatus`, `computeStreak`, `computeBestStreak`, `weekCompletion`, `countKeptDays`, Epley `est1RM`, PR detection. All pure folds over the event log — nothing derived is stored as truth.
- `recordProof()` persists session status, PRs, proof events, records and crest level **before** the reveal animation.
- `CompletionReveal`: 550 ms edge-light trace, prismatic glint, "Proof recorded — N sessions kept", 900 ms flourish on a tier crossing; skippable, reduced-motion safe.
- Proof screen rebuilt on real data: tier, exact count, current/best run, week completion, all-time totals, timeline.

---

## 2. NOT built — pick up here

1. **Forge deterministic engine + safety** (`02_strategy/02`) — the last big Stage 3 item. Seven states → template families selected by `hash(stateKey+localDate+note) % variants`; **safety rails run FIRST**; US/MA 988/911 copy. The plan says *do not implement the crisis UI until reviewed* — confirm with Yuriel before writing it. Daily commitments are already seamed into `DayFacts` (`commitmentSet` / `commitmentKept`) and stay inert until this lands; wire `totalCommitmentsCompleted` at the same time.
2. **Split editing** — reorder days, rename, edit exercises after import. Item 5 of the old brief's split-logic list; the only part not delivered.
3. **Session editing + replay** — a completed session is meant to stay editable, with streak/PR/records recomputed. The engine already supports it (pure folds); the UI does not exist.
4. **Stage 4 backlog** (highest value first): exercise history & progress chart, PR timeline surface, plate calculator, warm-up suggestions, supersets, per-exercise + session notes, JSON export/import backup, weekly review, body-weight log, rest-timer presets + haptics, quick-add exercise mid-session, wire the Settings units toggle (still read-only).

---

## 3. Standing rules (unchanged)

- Local-only. No backend, accounts, analytics, sync, or deploy. PWA install is fine; a service worker is not yet in scope.
- Images are always optional: solid CSS fallback, Save-Data skips rasters, LQIP blur-up, reduced-motion static.
- 44 px targets, no 390 px overflow, one-handed iPhone.
- **`01_references/` and `03_assets/candidates/` are git-ignored — never commit, never redistribute.** Only compressed approved exports ship.
- Asset model policy: **`gpt_image_2` at 2k/high** for everything (~7 credits). Max **8 concurrent jobs**; renders take 2–8 min.
- Prompt recipe that works: name the exact qualities to borrow, state an explicit compositional zone plan, name specific materials, and list strict exclusions (always including `no watermark, no reversed text`). For emblems add "flat centred, orthographic, generous margin, must read at 48 px".
- Berserk is an **abstract register only** — never a character, armour design, panel composition, or the name/logo.
- Review candidates with Yuriel **before** compressing or committing.
