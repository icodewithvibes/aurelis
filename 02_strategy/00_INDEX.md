# AURELIS — V1 Strategy Set (Approved)

Owner: Yuriel · Strategist/Planner: Claude Opus · Frontend build: Kimi K3 (later) · Assets: Fable 5 / Higgsfield (later)

This folder is the **single source of truth** for AURELIS V1. Kimi builds only from these docs.
Nothing here contains secrets, API keys, or backend code. V1 is a static, local-first web app.

## Documents
1. [01_product-spec-v1.md](01_product-spec-v1.md) — scope, screens, core behaviors, acceptance criteria
2. [02_forge-engine-and-safety.md](02_forge-engine-and-safety.md) — deterministic Forge voice, templates, safety rails
3. [03_asf-spec.md](03_asf-spec.md) — AURELIS Split Format (paste/import grammar + parser rules)
4. [04_data-model.md](04_data-model.md) — Dexie schema, streak algorithm, edit-recompute, sync-ready fields
5. [05_design-system-ceremonial-chrome.md](05_design-system-ceremonial-chrome.md) — tokens, type, materials, motion, Chrome Crest
6. [06_kimi-build-brief.md](06_kimi-build-brief.md) — architecture, file structure, component inventory, IP rules
7. [07_asf-parser-test-fixtures.md](07_asf-parser-test-fixtures.md) — ASF parser acceptance suite + Kimi test checklist (fixtures in `fixtures/`)

## Locked decisions (from your V1 message)
- **Forge:** deterministic on-device rules/template engine. Fully shippable, no backend, no stub. Response layer is swappable for a future private AI.
- **Proof:** kept-sessions record — completion bar, consistency streak, chronological proof timeline, strength-progress (V1/V1.5), satisfying completion state.
- **Streak identity:** **Chrome Crest** progression (silver/chrome emblem gaining botanical + cobalt + prismatic detail). **No swords, no fire.**
  - Levels: Unmarked (0) · First Mark (1–2) · Polished Mark (3–6) · Silver Crest (7–13) · Cobalt Crest (14–29) · Prismatic Crest (30–59) · Ascendant Crest (60+).
- **Import:** **AURELIS Split Format (ASF)** — fixed, deterministic plain-text; guided editor after parse; no promise of parsing arbitrary messy notes/screenshots.
- **Art direction:** Ceremonial Chrome (cobalt night + reflective chrome + meadow + grain/bloom + restrained prismatic). Meadow Light = light/recovery mood only.

## Resolved confirmations (all locked 2026-07-23)
- **[A] Sync-ready schema — YES, keep for hygiene only.** V1 is strictly local-only: no account, no server, no background sync, no shared data, no cloud. Keep UUIDs, timestamps, schema versioning, soft-delete/archive, and versioned JSON export/import. **Do NOT build** sync logic, conflict-resolution UI, auth, remote IDs, or backend abstractions now. Source of truth = IndexedDB on the current device.
- **[B] Streak unit — SESSIONS KEPT.** Streak = consecutive qualifying obligations honored in sequence, not calendar days. First qualifying completion = 1-session streak immediately. Recovery-honored preserves but doesn't add. Unplanned empty day = neutral. Missed scheduled workout / selected daily commitment = ends streak. `streakCountMode` is fixed to `'sessions'`. Separate all-time records kept (total sessions kept, workouts, commitments, best streak).
- **[C] Crisis region — United States / Massachusetts.** Forge safety copy uses 988 (call/text), 911 for immediate danger, trusted person. See doc 02 §5.

## Build gate
**Open — CLEARED.** All decisions final. Kimi may begin V1 from these docs. Asset production briefs live in `03_assets/`.
