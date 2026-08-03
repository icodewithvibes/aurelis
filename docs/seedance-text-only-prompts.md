# SEEDANCE — TEXT-ONLY PROMPTS (no upload, no verification)

Written 2026-08-03.

Every prompt below generates **from text alone**. No start image, no
upload, no file verification. Paste into the Higgsfield web app, pick
Seedance 2.0, set the duration, generate.

**Settings for all of them:** aspect ratio **9:16**, audio **off**
(you'll add music in the edit), duration as noted.

## Why these are written the way they are

With no reference image, the model has nothing to anchor to, so the
character has to be rebuilt in words every single time or you get a
different knight in every clip. Every prompt therefore repeats the same
**character block** verbatim. Do not trim it — that block is the only
thing holding the look together across shots.

**THE CHARACTER BLOCK — paste this into every prompt unchanged:**

> a knight wearing ONLY a polished chrome-silver slotted-visor helm with
> no plume, no body armour, bare torso, lean and ripped, athletic not
> bulky, plain unmarked bright cobalt-blue shorts, plain light-grey
> shoes, smooth stylized 3D animated-film render

---

## A. THE LIFT CLIPS — bright studio, matches your app art

### A1 — Back squat (5s) ★ your Reel hook
```
Smooth stylized 3D animated-film render. A knight wearing ONLY a
polished chrome-silver slotted-visor helm with no plume, no body
armour, bare torso, lean and ripped, athletic not bulky, plain unmarked
bright cobalt-blue shorts, plain light-grey shoes.

He performs a barbell back squat. A loaded barbell rests across his
upper back and rear shoulders. He starts at the bottom of a deep squat,
thighs at parallel, then drives up powerfully and smoothly to full
lockout, standing tall with his chest up. The plates flex very slightly
on the bar as he rises.

Tall vertical framing centred on the lifter, with the barbell running
deliberately out of frame to the left and right. Bright almost-white
seamless studio backdrop, completely empty. Bar mid-grey steel, plates
deep charcoal. Slow subtle push-in as he stands.

NO logos, NO wordmarks, NO lettering, NO weight numbers anywhere. NO
rack, NO other equipment, NO other people. One continuous shot,
loop-friendly. No text, no captions, no cuts.
```

### A2 — Deadlift lockout (5s)
Same as A1, replacing the movement paragraph with:
```
He performs a barbell deadlift. He starts set over the bar with hips
hinged and back flat, then pulls the barbell off the floor and stands
to full lockout, hips through and shoulders back, the bar sliding up
his thighs. Slow three-quarter orbit of the camera to the right as he
stands.
```

### A3 — Overhead press (5s)
```
He performs a standing barbell overhead press. The bar starts racked at
his shoulders, then he presses it smoothly overhead to full lockout and
holds, arms straight, ribs down. Slight low camera rise following the
bar upward.
```

### A4 — Pull-up (5s)
```
He performs a pull-up on a single straight horizontal steel bar that
spans the top of the frame. He hangs at full stretch, then pulls
himself up smoothly until his chin clears the bar, elbows driving down
to his ribs, then lowers under control. Bare hands, no gloves, no
straps. Front view, camera locked off.
```

---

## B. THE WORLD CLIPS — the knight's own landscape

### B1 — Rider at dawn (10s)
```
Cinematic stylized 3D animated-film render. A lone armoured rider in
polished chrome-silver plate with a long deep-blue cloak sits still on
a chrome-silver horse, his back to camera, in a vast field of glowing
blue wildflowers under a deep blue pre-dawn sky.

Very slow steady push-in toward his back. Thousands of tiny dew-lights
across the flower field twinkle and drift gently in and out of focus.
His cloak stirs once in a slow breath of wind. Tall grass sways at the
bottom of the frame. Thin low mist rolls slowly behind the horse. Warm
first light begins to touch the horizon.

The rider does NOT turn around and does NOT dismount. The horse does
not walk away. Patient, reverent, unhurried. One continuous shot. No
text, no captions, no camera shake, no cuts.
```

### B2 — The forge (8s)
```
Cinematic stylized 3D animated-film render. Interior of a dark stone
forge. A bed of orange coals glows in the centre of frame. Embers drift
slowly upward through the air. The fire glow pulses gently, brightening
and dimming like slow breathing, throwing moving orange light across
surrounding dark stone and hanging steel tools. Heat shimmer rises.
Very slow push-in toward the coals.

Nothing else moves. No people, no hands, no text, no captions. Warm,
intimate, quiet. One continuous shot, no cuts.
```

### B3 — Crest reveal, built from text (5s)
```
Cinematic stylized 3D product render. A single ornate heraldic crest
made of polished chrome-silver with fine gold filigree, floating
perfectly centred on a deep cobalt-blue circular disc, the blue field
filling the whole vertical frame.

The crest rotates very slowly. A bright hard specular sweep travels
smoothly left to right across every polished silver surface, then a
small star at the top of the crest flares once, sharp and bright,
throwing a soft bloom of light across the blue field. The gold filigree
catches the light a beat after the silver does. Faint silver particles
rise slowly around it.

The crest stays perfectly centred and never leaves frame. Clean,
ceremonial, premium, like a trophy reveal. No text, no letters, no
numbers, no captions, no cuts.
```

---

## C. THE HOOK CLIPS — for the top of a Reel

These exist because the transcripts are unanimous that the first two
seconds decide everything, and that a clip with a *person* in it stops
the scroll better than a UI does.

### C1 — Helm turn (3s)
```
Smooth stylized 3D animated-film render, tight vertical portrait
framing. A knight wearing ONLY a polished chrome-silver slotted-visor
helm with no plume, bare torso, lean and ripped, stands facing away
from camera against a bright almost-white empty studio backdrop. He
turns his helmed head slowly over his shoulder toward the camera. A
single hard specular highlight travels across the polished visor as he
turns. Slow push-in.

No logos, no lettering anywhere. One continuous shot. No text, no
captions, no cuts.
```

### C2 — Chalk hands (3s)
```
Smooth stylized 3D animated-film render, tight close-up, vertical
framing. Two bare hands clap together once and a soft cloud of white
chalk dust bursts outward and drifts slowly through the air, catching
bright studio light against a bright almost-white empty background.
Slow motion, shallow depth of field.

No logos, no lettering, no people visible beyond the hands. One
continuous shot. No text, no captions, no cuts.
```

---

## D. What to do with the three clips you already have

You already own these, rendered and verified:

| File | Spec | Use |
|---|---|---|
| `shot1_hero_opener.mp4` | 1080×1920, 10.0s | App Store preview, clip 1 |
| `shot3_crest_reveal.mp4` | 1080×1920, 5.0s | App Store preview, clip 2 |
| `shot4_squat_hook.mp4` | 1080×1920, 5.0s | First 2s of every Reel; landing-page hero |

**App Store preview** = hero opener → crest reveal, cut together, 15s
total. That is a complete, submittable preview today.

**Reels** = squat hook first 2s, then whatever you're saying to camera.

They live in `Desktop/FORGE video/`, and the squat clip is committed to
this repo at `public/marketing/hook.mp4` so the landing page can use it.

---

## Rules baked into every prompt above

- **One motion per clip.** Seedance is far more reliable asked for one thing.
- **Never ask for text.** Generated lettering always comes out mangled;
  titles get added in the edit.
- **Never ask for a cut.** One continuous shot per generation.
- **Say what stays still**, not only what moves — that is what stops the
  model wandering.
- **Ban branding explicitly.** Left unsaid, the model invents logos, and
  we already had real trademarks bleed into the exercise art once.
