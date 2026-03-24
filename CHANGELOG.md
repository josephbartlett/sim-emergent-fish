# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this repository follows Semantic Versioning.

## [Unreleased]

### Added

- a named scenario lab with `Baseline Drift`, `Nursery Pressure`, `Predator Bloom`, `Lean Recovery`, and `Murky Shock`
- replay and bookmark controls for the last 45 seconds of tank history, including rewind and live-return flow
- a replay scrubber in the tank panel for stepping through recent snapshots without relying only on fixed rewind buttons
- a Playwright-backed replay stress check under `scripts/check_replay_stress.py` for bookmarks, scrubber motion, rewind buttons, branch resumes, and live return

### Changed

- observatory docs to explain scenario bundles, replay controls, and review workflow for the upcoming `v0.2.0` minor
- scenario selection in the control drawer so it immediately reseeds the tank into the chosen experiment setup and returns focus to the simulation
- repo verification docs and CI to include the replay stress check alongside the seed audit

### Fixed

- replay return flow so `Return Live` restores the running branch instead of leaving the tank in a stale paused state
- replay presentation so snapshot browsing no longer drops the tank into the full pause slab
- replay branch handling so scrubbing after a resumed snapshot no longer overwrites the original live-return target
- replay selection behavior so scrubbing keeps the user’s current pinned fish and lineage subject instead of restoring older historical selections
- replay test coverage so bookmark restore automation no longer races detached DOM chips during stress runs

## [0.1.3] - 2026-03-24

### Added

- a lightweight Playwright-backed seed-audit threshold check under `scripts/check_seed_audit.py`
- CI coverage for the seed-audit regression check in addition to syntax and HTTP smoke checks

### Fixed

- the tank action row so the seed input and `Load Seed` control wrap as a single unit on laptop-width layouts
- the population history card legend layout by moving the chart key into the header and removing the redundant legend band
- the population history event stream so it fills the remaining card space on desktop and keeps an internal scrollbar once it exceeds that bounded area
- repo verification docs to include the automated seed-audit check

## [0.1.2] - 2026-03-24

### Added

- a tracked roadmap document with planned version milestones and current quality notes

### Fixed

- stale repository workflow guidance that still referenced the pre-first-push state
- simulation docs to clarify that `seed-audit.html` runs automatically on load

## [0.1.1] - 2026-03-24

### Added

- focused documentation under `docs/` for observatory usage, simulation behavior, and asset workflow
- a stable tracked README screenshot asset under `docs/screenshots/readme-tank-overview.png`

### Changed

- the README from a catch-all reference into a lighter project front page with a docs map

### Fixed

- repository docs sprawl by separating user-facing simulation docs from repo governance and release policy

## [0.1.0] - 2026-03-24

### Added

- a bounded autonomous fish ecology with local-rule movement, resource competition, habitat structure, life stages, disturbances, and observability tooling
- larger tanks, seeded habitat generation, bottom-mounted formations, and Asset Forge sprite integration
- fish inspection, lineage highlighting, event timeline, seed audit page, and focus mode
- repository governance files: `AGENTS.md`, `CONTRIBUTING.md`, `RELEASING.md`, PR template, CI workflow, and MIT license

### Changed

- the original arcade-style fish project into a simulation-first observatory
- the repository workflow to use SemVer, Conventional Commits, squash-merge PR hygiene, and release-note requirements

### Fixed

- selection versus lineage highlight clarity
- canvas hint-panel text overflow
- multiple UI readability and fish-rendering issues during the simulation conversion
