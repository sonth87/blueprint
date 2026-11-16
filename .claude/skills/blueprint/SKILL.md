---
name: blueprint
description: Add a new interactive 3D blueprint model to this gallery (blueprintspace) — a real device, machine or vehicle generated in code with kit/procedural.js, rendered by the gallery's shared three.js engine as a line drawing that turns, takes apart, has labelled callouts and a "how it works" tour — then add it to models/, build the gallery (dist/ for Vercel and the single-file index.html), check it in headless Chrome and make its home-grid thumbnail. Use whenever the user asks to draw, add, model or make a blueprint of a thing ("vẽ thêm cái Mac Studio", "add a Leica M6", "làm blueprint cái quạt"), to fix how a model looks, or to regenerate thumbnails. Also for turning a figure from somewhere else (an Anatomy figure, a photo, a drawing) into a model of this gallery: rebuild it in code here, never embed the other page.
---

# Blueprint models for this gallery

A model is a folder `models/<id>/`; `tools/build.js` puts every page together from it, the shared engine
(`engine/`, with its controls in `engine/ui.js`) and one page template (`templates/page.html`, via `templates/page.js`). See README.md.

| File | What it holds |
|---|---|
| `models/<id>/build.js` | The geometry in mm, made with `kit/procedural.js`; the `explode` offsets, `hotspots` and `tour`. It ends with `writeGeometry(HERE, geometry)`. |
| `models/<id>/geometry.js` | Written by `build.js` (`node models/<id>/build.js`, or `npm run geometry` for all). Never edit it. Models without a build.js (exported from Blender) keep only this file as data. |
| `models/<id>/model.js` | `window.BLUEPRINT_MODEL`: part descriptions (`detail`), materials for the Shaded/Photo styles, the camera `view`, `occluders`, and `setup(E)` for motion (fans, screens, keys). |
| `models/<id>/meta.json` | The gallery entry and the page's text: `id, label, kind, category, tags, key` (the theme's localStorage key, same as `themeKey` in model.js), `title, sceneLabel, hotspotsLabel, mark, dwg`, `screenHint` (`, <kbd>/</kbd> for the screen`, for a model with an animated screen) and `screenRuntime: true` when model.js uses `BP_screenAnimation`. |
| `models/index.json` | The gallery's order. Add the id next to its category's other models so the picker groups stay together. |
| `thumbs/<id>.webp` | The home grid's picture. The grid shows nothing without it. |

Start from the closest existing model and read its `build.js`, `model.js` and `meta.json` first:

- **Box with a fan** (desktop, console, appliance): `models/macmini/` (smallest, ~19 parts), `steam`, `xbox`, `egpu`.
- **Laptop or anything with a screen and keys**: `framework` (keyboard, screen animation via `engine/screen-runtime.js`), `macbookpro`.
- **Handheld**: `gameboy`, `playdate`, `psp`, `switch`.
- **Round / turned parts, pipes**: `v8`, `hover`, `spaceship`, `raptor` (`revolve`, `tube`, `sweep`).

## Workflow

1. **Size it, say it.** Small (one object, 15–30 parts, about an hour), Medium (30–60 parts, a screen or several moving
   systems), Large (a vehicle or a machine of many assemblies, 60+). For Large, propose a Medium version first.
2. **Truth first.** Collect the real numbers before any geometry: outer dimensions, corner radii, port layout front and
   back, where the vents, buttons and feet are, and what is inside and in what order from bottom to top (teardown
   photos and spec pages). Every callout and tour sentence must be true. If an internal layout is a guess, say so to
   the user at the end.
3. **Parts list, grouped by module.** Write it before the code. A *module* is what moves together when it comes apart
   (`shell`, `board`, `cooling`, `fan`, `psu`, `bottom`…); a *part* is what has its own name, description and material.
   Mark each part `major` (outlines, structure) or `minor` (detail). Every part sits on another one.
4. **Plan the world.** Units are mm, Z up, X across the front, Y towards the back: the front faces −Y, towards the
   default view. Centre the footprint on the origin with the bottom at z = 0. Write the key heights as constants
   (`FOOT`, `PLATE`, `BZ` for the board top…), so the stack is readable and parts meet flush instead of overlapping.
5. **Build the geometry** (API below), then `explode`, `hotspots` and `tour`.
6. **Write `model.js`**: `detail` for every part name (title + one true sentence), `materials` (regex → preset), `view`,
   `occluders` (the big parts that hide others), `setup` for motion.
7. **Write `meta.json`, add the id to `models/index.json`, build:** `node models/<id>/build.js && npm run build`.
   That writes `dist/` (Vercel; gitignored) and the single-file `index.html` at the root (for opening from disk;
   committed). The build checks every input first and writes nothing if something is missing.
8. **Verify like a critic** (below). Fix and rebuild until every check passes.
9. **Thumbnail:** `node tools/thumb_one.js dist/m/<id>.html thumbs/<id>.webp --key <themeKey>`, then look at it next to
   its neighbours on the home grid.

## Geometry API (`kit/procedural.js`)

All 2D shapes are lists of triangles ("regions"); solids take a region and heights.

| Call | Makes |
|---|---|
| `part(name, module, "major"\|"minor", { spool })` | A named part. `spool: "fan"` makes it spin in `setup` via `E.spinners.fan`; draw it centred on the origin and give the module `explode.fan = { offset, base: [x, y, z] }` so it turns about its hub. |
| `rrRegion(cx, cy, hw, hh, r, seg, holes)`, `rect(x0, x1, y0, y1)` | Rounded rectangle (half sizes) with optional rectangular holes; plain rectangle. |
| `polyRegion(pts)`, `fanRegion(pts)`, `stripRegion(left, right)`, `squareRing(cx, cy, half, r)` | Any outline; convex outline; a curved band (fan blade); a square with a round hole (fan frame). |
| `extrude(p, region, z0, z1, { top, bottom, wallIf })` | Push a region up from z0 to z1. |
| `rrBody(p, cx, cy, hw, hh, r, profile, { seg, top, bottom, holes })` | A rounded box whose outline steps in along `profile` = `[[inset, z, hard], …]` bottom to top: fillets and chamfers. `hard: true` rings are drawn as lines. |
| `cyl(p, cx, cy, r, z0, z1, n)`, `revolve(p, cx, cy, [[r, z, hard], …], n, closed)` | Cylinder; a turned profile (domes, collars, rings). |
| `tube(p, pts3d, r, n)`, `sweep(p, pts, profile)` | Round tube along a 3D path (heat pipes, cables); a section swept along a flat path. |
| `loop(p, pts3d)`, `line(p, a, b)` | Lines only, no surface: openings, slots, seams, logos drawn on a face. |
| `withFrame(f, () => …)` | Draw in another plane. `q => [q[0], q[2], q[1]]` draws (x, z) on the front and pushes along y; `q => [-q[0], -q[2], q[1]]` draws on the back seen from behind; `q => [q[2], q[0], q[1]]` on a side. |

`hotspots` are `[title, subtitle, point, [part names…]]`, the point on the surface of the first named part (subtract
the base for a spool part, as `local()` does in every build). `tour.points` are named surface points and `tour.steps`
are `{ t, d, focus, dist, ex (0 together / 1 apart), p: [points], n: [parts to light], ms }`.

One page template for every model. `meta.json` fills its slots: `title`, `sceneLabel` (the canvas
`aria-label`), `hotspotsLabel`, `mark` (`<b>Name</b><span>Subtitle</span>`) and `dwg` (the drawing block; end it with
"Concept page, not affiliated with <maker>" for real products). `screenRuntime: true` puts `engine/screen-runtime.js`
before `model.js`.

## Craft rules

Learned on this gallery's models, plus the parts of Anatomy's craft that carry over to line drawings.

- **Silhouette and edges first.** The engine draws only the lines you give it plus hard rings; a smooth rounded side
  has no outline of its own. A plain rounded box reads as a faint ghost (the first Mac mini thumbnail was a third as
  bright as its neighbours). Draw tangent edges where corner arcs meet flat faces, make the fillet's start and end rings
  `hard`, and give panels and covers their own outlines.
- **Every face has something true on it at 4×.** Seams, screws, vents, ports, feet, label plates, ribs. A bare face is
  unfinished, but detail must belong to a real part: no decorative noise.
- **Lines end on something.** A slot is a closed loop, a seam runs edge to edge, a cable ends in a connector.
- **Parts meet flush.** Stack by the height constants; nothing sinks into anything else, and moving parts clear their
  neighbours both assembled and apart.
- **Exploded view reads in order.** Offsets grow outward from the core (board at 0, cooling and fan below, PSU and shell
  above). Leave a clear gap between neighbouring modules: a lid that only lifts as far as the part under it hides that
  part (the Mac mini's shell first hid its power supply). Small modules (SSD, cards) slide sideways, not just up.
- **Callouts are true and short**: title in a few words, subtitle one fact. The tour follows the mechanism (air in →
  heat → out, or input → process → output), five to seven steps.
- **One accent of motion.** A fan turning, a screen running, keys pressing. Respect `E.reduceMotion`.
- **Real products:** the honest shape and layout, no logos copied as artwork, and the "not affiliated" line.

## Verify

Every check needs `playwright-core` and Chrome: `NODE_PATH=~/PROJECTS/crawl-svg-icon/node_modules` (or any folder
holding `playwright-core`); `CHROMIUM=…` overrides the browser path. Put screenshots in the scratchpad, not the repo.

1. `node tools/capture.js dist/m/<id>.html <scratch>/cap --zoom x,y,3` → assembled, apart, apart without labels and a
   close-up, and it fails on any page error. **Read every PNG.** Check: the outline reads as the real object at 1×;
   nothing hidden apart that should show; every module separated; callout dots on their parts; the close-up has no
   bare face or loose line. If "apart" looks assembled, the explode didn't toggle: Space flips the current state.
2. Thumbnail next to its neighbours on the home grid. The grid uses `thumbs/<id>.webp` as a CSS mask, which Chrome
   blocks on `file://`: serve it (`python3 -m http.server`) or route requests in Playwright to the files on disk. A
   thumbnail much fainter than its neighbours means missing outlines (rule 1), not a tool problem; compare
   `tools/thumb_one.js` output on an existing model with its shipped thumbnail if in doubt.
3. Tell the user what was checked, what was estimated (internal layouts), and what was not done.

## Not covered by a model build

- `packages/blueprintspace/` (the npm package) is not updated by `npm run build`; run `node tools/build_package.js`
  and add the model to its README table when the user wants it published.
- Deploying: Vercel runs `node tools/build.js --dist` (vercel.json) and serves `dist/`; commit the sources, the
  model's `geometry.js` and the rebuilt root `index.html`.
- `tools/thumbs.js` + `tools/thumbs.py` rebuild every thumbnail but expect Linux paths and Pillow; on this Mac use
  `tools/thumb_one.js` per model.

## Rebuilding a figure from elsewhere (Anatomy and the like)

When the user points at another illustration (e.g. an Anatomy figure, github.com/wheresryan22/anatomy, MIT) and wants
it here, they want a model of this gallery: read the source for the object, its parts, sizes and mechanism, then build
it with `kit/procedural.js` like any other model. Do not embed or wrap the other page. Credit the source in the
`.dwg` block ("After “…” in Anatomy by Ryan (MIT)") and in the build's header comment. Skip subjects the gallery
already has (Anatomy's desk computer is the Macintosh 128K again). `dialindicator/`, `pushbutton/` and `arcade/` were
made this way and show the moving-part patterns below, along with `watch/`, `raptor/`, `rippletank/` (two animated
screens: the water and its focused shadow) and `combolock/` (Anatomy's "turning dial" given the safe lock it turns).

## Moving parts, screens and big models

- **Spools move whole parts.** Give a part `{ spool: "name" }` and `setup(E)` gets its inner groups in
  `E.spinners.name`: set `.position` to slide it (the carriage, a coin), `.quaternion` to turn it, `.scale` to squash
  it (a spring). To turn or scale about a point, make the part's module `{ offset, base: [x, y, z] }` and draw the part
  about the origin; three's axes are `(x, z, -y)` of ours.
- **Clamp dt:** `dt = Math.max(0, Math.min(dt, 1 / 30))`. The first frame's dt can be a hair below zero; a clock that
  goes negative indexed an array at −1 and froze the dial indicator's carriage at NaN (invisible, no error).
- **Make a part glow** by raising its line material's `E.byName[name].mats[0].userData.base` (the push button's filament).
- **Animated screens:** set `screenRuntime: true` in meta.json and call `BP_screenAnimation(E, { screen: G.screen,
  part, width, height, always: true, draw })`; pass `G.screen` (origin, right, top corners) from the build. A filled
  part in front of the picture hides it: draw cover glass as lines only (the arcade's bezel glass).
- **Mechanisms with state** (pick-up, latches, sequences): simulate once in `build.js`, pass the samples as
  constants and play them back in `model.js`, so geometry and motion come from the same run (`combolock/`: the gates
  are drawn where the simulation leaves each wheel at the moment it opens). True rates beat pretty ones: the watch's
  balance runs at 2.5 Hz and every wheel follows its real ratio (`watch/`).
- **Lines-only parts don't count for framing.** The camera fits the filled parts only; a lines-only door or plume can
  end up off screen. `view.fit` scales the camera's distance (bigger = further) for both the assembled and the apart
  view, so pick a value that works for both.
- **Size limit:** geometry is packed as Int16 at 0.05 mm, so every coordinate must stay within ±1638 mm. For anything
  bigger, draw it shifted (`withFrame(SH, …)` with `SH = p => [p[0], p[1], p[2] - ZC]`) or in cm, and shift every point
  you export (explode bases, hotspots, tour, screen) the same way. Parts drawn about their own base (spools) go outside
  the shift.
