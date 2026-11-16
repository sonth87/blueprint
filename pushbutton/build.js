/*
Push button circuit on a bench plate: builds the model page and adds it to the gallery.

After the push-button figure in Anatomy (github.com/wheresryan22/anatomy, MIT, by Ryan): the same bench, rebuilt as a
3D blueprint model. A push button is wired in a loop with a 1.5 V cell and a small bulb. Inside the button's open
frame a spring holds a plunger and a copper bridge 7 mm above two contact posts; press the cap and the bridge lands on
both posts, the loop closes and about 0.3 A lights the bulb. Let go and the spring lifts the bridge off.

Generated in code (with lib/procedural.js) in mm, Z up, the bottom of the feet at z = 0. The cap, stem and bridge are
one spool ("press") that model.js moves down; the spring is a spool based at its foot that model.js squashes.

    node pushbutton/build.js

Writes pushbutton/index.html (the page on its own) and replaces or inserts the model in index.html.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { read, part, line, loop, rrPts, circlePts, rrRegion, rect, extrude, rrBody, cyl, revolve, tube,
  r3, geometryScript, buildPage, addToGallery } = require("../lib/procedural");

const HERE = __dirname;
// ---------- dimensions (mm) ----------
const FOOT_H = 5, PLATE_H = 10, Z0 = FOOT_H + PLATE_H;
const PLATE = { x: -120, y: -62, w: 240, d: 124, r: 8 };
const box = (p, z0, z1, bevel, seg = 4) => [p.x + p.w / 2, p.y + p.d / 2, p.w / 2, p.d / 2, p.r, [[0, z0, true], [0, z1 - bevel], [bevel, z1, true]], { seg }];
const corners = (p, i) => [[p.x + i, p.y + i], [p.x + p.w - i, p.y + i], [p.x + p.w - i, p.y + p.d - i], [p.x + i, p.y + p.d - i]];

const BASE = { x: -80, y: -20, w: 64, d: 40, r: 3 }, BASE_H = 8;
const POSTS = [[-70, 0], [-26, 0]], POST_TOP = 24;
const STEM = [-48, 0], GAP = 7;
const BRIDGE = { x: -73, y: -5, w: 50, d: 10, r: 1.5 }, BRIDGE_H = 2.5, BRIDGE_UP = POST_TOP + GAP;
const FRAME_TOP = 60, TOP_PLATE = { x: -82, y: -8, w: 68, d: 16, r: 2 }, TOP_H = 4;
const CAP_UP = 76, CAP_R = 9, CAP_H = 6;
const SPRING_R = 4.6, SPRING_TURNS = 6, SPRING_FOOT = FRAME_TOP + TOP_H + 0.6, SPRING_LEN = CAP_UP - 0.6 - SPRING_FOOT;
const HOLDER = { x: 40, y: -44, w: 36, d: 28, r: 3 }, CELL = [58, -30], CELL_R = 11, CELL_Z = 4, CELL_H = 44;
const SOCKET_BASE = { x: 52, y: 20, w: 28, d: 24, r: 3 }, SOCKET = [66, 32], SOCKET_Z = 6, SOCKET_H = 9;
const GLOBE_R = 10, GLOBE_Z = SOCKET_Z + SOCKET_H + GLOBE_R - 1;
const z = h => Z0 + h;   // heights in the figure are from the plate's top

const explode = {
  plate: [0, 0, -36], frame: [0, 0, 0], press: [0, 0, 48], spring: { offset: [0, 0, 26], base: [STEM[0], STEM[1], z(SPRING_FOOT)] },
  cell: [0, -30, 34], bulb: [0, 30, 34],
};

// ---------- the bench plate ----------
const plate = part("Bench Plate", "plate", "major");
rrBody(plate, PLATE.x + PLATE.w / 2, PLATE.y + PLATE.d / 2, PLATE.w / 2, PLATE.d / 2, PLATE.r, [[0, FOOT_H, true], [0, Z0 - 1.6, true], [1.6, Z0, true]], { seg: 6 });
loop(plate, rrPts(PLATE.x + PLATE.w / 2, PLATE.y + PLATE.d / 2, PLATE.w / 2 - 5, PLATE.d / 2 - 5, PLATE.r - 5, 6).map(q => [...q, Z0 + 0.05]));
const feet = part("Feet", "plate", "minor");
corners(PLATE, 22).forEach(([x, y]) => { cyl(feet, x, y, 7, 0, 1.6, 28); cyl(feet, x, y, 5.4, 1.6, FOOT_H, 28); });
const screws = part("Corner Screws", "plate", "minor");
corners(PLATE, 10).forEach(([x, y]) => { loop(screws, circlePts(x, y, 2.2, 16).map(q => [...q, Z0 + 0.06])); line(screws, [x - 1.2, y, Z0 + 0.06], [x + 1.2, y, Z0 + 0.06]); });
const ruler = part("Ruler Strip", "plate", "minor");
{
  const s = { x: -112, y: PLATE.y + PLATE.d - 13, w: 150, d: 6 };
  extrude(ruler, rect(s.x, s.x + s.w, s.y, s.y + s.d), Z0, Z0 + 0.6);
  for (let x = s.x + 4, i = 0; x <= s.x + s.w - 4; x += 4, i++) line(ruler, [x, s.y + 0.8, Z0 + 0.65], [x, s.y + 0.8 + (i % 5 ? 1.8 : 3.4), Z0 + 0.65]);
}
const label = part("Label Plate", "plate", "minor");
{
  const l = { x: 50, y: PLATE.y + PLATE.d - 15, w: 58, d: 9, r: 1.2 };
  rrBody(label, ...box(l, Z0, Z0 + 0.8, 0.2, 3));
  [2.6, 4.5, 6.4].forEach((dy, i) => line(label, [l.x + 5, l.y + dy, Z0 + 0.85], [l.x + l.w - (i === 2 ? 22 : 5), l.y + dy, Z0 + 0.85]));   // its engraved lines
  [l.x + 2, l.x + l.w - 2].forEach(x => loop(label, circlePts(x, l.y + 4.5, 0.6, 8).map(q => [...q, Z0 + 0.85])));
}
// the wires lie on the plate, from terminal to terminal
const wires = part("Wires", "plate", "minor");
[
  [[74, -20, 4], [80, -12, 0.6], [96, -12, 0.6], [96, 52, 0.6], [76, 52, 0.6], [76, 44, 6]],               // cell + to the bulb
  [[56, 44, 6], [56, 52, 0.6], [-26, 52, 0.6], [-26, 28, 0.6], [-26, 20, BASE_H]],                        // bulb to the right post
  [[-70, 20, BASE_H], [-70, 30, 0.6], [-100, 30, 0.6], [-100, -42, 0.6], [30, -42, 0.6], [30, -20, 0.6], [42, -20, 4]],   // left post to cell −
].forEach(route => {
  tube(wires, route.map(([x, y, h]) => [x, y, z(h)]), 0.6, 8);
  [route[0], route[route.length - 1]].forEach(([x, y, h]) => cyl(wires, x, y, 1.6, z(h), z(h) + 1.2, 12));   // the ring lugs under the screws
});

// ---------- the switch: base, contact posts, frame ----------
const base = part("Switch Base", "frame", "major");
rrBody(base, ...box(BASE, Z0, z(BASE_H), 0.8));
loop(base, rrPts(BASE.x + BASE.w / 2, BASE.y + BASE.d / 2, BASE.w / 2 - 3, BASE.d / 2 - 3, 1, 4).map(q => [...q, z(BASE_H) + 0.05]));
const terms = part("Binding Screws", "frame", "minor");
POSTS.forEach(([x]) => { cyl(terms, x, 20 - 3, 2.4, z(BASE_H), z(BASE_H) + 1.4, 16); line(terms, [x - 1.6, 17, z(BASE_H) + 1.45], [x + 1.6, 17, z(BASE_H) + 1.45]); });
const posts = part("Contact Posts", "frame", "major");
POSTS.forEach(([x, y]) => { cyl(posts, x, y, 4.5, z(BASE_H), z(POST_TOP - 2), 28); cyl(posts, x, y, 5, z(POST_TOP - 2), z(POST_TOP), 28); });
const frame = part("Frame", "frame", "major");
[-80, -22].forEach(x0 => rrBody(frame, x0 + 3, 0, 3, 6, 1.2, [[0, z(BASE_H), true], [0, z(FRAME_TOP)]], { seg: 3, top: false }));
rrBody(frame, ...box(TOP_PLATE, z(FRAME_TOP), z(FRAME_TOP + TOP_H), 0.5, 3));
loop(frame, circlePts(STEM[0], STEM[1], 3.2, 20).map(q => [...q, z(FRAME_TOP + TOP_H) + 0.05]));   // the stem's bushing
[TOP_PLATE.x + 3, TOP_PLATE.x + TOP_PLATE.w - 3].forEach(x => loop(frame, circlePts(x, 0, 0.8, 8).map(q => [...q, z(FRAME_TOP + TOP_H) + 0.05])));

// ---------- what moves: cap, stem and the copper bridge (drawn up, the circuit open) ----------
const bridge = part("Copper Bridge", "press", "major", { spool: "press" });
rrBody(bridge, ...box(BRIDGE, z(BRIDGE_UP), z(BRIDGE_UP + BRIDGE_H), 0.5, 3));
[BRIDGE.x + 4, BRIDGE.x + BRIDGE.w - 4].forEach(x => loop(bridge, circlePts(x, 0, 0.6, 8).map(q => [...q, z(BRIDGE_UP + BRIDGE_H) + 0.05])));
const stem = part("Stem", "press", "minor", { spool: "press" });
cyl(stem, STEM[0], STEM[1], 2.2, z(BRIDGE_UP + BRIDGE_H), z(CAP_UP), 18);
const cap = part("Cap", "press", "major", { spool: "press" });
revolve(cap, STEM[0], STEM[1], [[0, z(CAP_UP)], [CAP_R, z(CAP_UP), true], [CAP_R, z(CAP_UP + CAP_H - 1), true], [CAP_R - 1, z(CAP_UP + CAP_H), true], [0, z(CAP_UP + CAP_H)]], 48);
for (let i = 0; i < 54; i++) { const a = 2 * Math.PI * i / 54; line(cap, [STEM[0] + (CAP_R + 0.03) * Math.cos(a), STEM[1] + (CAP_R + 0.03) * Math.sin(a), z(CAP_UP + 0.6)], [STEM[0] + (CAP_R + 0.03) * Math.cos(a), STEM[1] + (CAP_R + 0.03) * Math.sin(a), z(CAP_UP + CAP_H - 1)]); }
loop(cap, circlePts(STEM[0], STEM[1], CAP_R - 2.6, 40).map(q => [...q, z(CAP_UP + CAP_H) + 0.05]));

// the spring, drawn from its foot (its module's base) up to the cap
const spring = part("Spring", "spring", "minor", { spool: "spring" });
{
  const pts = [], N = SPRING_TURNS * 24;
  for (let i = 0; i <= N; i++) { const a = 2 * Math.PI * i / 24; pts.push([SPRING_R * Math.cos(a), SPRING_R * Math.sin(a), SPRING_LEN * i / N]); }
  tube(spring, pts, 0.45, 6);
}

// ---------- the cell in its holder ----------
const holder = part("Cell Holder", "cell", "minor");
rrBody(holder, ...box(HOLDER, Z0, z(4), 0.6));
cyl(holder, CELL[0], CELL[1], CELL_R + 2, z(4), z(6), 40);
[[42, -20], [74, -20]].forEach(([x, y]) => { loop(holder, circlePts(x, y, 2.4, 16).map(q => [...q, z(4) + 0.05])); });
const cell = part("Cell", "cell", "major");
revolve(cell, CELL[0], CELL[1], [[0, z(CELL_Z)], [CELL_R - 0.8, z(CELL_Z), true], [CELL_R, z(CELL_Z) + 0.8], [CELL_R, z(CELL_Z + 9), true], [CELL_R, z(CELL_Z + CELL_H - 8), true], [CELL_R, z(CELL_Z + CELL_H) - 0.8], [CELL_R - 0.8, z(CELL_Z + CELL_H), true], [0, z(CELL_Z + CELL_H)]], 48);
cyl(cell, CELL[0], CELL[1], 4, z(CELL_Z + CELL_H), z(CELL_Z + CELL_H + 3), 24);   // + terminal
const strap = part("Cell Strap", "cell", "minor");
extrude(strap, rect(CELL[0] + CELL_R - 0.5, CELL[0] + CELL_R + 1.5, CELL[1] + 6, CELL[1] + 10), z(4), z(CELL_H + 6));
extrude(strap, rect(CELL[0] + 4, CELL[0] + CELL_R + 0.5, CELL[1] + 6.5, CELL[1] + 9.5), z(CELL_Z + CELL_H + 1.4), z(CELL_Z + CELL_H + 2.6));

// ---------- the bulb in its socket ----------
const socket = part("Bulb Socket", "bulb", "minor");
rrBody(socket, ...box(SOCKET_BASE, Z0, z(SOCKET_Z), 0.6));
[[56, 41], [76, 41]].forEach(([x, y]) => loop(socket, circlePts(x, y, 2.2, 16).map(q => [...q, z(SOCKET_Z) + 0.05])));
revolve(socket, SOCKET[0], SOCKET[1], [[6.5, z(SOCKET_Z), true], [6.5, z(SOCKET_Z + 2), true], [6.2, z(SOCKET_Z + 3)], [6.5, z(SOCKET_Z + 4), true], [6.2, z(SOCKET_Z + 5)], [6.5, z(SOCKET_Z + 6), true], [6.5, z(SOCKET_Z + SOCKET_H), true], [0, z(SOCKET_Z + SOCKET_H)]], 36);
const glass = part("Bulb", "bulb", "major");
{
  const prof = [[3.8, z(SOCKET_Z + SOCKET_H), true], [3.8, z(SOCKET_Z + SOCKET_H + 1.5)]];
  for (let a = -58; a <= 90; a += 8) { const r = a * Math.PI / 180; prof.push([Math.max(0, GLOBE_R * Math.cos(r)), z(GLOBE_Z) + GLOBE_R * Math.sin(r)]); }
  prof.push([0, z(GLOBE_Z) + GLOBE_R]);
  revolve(glass, SOCKET[0], SOCKET[1], prof, 40);
}
const filament = part("Filament", "bulb", "minor");
{
  const [x, y] = SOCKET, zc = z(GLOBE_Z);
  line(filament, [x - 1.2, y, z(SOCKET_Z + SOCKET_H)], [x - 3.2, y, zc]);   // the two supports
  line(filament, [x + 1.2, y, z(SOCKET_Z + SOCKET_H)], [x + 3.2, y, zc]);
  for (let i = 0; i < 8; i++) line(filament, [x - 3.2 + 6.4 * i / 8, y, zc + (i % 2 ? -0.5 : 0.5)], [x - 3.2 + 6.4 * (i + 1) / 8, y, zc + (i % 2 ? 0.5 : -0.5)]);   // the coil
}

// ---------- callouts and the tour ----------
const local = (name, p) => r3(name === "Spring" ? [p[0] - STEM[0], p[1] - STEM[1], p[2] - z(SPRING_FOOT)] : p);
const hotspots = [
  ["Cap", "Press and hold", [STEM[0] + CAP_R, STEM[1], z(CAP_UP + 3)], ["Cap"]],
  ["Spring", "Lifts the bridge off again", [STEM[0] + SPRING_R, STEM[1], z(SPRING_FOOT + SPRING_LEN / 2)], ["Spring"]],
  ["Copper bridge", "Closes the gap between the posts", [BRIDGE.x + BRIDGE.w - 6, -5, z(BRIDGE_UP + 1)], ["Copper Bridge"]],
  ["Contact posts", "7 mm under the bridge", [POSTS[1][0] + 5, 0, z(POST_TOP - 1)], ["Contact Posts"]],
  ["1.5 V cell", "Drives the loop", [CELL[0] - CELL_R, CELL[1], z(CELL_Z + 25)], ["Cell", "Cell Holder"]],
  ["Bulb", "About 0.3 A when it's on", [SOCKET[0], SOCKET[1], z(GLOBE_Z + GLOBE_R)], ["Bulb", "Filament", "Bulb Socket"]],
  ["Wires", "One loop: cell, button, bulb", [96, 20, z(0.6)], ["Wires"]],
].map(([t, s, p, o]) => ({ t, s, p: local(o[0], p), o }));
const pt = (name, p) => [...local(name, p), name];
const tour = {
  points: {
    cap: pt("Cap", [STEM[0], STEM[1], z(CAP_UP + CAP_H)]), spring: pt("Spring", [STEM[0], STEM[1], z(SPRING_FOOT + 6)]),
    bridge: pt("Copper Bridge", [STEM[0], 0, z(BRIDGE_UP)]), postL: pt("Contact Posts", [POSTS[0][0], 0, z(POST_TOP)]), postR: pt("Contact Posts", [POSTS[1][0], 0, z(POST_TOP)]),
    cell: pt("Cell", [CELL[0], CELL[1], z(CELL_Z + CELL_H)]), bulb: pt("Bulb", [SOCKET[0], SOCKET[1], z(GLOBE_Z)]), wire: pt("Wires", [96, 20, z(0.6)]),
  },
  steps: [
    { t: "An open loop", focus: "bridge", dist: 0.55, ex: 0, p: ["cell", "wire", "postL", "postR", "bulb"], n: ["Wires", "Cell", "Contact Posts", "Bulb"], ms: 4200,
      d: "The cell, the button and the bulb are wired in one loop. With the button up there is a 7 mm gap of air between the bridge and the posts, so no current flows." },
    { t: "The spring holds it open", focus: "spring", dist: 0.4, ex: 0, p: ["cap", "spring", "bridge"], n: ["Spring", "Cap", "Stem", "Copper Bridge"], ms: 4000,
      d: "A coil spring between the frame and the cap pushes the plunger up, so the button rests open until someone presses it." },
    { t: "Press: the bridge closes the gap", focus: "bridge", dist: 0.4, ex: 0, p: ["cap", "bridge", "postL", "postR"], n: ["Copper Bridge", "Contact Posts"], ms: 4400,
      d: "Pressing the cap squashes the spring and brings the copper bridge down onto both posts at once. Copper conducts, so the two posts become one." },
    { t: "Current lights the bulb", focus: "bulb", dist: 0.45, ex: 0, p: ["cell", "wire", "bulb"], n: ["Filament", "Bulb", "Wires"], ms: 4400,
      d: "With the loop closed the 1.5 V cell drives about 0.3 A round it. The thin filament has most of the loop's resistance, so it heats until it glows." },
    { t: "Let go", focus: "spring", dist: 0.45, ex: 0, p: ["spring", "bridge"], n: ["Spring", "Copper Bridge"], ms: 3800,
      d: "Release the cap and the spring lifts the bridge clear of the posts. The gap opens, the current stops and the bulb goes out." },
  ],
};

// ---------- page and gallery ----------
const geometry = geometryScript("PB_GEOMETRY", "pushbutton/build.js", { explode, hotspots, tour,
  constants: { GAP, SPRING_LEN } });
const html = buildPage({ template: "cpu", geometry: geometry.js, model: read(path.join(HERE, "model.js")), swaps: [
  [/<title>[^<]*<\/title>/, "<title>Push Button Circuit</title>"],
  [/(<canvas id="scene" aria-label=")[^"]*"/, "$1Line drawing of a push button wired in a loop with a cell and a bulb: the button presses, the copper bridge closes the gap between two posts and the bulb lights; on hover the cap, spring, cell and bulb move apart\""],
  [/(<div id="hotspots" aria-label=")[^"]*"/, "$1Circuit parts\""],
  [/<a class="mark" href="#top">.*?<\/a>/, '<a class="mark" href="#top"><b>Push Button</b><span>Circuit</span></a>'],
  [/<div class="dwg" aria-hidden="true">.*?<\/div>/,
    '<div class="dwg" aria-hidden="true">DWG PB-001 &middot; Rev A<br>Units mm &middot; View az 42&deg; / el 28&deg;<br>After &ldquo;Push button&rdquo; in Anatomy by Ryan (MIT)</div>'],
] });
fs.writeFileSync(path.join(HERE, "index.html"), html);
const count = addToGallery({ id: "pushbutton", label: "Push Button Circuit", kind: "circuit", tags: "push button switch circuit cell battery bulb spring contact electricity physics animated anatomy",
  key: "pb-theme", category: "Instruments", html }, "dialindicator");
console.log(`pushbutton/index.html ${(html.length / 1e6).toFixed(2)} MB, ${geometry.stats}; index.html now has ${count} models`);
