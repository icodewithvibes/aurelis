/**
 * Forge (Stage 3) — set resistance down, leave with ONE next step.
 *
 * The engine is deterministic and on-device (02_strategy/02): pick a
 * state, optionally write a note, and get acknowledgment → reframe →
 * one action with a time box.
 *
 * Safety comes first. Every note passes `safetyScreen()` before any
 * template, and a flagged note switches to a gentle mode with no task,
 * no time box, and no Next-rep pressure — only calm copy and the
 * configured crisis resources. It is a caring guardrail, never a
 * diagnosis, and it is described that way in the UI.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScreenSurface } from "../components/ScreenSurface";
import { RestTimer } from "../components/RestTimer";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import {
  completeForgeEntry,
  loadCrisisResources,
  openForgeEntry,
  setDailyCommitment,
  skipForgeEntry,
} from "../features/forge/forgeRepo";
import { resourceLineFor, type CrisisResources } from "../features/forge/crisisResources";
import { FORGE_STATES, type ForgeResponse, type ForgeStateKey } from "../features/forge/types";
import { markRecoveryHonored } from "../features/proof/proofRepo";

type Phase = "choose" | "response" | "committed" | "done";

export function Forge() {
  const reduce = useMotionDisabled();
  const [phase, setPhase] = useState<Phase>("choose");
  const [stateKey, setStateKey] = useState<ForgeStateKey | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [response, setResponse] = useState<ForgeResponse | null>(null);
  const [commit, setCommit] = useState(false);
  const [timer, setTimer] = useState(false);
  const [resources, setResources] = useState<CrisisResources | null>(null);
  const [recoveryMarked, setRecoveryMarked] = useState(false);

  useEffect(() => {
    let alive = true;
    void loadCrisisResources().then((r) => alive && setResources(r));
    return () => {
      alive = false;
    };
  }, []);

  const rise = reduce ? {} : {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  };

  async function findStep() {
    if (!stateKey || busy) return;
    setBusy(true);
    try {
      const { entry, response: r } = await openForgeEntry(stateKey, note, commit);
      setEntryId(entry.id);
      setResponse(r);
      setPhase("response");
    } finally {
      setBusy(false);
    }
  }

  async function nextRep() {
    if (!entryId) return;
    await setDailyCommitment(entryId, commit);
    setPhase("committed");
    setTimer(true);
  }

  async function markDone() {
    if (!entryId) return;
    await completeForgeEntry(entryId);
    setPhase("done");
  }

  async function notNow() {
    if (entryId) await skipForgeEntry(entryId);
    reset();
  }

  function reset() {
    setPhase("choose");
    setStateKey(null);
    setNote("");
    setEntryId(null);
    setResponse(null);
    setCommit(false);
    setTimer(false);
    setRecoveryMarked(false);
  }

  async function honorRecovery() {
    await markRecoveryHonored();
    setRecoveryMarked(true);
  }

  const safety = response?.safety === true;

  return (
    <ScreenSurface backplate="forge" labelledBy="forge-heading">
      <motion.header {...rise} className="pt-2">
        <h1 id="forge-heading" className="aur-title">Forge</h1>
        <p className="aur-date m-0 mt-1">One honest step, not the whole plan.</p>
      </motion.header>

      {/* ---------------------------------------------------- choose */}
      {phase === "choose" && (
        <motion.section {...rise} className="mt-6 aur-chrome-surface p-5" aria-label="What's in the way">
          <p className="aur-label m-0">What's in the way</p>
          <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
            {FORGE_STATES.map((s) => {
              const active = stateKey === s.key;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStateKey(s.key)}
                    className="aur-touch rounded-full px-4 text-small"
                    style={{
                      background: active ? "var(--aur-chrome-50)" : "rgba(210,217,230,0.08)",
                      color: active ? "var(--aur-night)" : "var(--aur-ink)",
                      border: "1px solid rgba(210,217,230,0.14)",
                    }}
                  >
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <label htmlFor="forge-note" className="aur-label mt-5 block">
            Anything you want to set down (optional)
          </label>
          <textarea
            id="forge-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl p-3 text-body"
            style={{
              color: "var(--aur-ink)",
              background: "rgba(7,12,24,0.55)",
              border: "1px solid rgba(210,217,230,0.14)",
              resize: "vertical",
            }}
          />
          <p className="aur-meta m-0 mt-2">
            Stays on this device. Nothing is sent anywhere.
          </p>

          <button
            type="button"
            onClick={() => void findStep()}
            disabled={!stateKey || busy}
            className="aur-touch mt-4 w-full rounded-full text-body font-medium"
            style={{
              background: stateKey ? "var(--aur-chrome-50)" : "rgba(210,217,230,0.16)",
              color: stateKey ? "var(--aur-night)" : "var(--aur-ink-muted)",
              border: "none",
              padding: "0.875rem 1.5rem",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "…" : "Find the next step"}
          </button>
        </motion.section>
      )}

      {/* -------------------------------------------------- response */}
      {phase === "response" && response && (
        <motion.section
          {...rise}
          className="mt-6 aur-chrome-surface p-5"
          aria-label={safety ? "A gentler step" : "Your next step"}
        >
          <p className="m-0 text-body">{response.acknowledgment}</p>
          <p className="m-0 mt-3 text-body" style={{ color: "var(--aur-ink-muted)" }}>
            {response.reframe}
          </p>

          {safety ? (
            <>
              <hr className="aur-hairline my-4" />
              <p className="m-0 text-body">
                {resourceLineFor(response.safetyCategory!, resources ?? undefined)}
              </p>
              <p className="aur-meta m-0 mt-3">
                AURELIS reads your note on this device to stay gentle when it matters. It isn't a
                diagnosis and it isn't medical advice.
              </p>

              {(response.safetyCategory === "injury" ||
                response.safetyCategory === "exhaustion") && (
                <button
                  type="button"
                  onClick={() => void honorRecovery()}
                  disabled={recoveryMarked}
                  className="aur-touch mt-4 w-full rounded-full text-body"
                  style={{
                    background: "rgba(210,217,230,0.1)",
                    color: "var(--aur-ink)",
                    border: "1px solid rgba(210,217,230,0.14)",
                  }}
                >
                  {recoveryMarked ? "Recovery honored ✓" : "Mark today recovery honored"}
                </button>
              )}

              <button
                type="button"
                onClick={() => void notNow()}
                className="aur-touch mt-2 w-full rounded-full text-body"
                style={{ background: "transparent", color: "var(--aur-ink-muted)", border: "none" }}
              >
                Close
              </button>
            </>
          ) : (
            <>
              <div
                className="mt-4 rounded-xl p-4"
                style={{
                  background: "rgba(210,217,230,0.06)",
                  border: "1px solid rgba(210,217,230,0.12)",
                }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="aur-label m-0">Next step</p>
                  <span className="aur-metric text-small" style={{ color: "var(--aur-ink-muted)" }}>
                    {response.estMinutes} min
                  </span>
                </div>
                <p className="m-0 mt-2 text-body">{response.action}</p>
              </div>

              <label className="mt-4 flex items-center gap-3 text-small">
                <input
                  type="checkbox"
                  checked={commit}
                  onChange={(e) => setCommit(e.target.checked)}
                  style={{ width: 22, height: 22 }}
                />
                <span>Make this today's daily commitment</span>
              </label>
              <p className="aur-meta m-0 mt-1">
                A kept commitment counts as a kept day, even when nothing is scheduled.
              </p>

              <button
                type="button"
                onClick={() => void nextRep()}
                className="aur-touch mt-4 w-full rounded-full text-body font-medium"
                style={{
                  background: "var(--aur-chrome-50)",
                  color: "var(--aur-night)",
                  border: "none",
                  padding: "0.875rem 1.5rem",
                }}
              >
                Next rep
              </button>
              <button
                type="button"
                onClick={() => void notNow()}
                className="aur-touch mt-2 w-full rounded-full text-body"
                style={{ background: "transparent", color: "var(--aur-ink-muted)", border: "none" }}
              >
                Not now
              </button>
            </>
          )}
        </motion.section>
      )}

      {/* ------------------------------------------------- committed */}
      {phase === "committed" && response && (
        <motion.section {...rise} className="mt-6 aur-chrome-surface p-5" aria-label="In progress">
          <p className="aur-label m-0">Doing now</p>
          <p className="m-0 mt-2 text-body">{response.action}</p>

          {timer && response.estMinutes > 0 && (
            <div className="mt-4">
              <RestTimer
                seconds={response.estMinutes * 60}
                onDone={() => setTimer(false)}
                onDismiss={() => setTimer(false)}
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => void markDone()}
            className="aur-touch mt-4 w-full rounded-full text-body font-medium"
            style={{
              background: "var(--aur-chrome-50)",
              color: "var(--aur-night)",
              border: "none",
              padding: "0.875rem 1.5rem",
            }}
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => void notNow()}
            className="aur-touch mt-2 w-full rounded-full text-body"
            style={{ background: "transparent", color: "var(--aur-ink-muted)", border: "none" }}
          >
            Not now — it'll be here
          </button>
        </motion.section>
      )}

      {/* ------------------------------------------------------ done */}
      {phase === "done" && (
        <motion.section
          {...rise}
          className="mt-6 aur-chrome-surface p-5 text-center"
          aria-label="Recorded"
          role="status"
        >
          <p className="aur-heading">Recorded.</p>
          <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
            {commit ? "Today's commitment is kept." : "One step, done. That's the whole point."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="aur-touch mt-4 w-full rounded-full text-body"
            style={{
              background: "rgba(210,217,230,0.1)",
              color: "var(--aur-ink)",
              border: "1px solid rgba(210,217,230,0.14)",
            }}
          >
            Back to Forge
          </button>
        </motion.section>
      )}
    </ScreenSurface>
  );
}
