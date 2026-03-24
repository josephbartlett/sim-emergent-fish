# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this repository follows Semantic Versioning.

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
