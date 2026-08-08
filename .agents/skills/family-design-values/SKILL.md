---
name: family-design-values
description: Decision framework for product/UI design quality, distilled from the Family wallet team's design philosophy (simplicity, fluidity, delight — benji.org/family-values). Use this whenever making interface architecture or motion decisions — choosing between a tray/sheet/modal vs a full-screen flow, designing a multi-step or onboarding sequence, deciding whether and how a transition should animate, reviewing whether a UI feels "flat" or "static," or deciding where to place a delightful/surprising detail (easter egg, celebratory moment, micro-interaction). Trigger this even when the user doesn't mention Family or cite the source — requests like "should this be a modal or its own page," "this transition feels janky," "how do I make onboarding feel less overwhelming," "where should I add a nice touch/easter egg," or "review this flow for polish" should all consult this skill. Especially relevant for design engineers doing UI/motion work in React, Framer Motion, or similar.
---

# Family Design Values

A decision framework for interfaces that feel simple, fluid, and delightful — not a specific animation library or code pattern. It's meant to sit alongside implementation-focused skills (like frontend-design) as the "why" that informs the "how": use it to reason about architecture and motion decisions before or while writing the code.

## Source and scope

This is distilled from Benji Taylor's essay on the design principles behind [Family](https://family.co), a crypto wallet praised for its interaction design (benji.org/family-values). The essay is illustrated almost entirely with phone-screen video demos, which can't be captured here — so this skill captures the **reasoning and heuristics**, not literal animation curves, durations, or easing values. When applying it, describe the intended behavior in words or pseudocode and pair it with a skill like `frontend-design` or the project's own motion conventions for actual implementation values.

The three principles below aren't independent — they compound. A flow that's simple but static feels dead; a flow that's fluid but cluttered still overwhelms; delight sprinkled onto a confusing flow reads as gimmicky.

## 1. Simplicity through gradual revelation

The goal isn't to hide features — it's to surface only what's relevant to the user's current step, and let the rest appear as it becomes relevant. This matters most in flows with many branches (onboarding, checkout, settings), where showing every path at once turns a simple task into a daunting one.

**The tray/sheet pattern** (a contextual overlay, not a new page) is the main tool for this. Rules of thumb for when a tray earns its keep:

- **One job per tray.** A tray should hold a single piece of content or a single action — not a mini dashboard. If you're tempted to fit two unrelated decisions into one sheet, that's a sign it should split into a sequence.
- **Trays for transient, full screens for persistent.** Use a tray for something the user dips into and dismisses — confirmations, warnings, quick explainers, a step in a larger flow. Reach for a full screen when the content deserves to be a real destination the user can return to.
- **Trays preserve context; full-screen navigation discards it.** If the action logically belongs to something already on screen (approving a swap from the swap screen, confirming from the amount-entry screen), keep it layered on top rather than routing away — the user shouldn't lose their place to complete a related action.
- **Make sequential trays visibly distinct.** If tray B follows tray A, give it a different height or shape so the change registers as progress, not a flicker of the same sheet. This sometimes means rewording content just to make the size difference honest.
- **Give every tray a title and a consistent dismiss/back affordance**, and let its visual theme (light/dark) match the flow it's embedded in rather than always defaulting to one style.
- **A tray can be the on-ramp to a bigger flow.** It's fine for a tray to expand into a full-screen experience once the user commits — start small, escalate only when warranted.

**Litmus test when reviewing a flow:** if you had to explain every option to a first-time user in one screen, could you instead show only the next decision, and reveal the rest only once they've made it?

## 2. Fluidity through seamless transitions

Static, instant transitions make an interface feel lifeless and can disorient the user about where they are and what just happened. Fluidity is the fix — but it isn't decoration for its own sake. Every animation should have an architectural job: helping the user understand how they got from point A to point B.

Working heuristics:

- **"Fly, don't teleport."** Prefer motion that implies a spatial relationship over an instant cut. A left-tab feels like it should slide in from the left; a right-tab from the right. Consistent directionality builds an implicit mental map of the app's layout.
- **Animate state changes, not just screen changes.** Something as small as an icon flipping orientation, or a button's label changing (e.g. "Continue" → "Confirm") to reflect a more consequential next step, deserves a transition — a hard cut on a label like that can leave the user unaware they're about to do something significant. A nice technique for label changes: morph through shared characters between the old and new text rather than crossfading the whole string.
- **Never duplicate an element that's about to persist.** If a component is visible now and will still be relevant on the next screen (a card, a row, a piece of text), it should visually travel/morph into its next state — not disappear and reappear as a "new" copy. Re-appearing components read as a glitch, not a transition.
- **Fluidity is cumulative, not a single flourish.** One nice transition doesn't make an interface feel fluid; it's the accumulation of many small, consistent decisions across the whole surface area of the product. Treat it as a standing budget item in every flow you touch, not a one-off polish pass at the end.
- **Sanity check by subtraction.** If you're unsure whether an animation is earning its place, mentally (or literally) strip it out and compare. If removing it makes the interaction's intent or outcome noticeably harder to follow, keep it — that's signal it was doing wayfinding work, not just decoration. If removing it changes nothing about clarity, it may just be decoration, which is fine but shouldn't be prioritized over the flows that need clarity most (e.g. anything involving money, destructive actions, or state changes).

**Litmus test when reviewing a transition:** can you state, in one sentence, what spatial or causal relationship this specific animation is communicating? If not, it's probably arbitrary motion rather than fluid motion.

## 3. Delight through selective emphasis

Delight isn't "add fun everywhere" — over-applied, it becomes noise, especially on features people touch constantly. Think of it as a curve: **the rarer a feature is used, the more room there is for a surprising or memorable touch; the more frequently it's used, the more restrained delight should be.**

- **Baseline polish must be uniform.** Every part of the product should feel equally cared-for, even the rarely-visited corners — an inconsistently polished product feels unfinished everywhere, the way one bad detail undermines an otherwise nice space. Delight is layered on top of that uniform baseline, not a substitute for it in the parts you didn't get to.
- **Save the surprising/showy moments for low-frequency touchpoints.** One-time or occasional actions (finishing setup, a rarely-visited screen, an easter egg a user might stumble on once) can support something more elaborate — confetti, a sound effect, a hidden interaction — because novelty is exactly what makes it land, and it won't wear out from repetition.
- **Keep delight in high-frequency touchpoints tiny and functional.** For something used many times a day, add restraint-sized touches (digits shifting smoothly as a number is typed, a subtle micro-animation on error) rather than anything showy — the same flourish repeated constantly stops feeling special and starts feeling like friction.
- **Novelty decays with repetition**, so budget your most elaborate ideas for the places a user will encounter rarely, not the places they'll encounter every day.

**Litmus test when deciding whether/how much delight to add:** how often will a typical user hit this exact moment? Rarely → you can afford to be memorable. Constantly → keep it small, fast, and unobtrusive, or skip it.

## Using this alongside other constraints

Simplicity, fluidity, and delight are differentiators, not replacements for the fundamentals — utility, performance, security, and accessibility still come first and are non-negotiable table stakes. Also be upfront that chasing this level of polish is a real time investment; it's a deliberate trade-off between craft and shipping speed, not a free win. When reviewing or proposing a design decision with this skill, name that trade-off explicitly rather than treating "more fluid/more delightful" as automatically correct.

## Quick review checklist

When reviewing an existing flow or component, walk through:

- [ ] **Simplicity** — Is anything shown that isn't relevant to the user's current step? Could it be deferred into a tray/next step instead?
- [ ] **Container choice** — Is this a tray/sheet or a full screen, and does that match whether the action is transient or a real destination?
- [ ] **Fluidity** — Does every transition explain an A→B relationship, or are any of them arbitrary/decorative?
- [ ] **Continuity** — Does any element disappear and reappear when it could instead persist/morph across the transition?
- [ ] **Delight placement** — Is delight concentrated on rare, memorable moments and kept minimal on high-frequency ones (or is it backwards)?
- [ ] **Baseline polish** — Would a rarely-used corner of this product feel as cared-for as the main flow?
- [ ] **Trade-off named** — If recommending more animation/polish, has the added complexity/time cost been acknowledged?

## Further reading

- Source essay: [benji.org/family-values](https://benji.org/family-values)
- Family's tray system was partly inspired by Craft's navigation model
- Related essay on frequency/novelty in interaction design: Rauno Freiberg, [rauno.me/craft/interaction-design](https://rauno.me/craft/interaction-design)
- Emil Kowalski's course on web animation: [animations.dev](https://animations.dev/)