/*
Mechanical watch movement: builds its geometry.

After the "Watch movement" figure in Anatomy (skills.wheresryan.sh/anatomy, by Ryan), rebuilt as a 3D blueprint model
of a manual-wind Swiss lever movement the size of a Unitas 6497 (36.6 mm across): the mainspring barrel drives the
going train (centre, third, fourth wheel), the escape wheel and pallet fork let it advance one tooth at a time, and the
balance wheel and hairspring set the pace, 18,000 beats an hour. Bridges hold the wheels' upper pivots in jewels; the
crown winds the barrel through the crown and ratchet wheels.

Generated in code (with kit/procedural.js) in mm, Z up from the main plate's underside, the centre wheel's arbor at
the origin. Each wheel is its own module based at its arbor, so model.js turns it in place at its true rate.

    node models/watch/build.js

Writes models/watch/geometry.js.
*/
"use strict";
const { withFrame, part, line, loop, circlePts, rrPts, polyRegion, stripRegion, extrude, cyl, revolve,
  r3, geometryScript, writeGeometry } = require("../../kit/procedural");

const HERE = __dirname;
const FX = q => [q[2], q[0], q[1]];   // draws in (y, z), pushes along x
// ---------- layout (mm): arbors, sizes and heights ----------
const PLATE_R = 18.3, PLATE_T = 1.5;
const C = [0, 0], BAR = [-2, 9.6], TH = [6.8, -3.6], FO = [11.2, 0.6], ES = [12.8, -5.8], PF = [10.2, -11.0], BA = [4.0, -11.6];
const BAR_R = 7.9, CW_R = 6.2, TH_R = 5.2, FO_R = 5.6, ES_R = 3.6, BAL_R = 5.6;
const Z = { centre: [1.8, 2.05], barrel: [2.4, 4.4], third: [2.4, 2.62], fourth: [2.8, 3.02], escape: [3.2, 3.42], pallet: [3.3, 3.6],
  roller: [3.35, 3.7], balance: [3.95, 4.45], hair: 4.62, bridge: [4.8, 6.0], palletBridge: [4.0, 4.7], cock: [5.1, 6.4] };
const CROWN_WHEEL = [-8.4, 4.4], STEM_Y = 4.4, STEM_Z = 3.2;
const COCK_SCREW = [-3.2, -12.6];

const explode = {
  plate: [0, 0, -7], barrel: { offset: [0, 0, 3], base: [...BAR, 0] }, centre: { offset: [0, 0, 1.2], base: [...C, 0] },
  third: { offset: [0, 0, 2.4], base: [...TH, 0] }, fourth: { offset: [0, 0, 3.4], base: [...FO, 0] }, escape: { offset: [0, 0, 4.4], base: [...ES, 0] },
  pallet: { offset: [0, 0, 5.4], base: [...PF, 0] }, balance: { offset: [0, 0, 10], base: [...BA, 0] }, hair: { offset: [0, 0, 11.5], base: [...BA, 0] },
  bridges: [0, 0, 14], cock: [0, 0, 19], winding: [0, 0, 17], stem: [-7, 0, 0],
};

// ---------- helpers: gears, hulls ----------
const ang = (p, a, r) => [p[0] + r * Math.cos(a), p[1] + r * Math.sin(a)];
// a toothed rim (outer teeth, plain inner edge) round the origin: n teeth of `depth`, rim `rim` wide
function rim(r, n, depth, rimW, club = false) {
  const outer = [], inner = [], T = 2 * Math.PI / n;
  for (let i = 0; i < n; i++) {
    const a = i * T;
    const prof = club   // the escape wheel's leaning club teeth, else a plain involute-ish tooth
      ? [[r - depth, 0], [r - depth * 0.3, 0.18], [r, 0.3], [r - 0.12, 0.42], [r - depth, 0.55]]
      : [[r - depth, 0], [r - depth * 0.2, 0.18], [r, 0.3], [r, 0.48], [r - depth * 0.2, 0.6]];
    prof.forEach(([rr, f]) => { outer.push(ang([0, 0], a + f * T, rr)); inner.push(ang([0, 0], a + f * T, r - depth - rimW)); });
  }
  outer.push(outer[0]); inner.push(inner[0]);
  return stripRegion(outer, inner);
}
// a bar from radius r0 to r1 along angle a, w wide
const spoke = (a, r0, r1, w) => {
  const d = [Math.cos(a), Math.sin(a)], n = [-d[1] * w / 2, d[0] * w / 2];
  return polyRegion([[d[0] * r0 + n[0], d[1] * r0 + n[1]], [d[0] * r1 + n[0], d[1] * r1 + n[1]], [d[0] * r1 - n[0], d[1] * r1 - n[1]], [d[0] * r0 - n[0], d[1] * r0 - n[1]]]);
};
// a wheel about the origin: toothed rim, crossed spokes, hub; and its pinion and arbor from the plate up to the bridge
function wheel(p, { r, n, z: [z0, z1], spokes = 4, pinion, pinionZ, arbor = [PLATE_T, Z.bridge[0]], club }) {
  const depth = club ? 0.9 : Math.max(0.28, r * 0.06), rimW = club ? 0.45 : 0.45;
  extrude(p, rim(r, n, depth, rimW, club), z0, z1);
  const ri = r - depth - rimW + 0.05;
  for (let k = 0; k < spokes; k++) extrude(p, spoke(k * 2 * Math.PI / spokes + 0.3, 0.6, ri, club ? 0.35 : 0.5), z0, z1);
  cyl(p, 0, 0, 0.9, z0 - 0.15, z1 + 0.15, 20);   // hub
  if (pinion) {
    const [pz0, pz1] = pinionZ;
    cyl(p, 0, 0, pinion.r, pz0, pz1, pinion.leaves * 2);
    for (let k = 0; k < pinion.leaves; k++) { const a = 2 * Math.PI * k / pinion.leaves; line(p, [pinion.r * Math.cos(a) * 1.01, pinion.r * Math.sin(a) * 1.01, pz0], [pinion.r * Math.cos(a) * 1.01, pinion.r * Math.sin(a) * 1.01, pz1]); }
  }
  cyl(p, 0, 0, 0.3, arbor[0], arbor[1], 10);   // arbor and pivots
}
// the convex hull round some circles, for bridge outlines
function hull(circles, n = 24) {
  const pts = [];
  circles.forEach(([x, y, r]) => circlePts(x, y, r, n).forEach(q => pts.push(q)));
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  pts.forEach(p => { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); });
  pts.slice().reverse().forEach(p => { while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); });
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}
const screwHead = (p, [x, y], z, r = 1.1, a = 0.6) => { cyl(p, x, y, r, z, z + 0.45, 20); const d = [Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8]; line(p, [x - d[0], y - d[1], z + 0.5], [x + d[0], y + d[1], z + 0.5]); };
const jewel = (p, [x, y], z) => { cyl(p, x, y, 0.95, z, z + 0.08, 20); loop(p, circlePts(x, y, 0.35, 12).map(q => [...q, z + 0.1])); };

// ---------- the main plate ----------
const plate = part("Main Plate", "plate", "major");
revolve(plate, 0, 0, [[0, 0], [PLATE_R - 0.3, 0, true], [PLATE_R, 0.3], [PLATE_R, PLATE_T - 0.3, true], [PLATE_R - 0.3, PLATE_T, true], [0, PLATE_T]], 120);
loop(plate, circlePts(0, 0, PLATE_R - 1.2, 120).map(q => [...q, PLATE_T + 0.03]));   // the recess for the dial's feet
[[-14, -8], [15.5, 7], [-6, -15.8], [2, 16.5]].forEach(([x, y]) => loop(plate, circlePts(x, y, 0.7, 12).map(q => [...q, PLATE_T + 0.03])));   // case screw holes
const pillars = part("Pillars", "plate", "minor");
[[-9.5, 14.5], [7.5, 12.5], [-9.5, 0.5], [16.4, -3], [13.5, 6.5], [7.4, -14.6], [-3.2, -12.6], [14.4, -12.5]].forEach(([x, y]) => cyl(pillars, x, y, 0.9, PLATE_T, Z.bridge[0], 16));

// ---------- the going train (each about its own arbor) ----------
const barrel = part("Mainspring Barrel", "barrel", "major", { spool: "barrel" });
{
  extrude(barrel, rim(BAR_R, 80, 0.32, 0.5), Z.barrel[0], Z.barrel[0] + 0.5);   // the toothed flange that drives the centre pinion
  revolve(barrel, 0, 0, [[BAR_R - 0.6, Z.barrel[0] + 0.5, true], [BAR_R - 0.6, Z.barrel[1] - 0.2, true], [BAR_R - 0.8, Z.barrel[1], true], [0, Z.barrel[1]]], 72);
  revolve(barrel, 0, 0, [[0, Z.barrel[0]], [BAR_R - 0.82, Z.barrel[0], true]], 72);
  cyl(barrel, 0, 0, 1.6, PLATE_T, Z.barrel[1] + 0.3, 24);   // arbor
  loop(barrel, circlePts(0, 0, BAR_R - 1.6, 72).map(q => [...q, Z.barrel[1] + 0.03]));   // the cover's snap line
}
const spring = part("Mainspring", "barrel", "minor", { spool: "barrel" });
{
  const z = Z.barrel[1] + 0.05;   // drawn through the cover, as in the X-ray: a spiral of 14 turns round the arbor
  let prev = null;
  for (let i = 0; i <= 14 * 48; i++) {
    const a = 2 * Math.PI * i / 48, r = 1.9 + (BAR_R - 2.8) * i / (14 * 48), q = [r * Math.cos(a), r * Math.sin(a), z];
    if (prev && i % 2 === 0) { line(spring, prev, q); prev = q; } else if (!prev) prev = q;
  }
}
const centre = part("Centre Wheel", "centre", "major", { spool: "centre" });
wheel(centre, { r: CW_R, n: 80, z: Z.centre, pinion: { r: 1.8, leaves: 12 }, pinionZ: [Z.barrel[0] - 0.1, Z.barrel[0] + 0.6], arbor: [0, Z.bridge[0] + 0.4] });
const third = part("Third Wheel", "third", "major", { spool: "third" });
wheel(third, { r: TH_R, n: 75, z: Z.third, pinion: { r: 1.3, leaves: 10 }, pinionZ: [Z.centre[0] - 0.1, Z.centre[1] + 0.1] });
const fourth = part("Fourth Wheel", "fourth", "major", { spool: "fourth" });
wheel(fourth, { r: FO_R, n: 80, z: Z.fourth, pinion: { r: 1.0, leaves: 8 }, pinionZ: [Z.third[0] - 0.1, Z.third[1] + 0.1], arbor: [0, Z.bridge[1] + 0.6] });
const escape = part("Escape Wheel", "escape", "major", { spool: "escape" });
wheel(escape, { r: ES_R, n: 15, z: Z.escape, spokes: 5, club: true, pinion: { r: 0.9, leaves: 7 }, pinionZ: [Z.fourth[0] - 0.1, Z.fourth[1] + 0.1] });

// ---------- the escapement: pallet fork, balance, hairspring ----------
const toE = Math.atan2(ES[1] - PF[1], ES[0] - PF[0]), toB = Math.atan2(BA[1] - PF[1], BA[0] - PF[0]);
const dE = Math.hypot(ES[0] - PF[0], ES[1] - PF[1]), dB = Math.hypot(BA[0] - PF[0], BA[1] - PF[1]);
const fork = part("Pallet Fork", "pallet", "major", { spool: "pallet" });
{
  const [z0, z1] = Z.pallet;
  extrude(fork, spoke(toB, 0, dB - 1.5, 0.55), z0, z1);                                     // the lever, towards the balance
  [-0.38, 0.38].forEach(o => extrude(fork, spoke(toB + o * 0.17, dB - 1.9, dB - 0.95, 0.35), z0, z1));   // the fork's horns
  [-1, 1].forEach(s => extrude(fork, spoke(toE + s * 0.62, 0, dE - ES_R + 0.6, 0.6), z0, z1));          // the two arms, astride the escape wheel
  cyl(fork, 0, 0, 0.7, z0, z1, 16);
  cyl(fork, 0, 0, 0.25, PLATE_T, Z.palletBridge[0], 10);                                    // its arbor
}
const stones = part("Pallet Stones", "pallet", "minor", { spool: "pallet" });
[-1, 1].forEach(s => {
  const a = toE + s * 0.62, r = dE - ES_R + 0.6, c = [r * Math.cos(a), r * Math.sin(a)];
  extrude(stones, spoke(a, r - 0.2, r + 0.55, 0.42), Z.pallet[0] - 0.05, Z.pallet[1] + 0.05);
  loop(stones, circlePts(c[0], c[1], 0.12, 6).map(q => [...q, Z.pallet[1] + 0.1]));
});
const balance = part("Balance Wheel", "balance", "major", { spool: "balance" });
{
  const [z0, z1] = Z.balance, n = 72;
  extrude(balance, stripRegion([...circlePts(0, 0, BAL_R, n), [BAL_R, 0]], [...circlePts(0, 0, BAL_R - 0.55, n), [BAL_R - 0.55, 0]]), z0, z1);
  [0, Math.PI].forEach(a => extrude(balance, spoke(a, 0, BAL_R - 0.5, 0.55), z0, z0 + 0.3));   // the arm
  for (let k = 0; k < 12; k++) { const a = 2 * Math.PI * k / 12 + 0.26; withFrame(q => { const c = Math.cos(a), s = Math.sin(a); return [q[2] * c - q[0] * s, q[2] * s + q[0] * c, q[1]]; }, () => cyl(balance, 0, (z0 + z1) / 2, 0.32, BAL_R, BAL_R + 0.6, 10)); }   // timing screws
  cyl(balance, 0, 0, 0.6, Z.roller[1], z1, 16);                                               // hub
  cyl(balance, 0, 0, 1.2, Z.roller[0], Z.roller[1], 28);                                      // the roller table
  const rj = [-Math.cos(toB) * 1.05, -Math.sin(toB) * 1.05];
  cyl(balance, rj[0], rj[1], 0.16, Z.roller[0] - 0.2, Z.roller[0], 8);                        // the impulse jewel the fork catches
  cyl(balance, 0, 0, 0.22, PLATE_T, Z.cock[0], 10);                                            // the staff
}
const hair = part("Hairspring", "hair", "minor", { spool: "hair" });
{
  const turns = 12, N = turns * 40, z = Z.hair;
  let prev = null;
  for (let i = 0; i <= N; i++) { const a = 2 * Math.PI * i / 40, r = 0.8 + 3.3 * i / N, q = [r * Math.cos(a), r * Math.sin(a), z]; if (prev) line(hair, prev, q); prev = q; }
  cyl(hair, 0, 0, 0.55, z - 0.15, z + 0.15, 14);   // the collet on the staff
}

// ---------- bridges, cock, jewels, screws ----------
const barrelBridge = part("Barrel Bridge", "bridges", "major");
const BB = hull([[BAR[0], BAR[1], BAR_R + 0.6], [C[0], C[1], 2.4], [-9.5, 0.5, 1.6], [7.5, 12.5, 1.8]]);
extrude(barrelBridge, polyRegion(BB), Z.bridge[0], Z.bridge[1]);
const trainBridge = part("Train Bridge", "bridges", "major");
const TB = hull([[TH[0], TH[1], 2.2], [FO[0], FO[1], 2.4], [ES[0], ES[1], 2.2], [16.4, -3, 1.7], [13.5, 6.5, 1.7]]);
extrude(trainBridge, polyRegion(TB), Z.bridge[0], Z.bridge[1]);
for (let k = 0; k < 7; k++) line(trainBridge, [TH[0] - 1 + k * 1.6, TH[1] - 2 + k * 0.2, Z.bridge[1] + 0.02], [TH[0] + 1 + k * 1.6, TH[1] + 4.5 + k * 0.2, Z.bridge[1] + 0.02]);   // Côtes de Genève stripes
const palletBridge = part("Pallet Bridge", "bridges", "minor");
extrude(palletBridge, polyRegion(hull([[PF[0], PF[1], 1.3], [14.4, -12.5, 1.2]])), Z.palletBridge[0], Z.palletBridge[1]);
const cock = part("Balance Cock", "cock", "major");
extrude(cock, polyRegion(hull([[BA[0], BA[1], 2.4], [COCK_SCREW[0], COCK_SCREW[1], 1.8]])), Z.cock[0], Z.cock[1]);
cyl(cock, COCK_SCREW[0], COCK_SCREW[1], 1.8, PLATE_T, Z.cock[0], 20);   // the cock's foot
const regulator = part("Regulator", "cock", "minor");
extrude(regulator, spoke(-0.35, 0, 7.5, 0.6).map(t => t.map(([x, y]) => [x + BA[0], y + BA[1]])), Z.cock[1], Z.cock[1] + 0.25);
cyl(regulator, BA[0], BA[1], 1.5, Z.cock[1], Z.cock[1] + 0.25, 24);
for (let k = -4; k <= 4; k++) { const a = -0.35 + k * 0.06; line(regulator, [BA[0] + 6.4 * Math.cos(a), BA[1] + 6.4 * Math.sin(a), Z.cock[1] + 0.05], [BA[0] + (k % 2 ? 6.8 : 7.1) * Math.cos(a), BA[1] + (k % 2 ? 6.8 : 7.1) * Math.sin(a), Z.cock[1] + 0.05]); }   // + / − scale
const jewels = part("Jewels", "bridges", "minor");
[C, TH, FO, ES].forEach(p => jewel(jewels, p, Z.bridge[1]));
jewel(jewels, PF, Z.palletBridge[1]);
const capstone = part("Balance Jewel", "cock", "minor");
jewel(capstone, BA, Z.cock[1] + 0.25);
const screws = part("Screws", "bridges", "minor");
[[-9.5, 14.5], [7.5, 12.5], [-9.5, 0.5], [16.4, -3], [13.5, 6.5]].forEach((p, i) => screwHead(screws, p, Z.bridge[1], 1.1, 0.4 + i));
screwHead(screws, [14.4, -12.5], Z.palletBridge[1], 0.8, 1.2);
const cockScrew = part("Cock Screw", "cock", "minor");
screwHead(cockScrew, COCK_SCREW, Z.cock[1], 1.2, 2.2);

// ---------- winding: ratchet wheel, crown wheel, click, stem and crown ----------
const ratchet = part("Ratchet Wheel", "winding", "major");
{
  const outer = [], inner = [], n = 40, T = 2 * Math.PI / n;
  for (let i = 0; i < n; i++) { const a = i * T; [[5.6, 0], [5.0, 0.95]].forEach(([r, f]) => { outer.push(ang(BAR, a + f * T, r)); inner.push(ang(BAR, a + f * T, 1.2)); }); }   // saw teeth
  extrude(ratchet, polyRegion(outer), Z.bridge[1], Z.bridge[1] + 0.5);
  screwHead(ratchet, BAR, Z.bridge[1] + 0.5, 1.5, 0.9);
}
const crownWheel = part("Crown Wheel", "winding", "minor");
extrude(crownWheel, rim(2.9, 30, 0.3, 0.6).map(t => t.map(([x, y]) => [x + CROWN_WHEEL[0], y + CROWN_WHEEL[1]])), Z.bridge[1], Z.bridge[1] + 0.45);
screwHead(crownWheel, CROWN_WHEEL, Z.bridge[1] + 0.45, 1.0, 2);
const click = part("Click", "winding", "minor");
extrude(click, polyRegion([[1.4, 15.6], [3.8, 14.6], [4.4, 14.2], [3.6, 15.4], [1.6, 16.4]]), Z.bridge[1], Z.bridge[1] + 0.35);
line(click, [-0.5, 16.9, Z.bridge[1] + 0.05], [1.5, 16.0, Z.bridge[1] + 0.05]);   // its spring
const stem = part("Winding Stem", "stem", "minor");
withFrame(FX, () => cyl(stem, STEM_Y, STEM_Z, 0.55, -PLATE_R - 1.2, CROWN_WHEEL[0] - 1, 14));
withFrame(FX, () => cyl(stem, STEM_Y, STEM_Z, 0.9, CROWN_WHEEL[0] - 3.2, CROWN_WHEEL[0] - 1.2, 16));   // the winding pinion
const crown = part("Crown", "stem", "major");
withFrame(FX, () => {
  revolve(crown, STEM_Y, STEM_Z, [[0, -PLATE_R - 1.2], [2.0, -PLATE_R - 1.2, true], [3.1, -PLATE_R - 1.8, true], [3.1, -PLATE_R - 4.6, true], [2.6, -PLATE_R - 5.2, true], [0, -PLATE_R - 5.2]], 40);
  for (let k = 0; k < 30; k++) { const a = 2 * Math.PI * k / 30; line(crown, [STEM_Y + 3.13 * Math.cos(a), STEM_Z + 3.13 * Math.sin(a), -PLATE_R - 2], [STEM_Y + 3.13 * Math.cos(a), STEM_Z + 3.13 * Math.sin(a), -PLATE_R - 4.4]); }
});

// ---------- callouts and the tour ----------
const BASES = { "Mainspring Barrel": BAR, "Mainspring": BAR, "Centre Wheel": C, "Third Wheel": TH, "Fourth Wheel": FO, "Escape Wheel": ES,
  "Pallet Fork": PF, "Pallet Stones": PF, "Balance Wheel": BA, "Hairspring": BA };
const local = (name, p) => r3(BASES[name] ? [p[0] - BASES[name][0], p[1] - BASES[name][1], p[2]] : p);
const hotspots = [
  ["Mainspring barrel", "About 40 hours of power", [BAR[0] - BAR_R + 0.6, BAR[1], Z.barrel[1] - 0.5], ["Mainspring Barrel", "Mainspring"]],
  ["Centre wheel", "Turns once an hour", [C[0] + CW_R, C[1], Z.centre[1]], ["Centre Wheel"]],
  ["Fourth wheel", "Turns once a minute: the seconds", [FO[0] + FO_R, FO[1], Z.fourth[1]], ["Fourth Wheel"]],
  ["Escape wheel", "15 teeth, one half-tooth a beat", [ES[0] + ES_R, ES[1], Z.escape[1]], ["Escape Wheel"]],
  ["Pallet fork", "Locks and releases the escape wheel", [PF[0], PF[1], Z.pallet[1]], ["Pallet Fork", "Pallet Stones"]],
  ["Balance wheel", "Swings 5 times a second", [BA[0] - BAL_R, BA[1], Z.balance[1]], ["Balance Wheel"]],
  ["Hairspring", "Returns the balance: the watch's pace", [BA[0] + 2.5, BA[1] + 2.5, Z.hair], ["Hairspring"]],
  ["Regulator", "Fast or slow, by a fraction", [BA[0] + 7 * Math.cos(-0.35), BA[1] + 7 * Math.sin(-0.35), Z.cock[1] + 0.25], ["Regulator"]],
  ["Jewels", "Rubies the pivots run in", [TH[0], TH[1], Z.bridge[1] + 0.1], ["Jewels"]],
  ["Crown", "Winds the mainspring", [-PLATE_R - 3.2, STEM_Y + 3.1, STEM_Z], ["Crown"]],
].map(([t, s, p, o]) => ({ t, s, p: local(o[0], p), o }));
const pt = (name, p) => [...local(name, p), name];
const tour = {
  points: {
    crown: pt("Crown", [-PLATE_R - 3.2, STEM_Y, STEM_Z]), ratchet: pt("Ratchet Wheel", [BAR[0], BAR[1], Z.bridge[1] + 0.5]), barrel: pt("Mainspring Barrel", [BAR[0], BAR[1], Z.barrel[1]]),
    centre: pt("Centre Wheel", [C[0], C[1], Z.centre[1]]), third: pt("Third Wheel", [TH[0], TH[1], Z.third[1]]), fourth: pt("Fourth Wheel", [FO[0], FO[1], Z.fourth[1]]),
    escape: pt("Escape Wheel", [ES[0], ES[1], Z.escape[1]]), fork: pt("Pallet Fork", [PF[0], PF[1], Z.pallet[1]]), balance: pt("Balance Wheel", [BA[0], BA[1], Z.balance[1]]),
    hair: pt("Hairspring", [BA[0], BA[1], Z.hair]), cock: pt("Balance Cock", [BA[0], BA[1], Z.cock[1]]),
  },
  steps: [
    { t: "Winding stores the power", focus: "barrel", dist: 0.55, ex: 1, p: ["crown", "ratchet", "barrel"], n: ["Crown", "Winding Stem", "Crown Wheel", "Ratchet Wheel", "Click", "Mainspring", "Mainspring Barrel"], ms: 4600,
      d: "Turning the crown turns the crown wheel and the ratchet wheel, which coils the mainspring tight round the barrel's arbor. The click stops it unwinding backwards." },
    { t: "The going train", focus: "third", dist: 0.6, ex: 1, p: ["barrel", "centre", "third", "fourth"], n: ["Mainspring Barrel", "Centre Wheel", "Third Wheel", "Fourth Wheel"], ms: 4600,
      d: "As the spring unwinds the barrel turns slowly, and each wheel drives a small pinion on the next: the centre wheel turns once an hour, the fourth wheel once a minute." },
    { t: "The escapement lets it out", focus: "escape", dist: 0.42, ex: 1, p: ["fourth", "escape", "fork"], n: ["Escape Wheel", "Pallet Fork", "Pallet Stones"], ms: 4600,
      d: "Left alone the train would spin down in seconds. The pallet fork's two ruby stones lock the escape wheel and release it half a tooth at a time." },
    { t: "The balance keeps time", focus: "balance", dist: 0.42, ex: 1, p: ["balance", "hair", "fork"], n: ["Balance Wheel", "Hairspring", "Pallet Fork"], ms: 4800,
      d: "The balance swings to and fro on its hairspring 2.5 times a second. Each swing flips the fork, which frees one tooth and gives the balance a small push to keep it going: 18,000 beats an hour." },
    { t: "Jewels and regulation", focus: "cock", dist: 0.5, ex: 0, p: ["cock", "escape", "fourth"], n: ["Jewels", "Balance Jewel", "Regulator", "Balance Cock"], ms: 4200,
      d: "Every fast pivot runs in a synthetic ruby, hard and slippery, so it barely wears. The regulator's arm shortens or lengthens the hairspring a fraction to make the watch gain or lose." },
  ],
};

const geometry = geometryScript("WM_GEOMETRY", "watch/build.js", { explode, hotspots, tour, constants: { BAR, C, TH, FO, ES, PF, BA } });
writeGeometry(HERE, geometry);
console.log(`models/watch/geometry.js: ${geometry.stats}`);
