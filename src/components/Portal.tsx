/**
 * Portal — renders an overlay as a child of <body>, out of the tree.
 *
 * WHY THIS EXISTS, so nobody inlines a `position: fixed` overlay again:
 *
 * `position: fixed` is only fixed to the VIEWPORT while no ancestor
 * creates a containing block for it. A `transform`, `filter`,
 * `backdrop-filter`, `perspective`, `will-change` on any of those, or
 * `contain: paint` is enough to steal that role — after which
 * `inset: 0` means "fill that ancestor", not "fill the screen".
 *
 * Every screen here animates its cards in with framer-motion
 * (`initial: { y: 10 }`), and `.aur-chrome-surface` carries a real
 * `backdrop-filter`. So a sheet rendered inline next to the button that
 * opens it resolved against a ~400px card: the full-bleed backdrop
 * still painted over most of the screen, while the panel itself was
 * laid out hundreds of pixels BELOW the fold. Measured on the live
 * site: dialog 416x1452 at (432,235) instead of the 1280x720 viewport,
 * with the sheet at top: 1160px on a 720px-tall screen.
 *
 * That is why it read as "a blurred overlay with no panel" — nothing
 * had failed to load, it was simply off-screen. It survived desktop
 * review because framer-motion settles to `transform: none` once the
 * entrance animation finishes, so a card you interact with a second
 * after load behaves. iOS defers those animations when the standalone
 * PWA is restored from a snapshot or throttled in Low Power Mode; the
 * transform then never clears and the overlay is broken every time.
 *
 * Portaling to <body> removes the variable permanently: there is no
 * ancestor left to capture it.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

export function Portal({ children }: { children: ReactNode }) {
  // Mount-gated so the first paint matches on any renderer that runs
  // this without a document; after mount <body> is always there.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
