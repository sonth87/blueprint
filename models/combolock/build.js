/*
Combination safe lock: builds its geometry.

After the "Turning dial" figure in Anatomy (github.com/wheresryan22/anatomy, MIT, by Ryan): its combination dial,
rebuilt as a 3D blueprint model with the mechanism it turns, a three-wheel safe lock. The dial and its spindle turn a
drive cam; a pin on the cam picks up the nearest wheel after almost a full turn of free play, that wheel picks up the
next, and so on, which is why a combination is dialled with 4, 3 and 2 turns. When the three wheels' gates line up
under the fence, the lever drops, its nose falls into the drive cam's gate, and turning the dial on pulls the bolt in.

Generated in code (with kit/procedural.js) in mm: the spindle along Y (the dial at the front, -Y, the lock case behind
the door), X across, Z up, the spindle's axis through the origin. The door is drawn as a section, lines only, so the
lock shows through it. The dialling is simulated here, once (the wheels' pick-up and free play, the lever and the
bolt), and sampled into the page; the gates are drawn where that run leaves each wheel, so they line up when it opens.

    node models/combolock/build.js

Writes models/combolock/geometry.js.
*/
"use strict";
const { withFrame, part, line, loop, circlePts, rrPts, rrRegion, rect, polyRegion, extrude, cyl, revolve, tube,
  r3, geometryScript, writeGeometry } = require("../../kit/procedural");

const HERE = __dirname;
const AX = q => [q[0], q[2], q[1]];   // draws in the door's plane (x, z), pushes along the spindle (y)
const TAU = 2 * Math.PI;
// ---------- dimensions (mm) ----------
const DOOR = { x0: -70, x1: 110, z0: -80, z1: 80, y0: 0, y1: 30 };
const WHEEL_R = 24, GATE = { w: 6, d: 3.6 }, CAM = { r: 24, y: [47, 50], gate: { w: 8, d: 5 } };
const WHEELS = [[35, 37], [38.5, 40.5], [42, 44]];   // wheel 1 (furthest from the cam) to wheel 3
const CASE = { x0: -38, x1: 54, z0: -34, z1: 34, y0: 30, y1: 54 };
const BOLT = { x0: 30, x1: 70, z0: -10, z1: 10, y0: 36, y1: 50, travel: 16 };
const PIVOT = [38, 51.5, 26], DROP = 3.2 / 38;      // the lever's pivot on the bolt; how far it drops (rad)
const FENCE_A = Math.PI / 2;                        // the fence and the lever's nose sit over the top of the wheels

// ---------- the dialling, simulated: dial angle a, wheels w1..w3 with pick-up and free play ----------
const SLACK = TAU - 0.35;   // free play between a driver's pin and the next wheel's fly
function simulate() {
  const ease = u => u * u * (3 - 2 * u);
  let a = 0, w = [1.3, 4.1, 2.6];
  const mod = (x, m) => ((x % m) + m) % m;
  const segs = [];   // [target dial angle or null (hold), seconds, phase]
  const a1 = 4 * TAU + 0.2 * TAU;                                   // left 4 turns, stop at 20: sets wheel 1
  const a2 = a1 - 2 * TAU - mod(a1 - 0.6 * TAU, TAU);               // right, passing 60 twice, stop on it the third time: wheel 2
  const a3 = a2 + TAU + mod(0.4 * TAU - a2, TAU);                    // left, passing 40 once, stop on it the second time: wheel 3
  const a4 = a3 - mod(a3, TAU);                                       // right to 0: the cam's gate comes under the lever's nose
  const a5 = a4 - 0.3 * TAU;                                          // on to the stop: the bolt comes in
  segs.push([null, 1.2, "set"], [a1, 4.2, "left 4"], [a2, 3.2, "right 3"], [a3, 2.4, "left 2"], [a4, 0.9, "right"], [a5, 1.3, "open"], [null, 1.6, "open"],
    [a4, 1.1, "close"], [a4 + 1.6 * TAU, 2.0, "scramble"], [null, 0.6, "set"]);
  const FPS = 30, frames = [];
  let openAt = null, wOpen = null;
  segs.forEach(([target, secs, phase]) => {
    const from = a, n = Math.round(secs * FPS);
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      if (target !== null) a = from + (target - from) * ease(u);
      let drv = a;   // the cam drives wheel 3, wheel 3 drives wheel 2, wheel 2 drives wheel 1
      for (let k = 2; k >= 0; k--) { w[k] = Math.min(Math.max(w[k], drv - SLACK / 2), drv + SLACK / 2); drv = w[k]; }
      let lever = 0, bolt = 0;
      if (phase === "open") { const v = target === null ? 1 : u; lever = Math.min(1, v * 4); bolt = target === null ? 1 : ease(Math.max(0, (u - 0.2) / 0.8)); }
      if (phase === "close") { lever = 1 - Math.max(0, (u - 0.8) / 0.2); bolt = 1 - ease(Math.min(1, u / 0.8)); }
      if (phase === "open" && openAt === null) { openAt = frames.length; wOpen = { a, w: w.slice() }; }
      frames.push([a, ...w, bolt, lever].map(v => Math.round(v * 1e4) / 1e4));
    }
  });
  return { frames, FPS, wOpen };
}
const SIM = simulate();
const GATES = SIM.wOpen.w.map(t => FENCE_A - t);   // each wheel's gate, drawn so it is under the fence at the moment the lock opens
const CAM_GATE = FENCE_A - SIM.wOpen.a;

const explode = {
  door: [0, 0, 0], ring: [0, -30, 0], dial: [0, -70, 0], case: [0, 0, 0], cover: [0, 80, 0],
  wheel1: [0, 12, 0], wheel2: [0, 26, 0], wheel3: [0, 40, 0], cam: [0, 56, 0],
  lever: { offset: [0, 62, 30], base: PIVOT }, bolt: [40, 0, 0],
};

withFrame(AX, () => {   // inside this frame: (x, z) is the door's plane and the third coordinate is y
// ---------- the door (a section: lines only) and the dial ring ----------
const door = part("Door Section", "door", "major");
[DOOR.y0, DOOR.y1].forEach(y => loop(door, rrPts((DOOR.x0 + DOOR.x1) / 2, 0, (DOOR.x1 - DOOR.x0) / 2, DOOR.z1, 0.01, 1).map(q => [...q, y])));
[[DOOR.x0, DOOR.z0], [DOOR.x1, DOOR.z0], [DOOR.x1, DOOR.z1], [DOOR.x0, DOOR.z1]].forEach(([x, z]) => line(door, [x, z, DOOR.y0], [x, z, DOOR.y1]));
for (let k = 1; k < 12; k++) { const y = DOOR.y0 + (DOOR.y1 - DOOR.y0) * k / 12; line(door, [DOOR.x0, DOOR.z1, y], [DOOR.x0, DOOR.z1 - 8, y - 5]); line(door, [DOOR.x1, DOOR.z0, y], [DOOR.x1, DOOR.z0 + 8, y - 5]); }   // section hatching on the cut edges
loop(door, circlePts(0, 0, 5, 20).map(q => [...q, DOOR.y0])); loop(door, circlePts(0, 0, 5, 20).map(q => [...q, DOOR.y1]));   // the spindle's hole
const ring = part("Dial Ring", "ring", "major");
revolve(ring, 0, 0, [[33, -6, true], [38, -6, true], [38, 0, true], [33, 0, true]], 72, true);
line(ring, [0, 34, -6.05], [0, 37.5, -6.05]);   // the index mark
[[-1, 1], [1, 1], [1, -1], [-1, -1]].forEach(([sx, sz]) => loop(ring, circlePts(sx * 25.5, sz * 25.5, 1.1, 10).map(q => [...q, -6.05])));
});

// ---------- the dial, spindle and drive cam turn together (spool "dial") ----------
const dial = part("Dial", "dial", "major", { spool: "dial" });
withFrame(AX, () => {
  revolve(dial, 0, 0, [[0, -26], [28, -26, true], [31.5, -23, true], [31.5, -12, true], [29, -8, true], [0, -8]], 96);
  for (let i = 0; i < 100; i++) { const a = FENCE_A - TAU * i / 100, r0 = 28, r1 = r0 - (i % 10 ? (i % 5 ? 1.6 : 2.4) : 3.6); line(dial, [r0 * Math.cos(a), r0 * Math.sin(a), -26.05], [r1 * Math.cos(a), r1 * Math.sin(a), -26.05]); }
  revolve(dial, 0, 0, [[0, -34], [11, -34, true], [12, -32, true], [12, -26, true]], 40);   // the knob
  for (let i = 0; i < 24; i++) { const a = TAU * i / 24; line(dial, [12.03 * Math.cos(a), 12.03 * Math.sin(a), -32], [12.03 * Math.cos(a), 12.03 * Math.sin(a), -26.5]); }
  cyl(dial, 0, 0, 3, -8, CAM.y[1], 16);   // the spindle, through the door to the cam
});
const cam = part("Drive Cam", "cam", "major", { spool: "dial" });
withFrame(AX, () => {
  const out = [];
  for (let i = 0; i <= 96; i++) {
    const a = CAM_GATE + 0.17 + (TAU - 0.34) * i / 96;
    out.push([CAM.r * Math.cos(a), CAM.r * Math.sin(a)]);
  }
  const g = CAM_GATE, gd = CAM.r - CAM.gate.d;
  out.push([gd * Math.cos(g - 0.13), gd * Math.sin(g - 0.13)], [gd * Math.cos(g + 0.13), gd * Math.sin(g + 0.13)]);
  extrude(cam, polyRegion(out), CAM.y[0], CAM.y[1]);
  const pa = CAM_GATE + Math.PI, pr = 16;
  cyl(cam, pr * Math.cos(pa), pr * Math.sin(pa), 1.6, CAM.y[0] - 2.4, CAM.y[0], 12);   // the drive pin, towards the wheels
  cyl(cam, 0, 0, 6, CAM.y[0], CAM.y[1] + 1, 24);
});

// ---------- the wheel pack: three gated wheels on a fixed post ----------
WHEELS.forEach(([y0, y1], k) => {
  const w = part("Wheel " + (k + 1), "wheel" + (k + 1), "major", { spool: "wheel" + (k + 1) });
  withFrame(AX, () => {
    const g = GATES[k], out = [];
    for (let i = 0; i <= 96; i++) { const a = g + 0.13 + (TAU - 0.26) * i / 96; out.push([WHEEL_R * Math.cos(a), WHEEL_R * Math.sin(a)]); }
    const gd = WHEEL_R - GATE.d;
    out.push([gd * Math.cos(g - 0.1), gd * Math.sin(g - 0.1)], [gd * Math.cos(g + 0.1), gd * Math.sin(g + 0.1)]);
    extrude(w, polyRegion(out), y0, y1);
    loop(w, circlePts(0, 0, 9, 32).map(q => [...q, y0 - 0.05])); loop(w, circlePts(0, 0, 4.4, 20).map(q => [...q, y0 - 0.05]));   // the hub and its bore
    const fa = g + Math.PI;   // the fly the next driver's pin catches, on the face towards the cam
    extrude(w, rect(-1.5, 1.5, 14, 20).map(t => t.map(([x, z]) => [x * Math.cos(fa - FENCE_A) - z * Math.sin(fa - FENCE_A), x * Math.sin(fa - FENCE_A) + z * Math.cos(fa - FENCE_A)])), y1, y1 + 1.4);
    if (k > 0) cyl(w, 16 * Math.cos(fa + 0.5), 16 * Math.sin(fa + 0.5), 1.2, y0 - 1.4, y0, 10);   // its pin, driving the next wheel out
  });
});
// ---------- the case, post, cover ----------
const caseP = part("Lock Case", "case", "major");
withFrame(AX, () => {
  extrude(caseP, rrRegion((CASE.x0 + CASE.x1) / 2, 0, (CASE.x1 - CASE.x0) / 2, CASE.z1, 4, 4, [[CASE.x0 + 2, CASE.x1 - 2, CASE.z0 + 2, CASE.z1 - 2], [CASE.x1 - 4, CASE.x1 + 2, BOLT.z0 - 1, BOLT.z1 + 1]]), CASE.y0 + 2, CASE.y1);
  extrude(caseP, rrRegion((CASE.x0 + CASE.x1) / 2, 0, (CASE.x1 - CASE.x0) / 2, CASE.z1, 4, 4), CASE.y0, CASE.y0 + 2);
  [[-34, 30], [50, 30], [50, -30], [-34, -30]].forEach(([x, z]) => loop(caseP, circlePts(x, z, 1.6, 10).map(q => [...q, CASE.y1 + 0.05])));
});
const post = part("Wheel Post", "case", "minor");
withFrame(AX, () => cyl(post, 0, 0, 4, CASE.y0 + 2, WHEELS[2][1] + 1.5, 20));
const cover = part("Back Cover", "cover", "major");
withFrame(AX, () => {
  extrude(cover, rrRegion((CASE.x0 + CASE.x1) / 2, 0, (CASE.x1 - CASE.x0) / 2, CASE.z1, 4, 4), CASE.y1 + 0.2, CASE.y1 + 2.2);
  [[-34, 30], [50, 30], [50, -30], [-34, -30]].forEach(([x, z]) => { cyl(cover, x, z, 2.4, CASE.y1 + 2.2, CASE.y1 + 3.4, 14); line(cover, [x - 1.6, z, CASE.y1 + 3.45], [x + 1.6, z, CASE.y1 + 3.45]); });
  loop(cover, rrPts(8, 0, 30, 14, 2, 3).map(q => [...q, CASE.y1 + 2.25]));   // the maker's label
});
// ---------- bolt and lever ----------
const bolt = part("Bolt", "bolt", "major", { spool: "bolt" });
withFrame(AX, () => {
  extrude(bolt, rect(BOLT.x0, BOLT.x1, BOLT.z0, BOLT.z1), BOLT.y0, BOLT.y1);
  extrude(bolt, rect(PIVOT[0] - 4, PIVOT[0] + 4, BOLT.z1, PIVOT[2] + 3), PIVOT[1] - 2, PIVOT[1] - 0.5);   // the lever's post
  cyl(bolt, PIVOT[0], PIVOT[2], 1.4, PIVOT[1] - 2, PIVOT[1] + 2, 10);
});
const lever = part("Lever and Fence", "lever", "major", { spool: "lever" });
withFrame(q => [q[0], q[2], q[1]], () => {   // drawn about the pivot (its module's base)
  const L = (x, z) => [x - PIVOT[0], z - PIVOT[2]];
  const yb = PIVOT[1] - 0.5 - PIVOT[1], yt = yb + 1.5;
  extrude(lever, polyRegion([L(42, 24.5), L(42, 28.5), L(-3, 28.5), L(-3, 24.5)]), yb, yt);                 // the arm
  extrude(lever, polyRegion([L(-3, 24.2), L(3, 24.2), L(3, 28.5), L(-3, 28.5)]), CAM.y[0] - PIVOT[1], yb);    // the nose, over the cam
  extrude(lever, polyRegion([L(-1.6, 24.2), L(1.6, 24.2), L(1.6, 26.6), L(-1.6, 26.6)]), WHEELS[0][0] - PIVOT[1], CAM.y[0] - PIVOT[1]);   // the fence, over the wheels
});
const spring = part("Lever Spring", "lever", "minor", { spool: "lever" });
{ const pts = []; for (let i = 0; i <= 60; i++) { const a = TAU * i / 12; pts.push([10 + 1.2 * Math.cos(a) - PIVOT[0], 0.5 + 1.2 * Math.sin(a), 28.5 + 4 * i / 60 - PIVOT[2]]); } tube(spring, pts, 0.25, 5); }

// ---------- callouts and the tour ----------
const BASE = { "Lever and Fence": PIVOT, "Lever Spring": PIVOT };
const at = (name, p) => r3(BASE[name] ? p.map((c, i) => c - BASE[name][i]) : p);
const hotspots = [
  ["Dial", "100 numbers round its edge", [0, -26, 28], ["Dial"]],
  ["Index", "The number at the mark is the one dialled", [0, -6, 36], ["Dial Ring"]],
  ["Drive cam", "On the spindle, turns with the dial", [CAM.r, CAM.y[1], 0], ["Drive Cam"]],
  ["Wheel pack", "Three wheels, one per number", [-WHEEL_R, WHEELS[1][1], 0], ["Wheel 1", "Wheel 2", "Wheel 3"]],
  ["Fence", "Drops only when all gates line up", [0, WHEELS[1][0], 26.6], ["Lever and Fence"]],
  ["Bolt", "Pulled in by the cam once the lever drops", [BOLT.x1, BOLT.y0, BOLT.z1], ["Bolt"]],
  ["Lock case", "Behind the door, out of reach", [CASE.x0, CASE.y1, CASE.z1], ["Lock Case", "Back Cover"]],
].map(([t, s, p, o]) => ({ t, s, p: at(o[0], p), o }));
const pt = (name, p) => [...at(name, p), name];
const tour = {
  points: {
    dial: pt("Dial", [0, -26, 0]), cam: pt("Drive Cam", [0, CAM.y[1], CAM.r]), w1: pt("Wheel 1", [0, WHEELS[0][0], WHEEL_R]), w2: pt("Wheel 2", [0, WHEELS[1][0], WHEEL_R]),
    w3: pt("Wheel 3", [0, WHEELS[2][0], WHEEL_R]), fence: pt("Lever and Fence", [0, 40, 26]), nose: pt("Lever and Fence", [0, CAM.y[0], 24.5]), bolt: pt("Bolt", [BOLT.x1, 43, 0]),
  },
  steps: [
    { t: "The dial only turns a cam", focus: "cam", dist: 0.5, ex: 1, p: ["dial", "cam"], n: ["Dial", "Drive Cam"], ms: 4400,
      d: "The dial and its spindle go through the door to a drive cam inside the lock. Nothing else is fixed to them." },
    { t: "Each wheel is picked up by the one before", focus: "w3", dist: 0.5, ex: 1, p: ["cam", "w3", "w2", "w1"], n: ["Drive Cam", "Wheel 3", "Wheel 2", "Wheel 1"], ms: 5000,
      d: "A pin on the cam catches a fly on wheel 3 only after almost a full turn; wheel 3's pin then catches wheel 2, and wheel 2's catches wheel 1. Four turns left gather all three and park wheel 1 at the first number." },
    { t: "4 left, 3 right, 2 left", focus: "w2", dist: 0.5, ex: 1, p: ["w1", "w2", "w3"], n: ["Wheel 1", "Wheel 2", "Wheel 3"], ms: 5000,
      d: "Three turns right leave wheel 1 where it is and park wheel 2 at the second number; two turns left park wheel 3 at the third. Now each wheel's gate is under the fence." },
    { t: "The fence drops", focus: "fence", dist: 0.45, ex: 1, p: ["w2", "fence", "nose"], n: ["Lever and Fence"], ms: 4400,
      d: "The fence rests on the wheels' rims and can only fall when all three gates are under it. Then the lever's nose drops into the cam's gate." },
    { t: "The cam draws the bolt", focus: "bolt", dist: 0.5, ex: 1, p: ["nose", "bolt"], n: ["Bolt", "Drive Cam", "Lever and Fence"], ms: 4400,
      d: "Turning the dial on, the cam drags the lever by its nose, and the lever pulls the bolt back into the case: the door is free. One wrong number and the fence never falls." },
  ],
};

const geometry = geometryScript("CL_GEOMETRY", "combolock/build.js", { explode, hotspots, tour,
  constants: { FPS: SIM.FPS, frames: SIM.frames, TRAVEL: BOLT.travel, DROP } });
writeGeometry(HERE, geometry);
console.log(`models/combolock/geometry.js: ${geometry.stats}`);
