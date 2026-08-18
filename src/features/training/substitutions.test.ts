import { describe, expect, it } from "vitest";
import {
  alternativesFor,
  findAlternatives,
  findMovement,
  MOVEMENTS,
  SWAP_REASONS,
} from "./substitutions";
import { hasBundledArt, loadExerciseIndex, matchExercise } from "../exercises/exerciseDb";
import { COVERAGE_GROUPS } from "./coverage";

const index = await loadExerciseIndex();

function showable(name: string): boolean {
  return matchExercise(name, index) !== null;
}

function hasArt(name: string): boolean {
  const info = matchExercise(name, index);
  return info !== null && hasBundledArt(info.i);
}

describe("the substitution pool", () => {
  it("can show a picture of everything it suggests", () => {
    // The person asking for an alternative is being offered a movement
    // they may never have done. Without a picture that is a worse
    // answer than the one they could not do. Bundled art is preferred
    // (checked below); the source photo is an acceptable fallback.
    for (const m of MOVEMENTS) {
      expect({ movement: m.name, showable: showable(m.name) }).toEqual({
        movement: m.name,
        showable: true,
      });
    }
  });

  it("proves that check can fail", () => {
    expect(showable("Banana Press")).toBe(false);
    expect(hasArt("Banana Press")).toBe(false);
  });

  it("keeps most of the pool on bundled FORGE art", () => {
    const withArt = MOVEMENTS.filter((m) => hasArt(m.name)).length;
    expect({ pool: MOVEMENTS.length, mostlyArt: withArt >= MOVEMENTS.length * 0.6 }).toEqual({
      pool: MOVEMENTS.length,
      mostlyArt: true,
    });
  });

  it("never suggests the wrist roller", () => {
    expect(MOVEMENTS.map((m) => m.name)).not.toContain("Wrist Roller");
  });

  it("uses real coverage groups", () => {
    for (const m of MOVEMENTS) expect(COVERAGE_GROUPS).toContain(m.group);
  });

  it("has no duplicate movements", () => {
    expect(new Set(MOVEMENTS.map((m) => m.name)).size).toBe(MOVEMENTS.length);
  });

  it("offers something for every muscle group", () => {
    const groups = new Set(MOVEMENTS.map((m) => m.group));
    for (const g of COVERAGE_GROUPS) {
      expect({ group: g, covered: groups.has(g) }).toEqual({ group: g, covered: true });
    }
  });
});

describe("findMovement", () => {
  it("matches the exact name", () => {
    expect(findMovement("Barbell Squat")?.name).toBe("Barbell Squat");
  });

  it("matches how people actually write it", () => {
    expect(findMovement("bench press")?.name).toBe("Barbell Bench Press - Medium Grip");
    expect(findMovement("Leg press")?.name).toBe("Leg Press");
  });

  it("prefers the plainest movement when a word matches several", () => {
    // "Squat" must not resolve to Weighted Sissy Squat.
    expect(findMovement("squat")?.name).toBe("Barbell Squat");
  });

  it("returns null rather than guessing", () => {
    expect(findMovement("Sled Push")).toBeNull();
    expect(findMovement("   ")).toBeNull();
  });
});

describe("alternatives when the station is taken", () => {
  it("never offers the same equipment, because that is what is occupied", () => {
    const alts = alternativesFor("Leg Press", "taken");
    expect(alts.length).toBeGreaterThan(0);
    const kits = alts.map((a) => a.kit);
    // The leg press is a machine; another machine is another queue.
    expect(kits.slice(0, 2)).not.toContain("machine");
  });

  it("never offers the movement it is replacing", () => {
    for (const m of MOVEMENTS) {
      for (const r of SWAP_REASONS) {
        const alts = alternativesFor(m.name, r.id);
        expect(alts.map((a) => a.name)).not.toContain(m.name);
      }
    }
  });

  it("leads with the same movement pattern on different kit", () => {
    const alts = alternativesFor("Barbell Bench Press - Medium Grip", "taken");
    // Pushups are the same horizontal press without the bench.
    expect(alts[0].name).toBe("Pushups");
  });

  it("answers for every movement in the pool, on every reason", () => {
    // An empty sheet sends the user back to standing next to a busy
    // machine — the one outcome this feature exists to prevent.
    for (const m of MOVEMENTS) {
      for (const r of SWAP_REASONS) {
        const alts = alternativesFor(m.name, r.id);
        expect({ movement: m.name, reason: r.id, count: alts.length > 0 }).toEqual({
          movement: m.name,
          reason: r.id,
          count: true,
        });
      }
    }
  });

  it("answers a taken hip thrust with other glute work first", () => {
    const alts = alternativesFor("Barbell Hip Thrust", "taken");
    expect(alts.length).toBeGreaterThan(0);
    expect(alts[0].why).not.toContain("Not the same muscle");
  });

  it("puts every same-muscle answer ahead of any near miss", () => {
    // The ladder widens; it must not interleave. A hamstring movement
    // should never sit above a glute one when the ask was glutes.
    for (const m of MOVEMENTS) {
      for (const r of SWAP_REASONS) {
        const kinds = alternativesFor(m.name, r.id).map((a) =>
          a.why.startsWith("Not the same muscle") ? "near" : "same",
        );
        const firstNear = kinds.indexOf("near");
        if (firstNear === -1) continue;
        expect({ movement: m.name, reason: r.id, clean: !kinds.slice(firstNear).includes("same") })
          .toEqual({ movement: m.name, reason: r.id, clean: true });
      }
    }
  });

  it("still falls through to the nearest muscle when it has to", () => {
    // Nothing else in the pool trains lower back with a barbell taken
    // out AND the machine excluded, so this has to reach hamstrings.
    const alts = alternativesFor("Reverse Hyperextension", "taken");
    expect(alts.length).toBeGreaterThan(0);
    expect(alts.some((a) => a.why.startsWith("Not the same muscle"))).toBe(true);
  });
});

describe("alternatives when the gym hasn't got the kit", () => {
  it("prefers bodyweight and dumbbells, which every gym has", () => {
    const alts = alternativesFor("Wide-Grip Lat Pulldown", "noKit");
    expect(["bodyweight", "dumbbell"]).toContain(alts[0].kit);
  });

  it("answers a barbell wrist curl with dumbbell and cable work", () => {
    // The exact complaint: forearm work has to survive a gym that keeps
    // its specialty kit behind the front desk.
    const alts = alternativesFor("Palms-Up Barbell Wrist Curl Over A Bench", "noKit");
    expect(alts.length).toBeGreaterThan(0);
    for (const a of alts) expect(["dumbbell", "cable", "plate"]).toContain(a.kit);
  });

  it("drops the missing kit entirely", () => {
    for (const a of alternativesFor("Barbell Squat", "noKit")) {
      expect(a.kit).not.toBe("barbell");
    }
  });
});

describe("alternatives when you can't do the movement", () => {
  it("never offers something that needs a strength floor of its own", () => {
    const alts = alternativesFor("Pullups", "tooHard");
    expect(alts.map((a) => a.name)).not.toContain("Chin-Up");
    expect(alts.length).toBeGreaterThan(0);
  });

  it("leans on machines and cables, which take the skill out of it", () => {
    const alts = alternativesFor("Pullups", "tooHard");
    expect(["machine", "cable"]).toContain(alts[0].kit);
  });

  it("keeps the same kit available, because the kit was never the problem", () => {
    const alts = alternativesFor("Hanging Leg Raise", "tooHard");
    expect(alts.map((a) => a.name)).toContain("Plank");
  });
});

describe("the reason shown to the user", () => {
  it("says whether it is the same movement or a different angle", () => {
    const same = alternativesFor("Barbell Curl", "taken").find((a) => a.name === "Hammer Curls");
    expect(same?.why).toContain("Same movement");

    const different = alternativesFor("Barbell Squat", "noKit").find(
      (a) => a.name === "Bodyweight Walking Lunge",
    );
    expect(different?.why).toContain("Different angle");
  });

  it("never claims a near-miss is the same muscle", () => {
    const alts = alternativesFor("Barbell Hip Thrust", "noKit");
    for (const a of alts) {
      if (a.why.startsWith("Not the same muscle")) continue;
      expect(a.why).not.toContain("Not the same muscle");
    }
  });
});

describe("findAlternatives, for names outside the table", () => {
  it("falls back to the exercise index to work out what it trains", async () => {
    // Not in MOVEMENTS, but the bundled index knows it is a chest press.
    const alts = await findAlternatives("Decline Dumbbell Bench Press", "taken");
    expect(alts.length).toBeGreaterThan(0);
    for (const a of alts) expect(a.why).toContain("same muscle");
  });

  it("returns nothing rather than nonsense for a name nobody knows", async () => {
    expect(await findAlternatives("Zzzz Machine Thing", "taken")).toEqual([]);
  });

  it("uses the fast path when the name is one of ours", async () => {
    const direct = alternativesFor("Barbell Squat", "taken");
    expect(await findAlternatives("Barbell Squat", "taken")).toEqual(direct);
  });
});
