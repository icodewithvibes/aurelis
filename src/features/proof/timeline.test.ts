import { describe, it, expect } from "vitest";
import { buildTimeline, railDate, setLabel, activityLabel, type TimelineSources } from "./timeline";
import type {
  ActivityRow,
  ForgeEntryRow,
  PrRow,
  ProofEventRow,
  SessionRow,
  SetLogRow,
} from "../../data/db";

/* ---- builders: only the fields the shaper actually reads ---- */
const evt = (p: Partial<ProofEventRow> & Pick<ProofEventRow, "dateLocal" | "type" | "title">) =>
  ({ id: `e-${Math.random()}`, createdAt: 0, updatedAt: 0, deletedAt: null, ...p }) as ProofEventRow;

const session = (p: Partial<SessionRow> & Pick<SessionRow, "id" | "dateLocal">) =>
  ({
    splitDaySnapshot: null, status: "completed", qualified: true, startedAt: 0,
    updatedAt: 0, deletedAt: null, deviceId: "d", ...p,
  }) as SessionRow;

const log = (p: Partial<SetLogRow> & Pick<SetLogRow, "sessionId" | "exerciseKey" | "exerciseName">) =>
  ({
    id: `l-${Math.random()}`, setIndex: 0, done: true, updatedAt: 0, deletedAt: null, ...p,
  }) as SetLogRow;

const empty: TimelineSources = {
  events: [], sessions: [], setLogs: [], forgeEntries: [], activities: [], prs: [],
};

describe("buildTimeline", () => {
  it("collapses a session, its PRs and a tier crossing into ONE day", () => {
    const days = buildTimeline({
      ...empty,
      events: [
        evt({ dateLocal: "2026-07-20", type: "workout", title: "Push Day", createdAt: 300 }),
        evt({ dateLocal: "2026-07-20", type: "pr", title: "Bench — top set", createdAt: 299 }),
        evt({ dateLocal: "2026-07-20", type: "crest_levelup", title: "First Mark", createdAt: 298 }),
      ],
      sessions: [session({ id: "s1", dateLocal: "2026-07-20" })],
    });

    expect(days).toHaveLength(1);
    expect(days[0].headline).toBe("Push Day");
  });

  it("orders days newest first and caps by DAY, never by row", () => {
    const events = ["2026-07-18", "2026-07-19", "2026-07-20"].map((d) =>
      evt({ dateLocal: d, type: "workout", title: `W ${d}` }),
    );
    // A day heavy with rows must not evict older days.
    events.push(
      ...Array.from({ length: 20 }, () =>
        evt({ dateLocal: "2026-07-20", type: "pr", title: "PR" }),
      ),
    );
    const days = buildTimeline({ ...empty, events }, 2);
    expect(days.map((d) => d.dateLocal)).toEqual(["2026-07-20", "2026-07-19"]);
  });

  it("surfaces the crest tier so the rail can show the mark", () => {
    const days = buildTimeline({
      ...empty,
      events: [evt({ dateLocal: "2026-07-20", type: "crest_levelup", title: "First Mark" })],
    });
    expect(days[0].crestLevel).toBe(1);
    expect(days[0].crestName).toBe("First Mark");
  });

  it("leaves crestLevel null on an ordinary day", () => {
    const days = buildTimeline({
      ...empty,
      events: [evt({ dateLocal: "2026-07-20", type: "workout", title: "Pull Day" })],
    });
    expect(days[0].crestLevel).toBeNull();
  });

  it("records only sets that were actually DONE", () => {
    const days = buildTimeline({
      ...empty,
      events: [evt({ dateLocal: "2026-07-20", type: "workout", title: "Push Day" })],
      sessions: [session({ id: "s1", dateLocal: "2026-07-20" })],
      setLogs: [
        log({ sessionId: "s1", exerciseKey: "bench", exerciseName: "Bench", weight: 185, reps: 5, done: true }),
        log({ sessionId: "s1", exerciseKey: "bench", exerciseName: "Bench", setIndex: 1, done: false }),
      ],
    });
    expect(days[0].detail.exercises).toHaveLength(1);
    expect(days[0].detail.exercises[0].sets).toHaveLength(1);
    expect(days[0].chips).toContain("1 set");
  });

  it("gathers notes from the session, the sets, the Forge and activities", () => {
    const days = buildTimeline({
      ...empty,
      events: [evt({ dateLocal: "2026-07-20", type: "workout", title: "Push Day" })],
      sessions: [session({ id: "s1", dateLocal: "2026-07-20", notes: "felt strong" })],
      setLogs: [
        log({ sessionId: "s1", exerciseKey: "bench", exerciseName: "Bench", note: "elbow twinge" }),
      ],
      forgeEntries: [
        { id: "f1", dateLocal: "2026-07-20", stateKey: "k", note: "showed up anyway",
          acknowledgment: "", reframe: "", action: "Ten minutes", estMinutes: 10, tone: "steady",
          safety: false, status: "done", isDailyCommitment: true, updatedAt: 0, deletedAt: null,
        } as unknown as ForgeEntryRow,
      ],
      activities: [
        { id: "a1", dateLocal: "2026-07-20", kind: "run", minutes: 30, note: "easy pace",
          createdAt: 0, updatedAt: 0, deletedAt: null, deviceId: "d" } as ActivityRow,
      ],
    });

    const bodies = days[0].detail.notes.map((n) => n.body);
    expect(bodies).toEqual(
      expect.arrayContaining(["felt strong", "elbow twinge", "showed up anyway", "easy pace"]),
    );
    expect(days[0].chips).toContain("4 notes");
  });

  it("marks a day with nothing to open as inert", () => {
    const days = buildTimeline({
      ...empty,
      events: [evt({ dateLocal: "2026-07-20", type: "recovery", title: "Recovery honored" })],
    });
    expect(days[0].hasDetail).toBe(false);
    expect(days[0].kept).toBe(true);
    expect(days[0].headline).toBe("Recovery honored");
  });

  it("ignores soft-deleted rows everywhere", () => {
    const days = buildTimeline({
      ...empty,
      events: [
        evt({ dateLocal: "2026-07-20", type: "workout", title: "Push Day" }),
        evt({ dateLocal: "2026-07-19", type: "workout", title: "Deleted", deletedAt: 1 }),
      ],
      sessions: [session({ id: "s1", dateLocal: "2026-07-20" })],
      setLogs: [
        log({ sessionId: "s1", exerciseKey: "bench", exerciseName: "Bench", deletedAt: 1 }),
      ],
    });
    expect(days).toHaveLength(1);
    expect(days[0].detail.exercises).toHaveLength(0);
  });

  it("names an activity-only day by the activity", () => {
    const days = buildTimeline({
      ...empty,
      activities: [
        { id: "a1", dateLocal: "2026-07-21", kind: "ride", minutes: 45, distance: 12,
          distanceUnit: "mi", createdAt: 0, updatedAt: 0, deletedAt: null, deviceId: "d" } as ActivityRow,
      ],
    });
    expect(days[0].headline).toBe("Ride · 45 min · 12 mi");
    expect(days[0].kept).toBe(false); // an activity is not a kept day
  });

  it("counts records broken that day", () => {
    const days = buildTimeline({
      ...empty,
      events: [evt({ dateLocal: "2026-07-20", type: "workout", title: "Push Day" })],
      prs: [
        { id: "p1", exerciseName: "Bench", metric: "top", value: 200, dateLocal: "2026-07-20",
          updatedAt: 0, deletedAt: null } as unknown as PrRow,
      ],
    });
    expect(days[0].chips).toContain("1 record");
    expect(days[0].detail.prs).toEqual(["Bench — 200"]);
  });
});

describe("labels", () => {
  it("formats the rail date", () => {
    expect(railDate("2026-07-08")).toEqual({ month: "JUL", day: "8" });
    expect(railDate("2026-12-25")).toEqual({ month: "DEC", day: "25" });
  });

  it("omits whatever the logger left blank", () => {
    expect(setLabel({ weight: 185, reps: 5, done: true }, "lb")).toBe("185 lb × 5");
    expect(setLabel({ reps: 12, done: true }, "lb")).toBe("× 12");
    expect(setLabel({ weight: 100, reps: 5, rpe: 8, done: true }, "kg")).toBe("100 kg × 5 @8");
    expect(setLabel({ done: true }, "lb")).toBe("logged");
  });

  it("names an activity from only what was recorded", () => {
    expect(activityLabel({ kind: "run", minutes: 30 } as ActivityRow)).toBe("Run · 30 min");
    expect(activityLabel({ kind: "swim" } as ActivityRow)).toBe("Swim");
  });
});
