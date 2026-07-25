/**
 * Media/environment capability helpers (Stage 1).
 * Save-Data: when the user requests reduced data, optional raster
 * imagery is skipped entirely and CSS fallbacks render instead
 * (03_assets/06 §6, manifests 09/12 §4).
 */

type ConnectionLike = { saveData?: boolean };

export type ImageMode = "auto" | "save-data" | "always";

/**
 * The user's image preference, mirrored here so synchronous render paths
 * can consult it without an async read. The UI store sets it on boot and
 * whenever Settings changes it.
 */
let imageMode: ImageMode = "auto";

export function setImageModePreference(mode: ImageMode): void {
  imageMode = mode;
}

/**
 * Whether optional raster imagery may be fetched at all.
 * - always: the user asked for imagery even on a metered connection
 * - save-data: the user opted out entirely
 * - auto: honour the browser's Save-Data signal
 * The app is fully correct when this is false; CSS atmosphere takes over.
 */
export function imageryAllowed(): boolean {
  if (imageMode === "always") return true;
  if (imageMode === "save-data") return false;
  return !saveDataRequested();
}

export function saveDataRequested(): boolean {
  const nav = navigator as Navigator & {
    connection?: ConnectionLike;
    mozConnection?: ConnectionLike;
    webkitConnection?: ConnectionLike;
  };
  const conn = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
  return conn?.saveData === true;
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
