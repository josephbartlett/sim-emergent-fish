# AGENTS.md

This repository is a browser-local emergent fish simulation. Agents working here are expected to keep the project releaseable, documented, and cleanly versioned from the start.

## Project Snapshot

- Name: `Fishtank Ecology (VGA)`
- Current version: `v0.1.2`
- License: MIT, copyright Joey Bartlett
- Stack: static HTML, CSS, JavaScript, and tracked PNG assets
- Primary entrypoints:
  - `index.html`
  - `game.js`
  - `style.css`
  - `seed-audit.html`

## Run And Verify

Use these commands for a minimal local verification pass:

```bash
node --check game.js
python3 -m http.server 8000
curl -I http://127.0.0.1:8000/index.html
curl -I http://127.0.0.1:8000/seed-audit.html
```

For UI work, capture current screenshots after changes.

## Repository Workflow

- Default release branch: `main`
- Long-running feature branches should use prefixes such as `feat/*`, `fix/*`, `docs/*`, `chore/*`, and `release/*`.
- Keep commits atomic and use Conventional Commits.
- Do not mix unrelated docs, simulation tuning, and asset-generation changes in a single commit unless they are tightly coupled.
- Do not push, tag, or create releases unless the user explicitly asks for it.
- Do not rewrite published history. Preserve historical branches such as `sim-emergent-fish`, and keep `main` as the clean release branch.

## PR Hygiene

- PRs target `main`.
- PR titles should match the intended squash commit format.
- PRs must include:
  - a concise summary
  - verification steps and results
  - screenshots for visible UI changes
  - release impact notes if user-facing behavior changed
- Prefer squash merges into `main` to keep release history linear.

## Semantic Versioning

This repo uses SemVer and annotated git tags in the form `vX.Y.Z`.

- `MAJOR`: breaking workflow or compatibility changes, including saved/scenario format changes or incompatible release-process changes
- `MINOR`: new backward-compatible simulation features, observability tooling, and UX improvements
- `PATCH`: backward-compatible fixes, tuning, docs corrections, and hygiene updates

Every release must keep these files aligned:

- `VERSION`
- `CHANGELOG.md`
- `README.md` when the public workflow or release policy changes

## Release Workflow

Follow [RELEASING.md](./RELEASING.md) for the full checklist. The minimum expectations are:

1. Verify the worktree is clean and `main` contains the intended release state.
2. Run the local verification commands.
3. Update `VERSION` and `CHANGELOG.md`.
4. Create an annotated tag: `vX.Y.Z`.
5. Push `main` and the tag only when explicitly instructed.

When a release is tagged and pushed, always return the exact release metadata in the response:

- `Title/Name`: `Fishtank Ecology vX.Y.Z`
- `Description`: markdown release notes for that version

Use this minimum release note structure:

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
