# Fishtank Ecology (VGA)

Current version: `v0.1.3`

Fishtank Ecology is a browser-local emergent behavior observatory. It runs a bounded aquarium simulation with autonomous fish, deterministic seeds, habitat formations, current fields, resource pressure, and inspection tools for watching local rules turn into visible patterns.

## Quick Start

```bash
python3 -m http.server 8000
```

Open:

- `http://localhost:8000`
- `http://localhost:8000/seed-audit.html`

Minimal sanity checks:

```bash
node --check game.js
curl -I http://127.0.0.1:8000/index.html
curl -I http://127.0.0.1:8000/seed-audit.html
```

## What It Includes

- autonomous grazers, shoalers, opportunists, and hunters with local sensing and simple intent rules
- deterministic seeded tanks with bottom-mounted formations, wake zones, and current variation
- juvenile and adult life stages, food competition, predation, reproduction, and disturbances
- observatory UI with focus mode, fish inspector, lineage highlighting, event timeline, scenario lab controls, replay bookmarks, and seed audit tools
- Asset Forge-backed fish and habitat art with fallback rendering in `game.js`

## Docs Map

Simulation and usage docs:

- [docs/observatory.md](./docs/observatory.md): controls, overlays, inspector behavior, and what to watch
- [docs/simulation.md](./docs/simulation.md): ecology model, seeds, runtime parameters, and audit workflow
- [docs/assets.md](./docs/assets.md): Asset Forge sceneplans, generated assets, and fallback behavior
- [docs/roadmap.md](./docs/roadmap.md): planned version milestones, current quality notes, and next major feature tracks

Repository and release docs:

- [CONTRIBUTING.md](./CONTRIBUTING.md): branch, commit, PR, and verification expectations
- [RELEASING.md](./RELEASING.md): SemVer policy, tagging flow, and release metadata contract
- [AGENTS.md](./AGENTS.md): agent operating rules and release-response requirements
- [CHANGELOG.md](./CHANGELOG.md): release history
- [LICENSE](./LICENSE): MIT license
- [VERSION](./VERSION): current SemVer value

## Screenshots

![Tank overview](./docs/screenshots/readme-tank-overview.png)

Current README hero shot: bottom-mounted formations, mixed archetypes, and a mid-run tank state without the surrounding UI chrome.

The tracked README image lives under [`docs/screenshots`](./docs/screenshots).

## Versioning

This repository uses [Semantic Versioning](https://semver.org/) with annotated tags in the form `vX.Y.Z`.

- `MAJOR`: incompatible workflow, release-contract, or format changes
- `MINOR`: backward-compatible features and observability additions
- `PATCH`: backward-compatible fixes, tuning, and docs/hygiene updates

When a release is tagged and pushed, always return:

- `Title/Name`: `Fishtank Ecology vX.Y.Z`
- `Description`: markdown release notes matching the tag

The full checklist lives in [RELEASING.md](./RELEASING.md).
