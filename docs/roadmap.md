# Roadmap

This document tracks the next planned version themes and the current quality posture of the repository.

## Current State

Latest tagged release: `v0.6.0`

Current emphasis:

- keep `main` releaseable
- keep the mobile observatory release stable while the next pass makes handheld controls and affordances feel more native
- protect the emergent feel with regression checks and small, testable changes

## Quality Notes

Bug sweep status as of 2026-03-24:

- `node --check game.js` passes
- `index.html` and `seed-audit.html` both return `200` over the local server
- scripted browser interactions on the main app completed without console errors, page errors, or failed requests
- the seed audit completed successfully and returned stable aggregate metrics
- a Playwright-backed seed-audit threshold check now exists for local and CI use
- a Playwright-backed replay stress check now exists for local and CI use, covering bookmarks, scrubber motion, rewind buttons, branch resumes, and live return
- the latest release now includes fish-subject follow flow, watch surfaces, and replay-preserved selection behavior that should remain under browser regression checks

Residual risks to keep an eye on:

- screenshot and layout regressions still depend on visual QA more than automated image baselines
- the seed-audit thresholds are intentionally conservative and should be revisited as ecology tuning evolves
- seed balance varies meaningfully by habitat layout, so future ecology changes should keep using deterministic seed checks
- handheld controls are still text-heavy and can feel more like a drawer than a native observatory console
- mobile fullscreen still needs another polish pass around icons, condensed affordances, and breakpoint-specific framing
- desktop fullscreen remains deferred until it has a cleaner UX and stronger breakpoint coverage

## Planned Version Targets

## v0.1.x

Theme: polish, verification, and docs discipline.

Likely work:

- small UI cleanups and bug sweeps
- stronger screenshot and regression baselines
- better documentation around seed audit and observability tools

## v0.2.0

Theme: scenario lab and replay.

Delivered in the latest tagged release:

- named experiment scenarios
- saved seed plus preset bundles
- bookmarks and short replay for recent tank history
- faster compare-and-observe workflow through scenario resets and live-return playback

Follow-on notes:

- review screenshots for a future demo or release gallery refresh
- keep replay and scenario UX under regression coverage as `v0.3.0` work lands

## v0.3.0

Theme: watchability and attachment.

Delivered in the latest tagged release:

- stronger fish identity and persistent subject handling
- fish-centric history such as lifespan, generation, and notable events
- better event surfacing around the selected fish or highlighted lineage
- clearer "watch this one" UX through the inspector, event feed, and in-tank subject card without introducing scripted outcomes

Follow-on notes:

- keep the main tank camera stable while future follow affordances stay subordinate to the subject card and inspector
- prefer fish identity, watch surfaces, and attachment loops over adding scripted drama
- extend replay/browser checks as fish-subject UX gets deeper so the inspector does not regress back into generic state

## v0.4.0

Theme: ambient observatory polish.

Delivered in the latest tagged release:

- optional ambient playback for `Glass Shelter`
- compact tank-side music controls with toggle and volume
- browser-safe MIDI rendering with warm caching for faster starts
- music behavior tied to simulation pause and resume

Follow-on notes:

- keep music opt-in and visually subordinate to the tank
- prefer background prewarm and cache improvements over autoplay workarounds

## v0.5.0

Theme: ambient observatory expansion.

Delivered in the latest tagged release:

- rotating ambient playback across `Glass Shelter`, `Moon Plankton`, `Seed Rain`, and `Stonewake Drift`
- compact transport controls beside the main tank actions
- keyboard transport shortcuts for quick observation flow without drawer clutter
- preserved ChatGPT attribution in the ambient note while tracks rotate

Follow-on notes:

- keep music opt-in and visually subordinate to the tank
- treat future audio changes as observatory polish, not a replacement for simulation depth

## v0.6.0

Theme: mobile observatory and tank-first handheld UX.

Delivered in the latest tagged release:

- tank-first handheld layout in both portrait and fullscreen modes
- portrait-safe tank sizing and fullscreen framing that preserve the aquarium aspect ratio
- touch-friendlier fish selection on smaller screens
- handheld-specific fullscreen controls flow where the tank remains visible and the generic pause slab stays out of the way
- VGA in-tank HUD and event console so mobile observability stays inside the aquarium instead of relying on the full desktop header
- compact mobile title strip and a reduced lower event stack so the inspector stays closer to the tank on phones

Follow-on notes:

- keep the tank centered and maximized within aspect-ratio limits across more mobile breakpoints
- preserve button-driven control flow in fullscreen so accidental taps do not interrupt the run
- treat the in-tank event console as supporting telemetry, not a replacement for the lower event history
- keep desktop fullscreen out of release scope until it is intentionally designed and tested instead of piggybacking on the handheld mode

## v0.7.0

Theme: mobile-native controls and observatory iconography.

Target features:

- replace some of the current handheld text labels with tighter VGA-style icons and more mobile-native control affordances
- simplify the fullscreen control sheet so it feels more like an observatory console than a repurposed desktop drawer
- use Asset Forge for a small icon pass where that improves legibility without cluttering the tank
- tighten spacing and affordances for music, pause, controls, and fullscreen actions on handheld
- capture a deliberate screenshot set across phone breakpoints after the control/icon pass lands
- decide later whether desktop fullscreen should exist at all, and only reintroduce it with dedicated desktop testing

Release posture:

- mobile should feel intentional without degrading the desktop observatory
- icons should support quick recognition, not replace every label blindly
- the tank remains the main event; controls stay subordinate and touch-friendly

## v0.8.0

Theme: stronger spatial ecology.

Target features:

- territory or shelter ownership
- nursery behavior around formations and wake zones
- stronger patrol, refuge, and ambush structure

## v0.9.0

Theme: experiment hardening.

Target features:

- more formal regression harness around deterministic seeds
- stronger audit summaries and comparison outputs
- optional demo or public-facing observatory polish

## Backlog Notes

Good candidates that are useful but not yet pinned to a release:

- lightweight replay export or demo capture
- GitHub Pages or other public homepage
- richer README screenshot set after another visual polish pass
- optional naming and fish-personality surfaces only if they support observability rather than turning the sim into a game
- optional fullscreen or “best in landscape” affordances, but only if they stay advisory rather than mandatory
