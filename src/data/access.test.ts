import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { db, initDb } from "./db";
import { loadHome } from "./access";
import { commitImport } from "../features/asf/importSplit";

const here = dirname(fileURLToPath(import.meta.url));
const fx = (n: string) => readFileSync(resolve(here, "../../02_strategy/fixtures", n), "utf8");

beforeEach(async () => {
  await db.delete();
  await initDb();
});

describe("loadHome (real data seam)", () => {
  it("reports no split before import", async () => {
    const home = await loadHome();
    expect(home.hasSplit).toBe(false);
    expect(home.days).toHaveLength(0);
    expect(home.sessionsKept).toBe(0);
  });

  it("reports the active split and its days after import", async () => {
    await commitImport(fx("asf-valid-basic.txt"));
    const home = await loadHome();
    expect(home.hasSplit).toBe(true);
    expect(home.splitName).toBe("Push / Pull / Legs");
    expect(home.days[0].name).toBe("Push A");
    expect(typeof home.isTrainingDay).toBe("boolean");
  });
});
