# AURELIS Split Format (ASF) v1

Plain text. Easy to type or paste. **Deterministic to parse.** Easy to edit after import via the guided editor.
ASF is the *documented, supported* import path. AURELIS does **not** claim to parse arbitrary messy notes or screenshots — those go through manual entry / the guided editor.

---

## 1. Design goals
- One exercise per line, human-readable, forgiving of spacing/case.
- Fixed positional core (name, sets, reps) + **tagged optional fields** (order-independent, unambiguous).
- Round-trips: import → edit in app → export back to valid ASF.

---

## 2. Grammar (informal)

```
Program
  ├─ Header lines (any order, each optional except SPLIT recommended)
  │    SPLIT:    <program name>
  │    SCHEDULE: <weekday list>            e.g. Mon, Wed, Fri
  │    UNITS:    lb | kg                   (optional; default = app setting)
  │    NOTES:    <free text>               (optional, program-level)
  │
  └─ One or more Day blocks
       DAY: <day name>                     starts a block
       (optional) NOTE: <free text>        day-level note
       Exercise lines (each begins with "- "):
         - <Name> | <Sets> | <Reps> [| RPE <r>] [| Rest <t>] [| <Note ...>]
```

Rules:
- Lines starting with `#` are comments (ignored).
- Blank lines are ignored (may separate blocks for readability).
- A header line is `KEY: value` where KEY ∈ {SPLIT, SCHEDULE, UNITS, NOTES}. Unknown KEYs → warning, kept as raw note.
- `DAY:` opens a block; everything until the next `DAY:` or EOF belongs to it.
- Exercise lines MUST start with `- ` and use `|` as the field delimiter.

### Field definitions (exercise line)
| Position/Tag | Required | Format | Normalized to |
|---|---|---|---|
| 1. Name | ✅ | free text (no `|`) | `name: string` (trimmed) |
| 2. Sets | ✅ | integer `1–20` | `sets: number` |
| 3. Reps | ✅ | `a-b` \| `n` \| `AMRAP` \| `a-b/side` | `{repMin,repMax,repScheme}` |
| `RPE <r>` | optional | `RPE 8` \| `RPE 7-8` \| `@8` | `{rpeMin,rpeMax}` |
| `Rest <t>` | optional | `120s` \| `90` \| `2m` \| `1m30s` | `restSec: number` |
| trailing free text | optional | any (no leading tag keyword) | `note: string` |

Notes:
- Reps `n` → `repMin=repMax=n`. `a-b` → range. `AMRAP` → `repScheme:"amrap"`. `/side` sets `perSide:true`.
- Rest bare number → seconds. `m`/`s` suffixes parsed. Normalized to integer seconds.
- RPE `@8` shorthand allowed. Range `7-8` allowed.
- Tag matching is case-insensitive (`rpe`, `rest`).

---

## 3. Canonical example (the sample the parser test uses)

```
SPLIT: Push / Pull / Legs
SCHEDULE: Mon, Wed, Fri
UNITS: lb

DAY: Push A
- Bench Press | 4 | 6-8 | RPE 8 | Rest 120s
- Incline Dumbbell Press | 3 | 8-10 | RPE 8 | Rest 90s
- Cable Fly | 3 | 12-15 | RPE 7 | Rest 60s

DAY: Pull A
- Deadlift | 3 | 3-5 | RPE 8 | Rest 180s
- Pull-up | 4 | AMRAP | Rest 120s
- Barbell Row | 3 | 8-10 | RPE 8 | Rest 90s

DAY: Legs A
- Back Squat | 4 | 5-7 | RPE 8 | Rest 180s
- Romanian Deadlift | 3 | 8-10 | RPE 7 | Rest 120s
- Leg Press | 3 | 10-12 | Rest 90s
- Standing Calf Raise | 4 | 12-15 | Rest 45s
```

---

## 4. Parser behavior (deterministic)
1. Split into lines; strip trailing whitespace; drop `#` comments and blanks (retain positions for error reporting).
2. Read header lines until first `DAY:`.
3. For each `DAY:` block, parse exercise lines in order.
4. For each exercise line: split on `|`, trim each field.
   - Field 1 → name (required, non-empty).
   - Field 2 → sets (must parse to int in range; else **error → line flagged**).
   - Field 3 → reps (must match a reps pattern; else error).
   - Fields 4+ → for each, test against tag patterns (`RPE…`, `@…`, `Rest…`); first non-tag becomes/append to `note`.
5. **Errors never crash the import.** Each problem line is collected as a `ParseIssue{line, raw, reason, severity}` and surfaced in the guided editor with the raw text preserved for manual fix.
6. Output: `{program, issues[]}`. If `issues` has any `error`-severity, import proceeds into the editor in "needs review" state; nothing is saved as active until the user confirms.

### Severity
- `error`: missing required field, unparseable sets/reps → must be fixed or line dropped by user.
- `warning`: unknown header key, suspicious values (sets>20, rest>15m) → editable, non-blocking.

---

## 5. Guided editor (post-parse, required step)
- Renders the parsed program as editable day → exercise rows.
- Problem lines float to the top with inline reasons and the original raw text.
- User can add/remove/reorder days and exercises, edit any field, set schedule weekdays via chips, choose units.
- "Save as active split" is enabled only when 0 `error`-severity issues remain.
- Re-export to ASF available anytime (round-trip fidelity).

---

## 6. Explicit non-promises (surface in UI copy)
- "Paste in AURELIS Split Format for reliable import. Other notes can be entered manually or cleaned up in the editor."
- No OCR/screenshot parsing in V1.
- No AI cleanup of freeform text in V1 (kept deterministic; a future AI helper could pre-format into ASF, behind the same editor confirmation).
