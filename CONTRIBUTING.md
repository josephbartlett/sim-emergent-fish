# Contributing

Thanks for contributing to `Fishtank Ecology (VGA)`.

## Scope

This repository is a browser-local emergent behavior simulation. Changes should preserve:

- the simulation-first framing
- the bounded tank presentation
- the lightweight static web stack
- the SemVer and release hygiene rules in [AGENTS.md](./AGENTS.md) and [RELEASING.md](./RELEASING.md)

## Branching

- Base branch: `main`
- Use short-lived topic branches:
  - `feat/<name>`
  - `fix/<name>`
  - `docs/<name>`
  - `chore/<name>`
  - `release/<version>`

## Commit Hygiene

Use Conventional Commits:

- `feat:`
- `fix:`
- `docs:`
- `style:`
- `refactor:`
- `test:`
- `chore:`

Guidelines:

- one logical change per commit
- imperative subject line
- keep subjects concise
- include docs updates when public behavior changes
- do not amend or rewrite published history

## Local Verification

Before opening a PR:

```bash
node --check game.js
python3 -m http.server 8000
curl -I http://127.0.0.1:8000/index.html
curl -I http://127.0.0.1:8000/seed-audit.html
```

For UI changes, also include:

- refreshed screenshots or clips
- seed(s) used for validation
- any known behavior tradeoffs or deferred tuning

## Pull Requests

PRs should:

- target `main`
- stay focused on one coherent goal
- include a concise summary
- list verification steps
- attach screenshots for visible UI changes
- include release impact notes when behavior or workflow changed

Use the repository PR template and prefer squash merge semantics.

## Versioning

This repository uses Semantic Versioning.

- `MAJOR`: breaking compatibility or release-process changes
- `MINOR`: new backward-compatible capabilities
- `PATCH`: backward-compatible fixes and polish

If your PR changes the public behavior, release workflow, or repository policy, update the relevant docs and note the intended version impact.

## Releases

Release procedure and the required release Title/Name plus Description template live in [RELEASING.md](./RELEASING.md).
