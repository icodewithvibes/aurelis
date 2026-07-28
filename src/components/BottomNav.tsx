/**
 * BottomNav — the five destinations: Today · Train · Forge · Proof · Settings.
 *
 * iOS standalone (Stage 6):
 * - The bar is fixed to the visual viewport and its background runs all
 *   the way to the physical bottom edge, while `env(safe-area-inset-bottom)`
 *   padding INSIDE the bar lifts the touch targets clear of the home
 *   indicator. That combination is what stops the bar either floating
 *   above the edge or sliding under the indicator.
 * - Targets stay >= 44px above the inset, not including it.
 *
 * Glass: the icons now carry a real alpha channel, so they composite on
 * the blur instead of being screen-blended rectangles with a visible
 * black field. Tint, rim and blur are theme tokens.
 */
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useMotionDisabled } from "../hooks/useMotionDisabled";
import todayIcon from "../design/assets/icons/today_128.webp";
import trainIcon from "../design/assets/icons/train_128.webp";
import forgeIcon from "../design/assets/icons/forge_128.webp";
import proofIcon from "../design/assets/icons/proof_128.webp";
import settingsIcon from "../design/assets/icons/settings_128.webp";

const DESTINATIONS = [
  { to: "/today", label: "Today", icon: todayIcon },
  { to: "/train", label: "Train", icon: trainIcon },
  { to: "/forge", label: "Forge", icon: forgeIcon },
  { to: "/proof", label: "Proof", icon: proofIcon },
  { to: "/settings", label: "Settings", icon: settingsIcon },
] as const;

/* Isolated glyphs: no blend mode needed, so they stay clean on any
   surface. Decorative — the text label carries the accessible name. */
function NavGlyph({ icon, active }: { icon: string; active: boolean }) {
  return (
    <img
      src={icon}
      alt=""
      aria-hidden="true"
      width={24}
      height={24}
      className="block"
      style={{
        opacity: active ? 1 : 0.55,
        transform: active ? "translate3d(0,-1px,0)" : "none",
        filter: active ? "drop-shadow(0 0 6px rgba(210,225,255,0.45))" : "none",
        transition:
          "opacity var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard), filter var(--dur-fast) var(--ease-standard)",
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
        /* Layered glass: a translucent tint over a saturated blur, with a
           chrome hairline catching light along the top edge. */
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 40%), var(--aur-nav-tint)",
        backdropFilter: "blur(var(--aur-glass-blur)) saturate(150%)",
        WebkitBackdropFilter: "blur(var(--aur-glass-blur)) saturate(150%)",
        borderTop: "1px solid var(--aur-glass-rim)",
        boxShadow: "0 -1px 0 0 rgba(255,255,255,0.05) inset, 0 -12px 32px rgba(3,7,18,0.45)",
        /*
         * iOS reserves ~34pt at the bottom, but the home indicator itself
         * is a ~5pt pill centred in it. Padding the FULL inset left a
         * visible dead band under the labels and pushed the bar up off
         * the edge. Reclaiming 12px still clears the indicator with room
         * to spare while sitting the row where a native tab bar sits.
         */
        paddingBottom: "max(calc(env(safe-area-inset-bottom, 0px) - 12px), 0px)",
      }}
    >
      <ul className="mx-auto flex max-w-md list-none items-stretch justify-around p-0 m-0">
        {DESTINATIONS.map((d) => (
          <li key={d.to} className="flex-1">
            <NavLink
              to={d.to}
              className="aur-press aur-touch relative flex flex-col items-center justify-center gap-0.5 no-underline"
              style={({ isActive }) => ({
                /* 46px keeps the target above the 44px floor while
                   removing the dead height that pushed the row up. */
                minHeight: 46,
                paddingTop: 6,
                paddingBottom: 4,
                color: isActive ? "var(--aur-chrome-50)" : "var(--aur-ink-muted)",
                transition: "color var(--dur-fast) var(--ease-standard)",
              })}
            >
              {({ isActive }) => (
                <>
                  <NavGlyph icon={d.icon} active={isActive} />
                  <span className="text-[0.625rem] leading-none tracking-wide">{d.label}</span>
                  {/* Absolutely positioned so the indicator costs no height. */}
                  {isActive && (
                    <motion.span
                      aria-hidden="true"
                      layoutId="aur-nav-underline"
                      className="absolute rounded-full"
                      style={{
                        bottom: 0,
                        height: 2,
                        width: 24,
                        background: "var(--aur-silver-200)",
                      }}
                      transition={
                        reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                      }
                    />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
