# Deployment

Fishtank Ecology is a static site. It does not require a backend, database, or build-time framework.

## What Gets Deployed

Only these files are needed for a hosted build:

- `index.html`
- `seed-audit.html`
- `seed-audit.css`
- `seed-audit.js`
- `style.css`
- `game.js`
- `generated/`

The deployment artifact intentionally excludes repository governance files and docs.

## Local Build

Build the deployable static artifact with:

```bash
bash scripts/build_static_site.sh
```

By default this writes to `dist/site`.

To smoke test the artifact locally:

```bash
python3 -m http.server 8010 --directory dist/site
curl -I http://127.0.0.1:8010/index.html
curl -I http://127.0.0.1:8010/seed-audit.html
FISHTANK_BASE_URL=http://127.0.0.1:8010 python3 scripts/check_seed_audit.py
FISHTANK_BASE_URL=http://127.0.0.1:8010 python3 scripts/check_replay_stress.py
```

## Security Hardening

The static app now carries a conservative browser-side policy surface:

- Content Security Policy via `<meta http-equiv="Content-Security-Policy">`
- `Referrer-Policy: no-referrer` via meta
- a sandboxed same-origin audit iframe in `seed-audit.html`
- a deploy-time `_headers` file for hosts that honor static response headers

The `_headers` file currently sets:

- `Content-Security-Policy`
- `Referrer-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Permissions-Policy`

## GitHub Pages

This repo includes [.github/workflows/pages.yml](../.github/workflows/pages.yml), which builds `dist/site` and deploys only that artifact to GitHub Pages.

That means the hosted site publishes the application, not the full repository tree.

## Host Notes

- GitHub Pages ignores `_headers`, so the meta CSP and referrer policy still matter there.
- Netlify and some other static hosts can use `_headers` directly.
- The app should be served over `http://` or `https://`, not opened from `file://`.
- `seed-audit.html` depends on same-origin iframe access to `index.html`.
