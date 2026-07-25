/**
 * AURELIS Split Format (ASF) parser — Stage 2.
 * Implements 02_strategy/03_asf-spec.md and the exact ParseResult shape,
 * error taxonomy, and severity model in 02_strategy/07 (binding via the
 * fixtures in 02_strategy/fixtures/, asserted in parse.test.ts).
 *
 * Rules honored: optional-field defects (RPE/Rest/unknown tag/header) are
 * WARNINGS (non-blocking); required-field/structure defects are ERRORS;
 * weekday order is preserved, never sorted; nothing is silently dropped.
 * The parser is pure — no UI, no Dexie imports.
 */

export type RepScheme = "range" | "fixed" | "amrap";
export type Severity = "error" | "warning" | "info";

export interface ParsedExercise {
  name: string;
  sets: number | null;
  repMin: number | null;
  repMax: number | null;
  repScheme: RepScheme | null;
  perSide: boolean;
  rpeMin: number | null;
  rpeMax: number | null;
  restSec: number | null;
  note: string | null;
  flags: string[];
  raw: string;
}

export interface ParsedDay {
  name: string;
  note: string | null;
  exercises: ParsedExercise[];
}

export interface Program {
  name: string;
  scheduleWeekdays: number[]; // 0=Sun..6=Sat, order as written
  units: "lb" | "kg" | null;
  notes: string | null;
  days: ParsedDay[];
}

export interface ParseIssue {
  line: number | null;
  raw: string;
  field: string | null;
  severity: Severity;
  code: string;
  message: string;
}

export interface ParseResult {
  program: Program;
  issues: ParseIssue[];
}

export type Outcome = "VALID" | "VALID_WITH_REVIEW" | "INVALID";

export function outcomeOf(result: ParseResult): Outcome {
  const hasError = result.issues.some((i) => i.severity === "error");
  if (hasError) return "INVALID";
  const hasWarning = result.issues.some((i) => i.severity === "warning");
  return hasWarning ? "VALID_WITH_REVIEW" : "VALID";
}

const WEEKDAYS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

function emptyExercise(raw: string, name = ""): ParsedExercise {
  return {
    name,
    sets: null,
    repMin: null,
    repMax: null,
    repScheme: null,
    perSide: false,
    rpeMin: null,
    rpeMax: null,
    restSec: null,
    note: null,
    flags: [],
    raw,
  };
}

/** Rest → seconds: "120s" | "90" | "3m" | "2m30s" | "1m30s". null if unparseable. */
function parseRest(v: string): number | null {
  const s = v.trim().toLowerCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  if (/^\d+s$/.test(s)) return parseInt(s, 10);
  const mmss = s.match(/^(\d+)m(\d+)s?$/);
  if (mmss) return parseInt(mmss[1], 10) * 60 + parseInt(mmss[2], 10);
  const mm = s.match(/^(\d+)m$/);
  if (mm) return parseInt(mm[1], 10) * 60;
  return null;
}

/** RPE token → {min,max} in 1..10, or null if bad. Accepts "RPE 8" | "RPE 7-8" | "@8". */
function parseRpe(token: string): { min: number; max: number } | null {
  let body = token.trim();
  if (/^@/.test(body)) body = body.slice(1).trim();
  else if (/^rpe\b/i.test(body)) body = body.replace(/^rpe/i, "").trim();
  else return null;
  const range = body.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    const a = +range[1];
    const b = +range[2];
    if (a >= 1 && b <= 10 && a <= b) return { min: a, max: b };
    return null;
  }
  if (/^\d+$/.test(body)) {
    const n = +body;
    if (n >= 1 && n <= 10) return { min: n, max: n };
  }
  return null;
}

function isRpeToken(t: string): boolean {
  return /^(rpe\b|@\d)/i.test(t.trim());
}
function isRestToken(t: string): boolean {
  return /^rest\b/i.test(t.trim());
}
/** Capitalized keyword + value (e.g. "Tempo 3011", "RIR 2") → unknown tagged field. */
function isUnknownTaggedField(t: string): boolean {
  return /^[A-Z][A-Za-z-]+\s+\S+/.test(t.trim());
}

function parseExerciseFields(
  body: string,
  lineNo: number,
  raw: string,
  issues: ParseIssue[],
): ParsedExercise {
  const ex = emptyExercise(raw);

  if (!body.includes("|")) {
    issues.push({
      line: lineNo,
      raw,
      field: null,
      severity: "error",
      code: "MALFORMED_LINE",
      message: "No '|' fields found. Use: Name | Sets | Reps [| RPE n] [| Rest t].",
    });
    ex.flags.push("MALFORMED_LINE");
    return ex;
  }

  const fields = body.split("|").map((f) => f.trim());
  const [nameF, setsF, repsF, ...rest] = fields;

  // Name (required)
  ex.name = nameF ?? "";
  if (!ex.name) {
    issues.push({
      line: lineNo, raw, field: "Name", severity: "error", code: "MISSING_NAME",
      message: "Exercise name is empty (field before the first '|').",
    });
    ex.flags.push("MISSING_NAME");
  }

  // Sets (required)
  if (setsF === undefined || setsF === "") {
    issues.push({
      line: lineNo, raw, field: "Sets", severity: "error", code: "MISSING_SETS",
      message: "Sets missing. Provide a whole number 1–20.",
    });
    ex.flags.push("MISSING_SETS");
  } else if (!/^\d+$/.test(setsF) || +setsF < 1 || +setsF > 20) {
    issues.push({
      line: lineNo, raw, field: "Sets", severity: "error", code: "BAD_SETS",
      message: `Sets must be a whole number 1–20 (got "${setsF}").`,
    });
    ex.flags.push("BAD_SETS");
  } else {
    ex.sets = +setsF;
  }

  // Reps (required)
  if (repsF === undefined || repsF === "") {
    issues.push({
      line: lineNo, raw, field: "Reps", severity: "error", code: "MISSING_REPS",
      message: "Reps missing. Provide a third field, e.g. 8-10.",
    });
    ex.flags.push("MISSING_REPS");
  } else {
    const parsedReps = parseReps(repsF);
    if (!parsedReps) {
      issues.push({
        line: lineNo, raw, field: "Reps", severity: "error", code: "BAD_REPS",
        message: `Reps must be a range (6-8), a number (5), AMRAP, or a-b/side (got "${repsF}").`,
      });
      ex.flags.push("BAD_REPS");
    } else {
      ex.repMin = parsedReps.repMin;
      ex.repMax = parsedReps.repMax;
      ex.repScheme = parsedReps.repScheme;
      ex.perSide = parsedReps.perSide;
    }
  }

  // Optional tagged fields + free-text note
  const notes: string[] = [];
  for (const f of rest) {
    if (f === "") continue;
    if (isRpeToken(f)) {
      const rpe = parseRpe(f);
      if (rpe) {
        ex.rpeMin = rpe.min;
        ex.rpeMax = rpe.max;
      } else {
        issues.push({
          line: lineNo, raw, field: "RPE", severity: "warning", code: "BAD_RPE",
          message: `RPE not understood ("${f}"); left blank. Use RPE 1–10, e.g. RPE 8 or RPE 7-8.`,
        });
        ex.flags.push("BAD_RPE");
      }
    } else if (isRestToken(f)) {
      const secs = parseRest(f.replace(/^rest/i, "").trim());
      if (secs !== null) {
        ex.restSec = secs;
      } else {
        issues.push({
          line: lineNo, raw, field: "Rest", severity: "warning", code: "BAD_REST",
          message: `Rest not understood ("${f}"); left blank. Use seconds (90) or 120s, 2m, 1m30s.`,
        });
        ex.flags.push("BAD_REST");
      }
    } else if (isUnknownTaggedField(f)) {
      issues.push({
        line: lineNo, raw, field: f.split(/\s+/)[0], severity: "warning", code: "UNKNOWN_FIELD",
        message: `Unrecognized field '${f}' on ${ex.name || "exercise"}. Kept as a note; not applied.`,
      });
      ex.flags.push("UNKNOWN_FIELD");
      notes.push(f);
    } else {
      notes.push(f);
    }
  }
  if (notes.length) ex.note = notes.join(" · ");

  return ex;
}

interface RepsParsed {
  repMin: number | null;
  repMax: number | null;
  repScheme: RepScheme;
  perSide: boolean;
}
function parseReps(v: string): RepsParsed | null {
  let s = v.trim();
  let perSide = false;
  if (/\/side$/i.test(s)) {
    perSide = true;
    s = s.replace(/\/side$/i, "").trim();
  }
  if (/^amrap$/i.test(s)) {
    return { repMin: null, repMax: null, repScheme: "amrap", perSide };
  }
  const range = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    const a = +range[1];
    const b = +range[2];
    if (a <= b) return { repMin: a, repMax: b, repScheme: "range", perSide };
    return null;
  }
  if (/^\d+$/.test(s)) {
    const n = +s;
    return { repMin: n, repMax: n, repScheme: "fixed", perSide };
  }
  return null;
}

function parseSchedule(value: string): number[] {
  const out: number[] = [];
  for (const tok of value.split(/[,\s]+/)) {
    const key = tok.trim().toLowerCase();
    if (key && key in WEEKDAYS) out.push(WEEKDAYS[key]);
  }
  return out; // order preserved (LOCKED)
}

export function parseASF(text: string): ParseResult {
  const rawLines = text.split(/\r?\n/);
  const issues: ParseIssue[] = [];
  const program: Program = {
    name: "",
    scheduleWeekdays: [],
    units: null,
    notes: null,
    days: [],
  };
  const extraNotes: string[] = [];
  let currentDay: ParsedDay | null = null;
  let sawDay = false;
  let sawSplit = false;

  rawLines.forEach((rawLine, i) => {
    const lineNo = i + 1;
    const line = rawLine.replace(/\s+$/, "");
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) return;

    // Exercise line
    if (trimmed[0] === "-") {
      const body = trimmed.replace(/^-\s*/, "");
      if (!currentDay) {
        issues.push({
          line: lineNo, raw: trimmed, field: null, severity: "error",
          code: "EXERCISE_OUTSIDE_DAY",
          message: "Exercise line found before any 'DAY:' block. Add a 'DAY: <name>' line above it.",
        });
        return;
      }
      currentDay.exercises.push(parseExerciseFields(body, lineNo, trimmed, issues));
      return;
    }

    const kv = trimmed.match(/^([A-Za-z][A-Za-z-]*)\s*:\s*(.*)$/);
    if (!kv) return; // unrecognized non-directive line — ignored
    const key = kv[1].toUpperCase();
    const value = kv[2].trim();

    if (key === "DAY") {
      sawDay = true;
      currentDay = { name: value, note: null, exercises: [] };
      program.days.push(currentDay);
    } else if (key === "NOTE") {
      if (currentDay) currentDay.note = value;
      else extraNotes.push(`NOTE: ${value}`);
    } else if (key === "SPLIT") {
      program.name = value;
      sawSplit = true;
    } else if (key === "SCHEDULE") {
      program.scheduleWeekdays = parseSchedule(value);
    } else if (key === "UNITS") {
      const u = value.toLowerCase();
      if (u === "lb" || u === "kg") program.units = u;
      else {
        issues.push({
          line: lineNo, raw: trimmed, field: "Header", severity: "warning",
          code: "UNKNOWN_FIELD", message: `Units "${value}" not understood; expected lb or kg.`,
        });
      }
    } else if (key === "NOTES") {
      program.notes = value;
    } else {
      issues.push({
        line: lineNo, raw: trimmed, field: "Header", severity: "warning",
        code: "UNKNOWN_HEADER",
        message: `Unrecognized header '${kv[1]}'. Kept as a note; not applied.`,
      });
      extraNotes.push(trimmed);
    }
  });

  if (!sawDay) {
    issues.push({
      line: null, raw: "", field: null, severity: "error", code: "NO_DAY_BLOCKS",
      message: "No 'DAY:' blocks found. A split needs at least one day.",
    });
  }

  if (!sawSplit || program.name === "") {
    program.name = "Untitled Split";
    issues.push({
      line: null, raw: "", field: null, severity: "info", code: "DEFAULT_APPLIED",
      message: "SPLIT not provided; defaulted to 'Untitled Split'.",
    });
  }

  if (extraNotes.length) {
    program.notes = [program.notes, ...extraNotes].filter(Boolean).join("\n");
  }

  return { program, issues };
}
