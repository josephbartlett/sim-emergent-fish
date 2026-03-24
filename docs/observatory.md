# Observatory Guide

This document covers how to run the tank, read the UI, and interpret the simulation in real time.

## Main Controls

- `P`, `Space`, `Esc`, or tap the tank: pause or resume
- `R` or `Enter`: advance to the next deterministic seed
- `T`: open or close the control drawer
- `C`: toggle focus mode
- `B`: bookmark the current live moment
- `L`: highlight the lineage of the currently selected fish
- `X`, `Backspace`, or `Delete`: clear selection and lineage highlight
- click a fish: pin it in the inspector instead of pausing

## Scenario Lab

The control drawer now includes named experiment bundles.

- `Baseline Drift`: the default comparison tank
- `Nursery Pressure`: more juveniles, tighter food, and stronger shelter use
- `Predator Bloom`: richer water with more carnivore pressure
- `Lean Recovery`: a post-crash recovery setup with fewer starting fish
- `Murky Shock`: a visibility-constrained run that starts under murk pressure

Choosing a scenario resets the run onto that seed and tuning bundle immediately, then closes the drawer so the tank is readable again.

## Replay And Bookmarks

The tank panel exposes the active replay controls, while the history card keeps saved bookmark chips and the event timeline.

- `Bookmark [B]`: pin the current live state into the bookmark strip
- `Rewind 15s` / `Rewind 30s`: pause into a recent snapshot from the rolling buffer
- replay scrubber: drag across the buffered history to move between recent snapshots and the live edge
- `Return Live`: resume the saved live branch that existed before the rewind
- bookmark chips: jump directly back to a saved moment

Replay snapshots use a compact replay badge in the tank instead of the full pause slab. `Resume Snapshot [P]` continues from the currently loaded snapshot as a new branch, while `Return Live` restores the saved live branch and resumes the tank.

When you continue from a replayed snapshot or jump back to the saved live branch, the replay buffer rebases to that branch. The scrub range and rewind buttons will grow back as fresh history accumulates.

## Observation Surfaces

### Top Observatory Cards

The top row gives the broad run state:

- population
- resources
- average energy
- turnover

These are the fast summary view for the whole tank.

### Tank Observation Strip

The strip above the canvas carries:

- current seed and run mode
- the active scenario label
- the short watch note for the current phase or disturbance

### In-Tank HUD

The canvas HUD shows:

- total fish
- food count
- average energy
- juvenile/adult split
- herbivore/carnivore-leaning split

The in-canvas hint panel calls out disruptions such as current reversals, collapses, or early-run orientation notes.

### Inspector

Selecting a fish exposes:

- archetype
- life stage
- energy
- hunger
- satiation
- lineage
- generation
- current intent

The selected fish keeps a white ring. If it has a live target, a line can point to that target.

### Lineage Highlight

Lineage highlight is separate from selection.

- selected fish: white ring and optional target line
- highlighted lineage: matching fish stay bright and carry tint markers while unrelated fish dim

## View Toggles

- `Trails`: short lineage-colored movement trails
- `Food Map`: nutrient and plankton density overlay
- `Current`: flow arrows plus shelter pockets and wake structure

## Focus Mode

`Focus [C]` hides the surrounding shell so the tank can dominate the screen while still preserving the essential tank controls.

## What To Watch

In the first 30 to 60 seconds, expect:

- fish sorting into food-rich lanes
- juveniles favoring shelter and calmer wake zones
- schools stretching or stacking behind formations
- predators creating localized disruption waves
- food hotspots shifting with plankton and detritus feedback
- occasional route changes during disturbances

## Good Seeds For Review

The simulation is deterministic by seed. A few seeds that have produced readable layouts and behavior during local QA:

- `240311`
- `241288`
- `243242`
- `246173` for predator-heavy runs
