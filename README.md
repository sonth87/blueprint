# Blueprint Models

A gallery of 40 interactive 3D "blueprint" models (devices, machines, vehicles) drawn as line art by one shared
three.js engine: they turn, come apart, have labelled callouts and a "how it works" tour.

## Layout

- `engine/` the shared engine: `engine.js`, `realistic.js` (shaded and photo styles), `screen-runtime.js` (animated screens), `ui.js` (the controls round every model page: back button, model picker, render style, theme carried between models)
- `kit/` the procedural-geometry helpers the model builders use
- `templates/` page templates (`page.html`), `page.js` (puts a page together), `gallery.html` (the home grid and viewer shell)
- `models/index.json` model ids in gallery order
- `models/<id>/meta.json` label, category, tags, theme key and the page's text (`title`, `sceneLabel`, `hotspotsLabel`, `mark`, `dwg`, and `screenHint` for models with an animated screen); `model.js` the behaviour, `geometry.js` the generated geometry, `build.js` (some models) the script that generates `geometry.js`
- `tools/` `build.js` (the build), `build-geometry.js`, `thumb_one.js`, `thumbs.js`, `capture.js`, `build_package.js`
- `thumbs/<id>.webp` the home grid's pictures; `docs/` the embed docs page; `packages/blueprintspace/` the npm package

## Build

    npm run build         # dist/ and index.html
    npm run build:dist    # dist/ only (what Vercel runs)
    npm run build:local   # index.html only

`index.html` is one self-contained file: open it straight from disk. `dist/` is the same gallery split up: a shared
`engine.js` and `ui.js`, a `manifest.js` (the list of models for each page's picker), and per model a small page `m/<id>.html` plus `m/<id>.geometry.js` and `m/<id>.model.js`, fetched only when
the model is opened. Node 18+, no dependencies. The build checks every input first and writes nothing if one is missing.

## Add or edit a model

1. Edit `models/<id>/model.js` (or `meta.json`); for models with a `build.js`, regenerate the geometry first: `node models/<id>/build.js`.
2. For a new model, add its id to `models/index.json` and make `meta.json` (copy a neighbour) and a thumbnail.
3. `npm run build`, then open `index.html` (or `dist/m/<id>.html`).

## Deploy

Vercel reads `vercel.json`: it runs `node tools/build.js --dist` and serves `dist/`, which is gitignored.

## Thumbnails and checks

Needs `playwright-core` (not a dependency of this repo; point `NODE_PATH` at a copy) and Chrome (`CHROMIUM=path`).

    npm run build:dist
    NODE_PATH=... npm run thumb -- dist/m/<id>.html out.webp --key <theme key>   # one grid thumbnail
    NODE_PATH=... npm run capture -- dist/m/<id>.html out/                        # assembled / apart screenshots, page errors

Note: the grid's CSS-mask thumbnails don't load over `file://` in Chrome; use the deployed or an http-served `dist/` to see them.

## npm package

`node tools/build_package.js` rebuilds `packages/blueprintspace/` (full model pages, thumbnails, the `<blueprint-model>` component).
