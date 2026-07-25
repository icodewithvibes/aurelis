import { describe, it, expect } from "vitest";
import { crestStateForSessions } from "./crest";

describe("crestStateForSessions (display mapping)", () => {
  it("maps counts to the locked crest tiers", () => {
    expect(crestStateForSessions(0).name).toBe("Unmarked");
    expect(crestStateForSessions(1).name).toBe("First Mark");
    expect(crestStateForSessions(5).name).toBe("Polished Mark");
    expect(crestStateForSessions(12).name).toBe("Silver Crest");
    expect(crestStateForSessions(20).name).toBe("Cobalt Crest");
    expect(crestStateForSessions(45).name).toBe("Prismatic Crest");
    expect(crestStateForSessions(80).name).toBe("Ascendant Crest");
  });

  it("reports sessions until the next tier and clamps progress", () => {
    const s = crestStateForSessions(12); // Silver (7..13), next Cobalt at 14
    expect(s.level).toBe(3);
    expect(s.nextName).toBe("Cobalt Crest");
    expect(s.toNext).toBe(2);
    expect(s.progress).toBeGreaterThan(0);
    expect(s.progress).toBeLessThanOrEqual(1);
  });

  it("saturates at the highest crest", () => {
    const s = crestStateForSessions(200);
    expect(s.nextName).toBeNull();
    expect(s.toNext).toBe(0);
    expect(s.progress).toBe(1);
  });
});
