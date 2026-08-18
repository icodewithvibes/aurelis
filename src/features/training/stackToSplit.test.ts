import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { db, initDb } from "../../data/db";
import { commitImport } from "../asf/importSplit";
import { getActiveSplit } from "../../data/repositories/splitRepo";
import { startSession, upsertSetLog } from "../../data/repositories/sessionRepo";
import { recordProof } from "../proof/proofRepo";
import { loadRankInput } from "../rank/rankRepo";
import { xpFor, KEPT_DAY_XP } from "../rank/rank";
import { addOutcomeSentence, addStackToSplit } from "./stackToSplit";
import { findStack, stackLevel } from "./stacks";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (n: string) => readFileSync(resolve(here, "../../../02_strategy/fixtures", n), "utf8");

beforeEach(async () => {
  await db.delete();
  await initDb();
  await commitImport(fx("asf-valid-multi-day.txt"));
});

describe("adding a stack to an existing day", () => {
  it("appends every movement of the chosen level", async () => {
    const before = (await getActiveSplit())!.days[0];
    const stack = findStack("core")!;
    const level = stackLevel(stack, "standard");

    const result = await addStackToSplit(stack, "standard", {
      kind: "existingDay",
      dayId: before.id,
    });

    expect(result).toMatchObject({
      dayName: before.name,
      added: level.exercises.length,
      skipped: 0,
      createdDay: false,
    });

    const after = (await getActiveSplit())!.days[0];
    expect(after.exercises.length).toBe(before.exercises.length + level.exercises.length);
    expect(after.exercises.slice(-level.exercises.length).map((e) => e.name)).toEqual(
      level.exercises.map((e) => e.name),
    );
  });

  it("carries the prescription across, not just the name", async () => {
    const day = (await getActiveSplit())!.days[0];
    const first = stackLevel(findStack("calves")!, "standard").exercises[0];
    await addStackToSplit(findStack("calves")!, "standard", {
      kind: "existingDay",
      dayId: day.id,
    });

    const added = (await getActiveSplit())!.days[0].exercises.find((e) => e.name === first.name)!;
    expect({ sets: added.sets, repMin: added.repMin, repMax: added.repMax, rest: added.restSec }).toEqual({
      sets: first.sets,
      repMin: first.repMin,
      repMax: first.repMax,
      rest: first.restSec,
    });
  });

  it("never duplicates a movement the day already has", async () => {
    const day = (await getActiveSplit())!.days[0];
    const stack = findStack("grip")!;
    await addStackToSplit(stack, "standard", { kind: "existingDay", dayId: day.id });
    const second = await addStackToSplit(stack, "standard", { kind: "existingDay", dayId: day.id });

    expect(second).toMatchObject({ added: 0 });
    expect(second!.skipped).toBe(stackLevel(stack, "standard").exercises.length);

    const names = (await getActiveSplit())!.days[0].exercises.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("does not change the number of days, so the rotation is untouched", async () => {
    const before = (await getActiveSplit())!.days.length;
    const day = (await getActiveSplit())!.days[0];
    await addStackToSplit(findStack("core")!, "starter", { kind: "existingDay", dayId: day.id });
    expect((await getActiveSplit())!.days.length).toBe(before);
  });
});

describe("adding a stack as its own day", () => {
  it("creates a named day at the end and reports the new day count", async () => {
    const before = (await getActiveSplit())!.days.length;
    const result = await addStackToSplit(findStack("core")!, "hard", { kind: "newDay" });

    expect(result).toMatchObject({ dayName: "Core stack", createdDay: true, dayCount: before + 1 });
    const days = (await getActiveSplit())!.days;
    expect(days[days.length - 1].name).toBe("Core stack");
    expect(days[days.length - 1].exercises.length).toBe(
      stackLevel(findStack("core")!, "hard").exercises.length,
    );
  });

  it("says out loud that the weekly rotation just moved", async () => {
    const result = await addStackToSplit(findStack("calves")!, "starter", { kind: "newDay" });
    const sentence = addOutcomeSentence(result!);
    expect(sentence).toContain("rotates through");
    expect(sentence).toContain("weekday");
  });
});

describe("refusing quietly", () => {
  it("returns null when the day is gone", async () => {
    expect(
      await addStackToSplit(findStack("core")!, "standard", {
        kind: "existingDay",
        dayId: "no-such-day",
      }),
    ).toBeNull();
  });

  it("returns null when there is no active split at all", async () => {
    await db.delete();
    await initDb();
    expect(await addStackToSplit(findStack("core")!, "standard", { kind: "newDay" })).toBeNull();
  });
});

describe("why adding it to the split is worth anything", () => {
  /**
   * The whole point of the feature, asserted rather than asserted-in-a-
   * comment: a stack trained on its own earns set XP but does NOT earn a
   * kept day, and kept days are where the rank actually lives.
   */
  it("turns the same work into a kept day once it's part of the program", async () => {
    const stack = findStack("core")!;
    const day = (await getActiveSplit())!.days[0];
    await addStackToSplit(stack, "starter", { kind: "existingDay", dayId: day.id });

    const withStack = (await getActiveSplit())!.days.find((d) => d.id === day.id)!;
    const sessionId = await startSession(withStack);
    for (const [i, ex] of withStack.exercises.entries()) {
      await upsertSetLog({
        sessionId,
        exerciseKey: ex.id,
        exerciseName: ex.name,
        setIndex: 0,
        weight: 20 + i,
        reps: 10,
        done: true,
      });
    }
    await recordProof(sessionId, true);

    const input = await loadRankInput();
    expect(input.keptDays).toBe(1);
    expect(xpFor(input)).toBeGreaterThanOrEqual(KEPT_DAY_XP);
  });
});
