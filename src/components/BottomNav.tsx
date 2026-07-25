/**
 * BottomNav — the five Stage 1 destinations (BINDING):
 * Today · Train · Forge · Proof · Settings.
 * Thumb-reachable, ≥44px targets, safe-area padded, keyboard operable.
 * (The older "4 tabs + floating Forge + Notes" IA is deferred.)
 */
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import todayIcon from "../design/assets/icons/today_96.webp";
import trainIcon from "../design/assets/icons/train_96.webp";
import forgeIcon from "../design/assets/icons/forge_96.webp";
import proofIcon from "../design/assets/icons/proof_96.webp";
import settingsIcon from "../design/assets/icons/settings_96.webp";

const DESTINATIONS = [
  { to: "/today", label: "Today", icon: todayIcon },
  { to: "/train", label: "Train", icon: trainIcon },
  { to: "/forge", label: "Forge", icon: forgeIcon },
  { to: "/proof", label: "Proof", icon: proofIcon },
  { to: "/settings", label: "Settings", icon: settingsIcon },
] as const;

/* Generated chrome icons (approved raster set). Screen-blended so the
   black frame drops out on the dark nav; active = full glow, inactive =
   dimmed. Decorative — the text label carries the accessible name. */
function NavGlyph({ icon, active }: { icon: string; active: boolean }) {
  return (
    <img
      src={icon}
      alt=""
      aria-hidden="true"
      width={26}
      height={26}
      className="block"
      style={{
        mixBlendMode: "screen",
        opacity: active ? 1 : 0.5,
        transition: "opacity var(--dur-fast) var(--ease-standard)",
      }}
    />
  );
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
                  <NavGlyph icon={d.icon} active={isActive} />
                  <span className="text-[0.6875rem] tracking-wide">
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
