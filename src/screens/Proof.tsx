/**
 * Proof — placeholder that doubles as the Threshold Arch demonstration.
 * Renders all seven crest levels so the layered progression is
 * verifiable in Stage 1. No streak logic, records, or completion
 * reveal (Stage 3).
 */
import { PlaceholderScreen } from "../components/PlaceholderScreen";
import { ProofSystem } from "../components/ProofSystem";
import { getTodayView } from "../data/access";
import { ThresholdArch, CREST_LEVEL_NAMES, type CrestLevel } from "../components/ThresholdArch";

export function Proof() {
  const levels: CrestLevel[] = [0, 1, 2, 3, 4, 5, 6];
  const { sessionsKept } = getTodayView();
  return (
    <PlaceholderScreen
      id="proof-heading"
      title="Proof"
      intent="A visible record of kept sessions — consistency you can see."
      stageNote="Streak logic, the chronological timeline, records, and the completion reveal are built in Stage 3. The crest, its progress line, and the prismatic accent above preview that proof language."
      hero={<ProofSystem sessionsKept={sessionsKept} variant="hero" />}
    >
      <div className="mt-4">
        <p
          className="m-0 mb-3 text-[0.6875rem] uppercase tracking-[0.18em]"
          style={{ color: "var(--aur-ink-muted)" }}
        >
          Chrome Crest — seven levels
        </p>
        <ul className="m-0 grid list-none grid-cols-4 gap-3 p-0" data-crest-demo>
          {levels.map((lvl) => (
            <li key={lvl} className="flex flex-col items-center gap-1 text-center">
              <ThresholdArch level={lvl} size={44} />
              <span
                className="text-[0.625rem] leading-tight"
                style={{ color: "var(--aur-ink-muted)" }}
              >
                {CREST_LEVEL_NAMES[lvl]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </PlaceholderScreen>
  );
}
