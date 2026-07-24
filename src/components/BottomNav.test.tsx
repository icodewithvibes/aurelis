import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { BottomNav } from "./BottomNav";

describe("BottomNav", () => {
  it("renders exactly the five binding Stage 1 destinations", () => {
    const { getAllByRole, getByRole } = render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>,
    );
    const links = getAllByRole("link");
    expect(links).toHaveLength(5);
    for (const label of ["Today", "Train", "Forge", "Proof", "Settings"]) {
      expect(getByRole("link", { name: new RegExp(label) })).toBeInTheDocument();
    }
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
