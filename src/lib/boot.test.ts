import { describe, it, expect, beforeEach, vi } from "vitest";
import { dismissBootSplash, minimumSplashDelay } from "./boot";

/**
 * The splash is the one element that can hide the entire app, so the
 * only behaviour worth pinning is that it always goes away.
 */
function mountSplash() {
  document.body.innerHTML = `<div id="boot-splash"></div>`;
  return document.getElementById("boot-splash")!;
}

describe("dismissBootSplash", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("marks the splash as leaving so the fade can run", () => {
    const splash = mountSplash();
    dismissBootSplash();
    expect(splash.dataset.leaving).toBe("true");
  });

  it("removes the splash when the transition ends", () => {
    const splash = mountSplash();
    dismissBootSplash();
    splash.dispatchEvent(new Event("transitionend"));
    expect(document.getElementById("boot-splash")).toBeNull();
  });

  it("removes the splash even if transitionend NEVER fires", async () => {
    vi.useFakeTimers();
    mountSplash();
    dismissBootSplash();
    // A backgrounded tab composites nothing, so the event can be lost.
    // The timeout is what guarantees the app is reachable regardless.
    await vi.advanceTimersByTimeAsync(700);
    expect(document.getElementById("boot-splash")).toBeNull();
    vi.useRealTimers();
  });

  it("is safe to call twice (boot finishing and the hard cap racing)", () => {
    const splash = mountSplash();
    dismissBootSplash();
    expect(() => dismissBootSplash()).not.toThrow();
    splash.dispatchEvent(new Event("transitionend"));
    expect(document.getElementById("boot-splash")).toBeNull();
  });

  it("does nothing when there is no splash", () => {
    expect(() => dismissBootSplash()).not.toThrow();
  });
});

describe("minimumSplashDelay", () => {
  it("waits out the remainder on a warm start, so it cannot flash", async () => {
    vi.useFakeTimers();
    let settled = false;
    void minimumSplashDelay(Date.now()).then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(100);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(400);
    expect(settled).toBe(true);
    vi.useRealTimers();
  });

  it("does not add delay when boot was already slow", async () => {
    const longAgo = Date.now() - 5000;
    await expect(minimumSplashDelay(longAgo)).resolves.toBeUndefined();
  });
});
