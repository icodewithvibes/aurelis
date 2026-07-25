import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { db, initDb } from "../db";
import { commitImport } from "../../features/asf/importSplit";
import {
  addTemplateExercise,
  getActiveSplit,
  moveSplitDay,
  removeSplitDay,
  removeTemplateExercise,
  renameSplit,
  renameSplitDay,
  updateTemplateExercise,
} from "./splitRepo";
import { startSession } from "./sessionRepo";
import { getSession } from "./sessionRepo";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (n: string) => readFileSync(resolve(here, "../../../02_strategy/fixtures", n), "utf8");

const names = async () => (await getActiveSplit())!.days.map((d) => d.name);

beforeEach(async () => {
  await db.delete();
  await initDb();
  await commitImport(fx("asf-valid-multi-day.txt"));
});

describe("renaming", () => {
  it("renames a day", async () => {
    const day = (await getActiveSplit())!.days[0];
    await renameSplitDay(day.id, "  Upper A  ");
    expect((await names())[0]).toBe("Upper A");
  });

  it("renames the split", async () => {
    const split = (await getActiveSplit())!.split;
    await renameSplit(split.id, "My Program");
    expect((await getActiveSplit())!.split.name).toBe("My Program");
  });

  it("refuses to make anything nameless", async () => {
    const day = (await getActiveSplit())!.days[0];
    const before = (await names())[0];
    await renameSplitDay(day.id, "   ");
    expect((await names())[0]).toBe(before);
  });
});

describe("reordering", () => {
  it("moves a day down and back up", async () => {
    const before = await names();
    const first = (await getActiveSplit())!.days[0];

    await moveSplitDay(first.id, 1);
    const moved = await names();
    expect(moved[0]).toBe(before[1]);
    expect(moved[1]).toBe(before[0]);

    await moveSplitDay(first.id, -1);
    expect(await names()).toEqual(before);
  });

  it("is a no-op at the edges rather than an error", async () => {
    const before = await names();
    const days = (await getActiveSplit())!.days;
    await moveSplitDay(days[0].id, -1);
    await moveSplitDay(days[days.length - 1].id, 1);
    expect(await names()).toEqual(before);
  });

  it("leaves the other days' order untouched", async () => {
    const days = (await getActiveSplit())!.days;
    if (days.length < 3) return;
    const thirdName = days[2].name;
    await moveSplitDay(days[0].id, 1);
    expect((await names())[2]).toBe(thirdName);
  });
});

describe("exercise editing", () => {
  it("updates sets and reps", async () => {
    const ex = (await getActiveSplit())!.days[0].exercises[0];
    await updateTemplateExercise(ex.id, { sets: 5, repMin: 3, repMax: 5, name: "Front Squat" });

    const updated = (await getActiveSplit())!.days[0].exercises[0];
    expect(updated).toMatchObject({ sets: 5, repMin: 3, repMax: 5, name: "Front Squat" });
  });

  it("clamps an absurd set count instead of storing it", async () => {
    const ex = (await getActiveSplit())!.days[0].exercises[0];
    await updateTemplateExercise(ex.id, { sets: 999 });
    expect((await getActiveSplit())!.days[0].exercises[0].sets).toBe(20);
    await updateTemplateExercise(ex.id, { sets: 0 });
    expect((await getActiveSplit())!.days[0].exercises[0].sets).toBe(1);
  });

  it("adds an exercise at the end", async () => {
    const day = (await getActiveSplit())!.days[0];
    const count = day.exercises.length;
    await addTemplateExercise(day.id, { name: "Face Pull", sets: 3 });

    const after = (await getActiveSplit())!.days[0].exercises;
    expect(after).toHaveLength(count + 1);
    expect(after[after.length - 1].name).toBe("Face Pull");
  });

  it("refuses a nameless exercise", async () => {
    const day = (await getActiveSplit())!.days[0];
    expect(await addTemplateExercise(day.id, { name: "  " })).toBeNull();
  });

  it("soft-deletes rather than destroying the row", async () => {
    const ex = (await getActiveSplit())!.days[0].exercises[0];
    await removeTemplateExercise(ex.id);

    expect((await getActiveSplit())!.days[0].exercises.find((e) => e.id === ex.id)).toBeUndefined();
    expect((await db.templateExercises.get(ex.id))!.deletedAt).toBeGreaterThan(0);
  });

  it("soft-deletes a day together with its exercises", async () => {
    const day = (await getActiveSplit())!.days[0];
    await removeSplitDay(day.id);

    expect((await getActiveSplit())!.days.find((d) => d.id === day.id)).toBeUndefined();
    const orphans = (await db.templateExercises.where("dayId").equals(day.id).toArray()).filter(
      (e) => !e.deletedAt,
    );
    expect(orphans).toHaveLength(0);
  });
});

describe("editing never rewrites history", () => {
  it("leaves an in-progress session's snapshot alone", async () => {
    const day = (await getActiveSplit())!.days[0];
    const originalName = day.exercises[0].name;
    const sessionId = await startSession(day);

    await updateTemplateExercise(day.exercises[0].id, { name: "Renamed Later" });
    await removeTemplateExercise(day.exercises[0].id);
    await renameSplitDay(day.id, "Renamed Day");

    const session = await getSession(sessionId);
    expect(session!.snapshot.dayName).toBe(day.name);
    expect(session!.snapshot.exercises[0].name).toBe(originalName);
  });
});
