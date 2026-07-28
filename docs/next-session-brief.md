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

## 1. WHERE I STOPPED, MID-INVESTIGATION

I was confirming that **the production CSS minifier is dropping the unprefixed `backdrop-filter` property.**

Measured in `dist/assets/*.css` and on the live site:

```
unprefixed `backdrop-filter:`   →  2 occurrences
prefixed `-webkit-backdrop-filter:` →  5 occurrences
```

Source declares BOTH on every glass rule, so the build is stripping the standard property from most rules. Confirmed live: `getComputedStyle(card).backdropFilter === "none"` while `-webkit-backdrop-filter` survives.

**Why it matters:** iOS honours `-webkit-`, so the phone still gets blur — but modern Chrome/Android need the unprefixed form, so those lose the glass **in production only** (dev server is fine, which is why it looked correct in the preview).

**Next step:** `vite.config.ts` has NO `build.cssTarget` set, so it inherits `build.target`. Set an explicit modern `cssTarget` (e.g. `['chrome90','safari15','firefox90','edge90']`), rebuild, and re-count both forms in `dist/assets/*.css`. They should be equal. Also try declaring `-webkit-` FIRST and the standard property LAST, which is the conventional order and harder for a minifier to justify dropping.

---

## 2. STILL BROKEN — the thing Yuriel actually cares about

**"See the movement" does not show the photo on his iPhone.** It opens a blurred overlay with no panel/image.

I shipped three fixes for this in PR #19 (all verified working on desktop, all deployed):
1. Removed the sheet's own `backdrop-filter` — it was nested inside a backdrop that also blurs, so on iOS the sheet sampled an empty backdrop root and painted as nothing. Sheets are now opaque (`--aur-sheet-fill`).
2. Removed `animation-fill-mode: both`, which held the FROM state (`opacity: 0`) until the animation started; if iOS deferred it the sheet stayed invisible forever. Base state is now visible.
3. Gave the `<img>` intrinsic `width`/`height` instead of relying on `aspect-ratio`; `max-height` uses `vh`.

**He reports it still fails.** Before debugging further, RULE OUT STALE CACHE — an installed iOS PWA caches aggressively, and he may not have received `62d123d`. Ask him to delete the home-screen app, open the URL in Safari, hard-reload, then re-add. Have him check `#/settings` for anything that changed recently as a version tell.

If it genuinely still fails on the current build, remaining suspects, in order:
- **The photo is cross-origin** (`raw.githubusercontent.com`). iOS in standalone PWA can behave differently from Safari tabs. Test by temporarily pointing at a same-origin image; if that renders, it is a network/CORS issue, not layout. Consider proxying or bundling a handful of images.
- `position: fixed` dialog inside the body-as-scroll-container (see §3) — iOS is unreliable here. Try rendering the sheet through a portal to `document.body`.
- `100dvh`/`vh` inside the fixed overlay on older iOS.

---

## 3. Known structural wart (not yet fixed, deliberately)

`html { overflow-x: clip }` propagates and makes **`<body>` the scroll container instead of the document** (computed `overflow: hidden auto`). Vertical scrolling works and horizontal is correctly locked at 390, so it is not user-visible — but body-as-scroller plus `position: fixed` is exactly the combination iOS handles worst, and it may be contributing to §2.

I left it alone rather than refactor untested on his device. If §2 resists everything else, this is the next thing to unpick: contain the decorative bleed (the crest halo is the actual overflow source) at component level instead of on `html`.

---

## 4. What shipped recently (so you do not redo it)

- **The save bug** — `initDb` swallowed IndexedDB open failures and the app ran with no persistence, silently. Status is now observable and surfaced; completing a set awaits the write; `navigator.storage.persist()` on boot.
- **iOS nav gap** — a fixed `bottom: 0` bar does not reach the physical bottom in iOS standalone (WebKit bug, fixed only in Safari 26.1 beta). Solved by extending the bar's own box 160px past the edge via negative margin + matching padding (`--aur-nav-bleed`, `--aur-nav-inset` in `index.css`). Do not "fix" this with padding again.
- **Glass on iPhone** — `isolation: isolate` on `.aur-chrome-surface` made iOS sample an empty backdrop root. Removed. **Never reintroduce `isolation` on an element that also has `backdrop-filter`.**
- Split library (11 programs), exercise reference photos from **free-exercise-db (Unlicense/public domain)**, Forge journal (memory), activity logging (runs/rides, own `activities` table so it never inflates kept-days), soreness routing, per-lift history, JSON backup, code-split bundle, four themes.

---

## 5. Hard-won gotchas

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
