/**
 * Tutorial — the one-time walkthrough.
 *
 * A card of real glass floating over a darkened, blurred app, so the
 * thing being explained stays visible behind the explanation rather
 * than being replaced by a slideshow.
 *
 * Rendered through <Portal> — not optional. Every screen animates its
 * cards in with framer-motion, and a live `transform` on any ancestor
 * would make THAT the containing block for a `position: fixed` child,
 * dropping this overlay hundreds of pixels off-screen. That exact bug
 * cost a session once; see Portal.tsx.
 *
 * Motion is a crossfade plus a short horizontal slide, direction
 * following the way you are moving through the steps. Under reduced
 * motion the slide disappears and only the content swaps — the whole
 * thing still works with no animation at all.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Portal } from "./Portal";
import { CrestEmblem } from "./CrestEmblem";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import { TUTORIAL_STEPS } from "../features/onboarding/tutorial";

interface TutorialProps {
  onClose: () => void;
}

export function Tutorial({ onClose }: TutorialProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const reduce = useMotionDisabled();
  const nav = useNavigate();

  const step = TUTORIAL_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === TUTORIAL_STEPS.length - 1;

  // Escape leaves, and the page behind must not scroll under the card.
  // Locks the DOCUMENT, not <body> — body's overflow does not reach the
  // viewport here and setting it would make body its own scroller.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, TUTORIAL_STEPS.length - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    document.addEventListener("keydown", onKey);
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = prev;
    };
  }, [onClose]);

  function go(next: number) {
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  function finish(route?: string) {
    onClose();
    if (route) nav(route);
  }

  /* Enter-only: there is no AnimatePresence, so an `exit` variant would
     never run. The outgoing step is replaced outright. */
  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, x: direction * 24 },
        animate: { opacity: 1, x: 0 },
      };

  return (
    <Portal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Getting started"
        className="fixed inset-0 z-[60] flex items-end justify-center px-4"
        style={{
          background: "rgba(4,8,18,0.58)",
          WebkitBackdropFilter: "blur(14px) saturate(140%)",
          backdropFilter: "blur(14px) saturate(140%)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
        }}
      >
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: 18, scale: 0.985 }}
          animate={reduce ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md overflow-hidden"
          style={{
            borderRadius: 22,
            /* Real glass: a translucent tint over a saturated blur, with
               a chrome rim catching light along the top edge. */
            background:
              "linear-gradient(177deg, rgba(30,44,80,0.52) 0%, rgba(15,24,52,0.62) 48%, rgba(10,17,38,0.7) 100%)",
            WebkitBackdropFilter: "blur(28px) saturate(180%)",
            backdropFilter: "blur(28px) saturate(180%)",
            border: "1px solid var(--aur-glass-rim)",
            boxShadow:
              "inset 0 1px 0 rgba(232,240,255,0.30), inset 0 -26px 44px rgba(5,9,20,0.30), 0 20px 60px rgba(3,7,18,0.55)",
          }}
        >
          {/* Sheen along the top curve — where light would actually catch. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-24"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 40%, transparent 100%)",
            }}
          />

          <div className="relative px-6 pt-6 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <CrestEmblem level={isLast ? 3 : 1} size={38} halo={false} />
                <span className="aur-label m-0">
                  Step {index + 1} of {TUTORIAL_STEPS.length}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="aur-touch text-small"
                style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)", padding: "0.25rem 0" }}
              >
                Skip
              </button>
            </div>

            {/*
              A keyed motion.div, NOT AnimatePresence.

              `mode="wait"` will not mount the next step until the
              previous one's EXIT animation finishes — which makes the
              content depend on an animation completing. iOS defers
              animations in a restored standalone PWA (the same failure
              this codebase hit in PR #19), and the tutorial would then
              sit on step one forever while the counter climbed.

              Keying the element instead swaps the content immediately
              and animates it in afterwards. Worst case the motion is
              skipped and the words are simply there, which is the
              correct way round for something that has to be readable.
            */}
            <div className="mt-4" style={{ minHeight: 188 }}>
              <motion.div
                key={step.id}
                {...slide}
                transition={{ duration: reduce ? 0.15 : 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="aur-heading m-0">{step.title}</h2>
                {step.where && (
                  <p
                    className="aur-meta m-0 mt-1.5"
                    style={{ color: "var(--aur-chrome-50)", letterSpacing: "0.08em" }}
                  >
                    {step.where}
                  </p>
                )}
                <p className="m-0 mt-3 text-body" style={{ color: "var(--aur-ink-muted)" }}>
                  {step.body}
                </p>
              </motion.div>
            </div>

            {/* Dots double as jump targets, so nobody is trapped in a queue. */}
            <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="Steps">
              {TUTORIAL_STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={s.title}
                  onClick={() => go(i)}
                  className="aur-touch"
                  style={{ background: "transparent", border: "none", padding: 6 }}
                >
                  <span
                    className="block rounded-full"
                    style={{
                      width: i === index ? 18 : 6,
                      height: 6,
                      background: i === index ? "var(--aur-chrome-50)" : "var(--aur-glass-rim-strong)",
                      transition: "width 260ms var(--ease-standard), background 260ms var(--ease-standard)",
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              {!isFirst && (
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  className="aur-press aur-touch rounded-full px-5 text-body"
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
                onClick={() => (isLast ? finish() : go(index + 1))}
                className="aur-press aur-touch flex-1 rounded-full text-body font-medium"
                style={{
                  background: "var(--aur-chrome-50)",
                  color: "var(--aur-night)",
                  border: "none",
                  padding: "0.85rem 1.5rem",
                }}
              >
                {isLast ? "Start" : "Next"}
              </button>
            </div>

            {/* A step that names somewhere can take you there and close.
                Offered on the last step too — "Start" and "go to
                Settings" are both reasonable ways to finish. */}
            {step.route && step.cta && (
              <button
                type="button"
                onClick={() => finish(step.route)}
                className="aur-touch mt-2 w-full text-small"
                style={{ background: "transparent", border: "none", color: "var(--aur-ink-muted)", padding: "0.4rem 0" }}
              >
                {step.cta} →
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </Portal>
  );
}
