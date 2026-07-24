# AURELIS — V1 Product Spec

Mobile-first, local-first web app. Portrait iPhone is the primary target. Offline-capable, installable (PWA), no login, no server, no secrets in client.

---

## 1. Scope

### In scope (V1)
- Import a training split via **ASF** + guided editor.
- **Today** view: know exactly what to do today.
- **Logger**: sets, reps, weight, RPE, per-set notes, rest timer, session completion.
- **Forge**: deterministic resistance → one next action, with saved commitment/proof.
- **Proof**: completion bar, consistency streak (Chrome Crest), chronological timeline.
- **Private notes**.
- **Strength progress** for major lifts — target V1.5 (data captured from V1 day one).
- Local export/import of all data (JSON) for backup/portability.

### Out of scope (V1, deferred)
- Accounts, cloud sync, multi-device sync, social/sharing.
- Real AI calls, any network request that carries user data.
- Wearables/HealthKit/calendar integrations.
- Multiple simultaneous active programs (one active split at a time).

---

## 2. Screens / IA

Bottom tab bar (thumb-reachable, 4 tabs) + a floating Forge entry.

1. **Today** (home)
   - Date + today's status (scheduled workout / recovery / rest).
   - The planned day card: exercises preview, "Start workout".
   - Today's completion bar. Current Chrome Crest (tap → Proof).
   - Quick "Open Forge" if resistance shows up.
2. **Train**
   - Active session logger (see §5). Also access to the split overview + guided editor + ASF import.
3. **Forge**
   - State picker + short note → response → Next rep → completion (see doc 02).
4. **Proof**
   - Completion bar (day/week), streak + crest, chronological proof timeline, PRs, strength progress (V1.5), all-time best.
- **Notes**: private notes list (reachable from Today or Proof; own route).
- **Settings**: units (lb/kg), reduced-motion, data export/import, wipe, about. Timezone = device local (read-only).

---

## 3. Import & program (summary; full grammar in doc 03)
- User pastes ASF text → parser → **guided editor** to confirm/fix → saved as the active split.
- Split defines: name, weekday schedule, ordered days, each day's ordered exercises (sets, rep range, optional RPE, optional rest).
- Editing the split never destroys logged sessions (sessions reference a snapshot).

---

## 4. Today logic
- Resolve today's **planned status** from the split schedule + any user overrides:
  - `SCHEDULED_WORKOUT(dayName)` — a split day maps to today's weekday.
  - `PLANNED_RECOVERY` — user marked today as recovery.
  - `REST` — nothing scheduled.
- If multiple candidate days map to one weekday, user picks (rotation A/B handled by "next up" pointer).
- Today shows exactly one primary CTA: **Start workout** / **Mark recovery honored** / **Set daily commitment** (rest days).

---

## 5. Workout logger (the tightest loop — must be instant, one-handed)
Per exercise, per set the user records: **weight, reps, RPE (optional), note (optional)**, and marks the set done.
- **Rest timer**: starts on set-complete; shows remaining; calm pulse at 10s left; skip/extend. CSS/SVG-driven, not per-frame JS (see design doc).
- **Set targets** prefilled from the template (target reps range, target RPE); last-session values shown as ghost defaults to beat.
- **Session completion (locked flow):** completion requires an **intentional final confirmation** — a primary button labeled **"Record proof" / "Complete session"** (never auto-completes silently).
  1. **Persist first:** write to IndexedDB before any animation — `session` (completed) + its `setLogs`, `proofEvent(type=workout)`, detected `PR`s, and update the `records` lifetime tallies (`totalSessionsKept`, `totalWorkoutsCompleted`, `bestStreak`).
  2. **Recompute** streak for today (see doc 04).
  3. **Then** play the brief Ceremonial Chrome completion animation (see design doc §5: **450–650ms**) — Chrome Crest gains a clean silver edge-light, one botanical/cobalt detail resolves, one restrained prismatic glint passes across it.
  4. **Show a clear result line**, e.g. **"Proof recorded — 1 session kept."**
  - **Forbidden:** fire, swords, XP, coins, particles, confetti, or game-like reward language. Reduced-motion → static crest with the same result line, no animation.
- **Edit**: a completed session can be edited later; editing recomputes streak/PRs deterministically (doc 04 §Recompute).
- **Abandon**: an incomplete session can be saved as partial (does not qualify as a streak day unless it meets the completion rule) or discarded.

**Completion rule (what counts as "workout completed"):** a session qualifies when the user taps **Finish** and at least one working set is logged for **every** planned exercise, OR the user explicitly confirms "Finish early — count it." (We store `qualified: boolean` explicitly so the rule is auditable, not inferred later.)

---

## 6. Forge (summary; full spec in doc 02)
Input: a state chip (Overthinking · Low energy · Avoiding training · Avoiding school/work · Want to quit · Need recovery · Need to reset) + optional short note.
Output, deterministically generated on-device: **acknowledgment → grounded reframe → exactly one next action → estimated time → [Next rep] → completion confirmation → saved commitment/proof entry.**
Safety rails intercept crisis/self-harm/injury/severe-exhaustion input before any action is suggested.

---

## 7. Proof (summary; full data rules in doc 04)
- **Completion bar**: % of today's / this week's planned items completed.
- **Streak + Chrome Crest**: current streak, crest level + emblem, all-time best.
- **Timeline**: reverse-chronological list of `proofEvents` (completed workouts, completed Forge commitments, PRs, crest level-ups, recovery-honored).
- **Strength progress** (V1.5): per major lift, est. 1RM / top set over time.

---

## 8. Notes
- Simple private, local, timestamped notes. Markdown-lite optional. No linking required in V1.

---

## 9. Non-functional requirements
- **Performance (iPhone):** first meaningful paint < 2s on mid-tier iPhone over cache; interactions < 100ms; logger taps feel instant. No layout jank during rest timer. Motion is transform/opacity only.
- **Offline:** full functionality offline after first load (service worker + Dexie). No feature requires network.
- **Accessibility:** WCAG AA contrast on cobalt surfaces; 44px min touch targets; respects `prefers-reduced-motion`; VoiceOver labels on all controls.
- **Privacy:** no analytics, no network calls carrying user data in V1. All data on-device.
- **Data safety:** every write is a discrete event; destructive actions (wipe, discard session) confirm first; export before wipe is offered.

---

## 10. Acceptance criteria (V1 "done")
1. Paste the sample ASF (doc 03) → guided editor → active split with correct days/exercises/rest.
2. Today shows the correct planned day for the device's local weekday.
3. Log a full session; rest timer runs; finishing shows completion state and writes a proof event + streak update.
4. A PR (heavier top set than history) is detected and appears in the timeline.
5. Forge: each of the 7 states returns a valid ack/reframe/one-action/time/Next-rep; completing it writes a commitment proof entry.
6. Forge safety: a crisis-pattern note routes to safety mode (no task assigned, supportive copy, resources).
7. Streak: qualifying day increments; a missed scheduled day breaks it; recovery-honored bridges it; all-time best persists.
8. Edit a past session → streak/PRs recompute correctly and deterministically.
9. Reload offline → all data intact, app fully usable.
10. `prefers-reduced-motion` disables non-essential motion everywhere.
11. Export → wipe → import restores identical state.
