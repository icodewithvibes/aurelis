/**
 * BottomNav — the five Stage 1 destinations (BINDING):
 * Today · Train · Forge · Proof · Settings.
 * Thumb-reachable, ≥44px targets, safe-area padded, keyboard operable.
 * (The older "4 tabs + floating Forge + Notes" IA is deferred.)
 */
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useMotionDisabled } from "../hooks/useMotionDisabled";

const DESTINATIONS = [
  { to: "/today", label: "Today" },
  { to: "/train", label: "Train" },
  { to: "/forge", label: "Forge" },
  { to: "/proof", label: "Proof" },
  { to: "/settings", label: "Settings" },
] as const;

/* Minimal original glyphs — quiet line icons, no game iconography. */
function NavGlyph({ name }: { name: string }) {
  const stroke = "currentColor";
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "Today": // horizon sun-line: the day ahead
      return (
        <svg {...common}>
          <path d="M4 16h16" />
          <path d="M8 16a4 4 0 0 1 8 0" />
          <path d="M12 7v2M6.5 9.5l1.4 1.4M17.5 9.5l-1.4 1.4" />
        </svg>
      );
    case "Train": // barbell-free effort mark: stacked lifts as calm bars
      return (
        <svg {...common}>
          <path d="M5 18V10M12 18V6M19 18v-7" />
        </svg>
      );
    case "Forge": // threshold arch (crest silhouette)
      return (
        <svg {...common}>
          <path d="M7 19c0-8 2.2-12 5-13 2.8 1 5 5 5 13" />
          <path d="M7 19h10" />
        </svg>
      );
    case "Proof": // kept-mark: a check within a quiet ring
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9 12.5l2 2 4-4.5" />
        </svg>
      );
    case "Settings": // calm sliders
      return (
        <svg {...common}>
          <path d="M5 8h14M5 16h14" />
          <circle cx="10" cy="8" r="1.8" />
          <circle cx="15" cy="16" r="1.8" />
        </svg>
      );
    default:
      return null;
  }
}

export function BottomNav() {
  const reduce = useMotionDisabled();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40"
      style={{
        background: "rgba(7, 12, 24, 0.82)",
        backdropFilter: "blur(var(--aur-glass-blur))",
        WebkitBackdropFilter: "blur(var(--aur-glass-blur))",
        borderTop: "1px solid rgba(210, 217, 230, 0.12)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="mx-auto flex max-w-md list-none items-stretch justify-around p-0 m-0">
        {DESTINATIONS.map((d) => (
          <li key={d.to} className="flex-1">
            <NavLink
              to={d.to}
              className="aur-touch flex flex-col items-center justify-center gap-0.5 py-2 no-underline"
              style={({ isActive }) => ({
                color: isActive ? "var(--aur-chrome-50)" : "var(--aur-ink-muted)",
                transition: "color var(--dur-fast) var(--ease-standard)",
              })}
            >
              {({ isActive }) => (
                <>
                  <NavGlyph name={d.label} />
                  <span
                    className="text-[0.6875rem] tracking-wide"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {d.label}
                  </span>
                  <span aria-hidden="true" className="relative block h-0.5 w-6">
                    {isActive && (
                      <motion.span
                        layoutId="aur-nav-underline"
                        className="absolute inset-0 rounded-full"
                        style={{ background: "var(--aur-silver-200)" }}
                        transition={
                          reduce
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 420, damping: 34 }
                        }
                      />
                    )}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
