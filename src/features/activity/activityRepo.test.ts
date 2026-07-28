import { describe, it, expect, beforeEach } from "vitest";
import { db, initDb } from "../../data/db";
import {
  activitiesOn,
  deleteActivity,
  describeActivity,
  logActivity,
  paceFor,
  recentActivities,
} from "./activityRepo";
import { loadProof } from "../proof/proofRepo";
import { localDay } from "../../lib/date";

beforeEach(async () => {
  await db.delete();
  await initDb();
});

describe("logActivity", () => {
  it("records a run with distance and time", async () => {
    const id = await logActivity({ kind: "run", distance: 3.1, minutes: 28 });
    expect(id).not.toBeNull();

    const [a] = await recentActivities();
    expect(a).toMatchObject({ kind: "run", distance: 3.1, minutes: 28, distanceUnit: "mi" });
  });

  it("refuses an entry that says nothing", async () => {
    expect(await logActivity({ kind: "run" })).toBeNull();
    expect(await logActivity({ kind: "run", minutes: 0, distance: 0 })).toBeNull();
    expect(await db.activities.count()).toBe(0);
  });

  it("accepts time alone or distance alone", async () => {
    expect(await logActivity({ kind: "ride", minutes: 45 })).not.toBeNull();
    expect(await logActivity({ kind: "walk", distance: 2 })).not.toBeNull();
    expect(await db.activities.count()).toBe(2);
  });

  it("clamps absurd values instead of storing them", async () => {
    await logActivity({ kind: "run", minutes: 99999, distance: 99999, effort: 99 });
    const [a] = await recentActivities();
    expect(a.minutes).toBe(1440);
    expect(a.distance).toBe(1000);
    expect(a.effort).toBe(10);
  });

  it("appears on the proof timeline without counting as a kept session", async () => {
    await logActivity({ kind: "run", distance: 1, minutes: 9 });
    const proof = await loadProof();

    // The run is visible…
    expect(proof.timeline.some((e) => e.title.startsWith("Run"))).toBe(true);
    // …but it is NOT the split's work, so it cannot inflate the record.
    expect(proof.keptCount).toBe(0);
    expect(proof.totalWorkoutsCompleted).toBe(0);
  });

  it("keeps activities separate from sessions entirely", async () => {
    await logActivity({ kind: "run", minutes: 30 });
    expect(await db.sessions.count()).toBe(0);
  });
});

describe("activitiesOn", () => {
  it("finds today's activities", async () => {
    await logActivity({ kind: "run", minutes: 20 });
    expect(await activitiesOn(localDay())).toHaveLength(1);
    expect(await activitiesOn("2020-01-01")).toHaveLength(0);
  });
});

describe("deleteActivity", () => {
  it("soft-deletes and hides it", async () => {
    const id = (await logActivity({ kind: "run", minutes: 20 }))!;
    await deleteActivity(id);
    expect(await recentActivities()).toHaveLength(0);
    expect((await db.activities.get(id))!.deletedAt).toBeGreaterThan(0);
  });
});

describe("describeActivity", () => {
  it("reads naturally", async () => {
    await logActivity({ kind: "run", distance: 3.1, minutes: 28 });
    const [a] = await recentActivities();
    expect(describeActivity(a)).toBe("Run · 3.1 mi · 28 min");
  });

  it("omits what was not given", async () => {
    await logActivity({ kind: "ride", minutes: 45 });
    const [a] = await recentActivities();
    expect(describeActivity(a)).toBe("Ride · 45 min");
  });
});

describe("paceFor", () => {
  it("computes running pace", async () => {
    await logActivity({ kind: "run", distance: 3, minutes: 27 });
    const [a] = await recentActivities();
    expect(paceFor(a)).toBe("9:00 / mi");
  });

  it("stays quiet where pace would be meaningless", async () => {
    await logActivity({ kind: "row", distance: 2, minutes: 10 });
    expect(paceFor((await recentActivities())[0])).toBeNull();

    await logActivity({ kind: "run", minutes: 30 });
    expect(paceFor((await recentActivities())[0])).toBeNull();
  });
});
