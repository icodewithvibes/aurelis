# AURELIS — Stage 3 Product & UX Plan (PLAN ONLY — not implemented)

Scope of this document: the **plan** for Stage 3. No code here. Do not change Stage 2 workout behavior or open a functional Stage 3 PR until this is reviewed. Binding sources: `02_strategy/01,02,04,05`, `03_assets/03,07,10`.

---

## 1. Proof / streak logic

### 1.1 What a "kept day" is (from 04_data-model §2–3, locked)
- A **qualifying** day = a completed session (`status:'completed', qualified:true`) **once per local calendar day**; OR, on a non-scheduled day, a Forge daily-commitment explicitly marked (Stage 3 Forge).
- **Recovery-honored** bridges a run (never breaks, never increments).
- Empty/rest days (nothing scheduled, nothing marked) bridge (neither break nor increment).
- A **missed obligation** (a scheduled workout day, or a self-set daily commitment, left undone before today) breaks the streak.
- `streakCountMode = 'sessions'` (LOCKED): streak = count of kept obligations in the unbroken run; **first qualifying completion = 1 immediately**.

### 1.2 Derived, never stored as source of truth
Streak, crest level, PRs, completion bars are **pure functions of the event log** (sessions + dayMarks). Stage 3 implements `resolveDayStatus(date)`, `computeStreak(today)`, and `computeRecords()` as pure folds; editing a past session triggers a deterministic **replay** (04 §4). This is what makes editing safe and prevents deceptive drift.

### 1.3 Seven Chrome Crest milestones (transparent, no vague "XP")
Map the **real kept-session count** to the locked tiers (the Stage-1 `lib/crest.ts` already encodes these — Stage 3 feeds it real counts, not a mock):

| Tier | Kept sessions | Meaning shown to the user |
|---|---|---|
| Unmarked | 0 | "Begin — your first kept session marks the crest." |
| First Mark | 1–2 | "The first mark is made." |
| Polished Mark | 3–6 | "Consistency is starting to show." |
| Silver Crest | 7–13 | "A full crest — a steady habit." |
| Cobalt Crest | 14–29 | "Cobalt — weeks of kept work." |
| Prismatic Crest | 30–59 | "Prismatic — a long, proven run." |
| Ascendant Crest | 60+ | "Ascendant — mastery of showing up." |

Proof surface shows, plainly: **current tier name + emblem**, **exact count**, **next tier + how many kept sessions until it**, and the **all-time best**. No coins, no XP bar, no loot, no fabricated progress — the number is the honest count of kept sessions, and the copy states exactly what advances it.

### 1.4 Proof surface content (Stage 3)
- Hero crest (current tier) with the real count + next-tier progress line (reuse `ProofSystem`, fed real data).
- **Chronological proof timeline** (`proofEvents`): completed workouts, crest level-ups, PRs, recovery-honored — reverse-chronological.
- **Completion bar**: % of this week's scheduled obligations kept.
- All-time records (`records` table): total sessions kept, workouts completed, best streak.

### 1.5 Completion reveal integration (Group 3 contract, `03_assets/10`)
On the intentional "Record proof / Complete session" confirm in the logger:
1. **Persist first** (session `completed`, proofEvent, PR detection, records update, streak recompute) — before any animation.
2. Then play the **450–650ms** Threshold Arch reveal: silver edge-light trace → one botanical/cobalt detail resolves → one restrained prismatic glint (approved TX-4 or CSS `--aur-prism`). Non-blocking, skippable.
3. Result line: **"Proof recorded — N sessions kept."** If it crosses a tier, the ~900ms level-up flourish.
4. **Reduced-motion**: static final crest + result line, no sweep. No confetti/XP/coins ever.
Uses the future real crest render assets (Group 6) with the **accessible SVG as the small-size + fallback source of truth**.

---

## 2. Beginner-friendly workout experience (fixes to Stage 2 UX)

The Stage 2 logger works but is expert-shaped (raw weight/reps/RPE grid). Stage 3 plan:

### 2.1 Targets come from the split
- Import/create already yields `sets`, `repMin/repMax`, optional `rpe`, `restSec` per exercise. On a workout day the logger **pre-loads these targets automatically**: each set row shows the **target reps** (e.g. "8") pre-filled and the target rep-range as a hint ("6–8").

### 2.2 Make the common action trivial
- Primary per-set interaction: **enter weight → tap Complete.** Reps are **prefilled from the split's target** and only edited when the user deviates (tap to change). One-handed, 44px.
- "Repeat last set" affordance to carry weight/reps down the sets of an exercise.
- **Ghost defaults**: last session's weight/reps for that exercise shown as faint placeholders to beat (data already captured via `lastSetForExercise`).

### 2.3 RPE is not unexplained jargon
- **Default: hide RPE** behind an optional **"Advanced details"** disclosure per exercise/set.
- When shown, label it plainly: **"How hard did that set feel? (1–10)"** with a short helper ("10 = no reps left"). Never a bare "RPE" input for a beginner. RPE stays optional; a session is complete without it.

### 2.4 Explain the currently-implicit behaviors (in-UI copy + settings)
- **Units**: a first-run/Settings choice **lb or kg** (already in `settings.units`); the logger shows the unit next to weight inputs; no silent unitless numbers.
- **Progressive overload**: Stage 3 shows last-time vs today inline (ghost defaults + a small "+" hint when today beats last), described honestly as a reference — **not** an auto-prescription.
- **Skipped sets / partial sessions**: a set with no data is simply "not logged"; finishing with some sets blank saves a session that still **counts** (the confirm is the intent) and the timeline notes it as completed; a set can be explicitly marked skipped. Copy explains it.
- **Rest-timer defaults**: uses the exercise's `restSec`; if none, a sensible default (e.g. 90s) with a clear label; user can skip/extend (already built).
- **Editing completed sets / sessions**: a completed session remains **editable**; edits trigger the deterministic recompute (streak/PR/records) per 04 §4. Copy: "Edit anytime — your proof stays accurate."

### 2.5 Preserved constraints
One-handed iPhone, 44px targets, offline/local-only, reload persistence, no busy imagery under inputs/timers/validation, calm motion.

---

## 3. Typography correction

**Problem:** the intentional display type used for "Train"/"Training Day" is not applied consistently; date/context labels like "Friday, July 24" read as plain/near-default, and dense data uses mono where it isn't helpful.

### 3.1 Coherent hierarchy (map to existing tokens in `05` / `tokens.css`)
| Role | Font | Token/size | Usage |
|---|---|---|---|
| **Display** | Fraunces | `--text-display` (2.25rem) | Today greeting, hero lines |
| **Screen title** | Fraunces | `--text-display-sm` (1.75rem) | "Train", "Forge", "Proof", "Import" |
| **Date/context title** | **Fraunces** (corrected — was plain sans) | ~`--text-h2` (1.25rem), muted ink | "Friday, July 24", "Scheduled today" context lines |
| **Section title** | Fraunces | `--text-h1`/`--text-h2` | card headers ("Push A") |
| **Body** | **Inter** (stays sans for readability) | `--text-body` | paragraphs, descriptions, dense form labels |
| **Label** | Inter, uppercase tracked | `--text-small` | "SCHEDULED TODAY", field labels |
| **Meta** | Inter | `0.6875rem`, ink-faint | helper/stage notes |
| **Metric** | IBM Plex Mono | `--text-mono-data` | logged numbers, timer, counts, weight×reps |
| **System/mono** | IBM Plex Mono | small | only where tabular alignment genuinely helps |

### 3.2 Rules
- Apply **Fraunces to date/context titles** (the specific fix requested) and all screen/section titles — consistently, via a small set of typography components/classes so nothing is ad-hoc.
- **Do not** force the decorative display serif onto **body text or dense forms** — Inter stays for readability (logger inputs, descriptions, labels).
- Numbers that represent data (weights, reps, counts, timer) use the mono metric style; prose never does.
- Robust fallbacks already declared (`Georgia`/`system-ui`/`ui-monospace`); self-hosted `@fontsource` assets already bundled — no CDN.
- Audit checklist: replace every remaining inline near-default `style={{fontFamily...}}` with a token/class; verify AA contrast; verify no browser-default-looking text remains on any screen.

---

## 4. Forge (deterministic engine + safety) — plan only

Implement per `02_strategy/02` exactly; **do not** implement logic/crisis UI until reviewed.
- **Engine seam:** `generateResponse(input): ForgeResponse` is the only future-AI-swappable unit; everything else (UI, storage, safety) is frozen around it.
- **Seven states** → deterministic template families (3 variants each), selected by `hash(stateKey+localDate+note) % variants` (reproducible, testable). Output: acknowledgment → grounded reframe → one action → est. minutes → [Next rep] → completion → saved `forgeEntry` + `proofEvent`.
- **Safety rails FIRST** (`safetyScreen()` before any template): self-harm/crisis, injury, severe exhaustion, life-crisis → **gentle mode**, no task, no time-box; US/MA copy (988 call/text, 911, trusted person) from settings; never diagnose, never shame, no tough-love.
- **Daily-commitment** toggle wires into the streak (non-scheduled days).
- Forge surface stays calm behind the (revised, luminous) Forge backplate; safety mode never over busy imagery, never alarming.
- Tests: deterministic output snapshots per (state,date,note); safety lexicon must-flag / must-not-flag fixtures.

---

## 5. Stage 3 sequencing (proposed, for review)
1. Real proof engine (streak/records/PR derivations) + Proof surface + completion reveal.
2. Beginner logger UX overhaul (targets, weight→complete, RPE disclosure, explanations, edit/recompute).
3. Typography pass (consistent Fraunces titles incl. date/context).
4. Forge engine + safety (separate, carefully reviewed sub-PR).
Each ships as small commits on a Stage 3 functional branch **stacked on Stage 2** until PR #7/#8 merge; then retarget to `main`.

**Out of scope until explicitly approved:** any Forge crisis/988-911 UI, Notes, cloud/accounts/sync, and anything not in the strategy docs.
