import { describe, expect, it } from "vitest";
import {
  breakdownFor,
  cappedSets,
  KEPT_DAY_XP,
  masteryFor,
  PROGRESSION_XP,
  RANK_TIERS,
  rankFor,
  rankForInput,
  REP_PR_XP,
  SET_CAP_PER_SESSION,
  SET_XP,
  xpFor,
} from "./rank";

const input = (over: Partial<Parameters<typeof xpFor>[0]> = {}) => ({
  keptDays: 0,
  creditedSets: 0,
  repPRs: 0,
  progressionSteps: 0,
  ...over,
});

describe("xpFor", () => {
  it("weights kept days above everything else", () => {
    // One kept day must be worth more than a whole session of sets,
    // because turning up is the thing the ladder is actually measuring.
    // This invariant is the design, not a coincidence of tuning: if the
    // two constants ever drift so that volume wins, the ladder quietly
    // starts rewarding set-padding instead of consistency.
    const oneDay = xpFor(input({ keptDays: 1 }));
    const manySets = xpFor(input({ creditedSets: SET_CAP_PER_SESSION }));
    expect(oneDay).toBeGreaterThan(manySets);
    expect(KEPT_DAY_XP).toBeGreaterThan(SET_XP * SET_CAP_PER_SESSION);
  });

  it("sums each source", () => {
    expect(
      xpFor(input({ keptDays: 2, creditedSets: 10, repPRs: 1, progressionSteps: 3 })),
    ).toBe(2 * KEPT_DAY_XP + 10 * SET_XP + REP_PR_XP + 3 * PROGRESSION_XP);
  });

  it("ignores negative and fractional input rather than trusting it", () => {
    expect(xpFor(input({ keptDays: -5, creditedSets: -1 }))).toBe(0);
    expect(xpFor(input({ keptDays: 1.9 }))).toBe(KEPT_DAY_XP);
  });
});

describe("cappedSets — the anti-spam rule", () => {
  it("credits a normal session in full", () => {
    expect(cappedSets([12, 15])).toBe(27);
  });

  it("stops paying out past the per-session cap", () => {
    // Tapping "complete set" two hundred times in one session must not
    // out-earn training honestly.
    expect(cappedSets([200])).toBe(SET_CAP_PER_SESSION);
    expect(cappedSets([200, 200, 200])).toBe(SET_CAP_PER_SESSION * 3);
  });

  it("caps per session, not across the whole history", () => {
    // Ten real sessions of 30 sets should beat one absurd session.
    const honest = cappedSets(Array(10).fill(30));
    const spam = cappedSets([10_000]);
    expect(honest).toBeGreaterThan(spam);
  });

  it("ignores junk counts", () => {
    expect(cappedSets([-4, 0, 2.7])).toBe(2);
  });
});

describe("weight can never buy rank", () => {
  it("has no input for load at all", () => {
    // The guarantee is structural: there is nowhere to put a weight.
    // If someone ever adds one, this test is the conversation.
    const keys = Object.keys(input()).sort();
    expect(keys).toEqual(["creditedSets", "keptDays", "progressionSteps", "repPRs"]);
  });

  it("cannot reach the top tier without time passing", () => {
    // Max out every non-time-gated source at once, with zero kept days.
    // Even absurd values must not reach Ascendant, because the ladder is
    // supposed to be unreachable without actually showing up.
    const cheated = xpFor(
      input({ keptDays: 0, creditedSets: cappedSets([10_000]), repPRs: 5, progressionSteps: 5 }),
    );
    const top = RANK_TIERS[RANK_TIERS.length - 1];
    expect(cheated).toBeLessThan(top.minXp);
  });
});

describe("rankFor", () => {
  it("starts Unmarked", () => {
    const r = rankFor(0);
    expect(r.level).toBe(0);
    expect(r.name).toBe("Unmarked");
  });

  it("lands on each tier exactly at its threshold", () => {
    for (const tier of RANK_TIERS) {
      expect(rankFor(tier.minXp).level).toBe(tier.level);
    }
  });

  it("stays on a tier until the next threshold is actually reached", () => {
    const silver = RANK_TIERS[3];
    expect(rankFor(silver.minXp - 1).level).toBe(2);
    expect(rankFor(silver.minXp).level).toBe(3);
  });

  it("reports the gap to the next tier honestly", () => {
    const r = rankFor(RANK_TIERS[2].minXp);
    expect(r.nextName).toBe(RANK_TIERS[3].name);
    expect(r.toNext).toBe(RANK_TIERS[3].minXp - RANK_TIERS[2].minXp);
    expect(r.progress).toBe(0);
  });

  it("tops out without pretending there is more to earn", () => {
    const r = rankFor(999_999);
    expect(r.level).toBe(6);
    expect(r.nextName).toBeNull();
    expect(r.toNext).toBe(0);
    expect(r.progress).toBe(1);
  });

  it("never goes backwards as XP grows", () => {
    let last = -1;
    for (let xp = 0; xp <= 10_000; xp += 137) {
      const level = rankFor(xp).level;
      expect(level).toBeGreaterThanOrEqual(last);
      last = level;
    }
  });

  it("treats junk XP as zero rather than throwing", () => {
    expect(rankFor(-100).level).toBe(0);
    expect(rankFor(Number.NaN).level).toBe(0);
  });
});

describe("rankForInput", () => {
  it("reaches First Mark on a single kept day", () => {
    // The first crest has to be reachable on day one or nobody sees one.
    expect(rankForInput(input({ keptDays: 1 })).name).toBe("First Mark");
  });

  it("takes months of real training to top out", () => {
    // Four sessions a week, 20 sets each, for twelve weeks.
    const weeks = 12;
    const perWeek = 4;
    const days = weeks * perWeek;
    const r = rankForInput(
      input({
        keptDays: days,
        creditedSets: cappedSets(Array(days).fill(20)),
        repPRs: 12,
        progressionSteps: 20,
      }),
    );
    expect(r.level).toBe(6);
  });

  it("is nowhere near the top after a single week", () => {
    const r = rankForInput(
      input({ keptDays: 4, creditedSets: cappedSets(Array(4).fill(20)), progressionSteps: 1 }),
    );
    expect(r.level).toBeLessThan(4);
  });
});

describe("masteryFor", () => {
  it("starts Untested", () => {
    expect(masteryFor(0).name).toBe("Untested");
  });

  it("counts sessions, not sets — showing up is the metric", () => {
    expect(masteryFor(3).name).toBe("Handled");
    expect(masteryFor(20).name).toBe("Tempered");
    expect(masteryFor(40).name).toBe("Forged");
  });

  it("tops out at Mastered", () => {
    const m = masteryFor(10_000);
    expect(m.name).toBe("Mastered");
    expect(m.nextName).toBeNull();
    expect(m.progress).toBe(1);
  });

  it("reports the gap to the next tier", () => {
    const m = masteryFor(3);
    expect(m.nextName).toBe("Drilled");
    expect(m.toNext).toBe(5);
  });

  it("never goes backwards", () => {
    let last = -1;
    for (let n = 0; n <= 200; n += 1) {
      const idx = masteryFor(n).index;
      expect(idx).toBeGreaterThanOrEqual(last);
      last = idx;
    }
  });
});

describe("breakdownFor", () => {
  it("accounts for every point of XP so the number can be audited", () => {
    const i = input({ keptDays: 3, creditedSets: 40, repPRs: 2, progressionSteps: 1 });
    const rows = breakdownFor(i);
    const summed = rows.reduce((total, row) => total + row.xp, 0);
    expect(summed).toBe(xpFor(i));
  });

  it("names every source", () => {
    expect(breakdownFor(input()).map((r) => r.label)).toEqual([
      "Days kept",
      "Sets logged",
      "Rep records",
      "Progressions",
    ]);
  });
});
