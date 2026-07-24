import { describe, it, expect } from "vitest";
import { getTodayView } from "./access";

describe("data-access seam (Stage 1)", () => {
  it("returns clearly-labeled mock data", () => {
    const view = getTodayView();
    expect(view.isMock).toBe(true);
    expect(view.dayName).toBeTruthy();
    expect(view.exercises.length).toBeGreaterThan(0);
    expect(view.crestLevel).toBeGreaterThanOrEqual(0);
    expect(view.crestLevel).toBeLessThanOrEqual(6);
  });
});
