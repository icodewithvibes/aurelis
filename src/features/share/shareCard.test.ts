import { describe, expect, it } from "vitest";
import {
  canShare,
  cardLines,
  shareCardFilename,
  type ShareCardData,
} from "./shareCard";

const data = (over: Partial<ShareCardData> = {}): ShareCardData => ({
  rankName: "Silver Crest",
  xp: 2500,
  streak: 4,
  keptDays: 9,
  progress: 0.5,
  nextRankName: "Cobalt Crest",
  ...over,
});

const textOf = (d: ShareCardData) => cardLines(d).map((l) => l.text);

describe("cardLines", () => {
  it("always carries the wordmark, because the image is the growth loop", () => {
    // If this ever becomes conditional, a shared card stops telling
    // anyone where it came from and the whole mechanic is pointless.
    const roles = cardLines(data()).map((l) => l.role);
    expect(roles).toContain("eyebrow");
    expect(roles).toContain("footer");
    expect(textOf(data())).toContain("Earned in FORGE");
  });

  it("leads with the rank", () => {
    expect(cardLines(data())[1]).toEqual({ text: "Silver Crest", role: "rank" });
  });

  it("states the XP exactly as earned", () => {
    expect(textOf(data({ xp: 12_345 }))).toContain("12,345 XP");
  });

  it("hides the streak when there isn't one", () => {
    // "0 days in a row" is a discouraging thing to hand someone and a
    // worse thing to post publicly.
    const lines = textOf(data({ streak: 0 }));
    expect(lines.some((t) => t.includes("in a row"))).toBe(false);
  });

  it("shows a streak when there is one, with correct grammar", () => {
    expect(textOf(data({ streak: 1 }))).toContain("1 day in a row");
    expect(textOf(data({ streak: 6 }))).toContain("6 days in a row");
  });

  it("gets kept-day grammar right too", () => {
    expect(textOf(data({ keptDays: 1 }))).toContain("1 day kept");
    expect(textOf(data({ keptDays: 30 }))).toContain("30 days kept");
  });

  it("names the next rank so the card implies a ladder", () => {
    expect(textOf(data())).toContain("Next: Cobalt Crest");
  });

  it("says so honestly at the top of the ladder", () => {
    const lines = textOf(data({ nextRankName: null }));
    expect(lines).toContain("Highest rank reached");
    expect(lines.some((t) => t.startsWith("Next:"))).toBe(false);
  });

  it("never invents a number the user did not earn", () => {
    // A fresh install must not be able to produce a boastful card.
    const fresh = data({ xp: 0, streak: 0, keptDays: 0, rankName: "Unmarked", nextRankName: "First Mark" });
    const joined = textOf(fresh).join(" ");
    expect(joined).toContain("0 XP");
    expect(joined).not.toMatch(/in a row/);
    expect(joined).not.toMatch(/days kept/);
  });
});

describe("canShare", () => {
  it("blocks an empty boast from a fresh install", () => {
    expect(canShare(data({ xp: 0, keptDays: 0 }))).toBe(false);
  });

  it("allows sharing as soon as anything real has been earned", () => {
    expect(canShare(data({ xp: 250, keptDays: 1 }))).toBe(true);
  });
});

describe("shareCardFilename", () => {
  it("is dated and namespaced so saved cards do not collide", () => {
    expect(shareCardFilename(new Date(2026, 7, 3))).toBe("forge-rank-2026-08-03.png");
  });
});
