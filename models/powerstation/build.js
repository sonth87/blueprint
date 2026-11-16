/*
Power station generating unit: builds its geometry.

After the "Power station" figure in Anatomy (github.com/wheresryan22/anatomy, MIT, by Ryan), rebuilt as a 3D blueprint
model: a 660 MW two-pole turbo-generator on its concrete foundation table (cut open along its length: stator core, bars
in their slots, end windings, the rotor with its two poles, a brushless exciter on the shaft end), three isolated-phase
bus ducts carrying 22 kV to a step-up transformer, an outdoor 400 kV bay (surge arresters, current transformers, SF6
circuit breakers with one interrupter cut open, centre-break disconnectors) and the gantry where the line leaves, with
a synchronising desk in front.

Designed in metres, Z up, X along the generator and the bay, front faces -Y, and packed at 1 unit = 5 cm (20 units
per metre; the 80 m diorama is far past the Int16 range in mm), shifted so the diorama is centred on x = 0. Everything
exported (explode offsets, callouts, tour points, motion constants) is in packed units. Parts that move are drawn in
place on their own spool: model.js turns each one about its pivot (rotor, exciter and coupling on the shaft axis,
disconnector blades about their posts, desk needles, cooler fans) or slides it (breaker rods and moving contact).
The arcs between the disconnector blades are lines-only parts that model.js stretches, flickers and fades.

    node models/powerstation/build.js

Writes models/powerstation/geometry.js.
*/
"use strict";
const { withFrame, part, line, tri, loop, circlePts, rect, polyRegion, extrude, cyl, revolve, tube,
  r3, geometryScript, writeGeometry } = require("../../kit/procedural");

const HERE = __dirname;
const U = 20, XC = 9.5;                                       // units per metre; the diorama's centre in x
const SC = p => [(p[0] - XC) * U, p[1] * U, p[2] * U];
const X = p => r3(SC(p));                                      // a point, exported
const D = v => v.map(c => c * U);                              // an offset, exported
const RAD = Math.PI / 180;

// ---------- the layout (metres) ----------
const TH = 3.4, ZA = 5.6;                                      // table top; generator axis
const Y = [-5.5, 0, 5.5];                                      // the three phases of the bay
const ZB = 7.0;                                                // bay conductor height
const X_ARR = 16.5, X_CT = 21.3, X_CB = 27.6, X_DS = 35.0, X_GT = 41.0;
const B = 1.5;                                                 // disconnector blade length
const PAD = 0.4, CB_Z = 7.0, BEAM_Z = 16.0, yF = -12.85;   // breaker axis; gantry beam; the desk's meter board
const ZD = 8.4, YD = [-1.5, 0, 1.5];                           // bus ducts: height, phase spacing
const TX = { x0: 2.0, x1: 10.5, y: 2.5, z0: 0.6, z1: 7.2 };    // transformer tank
const HVX = 8.6, HVY = [-2.0, 0, 2.0];
const DESK = { x: -5.0, y: -12.8 }, DIAL_Z = 1.85, DIAL_R = 0.32, DIAL_X = [-6.2, -5.4, -4.6, -3.8];
const FAN = [[4.2, 6.0], [6.0, 6.0], [7.8, 6.0]], FAN_Z = 5.9;

const explode = {
  site: D([0, 0, -11]), foundation: D([0, 0, -5.5]), turbine: D([-9, 0, 3]), coupling: D([-6, -3, 4]),
  bearings: D([0, -7, 0]), stator: D([0, 5, 6]), rotor: D([0, -2, 14]), exciter: D([8, -7, 6.5]),
  busducts: D([0, -2, 9]), transformer: D([0, 0, 2]), txbush: D([0, 0, 9]), txcool: D([0, 11, 0]),
  arresters: D([-3, -4, 6]), cts: D([0, -4, 11]), breakers: D([0, -4, 16]), disconnectors: D([2, -4, 6]),
  baybus: D([0, 6, 11]), gantry: D([10, 0, 5]), desk: D([0, -8, 4]),
};

// ---------- helpers ----------
const fx = (y, z) => q => [q[2], y + q[0], z + q[1]];          // local z along world x
const fy = (x, z) => q => [x + q[1], q[2], z + q[0]];          // local z along world y
const box = (p, x0, x1, y0, y1, z0, z1) => extrude(p, rect(x0, x1, y0, y1), z0, z1);
const cylx = (p, y, z, r, x0, x1, n = 24) => withFrame(fx(y, z), () => cyl(p, 0, 0, r, x0, x1, n));
const cyly = (p, x, z, r, y0, y1, n = 24) => withFrame(fy(x, z), () => cyl(p, 0, 0, r, y0, y1, n));
const revx = (p, y, z, prof, n = 24) => withFrame(fx(y, z), () => revolve(p, 0, 0, prof, n));
const strut = (p, a, b, r = 0.05, n = 4) => tube(p, [a, b], r, n);
const pol = (r, a, z) => [r * Math.cos(a), r * Math.sin(a), z];
const sheds = (z0, z1, rc, rs, pitch) => {                     // an insulator's turned profile [r, z, hard]
  const n = Math.max(1, Math.round((z1 - z0) / pitch)), dz = (z1 - z0) / n, pr = [[rc, z0, true]];
  for (let i = 0; i < n; i++) { const z = z0 + i * dz; pr.push([rc, z + dz * 0.08], [rs, z + dz * 0.22, true], [rs * 0.9, z + dz * 0.42], [rc, z + dz * 0.64]); }
  pr.push([rc, z1, true]);
  return pr;
};
const insulator = (p, x, y, z0, z1, rc, rs, pitch = 0.12, n = 14) => revolve(p, x, y, sheds(z0, z1, rc, rs, pitch), n);
const bolts = (p, pts, r, h, dir = 0) => pts.forEach(q => (dir === 0 ? cylx(p, q[1], q[2], r, q[0], q[0] + h, 6) : cyl(p, q[0], q[1], r, q[2], q[2] + h, 6)));
const ring = (cx, cy, z, r, n = 24) => circlePts(cx, cy, r, n).map(q => [...q, z]);
// a half-open ring shell about the local z axis, from angle a0 to a1
function arcShell(p, rO, rI, a0, a1, z0, z1, n = 40) {
  const pt = (r, i, z) => pol(r, a0 + (a1 - a0) * i / n, z);
  for (let i = 0; i < n; i++) {
    tri(p, pt(rO, i, z0), pt(rO, i + 1, z0), pt(rO, i + 1, z1)); tri(p, pt(rO, i, z0), pt(rO, i + 1, z1), pt(rO, i, z1));
    tri(p, pt(rI, i, z0), pt(rI, i + 1, z1), pt(rI, i + 1, z0)); tri(p, pt(rI, i, z0), pt(rI, i, z1), pt(rI, i + 1, z1));
    tri(p, pt(rI, i, z1), pt(rO, i, z1), pt(rO, i + 1, z1)); tri(p, pt(rI, i, z1), pt(rO, i + 1, z1), pt(rI, i + 1, z1));
    tri(p, pt(rI, i, z0), pt(rO, i + 1, z0), pt(rO, i, z0)); tri(p, pt(rI, i, z0), pt(rI, i + 1, z0), pt(rO, i + 1, z0));
    [z0, z1].forEach(z => { line(p, pt(rO, i, z), pt(rO, i + 1, z)); line(p, pt(rI, i, z), pt(rI, i + 1, z)); });
  }
  [0, n].forEach(i => {
    [z0, z1].forEach(z => line(p, pt(rI, i, z), pt(rO, i, z)));
    line(p, pt(rI, i, z0), pt(rI, i, z1)); line(p, pt(rO, i, z0), pt(rO, i, z1));
    tri(p, pt(rI, i, z0), pt(rO, i, z0), pt(rO, i, z1)); tri(p, pt(rI, i, z0), pt(rO, i, z1), pt(rI, i, z1));
  });
}
// a notched stator lamination: bore rI, slots rSlot deep, outer rO, over a0..a1, slots every `pitch`
function coreRegion(rI, rSlot, rO, a0, a1, pitch, slotW) {
  const cs = [];
  for (let c = Math.ceil(a0 / pitch) * pitch; c < a1; c += pitch) if (c - slotW / 2 > a0 && c + slotW / 2 < a1) cs.push(c);
  const bounds = [a0];
  cs.forEach(c => bounds.push(c - slotW / 2, c + slotW / 2));
  bounds.push(a1);
  const P = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  const out = [];
  for (let i = 0; i + 1 < bounds.length; i++) {
    const s = bounds[i], e = bounds[i + 1], isSlot = i % 2 === 1;
    out.push([P(rSlot, s), P(rO, s), P(rO, e)], [P(rSlot, s), P(rO, e), P(rSlot, e)]);
    if (!isSlot) out.push([P(rI, s), P(rSlot, s), P(rSlot, e)], [P(rI, s), P(rSlot, e), P(rI, e)]);
  }
  return { tris: out, centres: cs };
}
const slotPitch = 10 * RAD;
let cr;

withFrame(SC, () => {
// =====================================================================
// SITE: the ground slab, equipment pads, fence
// =====================================================================
const slab = part("Site Slab", "site", "major");
box(slab, -32, 53, -16, 12.5, -0.3, 0);
for (let x = -30; x <= 50; x += 5) line(slab, [x, -16, 0.01], [x, 12.5, 0.01]);
for (let y = -15; y <= 10; y += 5) line(slab, [-32, y, 0.01], [53, y, 0.01]);
const pads = part("Equipment Pads", "site", "major");
Y.forEach(y => {
  box(pads, X_ARR - 0.9, X_ARR + 0.9, y - 0.9, y + 0.9, 0, PAD);
  box(pads, X_CT - 0.9, X_CT + 0.9, y - 0.9, y + 0.9, 0, PAD);
  box(pads, X_CB - 1.4, X_CB + 1.4, y - 1.4, y + 1.4, 0, PAD);
  box(pads, X_DS - 2.9, X_DS - 0.9, y - 0.8, y + 0.8, 0, PAD);
  box(pads, X_DS + 0.9, X_DS + 2.9, y - 0.8, y + 0.8, 0, PAD);
});
[-9.2, 9.2].forEach(y => box(pads, X_GT - 1.4, X_GT + 1.4, y - 1.4, y + 1.4, 0, PAD));
box(pads, TX.x0 - 1.6, TX.x1 + 1.0, -TX.y - 1.0, TX.y + 4.0, 0, 0.3);   // the transformer's oil bund
const fence = part("Bay Fence", "site", "minor");
{
  const run = (a, b) => {
    const n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
    for (let i = 0; i <= n; i++) { const u = i / n, q = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; strut(fence, [q[0], q[1], 0], [q[0], q[1], 1.9], 0.05, 4); }
    [0.4, 0.95, 1.5, 1.9].forEach(z => line(fence, [a[0], a[1], z], [b[0], b[1], z]));
    for (let i = 0; i < n * 2; i++) { const u = i / (n * 2), v = (i + 1) / (n * 2); line(fence, [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, 0.4], [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v, 1.9]); }
  };
  run([12.6, -8.4], [31, -8.4]); run([34, -8.4], [44.6, -8.4]); run([44.6, -8.4], [44.6, 8.4]); run([12.6, -8.4], [12.6, -3.6]);
}

// =====================================================================
// FOUNDATION: raft, table, anchor bolts, stair
// =====================================================================
const raft = part("Foundation Raft", "foundation", "major");
box(raft, -31.4, -8.6, -4.4, 4.4, 0, 0.6);
line(raft, [-31.4, -4.4, 0.61], [-8.6, 4.4, 0.61]);
const table = part("Foundation Table", "foundation", "major");
box(table, -30.6, -8.9, -3.5, 3.5, 2.4, TH);
[-29.6, -25.5, -21.5, -17.5, -13.5, -10.1].forEach(x => [-2.6, 2.6].forEach(y => box(table, x - 0.6, x + 0.6, y - 0.6, y + 0.6, 0.6, 2.4)));
[-26.5, -19.5, -12.5].forEach(x => { line(table, [x, -3.5, 2.4], [x, -3.5, TH]); line(table, [x, 3.5, 2.4], [x, 3.5, TH]); });
[2.7].forEach(z => { line(table, [-30.6, -3.5, z], [-8.9, -3.5, z]); });
const anchors = part("Anchor Bolts", "foundation", "minor");
[-22.9, -20.4, -18.0, -15.8].forEach(x => [-1.7, 1.7].forEach(y => { cyl(anchors, x, y, 0.07, TH, TH + 0.3, 6); cyl(anchors, x, y, 0.12, TH + 0.2, TH + 0.3, 6); }));
[[-25.0, -24.2], [-14.5, -13.5], [-27.2, -26.0]].forEach(([a, b]) => [a + 0.1, b - 0.1].forEach(x => [-1.0, 1.0].forEach(y => { cyl(anchors, x, y, 0.06, TH, TH + 0.22, 6); })));
const stair = part("Table Stair", "foundation", "minor");
{
  const x0 = -28.6, w = 1.0;
  for (let i = 0; i < 10; i++) { const z = 0.6 + (i + 1) * 0.28, y = -3.5 - 3.0 + i * 0.3; box(stair, x0, x0 + w, y, y + 0.3, z - 0.06, z); }
  [x0, x0 + w].forEach(x => { tube(stair, [[x, -6.5, 1.8], [x, -3.5, 3.4 + 0.8]], 0.04, 4); tube(stair, [[x, -6.5, 0.6], [x, -6.5, 1.8]], 0.04, 4); });
  tube(stair, [[x0, -3.5, 4.2], [x0, 3.5, 4.2]], 0.04, 4);
  for (let y = -3.5; y <= 3.5; y += 1.75) strut(stair, [x0, y, TH], [x0, y, 4.2], 0.04, 4);
}

// =====================================================================
// TURBINE END (a stub only) and the COUPLING
// =====================================================================
const stub = part("Turbine Casing Stub", "turbine", "major");
revx(stub, 0, ZA, [[1.6, -30.5, true], [2.15, -30.5, true], [2.15, -28.0, true], [2.5, -27.9, true], [2.5, -27.5, true], [2.15, -27.4, true], [1.0, -27.4, true]], 36);
for (let k = 0; k < 24; k++) { const a = 2 * Math.PI * k / 24; withFrame(fx(0, ZA), () => cyl(stub, 2.32 * Math.cos(a), 2.32 * Math.sin(a), 0.07, -27.9, -27.7, 6)); }
for (let x = -30; x < -28.2; x += 0.6) withFrame(fx(0, ZA), () => loop(stub, ring(0, 0, x, 2.15, 36)));
const tped = part("Turbine Bearing Pedestal", "turbine", "major");
box(tped, -27.2, -26.0, -1.2, 1.2, TH, ZA - 0.5);
box(tped, -27.3, -25.9, -1.3, 1.3, ZA - 0.5, ZA - 0.38);
line(tped, [-27.2, -1.2, ZA], [-26.0, -1.2, ZA]); line(tped, [-27.2, -1.2, ZA], [-27.2, 1.2, ZA]);
cylx(tped, 0, ZA, 0.62, -27.2, -26.0, 24);
box(tped, -27.2, -26.0, -1.2, 1.2, ZA + 0.5, ZA + 0.75);

const cpl = part("Coupling Flanges", "coupling", "major", { spool: "rotor" });
revx(cpl, 0, ZA, [[0.36, -26.05], [0.88, -26.05, true], [0.88, -25.7, true], [0.36, -25.7]], 32);
revx(cpl, 0, ZA, [[0.36, -25.55], [0.88, -25.55, true], [0.88, -25.2, true], [0.36, -25.2]], 32);
for (let k = 0; k < 12; k++) { const a = 2 * Math.PI * k / 12; withFrame(fx(0, ZA), () => { cyl(cpl, 0.68 * Math.cos(a), 0.68 * Math.sin(a), 0.055, -25.78, -25.47, 6); cyl(cpl, 0.68 * Math.cos(a), 0.68 * Math.sin(a), 0.1, -25.82, -25.76, 6); }); }
const tshaft = part("Turbine Shaft Stub", "turbine", "major", { spool: "rotor" });
cylx(tshaft, 0, ZA, 0.45, -30.2, -26.05, 24);
cylx(tshaft, 0, ZA, 0.52, -27.15, -26.05, 24);

// =====================================================================
// BEARINGS
// =====================================================================
const bped = part("Bearing Pedestals", "bearings", "major");
[[-25.0, -24.2], [-14.5, -13.5]].forEach(([a, b]) => {
  box(bped, a, b, -1.1, 1.1, TH, ZA - 0.45);
  box(bped, a - 0.05, b + 0.05, -1.15, 1.15, ZA - 0.45, ZA - 0.33);
  box(bped, a, b, -1.1, 1.1, ZA + 0.45, ZA + 0.7);
  cylx(bped, 0, ZA, 0.6, a, b, 24);
  [-1, 1].forEach(s => { line(bped, [a, s * 1.1, ZA - 0.33], [b, s * 1.1, ZA + 0.45]); });
  [-0.9, 0.9].forEach(y => [a + 0.1, b - 0.1].forEach(x => cyl(bped, x, y, 0.06, ZA + 0.7, ZA + 0.82, 6)));
});
const oil = part("Bearing Oil Pipes", "bearings", "minor");
[[-24.6, -1], [-14.0, -1]].forEach(([x, s]) => {
  tube(oil, [[x, -1.1, TH + 0.9], [x, -1.7, TH + 0.9], [x, -1.7, TH + 2.9]], 0.05, 6);
  tube(oil, [[x + 0.25, 1.1, ZA - 0.2], [x + 0.25, 1.6, ZA - 0.2], [x + 0.25, 1.6, TH]], 0.07, 6);
});
const gplate = part("Generator Rating Plate", "bearings", "minor");
box(gplate, -14.38, -13.62, -1.16, -1.1, ZA - 1.3, ZA - 0.6);
for (let i = 1; i < 6; i++) line(gplate, [-14.32, -1.17, ZA - 1.3 + i * 0.1], [-13.68, -1.17, ZA - 1.3 + i * 0.1]);

// =====================================================================
// STATOR (cut open along its length: the front-top quarter is removed)
// =====================================================================
const A0 = -125 * RAD, A1 = 100 * RAD;                         // the part of the ring that stays (back, bottom, front-bottom)
const frame = part("Stator Frame", "stator", "major");
withFrame(fx(0, ZA), () => {
  arcShell(frame, 2.05, 1.95, A0, A1, -23.4, -15.4, 56);
  [-23.4, -22.4, -21.0, -19.6, -18.2, -16.8, -15.55].forEach(x => arcShell(frame, 2.14, 2.05, A0, A1, x - 0.07, x + 0.07, 40));
  arcShell(frame, 1.95, 1.2, A0, A1, -23.4, -23.25, 40); arcShell(frame, 1.95, 1.2, A0, A1, -15.55, -15.4, 40);
});
const feet = part("Frame Soleplates", "stator", "major");
[-22.9, -20.4, -18.0, -15.9].forEach(x => { box(feet, x - 0.35, x + 0.35, -2.2, 2.2, TH, TH + 0.16); box(feet, x - 0.2, x + 0.2, -1.2, 1.2, TH + 0.16, ZA - 1.9); });
const core = part("Stator Core", "stator", "major");
const CORE0 = -22.4, CORE1 = -16.4, PACKS = 16;
cr = coreRegion(0.72, 1.0, 1.75, A0 + 0.2 * RAD, A1 - 0.2 * RAD, slotPitch, 0.075 / 0.85);
withFrame(fx(0, ZA), () => {
  const L = (CORE1 - CORE0) / PACKS;
  for (let i = 0; i < PACKS; i++) extrude(core, cr.tris, CORE0 + i * L, CORE0 + (i + 1) * L - 0.03);
});
const cplate = part("Core End Plates", "stator", "minor");
withFrame(fx(0, ZA), () => {
  arcShell(cplate, 1.85, 0.8, A0, A1, -22.55, -22.4, 40); arcShell(cplate, 1.85, 0.8, A0, A1, -16.4, -16.25, 40);
  for (let a = A0 + 0.1; a < A1; a += 18 * RAD) { line(cplate, pol(1.78, a, -22.4), pol(1.78, a, -16.4)); }   // key bars along the back of the core
});
const bars = part("Stator Bars", "stator", "major");
withFrame(fx(0, ZA), () => {
  cr.centres.forEach(c => [[0.76, 0.87], [0.88, 0.99]].forEach(([r0, r1]) => {
    const m = (r0 + r1) / 2, h = 0.032, t = [-Math.sin(c), Math.cos(c)];
    const q = [[Math.cos(c) * r0 - t[0] * h, Math.sin(c) * r0 - t[1] * h], [Math.cos(c) * r1 - t[0] * h, Math.sin(c) * r1 - t[1] * h], [Math.cos(c) * r1 + t[0] * h, Math.sin(c) * r1 + t[1] * h], [Math.cos(c) * r0 + t[0] * h, Math.sin(c) * r0 + t[1] * h]];
    extrude(bars, polyRegion(q), -22.62, -16.18);
  }));
});
const ends = part("End Windings", "stator", "major");
const wsup = part("Winding Supports", "stator", "minor");
withFrame(fx(0, ZA), () => {
  [-1, 1].forEach(side => {
    const xe = side < 0 ? -22.62 : -16.18;
    cr.centres.forEach(c => [[0.93, 1], [0.82, -1]].forEach(([r0, dir]) => {
      const pts = [0, 0.25, 0.5, 0.75, 1].map(t => { const a = c + dir * 15 * RAD * t * t, r = r0 + 0.3 * Math.sin(t * Math.PI / 2); return pol(r, a, xe + side * 0.85 * t); });
      tube(ends, pts, 0.034, 5);
    }));
    const xr = xe + side * 0.62;
    [1.12, 1.26].forEach((r, i) => { const pts = []; for (let a = A0 + 0.05; a <= A1 - 0.05; a += 6 * RAD) pts.push(pol(r, a, xr + side * i * 0.16)); tube(wsup, pts, 0.05, 5); });
    for (let a = A0 + 0.2; a < A1; a += 20 * RAD) strut(wsup, pol(1.05, a, xr - side * 0.1), pol(1.8, a, xr - side * 0.1), 0.04, 4);
  });
});
const shields = part("End Shields", "stator", "major");
withFrame(fx(0, ZA), () => {
  arcShell(shields, 2.05, 1.05, A0, A1, -24.1, -23.7, 56);
  arcShell(shields, 2.05, 0.85, A0, A1, -15.1, -14.7, 56);
  [[-24.1, -23.7], [-15.1, -14.7]].forEach(([a, b]) => { for (let ang = A0 + 0.1; ang < A1; ang += 15 * RAD) { cyl(shields, 1.55 * Math.cos(ang), 1.55 * Math.sin(ang), 0.07, b, b + 0.1, 6); } });
});
const tbox = part("Terminal Box", "stator", "major");
box(tbox, -17.4, -14.2, -2.6, 2.6, ZA + 2.0, ZD + 1.1);
box(tbox, -17.5, -14.1, -2.7, 2.7, ZD + 1.1, ZD + 1.25);
[-16.7, -15.7].forEach(x => line(tbox, [x, -2.6, ZA + 2.0], [x, -2.6, ZD + 1.1]));
const gterm = part("Generator Terminals", "stator", "major");
YD.forEach(y => { cylx(gterm, y, ZD, 0.38, -14.2, -13.6, 20); revx(gterm, y, ZD, sheds(-14.0, -13.6, 0.38, 0.5, 0.1).map(([r, x, h]) => [r, x, h]), 20); });

// =====================================================================
// ROTOR (two poles) on its shaft; everything here turns on the "rotor" spool
// =====================================================================
const body = part("Rotor Body", "rotor", "major", { spool: "rotor" });
revx(body, 0, ZA, [[0.2, -22.3], [0.62, -22.3, true], [0.62, -16.5, true], [0.2, -16.5]], 40);
const wedges = part("Slot Wedges", "rotor", "minor", { spool: "rotor" });
withFrame(fx(0, ZA), () => {
  [0, Math.PI].forEach(base => {
    for (let k = 0; k < 8; k++) {
      const a = base + (-52 + k * 104 / 7 + (base ? 0 : 0)) * RAD;
      const c = a;
      [[0, 1]].forEach(() => {
        const h = 0.026, t = [-Math.sin(c), Math.cos(c)], r0 = 0.6, r1 = 0.635;
        const q = [[Math.cos(c) * r0 - t[0] * h, Math.sin(c) * r0 - t[1] * h], [Math.cos(c) * r1 - t[0] * h, Math.sin(c) * r1 - t[1] * h], [Math.cos(c) * r1 + t[0] * h, Math.sin(c) * r1 + t[1] * h], [Math.cos(c) * r0 + t[0] * h, Math.sin(c) * r0 + t[1] * h]];
        extrude(wedges, polyRegion(q), -22.25, -16.55);
      });
    }
    for (let x = -22.0; x <= -16.8; x += 0.4) {   // cooling slits across the pole face
      for (let a = -26; a < 26; a += 4) line(wedges, pol(0.635, base + a * RAD, x), pol(0.635, base + (a + 4) * RAD, x));
    }
  });
});
const rings = part("Retaining Rings", "rotor", "major", { spool: "rotor" });
revx(rings, 0, ZA, [[0.5, -23.2], [0.67, -23.2, true], [0.67, -22.3, true], [0.5, -22.3]], 40);
revx(rings, 0, ZA, [[0.5, -16.5], [0.67, -16.5, true], [0.67, -15.6, true], [0.5, -15.6]], 40);
[-23.05, -15.75].forEach(x => withFrame(fx(0, ZA), () => loop(rings, ring(0, 0, x, 0.67, 40))));
const fans = part("Rotor Fans", "rotor", "minor", { spool: "rotor" });
[[-23.66, -23.36], [-15.5, -15.2]].forEach(([x0, x1]) => {
  revx(fans, 0, ZA, [[0.4, x0], [0.5, x0, true], [0.5, x1, true], [0.4, x1]], 24);
  withFrame(fx(0, ZA), () => { for (let k = 0; k < 14; k++) { const a = 2 * Math.PI * k / 14, c = a + 0.35, w = 0.025; const q = [[0.5, 0], [0.98, 0], [0.98, 0.0], [0.5, 0]]; const P2 = (r, t) => [r * Math.cos(a) - t * Math.sin(a), r * Math.sin(a) + t * Math.cos(a)];
    extrude(fans, polyRegion([P2(0.5, -w), P2(0.98, -w + 0.0), P2(0.98, w), P2(0.5, w)]), x0 + 0.02, x1 - 0.02); } });
});
const shaft = part("Rotor Shaft", "rotor", "major", { spool: "rotor" });
cylx(shaft, 0, ZA, 0.36, -25.2, -10.0, 24);
[[-24.9, -24.3], [-14.4, -13.6]].forEach(([a, b]) => cylx(shaft, 0, ZA, 0.42, a, b, 24));
cylx(shaft, 0, ZA, 0.5, -23.7, -23.2, 24);
cylx(shaft, 0, ZA, 0.5, -15.6, -15.1, 24);

// =====================================================================
// BRUSHLESS EXCITER on the shaft end
// =====================================================================
const ehous = part("Exciter Housing", "exciter", "major");
withFrame(fx(0, ZA), () => {
  arcShell(ehous, 1.25, 1.17, A0, A1, -13.3, -10.2, 40);
  [-13.3, -10.2].forEach(x => arcShell(ehous, 1.32, 1.17, A0, A1, x - 0.08, x + 0.08, 40));
  arcShell(ehous, 1.25, 0.5, A0, A1, -13.3, -13.2, 40); arcShell(ehous, 1.25, 0.5, A0, A1, -10.3, -10.2, 40);
});
box(ehous, -13.0, -10.5, -1.3, 1.3, TH, ZA - 1.2);
const epoles = part("Exciter Field Poles", "exciter", "major");
withFrame(fx(0, ZA), () => {
  for (let k = 0; k < 8; k++) {
    const a = A0 + (k + 0.5) * (A1 - A0) / 8 - 0, c = A0 + (k + 0.5) * (A1 - A0) / 8, h = 0.1;
    const t = [-Math.sin(c), Math.cos(c)];
    const q = [[Math.cos(c) * 0.86 - t[0] * h, Math.sin(c) * 0.86 - t[1] * h], [Math.cos(c) * 1.15 - t[0] * h * 1.4, Math.sin(c) * 1.15 - t[1] * h * 1.4], [Math.cos(c) * 1.15 + t[0] * h * 1.4, Math.sin(c) * 1.15 + t[1] * h * 1.4], [Math.cos(c) * 0.86 + t[0] * h, Math.sin(c) * 0.86 + t[1] * h]];
    extrude(epoles, polyRegion(q), -12.8, -11.4);
  }
});
const earm = part("Exciter Armature", "exciter", "major", { spool: "rotor" });
revx(earm, 0, ZA, [[0.4, -12.9], [0.78, -12.9, true], [0.78, -11.3, true], [0.4, -11.3]], 36);
withFrame(fx(0, ZA), () => { for (let k = 0; k < 24; k++) { const a = 2 * Math.PI * k / 24; line(earm, pol(0.785, a, -12.85), pol(0.785, a, -11.35)); } });
const wheel = part("Rotating Rectifier Wheel", "exciter", "major", { spool: "rotor" });
revx(wheel, 0, ZA, [[0.4, -11.2], [0.7, -11.2, true], [0.7, -10.85, true], [0.4, -10.85]], 36);
withFrame(fx(0, ZA), () => { for (let k = 0; k < 12; k++) { const a = 2 * Math.PI * k / 12; cyl(wheel, 0.55 * Math.cos(a), 0.55 * Math.sin(a), 0.07, -10.85, -10.65, 8); strut(wheel, pol(0.55, a, -10.65), pol(0.55, a, -10.45), 0.02, 4); } });
const pilot = part("Pilot Exciter", "exciter", "major");
withFrame(fx(0, ZA), () => { arcShell(pilot, 0.85, 0.7, A0, A1, -10.1, -9.4, 40); arcShell(pilot, 0.85, 0.3, A0, A1, -9.5, -9.4, 40); });
const pmag = part("Pilot Magnet Rotor", "exciter", "minor", { spool: "rotor" });
revx(pmag, 0, ZA, [[0.2, -10.05], [0.55, -10.05, true], [0.55, -9.55, true], [0.2, -9.55]], 24);
withFrame(fx(0, ZA), () => { for (let k = 0; k < 8; k++) { const a = 2 * Math.PI * k / 8; line(pmag, pol(0.56, a, -10.0), pol(0.56, a, -9.6)); } });

// =====================================================================
// BUS DUCTS: three isolated-phase aluminium ducts, 22 kV
// =====================================================================
const duct = part("Bus Duct Enclosures", "busducts", "major");
YD.forEach(y => {
  [[-13.6, -8.6], [-7.4, -0.7]].forEach(([a, b]) => { cylx(duct, y, ZD, 0.52, a, b, 28); });
  [-13.0, -10.0, -8.7, -7.3, -4.6, -1.8].forEach(x => revx(duct, y, ZD, [[0.52, x - 0.05, true], [0.58, x - 0.03, true], [0.58, x + 0.03, true], [0.52, x + 0.05, true]], 28));
});
const bell = part("Expansion Bellows", "busducts", "minor");
YD.forEach(y => [-11.5, -3.1].forEach(x => { for (let i = 0; i < 7; i++) revx(bell, y, ZD, [[0.5, x + i * 0.08 - 0.28, true], [0.62, x + i * 0.08 - 0.25, true], [0.5, x + i * 0.08 - 0.22, true]], 24); }));
const dcond = part("Duct Conductors", "busducts", "major");
YD.forEach(y => cylx(dcond, y, ZD, 0.24, -14.0, -0.6, 20));
const dins = part("Duct Support Insulators", "busducts", "minor");
YD.forEach(y => [-8.15, -12.2, -5.8, -2.6].forEach(x => { cyl(dins, x, y, 0.1, ZD - 0.5, ZD - 0.24, 12); revolve(dins, x, y, sheds(ZD - 0.5, ZD - 0.24, 0.07, 0.16, 0.08), 12); }));
const dsup = part("Duct Steel Supports", "busducts", "minor");
[-12.4, -9.8, -5.2, -2.0].forEach(x => {
  [-2.5, 2.5].forEach(y => { strut(dsup, [x, y, 0.6], [x, y, ZD - 0.65], 0.12, 4); });
  box(dsup, x - 0.12, x + 0.12, -2.6, 2.6, ZD - 0.8, ZD - 0.6);
  line(dsup, [x, -2.5, 0.6], [x, 2.5, ZD - 0.7]); line(dsup, [x, 2.5, 0.6], [x, -2.5, ZD - 0.7]);
  YD.forEach(y => box(dsup, x - 0.15, x + 0.15, y - 0.4, y + 0.4, ZD - 0.65, ZD - 0.5));
});
const flange = part("Duct Flanges", "busducts", "minor");
YD.forEach(y => [-13.6, -0.7].forEach(x => { revx(flange, y, ZD, [[0.5, x - 0.05, true], [0.78, x - 0.05, true], [0.78, x + 0.05, true], [0.5, x + 0.05, true]], 28); for (let k = 0; k < 12; k++) { const a = 2 * Math.PI * k / 12; cylx(flange, y + 0.68 * Math.cos(a), ZD + 0.68 * Math.sin(a), 0.04, x - 0.08, x + 0.08, 5); } }));

// =====================================================================
// STEP-UP TRANSFORMER
// =====================================================================
const tank = part("Transformer Tank", "transformer", "major");
box(tank, TX.x0, TX.x1, -TX.y, TX.y, TX.z0, TX.z1);
box(tank, TX.x0 - 0.1, TX.x1 + 0.1, -TX.y - 0.1, TX.y + 0.1, TX.z1, TX.z1 + 0.14);
box(tank, TX.x0 - 0.06, TX.x1 + 0.06, -TX.y - 0.06, TX.y + 0.06, TX.z0, TX.z0 + 0.14);
const stiff = part("Tank Stiffeners", "transformer", "minor");
for (let x = TX.x0 + 0.8; x < TX.x1; x += 1.3) { box(stiff, x - 0.05, x + 0.05, -TX.y - 0.1, -TX.y, TX.z0 + 0.14, TX.z1); box(stiff, x - 0.05, x + 0.05, TX.y, TX.y + 0.1, TX.z0 + 0.14, TX.z1); }
[TX.x0 + 0.5, TX.x1 - 0.5].forEach(x => [-1.6, 1.6].forEach(y => { cyl(stiff, x, y, 0.17, TX.z1 + 0.14, TX.z1 + 0.3, 12); loop(stiff, ring(x, y, TX.z1 + 0.3, 0.1, 12)); }));
const turret = part("LV Turret", "transformer", "major");
box(turret, 0.3, 2.0, -2.5, 2.5, 5.9, 9.7);
box(turret, 0.2, 2.1, -2.6, 2.6, 9.7, 9.85);
[1.0, 2.0, 3.0].forEach(i => line(turret, [0.3, -2.5, 5.9 + i], [0.3, 2.5, 5.9 + i]));
const lvb = part("LV Bushings", "txbush", "major");
YD.forEach(y => { revx(lvb, y, ZD, sheds(-0.55, 0.3, 0.3, 0.46, 0.14).map(([r, x, h]) => [r, x, h]), 20); });
const hvb = part("HV Bushings", "txbush", "major");
HVY.forEach(y => {
  cyl(hvb, HVX, y, 0.42, TX.z1 + 0.14, TX.z1 + 0.7, 20);
  insulator(hvb, HVX, y, TX.z1 + 0.7, 11.8, 0.2, 0.34, 0.14, 16);
  cyl(hvb, HVX, y, 0.3, 11.8, 12.1, 16); cyl(hvb, HVX, y, 0.1, 12.1, 12.4, 12);
  loop(hvb, ring(HVX, y, 12.1, 0.3, 16));
});
const nb = part("Neutral Bushing", "txbush", "minor");
cyl(nb, 9.9, 2.1, 0.18, TX.z1 + 0.14, TX.z1 + 0.5, 12); insulator(nb, 9.9, 2.1, TX.z1 + 0.5, 8.9, 0.1, 0.17, 0.12, 12); cyl(nb, 9.9, 2.1, 0.07, 8.9, 9.15, 10);
const cons = part("Conservator", "transformer", "major");
cylx(cons, 0, 9.0, 0.7, 3.2, 6.9, 28);
revx(cons, 0, 9.0, [[0.01, 3.0], [0.55, 3.1, true], [0.7, 3.2, true]], 28); revx(cons, 0, 9.0, [[0.7, 6.9, true], [0.55, 7.0, true], [0.01, 7.1]], 28);
[3.8, 6.2].forEach(x => { strut(cons, [x, -1.6, TX.z1 + 0.14], [x, -0.5, 8.3], 0.1, 4); strut(cons, [x, 1.6, TX.z1 + 0.14], [x, 0.5, 8.3], 0.1, 4); loop(cons, ring(x, 0, 9.0, 0.72, 4).map(q => q)); });
cyly(cons, 5.0, 9.0, 0.22, -0.9, -0.7, 16);   // the oil level gauge
withFrame(fy(5.0, 9.0), () => loop(cons, ring(0, 0, -0.95, 0.18, 20)));
const pipes = part("Buchholz Relay and Pipework", "transformer", "minor");
tube(pipes, [[4.6, 0, 8.3], [4.6, 0, TX.z1 + 0.14]], 0.12, 10);
tube(pipes, [[5.6, 0, 8.3], [5.6, 0, 7.9], [4.6, 0, 7.9]], 0.06, 8);
cyl(pipes, 4.6, 0, 0.26, 7.8, 8.1, 14); cyly(pipes, 4.6, 7.95, 0.12, -0.3, -0.12, 10);
tube(pipes, [[3.3, 0, 8.3], [3.3, 0, 9.5], [2.6, 0, 9.5]], 0.06, 8); cyl(pipes, 2.6, 0, 0.14, 9.5, 9.7, 10);   // breather
const rating = part("Transformer Rating Plate", "transformer", "minor");
box(rating, 5.0, 6.4, -TX.y - 0.17, -TX.y - 0.1, 3.6, 4.4);
for (let i = 1; i < 8; i++) line(rating, [5.1, -TX.y - 0.18, 3.6 + i * 0.1], [6.3, -TX.y - 0.18, 3.6 + i * 0.1]);
const tapc = part("Tap Changer Cabinet", "transformer", "major");
box(tapc, 8.2, 9.8, -TX.y - 0.8, -TX.y, 1.5, 3.6);
box(tapc, 8.3, 9.7, -TX.y - 0.85, -TX.y - 0.8, 1.6, 3.5);
line(tapc, [9.0, -TX.y - 0.85, 1.6], [9.0, -TX.y - 0.85, 3.5]);
cyl(tapc, 8.8, -TX.y - 0.88, 0.04, 2.5, 2.6, 6);
const rads = part("Radiators", "txcool", "major");
for (let x = 3.0; x < 9.6; x += 0.5) { box(rads, x, x + 0.14, TX.y + 0.4, TX.y + 1.0, TX.z0 + 0.9, TX.z1 - 0.9); line(rads, [x + 0.07, TX.y + 1.0, TX.z0 + 0.9], [x + 0.07, TX.y + 1.0, TX.z1 - 0.9]); }
[TX.z0 + 0.7, TX.z1 - 0.7].forEach(z => { cylx(rads, TX.y + 0.7, z, 0.13, 2.8, 9.9, 10); tube(rads, [[3.2, TX.y, z], [3.2, TX.y + 0.7, z]], 0.07, 6); tube(rads, [[9.5, TX.y, z], [9.5, TX.y + 0.7, z]], 0.07, 6); });
const cooler = part("Cooler Bank", "txcool", "major");
box(cooler, 2.6, 9.6, 4.9, 7.1, 0.4, 0.7);
[2.7, 9.5].forEach(x => [5.0, 7.0].forEach(y => strut(cooler, [x, y, 0.7], [x, y, 5.5], 0.08, 4)));
for (let x = 3.0; x < 9.4; x += 0.45) { box(cooler, x, x + 0.1, 5.2, 6.8, 0.9, 5.3); }
[0.9, 5.3].forEach(z => { cylx(cooler, 6.0, z, 0.12, 2.8, 9.4, 10); });
box(cooler, 2.6, 9.6, 4.9, 7.1, 5.5, 5.62);
const cpipe = part("Cooling Pipework", "txcool", "minor");
[1.5, 5.4].forEach(z => tube(cpipe, [[4.0, TX.y + 1.0, z], [4.0, 4.9, z]], 0.1, 8));
[1.5, 5.4].forEach(z => tube(cpipe, [[8.6, TX.y + 1.0, z], [8.6, 4.9, z]], 0.1, 8));
[[3.5, 5.0], [9.3, 5.0]].forEach(([x, y]) => { cyl(cpipe, x, y + 0.9, 0.2, 0.7, 1.0, 12); });
FAN.forEach(([x, y], i) => {
  const g = part("Cooler Fan " + (i + 1), "txcool", "minor", { spool: "cfan" + (i + 1) });
  revolve(g, x, y, [[0.15, FAN_Z], [0.15, FAN_Z + 0.2, true], [0.01, FAN_Z + 0.2]], 12);
  for (let k = 0; k < 5; k++) { const a = 2 * Math.PI * k / 5, P2 = (r, t) => [x + r * Math.cos(a) - t * Math.sin(a), y + r * Math.sin(a) + t * Math.cos(a)]; extrude(g, polyRegion([P2(0.14, -0.04), P2(0.82, -0.12), P2(0.82, 0.12), P2(0.14, 0.04)]), FAN_Z + 0.02, FAN_Z + 0.08); }
  const guard = part("Fan Guard " + (i + 1), "txcool", "minor");
  [0.4, 0.62, 0.85].forEach(r => loop(guard, ring(x, y, FAN_Z + 0.25, r, 28)));
  for (let k = 0; k < 8; k++) { const a = Math.PI * k / 8; line(guard, [x + 0.86 * Math.cos(a), y + 0.86 * Math.sin(a), FAN_Z + 0.25], [x - 0.86 * Math.cos(a), y - 0.86 * Math.sin(a), FAN_Z + 0.25]); }
  loop(guard, ring(x, y, FAN_Z, 0.9, 28)); for (let k = 0; k < 4; k++) { const a = Math.PI / 2 * k + Math.PI / 4; line(guard, [x + 0.9 * Math.cos(a), y + 0.9 * Math.sin(a), FAN_Z], [x + 0.9 * Math.cos(a), y + 0.9 * Math.sin(a), FAN_Z + 0.25]); }
});

// =====================================================================
// 400 kV BAY, one row of equipment for each phase
// =====================================================================
const legs4 = (p, x, y, h, z0, z1, r = 0.06) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => strut(p, [x + sx * h, y + sy * h, z0], [x + sx * h * 0.9, y + sy * h * 0.9, z1], r, 4));
// --- surge arresters
const arrSt = part("Arrester Stands", "arresters", "minor");
const arrIn = part("Arrester Insulators", "arresters", "major");
const arrRg = part("Arrester Grading Rings", "arresters", "minor");
const arrCt = part("Surge Counters", "arresters", "minor");
Y.forEach(y => {
  legs4(arrSt, X_ARR, y, 0.55, PAD, 2.7); box(arrSt, X_ARR - 0.5, X_ARR + 0.5, y - 0.5, y + 0.5, 2.7, 2.8);
  [1.0, 1.9].forEach(z => { line(arrSt, [X_ARR - 0.55, y - 0.55, z], [X_ARR + 0.5, y - 0.5, z]); line(arrSt, [X_ARR - 0.55, y - 0.55, z], [X_ARR - 0.5, y + 0.5, z]); });
  insulator(arrIn, X_ARR, y, 2.8, 6.3, 0.17, 0.28, 0.13, 16); cyl(arrIn, X_ARR, y, 0.24, 6.3, 6.55, 14); cyl(arrIn, X_ARR, y, 0.1, 6.55, ZB, 10);
  tube(arrRg, ring(X_ARR, y, 6.35, 0.75, 28).concat([ring(X_ARR, y, 6.35, 0.75, 28)[0]]), 0.045, 5);
  [0, 1, 2, 3].forEach(k => strut(arrRg, [X_ARR + 0.2 * Math.cos(k * Math.PI / 2), y + 0.2 * Math.sin(k * Math.PI / 2), 6.4], [X_ARR + 0.75 * Math.cos(k * Math.PI / 2), y + 0.75 * Math.sin(k * Math.PI / 2), 6.35], 0.025, 4));
  box(arrCt, X_ARR + 0.58, X_ARR + 0.9, y - 0.2, y + 0.2, 1.3, 1.8);
  withFrame(q => [X_ARR + 0.91 + q[2], y + q[0], 1.55 + q[1]], () => loop(arrCt, ring(0, 0, 0, 0.1, 14)));
});
// --- current transformers
const ctSt = part("CT Stands", "cts", "minor");
const ctIn = part("CT Insulators", "cts", "major");
const ctHd = part("CT Heads", "cts", "major");
const ctSb = part("CT Secondary Boxes", "cts", "minor");
Y.forEach(y => {
  legs4(ctSt, X_CT, y, 0.55, PAD, 2.7); box(ctSt, X_CT - 0.5, X_CT + 0.5, y - 0.5, y + 0.5, 2.7, 2.8);
  [1.1, 1.9].forEach(z => { line(ctSt, [X_CT - 0.55, y - 0.55, z], [X_CT + 0.5, y - 0.5, z]); });
  insulator(ctIn, X_CT, y, 2.8, 6.2, 0.22, 0.36, 0.13, 16);
  revolve(ctHd, X_CT, y, [[0.01, 6.2], [0.34, 6.2, true], [0.62, 6.4, true], [0.62, 6.85, true], [0.5, 7.0, true], [0.01, 7.0]], 24);
  [-1, 1].forEach(s => { box(ctHd, X_CT + s * 0.45 - 0.14, X_CT + s * 0.45 + 0.14, y - 0.14, y + 0.14, 6.95, ZB + 0.1); });
  box(ctSb, X_CT + 0.62, X_CT + 1.0, y - 0.3, y + 0.3, 1.3, 2.1); line(ctSb, [X_CT + 1.0, y, 1.3], [X_CT + 1.0, y, 2.1]);
  tube(ctSb, [[X_CT + 0.56, y, 1.7], [X_CT + 0.56, y, 2.6]], 0.03, 4);
});
// --- SF6 circuit breakers, live-tank
const cbFr = part("Breaker Frames", "breakers", "minor");
const cbCol = part("Breaker Columns", "breakers", "major");
const cbHd = part("Breaker Heads", "breakers", "major");
const cbCh = part("Interrupter Chambers", "breakers", "major");
const cbOpen = part("Cut-open Interrupter", "breakers", "major");
const cbFix = part("Fixed Contact", "breakers", "minor");
const cbMech = part("Operating Mechanisms", "breakers", "major");
const cbRod = part("Operating Rods", "breakers", "major", { spool: "rods" });
const cbMov = part("Moving Contact", "breakers", "major", { spool: "contact" });
const CB_COL0 = 2.15, CB_COL1 = 6.35;
Y.forEach((y, ph) => {
  legs4(cbFr, X_CB, y, 0.7, PAD, 2.1, 0.07); box(cbFr, X_CB - 0.8, X_CB + 0.8, y - 0.8, y + 0.8, 2.05, 2.15);
  line(cbFr, [X_CB - 0.7, y - 0.7, 0.5], [X_CB + 0.7, y - 0.7, 2.0]); line(cbFr, [X_CB + 0.7, y - 0.7, 0.5], [X_CB - 0.7, y - 0.7, 2.0]);
  // the column drawn as sheds without a surface, so the rod shows inside
  const pr = sheds(CB_COL0, CB_COL1, 0.26, 0.4, 0.13);
  pr.forEach(([r, z, h]) => { if (h) loop(cbCol, ring(X_CB, y, z, r, 20)); });
  for (let k = 0; k < 10; k++) { const a = 2 * Math.PI * k / 10; line(cbCol, [X_CB + 0.26 * Math.cos(a), y + 0.26 * Math.sin(a), CB_COL0], [X_CB + 0.26 * Math.cos(a), y + 0.26 * Math.sin(a), CB_COL1]); }
  cyl(cbCol, X_CB, y, 0.33, CB_COL0 - 0.1, CB_COL0, 16); cyl(cbCol, X_CB, y, 0.33, CB_COL1, CB_COL1 + 0.1, 16);
  // the head: the central interrupter housing along x
  cylx(cbHd, y, CB_Z, 0.58, X_CB - 0.7, X_CB + 0.7, 24);
  revx(cbHd, y, CB_Z, [[0.58, X_CB - 0.75, true], [0.7, X_CB - 0.7, true], [0.7, X_CB - 0.6, true], [0.58, X_CB - 0.55]], 24);
  revx(cbHd, y, CB_Z, [[0.58, X_CB + 0.75, true], [0.7, X_CB + 0.7, true], [0.7, X_CB + 0.6, true], [0.58, X_CB + 0.55]], 24);
  cyl(cbHd, X_CB, y, 0.42, CB_Z - 0.75, CB_Z - 0.45, 18);
  // the chambers: each end of the head a porcelain interrupter chamber
  const sides = ph === 1 ? [1] : [-1, 1];
  sides.forEach(s => {
    const xa = s < 0 ? X_CB - 2.65 : X_CB + 0.75, xb = s < 0 ? X_CB - 0.75 : X_CB + 2.65;
    revx(cbCh, y, CB_Z, sheds(xa, xb, 0.34, 0.47, 0.13).map(([r, x, h]) => [r, x, h]), 20);
    const xe = s < 0 ? xa : xb;
    cylx(cbCh, y, CB_Z, 0.36, s < 0 ? xe - 0.3 : xe, s < 0 ? xe : xe + 0.3, 18);
    box(cbCh, s < 0 ? xe - 0.45 : xe + 0.3, s < 0 ? xe - 0.3 : xe + 0.45, y - 0.15, y + 0.15, CB_Z - 0.3, CB_Z + 0.3);
  });
  // operating mechanism: cabinet on the front of the frame
  box(cbMech, X_CB - 0.7, X_CB + 0.7, y - 1.55, y - 0.8, 0.7, 2.0);
  line(cbMech, [X_CB, y - 1.56, 0.7], [X_CB, y - 1.56, 2.0]);
  cyl(cbMech, X_CB - 0.35, y - 1.58, 0.05, 1.3, 1.36, 6);
  cyly(cbMech, X_CB, 1.9, 0.12, y - 1.55, y - 0.8, 10);
  cyl(cbMech, X_CB, y - 1.1, 0.1, 2.0, 2.15, 10);
  // the insulating operating rod up the column (a spool): drawn closed
  cyl(cbRod, X_CB, y, 0.07, CB_COL0 - 0.05, CB_COL1 - 0.1, 10);
  cyl(cbRod, X_CB, y, 0.12, CB_COL0 - 0.1, CB_COL0 + 0.15, 10);
  cyl(cbRod, X_CB, y, 0.12, CB_COL1 - 0.35, CB_COL1 - 0.1, 10);
});
// the cut-open interrupter (middle phase, west chamber): its front half removed to show the contacts
{
  const y = Y[1], xa = X_CB - 2.65, xb = X_CB - 0.75;
  withFrame(fx(y, CB_Z), () => {
    arcShell(cbOpen, 0.47, 0.34, -80 * RAD, 100 * RAD, xa, xb, 30);
    for (let x = xa; x <= xb - 0.05; x += 0.13) { for (let a = -80; a < 100; a += 18) line(cbOpen, pol(0.47, a * RAD, x + 0.02), pol(0.47, (a + 18) * RAD, x + 0.02)); }
    [xa + 0.06, xb - 0.06].forEach(x => arcShell(cbOpen, 0.5, 0.34, -80 * RAD, 100 * RAD, x - 0.05, x + 0.05, 30));
  });
  // the fixed contact and its nozzle (west end), the moving contact (spool) reaching in from the housing
  cylx(cbFix, y, CB_Z, 0.09, xa + 0.1, xa + 0.9, 12);
  revx(cbFix, y, CB_Z, [[0.09, xa + 0.9, true], [0.2, xa + 1.0, true], [0.2, xa + 1.25], [0.14, xa + 1.3, true]], 16);
  revx(cbFix, y, CB_Z, [[0.28, xa + 1.5, true], [0.28, xa + 1.9, true], [0.18, xa + 2.0, true]], 16);   // the insulating nozzle
  cylx(cbFix, y, CB_Z, 0.04, xa + 0.1, xa + 0.3, 8);
  // contacts at their closed position: tip reaching the fixed contact
  cylx(cbMov, y, CB_Z, 0.11, xa + 1.3, xb - 0.1, 14);
  revx(cbMov, y, CB_Z, [[0.11, xa + 1.3, true], [0.19, xa + 1.32], [0.19, xa + 1.62, true], [0.12, xa + 1.65]], 16);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; withFrame(fx(y, CB_Z), () => line(cbMov, pol(0.19, a, xa + 1.32), pol(0.12, a, xa + 1.02))); }
  cylx(cbMov, y, CB_Z, 0.2, xa + 1.62, xa + 1.82, 16);
}
// --- centre-break disconnectors
const dsFr = part("Disconnector Frames", "disconnectors", "minor");
const dsPost = part("Disconnector Posts", "disconnectors", "major");
const dsBase = part("Rotary Bases", "disconnectors", "minor");
const dsDrv = part("Disconnector Drive", "disconnectors", "major");
const PX = [X_DS - B, X_DS + B];
Y.forEach(y => {
  PX.forEach(x => { [-0.6, 0.6].forEach(sy => strut(dsFr, [x + sy * 0.4, y + sy, PAD], [x + sy * 0.4, y + sy, 2.05], 0.07, 4)); });
  [-0.35, 0.35].forEach(sy => box(dsFr, X_DS - B - 0.5, X_DS + B + 0.5, y + sy - 0.07, y + sy + 0.07, 2.05, 2.25));
  PX.forEach(x => {
    cyl(dsBase, x, y, 0.4, 2.25, 2.4, 20); cyl(dsBase, x, y, 0.3, 2.4, 2.6, 20);
    for (let k = 0; k < 6; k++) { const a = 2 * Math.PI * k / 6; cyl(dsBase, x + 0.34 * Math.cos(a), y + 0.34 * Math.sin(a), 0.03, 2.4, 2.45, 5); }
    insulator(dsPost, x, y, 2.6, 6.55, 0.2, 0.33, 0.12, 14);
    cyl(dsPost, x, y, 0.28, 6.55, 6.62, 14);
  });
  // the drive: a cabinet at the front, a pull rod to each rotary base
  box(dsDrv, X_DS - 0.6, X_DS + 0.6, y - 1.5, y - 0.9, 0.6, 1.9);
  line(dsDrv, [X_DS, y - 1.51, 0.6], [X_DS, y - 1.51, 1.9]);
  cyl(dsDrv, X_DS - 0.3, y - 1.52, 0.05, 1.2, 1.26, 6);
  tube(dsDrv, [[X_DS - 0.6, y - 1.2, 1.5], [PX[0], y - 1.2, 1.5], [PX[0], y - 0.45, 2.3]], 0.04, 5);
  tube(dsDrv, [[X_DS + 0.6, y - 1.2, 1.5], [PX[1], y - 1.2, 1.5], [PX[1], y - 0.45, 2.3]], 0.04, 5);
});
// the blades: each half a spool, drawn closed (pointing to the centre), turned about its post
Y.forEach((y, ph) => [-1, 1].forEach(s => {
  const g = part(`Blade L${ph + 1} ${s < 0 ? "West" : "East"}`, "disconnectors", "major", { spool: `blade${ph}${s < 0 ? "w" : "e"}` });
  const px = X_DS + s * B, tip = X_DS - s * 0.04;
  const xa = Math.min(px, tip), xb = Math.max(px, tip);
  box(g, xa, xb, y - 0.1, y + 0.1, 6.74, 6.96);
  cyl(g, px, y, 0.3, 6.62, 6.74, 16); cyl(g, px, y, 0.14, 6.74, 6.98, 12);
  if (s < 0) { [-1, 1].forEach(f => box(g, tip - 0.3, tip + 0.04, y + f * 0.1 - 0.025, y + f * 0.1 + 0.025, 6.78, 6.92)); }
  else cyl(g, tip + 0.02, y, 0.04, 6.76, 6.92, 6), cylx(g, y, 6.85, 0.04, tip - 0.3, tip + 0.02, 8);
  loop(g, ring(px, y, 6.98, 0.3, 14));
}));
// the arcs: drawn as a unit zigzag along x at the centre of each pair (the blades' tips when closed)
Y.forEach((y, ph) => {
  const g = part(`Arc L${ph + 1}`, "disconnectors", "minor", { spool: `arc${ph}` });
  const zz = (seed, amp, n) => { const pts = []; for (let i = 0; i <= n; i++) { const u = i / n, e = (i === 0 || i === n) ? 0 : 1; pts.push([X_DS - 0.5 + u, y + e * amp * Math.sin(seed + i * 2.3) * 0.8, 6.85 + e * amp * Math.cos(seed * 1.7 + i * 1.9)]); } return pts; };
  [[0.3, 0.34, 10], [1.9, 0.26, 14], [4.1, 0.4, 8], [2.7, 0.3, 12]].forEach(([sd, a, n]) => { const pts = zz(sd, a, n); pts.forEach((q, i) => i && line(g, pts[i - 1], q)); });
  [-0.5, 0.5].forEach(s2 => loop(g, ring(X_DS + s2, y, 6.85, 0.08, 6)));
  line(g, [X_DS - 0.5, y, 6.85], [X_DS + 0.5, y, 6.85]);
});

// --- bay conductors: the take-off from the HV bushings, the busbars between the equipment, the jumpers to the line
const cond = part("Bay Conductors", "baybus", "major");
const terms = part("Bay Terminals", "baybus", "minor");
Y.forEach((y, ph) => {
  tube(cond, [[HVX, HVY[ph], 12.4], [HVX + 2.2, HVY[ph] + (y - HVY[ph]) * 0.4, 10.4], [HVX + 4.2, y, 8.2], [X_ARR, y, ZB + 0.1]], 0.07, 8);
  tube(cond, [[X_ARR, y, ZB + 0.1], [X_CT - 0.45, y, ZB + 0.1]], 0.1, 8);
  tube(cond, [[X_CT + 0.45, y, ZB + 0.12], [X_CB - 2.95, y, ZB + 0.1]], 0.1, 8);
  tube(cond, [[X_CB + 2.95, y, ZB], [X_DS - B - 0.1, y, ZB]], 0.1, 8);
  tube(cond, [[X_DS + B + 0.1, y, ZB], [X_DS + B + 1.4, y, ZB], [X_GT - 0.9, y, 10.5], [X_GT - 0.0, y, 12.65]], 0.07, 8);
  [[X_ARR, ZB + 0.1], [X_CT - 0.45, ZB + 0.1], [X_CT + 0.45, ZB + 0.12], [X_CB - 2.95, ZB], [X_CB + 2.95, ZB], [X_DS - B - 0.1, ZB], [X_DS + B + 0.1, ZB]].forEach(([x, z]) => { cylx(terms, y, z, 0.17, x - 0.08, x + 0.08, 12); });
  [[X_CB - 2.95, 0.3], [X_CB + 2.95, -0.3]].forEach(([x, dx]) => { box(terms, x - 0.2, x + 0.2, y - 0.14, y + 0.14, CB_Z - 0.3, CB_Z + 0.3); strut(terms, [x, y, CB_Z], [x + dx, y, ZB], 0.07, 5); });
});

// =====================================================================
// GANTRY: two lattice towers, a crossbeam, tension insulator strings, the line
// =====================================================================
const tow = part("Gantry Towers", "gantry", "major");
[-9.2, 9.2].forEach(yT => {
  const hw = z => 0.85 - 0.4 * (z - PAD) / (BEAM_Z - PAD);
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => strut(tow, [X_GT + sx * hw(PAD), yT + sy * hw(PAD), PAD], [X_GT + sx * hw(BEAM_Z - 0.4), yT + sy * hw(BEAM_Z - 0.4), BEAM_Z - 0.4], 0.08, 4));
  const zs = []; for (let z = PAD; z < BEAM_Z - 0.5; z += 1.6) zs.push(z); zs.push(BEAM_Z - 0.4);
  zs.forEach((z, i) => {
    const h0 = hw(z), h1 = hw(zs[Math.min(i + 1, zs.length - 1)]);
    const c = h => [[X_GT - h, yT - h], [X_GT + h, yT - h], [X_GT + h, yT + h], [X_GT - h, yT + h]];
    const a = c(h0), b = c(h1);
    for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; line(tow, [...a[k], z], [...a[k2], z]); if (i + 1 < zs.length) { line(tow, [...a[k], z], [...b[k2], zs[i + 1]]); line(tow, [...a[k2], z], [...b[k], zs[i + 1]]); } }
  });
});
const cross = part("Gantry Crossbeam", "gantry", "major");
{
  const yA = -9.2, yB = 9.2;
  [[-0.4, 0.4], [0.4, 0.4], [0.4, -0.4], [-0.4, -0.4]].forEach(([dx, dz]) => strut(cross, [X_GT + dx, yA, BEAM_Z + dz], [X_GT + dx, yB, BEAM_Z + dz], 0.07, 4));
  const n = 24;
  for (let i = 0; i < n; i++) { const a = yA + (yB - yA) * i / n, b = yA + (yB - yA) * (i + 1) / n;
    line(cross, [X_GT - 0.4, a, BEAM_Z + 0.4], [X_GT - 0.4, b, BEAM_Z - 0.4]); line(cross, [X_GT + 0.4, a, BEAM_Z - 0.4], [X_GT + 0.4, b, BEAM_Z + 0.4]);
    line(cross, [X_GT - 0.4, a, BEAM_Z + 0.4], [X_GT + 0.4, a, BEAM_Z + 0.4]); line(cross, [X_GT - 0.4, a, BEAM_Z - 0.4], [X_GT + 0.4, a, BEAM_Z - 0.4]); }
  box(cross, X_GT - 0.5, X_GT + 0.5, yA - 0.5, yA + 0.5, BEAM_Z - 0.55, BEAM_Z - 0.4); box(cross, X_GT - 0.5, X_GT + 0.5, yB - 0.5, yB + 0.5, BEAM_Z - 0.55, BEAM_Z - 0.4);
}
const strings = part("Insulator Strings", "gantry", "major");
Y.forEach(y => {
  box(strings, X_GT - 0.12, X_GT + 0.12, y - 0.18, y + 0.18, BEAM_Z - 0.8, BEAM_Z - 0.4);
  revolve(strings, X_GT, y, (() => { const pr = [[0.05, BEAM_Z - 0.8, true]]; const n = 22, z0 = BEAM_Z - 0.8, z1 = 12.9, dz = (z1 - z0) / n; for (let i = 0; i < n; i++) { const z = z0 + i * dz; pr.push([0.05, z + dz * 0.1], [0.26, z + dz * 0.3, true], [0.24, z + dz * 0.5], [0.12, z + dz * 0.75, true], [0.05, z + dz * 0.95]); } pr.push([0.05, z1, true]); return pr; })(), 12);
  cyl(strings, X_GT, y, 0.13, 12.65, 12.9, 10); box(strings, X_GT - 0.18, X_GT + 0.18, y - 0.1, y + 0.1, 12.5, 12.65);
});
const lines3 = part("Line Conductors", "gantry", "major");
Y.forEach(y => {
  const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, x = X_GT + 0.3 + u * 10.5; pts.push([x, y, 12.55 - 0.9 * Math.sin(Math.PI * Math.min(1, u * 0.5 + 0.0)) * 0.9 - (u * u) * 0.0]); }
  tube(lines3, pts.map(q => [q[0], q[1], 12.55 - 1.4 * Math.sin(Math.PI * (q[0] - X_GT) / 21)]), 0.07, 6);
});
const ladder = part("Tower Ladder", "gantry", "minor");
{
  const yT = -9.2, x = X_GT - 0.95, h = 0.85 - 0.4 * (PAD) / (BEAM_Z - PAD);
  [-0.2, 0.2].forEach(dy => line(ladder, [x - 0.3, yT + dy - 0.6, PAD], [x - 0.3, yT + dy - 0.6, 3.6]));
  for (let z = PAD + 0.3; z < 3.6; z += 0.3) line(ladder, [x - 0.3, yT - 0.8, z], [x - 0.3, yT - 0.4, z]);
  for (let z = 2.6; z <= 3.6; z += 0.5) loop(ladder, [[x - 0.25, yT - 0.9, z], [x - 0.55, yT - 0.9, z], [x - 0.55, yT - 0.3, z], [x - 0.25, yT - 0.3, z]]);
}

// =====================================================================
// SYNCHRONISING DESK (in front), with four gauges that read the unit
// =====================================================================
const dbody = part("Desk Body", "desk", "major");
box(dbody, -6.9, -3.1, -14.0, -12.6, 0, 0.95);
extrude(dbody, polyRegion([[-14.0, 0.95], [-12.6, 0.95], [-12.6, 1.25]]).map(t => t.map(q => [q[0], q[1]])), -6.9, -3.1);
box(dbody, -6.9, -3.1, yF, -12.6, 1.25, 2.45);
box(dbody, -6.95, -3.05, yF - 0.05, -12.55, 2.45, 2.52);
[-5.0].forEach(x => line(dbody, [x, -14.0, 0], [x, -14.0, 0.95]));
[-6.0, -4.0].forEach(x => line(dbody, [x, -14.0, 0], [x, -14.0, 0.95]));
const dfaces = part("Desk Dial Faces", "desk", "minor");
const ndl = (p, cx, cz, len, tail, w, y0, y1) => withFrame(fy(cx, cz), () => extrude(p, polyRegion([[-tail, -w], [len, -w * 0.2], [len, w * 0.2], [-tail, w]]), y0, y1));
DIAL_X.forEach((x, i) => {
  cyly(dfaces, x, DIAL_Z, DIAL_R + 0.03, yF - 0.05, yF, 28);
  cyly(dfaces, x, DIAL_Z, DIAL_R - 0.03, yF - 0.06, yF - 0.05, 28);
  const full = i === 3, steps = full ? 24 : 18;
  for (let k = 0; k <= (full ? steps - 1 : steps); k++) {
    const a = full ? 2 * Math.PI * k / steps : (-135 + 270 * k / steps) * RAD, big = full ? k % 6 === 0 : k % 3 === 0;
    const r0 = DIAL_R - 0.04, r1 = r0 - (big ? 0.08 : 0.04);
    line(dfaces, [x + r0 * Math.sin(a), yF - 0.062, DIAL_Z + r0 * Math.cos(a)], [x + r1 * Math.sin(a), yF - 0.062, DIAL_Z + r1 * Math.cos(a)]);
  }
  loop(dfaces, circlePts(x, DIAL_Z, 0.045, 10).map(q => [q[0], yF - 0.07, q[1] + 0 * 0]).map(q => [q[0], q[1], DIAL_Z + (q[2] === undefined ? 0 : 0)]));
});
const ndls = [["Speed Needle", "ndl0"], ["Voltage Needle", "ndl1"], ["Power Needle", "ndl2"], ["Synchroscope Needle", "ndl3"]];
ndls.forEach(([name, sp], i) => {
  const g = part(name, "desk", "major", { spool: sp });
  ndl(g, DIAL_X[i], DIAL_Z, DIAL_R - 0.07, 0.07, 0.014, yF - 0.085, yF - 0.07);
  cyly(g, DIAL_X[i], DIAL_Z, 0.03, yF - 0.095, yF - 0.07, 10);
});
const lamps = [["Lamp Breaker", -6.55], ["Lamp Disconnector", -6.2], ["Lamp Alarm", -5.85]];
lamps.forEach(([name, x]) => { const g = part(name, "desk", "minor"); cyly(g, x, 2.28, 0.06, yF - 0.07, yF, 14); loop(g, circlePts(x, 2.28, 0.085, 16).map(q => [q[0], yF - 0.075, q[1]])); });
const mimic = part("Mimic Diagram", "desk", "minor");
{
  const z = 1.4, y = yF - 0.012, P3 = (x, zz) => [x, y, zz];
  line(mimic, P3(-6.75, z), P3(-6.55, z)); loop(mimic, circlePts(-6.4, z, 0.1, 16).map(q => P3(q[0], q[1])));
  line(mimic, P3(-6.3, z), P3(-5.8, z));
  loop(mimic, circlePts(-5.75, z, 0.08, 14).map(q => P3(q[0], q[1]))); loop(mimic, circlePts(-5.62, z, 0.08, 14).map(q => P3(q[0], q[1])));
  line(mimic, P3(-5.54, z), P3(-4.85, z)); loop(mimic, [P3(-4.85, z - 0.07), P3(-4.7, z - 0.07), P3(-4.7, z + 0.07), P3(-4.85, z + 0.07)]);
  line(mimic, P3(-4.7, z), P3(-4.4, z)); line(mimic, P3(-4.4, z), P3(-4.25, z + 0.1)); line(mimic, P3(-4.2, z), P3(-3.4, z));
  line(mimic, P3(-3.4, z), P3(-3.5, z + 0.05)); line(mimic, P3(-3.4, z), P3(-3.5, z - 0.05));
}
const dbut = part("Desk Buttons", "desk", "minor");
[-6.4, -5.95, -5.5, -5.05, -4.6, -4.15, -3.7].forEach((x, i) => { const yy = -13.45 + (i % 2) * 0.2, zz = 0.95 + (yy + 14) / 1.4 * 0.3; cyl(dbut, x, yy, 0.07, zz, zz + 0.05, 10); loop(dbut, ring(x, yy, zz + 0.051, 0.045, 8)); });
const dplate = part("Desk Nameplate", "desk", "minor");
box(dplate, -5.7, -4.3, yF - 0.1, yF - 0.05, 2.5, 2.7);
for (let i = 1; i < 3; i++) line(dplate, [-5.6, yF - 0.105, 2.5 + i * 0.065], [-4.4, yF - 0.105, 2.5 + i * 0.065]);
});

// ---------- callouts and the tour ----------
const hotspots = [
  ["Turbo-generator", "660 MW, two poles, 3,000 rpm", [-19.4, -0.3, ZA + 0.54], ["Rotor Body"]],
  ["Stator core", "Slotted laminations, cut open", [-19.4, -0.8, ZA - 1.15], ["Stator Core"]],
  ["Stator bars", "Two to a slot, 22 kV", [-22.62, 0.93 * Math.cos(cr.centres[3]), ZA + 0.93 * Math.sin(cr.centres[3])], ["Stator Bars"]],
  ["Rotor fan", "Pushes hydrogen through the machine", [-23.6, 0.2, ZA + 0.98], ["Rotor Fans"]],
  ["Brushless exciter", "Feeds the rotor with no slip rings", [-12.1, -0.3, ZA + 1.1], ["Exciter Armature", "Exciter Housing"]],
  ["Bus ducts", "Three phases at 22 kV", [-5.0, -2.02, ZD], ["Bus Duct Enclosures"]],
  ["Step-up transformer", "22 kV in, 400 kV out", [4.5, -TX.y - 0.17, 4.5], ["Transformer Tank"]],
  ["HV bushings", "Take 400 kV out of the tank", [HVX, HVY[0] - 0.34, 10.0], ["HV Bushings"]],
  ["Surge arrester", "Clips lightning overvoltages", [X_ARR, Y[0] - 0.22, 4.6], ["Arrester Insulators"]],
  ["Current transformer", "Measures the phase current", [X_CT, Y[0] - 0.4, 5.0], ["CT Insulators"]],
  ["SF6 breaker", "One interrupter cut open", [X_CB - 1.6, Y[1] + 0.47, CB_Z + 0.0], ["Cut-open Interrupter"]],
  ["Disconnector", "Centre-break blades", [X_DS - 0.75, Y[1], 6.98], ["Blade L2 West"]],
  ["Gantry", "Where the line leaves", [X_GT - 0.5, -9.2 - 0.5, 9.0], ["Gantry Towers"]],
  ["Synchronising desk", "Four gauges and three lamps", [DIAL_X[3], yF - 0.06, DIAL_Z + 0.2], ["Desk Dial Faces"]],
].map(([t, s, p, o]) => ({ t, s, p: X(p), o }));
const pt = (name, p) => [...X(p), name];
const tour = {
  points: {
    rotor: pt("Rotor Body", [-19.4, -0.3, ZA + 0.54]), stator: pt("Stator Core", [-19.4, -0.8, ZA - 1.15]), gen: pt("Stator Frame", [-19.4, 1.0, ZA + 1.8]),
    exc: pt("Exciter Housing", [-11.8, 0, ZA + 0.5]), ducts: pt("Bus Duct Enclosures", [-6.0, -1.5, ZD + 0.5]), tank: pt("Transformer Tank", [6.2, -TX.y, 4.5]),
    hv: pt("HV Bushings", [HVX, 0, 9.8]), arr: pt("Arrester Insulators", [X_ARR, Y[0], 4.6]), ct: pt("CT Insulators", [X_CT, Y[0], 5.0]), cb: pt("Breaker Heads", [X_CB, Y[0], CB_Z + 0.6]),
    ds: pt("Blade L2 West", [X_DS, Y[1], 6.9]), gantry: pt("Gantry Crossbeam", [X_GT, 0, BEAM_Z]), line: pt("Line Conductors", [X_GT + 5, 0, 11.2]), desk: pt("Desk Dial Faces", [-5.0, yF - 0.06, DIAL_Z]),
  },
  steps: [
    { t: "A generator makes the power", focus: "gen", dist: 0.55, ex: 0, p: ["gen", "exc", "desk"], n: ["Stator Frame", "Rotor Body", "Exciter Housing"], ms: 5000,
      d: "A steam turbine, drawn here only as a stub, turns a 660 megawatt generator at exactly 3,000 rpm, 50 turns a second, so the 22 kilovolt output is at 50 hertz. The unit runs by itself in a loop, from turning gear up to full load." },
    { t: "Rotor inside stator", focus: "rotor", dist: 0.32, ex: 1, p: ["rotor", "stator"], n: ["Rotor Body", "Slot Wedges", "Stator Core", "Stator Bars", "End Windings"], ms: 5400,
      d: "The two-pole rotor carries direct current in slots under steel wedges. Turning, its field sweeps the bars in the stator slots and generates the three-phase current. The exciter on the shaft end supplies the rotor's current with no brushes." },
    { t: "22 kV on three ducts", focus: "ducts", dist: 0.45, ex: 1, p: ["ducts"], n: ["Bus Duct Enclosures", "Duct Conductors", "Duct Support Insulators"], ms: 4600,
      d: "Each phase runs in its own round aluminium duct, isolated from the others, carrying about 17,000 amperes. The inner conductor sits on insulators, and the duct is earthed and bonded." },
    { t: "The transformer lifts 22 to 400 kV", focus: "tank", dist: 0.5, ex: 1, p: ["tank", "hv"], n: ["Transformer Tank", "HV Bushings", "LV Bushings", "Conservator", "Radiators"], ms: 5000,
      d: "A step-up transformer raises 22 kilovolts to 400 kilovolts, so the same power flows as a much smaller current. Its oil carries heat to the radiators and the cooler bank, and the three bushings bring 400 kV out of the tank." },
    { t: "The 400 kV bay", focus: "cb", dist: 0.5, ex: 1, p: ["arr", "ct", "cb", "ds"], n: ["Arrester Insulators", "CT Insulators", "Breaker Heads", "Interrupter Chambers", "Cut-open Interrupter", "Blade L2 West", "Blade L2 East"], ms: 6000,
      d: "Each phase passes a surge arrester, a current transformer, an SF6 circuit breaker (one interrupter shown cut open) and a centre-break disconnector. The breaker can interrupt load current; the disconnector can only isolate." },
    { t: "Why the order matters", focus: "ds", dist: 0.28, ex: 0, p: ["ds", "cb"], n: ["Blade L1 West", "Blade L1 East", "Blade L2 West", "Blade L2 East", "Blade L3 West", "Blade L3 East", "Arc L2", "Moving Contact"], ms: 6000,
      d: "Open the breaker first and the current is already gone when the blades part. Open the disconnector first, while the breaker is closed and loaded, and an arc climbs between the blades until the breaker clears it. Alternate runs of the loop show each order." },
    { t: "The line leaves", focus: "gantry", dist: 0.5, ex: 0, p: ["gantry", "line"], n: ["Gantry Towers", "Gantry Crossbeam", "Insulator Strings", "Line Conductors"], ms: 5000,
      d: "Past the disconnector each phase goes up to the gantry, hangs from a tension string of insulator discs and leaves as an overhead line. Dials on the synchronising desk read speed, voltage, power and the phase angle between the unit and the grid." },
  ],
};
const constants = {
  U, AXIS_Z: ZA * U, ROD_STROKE: 0.35 * U, CONTACT_STROKE: 0.55 * U, BLADE_MAX: 80 * RAD, B_U: B * U,
  BLADES: Y.map(y => [-1, 1].map(s => [(X_DS + s * B - XC) * U, y * U])),
  ARCS: Y.map(y => [(X_DS - XC) * U, y * U, 6.85 * U]), BLADE: { B, GAP0: 0.08 },
  FANS: FAN.map(([x, y]) => [(x - XC) * U, y * U, FAN_Z * U]),
  NEEDLES: DIAL_X.map(x => [(x - XC) * U, DIAL_Z * U, (yF - 0.08) * U]),
};
const geometry = geometryScript("PS_GEOMETRY", "powerstation/build.js", { explode, hotspots, tour, constants });
writeGeometry(HERE, geometry);
console.log(`models/powerstation/geometry.js: ${geometry.stats}`);
