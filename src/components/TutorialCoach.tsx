/**
 * TutorialCoach — the interactive tour.
 *
 * Dims the whole screen except a hole around the control being
 * explained, points an arrow at it, and puts the instruction in a glass
 * card placed on whichever side has room.
 *
 * THE SPOTLIGHT is a box-shadow trick, not an SVG mask: a transparent
 * div sized to the target with `box-shadow: 0 0 0 9999px <dim>` darkens
 * everything outside itself. It needs no clip path, survives any
 * layout, and costs one element.
 *
 * POSITION IS MEASURED, NEVER ANIMATED. Every frame reads the target's
 * real rect and writes styles directly. That matters here more than
 * anywhere: iOS defers animations in a restored PWA, and a tour whose
 * arrow depends on a tween would point at empty space. The same lesson
 * as the tutorial's AnimatePresence and the session collapse.
 *
 * A MISSING TARGET IS SOFT. If the element is not on screen — a
 * conditional button, a screen that has not finished loading — the step
 * falls back to a centred card and the tour continues. Dimming the
 * screen to point at nothing would be worse than not pointing.
 *
 * Rendered through <Portal>, for the containing-block reason in
 * Portal.tsx.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Portal } from "./Portal";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import { TOUR_STEPS, targetSelector } from "../features/onboarding/tour";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Breathing room around the spotlight, so the control is not clipped. */
const PAD = 8;
const CARD_MAX = 380;
const CARD_GAP = 14;

interface TutorialCoachProps {
  onClose: () => void;
  onRevert: () => Promise<string>;
}

export function TutorialCoach({ onClose, onRevert }: TutorialCoachProps) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [reverting, setReverting] = useState(false);
  const [revertMessage, setRevertMessage] = useState<string | null>(null);
  const nav = useNavigate();
  const reduce = useMotionDisabled();
  const cardRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[index];
  const isLast = index === TOUR_STEPS.length - 1;

  // Navigate first, so the target has a chance to exist.
  useEffect(() => {
    if (step.route) nav(step.route);
  }, [step.route, nav]);

  /*
   * Track the target while the step is up.
   *
   * MEASURED SYNCHRONOUSLY FIRST, then polled on a timer — deliberately
   * NOT requestAnimationFrame. rAF only fires while the page is
   * actually compositing, so a tour built on it points at nothing the
   * moment rendering is throttled: a backgrounded PWA, a low-power
   * phone, a headless check. The spotlight would sit in the corner
   * while the card confidently said "tap Train".
   *
   * This is the third time the same shape of bug has appeared here —
   * AnimatePresence in the old tutorial, the session collapse, now this.
   * The rule is the same each time: never let what the user SEES depend
   * on an animation or a frame arriving.
   *
   * setInterval runs regardless, and the first measurement happens
   * inline so the very first paint is already correct. The retry ladder
   * covers a target that mounts late — a route change fetching a lazy
   * chunk, a list still loading.
   */
  useLayoutEffect(() => {
    const selector = targetSelector(step);
    if (!selector) {
      setRect(null);
      return;
    }

    let scrolled = false;

    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) {
        setRect(null); // soft failure — centred card, tour continues
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) {
        setRect(null);
        return;
      }
      // Scroll at most once per step, and only if it is off screen.
      if (!scrolled && (r.top < 8 || r.bottom > window.innerHeight - 8)) {
        scrolled = true;
        el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    measure();
    const timer = setInterval(measure, 120);
    return () => clearInterval(timer);
  }, [step, reduce]);

  // Escape leaves. Lock the DOCUMENT, not <body> — see ExercisePreview.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function revert() {
    setReverting(true);
    setRevertMessage(await onRevert());
    setReverting(false);
  }

  /* Card goes below the target when there is room, otherwise above. */
  const below = rect ? rect.top + rect.height + CARD_GAP : 0;
  const spaceBelow = rect ? window.innerHeight - below : 0;
  const placeBelow = rect ? spaceBelow > 250 : true;

  const cardStyle: React.CSSProperties = rect
    ? {
        position: "fixed",
        left: "50%",
        transform: "translateX(-50%)",
        width: `min(${CARD_MAX}px, calc(100vw - 2rem))`,
        ...(placeBelow
          ? { top: below }
          : { bottom: window.innerHeight - rect.top + CARD_GAP }),
      }
    : {
        position: "fixed",
        left: "50%",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
        transform: "translateX(-50%)",
        width: `min(${CARD_MAX}px, calc(100vw - 2rem))`,
      };

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Guided tour"
        className="fixed inset-0 z-[70]"
        style={{ pointerEvents: "none" }}
      >
        {/* The dim. With a target this is the ring around the hole; with
            none it is a plain scrim. pointer-events auto so stray taps
            outside the highlight do not fire the app underneath. */}
        {rect ? (
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              borderRadius: 14,
              boxShadow: "0 0 0 9999px rgba(4,8,18,0.72)",
              border: "2px solid var(--aur-chrome-50)",
              pointerEvents: "none",
              transition: reduce ? "none" : "all 220ms var(--ease-standard)",
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            className="fixed inset-0"
            style={{ background: "rgba(4,8,18,0.72)", pointerEvents: "auto" }}
          />
        )}

        {/* The arrow, pointing from the card toward the target. */}
        {rect && (
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              left: Math.min(Math.max(rect.left + rect.width / 2, 24), window.innerWidth - 24),
              top: placeBelow ? rect.top + rect.height + PAD : rect.top - PAD - 14,
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "9px solid transparent",
              borderRight: "9px solid transparent",
              ...(placeBelow
                ? { borderBottom: "12px solid var(--aur-chrome-50)" }
                : { borderTop: "12px solid var(--aur-chrome-50)" }),
              pointerEvents: "none",
            }}
          />
        )}

        {/* The instruction card. */}
        <div
          ref={cardRef}
          style={{
            ...cardStyle,
            pointerEvents: "auto",
            borderRadius: 18,
            background:
              "linear-gradient(177deg, rgba(30,44,80,0.62) 0%, rgba(15,24,52,0.72) 48%, rgba(10,17,38,0.8) 100%)",
            WebkitBackdropFilter: "blur(26px) saturate(180%)",
            backdropFilter: "blur(26px) saturate(180%)",
            border: "1px solid var(--aur-glass-rim)",
            boxShadow:
              "inset 0 1px 0 rgba(232,240,255,0.28), 0 18px 50px rgba(3,7,18,0.55)",
          }}
        >
          <div className="px-5 pt-4 pb-4">
            <div className="flex items-start justify-between gap-3">
              <span className="aur-label m-0">
                Step {index + 1} of {TOUR_STEPS.length}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="aur-touch text-small"
                style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)", padding: "0.2rem 0" }}
              >
                Skip
              </button>
            </div>

            <h2 className="aur-heading m-0 mt-2">{step.title}</h2>
            <p className="m-0 mt-2 text-small" style={{ color: "var(--aur-ink-muted)" }}>
              {step.body}
            </p>
            {step.action && (
              <p className="aur-meta m-0 mt-2" style={{ color: "var(--aur-chrome-50)" }}>
                ↑ {step.action} — or press Next
              </p>
            )}

            {isLast && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => void revert()}
                  disabled={reverting || revertMessage !== null}
                  className="aur-press aur-touch w-full rounded-full text-small"
                  style={{
                    background: "transparent",
                    color: revertMessage ? "var(--aur-ink-muted)" : "var(--aur-ink)",
                    border: "1px solid var(--aur-glass-rim)",
                    padding: "0.6rem 1rem",
                  }}
                >
                  {reverting
                    ? "Undoing…"
                    : revertMessage ?? "Undo everything this tour created"}
                </button>
                <p className="aur-meta m-0 mt-1.5">
                  Only removes what happened during the tour. Anything you had before is
                  untouched.
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => setIndex((i) => i - 1)}
                  className="aur-press aur-touch rounded-full px-4 text-small"
                  style={{
                    background: "var(--aur-glass-tint)",
                    color: "var(--aur-ink)",
                    border: "1px solid var(--aur-glass-rim)",
                  }}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
                className="aur-press aur-touch flex-1 rounded-full text-body font-medium"
                style={{
                  background: "var(--aur-chrome-50)",
                  color: "var(--aur-night)",
                  border: "none",
                  padding: "0.75rem 1.25rem",
                }}
              >
                {isLast ? "Done" : "Next"}
              </button>
            </div>

            {/* Dots double as jump targets. */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              {TOUR_STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={s.title}
                  aria-current={i === index}
                  onClick={() => setIndex(i)}
                  style={{ background: "transparent", border: "none", padding: 5 }}
                >
                  <span
                    className="block rounded-full"
                    style={{
                      width: i === index ? 16 : 5,
                      height: 5,
                      background:
                        i === index ? "var(--aur-chrome-50)" : "var(--aur-glass-rim-strong)",
                      transition: reduce ? "none" : "width 220ms var(--ease-standard)",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
