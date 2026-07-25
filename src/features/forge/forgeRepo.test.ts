import { describe, it, expect, beforeEach } from "vitest";
import { db, initDb } from "../../data/db";
import {
  completeForgeEntry,
  forgeEntriesFor,
  loadCrisisResources,
  openForgeEntry,
  setDailyCommitment,
  skipForgeEntry,
} from "./forgeRepo";
import { loadProof } from "../proof/proofRepo";
import { localDay } from "../../lib/date";

beforeEach(async () => {
  await db.delete();
  await initDb();
});

describe("openForgeEntry", () => {
  it("stores exactly what the user was shown", async () => {
    const { entry, response } = await openForgeEntry("overthinking", "cant get started");

    expect(entry.status).toBe("open");
    expect(entry.stateKey).toBe("overthinking");
    expect(entry.acknowledgment).toBe(response.acknowledgment);
    expect(entry.action).toBe(response.action);
    expect(entry.estMinutes).toBe(response.estMinutes);
    expect(entry.safety).toBe(false);
    expect(await db.forgeEntries.count()).toBe(1);
  });

  it("drops an empty note rather than storing whitespace", async () => {
    const { entry } = await openForgeEntry("need_reset", "   ");
    expect(entry.note).toBeUndefined();
  });

  it("stores a safety response but never as a commitment", async () => {
    const { entry, response } = await openForgeEntry("want_to_quit", "i want to kill myself", true);

    expect(response.safety).toBe(true);
    expect(response.action).toBe("");
    expect(entry.safety).toBe(true);
    expect(entry.isDailyCommitment).toBe(false);
  });
});

describe("completeForgeEntry", () => {
  it("marks it done and writes a proof event", async () => {
    const { entry } = await openForgeEntry("avoiding_training", undefined);
    await completeForgeEntry(entry.id);

    const stored = await db.forgeEntries.get(entry.id);
    expect(stored!.status).toBe("done");
    expect(stored!.completedAt).toBeGreaterThan(0);

    const events = await db.proofEvents.toArray();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("forge");
  });

  it("rejects an unknown entry", async () => {
    await expect(completeForgeEntry("nope")).rejects.toThrow(/unknown entry/);
  });
});

describe("daily commitment → streak", () => {
  it("does not count an open commitment as kept", async () => {
    await openForgeEntry("need_reset", undefined, true);
    const proof = await loadProof();
    expect(proof.keptCount).toBe(0);
  });

  it("counts a kept commitment as a kept day with no split at all", async () => {
    const { entry } = await openForgeEntry("need_reset", undefined, true);
    await completeForgeEntry(entry.id);

    const proof = await loadProof();
    expect(proof.keptCount).toBe(1);
    expect(proof.streak).toBe(1);

    const records = await db.records.get("alltime");
    expect(records!.totalCommitmentsCompleted).toBe(1);
    expect(records!.totalSessionsKept).toBe(1);
    expect(records!.bestStreak).toBe(1);
  });

  it("does not count a Forge rep that was never made a commitment", async () => {
    const { entry } = await openForgeEntry("overthinking", undefined, false);
    await completeForgeEntry(entry.id);
    expect((await loadProof()).keptCount).toBe(0);
  });

  it("can be toggled on after the response is shown", async () => {
    const { entry } = await openForgeEntry("need_reset", undefined, false);
    await setDailyCommitment(entry.id, true);
    await completeForgeEntry(entry.id);
    expect((await loadProof()).keptCount).toBe(1);
  });

  it("refuses to turn a safety entry into a commitment", async () => {
    const { entry } = await openForgeEntry("want_to_quit", "sharp pain in my knee");
    await setDailyCommitment(entry.id, true);
    expect((await db.forgeEntries.get(entry.id))!.isDailyCommitment).toBe(false);
  });
});

describe("skipForgeEntry", () => {
  it("saves without shame and never becomes an unmet obligation", async () => {
    const { entry } = await openForgeEntry("low_energy", undefined, true);
    await skipForgeEntry(entry.id);

    expect((await db.forgeEntries.get(entry.id))!.status).toBe("skipped");
    // A skipped commitment must not break a streak the user never took on.
    const proof = await loadProof();
    expect(proof.streak).toBe(0);
    expect(proof.keptCount).toBe(0);
  });
});

describe("forgeEntriesFor", () => {
  it("returns today's entries, newest first", async () => {
    await openForgeEntry("overthinking", undefined);
    await openForgeEntry("need_reset", undefined);
    const today = await forgeEntriesFor(localDay());
    expect(today).toHaveLength(2);
  });
});

describe("crisis resources", () => {
  it("are seeded into settings with the locked US/MA copy", async () => {
    const settings = await db.settings.get("app");
    expect(settings!.crisisRegion).toBe("US-MA");
    expect(settings!.crisisResources?.immediate).toMatch(/988/);
    expect(settings!.crisisResources?.immediate).toMatch(/911/);
  });

  it("load from settings", async () => {
    const r = await loadCrisisResources();
    expect(r.region).toBe("US-MA");
    expect(r.physical).toMatch(/stop signals/);
  });

  it("fall back to the module when the row predates the field", async () => {
    await db.settings.update("app", { crisisResources: undefined });
    const r = await loadCrisisResources();
    expect(r.immediate).toMatch(/988/);
  });
});
