import { describe, it, expect } from "vitest";
import { REST_BOUNDS, restReason, restSecondsFor } from "./rest";

describe("restSecondsFor", () => {
  it("respects the split's own prescription above everything", () => {
    expect(restSecondsFor(180, 10, 90)).toBe(180);
    expect(restSecondsFor(45, 5, 90)).toBe(45);
    expect(restReason(180, 10)).toBe("From your split");
  });

  it("falls back to the user's default when nothing is known", () => {
    expect(restSecondsFor(null, undefined, 90)).toBe(90);
    expect(restSecondsFor(undefined, "", 60)).toBe(60);
    expect(restReason(null, undefined)).toBe("Your default");
  });

  it("shortens rest after an easy set", () => {
    const easy = restSecondsFor(null, 5, 90);
    expect(easy).toBeLessThan(90);
    expect(easy).toBe(55);
    expect(restReason(null, 5)).toMatch(/easy/i);
  });

  it("lengthens rest after a near-limit set", () => {
    const hard = restSecondsFor(null, 10, 90);
    expect(hard).toBeGreaterThan(90);
    expect(restReason(null, 10)).toMatch(/hard/i);
  });

  it("scales smoothly between easy and hard", () => {
    const seven = restSecondsFor(null, 7, 90);
    const eight = restSecondsFor(null, 8, 90);
    expect(seven).toBeLessThan(eight);
    expect(eight).toBeLessThan(restSecondsFor(null, 10, 90));
    expect(restReason(null, 8)).toMatch(/scaled/i);
  });

  it("accepts the string the logger actually stores", () => {
    expect(restSecondsFor(null, "10", 90)).toBe(restSecondsFor(null, 10, 90));
  });

  it("never returns something absurd", () => {
    expect(restSecondsFor(null, 10, 9999)).toBe(REST_BOUNDS.max);
    expect(restSecondsFor(null, 1, 1)).toBe(REST_BOUNDS.min);
    expect(restSecondsFor(99999, undefined, 90)).toBe(REST_BOUNDS.max);
  });

  it("ignores nonsense effort values rather than trusting them", () => {
    expect(restSecondsFor(null, "abc", 90)).toBe(90);
    expect(restSecondsFor(null, 0, 90)).toBe(90);
  });
});
