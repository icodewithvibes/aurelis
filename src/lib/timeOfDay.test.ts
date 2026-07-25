import { describe, it, expect } from "vitest";
import { bandForDate, bandForHour, msUntilNextBand, variantIndex } from "./timeOfDay";
import { heroForTime, HERO_SCENES, DEFAULT_HERO } from "../design/heroes";

const at = (hour: number, day = 20) => new Date(2026, 6, day, hour, 0, 0);

describe("bandForHour", () => {
  it("covers the four bands", () => {
    expect(bandForHour(6)).toBe("dawn");
    expect(bandForHour(12)).toBe("day");
    expect(bandForHour(19)).toBe("dusk");
    expect(bandForHour(23)).toBe("night");
    expect(bandForHour(2)).toBe("night");
  });

  it("is exact on the boundaries", () => {
    expect(bandForHour(4)).toBe("night");
    expect(bandForHour(5)).toBe("dawn");
    expect(bandForHour(8)).toBe("dawn");
    expect(bandForHour(9)).toBe("day");
    expect(bandForHour(16)).toBe("day");
    expect(bandForHour(17)).toBe("dusk");
    expect(bandForHour(20)).toBe("dusk");
    expect(bandForHour(21)).toBe("night");
  });

  it("never leaves the band set for odd input", () => {
    expect(bandForHour(-1)).toBe("night");
    expect(bandForHour(25)).toBe("night");
  });
});

describe("msUntilNextBand", () => {
  it("counts down to the next boundary", () => {
    expect(msUntilNextBand(at(6))).toBe(3 * 3600_000); // 06:00 → 09:00
    expect(msUntilNextBand(at(20))).toBe(3600_000); // 20:00 → 21:00
  });

  it("wraps past midnight to the 05:00 boundary", () => {
    expect(msUntilNextBand(at(22))).toBe(7 * 3600_000);
  });
});

describe("variantIndex", () => {
  it("is stable for the same day and band", () => {
    const a = variantIndex(4, at(12));
    const b = variantIndex(4, at(12, 20));
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(4);
  });

  it("collapses to the only scene when a band holds one", () => {
    expect(variantIndex(1, at(12))).toBe(0);
    expect(variantIndex(0, at(12))).toBe(0);
  });

  it("stays in range across many days", () => {
    for (let day = 1; day <= 28; day++) {
      const i = variantIndex(3, at(12, day));
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(3);
    }
  });
});

describe("heroForTime", () => {
  it("returns a scene for every hour of the day", () => {
    for (let h = 0; h < 24; h++) {
      const scene = heroForTime(at(h));
      expect(scene.webp).toBeTruthy();
      expect(scene.jpg).toBeTruthy();
      expect(scene.lqip).toBeTruthy();
    }
  });

  it("falls back to the approved hero for bands with no art yet", () => {
    for (const band of ["dawn", "day", "dusk", "night"] as const) {
      if (HERO_SCENES[band].length === 0) {
        const hour = { dawn: 6, day: 12, dusk: 19, night: 23 }[band];
        expect(heroForTime(at(hour)).id).toBe(DEFAULT_HERO.id);
      }
    }
  });

  it("is deterministic within a band", () => {
    expect(heroForTime(at(19)).id).toBe(heroForTime(at(19)).id);
    expect(bandForDate(at(19))).toBe("dusk");
  });

  it("declares every scene under the band it belongs to", () => {
    for (const band of ["dawn", "day", "dusk", "night"] as const) {
      for (const scene of HERO_SCENES[band]) expect(scene.band).toBe(band);
    }
  });
});
