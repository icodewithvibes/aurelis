/**
 * Assemble the rank input from what is already stored on the device.
 *
 * Everything here is DERIVED. No XP total is ever written down, which
 * means the rank cannot drift away from the training that produced it,
 * cannot be edited, and recomputes correctly after a restore from
 * backup. Deleting a session lowers the rank, as it should.
 */

import { db } from "../../data/db";
import { localDay } from "../../lib/date";
import { countKeptDays } from "../proof/engine";
import { collectDayFacts } from "../proof/proofRepo";
import {
  breakdownFor,
  cappedSets,
  masteryFor,
  rankForInput,
  xpFor,
  type MasteryState,
  type RankBreakdown,
  type RankInput,
  type RankState,
} from "./rank";

export async function loadRankInput(today = localDay()): Promise<RankInput> {
  const [facts, setLogs, prs] = await Promise.all([
    collectDayFacts(today),
    db.setLogs.toArray(),
    db.prs.toArray(),
  ]);

  // Kept days come straight from the proof engine so the rank and the
  // streak can never disagree about what counted.
  const keptDays = countKeptDays(facts, today);

  // Count completed sets per session, then cap each session. Grouping
  // first is the whole point — capping the global total would punish
  // people who simply train a lot.
  const perSession = new Map<string, number>();
  for (const row of setLogs) {
    if (!row.done || row.deletedAt) continue;
    perSession.set(row.sessionId, (perSession.get(row.sessionId) ?? 0) + 1);
  }
  const creditedSets = cappedSets([...perSession.values()]);

  const live = prs.filter((p) => !p.deletedAt);
  const repPRs = live.filter((p) => p.metric === "repPR").length;

  // A load PR counts as one progression step and is worth the same
  // whether you added 2.5kg or 200kg. The MAGNITUDE of the weight is
  // never scored, so inflating the number buys a single step and then
  // strands you — every later PR has to beat the inflated one.
  const progressionSteps = live.filter((p) => p.metric === "topWeight").length;

  return { keptDays, creditedSets, repPRs, progressionSteps };
}

export interface RankSnapshot {
  state: RankState;
  input: RankInput;
  breakdown: RankBreakdown[];
}

export async function loadRank(today = localDay()): Promise<RankSnapshot> {
  const input = await loadRankInput(today);
  return { state: rankForInput(input), input, breakdown: breakdownFor(input) };
}

/** Total XP, for callers that only need the number. */
export async function loadXp(today = localDay()): Promise<number> {
  return xpFor(await loadRankInput(today));
}

/**
 * Per-movement mastery, keyed by the STORED exerciseName — the same key
 * per-lift history and PRs join on. Display names are applied at render
 * (features/exercises/displayName), never here.
 */
export async function loadMastery(): Promise<Map<string, MasteryState>> {
  const setLogs = await db.setLogs.toArray();

  // A movement is "trained in a session" once, no matter how many sets.
  const sessionsByExercise = new Map<string, Set<string>>();
  for (const row of setLogs) {
    if (!row.done || row.deletedAt) continue;
    let seen = sessionsByExercise.get(row.exerciseName);
    if (!seen) {
      seen = new Set<string>();
      sessionsByExercise.set(row.exerciseName, seen);
    }
    seen.add(row.sessionId);
  }

  const out = new Map<string, MasteryState>();
  for (const [name, sessions] of sessionsByExercise) {
    out.set(name, masteryFor(sessions.size));
  }
  return out;
}
