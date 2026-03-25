# Roadmap

This document tracks the next planned version themes and the current quality posture of the repository.

## Current State

Latest tagged release: `v0.4.0`

Current emphasis:

- keep `main` releaseable
- ship a lighter ambient-observatory release as `v0.4.0` without disturbing the simulation loop
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

Delivered in this release candidate:

- optional ambient playback for `Glass Shelter`
- compact tank-side music controls with toggle and volume
- browser-safe MIDI rendering with warm caching for faster starts
- music behavior tied to simulation pause and resume

Follow-on notes:

- keep music opt-in and visually subordinate to the tank
- prefer background prewarm and cache improvements over autoplay workarounds

## v0.5.0

Theme: stronger spatial ecology.

Target features:

- territory or shelter ownership
- nursery behavior around formations and wake zones
- stronger patrol, refuge, and ambush structure

## v0.6.0

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
