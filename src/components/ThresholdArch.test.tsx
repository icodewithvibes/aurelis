import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ThresholdArch } from "./ThresholdArch";

describe("ThresholdArch", () => {
  it("shows only the stem (L0) at level 0", () => {
    const { container } = render(<ThresholdArch level={0} />);
    expect(container.querySelectorAll("[data-layer]")).toHaveLength(1);
    expect(container.querySelector('[data-layer="0"]')).toBeInTheDocument();
  });

  it("reveals layers cumulatively as level increases", () => {
    for (let level = 0; level <= 6; level++) {
      const { container } = render(
        <ThresholdArch level={level as 0 | 1 | 2 | 3 | 4 | 5 | 6} />,
      );
      const layers = container.querySelectorAll("[data-layer]");
      // level N reveals layers 0..N inclusive
      expect(layers).toHaveLength(level + 1);
      expect(container.querySelector("svg")).toHaveAttribute(
        "data-crest-level",
        String(level),
      );
    }
  });

  it("adds the right-arc prismatic layer only from level 5", () => {
    const { container: below } = render(<ThresholdArch level={4} />);
    expect(below.querySelector('[data-layer="5"]')).toBeNull();
    const { container: at } = render(<ThresholdArch level={5} />);
    expect(at.querySelector('[data-layer="5"]')).toBeInTheDocument();
  });

  it("adds botanical buds only at Ascendant (level 6)", () => {
    const { container } = render(<ThresholdArch level={6} />);
    expect(container.querySelector('[data-layer="6"]')).toBeInTheDocument();
    expect(container.querySelectorAll("circle")).toHaveLength(2);
  });

  it("exposes an accessible label", () => {
    const { getByRole } = render(<ThresholdArch level={3} />);
    expect(getByRole("img")).toHaveAttribute("aria-label", expect.stringContaining("Silver Crest"));
  });
});
