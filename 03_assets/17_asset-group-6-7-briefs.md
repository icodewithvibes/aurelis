# Asset Groups 6 & 7 — BRIEFS ONLY (nothing generated)

Written 2026-07-25. **No images have been generated for either group.** Both need approval first.

---

## Group 6 — Crest materials

### What already exists

| Layer | Status | Role |
|---|---|---|
| `ThresholdArch` SVG | **LOCKED, shipped** | Source of truth, accessible fallback, small-size renderer (< 96 px, Save-Data, offline) |
| Group 12 medallions L1–L7 | shipped | 320 px engraved rasters used at ceremonial sizes (Proof hero, completion reveal) |

So the seven-render family **already happened** this session. The open question is not "how do we get seven badges" — it is how to make the crest feel like a real material at the sizes in between, without a second family drifting away from the first.

### Option A — one material sheet, composited through the SVG (recommended)

Generate **one** seamless chrome-light material: brushed and polished silver with a cool blue-white specular gradient and faint prismatic break-up, flat and evenly lit, tileable, no geometry of its own.

The SVG path then masks that texture (`mask-image` / `fill: url(#pattern)`), so every tier is the same metal and differs only in the geometry the locked SVG already encodes.

- **Consistency safeguard:** there is literally one texture. Tiers cannot drift apart, because nothing is regenerated per tier.
- **Accessibility:** unchanged. The SVG remains the element; the texture is decorative paint. Losing it degrades to the current flat token fill.
- **Save-Data / offline:** the texture is one small asset (~15–25 KB WebP) and is skippable like every other raster.
- **Cost: ~7 credits.** One render.
- **Risk:** less individually "jewelled" than a bespoke render per tier at very large sizes.

### Option B — a second tightly controlled seven-render family

Re-render all seven with stricter anchoring (generate L1 and L7 first, pass both as references for L2–L6 — the method used for Group 12).

- **Consistency safeguard:** bookend anchoring plus a fixed silhouette sentence in every prompt. It worked, but L2–L4 still needed a second pass before the early tiers were distinguishable.
- **Cost: ~49 credits**, plus a realistic ~21 for corrections = **~70**.
- **Risk:** a second family that must stay visually reconciled with the first, or the first must be retired.

### Recommendation

**Option A, at 7 credits.** The seven-tier family is done and approved; spending ~70 more to re-do it buys variation we do not need, while one material sheet fixes the actual gap — the crest looking flat between 44 px and 96 px — and it cannot drift by construction. Revisit Option B only if the crest becomes a marketing surface rather than a progress indicator.

---

## Group 7 — Section assets (Train, Forge, Proof, Settings)

**Principle: no full-screen image per tab.** Today and Forge already carry full backplates; giving every tab one would make the app heavier, slower on iPhone, and visually noisy. These briefs prefer reusable motifs, SVG and CSS, and propose at most **one** small shared raster.

### Train — no new raster
- Reinforce with existing parts: the week strip, section rules, and the chrome hairline.
- Add an **SVG motif**: a thin engraved horizontal rule with a single chrome node at the day marker. Pure SVG, themable via tokens, no fetch.
- **Cost: 0 credits.**

### Forge — no new raster
- The approved Group 4 Forge-night backplate already owns this screen.
- Add a **CSS-only** treatment: the existing bloom texture, already shipped, re-used at lower opacity behind the response card so the card reads as lit from within.
- **Cost: 0 credits.**

### Proof — no new raster
- The crest is the asset. Group 6 Option A would cover its material.
- Add an **SVG** timeline spine with small tier ticks so the timeline reads as one object.
- **Cost: 0 credits.**

### Settings — no new raster
- Deliberately the plainest screen: it is a control surface and should feel like instrument panel, not atmosphere.
- **Cost: 0 credits.**

### Optional shared asset (only if wanted)

One **chrome edge-light strip** (~1024×128 WebP, ~4 KB), a horizontal specular gradient, reusable as a section divider on every screen and as the press-state sweep. This is the only Group 7 raster worth generating.

- **Cost: ~7 credits.** Everything else in Group 7 should be code.

### Group 7 total

**0 credits** as specified, or **~7** with the optional shared edge-light strip.
