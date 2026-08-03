# GAMIFICATION + SHIP PLAN

Written 2026-08-03.

---

# PART 1 — Gamification

## What the market actually does

Researched the ranked-gym-app genre (Liftoff, GymLevels, Kovo, Level Up,
Workout Quest — the "Liftify / Runify" category). The mechanics that recur:

| Mechanic | Who does it | Does it work |
|---|---|---|
| **XP per set**, character levels off real lifts | GymLevels, Kovo | Yes — the strongest one. Ties the game to the work. |
| **Ranked tiers** (Bronze → Mythic, E-Rank → SSS) **per muscle group** | GymLevels, Level Up | Yes — legible progress that a screenshot can carry |
| **Streaks with freezes** for rest days | GymLevels, Fito | Yes, but only *with* the freeze. A streak that punishes a planned rest day gets deleted. |
| **Daily quests** with thematic framing | Level Up, Kovo | Yes |
| **Loot chests / cosmetics** | Workout Quest | Reviewers call this the point where it "tips into grinding" |
| **Leaderboards, group quests** | Kovo, Liftoff | Works, but needs a backend and accounts |

The consistent finding: **mechanics tied to real training data work; mechanics
tied to grinding don't.** Loot is where these apps lose credibility.

## What this means for AURELIS specifically

You already have the rarest ingredient. Most of these apps bolted a fantasy
skin onto a spreadsheet. You have a *world* — the knight, the forge, the
crest, the ceremonial language — and 59 pieces of custom art in one coherent
style. Do not import Bronze/Silver/Gold ranks into it. Translate.

Also: V1 is local-only, no backend, no accounts. That rules out leaderboards
and group quests. It does **not** rule out the four mechanics that matter
most, all of which are computable from the Dexie data you already store.

### The four to build, in order

**1. The Crest becomes a real ladder, not a badge.**
You already have `crest_L1` through `crest_L7` and they visibly grow in
ornamentation. Right now they are decoration. Make them the rank. Earned off
kept days and logged volume — real training data, per the research finding.
The L1→L7 arc *is* Bronze→Mythic, in your own language. This is the cheapest
big win in the list because the art already exists.

**2. Per-lift mastery instead of per-muscle rank.**
You already compute per-lift history, PRs and double progression in
`features/training/progression.ts`. Surface it as a mastery tier on each
movement. "Barbell Squat — Tempered" reads better than "Squat Lv. 14" and
costs you nothing new to calculate.

**3. Streak with an honest freeze.**
Non-negotiable: a rest day in the user's own plan must not break the streak.
You already have the plan, so you already know which days are rest days —
the freeze is free. And the half-session rule you shipped (2h idle → `partial`,
sets kept, not a kept day) is exactly the right honesty. Keep that.

**4. One daily charge, framed in-world.**
Not "daily quest." Something like the day's *charge* — one concrete thing
drawn from the plan and the progression engine, which you already generate.

### What to refuse

- Loot chests and cosmetics. Reviewers already name this as the tell.
- Any streak that punishes a planned rest day.
- Anything that inflates numbers rather than reflecting work. The whole
  credibility of this app is that the crest means something.

---

# PART 2 — Ship plan

## The pattern from the transcripts

Read *"Meet the 14 year old who built a 14k a month app"* in full. Evan
Yadagari scaled **Locked** — a gamified self-improvement app for Gen Z — to
$14k/month. The pattern:

1. **He is not a coder.** "It was basically just Claude." Started in Figma,
   scoped onboarding and main screens, then built. This is your exact
   situation and it is not the blocker you think it is.
2. **He tested every channel, then killed all but one.** Reddit, X, paid ads,
   influencers. Influencers won and he stopped doing the rest.
3. **The winning creators were "day in the life," not fitness.** Because the
   app appears *naturally* inside that format — the creator checks off a task
   mid-video and the gamified screen does the selling. Fitness influencers
   converted worse than DITL.
4. **Volume is brutal.** 5,000–10,000 DMs. 500/day at peak. 2–4% reply rate.
5. **He optimises CPM against RPM.** RPM $3–4, so he keeps CPM at $1–2. Deals
   with a *minimum view clause* worked best.
6. **Attribution is by spike,** not by link. Instagram won't give you links.
7. **Pricing: $30/year or $7/week. ~10 downloads per subscription.**

The other three transcripts are still unread — I ran out of session on the
image work. Next session should read them and confirm or complicate this
pattern before you spend money.

## What this implies for AURELIS

**The good news.** AURELIS is *more* screenshot-able than Locked. A knight
earning an ornate silver crest is a better 2-second hook than a checkbox.
Shot 3 + Shot 10 in the video brief exist precisely for this.

**The hard news, stated plainly.** Three things block an App Store launch:

1. **Local-only is a product decision, not just a technical one.** No accounts
   means no leaderboards, no social, no cross-device. That's a legitimate
   position — it's also why notifications will never work properly as a PWA.
   Going native fixes notifications and widgets, which you've now raised
   four times.
2. **Payments need a backend or a service.** Subscriptions mean StoreKit and
   receipt validation. This is the single biggest architectural change and
   it contradicts the current no-backend rule.
3. **Wrapping the PWA is the fast path but is App Store Review risk.**
   Guideline 4.2 rejects apps that are "just a website." A thin wrapper around
   this PWA is a plausible rejection. Native, or a wrapper that adds real
   native capability (notifications, widgets, HealthKit), is the safer read.

**My recommendation, since you asked for one:** do not go to the App Store
next. Do the gamification work first — the crest ladder is a week of work
against art you already own, and it is what makes the app *marketable*.
Ship it to the live PWA. Get the video clips cut. Put it in front of 20 real
people. If they keep using it, *then* take the native decision with evidence,
because that's the decision that costs real money and real time.

The transcripts agree with this ordering: Evan's revenue came from one video
that pulled a million views and generated $3,000. He didn't get there by
shipping to the App Store faster. He got there because the app was
*demonstrable in 15 seconds*.
