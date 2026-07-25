import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Backplate } from "./Backplate";

/**
 * The binding rule for optional imagery: the app must be correct without
 * it, and it must never look broken. A failed raster has to disappear so
 * the solid CSS atmosphere underneath shows through.
 */
afterEach(() => {
  vi.unstubAllGlobals();
});

function stubSaveData(on: boolean) {
  vi.stubGlobal("navigator", { ...navigator, connection: { saveData: on } });
}

describe("Backplate", () => {
  it("renders the raster layer normally", () => {
    const { container } = render(<Backplate variant="forge" />);
    expect(container.querySelector("[data-backplate='forge']")).not.toBeNull();
    expect(container.querySelectorAll("img").length).toBeGreaterThan(0);
  });

  it("unmounts the whole raster when the image fails, leaving the CSS atmosphere", () => {
    const { container } = render(<Backplate variant="forge" />);
    const main = container.querySelector("picture img") as HTMLImageElement;

    fireEvent.error(main);

    // No element at all — a broken <img> would paint a broken-image glyph.
    expect(container.querySelector("[data-backplate='forge']")).toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(0);
  });

  it("drops only the LQIP when just the placeholder fails", () => {
    const { container } = render(<Backplate variant="forge" />);
    const lqip = container.querySelector("img") as HTMLImageElement;

    fireEvent.error(lqip);

    // The real image is still worth trying.
    expect(container.querySelector("picture img")).not.toBeNull();
  });

  it("renders nothing at all under Save-Data", () => {
    stubSaveData(true);
    const { container } = render(<Backplate variant="forge" />);
    expect(container.firstChild).toBeNull();
  });

  it("marks imagery decorative so it is never announced", () => {
    const { container } = render(<Backplate variant="meadow" />);
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });
});
