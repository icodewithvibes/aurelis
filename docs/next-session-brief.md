# AURELIS — NEXT SESSION BRIEF (resume here)

Rewritten 2026-07-28. Read this first, then `02_strategy/00_INDEX.md`. Supersedes the previous brief.

---

## 0. State

- **Live:** https://icodewithvibes.github.io/aurelis/ — deploys automatically on every push to `main`.
- **Repo:** `icodewithvibes/aurelis`, now **PUBLIC** (Yuriel's decision, so Pages works on the free plan).
- **`main` = `62d123d`.** 351 tests, typecheck/lint/build all clean.
- **Credits:** ~374. GPT Image 2 ≈7/image, max 8 concurrent jobs.

**Build status: healthy.** Yuriel received one "build failed" email — that was the FIRST deploy run (`30176426757`), which failed because `@types/node` was never declared. Fixed in PR #13. **All six runs since have succeeded.** Do not go hunting for a broken build; confirm with `gh run list` before believing otherwise.

---

## 1. RESOLVED — the dropped `backdrop-filter`

Symptom was right, cause was not. It is **not** the JS minifier and **not** `build.cssTarget`.

`@tailwindcss/vite` runs **Lightning CSS** over the stylesheet with targets hard-coded in `@tailwindcss/node` — `safari 16.4, ios_saf 16.4, chrome 111, firefox 128` — and there is no way to configure them. Unprefixed `backdrop-filter` only reached Safari in **18**, so at a 16.4 floor Lightning treats the two declarations as one property that needs a prefix and emits the prefixed form alone.

The counts were also misread. Of the 7 occurrences in `dist`, 2 are Tailwind's own `.backdrop-filter` utility and 2 are the `@supports` *condition* — not declarations. All three of OUR glass rules had only `-webkit-`.

Chrome accepts `-webkit-backdrop-filter` as an alias, so Chrome was never affected. **Firefox was the only casualty**, which is why this survived every review.

**Fix: declaration ORDER.** `-webkit-` first, standard last — that is the order Tailwind's own utility uses, and both survive. Now 5 and 5. Setting `build.cssTarget` changed nothing (measured); it is kept as hygiene only, with a comment saying so. `src/design/glassPrefixOrder.test.ts` fails the build if the order is ever reversed.

---

## 2. RESOLVED — "See the movement" on iPhone

Not cross-origin. Not the image at all. **The sheet was rendering off-screen.**

`position: fixed` is only fixed to the viewport while no ancestor creates a containing block for it. Every screen animates its cards in with framer-motion (`initial: { y: 10 }`), and a live `transform` on the `.aur-chrome-surface` ancestor makes that card the containing block. `inset: 0` then means "fill that card".

Measured on the live site: the dialog resolved to **416×1452 at (432,235)** instead of the 1280×720 viewport, with the sheet at **top: 1160px on a 720px-tall screen**. The full-bleed backdrop still painted over most of the screen — hence "a blurred overlay with no panel". Nothing had failed to load.

It passed desktop review because framer-motion settles to `transform: none` once the entrance animation finishes, so a card touched a second after load behaves normally. iOS defers those animations when a standalone PWA is restored from a snapshot or throttled in Low Power Mode, and the transform never clears.

**Fix:** `src/components/Portal.tsx` — overlays render into `<body>`, where no ancestor can capture them. Applied to `ExercisePreview` and `CompletionReveal`. Verified: dialog now measures the full viewport and the sheet sits on screen at 375px wide.

**Do not render a `position: fixed` overlay inline again.** Use `<Portal>`.

---

## 3. RESOLVED — body was the scroll container

The cause named here previously (`html { overflow-x: clip }`) was wrong. `clip` does not create a scroll container — that is the whole reason it was chosen.

The actual cause was **`overflow-x: hidden` on `body`**, sitting eight lines below a comment in the same rule that explicitly said not to do it. `overflow-x: hidden` forces `overflow-y` to compute to `auto`, so body became the scroller (`hidden auto`, confirmed live).

Removed. Body now computes `visible`. The scroll lock in `ExercisePreview` was also locking `<body>` — which locked nothing, because `<html>` already has a non-visible `overflow-x` and wins propagation, and it re-created the body scroller at exactly the moment an overlay was on screen. It now locks `documentElement`.

---

## 4. What shipped recently (so you do not redo it)

- **The save bug** — `initDb` swallowed IndexedDB open failures and the app ran with no persistence, silently. Status is now observable and surfaced; completing a set awaits the write; `navigator.storage.persist()` on boot.
- **iOS nav gap** — a fixed `bottom: 0` bar does not reach the physical bottom in iOS standalone (WebKit bug, fixed only in Safari 26.1 beta). Solved by extending the bar's own box 160px past the edge via negative margin + matching padding (`--aur-nav-bleed`, `--aur-nav-inset` in `index.css`). Do not "fix" this with padding again.
- **Glass on iPhone** — `isolation: isolate` on `.aur-chrome-surface` made iOS sample an empty backdrop root. Removed. **Never reintroduce `isolation` on an element that also has `backdrop-filter`.**
- Split library (11 programs), exercise reference photos from **free-exercise-db (Unlicense/public domain)**, Forge journal (memory), activity logging (runs/rides, own `activities` table so it never inflates kept-days), soreness routing, per-lift history, JSON backup, code-split bundle, four themes.

---

## 4b. Asset generation — read before spending anything

Higgsfield **Plus** does include 365-day unlimited on Seedream 5.0 Lite, Flux.2 Pro (1K), Seedream 4.5, Nano Banana, Kling O1 Image and GPT Image — **in the Higgsfield web app.**

That entitlement does **not** reach this MCP connector. Measured, not assumed:
- `models_explore` returns `unlim: { available: false, remaining: null }`, and **no** model in the catalog carries `supports_unlim`.
- `balance` returns `{ credits, subscription_plan_type: "plus" }` with **no** `free_trial` block.
- A `get_cost: true` preflight on `nano_banana` and `seedream_v5_lite` — both on the "unlimited" list — returns **1 credit each**.

`use_unlim` is tied to the free-trial allowance, not to Plus. Generating here spends credits. Preflight with `get_cost: true` before any batch.

---

## 5. Hard-won gotchas

- **A Chrome preview cannot prove CSS prefixing.** Chrome takes `-webkit-` aliases, so a rule that ships prefix-only looks perfect there and is dead in Firefox. Check `dist/assets/*.css`, not the screen.
- **framer-motion entrance transforms create containing blocks.** Any `position: fixed` child of an animated card is positioned against the CARD. Use `<Portal>` for overlays, always.
- **`overflow-x: hidden` on `<body>` makes body the scroller** (it forces `overflow-y: auto`). Use `clip` on `html`/`#root` instead. Locking scroll means locking `documentElement`, not `body`.
- **`tsc -b` silently skips work from a stale `.tsbuildinfo`.** A local "typecheck clean" can be a lie. Always `npx tsc -b --force --noEmit`.
- **PowerShell:** `<` and `>` inside a here-string break `git commit -m` — write the message to a file and use `git commit -F`. Same for `gh pr create`: use `--body-file`.
- `gh` is at `"C:\Program Files\GitHub CLI\gh.exe"` (not on PATH).
- **Do not trust `prefers-reduced-transparency`.** This test browser reports `reduce` with nothing configured; honouring it stripped the glass for everyone. Removed on purpose — do not add it back.
- The Browser pane does not composite frames, so `loading="lazy"` images never load and CSS transitions appear frozen. Set `img.loading='eager'` when verifying, and do not mistake either for a bug.
- Each localhost port is its own origin with its own IndexedDB.

---

## 6. Standing rules

- Local-only: no backend, accounts, analytics, sync, or AI API. PWA install only.
- Images optional: solid CSS fallback, Save-Data honoured, LQIP, reduced-motion static.
- 44px targets, no 390px overflow.
- `01_references/` and `03_assets/candidates/` are git-ignored — never commit, never publish.
- **Forge safety code is binding.** `features/forge/safety/lexicon.ts` keeps negation narrow: only short symptom words ("not suicidal", "no pain") may be cancelled; multi-word phrases like "i dont want to be here anymore" must never be cancellable. The topic layer sits strictly BELOW safety and must never widen crisis matching. Review changes against `02_strategy/02` §4–5.
