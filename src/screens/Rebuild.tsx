/**
 * Rebuild — changing programs without starting from nothing.
 *
 * The onboarding assumes you have never trained here. That is the wrong
 * assumption for someone three weeks into a split that is working, and
 * it is exactly the case that matters: an upper/lower week putting size
 * on, with forearms, abs and lower back never trained. Sending that
 * person back through "what are you after?" throws away everything the
 * app knows about them.
 *
 * So this reads what you have actually been doing first — which split,
 * how long, and what it never trains — and offers two honest routes:
 * keep the program and close the holes, or move to a different one.
 *
 * The default is KEEP. A program that is working is evidence, and the
 * app should not talk you off one because a questionnaire changed.
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScreenSurface } from "../components/ScreenSurface";
import { ExercisePreview } from "../components/ExercisePreview";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import { useAsync } from "../hooks/useAsync";
import { commitImport } from "../features/asf/importSplit";
import { parseASF } from "../features/asf/parse";
import { displayName } from "../features/exercises/displayName";
import { getActiveSplit } from "../data/repositories/splitRepo";
import { coverageOfActiveSplit } from "../features/training/coverageRepo";
import { GROUP_LABEL, type CoverageGroup } from "../features/training/coverage";
import { buildSplit } from "../features/onboarding/buildSplit";
import { GOALS, GOAL_BLURB, GOAL_LABEL, type Goal } from "../features/onboarding/goals";
import {
  EQUIPMENT_LABEL,
  recommendSplits,
  type Equipment,
  type Experience,
} from "../features/onboarding/recommend";

const DAYS = [2, 3, 4, 5, 6];

/** Names for generated programs, in the app's own register. */
const BUILT_NAME: Record<Goal, string> = {
  strength: "Own Forge",
  muscle: "Own Anvil",
  lean: "Own Edge",
  endurance: "Own Road",
  health: "Own Watch",
};

async function loadContext() {
  const [active, coverage] = await Promise.all([
    getActiveSplit(),
    coverageOfActiveSplit(),
  ]);
  if (!active) return null;
  const startedMs = active.split.createdAt;
  const weeks = Math.max(0, Math.floor((Date.now() - startedMs) / (7 * 86_400_000)));
  return {
    name: active.split.name,
    daysPerWeek: active.days.length,
    weeks,
    coverage,
  };
}

export function Rebuild() {
  const nav = useNavigate();
  const reduce = useMotionDisabled();
  const { data: ctx, loading } = useAsync(loadContext);

  const [goal, setGoal] = useState<Goal>("muscle");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [equipment, setEquipment] = useState<Equipment>("gym");
  const [experience] = useState<Experience>("experienced");
  const [mode, setMode] = useState<"keep" | "switch">("keep");
  const [adopting, setAdopting] = useState(false);

  // Default the day count to what they are already holding — the number
  // they have proven, not a guess.
  useEffect(() => {
    if (ctx?.daysPerWeek) setDaysPerWeek(ctx.daysPerWeek);
  }, [ctx?.daysPerWeek]);

  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
      };

  const gapGroups: CoverageGroup[] = useMemo(
    () => (ctx?.coverage?.gaps ?? []).map((g) => g.group),
    [ctx],
  );

  const built = useMemo(
    () =>
      buildSplit({
        goal,
        experience,
        daysPerWeek,
        equipment,
        mustInclude: gapGroups,
        name: `${BUILT_NAME[goal]} ${daysPerWeek}×`,
      }),
    [goal, experience, daysPerWeek, equipment, gapGroups],
  );

  const alternatives = useMemo(
    () => recommendSplits({ goal, experience, daysPerWeek, equipment }, 3),
    [goal, experience, daysPerWeek, equipment],
  );

  async function adopt(asf: string) {
    setAdopting(true);
    try {
      await commitImport(asf);
      nav("/train");
    } finally {
      setAdopting(false);
    }
  }

  return (
    <ScreenSurface labelledBy="rebuild-heading">
      <motion.header {...rise} className="pt-2">
        <h1 id="rebuild-heading" className="aur-title">Change your program</h1>
        <p className="aur-date m-0 mt-1">
          Starting from what you've actually been doing.
        </p>
      </motion.header>

      {loading && <p className="aur-meta mt-6">Reading your training…</p>}

      {!loading && !ctx && (
        <motion.section {...rise} className="mt-6 aur-chrome-surface p-5">
          <p className="aur-label m-0">No program yet</p>
          <p className="aur-meta m-0 mt-2">
            There's nothing to change from. The guided pick is the place to start.
          </p>
          <button
            type="button"
            onClick={() => nav("/choose")}
            className="aur-button mt-4 w-full rounded-xl px-4 py-4"
            style={{ minHeight: 52 }}
          >
            Find my program
          </button>
        </motion.section>
      )}

      {!loading && ctx && (
        <>
          <motion.section {...rise} className="mt-6 aur-chrome-surface p-5" aria-label="Current program">
            <p className="aur-label m-0">Right now</p>
            <p className="aur-section m-0 mt-1">{ctx.name}</p>
            <p className="aur-meta m-0 mt-1">
              {ctx.daysPerWeek} days a week
              {ctx.weeks > 0
                ? ` · ${ctx.weeks} week${ctx.weeks === 1 ? "" : "s"} in`
                : " · just started"}
            </p>

            {ctx.coverage?.sentence ? (
              <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--aur-hairline)" }}>
                <p className="aur-label m-0">What it never trains</p>
                <p className="aur-meta m-0 mt-1">{ctx.coverage.sentence}</p>
              </div>
            ) : (
              <p className="aur-meta m-0 mt-3">
                Every major muscle group gets direct work in this one.
              </p>
            )}
          </motion.section>

          <motion.section {...rise} className="mt-6" aria-label="Approach">
            <p className="aur-label m-0">What do you want to do?</p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setMode("keep")}
                aria-pressed={mode === "keep"}
                className="w-full rounded-xl px-4 py-3 text-left"
                style={{
                  minHeight: 56,
                  background: mode === "keep" ? "rgba(42,79,168,0.22)" : "rgba(255,255,255,0.04)",
                  boxShadow: mode === "keep"
                    ? "inset 0 0 0 1px var(--aur-chrome)"
                    : "inset 0 0 0 1px var(--aur-hairline)",
                }}
              >
                <span className="aur-section block">Keep this shape, close the gaps</span>
                <span className="aur-meta mt-0.5 block">
                  {gapGroups.length > 0
                    ? `Builds you a program that adds ${gapGroups.map((g) => GROUP_LABEL[g].toLowerCase()).join(", ")}.`
                    : "Rebuilds around your current goal, same weekly shape."}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode("switch")}
                aria-pressed={mode === "switch"}
                className="w-full rounded-xl px-4 py-3 text-left"
                style={{
                  minHeight: 56,
                  background: mode === "switch" ? "rgba(42,79,168,0.22)" : "rgba(255,255,255,0.04)",
                  boxShadow: mode === "switch"
                    ? "inset 0 0 0 1px var(--aur-chrome)"
                    : "inset 0 0 0 1px var(--aur-hairline)",
                }}
              >
                <span className="aur-section block">Move to a different program</span>
                <span className="aur-meta mt-0.5 block">
                  Pick from the ready-made library instead.
                </span>
              </button>
            </div>
          </motion.section>

          <motion.section {...rise} className="mt-6" aria-label="Goal now">
            <p className="aur-label m-0">What are you after now?</p>
            <div className="mt-3 flex flex-col gap-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  aria-pressed={goal === g}
                  className="w-full rounded-xl px-4 py-3 text-left"
                  style={{
                    minHeight: 56,
                    background: goal === g ? "rgba(42,79,168,0.22)" : "rgba(255,255,255,0.04)",
                    boxShadow: goal === g
                      ? "inset 0 0 0 1px var(--aur-chrome)"
                      : "inset 0 0 0 1px var(--aur-hairline)",
                  }}
                >
                  <span className="aur-section block">{GOAL_LABEL[g]}</span>
                  <span className="aur-meta mt-0.5 block">{GOAL_BLURB[g]}</span>
                </button>
              ))}
            </div>

            <p className="aur-label m-0 mt-5">Days a week</p>
            <div className="mt-2 flex gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaysPerWeek(d)}
                  aria-pressed={daysPerWeek === d}
                  className="aur-metric flex-1 rounded-xl py-3"
                  style={{
                    minHeight: 52,
                    background: daysPerWeek === d ? "rgba(42,79,168,0.22)" : "rgba(255,255,255,0.04)",
                    boxShadow: daysPerWeek === d
                      ? "inset 0 0 0 1px var(--aur-chrome)"
                      : "inset 0 0 0 1px var(--aur-hairline)",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            <p className="aur-label m-0 mt-5">Equipment</p>
            <div className="mt-2 flex flex-col gap-2">
              {(["gym", "home", "bodyweight"] as Equipment[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setEquipment(k)}
                  aria-pressed={equipment === k}
                  className="w-full rounded-xl px-4 py-3 text-left"
                  style={{
                    minHeight: 52,
                    background: equipment === k ? "rgba(42,79,168,0.22)" : "rgba(255,255,255,0.04)",
                    boxShadow: equipment === k
                      ? "inset 0 0 0 1px var(--aur-chrome)"
                      : "inset 0 0 0 1px var(--aur-hairline)",
                  }}
                >
                  <span className="aur-section">{EQUIPMENT_LABEL[k]}</span>
                </button>
              ))}
            </div>
          </motion.section>

          {mode === "keep" ? (
            <motion.section {...rise} className="mt-6" aria-label="Your new program">
              <p className="aur-label m-0">Your new program</p>
              <div className="aur-chrome-surface mt-3 p-5">
                <p className="aur-section m-0">{built.name}</p>
                <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                  {built.notes.map((n) => (
                    <li key={n} className="aur-meta">— {n}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {parseASF(built.asf).program.days.map((d) => (
                  <div key={d.name} className="aur-chrome-surface p-4">
                    <p className="aur-section m-0">{d.name}</p>
                    <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
                      {d.exercises.map((e) => (
                        <li key={e.name} className="flex items-center justify-between gap-2">
                          <span className="aur-meta min-w-0 truncate">{displayName(e.name)}</span>
                          <ExercisePreview name={e.name} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void adopt(built.asf)}
                disabled={adopting}
                className="aur-button mt-5 w-full rounded-xl px-4 py-4 disabled:opacity-60"
                style={{ minHeight: 52 }}
              >
                {adopting ? "Setting it up…" : `Switch to ${built.name}`}
              </button>
              <p className="aur-meta mt-2 text-center">
                Your logged history and rank stay exactly as they are.
              </p>
            </motion.section>
          ) : (
            <motion.section {...rise} className="mt-6" aria-label="Alternatives">
              <p className="aur-label m-0">Ready-made programs that fit</p>
              <div className="mt-3 flex flex-col gap-2">
                {alternatives.map((r) => (
                  <button
                    key={r.template.id}
                    type="button"
                    onClick={() => void adopt(r.template.asf)}
                    disabled={adopting}
                    className="w-full rounded-xl px-4 py-3 text-left disabled:opacity-60"
                    style={{
                      minHeight: 56,
                      background: "rgba(255,255,255,0.04)",
                      boxShadow: "inset 0 0 0 1px var(--aur-hairline)",
                    }}
                  >
                    <span className="aur-section block">{r.template.name}</span>
                    <span className="aur-meta mt-0.5 block">
                      {r.template.daysPerWeek} days · {r.template.summary}
                    </span>
                  </button>
                ))}
              </div>
            </motion.section>
          )}
        </>
      )}
    </ScreenSurface>
  );
}
