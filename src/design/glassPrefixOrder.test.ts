import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Guards the one authoring rule that the production bundle silently
 * depends on, and that nothing in a browser preview can catch.
 *
 * Tailwind v4 runs this file through Lightning CSS at a hard-coded
 * Safari 16.4 floor (`@tailwindcss/node`, not configurable). Unprefixed
 * `backdrop-filter` only shipped in Safari 18, so when a rule declares
 * the standard property BEFORE `-webkit-`, Lightning collapses the pair
 * and emits the prefixed form alone — Firefox then gets no glass at all,
 * in production only. Chrome accepts `-webkit-backdrop-filter` as an
 * alias, so a Chrome preview always looks correct and this regression
 * ships unnoticed. It already did once.
 *
 * Writing `-webkit-` first and the standard property last keeps both.
 */
/* The suite runs in jsdom, where `import.meta.url` is an http URL — so
   resolve from the project root instead. */
const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

/** Declarations only — `@supports (...)` conditions are not declarations. */
function declarationsIn(block: string): string[] {
  return [...block.matchAll(/(^|[;{]|\s)(-webkit-)?backdrop-filter\s*:/g)].map((m) =>
    m[2] ? "-webkit-backdrop-filter" : "backdrop-filter",
  );
}

/** Every `selector { ... }` block, excluding at-rule preludes. */
function ruleBlocks(source: string): string[] {
  return [...source.matchAll(/\{([^{}]*)\}/g)].map((m) => m[1]);
}

describe("glass backdrop-filter prefix order", () => {
  const blocks = ruleBlocks(css).filter((b) => /backdrop-filter\s*:/.test(b));

  it("declares backdrop-filter in at least one rule (guard is wired to something)", () => {
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("pairs every unprefixed backdrop-filter with a -webkit- twin", () => {
    for (const block of blocks) {
      const decls = declarationsIn(block);
      const standard = decls.filter((d) => d === "backdrop-filter").length;
      const webkit = decls.filter((d) => d === "-webkit-backdrop-filter").length;
      expect(standard, `unpaired declaration in: ${block.trim().slice(0, 80)}`).toBe(webkit);
    }
  });

  it("always writes -webkit- FIRST so Lightning CSS keeps both", () => {
    for (const block of blocks) {
      const decls = declarationsIn(block);
      for (let i = 0; i < decls.length; i += 2) {
        expect(
          decls[i],
          `standard property precedes -webkit- in: ${block.trim().slice(0, 80)}`,
        ).toBe("-webkit-backdrop-filter");
        expect(decls[i + 1]).toBe("backdrop-filter");
      }
    }
  });
});
