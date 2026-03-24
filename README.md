# Fishtank Ecology (VGA)

Current version: `v0.1.0`

A bounded `672x392` browser simulation for observing emergent fish behavior under simple local rules, environmental currents, habitat structure, and resource pressure.

The tank is no longer a player-controlled arcade game. Fish now move autonomously, compete for drifting food, avoid larger neighbors, opportunistically consume smaller fish, and split into offspring when they accumulate enough energy. The ecology now includes:

- directional current bands with calmer shelter pockets around plants, rocks, and corners
- larger bottom-anchored aquarium formations such as stone caves, bug castles, boulder ridges, kelp screens, and driftwood snags that create lee wakes and ambush pockets
- deterministic per-seed habitat layouts, so each seed changes not just the population trajectory but also the obstacle pattern and wake geometry
- juvenile and adult life stages with different diet and refuge bias
- a detritus to plankton to food loop that creates local hotspots
- remembered food patches that fish can revisit until they become crowded or dangerous
- predator satiation and hunt cooldowns, so hunting arrives in waves instead of constant contact
- vertical niche preference by archetype
- rare disturbances such as current reversals, murk blooms, oxygen dips, and food crashes
- a larger tank with more shelter beds, extra bloom anchors, and stronger shallow/mid/deep visual zoning

## Repository Docs

- [AGENTS.md](./AGENTS.md): agent operating rules, release metadata contract, and repo workflow
- [CONTRIBUTING.md](./CONTRIBUTING.md): branch, commit, PR, and verification standards
- [RELEASING.md](./RELEASING.md): SemVer policy, tagging flow, and release note template
- [CHANGELOG.md](./CHANGELOG.md): human-readable release history
- [LICENSE](./LICENSE): MIT license
- [VERSION](./VERSION): current SemVer value

## Run

Open `index.html` directly in a browser, or run a small local server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

For a deterministic multi-seed balance sweep, open `http://localhost:8000/seed-audit.html`.

## Verify

Run the minimal local sanity checks before opening a PR or tagging a release:

```bash
node --check game.js
python3 -m http.server 8000
curl -I http://127.0.0.1:8000/index.html
curl -I http://127.0.0.1:8000/seed-audit.html
```

For UI-facing changes, capture fresh screenshots or short clips and include them in the PR description.

## Versioning And Releases

This repository uses [Semantic Versioning](https://semver.org/) with `vX.Y.Z` tags.

- `MAJOR`: breaking changes to repo workflow, public release process, controls, exported audit formats, or saved/scenario compatibility
- `MINOR`: backward-compatible features, UX additions, new observability tools, or new simulation capabilities
- `PATCH`: backward-compatible fixes, tuning corrections, docs corrections, and hygiene-only changes

Every release must update:

- [`VERSION`](./VERSION)
- [`CHANGELOG.md`](./CHANGELOG.md)
- release notes if user-facing behavior or process changed

When a release is tagged and pushed, always return:

- `Title/Name`: `Fishtank Ecology vX.Y.Z`
- `Description`: markdown release notes matching the tagged state

The full release checklist and note template live in [RELEASING.md](./RELEASING.md).

## Contribution Workflow

- Branch from `main` using `feat/*`, `fix/*`, `docs/*`, `chore/*`, or `release/*`.
- Use Conventional Commits such as `feat:`, `fix:`, `docs:`, and `chore:`.
- Keep commits atomic and PRs scoped.
- Use squash merge semantics for PRs into `main`.
- Include verification steps and screenshots for UI changes.
- Update docs and changelog entries when the public behavior or repo process changes.

## Controls

- `P`, `Space`, `Esc`, or tap the tank: pause / resume
- `R` or `Enter`: advance to the next deterministic seed
- `T`: open or close the control drawer
- `C`: toggle focus mode
- `L`: toggle highlight for the selected fish lineage
- `X`, `Backspace`, or `Delete`: clear the current fish selection and lineage highlight
- top action bar: pause, next-seed, control-drawer toggle, focus mode, and explicit seed loading
- control drawer: adjust food flow, metabolism, fertility, and season pace in real time without shrinking the tank
- click a fish in the tank: pin it in the inspector instead of pausing
- preset buttons: jump directly to `Scarce`, `Balanced`, `Bloom`, or `Volatile` regimes
- view toggles:
  - `Trails`: lineage movement trails for the last few seconds
  - `Food Map`: nutrient / plankton density overlay
- `Current`: current arrows plus calmer shelter pockets

## Formation Assets

A starter Asset Forge sceneplan now lives at [`sceneplans/fishtank-formations.sceneplan.json`](./sceneplans/fishtank-formations.sceneplan.json). It is set up for transparent aquarium-formation sprites such as stone caves, bug castles, boulder ridges, kelp screens, and driftwood snags.

A matching fish sprite plan now lives at [`sceneplans/fishtank-fish.sceneplan.json`](./sceneplans/fishtank-fish.sceneplan.json). It generates a consistent `32x32` family for juveniles, grazers, shoalers, opportunists, and hunters.

Dry-plan it from the local Asset Forge checkout with:

```bash
SCENEPLANS=/mnt/c/Users/decoy/Fishtank/sceneplans/fishtank-formations.sceneplan.json npm run assets:plan
```

The repo now includes generated finals under [`generated/asset-forge`](./generated/asset-forge), and `game.js` will use them automatically when they are present. The old inline fish sprites remain as a fallback if the fish assets are missing.

## Simulation Parameters

The ecological baseline still lives in the `SIM` object near the top of [`game.js`](./game.js):

- `initialFish`
- `initialFood`
- `foodCap`
- `foodSpawnMin` / `foodSpawnMax`
- `metabolism`
- `foodEnergy`
- `preyEnergy`
- `reproductionEnergy`
- `seedBase` / `seedStep`
- `seasonRate`
- `immigrationThreshold`
- `reseedDelay`

These values control scarcity, population turnover, and how quickly local behavior turns into visible patterns.

For live experimentation, the UI exposes four runtime multipliers:

- `Food Flow`: food caps and spawn interval pressure
- `Metabolism`: how quickly bodies burn energy
- `Fertility`: how easily energy surplus becomes offspring
- `Season Pace`: how quickly bloom and lean phases rotate

The newer ecology-specific values are also in `SIM`, including:

- `currentStrength`, `currentVerticalStrength`, `currentResistanceDrain`
- `detritusCap`, `planktonCap`, `detritusDecayMin`, `detritusDecayMax`
- `juvenileMaturityMin`, `juvenileMaturityMax`, `juvenileGrowth`
- `memoryDuration`
- `satiationDecay`, `predatorCooldownMin`, `predatorCooldownMax`
- `disturbanceEveryMin`, `disturbanceEveryMax`, `disturbanceDurationMin`, `disturbanceDurationMax`
- `trailPoints`, `trailSampleEvery`

## What To Watch

In the first 30 to 60 seconds you should see:

- hungry fish drifting toward food patches
- blooms and plankton patches slowly shifting food-rich regions across the tank
- visible migration lanes across the larger width of the tank
- different obstacle layouts from seed to seed, with calmer wakes forming in different parts of the tank
- fish stacking into lee wakes behind shelves, weed screens, and driftwood when the current strengthens
- smaller fish clustering loosely until larger bodies disrupt them
- juveniles holding closer to shelter pockets while adults range farther into open water
- local predation when size differences become meaningful
- births when a fish sustains an energy surplus
- detritus sinking into bottom nutrient plumes that later reappear as food blooms
- occasional recovery from low-population states via immigrant fish or reseeding
- temporary route changes during disturbances
- clearer top-lit shallows and darker lower shelter bands

## Notes

- The top observatory cards spell out fish count, food count, average energy, births, deaths, predations, disturbance count, seed, and season state.
- The tank now has its own floating observatory overlay, so population, resources, run state, and current watch-notes stay visible even in focus mode.
- The inspector panel lets you pin a fish and read its archetype, stage, generation, energy, hunger, satiation, lineage, and current intent.
- Highlighting a lineage dims the rest of the tank so one branch is easier to follow across births, predation, and movement trails.
- The in-tank HUD now splits juveniles/adults and herbivore/carnivore-leaning bodies so population structure is readable without opening devtools.
- A rolling trace shows fish, food, and average energy over time for quick visual trend checks.
- A recent-event timeline records births, starvation deaths, predations, disturbances, immigrants, and reseeds.
- The history trace marks the latest fish, food, and energy points so the current state is easier to read at a glance.
- The local `seed-audit.html` page runs a balanced-preset seed sweep and dumps aggregate appetite / turnover stats for quick regression checks.
- Offspring inherit a lineage color, and the trail overlay uses those lineage colors so clusters are easier to track.
- Low-energy fish still show a small orange marker above them.
- Each reset advances to the next deterministic seed in a fixed sequence; you can also load a specific seed from the action bar.
- The population starts as a mix of grazers, shoalers, opportunists, and hunters.
- The habitat art is now more explicit, with deeper weed beds, light shafts, rock shelves, and a stronger separation between shallow, midwater, and lower refuge zones.
- The wider tank now includes bottom-mounted cave and castle formations that deflect current and create calmer wake zones, so schools and juveniles have more legible structure to organize around.
- The habitat generator now prefers a few larger hero formations over a cluttered obstacle field, so wake lanes and shelter pockets stay readable from seed to seed.
- Fish now render from a consistent Asset Forge sprite set instead of mixed inline silhouettes, while lineage accents and selection markers stay visible on top.
- The live-tank status cards now sit in an observation strip above the canvas instead of covering the water column.
- Juveniles now use archetype-aware sprite variants and smaller growth ratios, so young hunters read as small sharks rather than generic fry.
- `Focus [C]` hides the shell so the tank can run almost full-screen while preserving pause, reset, and seed controls.
- The simulation stays bounded inside the original tank framing and keeps the existing VGA-style rendering, sprites, particles, and post-processing.
