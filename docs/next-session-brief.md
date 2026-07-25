# AURELIS — NEXT SESSION BRIEF (resume here)

Written 2026-07-25. Read this first, then `02_strategy/00_INDEX.md`, then the newest asset manifests. This supersedes prior asset direction where it conflicts.

---

## 0. Where things stand (verify first)

**Repo:** `icodewithvibes/aurelis` (PRIVATE, Pages disabled, owner-only). `gh` is at `"C:\Program Files\GitHub CLI\gh.exe"` — **not on PATH**, call by full path. PowerShell mangles multi-part `-q` jq strings; query one field at a time or use `--body-file`.

**⚠️ MERGE STATE — still not merged:**
- `origin/main` tip = `8c51b1a` (PR #6 docs). **`main` does NOT contain the app.**
- **PR #7** Stage 1 app shell → `main` — **OPEN**
- **PR #8** Stage 2 core workflows → base `frontend-v1/stage-1-app-shell` — **OPEN**
- **PR #9** Stage 3 visual+motion+logger → base `frontend-v1/stage-2-core-workflows` — **OPEN**
- Working branch: `frontend-v1/stage-3-proof-forge-and-visual-assets`, tip `5a84efb`.
- **Recommended merge order: #7 → #8 → #9**, then retarget any new PR to `main`.

**Toolchain:** Node 24, Vite 6 + React 18 + TS strict + Tailwind v4 + Framer Motion + Zustand + Dexie + Vitest. Scripts: `dev/build/typecheck/lint/test`. **32 tests pass.** Python 3.14 + Pillow available for image compression (used for all WebP/JPEG/LQIP exports).

**Credits:** ~**528** remaining. Spent so far: 41 (Group1 textures 10, meadow 7, forge-night 7, Chrome Rider hero 7, nav icons 10).

**What's BUILT and working:** ASF parser (12 binding fixture tests), Dexie persistence (split/session repos, soft-delete, deterministic set-log ids), import + guided review UI, workout logger (beginner UX: prefilled reps, weight-first, RPE behind "Advanced details", ghost defaults, units, rest timer), Today/Train/Proof/Settings screens on real data, functional **Auto/Calm/Full motion control** (persisted), Ceremonial Chrome tokens, typography hierarchy (Fraunces on titles + date labels).

**NOT built (deferred):** Proof/streak engine + records, the 450–650ms completion reveal, Forge deterministic engine + 988/911 safety flow, Notes.

---

## 1. ❌ REJECTED — regenerate these

The user does **not** like:
1. **The bottom-nav icon set** (Group 8, 5 raster icons made with Nano Banana Pro). Too glossy/neon, generic, doesn't fit. Currently wired in `src/components/BottomNav.tsx` + `src/design/assets/icons/*.webp`.
2. **The Chrome Crest** (Threshold Arch treatment) — the current SVG + chrome-gradient look is not wanted as-is.

**Both must be regenerated with GPT Image 2 (`gpt_image_2`) via the Higgsfield MCP** — not Nano Banana Pro. GPT Image 2 at 2k/high has proven far better compositional control (~7 credits/image).

An in-progress script `scratchpad/icons_fix.py` (auto-crop the icon frame) was written but **not run** — it is now moot; regenerate instead.

---

## 2. 🎯 NEW ART DIRECTION (from the 3 newly supplied references)

The user supplied three new private references showing the target vibe:
- **Ornate gold-and-chrome armored knight** with sword, sweeping liquid-water ribbons, deep cobalt sky, purple roses.
- **Chrome rider on horseback**, flowing liquid cobalt cape, gold-chrome armor, motion energy (has a `@no.context.art` watermark + reversed text — NEVER reproduce).
- **Chrome knight reclining in a dark meadow**, daisies, heavy prismatic/rainbow caustics on mirror-polished armor.

**Borrow (abstract qualities only):**
- Ornate **baroque engraved** armor detailing; mirror-polished chrome **and warm gold** accents (gold is now allowed — previously excluded)
- **Liquid-metal drapery** (capes/ribbons that read like flowing mercury or water)
- **Prismatic caustics / rainbow refraction** scattered across polished metal
- Deep cobalt night + high-contrast **specular white-blue highlights**
- Florals as counterpoint: **purple roses, white daisies, blue wildflowers**, dew
- Dramatic **diagonal composition energy**, weight, solitude, endurance

**User cites BERSERK as inspiration.** Take only the *abstract* register: heavy solitary armored figure, dark-fantasy gravitas, ornate engraved plate, sense of burden and perseverance. **NEVER** reproduce Guts, Griffith, the Behelit, the Berserk name/logo/branding, or any recognizable character, armor design, or panel composition. Original silhouettes only.

**Still forbidden everywhere:** watermarks, text/letters/numbers, logos, copied composition/pose from any reference, combat/violence/gore, neon cyberpunk, XP/coins/loot/achievement-unlocked game UI, confetti/particle spam, horses copied from the reference, gloomy featureless black voids.

---

## 3. 🌅 DYNAMIC TIME-OF-DAY BACKGROUND SYSTEM (headline new feature)

The user wants the Today background to **change throughout the day**, cycling different original knight scenes.

**Proposed spec:**
- **4 time bands** driven by device-local hour: `dawn` (05–09), `day` (09–17), `dusk` (17–21), `night` (21–05).
- Generate **1–2 original knight hero scenes per band** (start with 4, optionally 8 for variety), all 9:16, 2k, GPT Image 2.
- Each must keep the **upper-third dark/low-detail text-safe zone** and work behind Today's chrome card.
- Selection: pure function `heroForTime(date, seed)` → deterministic per day+band (so it doesn't flicker on re-render), with an optional "shuffle" setting.
- Keep the **existing approved Chrome Rider hero** as the `dusk`/default entry — the user explicitly likes it.
- Preserve all guardrails: solid `--aur-fallback-cobalt` CSS fallback, **Save-Data skips rasters**, LQIP blur-up, reduced-motion static, ≤220 KB WebP each + JPEG fallback.
- Consider lazy-loading only the active band's image (don't ship 8 heroes on first paint).
- **Cost:** 4 heroes ≈ 28 credits; 8 heroes ≈ 56. Confirm budget before generating (user previously authorized ~50).

**Per-band mood guidance:**
| Band | Mood |
|---|---|
| dawn | pale rose-gold light breaking over cobalt meadow, knight facing sunrise, hopeful, mist |
| day | luminous azure sky, bright white-blue specular chrome, blue/white wildflowers, open field |
| dusk | deep cobalt + warm gold rim-light, long shadows, the current approved Chrome Rider fits here |
| night | midnight blue, moonlit chrome, dew caustics, restrained prismatic, quiet solitude |

---

## 4. 🔖 APP ICON (new)

Generate an original **AURELIS app icon** — a knight-themed *or* gym-themed emblem, Berserk-*inspired* in gravitas only.
- 1:1, generated with GPT Image 2, then exported to PWA sizes (192, 512, maskable 512) + favicon.
- Ideas: an ornate engraved chrome helm silhouette; a knight's gauntlet gripping a bar; an abstract engraved crest/sigil in chrome+gold on cobalt.
- Must read at 48px. No text, no letters, no brand marks, no Berserk iconography.
- Wire into `index.html` + a web app manifest (PWA install) — note: manifest/PWA install is fine, **GitHub Pages deploy is still out of scope.**

---

## 5. ⚙️ SPLIT LOGIC / POSITIONING — improve

Current behavior (in `src/data/access.ts`, `src/screens/Today.tsx`, `Train.tsx`):
- `loadHome()` returns **all** split days; Today lists them all with start/resume. `isTrainingDay` is a simple `scheduleWeekdays.includes(weekday)` boolean.
- No mapping of *which* day belongs to *today*; no A/B rotation; no "next up" pointer.

**Wanted improvements:**
1. **Map weekday → specific split day.** If `SCHEDULE: Mon, Wed, Fri` and days are `Push A / Pull A / Legs A`, then Mon→Push A, Wed→Pull A, Fri→Legs A.
2. **Rotation pointer** for splits with more days than schedule slots (e.g. PPL×2 across 6 days, or A/B alternation) — persist a `nextDayPointer` on the split and advance on completed sessions.
3. **"Today's session" hero position:** Today should lead with *one* clear primary action (today's day), with other days demoted to a secondary "or train something else" list.
4. **Rest-day state:** when nothing is scheduled, show a calm honored-rest state (not a list of everything).
5. **Reordering/editing:** let the user reorder days, rename, and edit exercises after import (currently import-only).
6. Show **which day comes next** ("Next: Pull A, Wednesday").

---

## 6. 💡 FEATURE IDEAS (evaluate, don't assume)

Highest value first:
- **Proof/streak engine + completion reveal** (already fully specified in `docs/stage-3-product-and-ux-plan.md` — the biggest missing piece)
- **Exercise history & progress** — per-lift chart of top set / est. 1RM over time
- **PR detection + timeline** (schema already has `prs` + `proofEvents` tables)
- **Plate calculator** (what plates to load per side, given bar weight + units)
- **Warm-up set suggestions** derived from the working weight
- **Supersets / circuits** grouping in the logger
- **Per-exercise notes** and a session note
- **Export / import JSON backup** (schema versioned, spec'd in `04_data-model.md` §6)
- **Weekly review** — sessions kept vs planned, volume trend
- **Body-weight / measurement log**
- **Rest-timer presets + optional haptic** (`navigator.vibrate`, capability-gated)
- **PWA install + offline polish** (service worker; still no deploy)
- **Quick-add exercise** mid-session for improvised work
- **Units toggle wired** (settings row exists but is read-only)

---

## 7. 🛠️ IMPROVED ASSET WORKFLOW + PROMPT RECIPE

**Model policy (locked going forward):** use **`gpt_image_2`**, `resolution: "2k"`, `quality: "high"` for all hero/backplate/icon/crest work. ~7 credits each. Nano Banana Pro only for flat abstract material tiles (and it produced the rejected icons — avoid for iconography).

**Reference workflow that works:**
1. `media_upload` with the private ref filenames → `curl -X PUT` the bytes to each `upload_url` → `media_confirm`.
   - Refs live in `01_references/mood-images/` (M1–M8) and are **git-ignored — never commit, never expose**. Newly supplied refs should be saved there too.
   - Known Higgsfield `media_id`s: M6 `9750ebb6-…`, M4 `68e95ea5-…`, M2 `8af37198-…`.
2. Pass 2–3 refs via `medias: [{role:"image", value:<media_id>}]`.
3. Renders take **4–8 min** at 2k/high — poll `job_display`, or `sleep` in a background Bash task.
4. Download the `rawUrl` PNG → `03_assets/candidates/<group>/` (**never committed**).
5. Review visually, then compress with Pillow → WebP (≤220 KB) + JPEG fallback + 24px LQIP, **strip EXIF**, into `03_assets/approved/<group>/`, and copy into `src/design/assets/`.
6. Write an approved manifest, then commit **approved exports only**.

**Prompt template that has produced the best results:**
> Use the attached images ONLY as abstract material and mood guidance; do NOT reproduce any subject, pose, composition, framing, text, or watermark. Borrow: [name the exact qualities per reference].
>
> Create one entirely original [scene]: [subject + action], [material/lighting], [environment], [atmosphere]. The UPPER THIRD is calm, darker, low-detail negative space reserved for app text. Luminous, elevated, cinematic, premium editorial. Textless.
>
> Strict exclusions: no text, no letters, no numbers, no watermark, no signature, no logo, no recognizable character, no copied composition, no combat, no gore, no neon, no game UI, no busy upper third, [plus scene-specific negatives].

**Improvements to apply next time:**
- State the **compositional zone plan explicitly** ("figure occupies lower-center third; sky occupies top 40%").
- Name **specific materials** ("engraved baroque chrome", "liquid mercury drapery", "prismatic caustics on polished plate") — vague mood words underperform.
- For **icon/emblem work**: specify "flat centered emblem, even lighting, no scene, no perspective, generous margin, silhouette must read at 48px" — the rejected icons failed partly from 3D gloss + tight framing.
- For the **crest**: generate the 7 levels as *one consistent family* — either one master emblem the code recolors/layers, or an explicit "same silhouette, additive detail" instruction per level. Confirm the approach with the user before spending.
- Always add `no watermark, no reversed text` (reference M6 carries one).

---

## 8. ✅ EXACT NEXT STEPS

1. Verify merge state; recommend the user merge **#7 → #8 → #9**.
2. Confirm with the user: crest approach, number of time-of-day heroes (4 vs 8), and the **credit budget** before generating.
3. Save the newly supplied reference images into `01_references/mood-images/` (private, git-ignored).
4. Regenerate with **GPT Image 2**: (a) nav icon set, (b) Chrome Crest family, (c) time-of-day knight heroes, (d) app icon.
5. Review each candidate **with the user before compressing/committing**.
6. Then build: dynamic hero system → split logic/positioning → Proof/streak engine + completion reveal.
7. Keep all guardrails: local-only, no backend/accounts/analytics/Pages, images optional with CSS fallback + Save-Data + reduced-motion, 44px targets, no 390px overflow, candidates and references never committed.
