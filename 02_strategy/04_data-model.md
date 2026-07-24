# Data Model, Streak Algorithm & Recompute

Storage: **Dexie / IndexedDB**, local only. Zustand holds ephemeral/UI state and hydrates from Dexie.
All entities carry **sync-ready fields** so a future backend can reconcile without migration (`id` = UUID v4 string, `updatedAt` = epoch ms, `deletedAt` = epoch ms | null soft-delete, `deviceId`). [CONFIRM-A]

Dates for streak logic use **device-local calendar day** as `YYYY-MM-DD` (`dateLocal`). Timestamps are epoch ms UTC.

---

## 1. Tables (Dexie stores)

```ts
// &id = primary key (uuid). Indexes noted after.
splits        // &id, active, updatedAt
  { id, name, scheduleWeekdays: number[] /*0=Sun..6=Sat*/, units:'lb'|'kg',
    rawASF:string, notes?:string, active:boolean, createdAt, updatedAt, deletedAt, deviceId }

splitDays     // &id, splitId, order
  { id, splitId, name, order, note?, updatedAt, deletedAt }

templateExercises // &id, dayId, order
  { id, dayId, order, name, sets:number, repMin:number, repMax:number,
    repScheme:'range'|'fixed'|'amrap', perSide:boolean,
    rpeMin?:number, rpeMax?:number, restSec?:number, note?, updatedAt, deletedAt }

sessions      // &id, dateLocal, splitDayId, status, updatedAt
  { id, dateLocal, splitDayId?, splitDaySnapshot:{name, exercises:[...]}, // snapshot so template edits don't rewrite history
    status:'active'|'completed'|'partial'|'discarded',
    qualified:boolean, startedAt, completedAt?, notes?, updatedAt, deletedAt, deviceId }

setLogs       // &id, sessionId, exerciseKey, order
  { id, sessionId, exerciseKey /*stable id from snapshot*/, exerciseName,
    setIndex:number, weight?:number, reps?:number, rpe?:number,
    restActualSec?:number, done:boolean, note?, updatedAt, deletedAt }

forgeEntries  // &id, dateLocal, status
  { id, dateLocal, stateKey, note?, acknowledgment, reframe, action, estMinutes,
    tone, safety:boolean, status:'open'|'done'|'skipped',
    isDailyCommitment:boolean, completedAt?, updatedAt, deletedAt, deviceId }

prs           // &id, exerciseName, dateLocal
  { id, exerciseName, metric:'topWeight'|'est1RM'|'repPR', value:number,
    dateLocal, sessionId, updatedAt, deletedAt }

proofEvents   // &id, dateLocal, type, createdAt
  { id, dateLocal, type:'workout'|'forge'|'pr'|'recovery'|'crest_levelup',
    refId?, title, summary?, createdAt, updatedAt, deletedAt }

dayMarks      // &id, dateLocal (unique)  -- explicit per-day user intent
  { id, dateLocal, plannedRecovery:boolean, recoveryHonored:boolean,
    dailyCommitmentForgeId?:string, updatedAt, deletedAt }

notes         // &id, updatedAt
  { id, title?, body, createdAt, updatedAt, deletedAt }

settings      // single row id='app'
  { id:'app', units:'lb'|'kg', reducedMotion:'auto'|'on'|'off',
    streakCountMode:'sessions', // LOCKED to 'sessions' (calendar removed from V1)
    crisisRegion:'US-MA',       // LOCKED (US / Massachusetts) — see doc 02 §5
    lastCrestLevel:number, updatedAt }

records       // single row id='alltime' — LOCKED separate lifetime tallies
  { id:'alltime', totalSessionsKept:number, totalWorkoutsCompleted:number,
    totalCommitmentsCompleted:number, bestStreak:number, updatedAt }

meta          // { id:'meta', schemaVersion:number }
```

---

## 2. Day status resolution
For any `dateLocal`, resolve exactly one status by folding these inputs: the active split schedule, `dayMarks`, `sessions`, `forgeEntries`.

```
resolveDayStatus(date):
  hasScheduledWorkout = weekdayOf(date) ∈ activeSplit.scheduleWeekdays
  mark = dayMarks[date]
  completedWorkout = ∃ session where dateLocal==date and status=='completed' and qualified
  dailyCommitmentDone = mark?.dailyCommitmentForgeId
        && forgeEntries[that id].status=='done'

  if completedWorkout:                       return QUALIFIED_WORKOUT
  if mark?.plannedRecovery && mark.recoveryHonored: return RECOVERY_HONORED
  if !hasScheduledWorkout && dailyCommitmentDone:   return QUALIFIED_COMMITMENT
  if hasScheduledWorkout && !completedWorkout:      return MISSED        // if date < today
  if mark?.dailyCommitmentForgeId && !dailyCommitmentDone && !hasScheduledWorkout:
                                                     return MISSED       // if date < today
  if mark?.plannedRecovery && !mark.recoveryHonored: return RECOVERY_PLANNED // neutral until resolved
  return REST_EMPTY
```
- **QUALIFIED_WORKOUT / QUALIFIED_COMMITMENT** → counts as a kept day.
- **RECOVERY_HONORED / RECOVERY_PLANNED / REST_EMPTY** → neutral: neither breaks nor increments.
- **MISSED** → breaks the streak (only evaluated for days strictly before today; today is never "missed" yet).

Key rule encodings from your spec:
- Workout completion counts **once per local day** (multiple sessions same day still = one qualified day).
- A Forge commitment qualifies **only** when no workout is scheduled **and** it's explicitly the day's commitment (`dailyCommitmentForgeId`).
- Planned recovery **never breaks** the streak; `recoveryHonored` is the honored flag; it does **not** inflate the workout count (it's neutral, not qualifying).
- Missing a day you were obligated to (scheduled workout, or a self-set daily commitment on a non-scheduled day) → MISSED → breaks streak.

---

## 3. Streak algorithm (deterministic, pure function of the event log)

```
computeStreak(today):
  # 1. current streak
  streak = 0
  cursor = today
  loop:
    s = resolveDayStatus(cursor)
    if s == QUALIFIED_WORKOUT or s == QUALIFIED_COMMITMENT:
        streak += (countMode=='sessions' ? 1 : 1)   # sessions: +1 per kept day
        cursor = cursor - 1 day; continue
    if s in {RECOVERY_HONORED, RECOVERY_PLANNED, REST_EMPTY}:
        # neutral bridge
        if countMode=='calendar' and streak>0: 
            # calendar mode counts elapsed days in the run, incl. bridges
            streak += 1
        cursor = cursor - 1 day; continue
    if s == MISSED:
        break
    break
  # (today counts only if it is itself QUALIFIED; a not-yet-done today is neutral, streak shows prior run)

  # 2. all-time best = max over history of the same walk; persisted incrementally
  best = max(settings.streakBest, streak)
```

**`streakCountMode` — LOCKED to `'sessions'`:**
- Streak number = count of **kept obligations** (qualifying workouts + qualifying daily commitments) in the unbroken run. Bridges (recovery-honored, empty days) never add.
- The **first** qualifying completion creates a **1-session streak immediately** — streak does not require calendar time to pass.
- Cannot be inflated by empty days. Crest levels (1–2 … 60+) count kept sessions. The `'calendar'` mode is dropped from V1 (the walk below still shows where it hooked in, for historical clarity).

Crest level is a pure lookup on the streak number:
```
level(n): 0→Unmarked · 1-2→First Mark · 3-6→Polished Mark · 7-13→Silver Crest
          · 14-29→Cobalt Crest · 30-59→Prismatic Crest · 60+→Ascendant Crest
```
On level increase vs `settings.lastCrestLevel` → write `proofEvent(type='crest_levelup')` and surface the emblem transition.

---

## 4. Edit / recompute safety
Because streak, crest, and PRs are **derived** from the stored event log, any edit is safe by **replay**:
1. User edits/deletes a past `session` or its `setLogs`, or toggles `recoveryHonored` / daily commitment.
2. Recompute affected derived data **from that date forward**:
   - re-run `resolveDayStatus` for changed days,
   - re-run `computeStreak(today)`,
   - re-derive PRs for the touched exercises (rescan sessions chronologically),
   - reconcile `proofEvents` (remove events whose source no longer qualifies; add newly-valid ones).
3. All recompute is deterministic and idempotent — running it twice yields the same result.
4. Never mutate history destructively without the derivation being reproducible; soft-delete (`deletedAt`) instead of hard delete so recompute and future sync stay consistent.

---

## 5. PR detection
On session completion (and on recompute), for each exercise:
- `topWeight` PR: heaviest single logged set weight > prior max for that `exerciseName`.
- `est1RM` PR: Epley `weight*(1+reps/30)` > prior max.
- `repPR`: most reps at ≥ a previously used weight.
Write a `pr` row + `proofEvent(type='pr')` only on genuine improvement. Recompute rescans in date order so edits can revoke a stale PR.

---

## 6. Export / import
- **Export:** full dump of all tables to a single JSON file (versioned by `meta.schemaVersion`). Offered before any wipe.
- **Import:** validates schema version, replaces or merges (V1: replace). Restores identical state → recompute runs once on load.
