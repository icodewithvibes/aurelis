import { describe, expect, it } from "vitest";
import { crestStateForXp, CREST_TIERS } from "./crest";
import { RANK_TIERS } from "../features/rank/rank";

describe("crest ladder", () => {
  it("IS the rank ladder — one source, so the app cannot contradict itself", () => {
    // This app once shipped two ladders sharing the same tier names: the
    // crest keyed off kept days (1, 3, 7…) and the rank card off XP. They
    // disagreed on screen. If these two ever diverge again, that bug is
    // back, so pin them to each other rather than to hardcoded numbers.
    expect(CREST_TIERS.map((t) => ({ level: t.level, name: t.name, min: t.min }))).toEqual(
      RANK_TIERS.map((t) => ({ level: t.level, name: t.name, min: t.minXp })),
    );
  });

  it("names each tier at its own threshold", () => {
    for (const tier of RANK_TIERS) {
      expect(crestStateForXp(tier.minXp).name).toBe(tier.name);
    }
  });

  it("starts Unmarked", () => {
    expect(crestStateForXp(0).name).toBe("Unmarked");
    expect(crestStateForXp(0).level).toBe(0);
  });

  it("reports the XP gap to the next tier", () => {
    const s = crestStateForXp(RANK_TIERS[2].minXp);
    expect(s.nextName).toBe(RANK_TIERS[3].name);
    expect(s.toNext).toBe(RANK_TIERS[3].minXp - RANK_TIERS[2].minXp);
  });

  it("tops out honestly", () => {
    const s = crestStateForXp(999_999);
    expect(s.level).toBe(6);
    expect(s.nextName).toBeNull();
    expect(s.progress).toBe(1);
  });
});
