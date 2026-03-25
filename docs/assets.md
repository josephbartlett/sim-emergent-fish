# Assets And Sceneplans

This project uses Asset Forge-generated art where available, with code fallbacks in `game.js`.

## Sceneplans

Tracked sceneplans:

- [`sceneplans/fishtank-formations.sceneplan.json`](../sceneplans/fishtank-formations.sceneplan.json)
- [`sceneplans/fishtank-fish.sceneplan.json`](../sceneplans/fishtank-fish.sceneplan.json)

These cover:

- bottom-mounted aquarium formations such as arches, castles, ridges, screens, and snags
- fish families for juveniles, grazers, shoalers, opportunists, and hunters

## Generated Assets

Generated finals live in:

- [`generated/asset-forge`](../generated/asset-forge)

The app loads these PNGs directly when present.

## Audio Assets

Bundled music currently lives in:

- [`audio/glass-shelter.mid`](../audio/glass-shelter.mid)

`Glass Shelter` is shipped as the original MIDI source and rendered in-browser for playback. The composition is attributed to ChatGPT.

## Fallback Behavior

If generated assets are missing, the simulation still runs using built-in rendering fallbacks in [`game.js`](../game.js).

## Asset Forge Workflow

Example dry plan:

```bash
SCENEPLANS=/mnt/c/Users/decoy/Fishtank/sceneplans/fishtank-formations.sceneplan.json npm run assets:plan
```

The exact external Asset Forge environment is not required for normal simulation use. It is only needed when regenerating art.

## Screenshot Assets

README-ready screenshots live in:

- [`docs/screenshots`](./screenshots)
