# ASF Parser — Test-Fixture Acceptance Suite

Companion to [03_asf-spec.md](03_asf-spec.md). Fixtures live in [`fixtures/`](fixtures/). This doc is the **acceptance contract**: each fixture's exact input, expected outcome, expected structured result (valid), and expected issue(s) with line/field/recovery (invalid).

---

## 0. Parser contract (binding)
- **Never crashes** on malformed input. Any unexpected shape → an `issue`, never a thrown exception that escapes `parseASF()`.
- **Never silently ignores an unrecognized field.** Unknown headers and unknown exercise tags become **visible warnings**, preserved as raw, surfaced in the editor.
- **Validate before saving.** `parseASF()` is pure; nothing is written to IndexedDB by the parser.
- **Preserve valid rows, flag invalid rows.** One bad line never discards good lines.
- **Review always required.** The guided editor **always** opens after parse — even on a 0-issue valid file — and "Save as active split" is enabled only when **0 `error`-severity** issues remain.
- **No** messy-note / OCR / AI / screenshot parsing. ASF only.
- **Parser is UI- and DB-independent.** Signature: `parseASF(text: string): ParseResult`. No imports from React, Zustand, or Dexie.

### Output shape
```ts
type ParseResult = { program: Program; issues: ParseIssue[] }

type Program = {
  name: string; scheduleWeekdays: number[]; // 0=Sun..6=Sat
  units: 'lb'|'kg'|null; notes: string|null;
  days: Array<{ name: string; note: string|null; exercises: Exercise[] }>
}
type Exercise = {
  name: string; sets: number|null;
  repMin: number|null; repMax: number|null;
  repScheme: 'range'|'fixed'|'amrap'|null; perSide: boolean;
  rpeMin: number|null; rpeMax: number|null;
  restSec: number|null; note: string|null;
  flags: string[]; // issue codes attached to this row, e.g. ['BAD_SETS']
}
type ParseIssue = {
  line: number|null;          // 1-based; null = program-level
  raw: string;                // original line text (or '')
  field: string|null;         // 'Sets'|'Reps'|'RPE'|'Rest'|'Name'|'Header'|null
  severity: 'error'|'warning'|'info';
  code: string;               // taxonomy below
  message: string;            // human-readable
}
```

### Outcome vocabulary
- **VALID** — 0 `error`, 0 `warning` (info allowed). Editor opens; Save enabled.
- **VALID-WITH-REVIEW** — ≥1 `warning`, 0 `error`. Editor opens with highlights; Save enabled after user acknowledges. Row data preserved (bad *optional* value cleared to `null`).
- **INVALID** — ≥1 `error`. Editor opens with highlights; **Save disabled** until every error line is fixed or removed.

### Severity rules (why an "invalid-" file can be VALID-WITH-REVIEW)
- **error** = a *required* field is missing/unparseable, or structure is broken (no day, malformed line). Blocks save.
- **warning** = an *optional* field is malformed/unknown (RPE, Rest, unknown tag/header). Non-blocking; value cleared + flagged, never silently dropped.
- **info** = a benign default was applied (e.g., missing `SPLIT` → default name). Non-blocking, not highlighted as a problem.

### Error-code taxonomy
| Code | Severity | Field | Meaning |
|---|---|---|---|
| `NO_DAY_BLOCKS` | error | null | File has no `DAY:` block. |
| `EXERCISE_OUTSIDE_DAY` | error | null | `- ` line before any `DAY:`. |
| `MALFORMED_LINE` | error | null | `- ` line with no `|` delimiter. |
| `MISSING_NAME` | error | Name | Field 1 empty. |
| `MISSING_SETS` | error | Sets | Field 2 absent. |
| `MISSING_REPS` | error | Reps | Field 3 absent. |
| `BAD_SETS` | error | Sets | Sets not an integer in 1–20. |
| `BAD_REPS` | error | Reps | Reps not `a-b` \| `n` \| `AMRAP` \| `a-b/side`. |
| `BAD_RPE` | warning | RPE | RPE non-numeric or outside 1–10. Value cleared. |
| `BAD_REST` | warning | Rest | Rest not parseable to seconds. Value cleared. |
| `UNKNOWN_FIELD` | warning | Header/tag | Unrecognized tagged exercise field. Kept as raw note + flag. |
| `UNKNOWN_HEADER` | warning | Header | Unrecognized `KEY:` header. Kept as raw program note. |
| `DEFAULT_APPLIED` | info | varies | Benign default (missing SPLIT/UNITS). |

Weekday map: Sun 0, Mon 1, Tue 2, Wed 3, Thu 4, Fri 5, Sat 6.
Rest normalization: `120s`→120 · `90`→90 · `3m`→180 · `2m30s`→150 · `150s`→150.

---

## VALID FIXTURES

### F1 — `fixtures/asf-valid-basic.txt`
- **Purpose:** canonical happy path; required + all optional fields, one day.
- **Source text (7 lines):**
  ```
  1  SPLIT: Push / Pull / Legs
  2  SCHEDULE: Mon, Wed, Fri
  3
  4  DAY: Push A
  5  - Bench Press | 4 | 6-8 | RPE 8 | Rest 120s
  6  - Incline Dumbbell Press | 3 | 8-10 | RPE 8 | Rest 90s
  7  - Cable Fly | 3 | 12-15 | RPE 7 | Rest 60s
  ```
- **Expected outcome:** VALID. (`units:null` → app default; emit `info DEFAULT_APPLIED` for units, non-blocking, or omit — implementer's choice, must not be a warning.)
- **Expected parsed result:**
  ```json
  { "name":"Push / Pull / Legs", "scheduleWeekdays":[1,3,5], "units":null, "notes":null,
    "days":[ { "name":"Push A", "note":null, "exercises":[
      {"name":"Bench Press","sets":4,"repMin":6,"repMax":8,"repScheme":"range","perSide":false,"rpeMin":8,"rpeMax":8,"restSec":120,"note":null,"flags":[]},
      {"name":"Incline Dumbbell Press","sets":3,"repMin":8,"repMax":10,"repScheme":"range","perSide":false,"rpeMin":8,"rpeMax":8,"restSec":90,"note":null,"flags":[]},
      {"name":"Cable Fly","sets":3,"repMin":12,"repMax":15,"repScheme":"range","perSide":false,"rpeMin":7,"rpeMax":7,"restSec":60,"note":null,"flags":[]}
    ]}]}
  ```
- **Editor opens:** YES (always). Save enabled.

### F2 — `fixtures/asf-valid-complete.txt`
- **Purpose:** exercise every documented feature — comment line, all four headers, multi-weekday schedule, day `NOTE:`, `AMRAP`, `@9`, RPE range, rest in `3m` / `2m30s` / `150s`, `/side`, trailing free-text note, and a valid exercise with RPE omitted (optional).
- **Source text (16 lines):**
  ```
  1  # AURELIS Split Format — full feature sample
  2  SPLIT: Upper / Lower Power-Hypertrophy
  3  SCHEDULE: Mon, Tue, Thu, Fri
  4  UNITS: kg
  5  NOTES: Deload every 5th week. Warm up before compounds.
  6
  7  DAY: Upper Power
  8  NOTE: Focus on bar speed.
  9  - Barbell Bench Press | 4 | 3-5 | RPE 8 | Rest 3m
  10 - Weighted Pull-up | 4 | AMRAP | @9 | Rest 2m30s
  11 - Overhead Press | 3 | 5-7 | RPE 7-8 | Rest 120s
  12
  13 DAY: Lower Power
  14 - Back Squat | 4 | 3-5 | RPE 8 | Rest 3m
  15 - Romanian Deadlift | 3 | 6-8 | Rest 150s | keep neutral spine
  16 - Walking Lunge | 3 | 10-12/side | RPE 7 | Rest 90s
  ```
- **Expected outcome:** VALID (line 1 comment ignored; blanks ignored).
- **Expected parsed result (abridged — key normalizations):**
  ```json
  { "name":"Upper / Lower Power-Hypertrophy", "scheduleWeekdays":[1,2,4,5], "units":"kg",
    "notes":"Deload every 5th week. Warm up before compounds.",
    "days":[
      {"name":"Upper Power","note":"Focus on bar speed.","exercises":[
        {"name":"Barbell Bench Press","sets":4,"repMin":3,"repMax":5,"repScheme":"range","perSide":false,"rpeMin":8,"rpeMax":8,"restSec":180,"note":null,"flags":[]},
        {"name":"Weighted Pull-up","sets":4,"repMin":null,"repMax":null,"repScheme":"amrap","perSide":false,"rpeMin":9,"rpeMax":9,"restSec":150,"note":null,"flags":[]},
        {"name":"Overhead Press","sets":3,"repMin":5,"repMax":7,"repScheme":"range","perSide":false,"rpeMin":7,"rpeMax":8,"restSec":120,"note":null,"flags":[]}
      ]},
      {"name":"Lower Power","note":null,"exercises":[
        {"name":"Back Squat","sets":4,"repMin":3,"repMax":5,"repScheme":"range","perSide":false,"rpeMin":8,"rpeMax":8,"restSec":180,"note":null,"flags":[]},
        {"name":"Romanian Deadlift","sets":3,"repMin":6,"repMax":8,"repScheme":"range","perSide":false,"rpeMin":null,"rpeMax":null,"restSec":150,"note":"keep neutral spine","flags":[]},
        {"name":"Walking Lunge","sets":3,"repMin":10,"repMax":12,"repScheme":"range","perSide":true,"rpeMin":7,"rpeMax":7,"restSec":90,"note":null,"flags":[]}
      ]}
    ]}
  ```
- **Editor opens:** YES. Save enabled.

### F3 — `fixtures/asf-valid-minimal.txt`
- **Purpose:** smallest legal file — no headers, only required fields; `n` (fixed) reps; confirms headers are optional and defaults are `info`, not errors.
- **Source text (4 lines):**
  ```
  1  DAY: Full Body
  2  - Squat | 3 | 5
  3  - Bench Press | 3 | 5
  4  - Row | 3 | 8
  ```
- **Expected outcome:** VALID (with `info` notices only): `DEFAULT_APPLIED` name→"Untitled Split", `scheduleWeekdays:[]`, `units:null`. No warnings, no errors.
- **Expected parsed result:**
  ```json
  { "name":"Untitled Split", "scheduleWeekdays":[], "units":null, "notes":null,
    "days":[ { "name":"Full Body", "note":null, "exercises":[
      {"name":"Squat","sets":3,"repMin":5,"repMax":5,"repScheme":"fixed","perSide":false,"rpeMin":null,"rpeMax":null,"restSec":null,"note":null,"flags":[]},
      {"name":"Bench Press","sets":3,"repMin":5,"repMax":5,"repScheme":"fixed","perSide":false,"rpeMin":null,"rpeMax":null,"restSec":null,"note":null,"flags":[]},
      {"name":"Row","sets":3,"repMin":8,"repMax":8,"repScheme":"fixed","perSide":false,"rpeMin":null,"rpeMax":null,"restSec":null,"note":null,"flags":[]}
    ]}]}
  ```
- **Editor opens:** YES. Save enabled (info doesn't block). Editor should prompt user to add a split name + schedule but not force it.

### F4 — `fixtures/asf-valid-multi-day.txt`
- **Purpose:** multiple `DAY:` blocks (4), 6-day schedule, mix of with/without RPE.
- **Source text (18 lines):**
  ```
  1  SPLIT: Push Pull Legs x2
  2  SCHEDULE: Mon, Tue, Wed, Fri, Sat, Sun
  3
  4  DAY: Push A
  5  - Bench Press | 4 | 6-8 | RPE 8 | Rest 120s
  6  - Lateral Raise | 3 | 12-15 | Rest 45s
  7
  8  DAY: Pull A
  9  - Deadlift | 3 | 3-5 | RPE 8 | Rest 180s
  10 - Barbell Row | 4 | 8-10 | RPE 8 | Rest 90s
  11
  12 DAY: Legs A
  13 - Back Squat | 4 | 5-7 | RPE 8 | Rest 180s
  14 - Leg Curl | 3 | 10-12 | Rest 60s
  15
  16 DAY: Push B
  17 - Overhead Press | 4 | 5-7 | RPE 8 | Rest 120s
  18 - Incline Dumbbell Press | 3 | 8-10 | Rest 90s
  ```
- **Expected outcome:** VALID.
- **Expected parsed result:** `scheduleWeekdays:[1,2,3,5,6,0]` — **order preserved exactly as written (LOCKED; never auto-sorted).** Sun=0 legitimately lands last here. The schedule is a lookup set for planned obligations; entered order is retained for display + user intent. 4 days named Push A / Pull A / Legs A / Push B, each with 2 exercises parsed as above (Lateral Raise/Leg Curl/Incline have `rpeMin/Max:null`; all rest values normalized to seconds). `flags:[]` throughout.
- **Editor opens:** YES. Save enabled.

---

## INVALID / DEFECT FIXTURES

### F5 — `fixtures/asf-invalid-no-day.txt`
- **Purpose:** structure error — exercise before any `DAY:`, and no day blocks at all.
- **Source text (5 lines):**
  ```
  1  SPLIT: Push / Pull / Legs
  2  SCHEDULE: Mon, Wed, Fri
  3  UNITS: lb
  4
  5  - Bench Press | 4 | 6-8 | RPE 8 | Rest 120s
  ```
- **Expected outcome:** INVALID.
- **Expected issues:**
  - `{ line:5, field:null, severity:"error", code:"EXERCISE_OUTSIDE_DAY", message:"Exercise line found before any 'DAY:' block. Add a 'DAY: <name>' line above it." }`
  - `{ line:null, field:null, severity:"error", code:"NO_DAY_BLOCKS", message:"No 'DAY:' blocks found. A split needs at least one day." }`
- **Recovery:** headers (SPLIT/SCHEDULE/UNITS) parsed and preserved; the orphan exercise preserved as raw, unassigned, flagged. `days:[]`.
- **Editor opens:** YES. Save DISABLED until a `DAY:` exists and the orphan line is placed under it.

### F6 — `fixtures/asf-invalid-bad-sets.txt`
- **Purpose:** required field error (Sets) with a valid sibling row preserved.
- **Source text (6 lines):**
  ```
  1  SPLIT: Push
  2  SCHEDULE: Mon
  3
  4  DAY: Push A
  5  - Bench Press | four | 6-8 | RPE 8 | Rest 120s
  6  - Incline Press | 3 | 8-10 | RPE 8 | Rest 90s
  ```
- **Expected outcome:** INVALID.
- **Expected issues:**
  - `{ line:5, field:"Sets", severity:"error", code:"BAD_SETS", message:"Sets must be a whole number 1–20 (got \"four\")." }`
- **Recovery:** row 5 preserved with `sets:null, flags:["BAD_SETS"]`, other fields still parsed (`repMin6 repMax8 rpe8 rest120`). Row 6 fully valid, `flags:[]`. Day "Push A" has 2 exercises.
- **Editor opens:** YES. Save DISABLED until line 5's sets is fixed.

### F7 — `fixtures/asf-invalid-bad-reps.txt`
- **Purpose:** required field error (Reps); valid `AMRAP` sibling preserved.
- **Source text (6 lines):**
  ```
  1  SPLIT: Pull
  2  SCHEDULE: Tue
  3
  4  DAY: Pull A
  5  - Deadlift | 3 | 3 to 5 | RPE 8 | Rest 180s
  6  - Pull-up | 4 | AMRAP | Rest 120s
  ```
- **Expected outcome:** INVALID.
- **Expected issues:**
  - `{ line:5, field:"Reps", severity:"error", code:"BAD_REPS", message:"Reps must be a range (6-8), a number (5), AMRAP, or a-b/side (got \"3 to 5\")." }`
- **Recovery:** row 5 preserved with `repMin/repMax/repScheme:null, flags:["BAD_REPS"]`, `sets:3 rpe8 rest180` kept. Row 6 valid (`repScheme:"amrap"`, `rpe:null`, `rest:120`).
- **Editor opens:** YES. Save DISABLED until line 5 reps fixed.

### F8 — `fixtures/asf-invalid-bad-rpe.txt`
- **Purpose:** malformed **optional** field (RPE) → warning, not a hard error; two variants (non-numeric + out of range).
- **Source text (6 lines):**
  ```
  1  SPLIT: Legs
  2  SCHEDULE: Wed
  3
  4  DAY: Legs A
  5  - Back Squat | 4 | 5-7 | RPE hard | Rest 180s
  6  - Leg Press | 3 | 10-12 | RPE 12 | Rest 90s
  ```
- **Expected outcome:** VALID-WITH-REVIEW (0 error, 2 warning).
- **Expected issues:**
  - `{ line:5, field:"RPE", severity:"warning", code:"BAD_RPE", message:"RPE not understood (\"hard\"); left blank. Use RPE 1–10, e.g. RPE 8 or RPE 7-8." }`
  - `{ line:6, field:"RPE", severity:"warning", code:"BAD_RPE", message:"RPE 12 is outside 1–10; left blank." }`
- **Recovery:** both rows preserved and otherwise fully valid; `rpeMin/rpeMax:null`, `flags:["BAD_RPE"]`; sets/reps/rest intact.
- **Editor opens:** YES. Save ENABLED after acknowledgment (warnings don't block). Editor highlights the two RPE cells.

### F9 — `fixtures/asf-invalid-bad-rest.txt`
- **Purpose:** malformed **optional** field (Rest) → warning; two variants (word + bad unit).
- **Source text (6 lines):**
  ```
  1  SPLIT: Push
  2  SCHEDULE: Fri
  3
  4  DAY: Push A
  5  - Bench Press | 4 | 6-8 | RPE 8 | Rest soon
  6  - Overhead Press | 3 | 6-8 | RPE 8 | Rest 90x
  ```
- **Expected outcome:** VALID-WITH-REVIEW (0 error, 2 warning).
- **Expected issues:**
  - `{ line:5, field:"Rest", severity:"warning", code:"BAD_REST", message:"Rest not understood (\"soon\"); left blank. Use seconds (90) or 120s, 2m, 1m30s." }`
  - `{ line:6, field:"Rest", severity:"warning", code:"BAD_REST", message:"Rest not understood (\"90x\"); left blank." }`
- **Recovery:** rows preserved; `restSec:null`, `flags:["BAD_REST"]`; sets/reps/rpe intact.
- **Editor opens:** YES. Save ENABLED after acknowledgment.

### F10 — `fixtures/asf-invalid-unknown-field.txt`
- **Purpose:** the "never silently ignore an unrecognized field" guarantee — unknown **header** and unknown **exercise tags** both surface as warnings and are preserved, never dropped.
- **Source text (7 lines):**
  ```
  1  SPLIT: Push
  2  SCHEDULE: Mon
  3  TEMPO-DEFAULT: 3011
  4
  5  DAY: Push A
  6  - Bench Press | 4 | 6-8 | RPE 8 | Tempo 3011 | Rest 120s
  7  - Cable Fly | 3 | 12-15 | RIR 2 | Rest 60s
  ```
- **Expected outcome:** VALID-WITH-REVIEW (0 error, 3 warning).
- **Expected issues:**
  - `{ line:3, field:"Header", severity:"warning", code:"UNKNOWN_HEADER", message:"Unrecognized header 'TEMPO-DEFAULT'. Kept as a note; not applied." }`
  - `{ line:6, field:"Tempo", severity:"warning", code:"UNKNOWN_FIELD", message:"Unrecognized field 'Tempo 3011' on Bench Press. Kept as a note; not applied." }`
  - `{ line:7, field:"RIR", severity:"warning", code:"UNKNOWN_FIELD", message:"Unrecognized field 'RIR 2' on Cable Fly. Kept as a note; not applied." }`
- **Recovery:** `program.notes` gains the raw `TEMPO-DEFAULT: 3011` (appended, tagged). Bench Press valid with `note:"Tempo 3011"` + `flags:["UNKNOWN_FIELD"]` (RPE/Rest still parsed). Cable Fly valid with `note:"RIR 2"` + `flags:["UNKNOWN_FIELD"]`. **Nothing dropped silently.**
- **Editor opens:** YES. Save ENABLED after acknowledgment; editor shows the preserved-but-unapplied fields so the user can convert or delete them.
- **Disambiguation rule (document + test):** a trailing field is an **unknown tagged field** (→ `UNKNOWN_FIELD`) when it matches `^[A-Za-z][A-Za-z-]+\s+\S+` and its leading keyword is not `RPE`/`Rest`; a trailing field with no keyword-value shape is a **free-text note** (no warning). This keeps `keep neutral spine` (F2) a silent note while `Tempo 3011` / `RIR 2` are flagged.

### F11 — `fixtures/asf-invalid-malformed-exercise.txt`
- **Purpose:** multiple structural errors on exercise lines, with a valid row preserved at the end.
- **Source text (8 lines):**
  ```
  1  SPLIT: Push
  2  SCHEDULE: Mon
  3
  4  DAY: Push A
  5  - Bench Press 4 6-8 RPE 8 Rest 120s
  6  - | 3 | 8-10 | RPE 8
  7  - Cable Fly | 3
  8  - Incline Press | 3 | 8-10 | RPE 8 | Rest 90s
  ```
- **Expected outcome:** INVALID.
- **Expected issues:**
  - `{ line:5, field:null, severity:"error", code:"MALFORMED_LINE", message:"No '|' fields found. Use: Name | Sets | Reps [| RPE n] [| Rest t]." }`
  - `{ line:6, field:"Name", severity:"error", code:"MISSING_NAME", message:"Exercise name is empty (field before the first '|')." }`
  - `{ line:7, field:"Reps", severity:"error", code:"MISSING_REPS", message:"Reps missing. Provide a third field, e.g. 8-10." }`
- **Recovery:** rows 5–7 preserved as raw, flagged, with whatever partial fields could be read (`flags` populated). Row 8 fully valid, `flags:[]`. Day "Push A" keeps all 4 rows so the user can repair in place.
- **Editor opens:** YES. Save DISABLED until lines 5–7 are fixed or removed.

---

## Fixture matrix
| Fixture | Outcome | error | warning | info | Editor opens | Save |
|---|---|---|---|---|---|---|
| F1 basic | VALID | 0 | 0 | 0–1 | ✔ | enabled |
| F2 complete | VALID | 0 | 0 | 0 | ✔ | enabled |
| F3 minimal | VALID | 0 | 0 | ≥1 | ✔ | enabled |
| F4 multi-day | VALID | 0 | 0 | 0 | ✔ | enabled |
| F5 no-day | INVALID | 2 | 0 | 0 | ✔ | disabled |
| F6 bad-sets | INVALID | 1 | 0 | 0 | ✔ | disabled |
| F7 bad-reps | INVALID | 1 | 0 | 0 | ✔ | disabled |
| F8 bad-rpe | VALID-WITH-REVIEW | 0 | 2 | 0 | ✔ | enabled* |
| F9 bad-rest | VALID-WITH-REVIEW | 0 | 2 | 0 | ✔ | enabled* |
| F10 unknown-field | VALID-WITH-REVIEW | 0 | 3 | 0 | ✔ | enabled* |
| F11 malformed | INVALID | 3 | 0 | 0 | ✔ | disabled |

\* enabled after the user acknowledges the warnings in the review editor.

---

## Kimi implementation-ready test checklist

### A. Unit — parser grammar (valid)
- [ ] F1 parses to the exact `program` JSON above; `issues` has no error/warning.
- [ ] F2 normalizes rest `3m`→180, `2m30s`→150, `150s`→150; `@9`→rpe 9/9; `7-8`→rpe 7/8; `AMRAP`→scheme amrap; `10-12/side`→perSide true; trailing `keep neutral spine`→note (no warning); day `NOTE:` captured.
- [ ] F3 applies defaults as `info` (never warning/error); `fixed` rep scheme for single numbers; empty schedule.
- [ ] F4 yields 4 days, `scheduleWeekdays` = `[1,2,3,5,6,0]` — assert **order preserved as written, never sorted** (LOCKED).
- [ ] Header parsing: `SPLIT/SCHEDULE/UNITS/NOTES` in any order; comments (`#`) and blank lines ignored everywhere.
- [ ] Weekday tokens map correctly (case-insensitive, full or 3-letter).

### B. Unit — each malformed input (one test per fixture)
- [ ] F5 → `EXERCISE_OUTSIDE_DAY` (line 5) **and** `NO_DAY_BLOCKS` (line null); `days:[]`; headers preserved.
- [ ] F6 → `BAD_SETS` (line 5, field Sets); row 5 `sets:null` + flag; row 6 clean.
- [ ] F7 → `BAD_REPS` (line 5, field Reps); row 5 rep fields null + flag; row 6 AMRAP clean.
- [ ] F8 → two `BAD_RPE` warnings (lines 5,6); rpe cleared; rows otherwise valid; outcome non-blocking.
- [ ] F9 → two `BAD_REST` warnings (lines 5,6); rest cleared; non-blocking.
- [ ] F10 → `UNKNOWN_HEADER` (line 3) + two `UNKNOWN_FIELD` (lines 6,7); unknown values preserved as notes, never dropped; non-blocking.
- [ ] F11 → `MALFORMED_LINE` (5), `MISSING_NAME` (6), `MISSING_REPS` (7); row 8 clean; all rows retained.
- [ ] **Fuzz/robustness:** empty string, whitespace-only, only comments, CRLF vs LF, trailing spaces, duplicate headers, a `DAY:` with zero exercises, 1000-line input → parser returns a `ParseResult`, **never throws**.
- [ ] Exact `line`, `field`, `code`, `severity` asserted per issue (message text may be asserted loosely / by code).

### C. Integration — paste → highlight → edit → review → save → Today
- [ ] Paste F6 → editor opens, line 5 highlighted, Save disabled → user fixes sets to `4` → 0 errors → Save enabled → confirm → split persisted to Dexie → Today shows "Push A" on a Monday.
- [ ] Paste F8 → editor opens with 2 RPE warnings, Save enabled after acknowledge → save → Today unaffected by cleared RPE.
- [ ] Paste F10 → unknown fields visible in editor as preserved notes → user deletes/keeps → save.
- [ ] Paste F1 (clean) → editor still opens (review always required) → save → Today correct.
- [ ] Save is **impossible** while any error-severity issue remains (button disabled + reason shown).
- [ ] Parser writes nothing to IndexedDB; only the confirmed editor "Save" persists (assert no Dexie write during parse).
- [ ] "Load example" button loads F1 text.

### D. Regression — stability as convenience syntax is added later
- [ ] All F1–F11 expectations are **locked snapshots**; adding future syntax must not change any existing outcome.
- [ ] Adding a new recognized tag (e.g., `Tempo`) must flip only its specific `UNKNOWN_FIELD` case to recognized — assert the rest of F10 is unchanged.
- [ ] New syntax is **additive**: never turns a previously VALID file INVALID; a golden-file test re-parses every fixture and diffs against the stored expected `ParseResult`.
- [ ] Parser version constant bumped on grammar change; a test asserts fixtures are re-reviewed when the version changes.
- [ ] Property test: any valid `program` → serialize to ASF → re-parse → identical `program` (round-trip), preserved across syntax additions.
