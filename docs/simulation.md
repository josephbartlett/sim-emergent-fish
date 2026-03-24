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
- the same seed should reproduce the same layout and general behavior on the same code revision

## Seed Audit

Use the local audit page for quick regression checks:

```bash
python3 -m http.server 8000
```

Open:

- `http://localhost:8000/seed-audit.html`

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
