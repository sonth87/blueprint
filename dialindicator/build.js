/*
Dial indicator on a surface plate: builds the model page and adds it to the gallery.

After the dial-indicator figure in Anatomy (github.com/wheresryan22/anatomy, MIT, by Ryan): the same bench and layout,
rebuilt as a 3D blueprint model. A magnetic base holds a post and an arm; the arm carries a dial indicator whose
plunger rests on three gauge blocks (18, 14 and 10 mm) on a carriage that slides along two rails. Here the dial is
read the way a real one is: one turn of the needle is 1 mm of plunger travel, 100 divisions of 0.01 mm, and a small
counter dial counts the turns.

Generated in code (with lib/procedural.js) in mm, Z up, X along the rails, Y towards the back, the bottom of the
feet at z = 0. Three parts move, each on its own spool so model.js can drive it: the carriage slides in x, the
plunger rides up and down, and the needle and the counter hand turn about their own centres.

    node dialindicator/build.js

Writes dialindicator/index.html (the page on its own) and replaces or inserts the model in index.html.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { read, withFrame, part, line, loop, rrPts, circlePts, rrRegion, rect, polyRegion, extrude, rrBody, cyl, revolve,
  r3, geometryScript, buildPage, addToGallery } = require("../lib/procedural");

const HERE = __dirname;
// ---------- dimensions (mm) ----------
const FOOT_H = 5, PLATE_H = 12, Z0 = FOOT_H + PLATE_H;            // the plate's top face
const PLATE = { x: -128, y: -64, w: 262, d: 128, r: 8 };
const rr = (p, inset = 0, holes) => rrRegion(p.x + p.w / 2, p.y + p.d / 2, p.w / 2 - inset, p.d / 2 - inset, Math.max(0.01, p.r - inset), 6, holes);
const corners = (p, i) => [[p.x + i, p.y + i], [p.x + p.w - i, p.y + i], [p.x + p.w - i, p.y + p.d - i], [p.x + i, p.y + p.d - i]];

const MAG = { x: -112, y: -20, w: 44, d: 40, r: 3 }, MAG_H = 24;
const POST = [-98, 0], POST_TOP = Z0 + 122, CLAMP_Z = Z0 + 100;
const DIAL = [58, 0], DIAL_R = 20, DIAL_Z = Z0 + 82, DIAL_H = 10, DIAL_TOP = DIAL_Z + DIAL_H;
const COUNTER = [DIAL[0], DIAL[1] + 8.5], COUNTER_R = 4.6;             // the turn counter, inside the main face
const RAIL_FROM = 2, RAIL_TO = 124;
const CARRIAGE = { x: -28, y: -24, w: 56, d: 48, r: 3 }, CARRIAGE_Z = Z0 + 3, CARRIAGE_TOP = Z0 + 8;
const BLOCKS = [18, 14, 10], BLOCK_W = 15.6, STEP = 16, TIP_R = 2.6;
const CENTRE = -24 + BLOCK_W / 2;
const STOPS = BLOCKS.map((_, i) => DIAL[0] - CENTRE - STEP * i);        // carriage x with each block under the plunger
const START = STOPS[0];
const REST = CARRIAGE_TOP + BLOCKS[0];                                  // the plunger tip's height as drawn

const explode = {
  plate: [0, 0, -45], rails: [0, 0, -18], carriage: [0, 0, 22], stand: [-40, 0, 0],
  dial: [0, 0, 60], needle: { offset: [0, 0, 60], base: [DIAL[0], DIAL[1], DIAL_TOP] },
  counter: { offset: [0, 0, 60], base: [COUNTER[0], COUNTER[1], DIAL_TOP] }, plunger: [0, 0, 36],
};

// ---------- the surface plate ----------
const plate = part("Surface Plate", "plate", "major");
rrBody(plate, PLATE.x + PLATE.w / 2, PLATE.y + PLATE.d / 2, PLATE.w / 2, PLATE.d / 2, PLATE.r,
  [[0, FOOT_H, true], [0, Z0 - 1.6, true], [1.6, Z0, true]], { seg: 6 });
loop(plate, rrPts(PLATE.x + PLATE.w / 2, PLATE.y + PLATE.d / 2, PLATE.w / 2 - 5, PLATE.d / 2 - 5, PLATE.r - 5, 6).map(q => [...q, Z0 + 0.05]));   // the lapped field's edge
const feet = part("Feet", "plate", "minor");
corners(PLATE, 22).forEach(([x, y]) => { cyl(feet, x, y, 7, 0, 1.6, 28); cyl(feet, x, y, 5.4, 1.6, FOOT_H, 28); });
const screws = part("Corner Screws", "plate", "minor");
corners(PLATE, 10).forEach(([x, y]) => { loop(screws, circlePts(x, y, 2.2, 16).map(q => [...q, Z0 + 0.06])); line(screws, [x - 1.2, y, Z0 + 0.06], [x + 1.2, y, Z0 + 0.06]); });
const ruler = part("Ruler Strip", "plate", "minor");
{
  const s = { x: -110, y: PLATE.y + PLATE.d - 15, w: 230, d: 7 };
  extrude(ruler, rect(s.x, s.x + s.w, s.y, s.y + s.d), Z0, Z0 + 0.6);
  for (let x = s.x + 4, i = 0; x <= s.x + s.w - 4; x += 4, i++) line(ruler, [x, s.y + 0.8, Z0 + 0.65], [x, s.y + 0.8 + (i % 5 ? 2 : 3.6), Z0 + 0.65]);
}

// ---------- the rails and their end stops ----------
const rails = part("Rails", "rails", "major");
[-20, 15].forEach(y => rrBody(rails, (RAIL_FROM + RAIL_TO) / 2, y + 2.5, (RAIL_TO - RAIL_FROM) / 2, 2.5, 1, [[0, Z0, true], [0, Z0 + 2.6], [0.4, Z0 + 3, true]], { seg: 3 }));
const stops = part("End Stops", "rails", "minor");
[RAIL_FROM - 5, RAIL_TO].forEach(x => {
  rrBody(stops, x + 2.5, 0, 2.5, 23, 1.2, [[0, Z0, true], [0, Z0 + 6.5], [0.5, Z0 + 7, true]], { seg: 3 });
  [-18, 18].forEach(y => loop(stops, circlePts(x + 2.5, y, 1, 10).map(q => [...q, Z0 + 7.05])));
});

// ---------- the stand: magnetic base, post, clamp, arm ----------
const mag = part("Magnetic Base", "stand", "major");
rrBody(mag, MAG.x + MAG.w / 2, MAG.y + MAG.d / 2, MAG.w / 2, MAG.d / 2, MAG.r, [[0, Z0, true], [0, Z0 + 10.2], [0.8, Z0 + 11, true]], { seg: 6 });
rrBody(mag, MAG.x + MAG.w / 2, MAG.y + MAG.d / 2, MAG.w / 2 - 0.8, MAG.d / 2 - 0.8, MAG.r - 0.8, [[0, Z0 + 11, true], [0, Z0 + MAG_H - 0.8], [0.8, Z0 + MAG_H, true]], { seg: 6, bottom: false });
loop(mag, rrPts(MAG.x + MAG.w / 2, MAG.y + MAG.d / 2, MAG.w / 2 - 3, MAG.d / 2 - 3, 1, 4).map(q => [...q, Z0 + MAG_H + 0.05]));
const knob = part("Magnet Switch", "stand", "minor");
{
  const [kx, ky] = [MAG.x + 32, MAG.y + 28];
  cyl(knob, kx, ky, 6, Z0 + MAG_H, Z0 + MAG_H + 4, 32);
  for (let i = 0; i < 36; i++) { const a = 2 * Math.PI * i / 36; line(knob, [kx + 6.02 * Math.cos(a), ky + 6.02 * Math.sin(a), Z0 + MAG_H + 0.6], [kx + 6.02 * Math.cos(a), ky + 6.02 * Math.sin(a), Z0 + MAG_H + 3.4]); }
  line(knob, [kx, ky, Z0 + MAG_H + 4.05], [kx + 6, ky, Z0 + MAG_H + 4.05]);   // on / off mark
}
const post = part("Post", "stand", "major");
cyl(post, POST[0], POST[1], 5, Z0 + MAG_H, Z0 + MAG_H + 4, 28);
cyl(post, POST[0], POST[1], 3.2, Z0 + MAG_H + 4, POST_TOP, 28);
cyl(post, POST[0], POST[1], 3.8, POST_TOP, POST_TOP + 2, 28);
const clamp = part("Post Clamp", "stand", "minor");
rrBody(clamp, POST[0], POST[1], 7, 7, 2.5, [[0, CLAMP_Z - 4, true], [0, CLAMP_Z + 7.4], [0.6, CLAMP_Z + 8, true]], { seg: 4 });
cyl(clamp, POST[0], POST[1] + 10, 2.6, CLAMP_Z - 1, CLAMP_Z + 5, 20);   // thumb screw
extrude(clamp, rect(POST[0] - 1.4, POST[0] + 1.4, POST[1] + 7, POST[1] + 8.6), CLAMP_Z, CLAMP_Z + 4);
const arm = part("Arm", "stand", "major");
const ARM_X0 = POST[0] + 7, ARM_X1 = DIAL[0] - DIAL_R + 2;
rrBody(arm, (ARM_X0 + ARM_X1) / 2, 0, (ARM_X1 - ARM_X0) / 2, 3, 2, [[0, CLAMP_Z, true], [0, CLAMP_Z + 3.5], [0.5, CLAMP_Z + 4, true]], { seg: 3 });
[ARM_X0 + 4, ARM_X1 - 5].forEach(x => loop(arm, circlePts(x, 0, 1, 10).map(q => [...q, CLAMP_Z + 4.05])));

// ---------- the dial indicator ----------
const body = part("Dial Body", "dial", "major");
revolve(body, DIAL[0], DIAL[1], [[0, DIAL_Z], [DIAL_R - 0.8, DIAL_Z, true], [DIAL_R, DIAL_Z + 0.8], [DIAL_R, DIAL_TOP - 3.4, true], [DIAL_R, DIAL_TOP, true], [DIAL_R - 2.2, DIAL_TOP, true], [0, DIAL_TOP]], 64);
const bezel = part("Bezel", "dial", "minor");
for (let i = 0; i < 84; i++) { const a = 2 * Math.PI * i / 84; line(bezel, [DIAL[0] + (DIAL_R + 0.05) * Math.cos(a), DIAL[1] + (DIAL_R + 0.05) * Math.sin(a), DIAL_TOP - 3.2], [DIAL[0] + (DIAL_R + 0.05) * Math.cos(a), DIAL[1] + (DIAL_R + 0.05) * Math.sin(a), DIAL_TOP - 0.2]); }
const face = part("Dial Face", "dial", "minor");
{
  const z = DIAL_TOP + 0.05;
  for (let i = 0; i < 100; i++) {   // 100 divisions of 0.01 mm, a long tick every 5th, longer every 10th
    const a = Math.PI / 2 - 2 * Math.PI * i / 100, r0 = DIAL_R - 3, r1 = r0 - (i % 10 ? (i % 5 ? 1.3 : 2.1) : 2.8);
    line(face, [DIAL[0] + r0 * Math.cos(a), DIAL[1] + r0 * Math.sin(a), z], [DIAL[0] + r1 * Math.cos(a), DIAL[1] + r1 * Math.sin(a), z]);
  }
  loop(face, circlePts(COUNTER[0], COUNTER[1], COUNTER_R, 32).map(q => [...q, z]));   // the turn counter
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 - 2 * Math.PI * i / 10;
    line(face, [COUNTER[0] + COUNTER_R * Math.cos(a), COUNTER[1] + COUNTER_R * Math.sin(a), z], [COUNTER[0] + (COUNTER_R - 1) * Math.cos(a), COUNTER[1] + (COUNTER_R - 1) * Math.sin(a), z]);
  }
  loop(face, circlePts(DIAL[0], DIAL[1], 1.6, 16).map(q => [...q, z + 0.4]));
}
const stem = part("Stem", "dial", "minor");
cyl(stem, DIAL[0], DIAL[1], 2.9, Z0 + 54, DIAL_Z, 20);
cyl(stem, DIAL[0], DIAL[1], 3.6, Z0 + 54, Z0 + 57, 20);   // the stem's nut
const lug = part("Back Lug", "dial", "minor");
rrBody(lug, DIAL[0] - DIAL_R - 2, 0, 4, 4, 1.5, [[0, DIAL_Z + 2, true], [0, CLAMP_Z - 0.4], [0.4, CLAMP_Z, true]], { seg: 3 });
const lever = part("Lift Lever", "dial", "minor");
rrBody(lever, DIAL[0] + DIAL_R + 1.5, 0, 2.5, 2.4, 1.2, [[0, DIAL_Z + 2, true], [0, DIAL_Z + 7, true]], { seg: 3 });
rrBody(lever, DIAL[0] + DIAL_R + 4.9, 0, 1.3, 3.2, 1.2, [[0, DIAL_Z + 1.2, true], [0, DIAL_Z + 7.8, true]], { seg: 3 });

// the needle and the counter hand, drawn at their pivots and pointing to zero (+y)
const NEEDLE_Z = 0.5;
const needle = part("Needle", "needle", "major", { spool: "needle" });
extrude(needle, polyRegion([[-0.55, -3.4], [0.55, -3.4], [0.25, DIAL_R - 4], [-0.25, DIAL_R - 4]]), NEEDLE_Z, NEEDLE_Z + 0.4);
cyl(needle, 0, 0, 1.2, NEEDLE_Z, NEEDLE_Z + 0.7, 16);
const hand = part("Counter Hand", "counter", "minor", { spool: "counter" });
extrude(hand, polyRegion([[-0.35, -0.8], [0.35, -0.8], [0.15, COUNTER_R - 1.2], [-0.15, COUNTER_R - 1.2]]), 0.2, 0.5);

// ---------- the plunger (drawn resting on the first block) ----------
const plunger = part("Plunger", "plunger", "major", { spool: "plunger" });
cyl(plunger, DIAL[0], DIAL[1], TIP_R, REST, REST + 2.4, 20);
revolve(plunger, DIAL[0], DIAL[1], [[0, REST - 0.6], [TIP_R * 0.7, REST - 0.3], [TIP_R, REST]], 20);   // the ball contact point
cyl(plunger, DIAL[0], DIAL[1], 1.4, REST + 2.4, REST + 50, 16);

// ---------- the carriage and the gauge blocks (drawn at the first stop) ----------
const carriage = part("Carriage", "carriage", "major", { spool: "carriage" });
const C = { ...CARRIAGE, x: CARRIAGE.x + START };
rrBody(carriage, C.x + C.w / 2, C.y + C.d / 2, C.w / 2, C.d / 2, C.r, [[0, CARRIAGE_Z, true], [0, CARRIAGE_TOP - 0.6], [0.6, CARRIAGE_TOP, true]], { seg: 5 });
[-15.5, 15.5].forEach(y => line(carriage, [C.x, y, CARRIAGE_TOP + 0.05], [C.x + C.w, y, CARRIAGE_TOP + 0.05]));   // over the rails
[-22, -8, 8, 22].forEach(x => loop(carriage, circlePts(START + x, C.y + C.d - 2.6, 0.6, 8).map(q => [...q, CARRIAGE_TOP + 0.05])));
const handle = part("Carriage Handle", "carriage", "minor", { spool: "carriage" });
{
  const hx = C.x + C.w - 8, hy = C.y + C.d + 4;
  extrude(handle, rect(hx - 2, hx + 2, C.y + C.d - 1, C.y + C.d + 3), CARRIAGE_Z + 1, CARRIAGE_Z + 4);
  cyl(handle, hx, hy, 3, CARRIAGE_Z, CARRIAGE_Z + 5, 20);
  for (let i = 0; i < 18; i++) { const a = 2 * Math.PI * i / 18; line(handle, [hx + 3.02 * Math.cos(a), hy + 3.02 * Math.sin(a), CARRIAGE_Z + 0.6], [hx + 3.02 * Math.cos(a), hy + 3.02 * Math.sin(a), CARRIAGE_Z + 4.4]); }
}
const blocks = part("Gauge Blocks", "carriage", "major", { spool: "carriage" });
BLOCKS.forEach((h, i) => {
  const x0 = START - 24 + STEP * i;
  rrBody(blocks, x0 + BLOCK_W / 2, 0, BLOCK_W / 2, 12, 1, [[0, CARRIAGE_TOP, true], [0, CARRIAGE_TOP + h - 0.5], [0.5, CARRIAGE_TOP + h, true]], { seg: 3 });
  loop(blocks, rrPts(x0 + BLOCK_W / 2, 0, BLOCK_W / 2 - 2, 10, 0.6, 3).map(q => [...q, CARRIAGE_TOP + h + 0.05]));
});

// ---------- callouts and the tour ----------
const local = (name, p) => r3(name === "Needle" ? [p[0] - DIAL[0], p[1] - DIAL[1], p[2] - DIAL_TOP] : name === "Counter Hand" ? [p[0] - COUNTER[0], p[1] - COUNTER[1], p[2] - DIAL_TOP] : p);
const hotspots = [
  ["Dial", "0.01 mm a division, 1 mm a turn", [DIAL[0] - 10, DIAL[1] - 10, DIAL_TOP + 0.05], ["Dial Face", "Dial Body"]],
  ["Turn counter", "Counts whole millimetres", [COUNTER[0], COUNTER[1] + COUNTER_R, DIAL_TOP + 0.05], ["Dial Face"]],
  ["Plunger", "Rides on whatever is under it", [DIAL[0] + TIP_R, DIAL[1], REST + 20], ["Plunger"]],
  ["Gauge blocks", "18, 14 and 10 mm", [START - 24 + BLOCK_W / 2, -12, CARRIAGE_TOP + BLOCKS[0]], ["Gauge Blocks"]],
  ["Carriage", "Slides along two rails", [START + 20, CARRIAGE.y, CARRIAGE_TOP], ["Carriage"]],
  ["Magnetic base", "The knob switches the magnet", [MAG.x + 32, MAG.y + 28, Z0 + MAG_H + 4], ["Magnetic Base", "Magnet Switch"]],
  ["Post and arm", "Hold the dial over the work", [ARM_X0 + 40, 3, CLAMP_Z + 4], ["Arm", "Post", "Post Clamp"]],
  ["Surface plate", "The flat reference everything sits on", [PLATE.x + 30, PLATE.y + 20, Z0], ["Surface Plate"]],
].map(([t, s, p, o]) => ({ t, s, p: local(o[0], p), o }));
const pt = (name, p) => [...local(name, p), name];
const tour = {
  points: {
    tip: pt("Plunger", [DIAL[0], DIAL[1], REST]), rod: pt("Plunger", [DIAL[0], DIAL[1], REST + 30]), face: pt("Dial Face", [DIAL[0], DIAL[1], DIAL_TOP]),
    counter: pt("Dial Face", [COUNTER[0], COUNTER[1], DIAL_TOP]), block: pt("Gauge Blocks", [START - 24 + BLOCK_W / 2, 0, CARRIAGE_TOP + BLOCKS[0]]),
    cart: pt("Carriage", [START, 0, CARRIAGE_TOP]), rail: pt("Rails", [100, 15, Z0 + 3]), mag: pt("Magnetic Base", [MAG.x + 22, 0, Z0 + MAG_H]),
    post: pt("Post", [POST[0], POST[1], CLAMP_Z - 20]), arm: pt("Arm", [0, 0, CLAMP_Z + 4]), plate: pt("Surface Plate", [0, -40, Z0]),
  },
  steps: [
    { t: "A flat reference", focus: "plate", dist: 0.7, ex: 0, p: ["plate", "rail", "mag"], n: ["Surface Plate", "Rails"], ms: 3800,
      d: "Everything stands on a lapped surface plate, so every height is measured from the same flat face." },
    { t: "Held over the work", focus: "arm", dist: 0.6, ex: 0, p: ["mag", "post", "arm"], n: ["Magnetic Base", "Magnet Switch", "Post", "Post Clamp", "Arm"], ms: 4000,
      d: "A magnetic base grips the plate when its knob is turned on. A post and an arm hold the dial indicator rigidly over the carriage." },
    { t: "The plunger feels the height", focus: "tip", dist: 0.4, ex: 0, p: ["block", "tip", "rod"], n: ["Plunger", "Gauge Blocks"], ms: 4200,
      d: "A light spring pushes the plunger down onto whatever is under it. Slide the carriage and the ball tip rides up or down onto the next block." },
    { t: "A rack turns the needle", focus: "face", dist: 0.4, ex: 0, p: ["rod", "face"], n: ["Needle", "Dial Face", "Plunger"], ms: 4400,
      d: "Inside the body a rack on the plunger turns a train of gears. 1 mm of travel is one turn of the needle, read in 100 divisions of 0.01 mm." },
    { t: "Counting the turns", focus: "counter", dist: 0.35, ex: 0, p: ["face", "counter"], n: ["Counter Hand", "Dial Face"], ms: 4000,
      d: "The small hand counts whole turns, so a move from the 18 mm block to the 14 mm block reads four turns of the needle." },
    { t: "Three known heights", focus: "cart", dist: 0.5, ex: 0, p: ["cart", "block", "rail"], n: ["Carriage", "Gauge Blocks", "Carriage Handle"], ms: 4000,
      d: "Gauge blocks are made to a known height. Comparing a part against them is how a dial indicator checks a size it cannot measure on its own." },
  ],
};

// ---------- page and gallery ----------
const geometry = geometryScript("DI_GEOMETRY", "dialindicator/build.js", { explode, hotspots, tour,
  constants: { DIAL, DIAL_TOP, COUNTER, STOPS, START, BLOCKS, BLOCK_W, STEP, TIP_R, CARRIAGE_TOP, REST } });
const html = buildPage({ template: "cpu", geometry: geometry.js, model: read(path.join(HERE, "model.js")), swaps: [
  [/<title>[^<]*<\/title>/, "<title>Dial Indicator</title>"],
  [/(<canvas id="scene" aria-label=")[^"]*"/, "$1Line drawing of a dial indicator on a surface plate: the carriage slides its gauge blocks under the plunger and the needle turns with the height; on hover the dial, plunger, carriage and stand move apart\""],
  [/(<div id="hotspots" aria-label=")[^"]*"/, "$1Dial indicator parts\""],
  [/<a class="mark" href="#top">.*?<\/a>/, '<a class="mark" href="#top"><b>Dial Indicator</b><span>Measuring</span></a>'],
  [/<div class="dwg" aria-hidden="true">.*?<\/div>/,
    '<div class="dwg" aria-hidden="true">DWG DI-001 &middot; Rev A<br>Units mm &middot; View az 42&deg; / el 28&deg;<br>After &ldquo;Dial indicator&rdquo; in Anatomy by Ryan (MIT)</div>'],
] });
fs.writeFileSync(path.join(HERE, "index.html"), html);
const count = addToGallery({ id: "dialindicator", label: "Dial Indicator", kind: "instrument", tags: "dial indicator gauge measuring instrument metrology surface plate gauge blocks animated anatomy",
  key: "di-theme", category: "Instruments", html }, "book");
console.log(`dialindicator/index.html ${(html.length / 1e6).toFixed(2)} MB, ${geometry.stats}; index.html now has ${count} models`);
