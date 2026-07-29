import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { SPLIT_LIBRARY, templateExerciseNames } from "../splits/library";
import { normalizeName, TEXT_ONLY_EXERCISES } from "./exerciseDb";
import { artSlug } from "./exerciseArt";
import index from "./exerciseIndex.json";

/**
 * Every movement a shipped split can put in front of you must have
 * bundled art — same-origin, offline, and in the app's own visual
 * language. Anything the art is missing for silently falls back to the
 * CDN photo, which works but looks foreign; this test is what stops
 * that happening by accident when a split gains an exercise.
 *
 * Reads the directory rather than the import.meta.glob map, because
 * the glob does not resolve under vitest's node transform.
 */
const ART_DIR = resolve(process.cwd(), "src/design/assets/exercises");
const artFiles = new Set(
  readdirSync(ART_DIR).filter((f) => f.endsWith(".webp")).map((f) => f.replace(/\.webp$/, "")),
);

const byKey = new Map((index as { k: string; i: string }[]).map((e) => [e.k, e]));

/** Every distinct exercise the library can show a photo for. */
function libraryExercisesNeedingArt(): { name: string; slug: string }[] {
  const names = new Set<string>();
  for (const t of SPLIT_LIBRARY) for (const n of templateExerciseNames(t)) names.add(n);

  const out: { name: string; slug: string }[] = [];
  for (const name of names) {
    if (TEXT_ONLY_EXERCISES.has(normalizeName(name))) continue; // cardio, no photo by design
    const entry = byKey.get(normalizeName(name));
    if (entry) out.push({ name, slug: artSlug(entry.i) });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

describe("movement art coverage", () => {
  const needed = libraryExercisesNeedingArt();

  it("finds the library's exercises (guard is wired to something)", () => {
    expect(needed.length).toBeGreaterThan(40);
  });

  it("has bundled art for EVERY exercise in every shipped split", () => {
    const missing = needed.filter((n) => !artFiles.has(n.slug)).map((n) => `${n.name} (${n.slug}.webp)`);
    expect(missing, `missing art:\n${missing.join("\n")}`).toEqual([]);
  });

  it("ships no orphan art for exercises no split uses", () => {
    // Not fatal, but it means dead bytes in the bundle.
    const used = new Set(needed.map((n) => n.slug));
    expect([...artFiles].filter((f) => !used.has(f))).toEqual([]);
  });

  it("maps a database image path to its art slug", () => {
    expect(artSlug("Barbell_Squat/0.jpg")).toBe("Barbell_Squat");
    expect(artSlug("exercises/Barbell_Squat/0.jpg")).toBe("Barbell_Squat");
  });
});
