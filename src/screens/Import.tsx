/**
 * Import — paste ASF, review the parse (issues + parsed days), then save
 * as the active split (02_strategy/03 §5). Errors block saving and are
 * shown clearly; warnings are non-blocking; nothing is invented.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScreenSurface } from "../components/ScreenSurface";
import { parseASF, outcomeOf, type ParseIssue } from "../features/asf/parse";
import { commitImport } from "../features/asf/importSplit";

const EXAMPLE = `SPLIT: Push / Pull / Legs
SCHEDULE: Mon, Wed, Fri

DAY: Push A
- Bench Press | 4 | 6-8 | RPE 8 | Rest 120s
- Incline Dumbbell Press | 3 | 8-10 | RPE 8 | Rest 90s
- Cable Fly | 3 | 12-15 | RPE 7 | Rest 60s

DAY: Pull A
- Deadlift | 3 | 3-5 | RPE 8 | Rest 180s
- Barbell Row | 4 | 8-10 | RPE 8 | Rest 90s`;

function severityColor(sev: ParseIssue["severity"]) {
  return sev === "error" ? "var(--aur-danger)" : sev === "warning" ? "var(--aur-caution)" : "var(--aur-ink-muted)";
}

export function Import() {
  const nav = useNavigate();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const result = useMemo(() => (text.trim() ? parseASF(text) : null), [text]);
  const outcome = result ? outcomeOf(result) : null;
  const errors = result?.issues.filter((i) => i.severity === "error") ?? [];
  const warnings = result?.issues.filter((i) => i.severity === "warning") ?? [];
  const canSave = !!result && errors.length === 0;

  async function onSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      await commitImport(text);
      nav("/train");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenSurface labelledBy="import-heading">
      <header className="pt-2">
        <h1 id="import-heading" className="aur-title">
          Import a split
        </h1>
        <p className="m-0 mt-2 text-body" style={{ color: "var(--aur-ink-muted)" }}>
          Paste your program in FORGE Split Format. Review, then save.
        </p>
      </header>

      <section className="mt-4 aur-chrome-surface p-4">
        <label htmlFor="asf" className="aur-label">
          ASF text
        </label>
        <textarea
          id="asf"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"SPLIT: …\nSCHEDULE: Mon, Wed, Fri\n\nDAY: Push A\n- Bench Press | 4 | 6-8 | RPE 8 | Rest 120s"}
          spellCheck={false}
          className="aur-metric mt-2 w-full rounded-lg p-3 text-small"
          style={{
            minHeight: "9rem", resize: "vertical", color: "var(--aur-ink)",
            background: "rgba(7,12,24,0.55)", border: "1px solid rgba(210,217,230,0.14)",
          }}
        />
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => setText(EXAMPLE)} className="aur-touch rounded-full px-4 text-small"
            style={{ background: "rgba(210,217,230,0.1)", color: "var(--aur-ink)", border: "none" }}>
            Load example
          </button>
          {text && (
            <button type="button" onClick={() => setText("")} className="aur-touch rounded-full px-4 text-small"
              style={{ background: "transparent", color: "var(--aur-ink-muted)", border: "none" }}>
              Clear
            </button>
          )}
        </div>
      </section>

      {result && (
        <section className="mt-4 aur-chrome-surface p-4" aria-label="Parse review">
          <div className="flex items-center justify-between">
            <p className="aur-label m-0">
              Review
            </p>
            <span className="aur-metric text-[0.6875rem]" style={{
              color: outcome === "INVALID" ? "var(--aur-danger)" : outcome === "VALID_WITH_REVIEW" ? "var(--aur-caution)" : "var(--aur-success)",
            }}>
              {outcome === "INVALID" ? "Needs fixes" : outcome === "VALID_WITH_REVIEW" ? "Review warnings" : "Ready"}
            </span>
          </div>

          {(errors.length > 0 || warnings.length > 0) && (
            <ul className="mt-3 m-0 flex list-none flex-col gap-1.5 p-0">
              {[...errors, ...warnings].map((iss, idx) => (
                <li key={idx} className="text-small" style={{ color: severityColor(iss.severity) }}>
                  {iss.line ? `Line ${iss.line}: ` : ""}{iss.message}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4">
            {result.program.days.map((d, di) => (
              <div key={di} className="mb-3">
                <p className="m-0 font-medium">{d.name}</p>
                <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
                  {d.exercises.map((ex, ei) => (
                    <li key={ei} className="flex items-baseline justify-between gap-2 text-small">
                      <span style={{ color: ex.flags.length ? "var(--aur-caution)" : "var(--aur-ink)" }}>{ex.name || "(unnamed)"}</span>
                      <span className="aur-metric whitespace-nowrap" style={{ color: "var(--aur-ink-muted)" }}>
                        {ex.sets ?? "—"}×{ex.repScheme === "amrap" ? "AMRAP" : ex.repMin === ex.repMax ? ex.repMin ?? "—" : `${ex.repMin ?? "?"}-${ex.repMax ?? "?"}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onSave}
            disabled={!canSave || saving}
            aria-disabled={!canSave || saving}
            className="aur-touch mt-2 w-full rounded-full text-body font-medium"
            style={{
              background: canSave ? "var(--aur-chrome-50)" : "rgba(210,217,230,0.14)",
              color: canSave ? "var(--aur-night)" : "var(--aur-ink-faint)",
              border: "none", padding: "0.875rem 1.5rem",
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Saving…" : "Save as active split"}
          </button>
          {!canSave && errors.length > 0 && (
            <p className="m-0 mt-2 text-center text-[0.6875rem]" style={{ color: "var(--aur-ink-faint)" }}>
              Fix the errors above to save. Nothing is imported until it's clean.
            </p>
          )}
        </section>
      )}
    </ScreenSurface>
  );
}
