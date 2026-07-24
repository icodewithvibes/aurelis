import { PlaceholderScreen } from "../components/PlaceholderScreen";

/**
 * Forge — reflection / reset. The approved Group 4 Forge-night
 * backplate is allowed here ONLY. No journal input, no engine, and
 * no safety copy in Stage 1 — those are Stage 3 (kept off a busy
 * image region by design).
 */
export function Forge() {
  return (
    <PlaceholderScreen
      id="forge-heading"
      title="Forge"
      intent="A quiet place to set resistance down and find the next honest step."
      stageNote="The deterministic Forge engine, its calm responses, and the safety flow are built in Stage 3. This surface is a placeholder."
      backplate="forge"
    />
  );
}
