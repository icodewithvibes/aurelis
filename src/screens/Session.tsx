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
import {
  getSession,
  upsertSetLog,
  lastSetForExercise,
  type SessionSnapshot,
  type SessionSnapshotExercise,
} from "../data/repositories/sessionRepo";
import { recordProof, type ProofResult } from "../features/proof/proofRepo";
import { crestStateForSessions } from "../lib/crest";
import { getSettings } from "../data/repositories/settingsRepo";

interface Cell {
  weight: string;
  reps: string;
  rpe: string;
  done: boolean;
}
type Grid = Record<string, Cell>;
const cellKey = (exKey: string, i: number) => `${exKey}:${i}`;

const REST_DEFAULT_SEC = 90;

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
  const [ghosts, setGhosts] = useState<Record<string, { weight?: number; reps?: number }>>({});
  const [advanced, setAdvanced] = useState<Record<string, boolean>>({});
  const [rest, setRest] = useState<{ secs: number } | null>(null);
  const [units, setUnits] = useState<"lb" | "kg">("lb");
  const [ready, setReady] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [result, setResult] = useState<ProofResult | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await getSession(id);
      const settings = await getSettings();
      if (!alive) return;
      if (settings?.units) setUnits(settings.units);
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
      // Ghost defaults (last time) per exercise.
      const gh: Record<string, { weight?: number; reps?: number }> = {};
      await Promise.all(
        s.snapshot.exercises.map(async (ex) => {
          const last = await lastSetForExercise(ex.name);
          if (last) gh[ex.key] = last;
        }),
      );
      if (!alive) return;
      setSnapshot(s.snapshot);
      setGrid(g);
      setGhosts(gh);
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

  const update = (exKey: string, exName: string, i: number, patch: Partial<Cell>) => {
    const k = cellKey(exKey, i);
    const next = { ...cell(k), ...patch };
    setGrid((g) => ({ ...g, [k]: next }));
    void persist(exKey, exName, i, next);
    return next;
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
      console.error("[aurelis] could not record proof", err);
      setFinishing(false);
      nav("/today");
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
        <p className="aur-label m-0">Logging · {units}</p>
        <h1 id="session-heading" className="aur-section">{snapshot?.dayName}</h1>
      </header>

      {rest && (
        <div className="sticky top-2 z-10 mt-3">
          <RestTimer seconds={rest.secs} onDone={() => setRest(null)} onDismiss={() => setRest(null)} />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {snapshot?.exercises.map((ex) => {
          const showAdvanced = advanced[ex.key] ?? false;
          const ghost = ghosts[ex.key];
          return (
            <section key={ex.key} className="aur-chrome-surface p-4" aria-label={ex.name}>
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="aur-section">{ex.name}</h2>
                <span className="aur-metric text-small" style={{ color: "var(--aur-ink-muted)" }}>
                  {ex.sets} × {repRangeHint(ex)}
                </span>
              </div>
              {ghost && (ghost.weight != null) && (
                <p className="aur-meta m-0 mt-1">Last time: {ghost.weight} {units}{ghost.reps != null ? ` × ${ghost.reps}` : ""}</p>
              )}

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
                          placeholder={ghost?.weight != null ? String(ghost.weight) : units}
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
                      {showAdvanced && (
                        <input
                          aria-label={`Set ${i + 1} — how hard did it feel, 1 to 10`}
                          value={c.rpe}
                          inputMode="numeric"
                          placeholder="feel"
                          onChange={(e) => update(ex.key, ex.name, i, { rpe: e.target.value.replace(/[^\d]/g, "") })}
                          className="aur-touch w-12 shrink-0 rounded-lg px-1 text-center aur-metric"
                          style={{ height: 44, color: "var(--aur-ink)", background: "rgba(7,12,24,0.45)", border: "1px solid rgba(210,217,230,0.1)" }}
                        />
                      )}
                      <button
                        type="button"
                        aria-pressed={c.done}
                        aria-label={`Complete set ${i + 1}`}
                        onClick={() => {
                          const next = update(ex.key, ex.name, i, { done: !c.done });
                          if (next.done) setRest({ secs: ex.restSec ?? REST_DEFAULT_SEC });
                        }}
                        className="aur-touch grid shrink-0 place-items-center rounded-full"
                        style={{
                          width: 44, height: 44,
                          background: c.done ? "var(--aur-success)" : "rgba(210,217,230,0.1)",
                          color: c.done ? "var(--aur-night)" : "var(--aur-ink-muted)",
                          border: "none",
                        }}
                      >
                        ✓
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                aria-expanded={showAdvanced}
                onClick={() => setAdvanced((a) => ({ ...a, [ex.key]: !showAdvanced }))}
                className="aur-touch mt-2 text-small"
                style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)", padding: "0.25rem 0" }}
              >
                {showAdvanced ? "Hide advanced" : "Advanced details"}
              </button>
              {showAdvanced && (
                <p className="aur-meta m-0">"Feel" = how hard the set felt, 1–10 (10 = no reps left). Optional.</p>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-2">
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
      </div>
    </ScreenSurface>
  );
}
