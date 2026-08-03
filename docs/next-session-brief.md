# AURELIS — NEXT SESSION BRIEF (resume here)

Rewritten 2026-08-01. Read this first, then `02_strategy/00_INDEX.md`.
Supersedes every earlier version of this file.

---

## 0. State

- **Live:** https://icodewithvibes.github.io/aurelis/ — deploys on every push to `main`.
- **Repo:** `icodewithvibes/aurelis`, PUBLIC (so Pages works on the free plan).
- **`main` = `47b0136`** (PR #29). **647 tests**, typecheck/lint/build clean.
- **Build health: good.** Last several deploys all succeeded. Confirm with
  `gh run list` before believing otherwise. `gh` lives at
  `"C:\Program Files\GitHub CLI\gh.exe"` (not on PATH).
- **Settings prints a build stamp** (commit + time). That is how you tell
  whether Yuriel's phone actually has your build. Ask him to read it.

---

## 1. THE TWO THINGS HE IS WAITING ON

### 1a. Regenerate the remaining 51 exercise images — HE SAID "GO" ON THIS

The library is **visually mixed right now**. 8 images use the new light
art direction; **51 are still the old dark cobalt-night style.** That is
the single most visible unfinished thing in the app.

- New style so far: `Leg_Press`, `Finger_Curls`, `Zottman_Curl`,
  `Wrist_Roller`, `Plate_Pinch`, `Standing_Dumbbell_Reverse_Curl`,
  `Palms-Down_Wrist_Curl_Over_A_Bench`, `Palms-Up_Barbell_Wrist_Curl_Over_A_Bench`
- Everything else in `src/design/assets/exercises/` needs redoing.
- List the stragglers with:
  ```
  ls src/design/assets/exercises/*.webp
  ```
  and diff against the eight above.

**Cost:** ~1 credit each via `nano_banana`, so ~51 credits. Check the
balance first (`balance`) — it was ~370 before this session's ~62.

**THE LOCKED PROMPT.** Yuriel gave this art direction explicitly and the
pilot was approved. Do not improvise; substitute only the movement line.

```
Redraw as a clean stylized 3D-animated illustration. Keep the EXACT same
pose, joint angles, grip, stance, camera angle and framing - this is an
instructional reference, so the movement must stay identical.
Movement: <NAME + a clause describing the position>.

BACKGROUND - LIGHT AND EMPTY: bright almost-white studio backdrop
(#eef1f6 to #dfe5ee), NO other equipment, NO other machines, NO racks,
NO wall weights, NO windows, NO signage. Clean pale seamless floor and
wall only.

ONLY ONE PERSON - no bystanders, no spotter, no second figure of any kind.
ONLY THE ONE PIECE OF EQUIPMENT being used. Nothing else in the scene.

CONTRAST IS CRITICAL - no two touching surfaces may share a tone:
- Equipment frame MID-GREY steel (#8d97a8) against the pale background.
- Pads / upholstery DEEP CHARCOAL (#2b3140).
- Shorts BRIGHT COBALT BLUE (#2a4fa8) - never matching any pad, seat or
  bar he touches.
- Skin warm and clearly lighter than shorts and equipment.
- Shoes light grey, distinct from the floor.

LIFTER: a knight wearing ONLY a polished chrome-silver slotted-visor
helm, no plume. No body armour - bare torso, lean and ripped, athletic
not bulky.

NO BRANDING: no logo, wordmark, sticker, label or readable text
anywhere. Every surface blank.

STYLE: smooth stylized 3D render, animated film look, bright even studio
lighting, clean edges, soft grounding shadow. No text, no watermarks.
```

**Why each clause is there — do not drop any of them:**
- *No branding* — the FIRST batch carried a rack wordmark and a Nike
  swoosh straight out of the source photos. Shipping third-party marks
  in a public app is a real problem, not a cosmetic one.
- *Contrast* — Yuriel's actual complaint: a lifter sitting on a black pad
  in black shorts disappears. Every touching pair must differ in tone.
- *One person / one machine / light background* — his words, verbatim
  requirements.

**Pipeline (this works, use it):**
1. `media_import_url` the raw GitHub photo →
   `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<Slug>/0.jpg`
2. `generate_image` with `nano_banana`, `aspect_ratio: "3:2"`,
   `medias: [{ value: <media_id>, role: "image_references" }]`
3. Collect with ONE `show_generations` call rather than polling each job.
4. Download the **`minUrl`** — it is already WebP at 1248×832 and ~20–50 KB.
   No conversion tooling is installed and none is needed.
5. Save as `src/design/assets/exercises/<Slug>.webp` (slug = the
   free-exercise-db folder name, exactly).
6. `npx vitest run src/features/exercises/exerciseArt.test.ts` — it fails
   if any split exercise lacks art, or if art ships that no split uses.

**Poses that need correcting rather than copying:** the source photo for
`Plank` does not show a plank. When a source is wrong, tell the model to
IGNORE the reference pose and describe the correct one. Instructional
accuracy beats fidelity to a bad photo. Check anything that looks off.

### 1b. Notifications — he has raised this three times; the answer has not changed

**A PWA cannot schedule a local notification, and cannot make an iOS
widget.** Researched and confirmed; see `memory/ios-pwa-platform-limits.md`.
Web Push reaches a closed iOS web app but needs a **server**, which V1
deliberately does not have.

What shipped instead: `features/planning/ics.ts` exports the plan as
RFC 5545 `.ics`, so Apple Calendar fires the alerts and its Lock Screen
widget shows what is next. Two alarms per event (−10m and at start),
`RELATED=START` stated explicitly, `STATUS:CONFIRMED`/`TRANSP:OPAQUE`.

**If he says it still does not fire:** the most likely cause is that the
import popup was dismissed without tapping **Add All**, or Calendar's own
notifications are off. The Plan screen now spells both out after export.
Do not promise a fix you cannot deliver — if he wants notifications that
simply work, that is a **native app**, and it is a product decision, not
something to code around.

---

## 2. What shipped this session (so you do not redo it)

- **iOS "See the movement"** — the sheet was rendering off-screen, not
  failing to load. A framer-motion entrance `transform` on an ancestor
  made that card the containing block for `position: fixed`. Fixed with
  `components/Portal.tsx`. **Use `<Portal>` for every overlay.**
- **backdrop-filter** — Tailwind v4 runs Lightning CSS at a hard-coded
  Safari 16.4 floor and collapsed the pair to `-webkit-` only, so Firefox
  lost all glass. Fixed by declaration ORDER (`-webkit-` first). Guarded
  by `design/glassPrefixOrder.test.ts`.
- **Boot gate + splash** — inlined in `index.html`, paints before the
  bundle parses; theme is read from IndexedDB before first paint.
- **Proof timeline** — grouped by day, press to open. Ordering was a real
  bug (sorted by `setIndex` alone, which interleaves the whole workout).
- **Half sessions** — a session idle 2h closes itself as `partial`: sets
  kept, NOT a kept day, no crest mark. Configurable 1h/2h/3h/Never.
- **Plan section + rhythm engine** — deterministic sleep/caffeine/training
  windows with citations in `features/planning/rhythm.ts`.
- **Progression engine** — double progression from logged sets, with the
  reasoning shown. `features/training/progression.ts`.
- **Split library** — 14 splits, renamed; new `Vice Grip 3×`; forearm work
  added. Scheduling bug fixed (see §3).
- **Interactive tour** — spotlight + arrows + a revert that removes only
  what the tour created (`features/onboarding/tourLedger.ts`).
- **Movement art** — 59 files, same-origin, so the sheet works offline.

---

## 3. Gotchas that have each cost real time

- **NEVER let what the user SEES depend on an animation or a frame.**
  This has bitten **three times**: `AnimatePresence mode="wait"` (steps
  never advanced), framer `animate` on a collapse (rows stayed open), and
  `requestAnimationFrame` for spotlight position (arrows pointed at
  nothing). Swap content immediately, animate after. Measure geometry
  synchronously, poll with `setInterval`, never rAF.
- **A Chrome preview cannot prove CSS prefixing.** Chrome accepts
  `-webkit-` aliases; Firefox does not. Inspect `dist/assets/*.css`.
- **The Browser pane does not composite frames.** Animations appear
  frozen and `loading="lazy"` images never load. Not bugs. Set
  `img.loading='eager'` when verifying, and never conclude an animation
  is broken from the pane alone.
- **framer-motion entrance transforms create containing blocks.** Any
  `position: fixed` child of an animated card positions against the CARD.
- **`overflow-x: hidden` on `<body>` makes body the scroller** (it forces
  `overflow-y: auto`). Use `clip` on `html`/`#root`. To lock scrolling,
  lock `documentElement`, not `body`.
- **Dexie `update()` will not delete a property** by assigning
  `undefined`. This silently broke "Replay the tutorial".
- **Do not re-derive a user's REQUEST from their data.** Replay was
  routed through "is this a new user?", which answers no for anyone with
  history — so the button did nothing. A request is not a derivation.
- **`tsc -b` silently skips work from a stale `.tsbuildinfo`.** Always
  `npx tsc -b --force --noEmit`.
- **PowerShell:** `<` and `>` in a here-string break `git commit -m` —
  write the message to a file and use `git commit -F`. Same for
  `gh pr create --body-file`.
- **Do not trust `prefers-reduced-transparency`.** This test browser
  reports `reduce` with nothing configured. Removed on purpose.
- **Display names are DISPLAY ONLY.** `features/exercises/displayName.ts`
  maps at render. The stored `exerciseName` is the key that per-lift
  history, PRs and progression all join on — renaming it would sever
  every logged set from its own history.
- Each localhost port is its own origin with its own IndexedDB.

---

## 4. How to verify (this is not optional)

Two separate bugs shipped green because they were only checked in a dev
server and in Chrome.

```bash
npm run preview:build     # builds, then serves the real bundle on :4173
```

`.claude/launch.json` has `aurelis-preview` for the Browser pane. Then
**measure**, do not eyeball: `getBoundingClientRect()`, `getComputedStyle`,
and read `dist/assets/*.css` directly. Finish by checking the live site
after the deploy run succeeds.

---

## 5. Standing rules

- Local-only: no backend, accounts, analytics, sync, or AI API. PWA install only.
- Images optional: solid CSS fallback, Save-Data honoured, reduced-motion static.
- 44px targets, no 390px overflow.
- `01_references/` and `03_assets/candidates/` are git-ignored — never commit.
- **Forge safety code is binding.** `features/forge/safety/lexicon.ts` keeps
  negation narrow: only short symptom words ("not suicidal") may be
  cancelled; phrases like "i dont want to be here anymore" must never be
  cancellable. The topic layer sits strictly BELOW safety. Review against
  `02_strategy/02` §4–5.
- Branch, PR, merge — do not commit to `main` directly. (`gh pr merge N
  --merge --delete-branch` returns you to `main`; branch again before the
  next change.)

---

## 6. Higgsfield — read before spending

Yuriel's **Plus** plan does include 365-day unlimited on Seedream 5.0
Lite, Flux.2 Pro, Seedream 4.5, Nano Banana, Kling O1 Image and GPT Image
— **but only in the Higgsfield web app.** That entitlement does NOT reach
this MCP connector.

Measured, not assumed: `models_explore` returns
`unlim: { available: false }`, no model carries `supports_unlim`, and a
`get_cost: true` preflight on `nano_banana` returns **1 credit**.

He authorises generation believing it is free. It is not — it is just
cheap. Preflight a batch with `get_cost: true` and tell him the cost.
