/**
 * "Help me choose" — the goal-first way into a program.
 *
 * REBUILT after real users got stuck. The first version put all four
 * questions on one long scroll and rendered the recommendation only
 * once a goal was set. Because experience, days and equipment all had
 * defaults, the goal was the ONLY unanswered question and nothing said
 * so — so a new user scrolled to the bottom, found the page simply
 * ended, and concluded it was broken. There was not a single call to
 * action on the screen.
 *
 * Three rules this version holds to:
 *
 * 1. ONE QUESTION AT A TIME, with a visible position. You always know
 *    how far through you are and what the next tap is.
 * 2. NEVER A DEAD END. Every step has a primary action. The result step
 *    cannot be reached without an answer, so "nothing happened" is not
 *    a reachable state.
 * 3. SHOW THE WORK BEFORE ASKING FOR COMMITMENT. The result lists the
 *    actual exercises with their reference images, because people were
 *    adopting programs without realising they could look at them first.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScreenSurface } from "../components/ScreenSurface";
import { ExercisePreview } from "../components/ExercisePreview";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import { commitImport } from "../features/asf/importSplit";
import { parseASF } from "../features/asf/parse";
import { displayName } from "../features/exercises/displayName";
import type { SplitTemplate } from "../features/splits/library";
import { GOALS, GOAL_BLURB, GOAL_LABEL, readGoalText, type Goal } from "../features/onboarding/goals";
import {
  EQUIPMENT_LABEL,
  EXPERIENCE_LABEL,
  recommendSplits,
  type Equipment,
  type Experience,
} from "../features/onboarding/recommend";

const DAYS = [2, 3, 4, 5, 6];
const STEPS = ["Goal", "Experience", "Days", "Equipment", "Your program"] as const;

function Choice({
  selected,
  onClick,
  title,
  blurb,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  blurb?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="w-full rounded-xl px-4 py-3 text-left"
      style={{
        minHeight: 56,
        background: selected ? "rgba(42,79,168,0.22)" : "rgba(255,255,255,0.04)",
        boxShadow: selected
          ? "inset 0 0 0 1px var(--aur-chrome)"
          : "inset 0 0 0 1px var(--aur-hairline)",
      }}
    >
      <span className="aur-section block">{title}</span>
      {blurb && <span className="aur-meta mt-0.5 block">{blurb}</span>}
    </button>
  );
}

export function Choose() {
  const nav = useNavigate();
  const reduce = useMotionDisabled();

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [custom, setCustom] = useState("");
  const [experience, setExperience] = useState<Experience | null>(null);
  const [daysPerWeek, setDaysPerWeek] = useState<number | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);

  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
      };

  const reading = useMemo(() => readGoalText(custom), [custom]);
  const effectiveGoal: Goal | null = goal ?? reading.goal;

  // Nothing is answered on your behalf any more. If a default is not a
  // real answer it must not look like one, or the only unanswered
  // question becomes invisible — which is exactly what went wrong.
  const answered = [
    effectiveGoal !== null,
    experience !== null,
    daysPerWeek !== null,
    equipment !== null,
  ];
  const canAdvance = step < 4 ? answered[step] : true;

  const recs = useMemo(
    () =>
      effectiveGoal && experience && daysPerWeek && equipment
        ? recommendSplits({
            goal: effectiveGoal,
            experience,
            daysPerWeek,
            equipment,
            customGoalText: custom,
          })
        : [],
    [effectiveGoal, experience, daysPerWeek, equipment, custom],
  );

  async function adopt(t: SplitTemplate) {
    setAdopting(t.id);
    try {
      await commitImport(t.asf);
      nav("/train");
    } finally {
      setAdopting(null);
    }
  }

  const top = recs[0];

  return (
    <ScreenSurface labelledBy="choose-heading">
      <motion.header {...rise} className="pt-2">
        <h1 id="choose-heading" className="aur-title">Find your program</h1>
        <p className="aur-date m-0 mt-1">
          Step {Math.min(step + 1, STEPS.length)} of {STEPS.length} · {STEPS[step]}
        </p>
        {/* A visible finish line. Without it there was no way to tell
            whether anything else was coming. */}
        <div
          className="mt-3 flex gap-1"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
        >
          {STEPS.map((s, i) => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full"
              style={{
                background: i <= step ? "var(--aur-chrome)" : "var(--aur-hairline)",
              }}
            />
          ))}
        </div>
      </motion.header>

      <div className="mt-6">
        {step === 0 && (
          <motion.section {...rise} key="goal" aria-labelledby="q-goal">
            <h2 id="q-goal" className="aur-label m-0">What are you after?</h2>
            <div className="mt-3 flex flex-col gap-2">
              {GOALS.map((gk) => (
                <Choice
                  key={gk}
                  selected={effectiveGoal === gk}
                  onClick={() => {
                    setGoal(gk);
                    setCustom("");
                  }}
                  title={GOAL_LABEL[gk]}
                  blurb={GOAL_BLURB[gk]}
                />
              ))}
            </div>

            <label className="mt-4 block">
              <span className="aur-meta">Or say it in your own words</span>
              <input
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value);
                  setGoal(null);
                }}
                placeholder="e.g. lose the belly before June"
                className="mt-1 w-full rounded-xl px-3 py-3"
                style={{
                  minHeight: 48,
                  background: "rgba(255,255,255,0.05)",
                  boxShadow: "inset 0 0 0 1px var(--aur-hairline)",
                  color: "var(--aur-ink)",
                }}
              />
            </label>
            {custom.trim() !== "" && (
              <p className="aur-meta mt-2" aria-live="polite">
                {reading.goal
                  ? `Read as: ${GOAL_LABEL[reading.goal].toLowerCase()}. Tap a card if that's wrong.`
                  : "Couldn't tell from that — tap one above instead."}
              </p>
            )}
          </motion.section>
        )}

        {step === 1 && (
          <motion.section {...rise} key="exp" aria-labelledby="q-exp">
            <h2 id="q-exp" className="aur-label m-0">How much have you trained?</h2>
            <div className="mt-3 flex flex-col gap-2">
              {(["new", "returning", "experienced"] as Experience[]).map((k) => (
                <Choice
                  key={k}
                  selected={experience === k}
                  onClick={() => setExperience(k)}
                  title={EXPERIENCE_LABEL[k]}
                />
              ))}
            </div>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section {...rise} key="days" aria-labelledby="q-days">
            <h2 id="q-days" className="aur-label m-0">Days a week you can really hold</h2>
            <p className="aur-meta m-0 mt-1">
              Answer honestly — a week you finish beats one you abandon.
            </p>
            <div className="mt-3 flex gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDaysPerWeek(d)}
                  aria-pressed={daysPerWeek === d}
                  className="aur-metric flex-1 rounded-xl py-4"
                  style={{
                    minHeight: 56,
                    background:
                      daysPerWeek === d ? "rgba(42,79,168,0.22)" : "rgba(255,255,255,0.04)",
                    boxShadow:
                      daysPerWeek === d
                        ? "inset 0 0 0 1px var(--aur-chrome)"
                        : "inset 0 0 0 1px var(--aur-hairline)",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {step === 3 && (
          <motion.section {...rise} key="kit" aria-labelledby="q-kit">
            <h2 id="q-kit" className="aur-label m-0">What can you train with?</h2>
            <div className="mt-3 flex flex-col gap-2">
              {(["gym", "home", "bodyweight"] as Equipment[]).map((k) => (
                <Choice
                  key={k}
                  selected={equipment === k}
                  onClick={() => setEquipment(k)}
                  title={EQUIPMENT_LABEL[k]}
                />
              ))}
            </div>
          </motion.section>
        )}

        {step === 4 && top && (
          <motion.section {...rise} key="result" aria-labelledby="rec-heading">
            <h2 id="rec-heading" className="aur-label m-0">What I'd pick for you</h2>

            <div className="aur-chrome-surface mt-3 p-5">
              <p className="aur-section m-0">{top.template.name}</p>
              <p className="aur-meta m-0 mt-1">{top.template.summary}</p>

              <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                {top.reasons.map((r) => (
                  <li key={r} className="aur-meta">— {r}</li>
                ))}
              </ul>
            </div>

            {/* The exercises, with their reference images.
                People were adopting programs without knowing they could
                look inside one first, so the look is no longer optional. */}
            <div className="mt-4">
              <p className="aur-label m-0">What's in it</p>
              <p className="aur-meta m-0 mt-1">
                Tap any movement to see how it's done.
              </p>
              <div className="mt-3 flex flex-col gap-3">
                {parseASF(top.template.asf).program.days.map((d) => (
                  <div key={d.name} className="aur-chrome-surface p-4">
                    <p className="aur-section m-0">{d.name}</p>
                    <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
                      {d.exercises.map((e) => (
                        <li
                          key={e.name}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="aur-meta min-w-0 truncate">
                            {displayName(e.name)}
                          </span>
                          <ExercisePreview name={e.name} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {recs.length > 1 && (
              <div className="mt-5">
                <p className="aur-meta">Close seconds, if you disagree:</p>
                <div className="mt-2 flex flex-col gap-2">
                  {recs.slice(1).map((r) => (
                    <button
                      key={r.template.id}
                      type="button"
                      onClick={() => void adopt(r.template)}
                      disabled={adopting !== null}
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
              </div>
            )}

            <button
              type="button"
              onClick={() => nav("/library")}
              className="aur-meta mt-4 w-full rounded-xl px-4 py-3"
              style={{ minHeight: 44, background: "transparent" }}
            >
              Or browse all 14 programs
            </button>
          </motion.section>
        )}
      </div>

      {/* The primary action is always present. There is no state in this
          screen where the next tap is unclear. */}
      <div className="sticky bottom-0 mt-6 pb-4 pt-3" style={{ background: "var(--aur-bg-fade, transparent)" }}>
        {step < 4 ? (
          <>
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance}
              className="aur-button w-full rounded-xl px-4 py-4 disabled:opacity-40"
              style={{ minHeight: 52 }}
            >
              {canAdvance ? "Next" : `Pick one to continue`}
            </button>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="aur-meta mt-2 w-full rounded-xl px-4 py-3"
                style={{ minHeight: 44, background: "transparent" }}
              >
                Back
              </button>
            )}
          </>
        ) : (
          top && (
            <>
              <button
                type="button"
                onClick={() => void adopt(top.template)}
                disabled={adopting !== null}
                className="aur-button w-full rounded-xl px-4 py-4 disabled:opacity-60"
                style={{ minHeight: 52 }}
              >
                {adopting === top.template.id
                  ? "Setting it up…"
                  : `Start ${top.template.name}`}
              </button>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="aur-meta mt-2 w-full rounded-xl px-4 py-3"
                style={{ minHeight: 44, background: "transparent" }}
              >
                Change my answers
              </button>
            </>
          )
        )}
      </div>
    </ScreenSurface>
  );
}
