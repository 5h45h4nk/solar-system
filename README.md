# Solar System Explorer

An interactive solar system visualization that runs fully offline in the browser.

## Run

From this folder:

```bash
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

## Features

- Overview start showing Sun + all 8 planets
- Planet search (`Mercury` to `Neptune`) with fly-to camera
- Dynamic orbits, spins, zoom, and drag navigation
- Local real-texture support from `assets/textures/`
- Fallback rendering if any texture file is missing

## Add Real Planet Textures

Place textures in:

`/Users/shashanksrinivas/Documents/Codex/solar-system/assets/textures`

Use these exact filenames:

- `sun.jpg`
- `mercury.jpg`
- `venus.jpg`
- `earth.jpg`
- `mars.jpg`
- `jupiter.jpg`
- `saturn.jpg`
- `uranus.jpg`
- `neptune.jpg`

Recommended maps are equirectangular (`2:1`) at `1024x512` or higher.

## Get GitHub Pages URL

After your first push/deploy, print the live Pages URL with:

```bash
npm run pages:url
```

If Pages is still provisioning, wait for the GitHub Actions deployment to finish and run it again.
