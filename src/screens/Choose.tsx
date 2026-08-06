/**
 * "Help me choose" — the goal-first way into a program.
 *
 * The split library is fourteen programs deep, which is useless as a
 * first screen: someone new cannot tell "Twin Anvils 4×" from "The
 * Armory 5×" and will either pick at random or leave. Four short
 * questions and a free-text box turn that into one recommendation with
 * its reasoning shown.
 *
 * The reasoning is not decoration. This app's whole argument is that it
 * does not hand you numbers you cannot check, and a program chosen for
 * you is the biggest unchecked number of all — so the pick is always
 * argued, and the runners-up stay one tap away.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ScreenSurface } from "../components/ScreenSurface";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import { commitImport } from "../features/asf/importSplit";
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
        minHeight: 44,
        background: selected ? "rgba(42,79,168,0.22)" : "rgba(255,255,255,0.04)",
        boxShadow: selected ? "inset 0 0 0 1px var(--aur-chrome)" : "inset 0 0 0 1px var(--aur-hairline)",
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

  const [goal, setGoal] = useState<Goal | null>(null);
  const [custom, setCustom] = useState("");
  const [experience, setExperience] = useState<Experience>("new");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [equipment, setEquipment] = useState<Equipment>("gym");
  const [adopting, setAdopting] = useState<string | null>(null);

  const rise = reduce ? {} : {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  };

  // Typing a goal is treated as an answer in its own right, so someone
  // who describes their goal never has to also tick the box that
  // approximates it.
  const reading = useMemo(() => readGoalText(custom), [custom]);
  const effectiveGoal: Goal | null = goal ?? reading.goal;

  const recs = useMemo(
    () =>
      effectiveGoal
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

  return (
    <ScreenSurface labelledBy="choose-heading">
      <motion.header {...rise} className="pt-2">
        <h1 id="choose-heading" className="aur-title">Find your program</h1>
        <p className="aur-date m-0 mt-1">
          Four questions. You can change any of it afterwards.
        </p>
      </motion.header>

      <motion.section {...rise} className="mt-6" aria-labelledby="q-goal">
        <h2 id="q-goal" className="aur-label m-0">What are you after?</h2>
        <div className="mt-3 flex flex-col gap-2">
          {GOALS.map((gk) => (
            <Choice
              key={gk}
              selected={effectiveGoal === gk}
              onClick={() => setGoal(gk)}
              title={GOAL_LABEL[gk]}
              blurb={GOAL_BLURB[gk]}
            />
          ))}
        </div>

        <label className="mt-3 block">
          <span className="aur-meta">Or say it in your own words</span>
          <input
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              // Typing overrides an earlier tap, so the text always wins.
              setGoal(null);
            }}
            placeholder="e.g. lose the belly before June"
            className="mt-1 w-full rounded-xl px-3 py-3"
            style={{
              minHeight: 44,
              background: "rgba(255,255,255,0.05)",
              boxShadow: "inset 0 0 0 1px var(--aur-hairline)",
              color: "var(--aur-ink)",
            }}
          />
        </label>
        {custom.trim() !== "" && (
          <p className="aur-meta mt-2" aria-live="polite">
            {reading.goal
              ? `Read as: ${GOAL_LABEL[reading.goal].toLowerCase()}. Tap a card above if that's wrong.`
              : "Couldn't tell from that — pick one above and it'll still work."}
          </p>
        )}
      </motion.section>

      <motion.section {...rise} className="mt-6" aria-labelledby="q-exp">
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

      <motion.section {...rise} className="mt-6" aria-labelledby="q-days">
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
              className="aur-metric flex-1 rounded-xl py-3"
              style={{
                minHeight: 44,
                background: daysPerWeek === d ? "rgba(42,79,168,0.22)" : "rgba(255,255,255,0.04)",
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

      <motion.section {...rise} className="mt-6" aria-labelledby="q-kit">
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

      {effectiveGoal && recs.length > 0 && (
        <motion.section {...rise} className="mt-8" aria-labelledby="rec-heading">
          <h2 id="rec-heading" className="aur-label m-0">What I'd pick for you</h2>

          <div className="aur-chrome-surface mt-3 p-5">
            <p className="aur-section m-0">{recs[0].template.name}</p>
            <p className="aur-meta m-0 mt-1">{recs[0].template.summary}</p>

            <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
              {recs[0].reasons.map((r) => (
                <li key={r} className="aur-meta">— {r}</li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => void adopt(recs[0].template)}
              disabled={adopting !== null}
              className="aur-button mt-4 w-full rounded-xl px-4 py-3 disabled:opacity-60"
              style={{ minHeight: 44 }}
            >
              {adopting === recs[0].template.id
                ? "Setting it up…"
                : `Use ${recs[0].template.name}`}
            </button>
          </div>

          {recs.length > 1 && (
            <>
              <p className="aur-meta mt-4">
                Close seconds, in case you disagree:
              </p>
              <div className="mt-2 flex flex-col gap-2">
                {recs.slice(1).map((r) => (
                  <button
                    key={r.template.id}
                    type="button"
                    onClick={() => void adopt(r.template)}
                    disabled={adopting !== null}
                    className="w-full rounded-xl px-4 py-3 text-left disabled:opacity-60"
                    style={{
                      minHeight: 44,
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
            </>
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
    </ScreenSurface>
  );
}
