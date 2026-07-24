/**
 * Proof — placeholder that doubles as the Threshold Arch demonstration.
 * Renders all seven crest levels so the layered progression is
 * verifiable in Stage 1. No streak logic, records, or completion
 * reveal (Stage 3).
 */
import { PlaceholderScreen } from "../components/PlaceholderScreen";
import { CrestEmblem } from "../components/CrestEmblem";
import { ThresholdArch, CREST_LEVEL_NAMES, type CrestLevel } from "../components/ThresholdArch";

export function Proof() {
  const levels: CrestLevel[] = [0, 1, 2, 3, 4, 5, 6];
  return (
    <PlaceholderScreen
      id="proof-heading"
      title="Proof"
      intent="A visible record of kept sessions — consistency you can see."
      stageNote="The consistency streak, chronological timeline, records, and the completion reveal are built in Stage 3. Below is the Chrome Crest (Threshold Arch) progression it will use."
      hero={
        <div className="flex flex-col items-center gap-3">
          <CrestEmblem level={3} size={132} />
          <span
            className="text-[0.6875rem] uppercase tracking-[0.2em]"
            style={{ color: "var(--aur-ink-muted)" }}
          >
            Silver Crest
          </span>
        </div>
      }
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
