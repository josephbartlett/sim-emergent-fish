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

## Handheld And Fullscreen

Handheld layouts now prioritize the tank over the dashboard.

- portrait handheld keeps a compact title strip above the tank instead of the full desktop observatory header
- non-fullscreen handheld keeps the lower panels, but caps the visible recent-event list so the inspector stays closer to the aquarium
- `Fullscreen [F]` is currently a handheld-only control and enters the mobile observatory view when the browser/device allows it
- in handheld fullscreen, empty taps on the tank no longer pause the simulation; use the buttons instead
- in handheld fullscreen, `Pause [P]` and `Controls [T]` both open the touch-first control sheet instead of the generic pause slab
- `Back to Tank` closes that sheet and returns you to the aquarium
- mobile observability is pushed into the tank itself through the VGA HUD and in-tank event text rather than the full desktop card stack

Desktop fullscreen is intentionally deferred for now. Focus mode remains the desktop-first way to let the tank dominate the screen until the desktop fullscreen path is better tested.

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

The pinned fish and lineage highlight stay tied to your current subject while you scrub. If that fish is not present in the loaded moment, the inspector keeps the pin and tells you the fish is off-snapshot instead of silently swapping you to an older historical selection.

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
- the ambient music pill for the rotating ambient pack

### Ambient Audio

Ambient music is optional and starts only when you use its own toggle.

- use the `Music` toggle in the tank observation strip to start or stop the ambient pack
- use the `Music [M]`, `Prev [,]`, and `Next [.]` buttons beside the tank actions when you want quick transport controls without opening the ambient pill
- use the volume slider beside it to trim the level without opening the control drawer
- once running, the music cycles through the bundled cues automatically instead of exposing track selection controls
- when the tank pauses, the ambient track pauses with it and resumes when the run resumes
- the bundled sources live under `audio/`
- the compositions are attributed to ChatGPT

### In-Tank HUD

The canvas HUD shows:

- total fish
- food count
- average energy
- juvenile/adult split
- herbivore/carnivore-leaning split

The in-canvas hint panel calls out disruptions such as current reversals, collapses, or early-run orientation notes.

On handheld and fullscreen views, the HUD also carries the seed, scenario, turnover, and phase information that would otherwise live in the desktop shell.

### In-Tank Event Console

The tank now mirrors recent events directly inside the aquarium.

- on desktop it works as a lightweight companion to the lower timeline
- on handheld it becomes the primary glanceable event surface
- the text uses the VGA tank style and fades line-by-line instead of introducing another boxed overlay

### In-Tank Subject Card

Selecting a fish now adds a subject card inside the tank itself.

- the card stays anchored near the fish instead of pushing attention into a side panel
- it shows the watch name, archetype, status, energy or replay state, and lineage context
- clicking the same fish again tucks the card away while keeping the fish pinned in the inspector
- clicking that fish again restores the card without losing the subject

### Inspector

Selecting a fish exposes:

- a watch name for the current subject
- archetype
- life stage
- energy
- hunger
- satiation
- lineage
- generation
- current intent
- story counters such as age, meals, hunts, and offspring
- a filtered watch feed for the fish and its lineage

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
