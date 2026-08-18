import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { db, initDb } from "../db";
import { commitImport } from "../../features/asf/importSplit";
import { getActiveSplit, addSplitDay, moveTemplateExercise, templateExerciseExists } from "./splitRepo";
import { getSession, startSession, swapSessionExercise, upsertSetLog } from "./sessionRepo";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (n: string) => readFileSync(resolve(here, "../../../02_strategy/fixtures", n), "utf8");

async function firstSession() {
  const day = (await getActiveSplit())!.days[0];
  const id = await startSession(day);
  return { id, day };
}

beforeEach(async () => {
  await db.delete();
  await initDb();
  await commitImport(fx("asf-valid-multi-day.txt"));
});

describe("swapping an exercise mid-session", () => {
  it("replaces it in place when nothing has been logged", async () => {
    const { id } = await firstSession();
    const before = (await getSession(id))!.snapshot.exercises;
    const target = before[0];

    const mode = await swapSessionExercise(id, target.key, "Leg Press");
    expect(mode).toBe("replaced");

    const after = (await getSession(id))!.snapshot.exercises;
    expect(after.length).toBe(before.length);
    expect(after[0].name).toBe("Leg Press");
    // Same slot, same prescription — only the movement changed.
    expect(after[0].sets).toBe(target.sets);
    expect(after[0].repMax).toBe(target.repMax);
  });

  it("gives the substitute its own key, so no stale set can attach to it", async () => {
    const { id } = await firstSession();
    const target = (await getSession(id))!.snapshot.exercises[0];
    await swapSessionExercise(id, target.key, "Leg Press");
    expect((await getSession(id))!.snapshot.exercises[0].key).not.toBe(target.key);
  });

  it("clears the empty rows left behind by the movement it replaced", async () => {
    const { id } = await firstSession();
    const target = (await getSession(id))!.snapshot.exercises[0];
    // A row that exists but records nothing — someone tapped in and out.
    await upsertSetLog({
      sessionId: id,
      exerciseKey: target.key,
      exerciseName: target.name,
      setIndex: 0,
      done: false,
    });

    await swapSessionExercise(id, target.key, "Leg Press");
    const logs = (await getSession(id))!.logs;
    expect(logs.filter((l) => l.exerciseKey === target.key)).toEqual([]);
  });

  it("keeps logged sets and adds the substitute after them", async () => {
    const { id } = await firstSession();
    const before = (await getSession(id))!.snapshot.exercises;
    const target = before[0];
    await upsertSetLog({
      sessionId: id,
      exerciseKey: target.key,
      exerciseName: target.name,
      setIndex: 0,
      weight: 135,
      reps: 8,
      done: true,
    });

    const mode = await swapSessionExercise(id, target.key, "Leg Press");
    expect(mode).toBe("appended");

    const after = (await getSession(id))!;
    expect(after.snapshot.exercises.length).toBe(before.length + 1);
    expect(after.snapshot.exercises[0].name).toBe(target.name);
    expect(after.snapshot.exercises[1].name).toBe("Leg Press");
    // The work that happened is still on the record, unedited.
    const kept = after.logs.find((l) => l.exerciseKey === target.key);
    expect({ weight: kept?.weight, reps: kept?.reps, done: kept?.done }).toEqual({
      weight: 135,
      reps: 8,
      done: true,
    });
  });

  it("leaves the split alone", async () => {
    const { id, day } = await firstSession();
    const target = (await getSession(id))!.snapshot.exercises[0];
    await swapSessionExercise(id, target.key, "Leg Press");

    const stillThere = (await getActiveSplit())!.days.find((d) => d.id === day.id)!;
    expect(stillThere.exercises[0].name).toBe(day.exercises[0].name);
  });

  it("refuses quietly on a key or session that isn't there", async () => {
    const { id } = await firstSession();
    expect(await swapSessionExercise(id, "no-such-key", "Leg Press")).toBeNull();
    expect(await swapSessionExercise("no-such-session", "k", "Leg Press")).toBeNull();
    const target = (await getSession(id))!.snapshot.exercises[0];
    expect(await swapSessionExercise(id, target.key, "   ")).toBeNull();
  });
});

describe("knowing whether an exercise is in the split", () => {
  it("says yes for a template exercise and no for a swapped-in one", async () => {
    const { id } = await firstSession();
    const target = (await getSession(id))!.snapshot.exercises[0];
    expect(await templateExerciseExists(target.key)).toBe(true);

    await swapSessionExercise(id, target.key, "Leg Press");
    const swapped = (await getSession(id))!.snapshot.exercises[0];
    expect(await templateExerciseExists(swapped.key)).toBe(false);
  });
});

describe("editing the split itself", () => {
  it("moves an exercise within its day and back", async () => {
    const day = (await getActiveSplit())!.days[0];
    const names = day.exercises.map((e) => e.name);
    expect(names.length).toBeGreaterThan(1);

    await moveTemplateExercise(day.exercises[0].id, 1);
    const moved = (await getActiveSplit())!.days[0].exercises.map((e) => e.name);
    expect(moved[0]).toBe(names[1]);
    expect(moved[1]).toBe(names[0]);

    await moveTemplateExercise(day.exercises[0].id, -1);
    expect((await getActiveSplit())!.days[0].exercises.map((e) => e.name)).toEqual(names);
  });

  it("does nothing at the ends rather than erroring", async () => {
    const day = (await getActiveSplit())!.days[0];
    const names = day.exercises.map((e) => e.name);
    await moveTemplateExercise(day.exercises[0].id, -1);
    await moveTemplateExercise(day.exercises[day.exercises.length - 1].id, 1);
    expect((await getActiveSplit())!.days[0].exercises.map((e) => e.name)).toEqual(names);
  });

  it("adds a day at the end of the split", async () => {
    const split = (await getActiveSplit())!;
    const count = split.days.length;
    const id = await addSplitDay(split.split.id, "  Arms  ");
    expect(id).toBeTruthy();

    const days = (await getActiveSplit())!.days;
    expect(days.length).toBe(count + 1);
    expect(days[days.length - 1].name).toBe("Arms");
    expect(days[days.length - 1].exercises).toEqual([]);
  });

  it("refuses to add a nameless day", async () => {
    const split = (await getActiveSplit())!;
    expect(await addSplitDay(split.split.id, "   ")).toBeNull();
    expect((await getActiveSplit())!.days.length).toBe(split.days.length);
  });
});
