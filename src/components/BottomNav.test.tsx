import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BottomNav } from "./BottomNav";

describe("BottomNav", () => {
  it("renders exactly the six destinations", () => {
    const { getAllByRole, getByRole } = render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );
    const links = getAllByRole("link");
    // Six is the ceiling: at 390px this is ~65px per target, still clear
    // of the 44px floor. A seventh would need a different nav entirely.
    expect(links).toHaveLength(6);
    for (const label of ["Today", "Plan", "Train", "Forge", "Proof", "Settings"]) {
      expect(getByRole("link", { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it("gives Plan a glyph even though it has no raster icon", () => {
    // Plan draws an inline SVG instead of loading a .webp; the nav must
    // not render a broken <img> for it.
    const { container } = render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );
    expect(container.querySelectorAll("img")).toHaveLength(5);
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(1);
  });

  it("does not include the deferred Notes destination", () => {
    const { queryByRole } = render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );
    expect(queryByRole("link", { name: /Notes/i })).toBeNull();
  });
});
