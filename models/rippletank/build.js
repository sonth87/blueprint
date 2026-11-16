/*
Ripple tank: builds its geometry.

After the ripple-tank figure in Anatomy (github.com/wheresryan22/anatomy, MIT, by Ryan), rebuilt as a 3D blueprint
model with the same layout: a shallow glass-bottomed tank on four legs over a sheet of paper, two ball dippers on a
vibrating bar making waves, a strobe lamp overhead whose light the ripples focus into bright lines on the paper, and
a control box for the frequency.

Generated in code (with kit/procedural.js) in mm, Z up from the bottom of the base's feet. Two pictures are drawn by
lib/screen-runtime.js: the ripples on the water, and their shadow on the paper, 1.53 times larger. Both are drawn on
a clear canvas, and the glass bed is lines only, so the paper can be seen through the tank. The dipper bar is a spool
that model.js bobs.

    node models/rippletank/build.js

Writes models/rippletank/geometry.js.
*/
"use strict";
const { withFrame, part, line, loop, circlePts, rrPts, rrRegion, rect, extrude, rrBody, cyl, revolve, tube,
  r3, geometryScript, writeGeometry } = require("../../kit/procedural");

const HERE = __dirname;
const FX = q => [q[2], q[0], q[1]];
// ---------- dimensions (mm), the figure's heights lifted by the base's 23 mm ----------
const Z0 = 23;                                        // the base's top face, where the paper lies
const IN = { x: -150, y: -120, w: 300, d: 240 }, OUT = { x: -159, y: -129, w: 318, d: 258 };
const Z = { rail: Z0 + 193, bed: Z0 + 202, floor: Z0 + 206, water: Z0 + 212, rim: Z0 + 218, top: Z0 + 223 };
const LAMP = [0, 0, Z0 + 612];
const SHADOW = (LAMP[2] - Z0) / (LAMP[2] - Z.bed);    // the paper's pattern is the water's, this much larger
const PAPER = { hx: Math.ceil(159 * SHADOW + 3), hy: Math.ceil(129 * SHADOW + 3) };
const BASE = { x0: -PAPER.hx - 58, x1: PAPER.hx + 26, y0: -PAPER.hy - 26, y1: PAPER.hy + 26 };
const XS = -70, SPACING = 50, BALL_R = 2.6, BALL_Z = Z.water + BALL_R - 0.9;
const BAR = { x0: XS - 4, x1: XS + 4, y0: -66, y1: 66, z0: Z.top + 2, z1: Z.top + 7 };
const BEAM = { x0: XS - 6, x1: XS + 6, y0: OUT.y - 4, y1: OUT.y + OUT.d + 4, z0: Z.top + 28, z1: Z.top + 34 };
const MOTOR_Z = BAR.z1 + 7.6, SPRING_Y = 56;
const LEGS = [[-154.5, -124.5], [154.5, -124.5], [154.5, 124.5], [-154.5, 124.5]];
const POST = [172, BASE.y1 - 12], ARM_Z = LAMP[2] + 30;
const BOX = { x0: BASE.x0 + 8, x1: BASE.x0 + 52, y0: -126, y1: -46, z0: Z0 + 2, z1: Z0 + 26 };

const explode = {
  base: [0, 0, -60], paper: [0, 0, -30], legs: [0, 0, 0], tank: [0, 0, 60], vibrator: [0, 0, 130], bar: [0, 0, 110],
  lamp: [0, 0, 160], box: [-60, 0, 0],
};

// ---------- base, paper, control box ----------
const base = part("Base Board", "base", "major");
rrBody(base, (BASE.x0 + BASE.x1) / 2, (BASE.y0 + BASE.y1) / 2, (BASE.x1 - BASE.x0) / 2, (BASE.y1 - BASE.y0) / 2, 12, [[0, 7, true], [0, Z0 - 1.6, true], [1.6, Z0, true]], { seg: 5 });
const feet = part("Feet", "base", "minor");
[[BASE.x0 + 28, BASE.y0 + 28], [BASE.x1 - 28, BASE.y0 + 28], [BASE.x1 - 28, BASE.y1 - 28], [BASE.x0 + 28, BASE.y1 - 28]].forEach(([x, y]) => { cyl(feet, x, y, 9, 0, 2, 24); cyl(feet, x, y, 7, 2, 7, 24); });
const paper = part("Paper Screen", "paper", "major");
extrude(paper, rect(-PAPER.hx, PAPER.hx, -PAPER.hy, PAPER.hy), Z0, Z0 + 0.3);
[[-PAPER.hx + 6, -PAPER.hy + 6], [PAPER.hx - 6, -PAPER.hy + 6], [PAPER.hx - 6, PAPER.hy - 6], [-PAPER.hx + 6, PAPER.hy - 6]].forEach(([x, y]) => cyl(paper, x, y, 2.4, Z0 + 0.3, Z0 + 1.1, 12));   // drawing pins
const box = part("Control Box", "box", "major");
rrBody(box, (BOX.x0 + BOX.x1) / 2, (BOX.y0 + BOX.y1) / 2, (BOX.x1 - BOX.x0) / 2, (BOX.y1 - BOX.y0) / 2, 4, [[0, BOX.z0, true], [0, BOX.z1 - 1], [1, BOX.z1, true]], { seg: 3 });
const controls = part("Controls", "box", "minor");
{
  const kx = BOX.x0 + 23, ky = BOX.y0 + 56, mx = BOX.x0 + 22, my = BOX.y0 + 22;
  cyl(controls, kx, ky, 7, BOX.z1, BOX.z1 + 6, 28);                                         // frequency knob
  for (let i = 0; i < 24; i++) { const a = 2 * Math.PI * i / 24; line(controls, [kx + 7.02 * Math.cos(a), ky + 7.02 * Math.sin(a), BOX.z1 + 0.6], [kx + 7.02 * Math.cos(a), ky + 7.02 * Math.sin(a), BOX.z1 + 5.4]); }
  for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.15 + 0.7 * i / 10); line(controls, [kx - 11 * Math.cos(a), ky + 11 * Math.sin(a), BOX.z1 + 0.05], [kx - 13 * Math.cos(a), ky + 13 * Math.sin(a), BOX.z1 + 0.05]); }   // 8–28 Hz scale
  loop(controls, rrPts(mx, my, 14, 10, 2, 3).map(q => [...q, BOX.z1 + 0.05]));               // frequency meter
  for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.2 + 0.6 * i / 8); line(controls, [mx - 10 * Math.cos(a), my - 6 + 10 * Math.sin(a), BOX.z1 + 0.06], [mx - 12 * Math.cos(a), my - 6 + 12 * Math.sin(a), BOX.z1 + 0.06]); }
  extrude(controls, rect(BOX.x0 + 33, BOX.x0 + 39, BOX.y0 + 68, BOX.y0 + 76), BOX.z1, BOX.z1 + 4);   // power switch
  cyl(controls, BOX.x0 + 8, BOX.y0 + 72, 2, BOX.z1, BOX.z1 + 1.5, 12);                       // LED
}
const cables = part("Cables", "box", "minor");
tube(cables, [[BOX.x1, BOX.y0 + 40, BOX.z0 + 10], [-154.5, -100, Z0 + 4], [-154.5, -124.5 - 6, Z0 + 4], [-154.5, -124.5 - 6, Z.rail - 20], [XS, -124.5 - 6, BEAM.z1 + 6], [XS, -30, MOTOR_Z + 6]], 2.2, 8);   // to the motor, up a leg
tube(cables, [[BOX.x1, BOX.y0 + 20, BOX.z0 + 6], [BOX.x1 + 20, BASE.y0 + 12, Z0 + 3], [PAPER.hx + 12, BASE.y0 + 12, Z0 + 3], [PAPER.hx + 12, POST[1] - 8, Z0 + 3], [POST[0], POST[1] - 8, Z0 + 3], [POST[0], POST[1] - 8, Z0 + 40]], 2.2, 8);   // to the lamp

// ---------- legs and tank ----------
const legs = part("Legs", "legs", "major");
LEGS.forEach(([x, y]) => {
  cyl(legs, x, y, 4.2, Z0 + 10, Z.rail - 6, 16);
  cyl(legs, x, y, 7, Z0, Z0 + 10, 20);                                            // leveling screw's foot
  for (let z = Z0 + 3; z <= Z0 + 9; z += 1.5) loop(legs, circlePts(x, y, 7.05, 20).map(q => [...q, z]));
  cyl(legs, x, y, 6, Z.rail - 6, Z.rail, 20);                                     // the socket under the frame
});
const frame = part("Tank Frame", "tank", "major");
extrude(frame, rrRegion(0, 0, OUT.w / 2, OUT.d / 2, 1.5, 3, [[IN.x, IN.x + IN.w, IN.y, IN.y + IN.d]]), Z.rail, Z.top);
loop(frame, rrPts(0, 0, OUT.w / 2 - 4.5, OUT.d / 2 - 4.5, 0.5, 2).map(q => [...q, Z.top + 0.05]));
const glass = part("Glass Bed", "tank", "minor");   // lines only, so the paper shows through
[Z.bed, Z.floor].forEach(z => loop(glass, rrPts(0, 0, IN.w / 2 + 4, IN.d / 2 + 4, 0.01, 1).map(q => [...q, z])));
[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => line(glass, [sx * (IN.w / 2 + 4), sy * (IN.d / 2 + 4), Z.bed], [sx * (IN.w / 2 + 4), sy * (IN.d / 2 + 4), Z.floor]));
const beach = part("Foam Beach", "tank", "minor");
{
  const B = 9;   // a sloping foam strip round the inside of the walls soaks up each wave before it reflects
  [[IN.x, IN.x + IN.w, IN.y, IN.y + B], [IN.x, IN.x + IN.w, IN.y + IN.d - B, IN.y + IN.d], [IN.x, IN.x + B, IN.y + B, IN.y + IN.d - B], [IN.x + IN.w - B, IN.x + IN.w, IN.y + B, IN.y + IN.d - B]]
    .forEach(([x0, x1, y0, y1]) => extrude(beach, rect(x0, x1, y0, y1), Z.floor, Z.water + 1));
}
const water = part("Water", "tank", "minor");   // its outline; the ripples are drawn on it by model.js
loop(water, rrPts(0, 0, IN.w / 2 - 9, IN.d / 2 - 9, 0.01, 1).map(q => [...q, Z.water]));

// ---------- the vibrator: beam, springs, dipper bar, motor ----------
const beam = part("Beam", "vibrator", "major");
extrude(beam, rect(BEAM.x0, BEAM.x1, BEAM.y0, BEAM.y1), BEAM.z0, BEAM.z1);
[BEAM.y0 + 6, BEAM.y1 - 6].forEach(y => extrude(beam, rect(XS - 5, XS + 5, y - 5, y + 5), Z.top, BEAM.z0));   // its posts on the frame
const springs = part("Springs", "vibrator", "minor");
[-SPRING_Y, SPRING_Y].forEach(y => {
  const pts = [], N = 9 * 16, z0 = BAR.z1 + 1, z1 = BEAM.z0 - 1;
  for (let i = 0; i <= N; i++) { const a = 2 * Math.PI * i / 16; pts.push([XS + 2.2 * Math.cos(a), y + 2.2 * Math.sin(a), z0 + (z1 - z0) * i / N]); }
  tube(springs, pts, 0.35, 5);
});
const bar = part("Dipper Bar", "bar", "major", { spool: "bar" });
extrude(bar, rect(BAR.x0, BAR.x1, BAR.y0, BAR.y1), BAR.z0, BAR.z1);
const dippers = part("Dippers", "bar", "major", { spool: "bar" });
[-SPACING / 2, SPACING / 2].forEach(y => {
  cyl(dippers, XS, y, 0.8, BALL_Z, BAR.z0, 10);
  const prof = [];
  for (let a = -90; a <= 90; a += 15) prof.push([Math.max(0, BALL_R * Math.cos(a * Math.PI / 180)), BALL_Z + BALL_R * Math.sin(a * Math.PI / 180)]);
  revolve(dippers, XS, y, [[0, BALL_Z - BALL_R], ...prof.slice(1)], 20);
});
const motor = part("Motor", "bar", "major", { spool: "bar" });
withFrame(FX, () => {
  cyl(motor, 0, MOTOR_Z, 6, XS - 10, XS + 8, 24);
  cyl(motor, 0, MOTOR_Z, 1, XS + 8, XS + 13, 10);
  cyl(motor, 1.8, MOTOR_Z + 1.2, 4.5, XS + 13, XS + 16, 20);   // the off-centre weight that shakes the bar
});
extrude(motor, rect(XS - 9, XS + 7, -7, 7), BAR.z1, BAR.z1 + 1.6);

// ---------- the strobe lamp ----------
const post = part("Lamp Post", "lamp", "major");
cyl(post, POST[0], POST[1], 9, Z0, Z0 + 4, 24);
cyl(post, POST[0], POST[1], 4.5, Z0 + 4, ARM_Z + 16, 16);
tube(post, [[POST[0], POST[1], ARM_Z], [0, 0, ARM_Z]], 3, 10);                       // the arm, out over the tank
rrBody(post, POST[0], POST[1], 7, 7, 2, [[0, ARM_Z - 8, true], [0, ARM_Z + 8, true]], { seg: 2 });   // its clamp
const lamp = part("Strobe Lamp", "lamp", "major");
revolve(lamp, 0, 0, [[3, ARM_Z, true], [3, LAMP[2] + 18, true], [14, LAMP[2] + 8, true], [22, LAMP[2] - 4, true], [21, LAMP[2] - 4, true], [13, LAMP[2] + 6], [0, LAMP[2] + 7]], 32);
revolve(lamp, 0, 0, [[0, LAMP[2] - 3], [2.5, LAMP[2] - 2], [3, LAMP[2] + 2, true], [0, LAMP[2] + 3]], 16);   // the small bright source: sharp shadows need a small lamp

// ---------- callouts and the tour ----------
const local = (name, p) => r3(p);
const hotspots = [
  ["Dippers", "Two sources, in step", [XS, SPACING / 2, BALL_Z + BALL_R], ["Dippers"]],
  ["Vibrating bar", "A motor with an off-centre weight", [XS, 0, MOTOR_Z + 6], ["Motor", "Dipper Bar"]],
  ["Ripples", "1.45 cm apart at 16 Hz", [60, -40, Z.water], ["Water"]],
  ["Foam beach", "Soaks up waves at the walls", [IN.x + IN.w - 4, 0, Z.water + 1], ["Foam Beach"]],
  ["Glass bed", "6 mm of water over glass", [IN.x + 20, IN.y + 4, Z.floor], ["Glass Bed", "Tank Frame"]],
  ["Strobe lamp", "Flashes just slower than the waves", [22, 0, LAMP[2] - 4], ["Strobe Lamp"]],
  ["Paper screen", "The pattern, 1.53× life size", [PAPER.hx - 30, -PAPER.hy + 30, Z0 + 0.3], ["Paper Screen"]],
  ["Control box", "Sets the frequency, 8–28 Hz", [BOX.x0 + 23, BOX.y0 + 56, BOX.z1 + 6], ["Controls", "Control Box"]],
].map(([t, s, p, o]) => ({ t, s, p: local(o[0], p), o }));
const pt = (name, p) => [...r3(p), name];
const tour = {
  points: {
    dip: pt("Dippers", [XS, 0, BALL_Z]), motor: pt("Motor", [XS, 0, MOTOR_Z]), water: pt("Water", [40, 0, Z.water]), beach: pt("Foam Beach", [IN.x + IN.w - 4, 0, Z.water]),
    lamp: pt("Strobe Lamp", [0, 0, LAMP[2]]), paper: pt("Paper Screen", [80, 0, Z0 + 0.3]), box: pt("Controls", [BOX.x0 + 23, BOX.y0 + 56, BOX.z1]),
  },
  steps: [
    { t: "Two sources in step", focus: "dip", dist: 0.4, ex: 0, p: ["motor", "dip"], n: ["Dippers", "Dipper Bar", "Motor", "Springs"], ms: 4400,
      d: "A small motor with an off-centre weight shakes the bar on its springs, so both dippers touch the water together, 16 times a second, 5 cm apart." },
    { t: "Ripples, held flat by surface tension", focus: "water", dist: 0.5, ex: 0, p: ["dip", "water"], n: ["Water"], ms: 4600,
      d: "In water this shallow, ripples this small are pulled flat by surface tension as much as by gravity. At 16 Hz they are 1.45 cm apart and travel at 23 cm/s." },
    { t: "Where the waves cancel", focus: "water", dist: 0.5, ex: 0, p: ["water", "beach"], n: ["Water", "Foam Beach"], ms: 4800,
      d: "Wherever the paths from the two dippers differ by half a wavelength, a crest meets a trough and the water stays still. Those nodal lines fan out between bands of strong waves." },
    { t: "Light draws the pattern", focus: "paper", dist: 0.65, ex: 0, p: ["lamp", "water", "paper"], n: ["Strobe Lamp", "Paper Screen"], ms: 4800,
      d: "Each crest is a weak lens: it focuses the lamp's light into a bright line on the paper below, and each trough spreads it. The shadow is 1.53 times life size." },
    { t: "A strobe slows it down", focus: "lamp", dist: 0.5, ex: 0, p: ["lamp", "box"], n: ["Strobe Lamp", "Controls", "Control Box"], ms: 4400,
      d: "The lamp flashes 0.75 times a second slower than the dippers, so each flash catches the waves a little further on: they seem to crawl outward in slow motion." },
  ],
};
const water0 = [IN.x + 9, IN.y + 9], water1 = [IN.x + IN.w - 9, IN.y + IN.d - 9];
const screens = {
  water: { module: "tank", origin: [water0[0], water0[1], Z.water], right: [water1[0], water0[1], Z.water], top: [water0[0], water1[1], Z.water] },
  paper: { module: "paper", origin: [-PAPER.hx, -PAPER.hy, Z0 + 0.3], right: [PAPER.hx, -PAPER.hy, Z0 + 0.3], top: [-PAPER.hx, PAPER.hy, Z0 + 0.3] },
};

const geometry = geometryScript("RT_GEOMETRY", "rippletank/build.js", { explode, hotspots, tour, screens,
  constants: { XS, SPACING, SHADOW, WATER: [water0, water1], PAPER: [PAPER.hx, PAPER.hy] } });
writeGeometry(HERE, geometry);
console.log(`models/rippletank/geometry.js: ${geometry.stats}`);
