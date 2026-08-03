/**
 * FORGE movement art — the restyled reference images.
 *
 * The source photographs come from free-exercise-db (Unlicense, public
 * domain). Each one was passed back through an image model to redraw it
 * in the app's own language: the same pose, grip and camera, the same
 * equipment, but rendered as a stylized figure in a chrome helm against
 * the cobalt night the rest of FORGE lives in. The pose is the part
 * that must not drift — these are instructional, so a picture that looks
 * good and shows the wrong movement is worse than no picture.
 *
 * Two properties this file exists to guarantee:
 *
 * 1. SAME-ORIGIN. The art ships in the bundle, so the sheet no longer
 *    depends on raw.githubusercontent.com being reachable. It works
 *    offline, which is what a local-first app should have done anyway.
 *
 * 2. PARTIAL IS FINE. Art is added a batch at a time. Anything without
 *    a bundled file silently keeps the original photo from the CDN, so
 *    the library is never half-broken while the set is being filled in.
 */

/**
 * Eagerly resolved to URLs, not contents — Vite emits these as hashed
 * asset files and this map holds only the paths, so bundling every one
 * costs a few hundred bytes of JS rather than megabytes of image.
 */
const ART = import.meta.glob<string>("../../design/assets/exercises/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

/** `.../Barbell_Squat.webp` → `Barbell_Squat` */
function slugOf(filePath: string): string {
  return filePath.split("/").pop()!.replace(/\.webp$/, "");
}

const BY_SLUG = new Map<string, string>(
  Object.entries(ART).map(([path, url]) => [slugOf(path), url]),
);

/**
 * The art slug for a free-exercise-db image path.
 * `"Barbell_Squat/0.jpg"` → `"Barbell_Squat"`.
 */
export function artSlug(dbImagePath: string): string {
  return dbImagePath.replace(/^exercises\//, "").split("/")[0];
}

/** Bundled art for this movement, or null if it has not been made yet. */
export function artUrlFor(dbImagePath: string): string | null {
  return BY_SLUG.get(artSlug(dbImagePath)) ?? null;
}

/** How many movements currently have art — used by the coverage test. */
export function artCount(): number {
  return BY_SLUG.size;
}

/** Every slug that has art, for tests and tooling. */
export function artSlugs(): string[] {
  return [...BY_SLUG.keys()].sort();
}
