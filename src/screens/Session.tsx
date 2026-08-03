/**
 * Session — beginner-friendly workout logger (Stage 3).
 * Targets come from the split (reps prefilled, range shown as a hint).
 * The common action is simple: enter weight, tap Complete. RPE is hidden
 * behind a plain-language "Advanced details" disclosure. Ghost defaults
 * show last time's numbers. Everything persists locally and survives
 * reload. No streak/PR/completion reveal here (Stage 3 proof engine).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScreenSurface } from "../components/ScreenSurface";
import { RestTimer } from "../components/RestTimer";
import { CompletionReveal } from "../components/CompletionReveal";
import { ExercisePreview } from "../components/ExercisePreview";
import { SetCheck } from "../components/SetCheck";
import { ExerciseDone, Collapsible } from "../components/ExerciseDone";
import {
  getSession,
  upsertSetLog,
  liftDaysFor,
  type SessionSnapshot,
  type SessionSnapshotExercise,
} from "../data/repositories/sessionRepo";
import { recordProof, replayDerivedState, type ProofResult } from "../features/proof/proofRepo";
import { crestStateForSessions } from "../lib/crest";
import { useUiStore } from "../state/ui";
import { restReason, restSecondsFor } from "../features/training/rest";
import { suggestNext, suggestionLabel, VERDICT_LABEL, type LiftDay } from "../features/training/progression";
import { displayName } from "../features/exercises/displayName";
import { getDbStatus, onDbStatus, type DbStatus } from "../data/db";

interface Cell {
  weight: string;
  reps: string;
  rpe: string;
  done: boolean;
}
type Grid = Record<string, Cell>;
const cellKey = (exKey: string, i: number) => `${exKey}:${i}`;


function targetReps(ex: SessionSnapshotExercise): string {
  if (ex.repMax == null) return ""; // AMRAP → user enters actual
  return String(ex.repMax);
}
function repRangeHint(ex: SessionSnapshotExercise): string {
  if (ex.repMin == null || ex.repMax == null) return "AMRAP";
  return ex.repMin === ex.repMax ? `${ex.repMin} reps` : `${ex.repMin}–${ex.repMax} reps`;
}

export function Session() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [grid, setGrid] = useState<Grid>({});
  /* The raw history per lift. The suggestion itself is derived at
     render, so switching units in Settings re-rounds it immediately
     instead of waiting for the session to be reopened. */
  const [liftDays, setLiftDays] = useState<Record<string, LiftDay[]>>({});
  /** Exercises the user has re-opened after finishing them. */
  const [reopened, setReopened] = useState<Record<string, boolean>>({});
  const [advanced, setAdvanced] = useState<Record<string, boolean>>({});
  const [rest, setRest] = useState<{ secs: number; reason: string } | null>(null);
  // Preferences are live: changing units or the effort mode in Settings
  // is reflected here without a reload.
  const units = useUiStore((s) => s.units);
  const rpeMode = useUiStore((s) => s.rpeMode);
  const defaultRestSec = useUiStore((s) => s.defaultRestSec);
  const [ready, setReady] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState<ProofResult | null>(null);
  /** Already recorded: this visit is an edit, not a first completion. */
  const [recorded, setRecorded] = useState(false);
  const [saved, setSaved] = useState(false);
  /** A write actually failed — never let that pass unnoticed. */
  const [writeError, setWriteError] = useState(false);
  const [dbStatus, setDbStatusState] = useState<DbStatus>(getDbStatus());

  useEffect(() => onDbStatus(setDbStatusState), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getSession(id);
      if (!alive) return;
      if (!s) {
        setReady(true);
        return;
      }
      // Seed grid from existing logs; prefill reps from targets otherwise.
      const g: Grid = {};
      for (const ex of s.snapshot.exercises) {
        for (let i = 0; i < Math.max(1, ex.sets); i++) {
          g[cellKey(ex.key, i)] = { weight: "", reps: targetReps(ex), rpe: "", done: false };
        }
      }
      for (const l of s.logs) {
        g[cellKey(l.exerciseKey, l.setIndex)] = {
          weight: l.weight?.toString() ?? "",
          reps: l.reps?.toString() ?? "",
          rpe: l.rpe?.toString() ?? "",
          done: l.done,
        };
      }
      /* What to put on the bar next, per exercise. Read from the whole
         history of the lift rather than just last time, so a stall is
         visible and the suggestion can say why. */
      const gh: Record<string, LiftDay[]> = {};
      await Promise.all(
        s.snapshot.exercises.map(async (ex) => {
          gh[ex.key] = await liftDaysFor(ex.name);
        }),
      );
      if (!alive) return;
      setSnapshot(s.snapshot);
      setGrid(g);
      setLiftDays(gh);
      setRecorded(s.session.status === "completed" || s.session.status === "partial");
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const cell = (k: string): Cell => grid[k] ?? { weight: "", reps: "", rpe: "", done: false };

  const persist = useCallback(
    async (exKey: string, exName: string, i: number, c: Cell) => {
      await upsertSetLog({
        sessionId: id,
        exerciseKey: exKey,
        exerciseName: exName,
        setIndex: i,
        weight: c.weight ? Number(c.weight) : undefined,
        reps: c.reps ? Number(c.reps) : undefined,
        rpe: c.rpe ? Number(c.rpe) : undefined,
        done: c.done,
      });
    },
    [id],
  );

  /**
   * Typing is optimistic — the field must never lag a keystroke — but the
   * write is tracked so a failure is visible rather than silent.
   */
  const update = (exKey: string, exName: string, i: number, patch: Partial<Cell>) => {
    const k = cellKey(exKey, i);
    const next = { ...cell(k), ...patch };
    setGrid((g) => ({ ...g, [k]: next }));
    persist(exKey, exName, i, next)
      .then(() => setWriteError(false))
      .catch((err) => {
        console.error("[forge] could not save that set", err);
        setWriteError(true);
      });
    if (recorded) setSaved(false); // the replay is now out of date
    return next;
  };

  /**
   * Completing a set AWAITS the write. Ticking a set is the moment the
   * user believes the work is recorded, so the tick must not turn green
   * on a promise that has not landed — on a phone the app can be
   * backgrounded a moment later and a pending write would be lost.
   */
  const completeSet = async (ex: SessionSnapshotExercise, i: number, done: boolean) => {
    const k = cellKey(ex.key, i);
    const next = { ...cell(k), done };
    setGrid((g) => ({ ...g, [k]: next }));
    try {
      await persist(ex.key, ex.name, i, next);
      setWriteError(false);
      if (done) {
        setRest({
          secs: restSecondsFor(ex.restSec, next.rpe, defaultRestSec),
          reason: restReason(ex.restSec, next.rpe),
        });
      }
    } catch (err) {
      console.error("[forge] could not save that set", err);
      setWriteError(true);
      setGrid((g) => ({ ...g, [k]: { ...next, done: !done } })); // don't claim it saved
    }
  };

  const qualified = useMemo(() => {
    if (!snapshot) return false;
    return snapshot.exercises.every((ex) =>
      Array.from({ length: Math.max(1, ex.sets) }).some((_, i) => cell(cellKey(ex.key, i)).done),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, grid]);

  async function onFinish() {
    // Tapping Finish is the intentional confirmation the session counts.
    // Persist proof FIRST; the reveal is decoration over a stored fact.
    if (finishing) return;
    setFinishing(true);
    try {
      setResult(await recordProof(id, true));
    } catch (err) {
      console.error("[forge] could not record proof", err);
      setFinishing(false);
      nav("/today");
    }
  }

  /**
   * Editing an already-recorded session. Set logs are saved as you type,
   * so this only has to replay everything derived from them — the PR
   * table and the records row — leaving no claim the log no longer
   * supports. No second reveal: nothing new was completed.
   */
  async function onSaveEdits() {
    if (finishing) return;
    setFinishing(true);
    try {
      await replayDerivedState();
      setSaved(true);
    } catch (err) {
      console.error("[forge] could not replay derived state", err);
    } finally {
      setFinishing(false);
    }
  }

  if (ready && !snapshot) {
    return (
      <ScreenSurface labelledBy="session-heading">
        <h1 id="session-heading" className="aur-title pt-2">Session not found</h1>
        <button type="button" onClick={() => nav("/train")} className="aur-touch mt-4 rounded-full px-5"
          style={{ background: "var(--aur-chrome-50)", color: "var(--aur-night)", border: "none" }}>
          Back to Train
        </button>
      </ScreenSurface>
    );
  }

  return (
    <ScreenSurface labelledBy="session-heading">
      {result && (
        <CompletionReveal
          result={result}
          crestLevel={crestStateForSessions(result.keptCount).level}
          onDone={() => nav("/today")}
        />
      )}
      <header className="pt-2">
        <p className="aur-label m-0">{recorded ? "Recorded · editing" : "Logging"} · {units}</p>
        <h1 id="session-heading" className="aur-section">{snapshot?.dayName}</h1>
      </header>

      {/* Persistence is the whole promise of a local-first app. If it is
          broken, say so at the top of the screen the user is trusting. */}
      {(dbStatus === "unavailable" || writeError) && (
        <div
          role="alert"
          className="mt-3 rounded-xl p-3"
          style={{ background: "rgba(190,60,60,0.14)", border: "1px solid var(--aur-danger)" }}
        >
          <p className="m-0 text-small" style={{ color: "var(--aur-ink)" }}>
            {dbStatus === "unavailable"
              ? "This browser is blocking local storage, so nothing can be saved. In Safari, check that Private Browsing is off and site data is allowed."
              : "That set could not be saved. Your last change may not be stored."}
          </p>
        </div>
      )}

      {rest && (
        <div className="sticky top-2 z-10 mt-3">
          <RestTimer
            seconds={rest.secs}
            reason={rest.reason}
            onDone={() => setRest(null)}
            onDismiss={() => setRest(null)}
          />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {snapshot?.exercises.map((ex) => {
          // Effort check: advanced always shows it, simple hides it behind
          // a plain-language disclosure, hidden leaves it out entirely.
          const disclosed = advanced[ex.key] ?? false;
          const showEffort = rpeMode === "advanced" || (rpeMode === "simple" && disclosed);
          const suggestion = suggestNext(
            liftDays[ex.key] ?? [],
            {
              sets: Math.max(1, ex.sets),
              repMin: ex.repMin ?? 8,
              repMax: ex.repMax ?? ex.repMin ?? 12,
            },
            units,
          );
          /* Every set marked = this lift is finished, so the block of
             inputs folds away to one line. Re-openable, because a
             mistyped rep has to stay fixable. */
          const setCount = Math.max(1, ex.sets);
          const cells = Array.from({ length: setCount }, (_, i) => cell(cellKey(ex.key, i)));
          const exerciseDone = cells.every((c) => c.done);
          const isOpen = !exerciseDone || (reopened[ex.key] ?? false);
          const doneSummary = (() => {
            const logged = cells.filter((c) => c.done && c.weight);
            if (logged.length === 0) return `${setCount} ${setCount === 1 ? "set" : "sets"} done`;
            const w = logged[0].weight;
            const sameWeight = logged.every((c) => c.weight === w);
            const reps = logged.map((c) => c.reps || "?").join(", ");
            return sameWeight
              ? `${logged.length} × ${w} ${units} · ${reps}`
              : logged.map((c) => `${c.weight}×${c.reps || "?"}`).join(" · ");
          })();

          return (
            <section key={ex.key} className="aur-chrome-surface p-4" aria-label={displayName(ex.name)}>
              {exerciseDone ? (
                <ExerciseDone
                  name={displayName(ex.name)}
                  summary={doneSummary}
                  open={isOpen}
                  onToggle={() => setReopened((r) => ({ ...r, [ex.key]: !isOpen }))}
                />
              ) : (
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="aur-section">{displayName(ex.name)}</h2>
                  <span className="aur-metric text-small" style={{ color: "var(--aur-ink-muted)" }}>
                    {ex.sets} × {repRangeHint(ex)}
                  </span>
                </div>
              )}
              <Collapsible open={isOpen}>
              {/*
                A suggestion, never a prescription.

                Read from the whole history of this lift, not just last
                time, so it can tell "you earned the jump" apart from
                "you have been stuck here for three weeks". Tapping it
                fills every empty set, so the common case is one tap
                instead of four — but it only ever fills BLANKS, because
                overwriting a number you typed would be the app editing
                your record.

                The reason is always shown. A suggestion you cannot
                argue with is just an instruction.
              */}
              {suggestion.weight != null && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      for (let i = 0; i < Math.max(1, ex.sets); i++) {
                        const c = cell(cellKey(ex.key, i));
                        if (!c.weight) {
                          update(ex.key, ex.name, i, {
                            weight: String(suggestion.weight),
                            reps: c.reps || String(suggestion.repsLow),
                          });
                        }
                      }
                    }}
                    className="aur-press aur-touch flex w-full items-center justify-between gap-3 rounded-[10px] px-3 text-left"
                    style={{
                      background: "var(--aur-glass-tint)",
                      border: "1px solid var(--aur-glass-rim)",
                      color: "var(--aur-ink)",
                      paddingTop: "0.5rem",
                      paddingBottom: "0.5rem",
                    }}
                  >
                    <span className="min-w-0">
                      <span className="aur-label m-0 block" style={{ color: "var(--aur-chrome-50)" }}>
                        {VERDICT_LABEL[suggestion.verdict]}
                      </span>
                      <span className="aur-metric block text-body">
                        {suggestionLabel(suggestion, units)}
                      </span>
                    </span>
                    <span className="aur-meta shrink-0">tap to fill</span>
                  </button>
                  <p className="aur-meta m-0 mt-1">{suggestion.reason}</p>
                </div>
              )}
              {suggestion.weight == null && (
                <p className="aur-meta m-0 mt-2">{suggestion.reason}</p>
              )}

              {/* "Not sure what this looks like?" — a photo on demand. */}
              <ExercisePreview name={ex.name} />

              <div className="mt-3 flex flex-col gap-2">
                {Array.from({ length: Math.max(1, ex.sets) }).map((_, i) => {
                  const k = cellKey(ex.key, i);
                  const c = cell(k);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-4 shrink-0 aur-metric text-small" style={{ color: "var(--aur-ink-faint)" }}>{i + 1}</span>
                      <label className="sr-only" htmlFor={`${k}-w`}>{`Set ${i + 1} weight in ${units}`}</label>
                      <div className="relative flex-1">
                        <input
                          id={`${k}-w`}
                          value={c.weight}
                          inputMode="decimal"
                          placeholder={suggestion.weight != null ? String(suggestion.weight) : units}
                          onChange={(e) => update(ex.key, ex.name, i, { weight: e.target.value.replace(/[^\d.]/g, "") })}
                          className="aur-touch w-full rounded-lg px-2 text-center aur-metric"
                          style={{ height: 44, color: "var(--aur-ink)", background: "rgba(7,12,24,0.55)", border: "1px solid rgba(210,217,230,0.14)" }}
                        />
                      </div>
                      <span className="aur-meta shrink-0" style={{ width: 14 }}>×</span>
                      <label className="sr-only" htmlFor={`${k}-r`}>{`Set ${i + 1} reps`}</label>
                      <input
                        id={`${k}-r`}
                        value={c.reps}
                        inputMode="numeric"
                        placeholder="reps"
                        onChange={(e) => update(ex.key, ex.name, i, { reps: e.target.value.replace(/[^\d]/g, "") })}
                        className="aur-touch w-14 shrink-0 rounded-lg px-2 text-center aur-metric"
                        style={{ height: 44, color: "var(--aur-ink)", background: "rgba(7,12,24,0.55)", border: "1px solid rgba(210,217,230,0.14)" }}
                      />
                      {showEffort && (
                        <input
                          aria-label={
                            rpeMode === "advanced"
                              ? `Set ${i + 1} — RPE, 1 to 10`
                              : `Set ${i + 1} — how hard did that set feel, 1 to 10`
                          }
                          value={c.rpe}
                          inputMode="numeric"
                          placeholder={rpeMode === "advanced" ? "RPE" : "feel"}
                          onChange={(e) => update(ex.key, ex.name, i, { rpe: e.target.value.replace(/[^\d]/g, "") })}
                          className="aur-touch w-12 shrink-0 rounded-lg px-1 text-center aur-metric"
                          style={{ height: 44, color: "var(--aur-ink)", background: "rgba(7,12,24,0.45)", border: "1px solid rgba(210,217,230,0.1)" }}
                        />
                      )}
                      <SetCheck
                        done={c.done}
                        label={`Complete set ${i + 1}`}
                        onToggle={() => void completeSet(ex, i, !c.done)}
                      />
                    </div>
                  );
                })}
              </div>

              {rpeMode === "simple" && (
                <>
                  <button
                    type="button"
                    aria-expanded={disclosed}
                    onClick={() => setAdvanced((a) => ({ ...a, [ex.key]: !disclosed }))}
                    className="aur-touch mt-2 text-small"
                    style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)", padding: "0.25rem 0" }}
                  >
                    {disclosed ? "Hide effort check" : "How hard did that feel?"}
                  </button>
                  {disclosed && (
                    <p className="aur-meta m-0">
                      Rate 1–10, where 10 means you had nothing left. Always optional — a session
                      counts without it.
                    </p>
                  )}
                </>
              )}
              {rpeMode === "advanced" && (
                <p className="aur-meta m-0 mt-2">
                  RPE 1–10 (10 = no reps in reserve). Optional.
                </p>
              )}
              </Collapsible>
            </section>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {recorded ? (
          <>
            <button
              type="button"
              onClick={() => void onSaveEdits()}
              disabled={finishing}
              className="aur-touch w-full rounded-full text-body font-medium"
              style={{
                background: saved ? "rgba(210,217,230,0.16)" : "var(--aur-chrome-50)",
                color: saved ? "var(--aur-ink)" : "var(--aur-night)",
                border: "none", padding: "0.875rem 1.5rem",
                opacity: finishing ? 0.6 : 1,
              }}
            >
              {finishing ? "Recalculating…" : saved ? "Proof updated ✓" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => nav("/proof")}
              className="aur-touch w-full rounded-full text-body"
              style={{ background: "transparent", color: "var(--aur-ink-muted)", border: "none" }}
            >
              Back to Proof
            </button>
            <p className="aur-meta m-0 text-center">
              This session already counts. Saving recalculates your records from the log, so
              nothing claims a best you no longer have.
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onFinish()}
              disabled={finishing}
              className="aur-touch w-full rounded-full text-body font-medium"
              style={{
                background: qualified ? "var(--aur-chrome-50)" : "rgba(210,217,230,0.16)",
                color: qualified ? "var(--aur-night)" : "var(--aur-ink)",
                border: "none", padding: "0.875rem 1.5rem",
                opacity: finishing ? 0.6 : 1,
              }}
            >
              {finishing ? "Recording proof…" : qualified ? "Record proof" : "Record proof — count it"}
            </button>
            <p className="aur-meta m-0 text-center">
              Saved as you go. Blank sets are simply skipped. Edit anytime — your proof stays accurate.
            </p>
          </>
        )}
      </div>
    </ScreenSurface>
  );
}
