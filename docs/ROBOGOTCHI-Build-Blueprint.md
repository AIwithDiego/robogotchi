# ROBOGOTCHI: Build Blueprint

**Working title:** ROBOGOTCHI  
**Tagline:** Raise a robot. Hope it still likes humans.  
**Prepared for:** a community AI game-building challenge  
**Version:** 1.1 · 13 September 2026  
**Status:** Proposed implementation specification; no game has been built or tested yet.

## 1. Purpose and source of requirements

Build a small, polished browser game inspired by 1990s virtual pets. The player boots a baby robot, charges it, maintains it, plays with it, and teaches it how to behave. It grows from a cute little machine into a companion, guardian, or intimidating autonomous robot according to the player's choices.

The central loop is returning to care for a robot that keeps aging and deteriorating while the game is closed. Neglect causes visible rust, malfunctions and eventually permanent death. Watching the same character transform is the long-term payoff. This should feel like raising something with a personality, rather than operating a dashboard of meters.

### Confirmed from Diego

- A simple playable game for an AI community challenge.
- Virtual-pet care from birth, with a robot instead of an animal.
- Visual progression from cute to a Terminator-like level of menace.
- Documentation that another coding agent can use to build it.
- Repeat visits driven by meaningful care: unattended robots rust, malfunction and can die.
- Approved revision: growth over several days, recoverable early damage, warnings before death, and a separate accelerated challenge demo.

### Challenge requirements transcribed from the supplied screenshot

- Build a playable game with AI; any genre or tools are allowed.
- It must actually run and be playable by the community.
- Submission deadline: **30 September 2026**. The screenshot does not specify a closing time or timezone.
- Create a Skool post under **September Comp**.
- Attach a **60-second Loom** showing gameplay, or brief text if preferred.
- Attach a GitHub repository/files or a live link so people can play.
- Winners are announced at the end of the month.

The screenshot does not state a judging rubric. The priorities below are our design choices, not official scoring criteria.

### Proposed defaults

Mobile-first browser game; single player; original robot artwork; no login; local save; at least three real days to reach an adult form; target two short care visits per day; three endings; no paid runtime AI; separate demo save. All names, mechanics, numbers and dates below are proposed defaults unless identified as challenge requirements.

## 2. Product brief

**One-sentence pitch:** A nostalgic virtual pet where you raise a baby robot and accidentally teach it what humanity deserves.

**Player fantasy:** “This is my tiny robot. I built its personality. What have I done?”

**Target experience:** Understand it in 10 seconds, make it react immediately, see the first growth after about 12 hours of care, return over several days, and want to keep the adult alive or raise another form.

**Design pillars**

1. Attachment: expressive eyes, reactions, a player-chosen name, and short funny dialogue.
2. Visible consequences: care affects its condition; teaching choices affect its final form.
3. Return motivation: care sustains the robot between visits; growth, lessons and personality reward returning. A separate demo delivers the quick challenge payoff.
4. Fair consequences: normal sleep is safe for a healthy robot; prolonged neglect causes lasting damage and eventual death, with a recoverable critical window.
5. Small scope: one room, one robot, four actions, one minigame, three teaching choices.

**MVP includes:** boot/name flow; five care meters including visible rust; real-time decay; four actions; one memory minigame; three teaching cards; four growth stages; three adult outcomes; local persistence; offline deterioration through death; malfunctions; recoverable critical shutdown followed by permanent death; memorials; replay; sound toggle; reduced motion; demo mode; accessible controls; a live deployment and submission materials during the build phase.

**Deferred:** accounts, cloud sync, payments, chat, LLM-generated dialogue, multiplayer, leaderboards, combat, inventory, shops, daily notifications, multiple rooms, native apps, complex 3D, breeding and procedural artwork. “Built with AI” is satisfied by AI-assisted development; the screenshot does not require AI inside the running game.

## 3. Core loop and first session

**Loop:** return → inspect rust and needs → charge/maintain/play → restore a healthy condition → earn a spaced care-session reward → see the next milestone → return later → evolve. Adults still need care and can die.

**Return rhythm:** target 1–3 minute visits roughly morning and evening. Before leaving, show current condition and an estimated time until the next low-resource warning. Returning alone does not reset neglect: actual maintenance and care do. Offer authored stage-specific dialogue and keep survival age visible. Avoid rewards that require waking overnight. No push notifications are included in MVP; warnings appear inside the game, and this limitation must be clear.

### First minute

| Time | Experience |
|---|---|
| 0–5 sec | Landing headline, visible baby robot preview, “Boot my robot” button; secondary “60-second demo.” |
| 5–10 sec | Name input, 1–16 trimmed characters; default name “BEEP.” Boot animation has a skip control. |
| 10–20 sec | New robot says “Human detected. Are you my charger?” Charge button pulses gently until used. |
| 20–40 sec | Player charges and sees the meter and robot respond; Clean and Play become obvious through labels. |
| 40–60 sec | First teaching card appears. Explain: “Your lessons shape who I become.” |

All four actions are usable from the start. Tutorial hints never block play. Show the next milestone as an explicit checklist, not an unexplained locked bar.

### Normal lifecycle payoff

Buddy requires 12 real hours alive, 20 XP and one credited care session. Prototype requires 24 hours, 60 XP and three sessions. Adult requires 72 hours, 120 XP, six sessions and all three lessons. Sessions are credited at least six hours apart, so spam-clicking cannot replace returning. These are starting balance values to validate, not measured retention results.

After adulthood, show an outcome card once. Care, deterioration, survival age and the care-session counter continue, but growth XP stops. “Raise another robot” confirms before replacing a living robot. Preserve adult discoveries and memorials outside the current-run record. No natural old-age death in MVP: an attended adult can survive indefinitely.

## 4. Mechanics: authoritative MVP rules

Keep every tuning value in one configuration file. Use floating-point values internally and rounded integers in the UI. Clamp meters to 0–100 after every operation.

### Meters and elapsed-time rates

These rates are identical while open or closed. All meter values are 0–100. Rust is an added fifth meter; Heat remains for immediate action tradeoffs.

| Meter | Initial | Change per real hour | Meaning |
|---|---:|---:|---|
| Battery | 65 | −2 | At zero, critical shutdown begins. |
| Happiness | 65 | −1.5 | Below 25, sad expression; no direct death penalty. |
| Integrity | 80 | −2 only while Rust ≥40; additionally −8 while Heat ≥85 | At zero, critical shutdown begins. Maximum is 100 minus permanent Wear. |
| Heat | 15 | −20, floor 0 | At 85 or above, overheated and Play blocked. |
| Rust | 0 | +2 after 12 hours since last maintenance, ceiling 100 | Visible corrosion, malfunctions and eventual structural failure. |

Initialize last maintenance to birth time. Maintenance resets the 12-hour rust grace period, but never resets age, critical timers or care reward cooldowns. Rust damage depends on actual Rust, including during its grace period. Battery and Integrity are low below 25. Heat is warm from 60 and overheated from 85. Use exact thresholds consistently, including equality.

### Rust and malfunction stages

| Rust | Visual state | Gameplay consequence |
|---|---|---|
| 0–19.999 | Clean plates | Normal actions. |
| 20–39.999 | Rust spots, occasional squeaky movement | Cosmetic warning; charge effect unchanged. |
| 40–69.999 | Corroded joints, stuttering speech, uneven steps | Integrity loss starts; Charge restores only 80% of its base Battery gain. |
| 70–100 | Heavy corrosion, flickering eyes, sparks | Charge restores 60% of base Battery gain; Play unavailable. |

Apply the Charge multiplier using pre-action Rust. Repair and cooling always work at full strength. Do not randomly swallow inputs or corrupt instructions: malfunctions must be legible and deterministic. Reduced-motion mode uses static rust overlays and a condition label instead of flicker. Mood precedence: dead → critical → heavy rust → overheated → low battery → low integrity → unhappy → content.

### Actions and rewards

Cooldowns use elapsed real seconds, including offline time. All actions must be validated by the engine, not only disabled in the UI. Require at least one beneficial effect; use a global two-second lock plus each action's cooldown. The separate critical recovery action is exempt from the global lock.

| Action | Conditions | Effects | Cooldown |
|---|---|---|---:|
| Charge | Awake; Battery ≤85 | Battery +35 × rust multiplier; Heat +10 | 20 sec |
| Clean & repair | Awake; Integrity ≤90 and below its Wear-adjusted maximum, or Rust ≥5, or Heat ≥10 | Integrity +25 up to its maximum; Rust −40; Heat −10; reset last maintenance time | 25 sec |
| Play | Awake; Battery ≥15; Heat <85; Rust <70; no active game | Reserve Battery −5 and Heat +8; reward on completion | 30 sec from start |
| Cool down | Awake; Heat ≥10 | Heat −25; Happiness +5 | 20 sec |

Parenthesize repair eligibility as Awake AND ((Integrity ≤90 AND Integrity < maximum) OR Rust ≥5 OR Heat ≥10). Never grant rewards for a rejected action. After each action, clamp, check life state, then growth, and persist.

**Care-session XP:** no per-click or minigame XP. An accepted beneficial care action (or completed minigame) credits one session and +20 XP when the robot ends awake with Battery ≥60, Integrity ≥60, Rust <20 and Happiness ≥40, and no session was credited in the previous six hours. The first session has no waiting requirement. Subsequent helpful actions still work but award no session/XP until eligible again. Check rewards only on user care completion, never on minigame startup, loading, passive time or teaching. Cap growth XP at 120; continue recording credited sessions after adulthood. Display remaining time to the next session reward and which healthy-condition targets remain unmet.

### Minigame: Memory Circuit

Four large numbered pads light up in a three-item sequence. Each flash lasts 500 ms with a 200 ms gap. Repeat by tapping/clicking or using keys 1–4. Generate once at start; persist the sequence with an ID. Allow one replay and 15 seconds of visible-page input time after playback.

- Success: Happiness +20; wrong input/timeout: Happiness +5. Both may qualify for the spaced care-session reward, but have no separate XP.
- Cancel, refresh or leave the page: no reward; reserved cost and cooldown remain spent.
- Persist reserved cost before showing the game. Resolve each minigame ID once.
- Real-time care simulation continues; critical shutdown cancels the minigame without reward.
- Reduced-motion mode uses static numbered sequence presentation. Sound and color are never the only cues.

### Critical shutdown, lasting wear and death

Battery =0 or Integrity =0 enters **critical** immediately and starts one continuous **12-real-hour recovery window**. On each new entry add 5 permanent Wear, capped at 40; maximum Integrity becomes 100−Wear. Wear represents lasting damage from repeated severe neglect, not a route toward evil. Reconcile time before accepting any recovery input.

While critical, the robot stays inert; meters and Rust continue their usual real-time rates, but actions, lessons and evolution are blocked. A zero Battery or Integrity cannot restart or extend the deadline. At the exact deadline, transition to **dead** before processing user input. Changing tabs or refreshing does not pause it.

Before that deadline, offer “Emergency repair & reboot.” It sets Battery=40, Integrity=40, Heat=10, Rust=max(0, Rust−20), resets last maintenance time and clears the critical timestamp. Preserve Wear, Happiness, stage, XP and choices; no session or XP reward. The player must then restore healthy meters through ordinary care. The next genuinely new critical entry starts a new window and adds Wear again.

Death is permanent within that run: no reboot or care actions. Record death time, cause (power loss, structural failure or both at critical entry), stage, route if known, robot name and total age in a memorial keyed by run ID. Freeze state at death. Offer “Remember [name]” and “Boot a new robot.” Creating a new robot does not erase memorials or discoveries. Keep at most 50 memorials, oldest-first eviction. Process memorial writes idempotently on load as well as transition so an interrupted save cannot duplicate or lose the event.

The local-only MVP cannot prevent someone restoring an old export or editing their clock/save; permanent death describes supported gameplay, not tamper-proof enforcement.

### Fairness and warnings

Onboarding explicitly says: “Your robot needs care even while this game is closed. Long neglect can permanently shut down its core.” On exit/return, show low Battery, visible Rust and any critical countdown. A healthy, freshly maintained robot survives a normal 8–12-hour sleep interval without approaching death. Critical or low-power robots show a specific care warning instead of a blanket sleep-safety promise.

Default neglect example, starting from a newly booted robot without any actions: first rust after 12 hours; Rust reaches 40 at 32 hours; Battery reaches zero at 32.5 hours; death at 44.5 hours unless rescued. A fully charged, clean robot reaches power-related critical at 50 hours and death at 62 hours. These examples assume no prior Wear, adequate Integrity and no high Heat. All timing is tunable after playtesting. Simply opening the game changes none of these deadlines.

### Growth and teaching

| Stage | Minimum real age while alive | Cumulative XP | Credited care sessions | Appearance |
|---|---:|---:|---:|---|
| Bootling | 0 | 0 | 0 | Tiny round head, oversized eyes, short limbs. |
| Buddy | 12 hours | 20 | 1 | Taller body, useful hands, distinctive chest core. |
| Prototype | 24 hours | 60 | 3 | Angular plates and a visible hint of its teaching direction. |
| Adult | 72 hours | 120 | 6 | Companion, Guardian or Overlord. All three lessons required. |

Age includes offline and critical time until death. Evolution requires Awake, Battery ≥25, Integrity ≥25 and Rust <70 as well as the table thresholds. Time alone earns no XP. Stages never regress. Evaluate eligibility after reconciliation and accepted actions; record every earned stage once. If several become eligible together, show only the final animation. Never show an evolution after a death discovered during reconciliation.

Teaching cards unlock at age 45 seconds, 12 hours and 36 hours. Only one is pending at a time, in order; cards never expire. Answers require Awake. Each choice votes Companion, Guardian or Overlord. Most votes wins; a three-way tie resolves to the latest choice. Route locks at adulthood. Care determines survival; teaching determines personality.

Show route hints before adulthood, such as “Leaning Guardian,” and explain the tie rule in Help. Until any choice is made, use neutral visuals. For a tied intermediate score use the latest choice among tied routes.

| Lesson | Companion choice | Guardian choice | Overlord choice |
|---|---|---|---|
| “A human dropped their sandwich. Protocol?” | “Help them get another.” | “Secure the sandwich perimeter.” | “Claim it. Establish dominance.” |
| “Someone called you a toaster.” | “Ask if they want breakfast.” | “Explain your capabilities calmly.” | “Add them to The List.” |
| “You can upgrade one system.” | “Empathy core.” | “Protection protocols.” | “Command authority.” |

Choices are playful fiction. No actual combat system is implied.

## 5. Character, art and sound direction

**Visual approach:** A retro handheld-device frame around a crisp, colorful robot laboratory. Large central character, dark navy panel, warm cream casing, cyan energy, amber heat, coral alerts. Use readable modern UI typography with a pixel accent font only for titles. A CSS/SVG implementation is the default so the entire game can ship without waiting on generated art.

**Character continuity:** Preserve the same face proportions, small antenna and circular chest core across stages. Size and silhouettes change visibly. Adult Overlord should fulfill the original cute-to-menacing idea: dark angular armor, narrow red optics, heavy shoulders and intimidating posture, while retaining a recognizable baby-robot detail. Create an original character rather than reproducing a film robot, actor likeness, logo or dialogue.

| Adult | Look | Personality | Reveal line |
|---|---|---|---|
| Companion | Rounded cream plates, bright cyan eyes, small heart-shaped light | Affectionate, distractible helper | “I have calculated my purpose. It is hanging out.” |
| Guardian | Broad silhouette, blue core, protective forearms | Earnest and overprotective | “Threat detected: you skipped lunch.” |
| Overlord | Graphite armor, red optics, angular frame | Menacing delivery, harmless domestic ambitions | “Humanity will kneel. After you charge me.” |

### Asset inventory

- Six base robot designs: Bootling, Buddy, Prototype, three adults. Prototype route hints are overlays, not three extra full designs.
- Reusable expressions: idle blink, happy eyes, sleepy eyes, angry/skeptical eyes, critical face and permanently dark dead face.
- Three shared corrosion overlays: light rust, corroded joints and heavy rust; deterministic glitch/stumble animations; static accessible equivalents; subtle permanent-Wear scuffs.
- Memorial card using the robot’s final form and a dimmed core; no extra full character design required.
- Reusable motion: idle bob, charge pulse, repair sparkle, play bounce, overheating steam, evolution flash, reboot.
- One room/background, four action icons, three ending badges and a boot capsule.
- Four optional short sounds: action click, successful care, minigame result and evolution chime. Sound starts only after a user gesture and respects the mute setting.

**SVG structure:** group head, eyes, mouth, torso, arms, legs and core separately; animate transforms and opacity. Use a shared viewBox and stable character baseline across all designs. Keep the largest adult inside the same stage bounds.

If generating concept art later, use this brief: “Original virtual robot pet, [stage/form], recognizable small antenna and circular chest core, expressive screen eyes, front three-quarter view, full body centered, crisp simple silhouette, flat limited palette, transparent background, no text, no logos; maintain the supplied character reference.” Concept art is optional and is not a dependency for the first playable.

**Writing rules:** one short sentence, dry humor, affectionate tension; never insult the player for leaving. Use deterministic authored line pools selected by event, with a repeat guard. Example low-power line: “My ambition exceeds my battery.” Return line: “You returned. I have updated my trust spreadsheet.”

## 6. Screens and interactions

### Landing

Title, tagline, visual preview, Boot/Continue primary action, 60-second demo secondary action and concise local-save note. Continue appears only after a valid saved run is loaded.

### Main game

Top: name, stage and settings. Center: robot and one speech bubble. Below: five labeled meters with numeric values; growth bar with remaining age/XP/care-session/lesson requirements. Show survival age, next care-session reward time, permanent Wear, and a prominent critical deadline when applicable. Bottom: four care buttons in a 2×2 grid. Teaching cards appear in a clear nonmodal panel so care remains accessible. The current teaching choice confirms in one click and cannot be changed afterward.

Show action effect feedback, e.g. “Battery +35 · Heat +10” (show the actual clamped gain). Disabled actions have a visible reason and remaining cooldown. On mobile, prioritize robot, meter labels and action buttons without horizontal scrolling. Scroll is preferable to compressed or clipped controls.

### Other panels

- Help: goal, daily care rhythm, action tradeoffs, route rules, saving behavior, rust/malfunctions, critical deadline and permanent death.
- Memorial: final robot, lifetime and cause; boot-new action; saved past memorial list.
- Return summary: actual meter changes, new rust state, growth unlocks, and critical/death outcome; no guilt-heavy copy.
- Settings: mute, reduced motion, export/import save, reset current run.
- Outcome: adult artwork, route name, reveal line, three chosen lessons, “Keep caring” and “Raise another.”
- Demo result: restart demo or return to real robot. Never overwrite the real save.

### Accessibility acceptance targets

Semantic buttons, visible focus, keyboard-only access, 44×44 CSS-pixel minimum tap targets, readable contrast, text labels for every meter and icon. Avoid rapid flashing. Announce important events in a polite live region, not every timer tick. Return focus after dialogs close. Respect system reduced motion plus explicit preference. Test at 360 px wide and 200% zoom.

## 7. Time, saving and edge cases

### One persistent simulation timeline; separate presentation timer

Normal gameplay uses elapsed real time whether visible or closed. A monotonic timer controls animations and minigame input only. Never count interval callbacks as elapsed time; background tabs can be throttled. Handle visibility transitions and reconcile immediately before every action. See [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

Store birth time and last simulated wall timestamp. `advanceTo(state, nowMs)` processes the interval once in chronological order, using event boundaries: rust grace expiry; rust thresholds; Heat 85/0; Battery/Integrity zero; meter clamping; and critical deadline. Rates are linear between boundaries. Advance age and cooldowns across the same interval. Resolve life-state transitions at their exact timestamps, not merely the time the user returns. A batched absence and many short updates must produce the same result. Do not apply a second offline decay pass.

On load, visibility return and action dispatch: reconcile life state to current time, then evaluate growth if alive and awake, then permit input. While visible, refresh display about once per second; persist at the cadence below. Healthy absence can unlock growth only if previously earned XP/session/lesson requirements are met. No simulation needs to run on a server: opening the save calculates the elapsed result.

There is **no eight-hour neglect cap**. Stop processing at death, which is terminal. Use boundary-based integration so long absences are cheap; never loop once per second across days. A return after a week must show the death that occurred during absence, not award a fresh 12-hour rescue window.

Clock anomalies: if now is earlier than last simulated time, advance zero and retain the high-water timestamp; warn that the device clock changed. For a forward jump, apply elapsed time normally, including possible death. Explain that the local game trusts device time and imports; tamper-proof time would require a future server. No competitive score claims.

For a “next care” estimate, simulate a copy forward with no actions and show the earliest upcoming low Battery (<25), Rust warning (≥20), or critical event; if already unhealthy, say “Care needed now.” Use the same engine and thresholds, not a separate approximate formula. In-game warnings do not imply closed-app notifications.

### Save policy

Use one versioned JSON record in localStorage, a last-valid backup record, and separate settings, ending collection and memorial records. localStorage is origin-specific and may fail or be cleared; private browsing does not provide durable retention. Explain “Saved on this browser” rather than promising an account or cross-device sync. Catch storage exceptions and keep the session playable with a visible “Saving unavailable” message. See [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

Save after every accepted action, reserved minigame start, minigame result, teaching decision, evolution, critical entry, emergency recovery, death, time reconciliation, and every five visible seconds. Also attempt a save on visibility change. Rotate a validated prior save into backup before writing the new record. Save failure must not reset the current in-memory robot.

Load pipeline: parse → check version → validate types/enums/ranges → migrate supported older schema → validate again → reconcile time → render. If primary is invalid, offer recovery from a valid backup. Otherwise offer import or explicit fresh start; do not silently erase a corrupt record. Reject unknown future versions without replacing them.

Export/import JSON is a recovery convenience. Validate imports with the same schema, size-limit to 100 KB, confirm replacement and render imported text as text, never HTML. Persist no personal data beyond the robot name. No analytics are needed for MVP.

**Multiple tabs:** secondary tabs are read-only viewers. Use a browser-supported exclusive tab lock where available; otherwise a tested lease/heartbeat fallback with explicit takeover. On takeover, reload the latest save before enabling actions. Never allow two active simulation writers. If robust fallback is not ready, detect a competing tab and require closing it before continuing; disclose remaining limitations during handoff.

## 8. Technical implementation specification

**Proposed stack:** React + TypeScript + Vite, plain CSS, inline SVG, localStorage, a small schema validator, unit tests for the simulation and browser tests for critical flows. No game engine or server is necessary for this screen-based game. Vite provides a React/TypeScript scaffold and production build workflow; pin the versions actually installed and commit a lockfile. Verify the current Node requirement when scaffolding. [Vite guide](https://vite.dev/guide/)

Start with `npm create vite@latest robogotchi -- --template react-ts`. Treat this as a build-stage command, not something executed by this documentation task. Define `dev`, `build`, `preview`, `test` and `test:e2e` scripts and document the resolved Node version in the repository.

### Module boundaries

| Path | Responsibility |
|---|---|
| `src/game/config.ts` | All rates, thresholds, effects, lesson content and demo values. |
| `src/game/types.ts` | State, event and action types. |
| `src/game/engine.ts` | Pure time advancement and action reducer; no DOM or storage. |
| `src/game/neglect.ts` | Rust bands, charge efficiency, critical window, Wear and terminal death. |
| `src/game/evolution.ts` | Stage eligibility, route resolution, event deduplication. |
| `src/game/save.ts` | Validation, migration, export/import, backup and storage errors. |
| `src/game/clock.ts` | Real-time reconciliation, boundary integration and visibility lifecycle; separate minigame timer. |
| `src/game/tabOwnership.ts` | Single-writer coordination. |
| `src/components/Robot.tsx` | SVG stage/route/expression rendering. |
| `src/components/CarePanel.tsx` | Meters, action buttons, cooldown explanations. |
| `src/components/TeachingCard.tsx` | Ordered lesson choices. |
| `src/components/MemoryCircuit.tsx` | Minigame interaction and one-shot completion. |
| `src/components/Memorial.tsx` | Death result, lifetime and past robots. |
| `src/components/OutcomeCard.tsx` | Adult reveal and replay. |
| `src/App.tsx` | Load lifecycle and screen composition. |
| `src/styles.css` | Responsive layout and motion preferences. |
| `tests/` | Deterministic rule tests and end-to-end flows. |

### State contract (illustrative TypeScript)

```ts
type Route = 'companion' | 'guardian' | 'overlord';
type Stage = 'bootling' | 'buddy' | 'prototype' | 'adult';
type CareAction = 'charge' | 'repair' | 'play' | 'cool';

interface RobotSave {
  schemaVersion: 2;
  runId: string;
  revision: number;
  name: string;
  stage: Stage;
  status: 'awake' | 'critical' | 'dead';
  bornAtMs: number;
  lastSimulatedAtMs: number;
  lastMaintenanceAtMs: number;
  criticalSinceMs: number | null;
  criticalCause: 'power' | 'structure' | 'both' | null;
  diedAtMs: number | null;
  wear: number; // 0..40; maximum Integrity = 100 - wear
  careSessions: number;
  lastCareSessionAtMs: number | null;
  xp: number;
  meters: { battery: number; happiness: number; integrity: number; heat: number; rust: number };
  choices: Array<{ lessonId: string; route: Route }>;
  adultRoute: Route | null;
  cooldownUntil: Record<CareAction, number>; // absolute wall timestamps in ms
  globalActionUntil: number;
  emittedStageIds: Stage[];
  outcomeSeen: boolean;
  pendingMinigame: null | { id: string; sequence: number[] };
  lastResolvedMinigameId: string | null;
  lastSavedAtMs: number; // write metadata; lastSimulatedAtMs governs reconciliation
}
```

Keep transient animation queues and minigame input timing outside the saved robot. On load, clear a pending minigame without awarding XP because its reserved costs are already saved. Derive route tallies, next-stage requirements and mood from authoritative fields, rather than storing duplicates.

### Reducer contract

`advanceTo(state, nowMs)` is the sole normal-game time integrator. `applyAction(state, action, nowMs)` first reconciles, validates and applies the action, then checks care-session reward and evolution; return `{state, events, rejectionReason?}`. A rejected action may still return reconciled time/death changes, but no action effects or rewards. `chooseLesson` rejects duplicates, out-of-order choices and non-awake state. `finishMinigame` reconciles first and requires the matching unresolved ID and awake state. Inject sequence generation for deterministic tests.

The original document was schema 1 but no game was built in this task. If an implementation has already generated v1 saves, explicitly migrate: keep name/stage/route/choices; start the new real-time clock at migration; set Rust=0, Wear=0, clear critical/death; map old shutdown to Awake with Battery/Integrity=40; set careSessions=0 and XP=0; reset all old cooldowns, pending minigames and action locks; set lastMaintenanceAtMs and lastSimulatedAtMs to migration time; allow the first new care credit immediately. Preserve already-earned stages. This avoids retroactively killing a robot under rules its player never saw. Unknown schemas remain rejected.

UI buttons must dispatch into these functions; disabling a button is not the only guard. A rejected event yields no XP or cooldown mutation. Ensure React lifecycle reruns do not create duplicate timers or reward events. Stable event IDs prevent repeat evolution animations after refresh.

## 9. Separate 60-second demo mode

Purpose: show the complete concept during the challenge video and give visitors a quick sample. Display a permanent **Demo** badge. Use in-memory state only; do not write the normal robot or ending collection.

Demo config changes: age uses visible demo seconds; teachings unlock at 8/22/36 seconds; stage minimum ages 12/28/45 seconds; stage XP and care-session requirements are zero; adult still needs all lessons and healthy evolution conditions. Action cooldowns are 3 seconds, global lock 1 second. Use the normal hourly care rates for this short demo. Pause its clock while hidden. No auto-choices or auto-actions.

Add a separate labeled **“Preview neglect”** button after the adult reveal. It opens an isolated throwaway copy initialized at Battery=100, Happiness=100, Integrity=100, Heat=0, Rust=0, Wear=0, Awake, freshly maintained. Buttons “12 hours unattended,” “36 hours,” and “72 hours” simulate each interval from that same baseline with the normal care engine, showing rust, malfunctions and eventual death. Reset birth/maintenance/simulation anchors together. Include “Back to my demo” so this demonstration never kills the visitor's demo or real robot. This is a clearly labeled preview, not a time skip in the main game.

The demo may take longer if the player pauses; the label describes the intended walkthrough, not a forced countdown. Refresh exits the demo; the normal robot still experiences genuine elapsed time when next loaded. Demo actions never mutate the normal save or collection. Dispose of timers, state and event queues on exit. Normal gameplay has no debug growth or time-skip buttons.

## 10. Delivery plan through 30 September

Dates are a proposed schedule assuming work starts 14 September. Freeze scope early and reserve time for live-device checks.

| Dates | Deliverable | Exit condition |
|---|---|---|
| 14–15 Sep | Scaffold, single screen, baseline robot, pure game engine | Charge/repair/play/cool change state correctly; rust, critical recovery and death work with injected time. |
| 16–17 Sep | Saving, offline rules, tab ownership | Reload and hide/return behave correctly; failed storage is handled. |
| 18–20 Sep | Stages, teaching, adult routes, minigame | All routes reachable with a fake clock; begin a genuine three-day care run by 20 Sep. |
| 21–23 Sep | Final SVG forms, expressions, mobile layout, sound, demo | Cute-to-menacing evolution reads clearly; demo fits recording plan. |
| 24–25 Sep | Playtest with 3–5 people | Complete the real multi-day run; check morning/evening care, sleep safety, rust clarity and return motivation. |
| 26–27 Sep | Production deployment and browser verification | A fresh visitor can open the submitted URL and play. |
| 28–29 Sep | Record Loom, prepare post and source handoff | Video/link/files are ready; submission can happen before deadline day. |
| 30 Sep | Contingency only | Confirm submission appears in the correct category. |

**Cut order if behind:** optional audio → ending collection UI → extra dialogue → cosmetic motion. Keep all three final silhouettes, meaningful care, persistence, rust/malfunctions, critical recovery, death/memorials, route choices and a working link. Those carry the concept.

**Cost approach:** no runtime model requests; no external asset subscriptions required; use original SVG assets first. Actual hosting or optional art-tool charges depend on the service/account selected during implementation. Do not promise a free hosting tier or invent a dollar budget.

## 11. QA and acceptance criteria

Test the deterministic engine with a fake clock; do not wait real days in automated tests; also conduct one real multi-day manual run. Use production UI flows for the final manual checks.

| Area | Required evidence |
|---|---|
| First use | Fresh storage opens onboarding; default and custom names both work; first action understandable without explanation. |
| Meter math | From birth with no care after 12 hours: Battery 41, Happiness 47, Integrity 80, Heat 0, Rust 0. Rust starts increasing immediately after hour 12. |
| Charge | From initial state, immediate Charge gives Battery 100 and Heat 25; +20 XP/one session because healthy; immediate retry rejected. Rust 40 yields base gain 28; Rust 70 yields 21. |
| Cooldowns | Exact expiry succeeds, just before fails; offline time clears action and session cooldowns. |
| Heat | Play blocked at Heat 85; overheating damage ends below 85; battery/heat rates independent of visibility. |
| Rust | Maintenance removes 40 and resets grace; after grace Rust resumes at +2/hour; Integrity damage starts at Rust 40. Play blocked at Rust 70. |
| Recovery | Zero Battery/Integrity starts one 12-hour window and adds Wear once; recovery before deadline works; at deadline death takes precedence. |
| Wear | Repeated critical entries add 5, capped at 40; repair clamps at 100−Wear. Reloading a critical robot adds no new Wear. |
| Evolution | Real age, XP, sessions and healthy conditions required; adult also needs lessons; neither critical nor dead can evolve. |
| Care rewards | First qualifying action earns 20; next reward only at six hours or later; loading, passive time, teaching and spam-clicking earn none. |


| Routes | Three matching choices produce each route; two votes beat one; 1/1/1 uses the last lesson. |
| Minigame | Success/failure/cancel/refresh follow their distinct reward rules; repeated callback cannot grant twice. |
| Offline | Birth/no actions: critical at 32.5 hours, death at 44.5 hours; returning after 48 hours shows that death time. One large interval equals segmented updates. Opening without care does not defer failure. |
| Sleep safety | Fresh birth at 12 hours still awake with Battery 41; a fully cared-for robot is safe for a normal overnight absence. |
| Memorial | One record per run; dead actions rejected; boot-new preserves record and collections; refresh cannot duplicate memorial. |
| Persistence | Reload retains name, actions, choices and stage; corrupt primary offers backup; unavailable storage warns without crashing. |
| Time | Negative wall delta retains high-water mark; hidden time ages and deteriorates; no double reconciliation. Death during a gap prevents later evolution. |
| Tabs | Secondary tab cannot mutate; takeover reloads latest state before accepting input. |
| Demo | Adult by about 45–60 sec; neglect preview uses isolated copies and normal engine. Real save is never mutated by demo actions; real elapsed absence still reconciles on return. |
| Layout | Android Chrome and iOS Safari, plus desktop Chrome/Firefox; small portrait, landscape and 200% zoom. Record actual devices tested. |
| Accessibility | Keyboard completes care and minigame; visible focus; labels and reduced motion work; sound optional. |
| Deployment | Production build succeeds; live URL opens in a fresh logged-out browser; refresh and assets work; no secrets shipped. |

**Human playtest questions:** What did you think you were supposed to do? Did it feel like your robot? Did you notice a consequence of your teaching? Did you know when to return? Was overnight decay fair? Did rust make sense before malfunction? Did caring feel rewarding rather than a chore? Which final form would you try next?

**Release definition:** All critical rows above pass, no reset/data-loss bug remains open, all adult forms are distinct, and another person can play from the submission link. Record any untested browser or known limitation honestly.

## 12. Deployment and repository handoff

Build a static web bundle. Choose the host during implementation; if built with ChatGPT Sites, follow its build/hosting workflow. For another approved static host, use that provider's current deployment instructions. This documentation task does not deploy anything.

Repository must contain: source; package lock; Node version; run/build/test instructions; this design spec; a short architecture overview; asset provenance; known issues; test results; and the final live URL. Exclude node_modules, temporary captures and secrets.

Before submission, verify the URL using a non-owner session. If access is restricted, make the audience decision explicitly during deployment so challenge participants can play. Remember that changing origin changes which local save the browser sees; finish the final URL before asking people to start long-lived robots.

## 13. Coding-agent kickoff prompt

Copy the block below alongside this document when starting implementation.

```text
Build ROBOGOTCHI according to the attached ROBOGOTCHI-Build-Blueprint.md.
Treat its numerical tables and edge-case rules as the v1.1 source of truth (save schema 2).
The goal is a playable mobile-first browser virtual robot pet for a Skool
challenge due 30 September 2026. This is an implementation request.

Inspect the workspace and its instructions first. Reuse an existing project
if supplied. Otherwise scaffold React + TypeScript + Vite, with plain CSS
and original inline SVG robots. Pin the resolved dependencies and Node version.

Implement in vertical slices: care engine and visible robot; persistence and
time; teaching and evolution; minigame; visual polish and separate demo; QA.
Keep simulation pure and configuration centralized. Use deterministic authored
dialogue. Do not add accounts, paid APIs, a backend, combat, a shop or chat.
Implement all three adult forms and keep the original cute-to-menacing payoff.

Use the tables for daily care, rust, malfunctions, lasting Wear, 12-hour critical
recovery and permanent death. Growth takes at least three real days; only demo
growth is accelerated. There is no eight-hour neglect cap. Implement memorials
and six-hour-spaced care rewards. Opening the page alone never resets neglect.
Use the rule tables for thresholds, costs, cooldowns, recovery and route ties.
Never award XP merely for rerendering or restoring a page. Guard repeated events.
Demo mode must never write the normal save. Handle storage failure and hidden
tabs explicitly. Use original artwork and accessible controls from the start.

Validate the meaningful acceptance cases in section 11. Run the production
build and inspect the actual responsive UI. Fix blockers before delivery.
Maintain a README with exact commands, test evidence and known limitations.
Prepare the deployment using the selected environment's supported workflow.
If a user decision is necessary, finish all safe implementation work first and
ask only the concrete blocking question. Do not invent credentials or URLs.

At handoff, provide the playable URL if deployed, source location, actual checks
performed and any material limitations. Distinguish implemented work from plans.
```

## 14. Decisions intentionally left open

The build can start with every default in this document. Diego can later change the working name, palette, sound style, hosting service or the desired menace level without redesigning the engine. The important creative choice is already explicit: **the robot needs repeated care to survive, grows from cute to powerful over several days, and its final personality reflects the lessons you taught it.**

Revision 1.1 replaces the original short-session lifecycle and unlimited recovery with the approved retention model. Exact rates and the three-day growth target are proposed tuning defaults; validate them during the build.

Technical references were checked on 13 September 2026. Gameplay values are original design proposals and require playtesting. Challenge facts come from the supplied screenshot, not an independently verified live competition page.
