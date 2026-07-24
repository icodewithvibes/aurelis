# Kimi K3 — AURELIS V1 Build Brief (Original)

You are building AURELIS V1: a mobile-first, local-first, offline-capable personal training + discipline app. Build **only** from this strategy folder. This brief is original; do not import from any reference site.

---

## 0. Hard rules (read first)
- **No secrets.** No API keys, tokens, auth, DB credentials, or AI/network calls that carry user data. V1 is fully static + on-device.
- **IP hygiene.** Do NOT copy, trace, or closely imitate the MotionSites prompts (`01_references/motionsites-prompts/*`), the mood images, or any referenced armor/character/logo/copy. Those informed *principles only*. Write original CSS (use our `forged-glass` tokens, not the reference `.liquid-glass`). Do not use Instrument Serif; use Fraunces/Inter/IBM Plex Mono (doc 05).
- **Determinism.** Forge and the streak engine must be deterministic and unit-testable. No randomness.
- **Follow the docs.** Product (01), Forge+safety (02), ASF (03), data model+streak (04), design (05). If something conflicts, stop and flag — don't guess.
- **Safety first in Forge.** `safetyScreen()` runs before any template. Crisis/injury/exhaustion never receive a performance task.

---

## 1. Stack
React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion + Zustand + Dexie (IndexedDB).
Routing: React Router. PWA: service worker + web app manifest (installable, offline). Icons: an open-source set (e.g. Lucide) — used as generic UI glyphs, not to reconstruct any reference.

Deploy target: **GitHub Pages (static)**. Set Vite `base` to the repo path. Hash-based routing or a 404-fallback to handle SPA routes on Pages.

---

## 2. Suggested structure
```
src/
  app/            router, layout shell, tab bar, theme provider
  screens/        Today/ Train/ Forge/ Proof/ Notes/ Settings/
  features/
    split/        ASF parser, guided editor, split store
    logger/       session logger, rest timer, set rows, completion state
    forge/        engine/ (generateResponse), safety/ (screen + lexicon), ui/
    proof/        streak engine, crest emblem (SVG), timeline, PR logic
    notes/
  data/           dexie db, schemas, migrations, export/import, recompute
  design/         tokens.css, forged-glass, grain/bloom assets, motion presets
  lib/            date/local-day utils, id (uuid), formatting
  components/     shared UI (Card, GlassPanel, Button, Chip, RingTimer, ...)
  state/          zustand stores (ui, session, settings)
  test/           parser, streak, forge determinism, safety lexicon fixtures
```

---

## 3. Build order (milestones)
1. **Foundation:** Vite/TS/Tailwind, tokens (doc 05), theme + reduced-motion plumbing, tab shell, Dexie schema (doc 04), uuid/local-day utils.
2. **Import:** ASF parser + `ParseIssue` reporting (doc 03) → guided editor → save active split. Ship the canonical sample as a "load example" button.
3. **Today:** day-status resolution (doc 04 §2), planned-day card, primary CTA logic.
4. **Logger:** set rows (weight/reps/RPE/note), rest timer (CSS/SVG ring), ghost defaults from history, completion state + writes (session, setLogs, proofEvent, PRs, streak recompute).
5. **Proof:** streak engine + `streakCountMode` flag, Chrome Crest SVG (7 levels), completion/level-up ceremony, timeline, completion bars.
6. **Forge:** state chips + note, `safetyScreen` + lexicon (doc 02 §4), `generateResponse` template library, Next-rep flow, commitment/proof writes, daily-commitment toggle.
7. **Notes, Settings:** private notes; units, reduced-motion, export/import JSON, wipe (with export offer), crisis-region selector.
8. **Recompute + tests:** edit-a-past-session recompute (doc 04 §4); test suites (parser, streak scenarios, forge determinism, safety fixtures); a11y + reduced-motion pass; PWA/offline verification; iPhone perf pass.

---

## 4. Key implementation contracts
- **Forge seam:** implement `generateResponse(input): ForgeResponse` as the *only* thing a future AI would replace; everything upstream/downstream (safety screen, UI, storage) stays. Freeze the `ForgeResponse` shape (doc 02 §3).
- **Derived-not-stored:** streak, crest level, PRs, completion bars are pure functions of the event log. Never store them as the source of truth (cache is fine if recomputable). This is what makes edits safe.
- **Local day:** all streak/day logic keys off device-local `YYYY-MM-DD`. Centralize in `lib/date` so DST/timezone is handled once.
- **Snapshots:** a `session` stores a `splitDaySnapshot` so later template edits never rewrite history.
- **Motion:** transform/opacity only; no animated `backdrop-filter`; rest ring via CSS keyframes; everything gated by reduced-motion.

---

## 5. Acceptance = product doc §10
All 11 criteria in [01_product-spec-v1.md](01_product-spec-v1.md) §10 must pass, plus:
- Lighthouse PWA installable + offline works.
- No network request carries user data (verify in devtools — should be zero data egress).
- Bundle is reasonable for mobile; hero/bloom/grain are static assets, not runtime filters.

---

## 6. Confirmations — RESOLVED & LOCKED (2026-07-23)
- **[A] Sync-ready schema = YES, hygiene only.** Keep UUIDs, timestamps, schema version, soft-delete/archive, versioned JSON export/import. **Do NOT build** sync logic, conflict-resolution UI, auth, remote IDs, or backend abstractions. Source of truth = IndexedDB on this device.
- **[B] `streakCountMode = 'sessions'` (locked; calendar mode dropped).** First qualifying completion = 1-session streak immediately. Maintain the `records` lifetime tallies. Completion requires an intentional "Record proof / Complete session" confirm; **persist to IndexedDB first, then** play the 450–650ms crest animation, then show "Proof recorded — N sessions kept."
- **[C] Crisis region = US / Massachusetts.** Seed US/MA safety copy (988 call/text, 911, trusted person). Keep it data-driven for future localization; no region picker required in V1.

---

## 7. What NOT to build in V1
Accounts, sync, real AI, network calls with user data, wearables/health integrations, multiple active programs, social sharing, screenshot/OCR import, freeform-note AI parsing. All deferred.
