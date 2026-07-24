/**
 * Session — the workout logger (Stage 2). Log sets (weight/reps/RPE),
 * mark sets done (which starts a rest timer using the exercise's rest),
 * then finish. One-handed on iPhone; every value persists to Dexie and
 * survives reload. NO streak/PR/completion-reveal (Stage 3).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScreenSurface } from "../components/ScreenSurface";
import { RestTimer } from "../components/RestTimer";
import {
  getSession,
  upsertSetLog,
  finishSession,
  type SessionSnapshot,
} from "../data/repositories/sessionRepo";

interface Cell {
  weight: string;
  reps: string;
  rpe: string;
  done: boolean;
}
type Grid = Record<string, Cell>;
const cellKey = (exKey: string, i: number) => `${exKey}:${i}`;

export function Session() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [grid, setGrid] = useState<Grid>({});
  const [rest, setRest] = useState<{ secs: number } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getSession(id).then((s) => {
      if (!alive || !s) {
        if (alive) setReady(true);
        return;
      }
      const g: Grid = {};
      for (const l of s.logs) {
        g[cellKey(l.exerciseKey, l.setIndex)] = {
          weight: l.weight?.toString() ?? "",
          reps: l.reps?.toString() ?? "",
          rpe: l.rpe?.toString() ?? "",
          done: l.done,
        };
      }
      setSnapshot(s.snapshot);
      setGrid(g);
      setReady(true);
    });
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

  // Tapping Finish is the intentional confirmation that the session counts
  // (doc 01 §5: complete when all exercises have a set OR the user confirms).
  async function onFinish() {
    await finishSession(id, true);
    nav("/today");
  }

  if (ready && !snapshot) {
    return (
      <ScreenSurface labelledBy="session-heading">
        <h1 id="session-heading" className="pt-2" style={{ fontFamily: "var(--font-display)" }}>Session not found</h1>
        <button type="button" onClick={() => nav("/train")} className="aur-touch mt-4 rounded-full px-5"
          style={{ background: "var(--aur-chrome-50)", color: "var(--aur-night)", border: "none" }}>
          Back to Train
        </button>
      </ScreenSurface>
    );
  }

  return (
    <ScreenSurface labelledBy="session-heading">
      <header className="pt-2">
        <p className="m-0 text-[0.6875rem] uppercase tracking-[0.18em]" style={{ color: "var(--aur-ink-muted)" }}>
          Logging
        </p>
        <h1 id="session-heading" className="m-0" style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-h1)", fontWeight: 500 }}>
          {snapshot?.dayName}
        </h1>
      </header>

      {rest && (
        <div className="sticky top-2 z-10 mt-3">
          <RestTimer seconds={rest.secs} onDone={() => setRest(null)} onDismiss={() => setRest(null)} />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {snapshot?.exercises.map((ex) => {
          const repLabel =
            ex.repMin != null && ex.repMax != null
              ? ex.repMin === ex.repMax ? `${ex.repMin}` : `${ex.repMin}-${ex.repMax}`
              : "AMRAP";
          return (
            <section key={ex.key} className="aur-chrome-surface p-4" aria-label={ex.name}>
              <div className="flex items-baseline justify-between">
                <h2 className="m-0" style={{ fontSize: "var(--text-h2)", fontFamily: "var(--font-display)", fontWeight: 500 }}>{ex.name}</h2>
                <span className="font-mono text-small" style={{ color: "var(--aur-ink-muted)" }}>
                  {ex.sets}×{repLabel}{ex.rpeMin ? ` · RPE ${ex.rpeMin}${ex.rpeMax && ex.rpeMax !== ex.rpeMin ? `-${ex.rpeMax}` : ""}` : ""}
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {Array.from({ length: Math.max(1, ex.sets) }).map((_, i) => {
                  const k = cellKey(ex.key, i);
                  const c = cell(k);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-5 font-mono text-small" style={{ color: "var(--aur-ink-faint)" }}>{i + 1}</span>
                      <NumInput label={`Set ${i + 1} weight`} value={c.weight} placeholder="wt"
                        onChange={(v) => update(ex.key, ex.name, i, { weight: v })} />
                      <NumInput label={`Set ${i + 1} reps`} value={c.reps} placeholder="reps"
                        onChange={(v) => update(ex.key, ex.name, i, { reps: v })} />
                      <NumInput label={`Set ${i + 1} RPE`} value={c.rpe} placeholder="rpe"
                        onChange={(v) => update(ex.key, ex.name, i, { rpe: v })} />
                      <button
                        type="button"
                        aria-pressed={c.done}
                        aria-label={`Mark set ${i + 1} ${c.done ? "not done" : "done"}`}
                        onClick={() => {
                          const next = update(ex.key, ex.name, i, { done: !c.done });
                          if (next.done && ex.restSec) setRest({ secs: ex.restSec });
                        }}
                        className="aur-touch grid place-items-center rounded-full"
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
            </section>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onFinish()}
          className="aur-touch w-full rounded-full text-body font-medium"
          style={{
            background: qualified ? "var(--aur-chrome-50)" : "rgba(210,217,230,0.14)",
            color: qualified ? "var(--aur-night)" : "var(--aur-ink)",
            border: "none", padding: "0.875rem 1.5rem",
          }}
        >
          {qualified ? "Finish session" : "Finish early — count it"}
        </button>
        <p className="m-0 text-center text-[0.6875rem]" style={{ color: "var(--aur-ink-faint)" }}>
          Saved locally as you go. Streak & proof arrive in Stage 3.
        </p>
      </div>
    </ScreenSurface>
  );
}

function NumInput({
  label, value, placeholder, onChange,
}: { label: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <input
      aria-label={label}
      value={value}
      inputMode="decimal"
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
      className="aur-touch min-w-0 flex-1 rounded-lg px-2 text-center font-mono text-small"
      style={{
        height: 44, color: "var(--aur-ink)",
        background: "rgba(7,12,24,0.55)", border: "1px solid rgba(210,217,230,0.14)",
      }}
    />
  );
}
