/**
 * Media/environment capability helpers (Stage 1).
 * Save-Data: when the user requests reduced data, optional raster
 * imagery is skipped entirely and CSS fallbacks render instead
 * (03_assets/06 §6, manifests 09/12 §4).
 */

type ConnectionLike = { saveData?: boolean };

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
