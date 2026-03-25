# Releasing

This repository uses Semantic Versioning with annotated tags in the form `vX.Y.Z`.

Current baseline: `v0.3.1`

## Version Rules

- `MAJOR`: incompatible changes to repo workflow, release contracts, saved/scenario formats, controls, or exported audit formats
- `MINOR`: backward-compatible features, new simulation behaviors, new experiment tools, and observability/UI additions
- `PATCH`: backward-compatible fixes, tuning corrections, docs corrections, and hygiene-only updates

## Release Checklist

1. Start from a clean `main` branch.
2. Confirm CI is green.
3. Run the local sanity checks:

   ```bash
   node --check game.js
   python3 -m http.server 8000
   curl -I http://127.0.0.1:8000/index.html
   curl -I http://127.0.0.1:8000/seed-audit.html
   python3 scripts/check_seed_audit.py
   python3 scripts/check_replay_stress.py
   ```

4. Update:
   - `VERSION`
   - `CHANGELOG.md`
   - `README.md` if public workflows changed
5. Create an annotated tag:

   ```bash
   git tag -a vX.Y.Z -m "Fishtank Ecology vX.Y.Z"
   ```

6. Push only when explicitly instructed:

   ```bash
   git push origin main
   git push origin vX.Y.Z
   ```

## Required Release Metadata

Whenever a release is tagged and pushed, always return the following in the response:

- `Title/Name`: `Fishtank Ecology vX.Y.Z`
- `Description`: markdown release notes

Use this template:

```md
## Summary
- ...

## Highlights
- ...

## Verification
- ...

## Notes
- ...
```

The release Title/Name and Description returned to the user should match the tag and the GitHub release notes.
