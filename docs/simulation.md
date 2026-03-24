# Simulation Guide

This document describes the ecological model, tunable controls, and seed-audit workflow.

## Core Model

The tank is driven by simple local rules rather than scripted scenes.

Fish can:

- seek nearby food when hunger pressure is high
- follow plankton-rich areas or remembered productive patches
- avoid nearby larger threats
- loosely school or align when pressure allows it
- use shelter wakes and formation lee zones
- opportunistically hunt smaller prey
- reproduce when energy thresholds are met

The ecology also includes:

- deterministic seeded layouts
- current bands and calmer shelter pockets
- juvenile and adult stages
- detritus -> plankton -> food feedback
- predator satiation and hunt cooldowns
- rare disturbances such as current reversal, murk, oxygen stress, and food crash

## Runtime Controls

The control drawer exposes four live multipliers:

- `Food Flow`: adjusts spawn pressure and food caps
- `Metabolism`: adjusts energy drain
- `Fertility`: adjusts how easily surplus energy becomes offspring
- `Season Pace`: adjusts bloom and lean cycle speed

Presets:

- `Scarce`
- `Balanced`
- `Bloom`
- `Volatile`

## Scenario Bundles

The scenario lab layers named starting conditions on top of the base tuning system.

- `Baseline Drift`: comparison baseline with the standard lineup
- `Nursery Pressure`: more juveniles and shelter-biased pressure
- `Predator Bloom`: carnivore-heavy opening population and richer bloom lanes
- `Lean Recovery`: reduced starting population with recovery plumes after a crash
- `Murky Shock`: seeded murk disturbance and compressed visibility from the first seconds

Scenarios change:

- the starting seed
- live tuning multipliers
- opening population mix and juvenile ratio
- seeded nutrient patches or disturbances

## Important Internal Parameters

The baseline values live in the `SIM` object near the top of [`game.js`](../game.js).

Useful groups include:

- food and reproduction thresholds
- current strength and current resistance drain
- juvenile maturity timing and growth
- detritus and plankton caps
- predator cooldown and satiation decay
- disturbance cadence and duration
- trail sampling

## Seeds

The run is deterministic by seed.

- `Next Seed` advances through the built-in deterministic sequence
- the seed input can load a specific value directly
- scenario buttons can replace the seed and starting conditions as a named bundle
- the same seed should reproduce the same layout and general behavior on the same code revision

## Seed Audit

Use the local audit page for quick regression checks:

```bash
python3 -m http.server 8000
```

Open:

- `http://localhost:8000/seed-audit.html`

The audit page runs automatically on load and prints a JSON summary once the seed sweep completes.

The audit page is useful for checking:

- collapse rate
- food approach and drift behavior
- births and deaths
- broad appetite and turnover regressions

## Tuning Guidance

Prefer small changes over large rewrites.

- use environmental pressure and geometry before adding complex decision trees
- avoid scripted behavior designed for a single cinematic outcome
- if a behavior becomes legible only through hard-coded choreography, it is probably the wrong fit for this project
