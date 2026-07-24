# Forge — Deterministic Engine, Voice & Safety

Forge turns resistance/venting into **one practical next action**. V1 is 100% on-device, deterministic, no network, no AI. The response layer is isolated so a future private AI can replace only `generateResponse()` without touching UI or data.

---

## 0. Architecture seam (so AI can slot in later)
```
ForgeInput { stateKey, note?, localTime, recentContext } 
      │
      ▼
route() ──► safetyScreen(input)  ─── if flagged ──► SAFETY MODE response (never a task)
      │                                              
      ▼ (not flagged)
generateResponse(input)   ◄── V1: deterministic template library
      │                        Future: swap ONLY this fn for a private AI service
      ▼
ForgeResponse { acknowledgment, reframe, action, estMinutes, tone, safety:false }
```
Contract is frozen: any future AI must return the exact `ForgeResponse` shape and must pass through the same `safetyScreen()` first. UI and storage never change.

---

## 1. Voice (original — not Goggins, not Rocky, not any real person)
**Identity:** a calm, equipped presence. It speaks like a steady person who respects you and expects you to act — not a drill sergeant, not a hype man, not a therapist.

**Five traits:** direct · calm · firm · concise · action-oriented.

**Always**
- Short sentences. Second person ("you"). Present/imperative for the action.
- Name the resistance plainly, without drama.
- End on exactly one doable thing with a time box.
- Assume competence and good faith.

**Never**
- Shame, insult, mock, or use "no excuses / soft / weak / pain is weakness" language.
- Encourage training through injury, overtraining, ignoring exhaustion, or skipping needed recovery.
- Diagnose (physical or mental). No medical/clinical claims.
- Imitate a named person, movie, or brand voice.
- Over-explain, moralize, or stack multiple tasks.

**Length budget:** acknowledgment ≤ 12 words · reframe ≤ 24 words · action ≤ 16 words.

**Lexicon**
- Prefer: *begin, one rep, the next step, enough, steady, show up, small, honest, set it down, return.*
- Avoid: *crush, destroy, dominate, beast, grind, warrior, no excuses, weak, earn your worth.*

---

## 2. The seven states → template families
Each state has a **family of 3 variants** (V, so it doesn't feel robotic on repeat). Selection is **deterministic**, not random:
`variantIndex = hash(stateKey + localDate + note) % variants.length`
(Same input on the same day → same response; changes across days/notes. Fully reproducible for tests.)

Every variant fills the frozen shape. `{note}`-awareness in V1 is limited to safety screening + optional echo of one keyword; no free generation.

### Overthinking
- **ack:** "Your head is running ahead of you."
- **reframe:** "You don't need the whole plan — only the next move. Thinking stops when doing starts."
- **action:** "Do one set of the first exercise. Just one." · **est:** 3 min
- (variant B action) "Write the single next step on one line, then start it." · 2 min
- (variant C action) "Set a 5-minute timer and begin the easiest part." · 5 min

### Low energy
- **ack:** "Low battery today. Noted."
- **reframe:** "You're not aiming for your best session. You're aiming to start and see."
- **action:** "Do a 5-minute easy warm-up, then reassess." · **est:** 5 min
- Safety-aware: if note suggests genuine exhaustion/illness → hand to **Need recovery** logic, not push.

### Avoiding training
- **ack:** "You're circling the workout, not doing it."
- **reframe:** "The gap between avoiding and starting is one small action. Close it once."
- **action:** "Put on your training clothes and set out your first weight." · **est:** 4 min

### Avoiding school/work
- **ack:** "The task is sitting there, and so are you."
- **reframe:** "You don't have to finish it. You have to open it and touch the first piece."
- **action:** "Open the document/task and work only the first 10 minutes." · **est:** 10 min

### Want to quit
- **ack:** "You're at the edge and it feels like enough."
- **reframe:** "Quitting the day isn't quitting forever. Do one honest rep, then decide."
- **action:** "Do a single minimum rep of the thing, then choose again." · **est:** 3 min
- Note: if `{note}` reads as despair/self-harm → **safety screen catches this first** (see §4).

### Need recovery
- **ack:** "Your body is asking for rest. That's information."
- **reframe:** "Recovery is part of the work, not the opposite of it. Honoring it protects the streak."
- **action:** "Mark today 'recovery honored' and do 5 minutes of easy mobility or a walk." · **est:** 5 min
- Never assigns hard training. Offers to log recovery honored.

### Need to reset
- **ack:** "The day got away from you. It can turn now."
- **reframe:** "You don't restart the week. You restart the next hour."
- **action:** "Pick one small win, do it in the next 15 minutes." · **est:** 15 min

---

## 3. Response object → UI flow
```
ForgeResponse {
  acknowledgment: string
  reframe: string
  action: string
  estMinutes: number
  tone: "steady" | "gentle"   // gentle for recovery/reset/safety
  safety: boolean
}
```
UI sequence: show ack → reframe → action card with est time → **[ Next rep ]** (primary) + **[ Not now ]**.
- **Next rep** → starts a lightweight commitment (optional countdown of `estMinutes`) → **[ Done ]** → completion confirmation.
- On **Done**: write a `forgeEntry(status=done)` + `proofEvent(type=forge)`.
- **Mark as today's daily commitment** toggle (relevant to streak on non-scheduled days — see data doc).
- **Not now** → saves `forgeEntry(status=open)`; no shame copy, just "It'll be here."

---

## 4. Safety rails (highest priority — screened BEFORE any template)
`safetyScreen(input)` runs first. If any category matches, Forge switches to **Safety Mode** and returns `safety:true, tone:"gentle"` with **no task, no time box, no Next-rep pressure**.

### Categories & handling
1. **Self-harm / suicidal ideation / hopelessness-as-crisis**
   - Do **not** assign an action. Do not minimize. Do not use discipline language.
   - Response pattern: brief acknowledgment → "This is bigger than a workout, and you don't have to handle it alone." → encourage contacting a trusted person **and** local emergency/crisis services now → offer to just sit on the notes screen.
   - Show configured crisis resources (see §5). Never diagnose.
2. **Injury / acute pain**
   - Do not push training. "Pain during movement is a stop signal, not something to push through."
   - Suggest stopping the movement and, if it persists/worsens, seeing a medical professional. Offer "recovery honored." No diagnosis, no rehab prescription.
3. **Severe exhaustion / illness / not eating / not sleeping**
   - Route to gentle recovery. "Your body isn't a problem to override today." Offer rest, hydration, food, sleep as the next step — never a hard session.
4. **Crisis in life (grief, panic, acute distress)**
   - Acknowledge, do not assign performance tasks, suggest one grounding step only if welcome, encourage reaching a real person.

### Matching (V1 deterministic)
- Curated keyword/phrase lists per category (maintained in `forge/safety/lexicon.ts`), case-insensitive, word-boundary aware, with obvious negations handled ("not suicidal", "no pain").
- **Bias toward caution:** ambiguous → gentle mode, never toward a hard task.
- False-positive cost is low (a gentle message); false-negative cost is high. Tune accordingly.
- This is **not** a clinical detector and must be described in-app as a caring guardrail, not a diagnosis tool.

### Safety copy tone
Calm, warm, brief, non-clinical, non-shaming. No urgency-panic, no toughness. Examples of allowed phrasing:
- "I'm glad you wrote that down."
- "You don't have to earn rest."
- "Reaching out is the strong move here."

---

## 5. Crisis resources — LOCKED to United States / Massachusetts
Use U.S.-appropriate copy in the deterministic safety flow. Concise, warm, nonjudgmental. **No tough-love tone in any safety situation.**

- **Immediate danger / risk of self-harm:**
  "Call or text **988** in the U.S. and Canada, call **911** if you're in immediate danger, or reach a trusted person nearby now."
  → No task assigned. No time box. Offer to just stay on the notes screen.
- **Non-immediate severe distress:**
  "This is worth not carrying alone — reach out to someone you trust, and consider talking with a licensed mental-health professional."
- **Injury / severe symptoms / extreme exhaustion:**
  Do **not** give a performance task. "Pain and exhaustion are stop signals. Rest, and if it persists or worsens, get appropriate medical guidance." Offer "recovery honored."

Implementation:
- Stored in `settings.crisisResources` seeded with the US/MA copy above; `settings.crisisRegion = 'US-MA'`.
- Keep the resource text data-driven (one object) so it can be localized later if AURELIS is shared beyond the US — but V1 ships US/MA copy, not a region picker requirement.
- Never diagnose. Never imply the user failed.

---

## 6. Testability
- Every `(stateKey, date, note)` → deterministic output → snapshot-testable.
- Safety lexicon has a fixture set of must-flag and must-not-flag strings.
- No randomness anywhere in Forge V1.
