# Verification: v2, 15 September 2026

## Activity pose fix: 16 September 2026

- Dance, weights and coffee now use shoulder/elbow joints rendered in front of the body. Foreground hands keep their grip on props; the cup stays upright and lifts to the face across different robot proportions. Idle poses and care logic are unchanged.
- Checked all 54 combinations of six stage/route forms, three body shapes and three activities at three points in their movements. Foreground layering and cup alignment passed with no JavaScript errors. Repeated with reduced motion at a narrow viewport; static poses stay readable. Normal and reduced-motion pose sheets were visually inspected.
- The four existing activity/memory browser checks passed in desktop Chrome, mobile Chrome emulation, Firefox and WebKit. These verify that activities remain free of care costs and memory capture preserves its pose. Production TypeScript/Vite build passed.

## Vercel release check: 16 September 2026

- Production URL: https://robogotchi-nine.vercel.app. Vercel reports Ready, serving the existing local-save game without accounts, a database or cloud-sync code.
- All 70 deterministic tests and the production build passed after removing the abandoned cloud-save work. The game bundle matches the published restart-fix version.
- A fresh anonymous desktop browser received HTTP 200 and completed naming, customization, care/reload, an activity, a frozen memory snapshot, arcade controls, older-save migration and a complete reset that remained cleared after refresh. All six room images loaded.
- A separate anonymous mobile browser at 390×844 booted its own robot, charged it, retained it after refresh, showed no account controls and had no horizontal overflow. The mobile screenshot was inspected. Neither context had an owner login or a protection bypass.
- No JavaScript errors or failed game assets were reported. Only disposable test browser storage was changed; existing player saves were not touched.
- Saves remain tied to the exact address. Export/Import is needed to transfer an existing robot between the original Sites URL and Vercel.

## Restart fix verification: 15 September 2026

- 70 deterministic tests passed, including complete deletion of game keys, preserving preferences/unrelated data, and restoring removed entries when a later deletion fails.
- 24 targeted browser checks passed: six restart flows across desktop Chrome, mobile Chrome emulation, Firefox and iPhone WebKit emulation. These cover cancellation, clearing progress/backup/album, renaming/restyling, refresh and demo-return persistence, keeping collections when raising another robot, corrupt saves, failed deletion, demo isolation and cross-tab ownership/synchronization.
- TypeScript compilation and the production build passed. The original 104 browser checks below describe the v2 release run, not a repeated full-suite run for this fix.

## Automated checks completed for the original v2 release

- **68 deterministic engine/save/arcade tests passed.** Exact decay, grace periods, rust and heat boundaries, action eligibility/cooldowns, care rewards, route ties, stages, death/recovery/wear, minigame resolution, corruption/backup, migration and memorial retention.
- Three complete six-day schedules with morning/evening care reach Companion, Guardian and Overlord at the intended age, with no wear or deaths. These use an injected clock; they are not a real multi-day human playtest.
- **104 browser tests passed:** 26 flows in each of desktop Chrome for Testing 148, mobile Chrome emulation at 360×800, Firefox 155, and WebKit 26.6 with iPhone 13 emulation.
- Browser flows cover naming, care/reload, keyboard lessons/arcade, reserved arcade costs on refresh, pause/hidden resume and replay, all demo outcomes, normal-save isolation, neglect preview, offline death and one memorial, recovery, tab takeover, fallback tab protection, corrupt-primary recovery, disabled storage, valid/cancelled/invalid imports, reduced motion and returning dialog focus. New flows cover pre-boot customization, restyling and frozen memories, no-cost activities, extra-lesson recall, records, cosmetic unlocks, six local room assets, full album export/import/delete and demo isolation.
- Responsive overflow checks pass at desktop, 360px portrait, 720×360 landscape and 200% root text size. Desktop, mobile and adult-outcome screenshots were inspected.
- TypeScript compilation, Vite production build and oxlint pass with no warnings.
- V1 dependency verification, unchanged dependencies in v2: a clean `npm ci --offline --ignore-scripts` from the lockfile succeeds in an isolated directory.
- The 14 September dependency audit reported zero known vulnerabilities; v2 adds no dependencies.

Browser emulation is not physical-device testing. These results do not claim testing on an actual Android phone or iPhone, nor the installed Safari app.

## Original public release check (v1: 14 September)

- Host: ChatGPT Sites (the original v1 release; the Vercel build is the current home).
- A fresh browser context with no owner login received HTTP 200 and completed boot, charge and reload. The custom robot name persisted, battery feedback worked, no JavaScript errors occurred and no game assets failed to load.
- The host injects background requests; readiness was checked using DOM content and actual controls, rather than network-idle.

## Remaining human validation

- A genuine three-day care run, with morning/evening visits and normal sleep, is still required to judge pacing and attachment. Automated clock tests cannot establish how that feels.
- Physical Android Chrome / iOS Safari checks, a screen-reader pass, and a 3–5-person playtest remain to be done.

## Intended limits

- Saves are local to the browser and origin. No accounts, cloud sync or closed-app notifications. Export before clearing site data or moving to another origin/device.
- Device clock changes and hand-edited/imported saves are trusted; permanent death applies to supported play, not tamper-proof enforcement.
- Primary save plus a validated backup protect ordinary interruptions. Storage exceptions preserve in-memory play and show a warning; exporting is the recovery path when storage stays blocked.
- Web Locks provides single-writer ownership in current browsers. The fallback conservatively stops competing tabs and requires closing other tabs and taking over/reloading; it deliberately provides no concurrent editing.
- V2 album retains 80 moments and 50 memorials; automatic stage IDs are retained separately to avoid regenerating evicted photos. Backup imports are limited to 250 KB; standalone robot saves retain the 100 KB limit.
- Arcade time stops on pause/hidden tabs; the robot’s care clock continues. A cancelled/short round receives no score or reward. Practice rounds do not spend care meters.
- Typography uses Google Fonts with system fallbacks. Artwork, sound, simulation and state require no third-party runtime service.

## Real-run checklist

On the final hosted origin, boot a named test robot, export its save and note the starting time. Visit morning/evening for at least 72 hours. Record battery/rust on return, time spent caring, lessons, and the final form. Test on physical devices before the competition submission. This checklist is pending, not evidence of completion.
