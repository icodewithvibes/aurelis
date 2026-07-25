/**
 * ProofSystem — the mock proof/streak VISUAL LANGUAGE (Stage 1).
 *
 * No streak calculation, no completion action — it maps a sample
 * session count to a crest tier (lib/crest) purely to communicate what
 * the future Proof surface will feel like: the Threshold Arch as the
 * proof object, a chrome edge-light progress line, restrained bloom,
 * and a single static prismatic glint as the reveal-language hint.
 * Clearly marked as sample; wired to nothing.
 */
import { CrestEmblem } from "./CrestEmblem";
import { PrismaticGlint } from "./PrismaticGlint";
import { crestStateForSessions } from "../lib/crest";

interface ProofSystemProps {
  sessionsKept: number;
  /** hero = large centered ceremony; compact = inline summary. */
  variant?: "hero" | "compact";
}

export function ProofSystem({ sessionsKept, variant = "hero" }: ProofSystemProps) {
  const s = crestStateForSessions(sessionsKept);

  if (variant === "compact") {
    return (
      <div className="flex flex-col items-center gap-1.5 pt-1" aria-label="Proof (sample)">
        <CrestEmblem level={s.level} size={72} />
        <span className="font-mono text-[0.6875rem] tracking-wide" style={{ color: "var(--aur-ink-muted)" }}>
          {s.name}
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4" aria-label="Proof system (sample)">
      <CrestEmblem level={s.level} size={140} richBloom />

      <div className="text-center">
        <p
          className="m-0"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-h2)",
            letterSpacing: "-0.01em",
          }}
        >
          {s.name}
        </p>
        <p className="m-0 mt-0.5 font-mono text-small" style={{ color: "var(--aur-ink-muted)" }}>
          {sessionsKept} {sessionsKept === 1 ? "session" : "sessions"} kept
        </p>
      </div>

      {/* Chrome edge-light progress toward the next tier + prismatic reveal hint. */}
      <div className="w-full max-w-[15rem]">
        <div
          className="relative h-[3px] overflow-hidden rounded-full"
          style={{ background: "rgba(210,217,230,0.14)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.round(s.progress * 100)}%`,
              background:
                "linear-gradient(90deg, var(--aur-cobalt-500), var(--aur-silver-200))",
            }}
          />
        </div>
        <div className="mt-2">
          {/* One static prismatic glint — the reveal language, never looped. */}
          <PrismaticGlint className="mx-auto h-3 w-40" opacity={0.6} />
        </div>
        <p
          className="m-0 mt-2 text-center text-[0.6875rem]"
          style={{ color: "var(--aur-ink-faint)" }}
        >
          {s.nextName ? `${s.toNext} kept until ${s.nextName}` : "Highest crest reached"}
        </p>
      </div>
    </div>
  );
}
