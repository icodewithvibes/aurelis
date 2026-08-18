import { describe, expect, it } from "vitest";
import {
  findStack,
  stackGroups,
  stackLevel,
  stackSnapshot,
  stacksForGaps,
  stacksForGroup,
  STACKS,
  STACK_LEVELS,
} from "./stacks";
import { hasBundledArt, loadExerciseIndex, matchExercise } from "../exercises/exerciseDb";
import { COVERAGE_GROUPS } from "./coverage";

const index = await loadExerciseIndex();

/**
 * Does the app actually have a picture of this movement?
 *
 * An earlier version asked `hasReference()`, which only says the name is
 * not on the nine-item text-only list — it returns true for literally
 * any other string, including "Banana Press". It could not fail, so it
 * never caught anything, and it hid a real bug for weeks.
 *
 * This resolves the name the way the app does at runtime. Bundled FORGE
 * art is preferred and reported separately, but a movement with only the
 * source photo still counts as showable: restricting stacks to the 59
 * movements with art meant prescribing barbell wrist curls to people
 * whose gym has dumbbells and a cable stack, which is a worse trade
 * than a photo that needs a network.
 */
function showable(name: string): boolean {
  return matchExercise(name, index) !== null;
}

function hasArt(name: string): boolean {
  const info = matchExercise(name, index);
  return info !== null && hasBundledArt(info.i);
}

const everyMovement = () => [
  ...new Set(STACKS.flatMap((s) => s.levels.flatMap((l) => l.exercises.map((e) => e.name)))),
];

describe("the stack library", () => {
  it("only prescribes movements the app can show you", () => {
    for (const s of STACKS) {
      for (const lvl of s.levels) {
        for (const e of lvl.exercises) {
          expect({ stack: s.id, level: lvl.id, movement: e.name, showable: showable(e.name) }).toEqual({
            stack: s.id,
            level: lvl.id,
            movement: e.name,
            showable: true,
          });
        }
      }
    }
  });

  it("keeps most of the prescribed work on bundled FORGE art", () => {
    // Art works offline and matches the app's own language; the source
    // photo is the fallback, not the norm. If this ratio slips it means
    // the stacks have drifted onto movements nobody has drawn yet.
    const names = everyMovement();
    const withArt = names.filter(hasArt).length;
    expect({ total: names.length, withArt: withArt >= names.length * 0.6 }).toEqual({
      total: names.length,
      withArt: true,
    });
  });

  it("proves that check can fail", () => {
    // Guards the guard: if `showable` ever starts returning true for
    // everything again, this is the test that goes red first.
    expect(showable("Banana Press")).toBe(false);
    expect(hasArt("Banana Press")).toBe(false);
  });

  it("never prescribes the wrist roller", () => {
    // Not every gym has one and you cannot improvise it — offering it as
    // the answer to "I haven't got the equipment" is the worst possible
    // suggestion.
    expect(everyMovement()).not.toContain("Wrist Roller");
  });

  it("uses real coverage groups, so gap matching cannot silently miss", () => {
    for (const s of STACKS) {
      for (const c of s.covers) {
        expect(COVERAGE_GROUPS).toContain(c);
      }
    }
  });

  it("has unique ids", () => {
    expect(new Set(STACKS.map((s) => s.id)).size).toBe(STACKS.length);
  });

  it("offers all three levels on every stack, in order", () => {
    for (const s of STACKS) {
      expect(s.levels.map((l) => l.id)).toEqual(STACK_LEVELS);
    }
  });

  it("makes each level harder than the one before it", () => {
    // "Levels" that are all the same length are just three buttons.
    for (const s of STACKS) {
      const minutes = s.levels.map((l) => l.minutes);
      expect(minutes[0]).toBeLessThan(minutes[1]);
      expect(minutes[1]).toBeLessThan(minutes[2]);
    }
  });

  it("is short enough to actually be added onto a day", () => {
    // A "stack" that takes an hour is just another training day.
    for (const s of STACKS) {
      for (const lvl of s.levels) {
        expect({ stack: s.id, level: lvl.id, minutes: lvl.minutes }).toEqual({
          stack: s.id,
          level: lvl.id,
          minutes: expect.any(Number),
        });
        expect(lvl.minutes).toBeLessThanOrEqual(22);
        expect(lvl.exercises.length).toBeLessThanOrEqual(5);
        expect(lvl.exercises.length).toBeGreaterThan(0);
      }
    }
  });

  it("covers the gaps that prompted this — abs, forearms, lower back", () => {
    const covered = new Set(STACKS.flatMap((s) => s.covers));
    expect(covered.has("abs")).toBe(true);
    expect(covered.has("forearms")).toBe(true);
    expect(covered.has("lowerBack")).toBe(true);
  });

  it("has a block for every major muscle group someone might want alone", () => {
    // "I want to train chest today and nothing else" has to have an
    // answer, not just the groups splits usually miss.
    const covered = new Set(STACKS.flatMap((s) => s.covers));
    for (const g of COVERAGE_GROUPS) {
      expect({ group: g, hasStack: covered.has(g) }).toEqual({ group: g, hasStack: true });
    }
  });


  it("builds the grip block from dumbbells and cables, not specialty kit", () => {
    // The complaint this answers: gyms do not have wrist rollers, and
    // the ones that do keep them behind the front desk.
    const grip = findStack("grip")!;
    const names = grip.levels.flatMap((l) => l.exercises.map((e) => e.name));
    const equipment = names.map((n) => matchExercise(n, index)?.e ?? null);
    for (const e of equipment) {
      expect(["dumbbell", "cable", "other"]).toContain(e);
    }
    // Both sides of the wrist, and a hold, at standard.
    const standard = grip.levels[1].exercises.map((e) => e.name).join(" | ");
    expect(standard).toContain("Palms-Up");
    expect(standard).toContain("Palms-Down");
  });

  it("trains all four jobs of the core, not four crunches", () => {
    const core = findStack("core")!.levels[2].exercises.map((e) => e.name);
    expect(core).toContain("Pallof Press"); // anti-rotation
    expect(core).toContain("Side Bridge"); // anti-lateral flexion
    expect(core).toContain("Cable Crunch"); // loaded flexion
    expect(core).toContain("Ab Roller"); // anti-extension
  });

  it("starter levels leave out the movements that need a strength floor", () => {
    const demanding = [
      "Pullups",
      "Dips - Triceps Version",
      "Natural Glute Ham Raise",
      "Hanging Leg Raise",
      "Ab Roller",
      "Barbell Deadlift",
    ];
    for (const s of STACKS) {
      const starter = stackLevel(s, "starter").exercises.map((e) => e.name);
      for (const d of demanding) expect(starter).not.toContain(d);
    }
  });
});

describe("stacksForGaps", () => {
  it("offers nothing when there is nothing missing", () => {
    expect(stacksForGaps([])).toEqual([]);
  });

  it("offers the focused block for a single gap", () => {
    expect(stacksForGaps(["abs"])[0].id).toBe("core");
    expect(stacksForGaps(["forearms"])[0].id).toBe("grip");
    expect(stacksForGaps(["lowerBack"])[0].id).toBe("lower-back");
  });

  it("never offers a stack that misses the gap entirely", () => {
    for (const s of stacksForGaps(["abs"])) {
      expect(s.covers).toContain("abs");
    }
  });

  it("ranks a stack that closes more of the list first", () => {
    const ranked = stacksForGaps(["biceps", "triceps", "calves"]);
    // Arms closes two of the three; calves closes one.
    expect(ranked[0].id).toBe("arms");
  });

  it("breaks ties toward the shorter block", () => {
    const ranked = stacksForGaps(["abs", "forearms", "calves"]);
    const minutes = ranked.map((s) => stackLevel(s).minutes);
    // All three close exactly one gap, so the quickest comes first.
    expect(minutes[0]).toBeLessThanOrEqual(minutes[minutes.length - 1]);
  });
});

describe("picking by muscle", () => {
  it("finds every stack that trains a group", () => {
    expect(stacksForGroup("abs").map((s) => s.id)).toContain("core");
    expect(stacksForGroup("back").map((s) => s.id)).toEqual(
      expect.arrayContaining(["back", "shoulders-health"]),
    );
  });

  it("lists the filterable groups without duplicates", () => {
    const groups = stackGroups();
    expect(new Set(groups).size).toBe(groups.length);
    expect(groups).toContain("quads");
  });
});

describe("stackSnapshot", () => {
  it("produces a session snapshot the logger can run", () => {
    const snap = stackSnapshot(findStack("core")!);
    expect(snap.dayName).toBe("Core stack · Standard");
    expect(snap.exercises.length).toBeGreaterThan(0);
    for (const e of snap.exercises) {
      expect(typeof e.key).toBe("string");
      expect(e.sets).toBeGreaterThan(0);
      expect(e.repMax).toBeGreaterThanOrEqual(e.repMin);
    }
  });

  it("gives every exercise a distinct key", () => {
    for (const s of STACKS) {
      for (const id of STACK_LEVELS) {
        const keys = stackSnapshot(s, id).exercises.map((e) => e.key);
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });

  it("names the level, so two levels of one stack are distinguishable", () => {
    // Stack sessions sit in the same log as split sessions, and doing
    // the starter block and the hard block in one week has to read as
    // two different things later.
    const stack = findStack("grip")!;
    const starter = stackSnapshot(stack, "starter").dayName;
    const hard = stackSnapshot(stack, "hard").dayName;
    expect(starter).not.toBe(hard);
    expect(starter).toContain("Grip & forearms stack");
    expect(hard).toContain("Hard");
  });

  it("falls back to the standard level rather than to nothing", () => {
    const stack = findStack("calves")!;
    expect(stackLevel(stack).id).toBe("standard");
  });
});
