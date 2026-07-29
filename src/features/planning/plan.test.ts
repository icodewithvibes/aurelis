import { describe, it, expect } from "vitest";
import {
  itemsForDay, carriedOver, nextUp, whenLabel, dayLoad, openTodayCount, sortItems,
} from "./plan";
import type { PlanItemRow } from "../../data/db";

let seq = 0;
const item = (p: Partial<PlanItemRow> & Pick<PlanItemRow, "dateLocal" | "title">): PlanItemRow =>
  ({
    id: `p${++seq}`, atMinutes: null, kind: "life", status: "open",
    createdAt: seq, updatedAt: seq, deletedAt: null, deviceId: "d", ...p,
  }) as PlanItemRow;

const at = (h: number, m = 0) => h * 60 + m;
const TODAY = "2026-07-29";

describe("sorting", () => {
  it("puts timed items in clock order, untimed last", () => {
    const items = [
      item({ dateLocal: TODAY, title: "Anytime" }),
      item({ dateLocal: TODAY, title: "Evening", atMinutes: at(19) }),
      item({ dateLocal: TODAY, title: "Morning", atMinutes: at(7) }),
    ];
    expect(sortItems(items).map((i) => i.title)).toEqual(["Morning", "Evening", "Anytime"]);
  });
});

describe("carriedOver — the whole point of the feature", () => {
  it("surfaces open items from days already past", () => {
    const items = [
      item({ dateLocal: "2026-07-27", title: "Old thing" }),
      item({ dateLocal: "2026-07-28", title: "Yesterday" }),
      item({ dateLocal: TODAY, title: "Today" }),
    ];
    expect(carriedOver(items, TODAY).map((i) => i.title)).toEqual(["Yesterday", "Old thing"]);
  });

  it("never carries something already done or dropped", () => {
    // A finished item is finished; a dropped one was a decision.
    const items = [
      item({ dateLocal: "2026-07-28", title: "Done", status: "done" }),
      item({ dateLocal: "2026-07-28", title: "Dropped", status: "dropped" }),
      item({ dateLocal: "2026-07-28", title: "Still open" }),
    ];
    expect(carriedOver(items, TODAY).map((i) => i.title)).toEqual(["Still open"]);
  });

  it("never carries a FUTURE item — that is a plan, not a debt", () => {
    const items = [item({ dateLocal: "2026-08-05", title: "Next week" })];
    expect(carriedOver(items, TODAY)).toEqual([]);
  });

  it("puts the most recent miss first", () => {
    const items = [
      item({ dateLocal: "2026-07-20", title: "Ancient" }),
      item({ dateLocal: "2026-07-28", title: "Yesterday" }),
      item({ dateLocal: "2026-07-25", title: "Last week" }),
    ];
    expect(carriedOver(items, TODAY)[0].title).toBe("Yesterday");
  });

  it("caps the list so a bad month cannot bury today", () => {
    const items = Array.from({ length: 30 }, (_, i) =>
      item({ dateLocal: `2026-07-${String(i + 1).padStart(2, "0")}`, title: `x${i}` }),
    );
    expect(carriedOver(items, TODAY).length).toBe(10);
  });

  it("ignores soft-deleted rows", () => {
    const items = [item({ dateLocal: "2026-07-28", title: "Gone", deletedAt: 1 })];
    expect(carriedOver(items, TODAY)).toEqual([]);
  });
});

describe("nextUp", () => {
  const items = [
    item({ dateLocal: TODAY, title: "Morning", atMinutes: at(7) }),
    item({ dateLocal: TODAY, title: "Train", atMinutes: at(19) }),
    item({ dateLocal: TODAY, title: "Read", atMinutes: null }),
  ];

  it("finds the next timed item still ahead", () => {
    const n = nextUp(items, TODAY, at(12))!;
    expect(n.item.title).toBe("Train");
    expect(n.inMinutes).toBe(7 * 60);
    expect(n.isNow).toBe(false);
  });

  it("treats a time that has just arrived as NOW, not missed", () => {
    const n = nextUp(items, TODAY, at(19, 30))!;
    expect(n.item.title).toBe("Train");
    expect(n.isNow).toBe(true);
    expect(n.inMinutes).toBe(-30);
  });

  it("falls back to an untimed item when nothing is scheduled", () => {
    const only = [item({ dateLocal: TODAY, title: "Read" })];
    const n = nextUp(only, TODAY, at(12))!;
    expect(n.item.title).toBe("Read");
    expect(n.inMinutes).toBeNull();
  });

  it("skips items already done", () => {
    const done = [
      item({ dateLocal: TODAY, title: "Morning", atMinutes: at(7), status: "done" }),
      item({ dateLocal: TODAY, title: "Train", atMinutes: at(19) }),
    ];
    expect(nextUp(done, TODAY, at(6))!.item.title).toBe("Train");
  });

  it("returns null on an empty day", () => {
    expect(nextUp([], TODAY, at(12))).toBeNull();
  });

  it("ignores other days", () => {
    const other = [item({ dateLocal: "2026-08-01", title: "Later", atMinutes: at(9) })];
    expect(nextUp(other, TODAY, at(8))).toBeNull();
  });
});

describe("whenLabel", () => {
  const mk = (inMinutes: number | null, isNow = false) =>
    whenLabel({ item: item({ dateLocal: TODAY, title: "x" }), inMinutes, isNow });

  it("reads naturally in both directions", () => {
    expect(mk(0)).toBe("now");
    expect(mk(25)).toBe("in 25m");
    expect(mk(130)).toBe("in 2h 10m");
    expect(mk(120)).toBe("in 2h");
    expect(mk(-15)).toBe("started 15m ago");
    expect(mk(-90)).toBe("started 1h ago");
    expect(mk(null)).toBe("sometime today");
  });
});

describe("dayLoad", () => {
  it("counts open and done, and sums planned minutes", () => {
    const items = [
      item({ dateLocal: TODAY, title: "A", atMinutes: at(9), estMinutes: 60 }),
      item({ dateLocal: TODAY, title: "B", atMinutes: at(14), estMinutes: 30 }),
      item({ dateLocal: TODAY, title: "C", status: "done", estMinutes: 45 }),
    ];
    const load = dayLoad(items, TODAY);
    expect(load.open).toBe(2);
    expect(load.done).toBe(1);
    expect(load.plannedMinutes).toBe(90);
  });

  it("reports overlapping blocks without blocking them", () => {
    const items = [
      item({ dateLocal: TODAY, title: "Long", atMinutes: at(9), estMinutes: 120 }),
      item({ dateLocal: TODAY, title: "Clash", atMinutes: at(10), estMinutes: 30 }),
    ];
    const load = dayLoad(items, TODAY);
    expect(load.clashes).toHaveLength(1);
    expect(load.clashes[0].map((i) => i.title)).toEqual(["Long", "Clash"]);
  });

  it("does not invent a clash when blocks merely touch", () => {
    const items = [
      item({ dateLocal: TODAY, title: "A", atMinutes: at(9), estMinutes: 60 }),
      item({ dateLocal: TODAY, title: "B", atMinutes: at(10), estMinutes: 30 }),
    ];
    expect(dayLoad(items, TODAY).clashes).toEqual([]);
  });

  it("cannot clash on items with no estimate", () => {
    const items = [
      item({ dateLocal: TODAY, title: "A", atMinutes: at(9) }),
      item({ dateLocal: TODAY, title: "B", atMinutes: at(9) }),
    ];
    expect(dayLoad(items, TODAY).clashes).toEqual([]);
  });
});

describe("openTodayCount (the app icon badge)", () => {
  it("counts only today's open items", () => {
    const items = [
      item({ dateLocal: TODAY, title: "A" }),
      item({ dateLocal: TODAY, title: "B", status: "done" }),
      item({ dateLocal: "2026-07-28", title: "Yesterday" }),
    ];
    expect(openTodayCount(items, TODAY)).toBe(1);
  });

  it("caps at 99 so the badge stays meaningful", () => {
    const items = Array.from({ length: 150 }, () => item({ dateLocal: TODAY, title: "x" }));
    expect(openTodayCount(items, TODAY)).toBe(99);
  });
});

describe("itemsForDay", () => {
  it("returns only that day, sorted, without deleted rows", () => {
    const items = [
      item({ dateLocal: TODAY, title: "Late", atMinutes: at(20) }),
      item({ dateLocal: TODAY, title: "Early", atMinutes: at(6) }),
      item({ dateLocal: TODAY, title: "Gone", deletedAt: 1 }),
      item({ dateLocal: "2026-08-01", title: "Other" }),
    ];
    expect(itemsForDay(items, TODAY).map((i) => i.title)).toEqual(["Early", "Late"]);
  });
});
