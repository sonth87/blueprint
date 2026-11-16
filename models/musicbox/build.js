/*
Cylinder music box: builds its geometry.

A classic wind-up music box about 190 x 115 x 80 mm closed, drawn with its hinged lid raised to 100 degrees: a wooden
case on four bun feet; a brass bedplate with the pinned brass cylinder (28 mm across, 100 mm long) turning in two
standards; the 30-tooth steel comb on its cast seat, with lead weights on the longest teeth and a damper wire; a
spring motor (barrel, mainspring, ratchet and click, a butterfly winding key outside the case); and the gear train
to a worm-and-fly governor, with a start/stop lever whose brake finger stops the fly.

The tune ("Ode to Joy", Beethoven, public domain) is played by the pins: this script lays the notes out in time (a
revolution is 8 s), computes every pin's angle on the cylinder and the tooth (position along it) it plucks, and passes
the times each tooth is struck to model.js, so the drawing and the motion come from the same list.

Generated in code (with kit/procedural.js) in mm: X across the front, Y towards the back (the hinge), Z up from the
feet. Parts that move are drawn about their own axis and based there (spools): the cylinder and its gears, the
barrel, the intermediate shaft, the worm wheel, the fly and every tooth (about its root).

    node models/musicbox/build.js

Writes models/musicbox/geometry.js.
*/
"use strict";
const { withFrame, part, line, loop, rrPts, circlePts, rrRegion, rect, polyRegion, fanRegion, stripRegion, extrude, rrBody, cyl, revolve,
  r3, geometryScript, writeGeometry } = require("../../kit/procedural");

const HERE = __dirname;
const GF = q => [q[2], q[0], q[1]];   // draws in (y, z), pushes along x
const GY = q => [q[0], q[2], q[1]];   // draws in (x, z), pushes along y
const D = Math.PI / 180;
const BASES = {};
const mk = (name, module, kind, spool, base) => { if (base) BASES[name] = base; return part(name, module, kind, spool ? { spool } : undefined); };
const shift = (b, fn) => withFrame(q => [q[0] - b[0], q[1] - b[1], q[2] - b[2]], fn);

// ---------- layout (mm) ----------
const W = 190, DEP = 115, HW = W / 2, HD = DEP / 2, WALL = 8;     // outer size, half sizes, wall thickness
const FOOT = 6, FLOOR0 = 8, FLOOR = 12, RIM = 60, LIDTOP = 80;     // feet height, floor panel bottom/top, tray top, lid top
const ZB = 17.5, PLATE_T = 2;                                      // bedplate top and thickness
const YC = 10, ZC = 38.5, RC = 14, RP = 16.2, PIN_R = 0.6;          // cylinder axis, radius, pin tip radius
const CYL_X = 50;                                                   // cylinder half length
const REV = 8, OMEGA = 2 * Math.PI / REV;                           // one turn in 8 s
const M = 0.7;                                                      // gear module
// the comb
const NT = 30, PITCH = 3.33, X0 = -48.3, TW = 2.7, TT = 1.3, TZ0 = ZC + 7.2, TZ1 = TZ0 + TT;
const PHI0 = Math.asin((TZ0 - ZC) / RP);                            // where a pin meets the tooth, measured from straight up
const TIPY = YC - RP * Math.cos(PHI0) + 1.5;
// diatonic scale from C4: tooth k is degree k; semitones above C4
const SEMI = k => [0, 2, 4, 5, 7, 9, 11][k % 7] + 12 * Math.floor(k / 7);
const TOOTH = Array.from({ length: NT }, (_, k) => {
  const L = 36 * Math.pow(2, -SEMI(k) / 24);                         // length for f ~ 1/L^2 (the bass teeth are also weighted)
  return { k, x: X0 + PITCH * k, L, root: TIPY - L, f: 261.63 * Math.pow(2, SEMI(k) / 12) };
});
// gears: all axes along X, in the (y, z) plane
const CG = { n: 40, slice: [64.5, 67] }, P2 = { n: 10, slice: [64.5, 67] }, W2 = { n: 30, slice: [68.5, 71] }, G3 = { n: 10, slice: [68.5, 71] };
const CP = { n: 10, slice: [-65.5, -63] }, BG = { n: 40, slice: [-65.5, -63] };
const rpOf = g => g.n * M / 2;
const AL2 = -10 * D, AL3 = 60 * D, ALB = 8 * D;
const S2 = [YC + (rpOf(CG) + rpOf(P2)) * Math.cos(AL2), ZC + (rpOf(CG) + rpOf(P2)) * Math.sin(AL2)];
const S3 = [S2[0] + (rpOf(W2) + rpOf(G3)) * Math.cos(AL3), S2[1] + (rpOf(W2) + rpOf(G3)) * Math.sin(AL3)];
const BAR = [YC + (rpOf(CP) + rpOf(BG)) * Math.cos(ALB), ZC + (rpOf(CP) + rpOf(BG)) * Math.sin(ALB)];   // the barrel's axis (y, z)
const XB = (W2.slice[0] + W2.slice[1]) / 2, RW = 1.4, ZG = S3[1] + rpOf(G3) + RW;   // the governor shaft (along Y) at x = XB, height ZG
const FLY_Y = 43.6;
// mesh phase: gear B (n teeth nB) turning against gear A (phase pa, nA), B lying at angle al from A
const frac = v => v - Math.floor(v);
const meshPhase = (pa, nA, al, nB) => { const pA = 2 * Math.PI / nA, pB = 2 * Math.PI / nB; return al + Math.PI - pB * (0.5 - frac((al - pa) / pA)); };
CG.ph = 0; P2.ph = meshPhase(CG.ph, CG.n, AL2, P2.n);
W2.ph = 0; G3.ph = meshPhase(W2.ph, W2.n, AL3, G3.n);
CP.ph = 0; BG.ph = meshPhase(CP.ph, CP.n, ALB, BG.n);

const explode = {
  feet: [0, 0, -30], case: [0, 0, -12], bedplate: [0, 0, 8],
  lid: [0, 48, 52], comb: [0, -46, 40],
  cylinder: { offset: [0, 0, 68], base: [0, YC, ZC] },
  cg: { offset: [40, 0, 68], base: [0, YC, ZC] }, cp: { offset: [-34, 0, 68], base: [0, YC, ZC] },
  s2: { offset: [30, 0, 36], base: [0, S2[0], S2[1]] }, s3: { offset: [30, 0, 52], base: [0, S3[0], S3[1]] },
  gov: { offset: [30, 14, 66], base: [XB, 0, ZG] }, lever: [34, 0, 40],
  barrel: { offset: [-30, 0, 56], base: [0, BAR[0], BAR[1]] }, motor: [-22, 0, 26], key: [-66, 0, 26],
};
TOOTH.forEach(t => { explode["tooth" + t.k] = { offset: [0, -46, 40], base: [t.x, t.root, TZ0] }; });

// ---------- the tune: Ode to Joy, laid out in time ----------
const BEAT = REV / 32;
const melody = [];   // [degree from C4, start beat]
{
  const C = 7, Dd = 8, E = 9, F = 10, G = 11;
  const phrase = (o, last) => {
    [E, E, F, G, G, F, E, Dd, C, C, Dd, E].forEach((d, i) => melody.push([d, o + i]));
    melody.push([last[0], o + 12], [last[1], o + 13.5], [last[1], o + 14]);
  };
  phrase(0, [E, Dd]); phrase(16, [Dd, C]);
}
const events = [];   // { k, t } seconds into the revolution
const hit = (k, beat) => { if (k >= 0 && k < NT) events.push({ k, t: ((beat * BEAT) % REV + REV) % REV }); };
melody.forEach(([d, b]) => {
  hit(d, b); hit(d - 7, b);                    // the melody and its octave below
  hit(d + 7, b);                               // and above
  if (b % 2 === 0) hit(d - 2, b);              // a third below, on the strong beats
  hit(d + 2, b + 0.5); hit(d - 5, b + 0.5);   // and an echo half a beat later
});
for (let bt = 0; bt < 32; bt++) {              // the left hand: a broken chord in sixteenths
  const bar = Math.floor(bt / 4);
  const g = bar === 7 ? (bt < 30 ? 1 : 0) : bar % 2;     // 0: C chord, 1: G chord
  const tones = g ? [4, 6, 8] : [0, 2, 4];
  [0, 1, 2, 1].forEach((ti, s) => { hit(tones[ti], bt + s / 4); hit(tones[ti] + 7, bt + s / 4); hit(tones[ti] + 14, bt + s / 4); });
}
const byTooth = TOOTH.map(() => []);
events.sort((a, b) => a.t - b.t).forEach(e => {
  const l = byTooth[e.k], gap = 0.2;
  const last = l.length ? l[l.length - 1] : null;
  if (last !== null && (Math.abs(e.t - last) < gap || false)) return;
  if (l.length && REV - e.t + l[0] < gap) return;
  l.push(e.t);
});
const PINS = [];
byTooth.forEach((l, k) => l.forEach(t => PINS.push({ k, t, a: PHI0 + 2 * Math.PI * t / REV })));

// ---------- helpers ----------
const ringPts = (cx, cy, r, n, z) => circlePts(cx, cy, r, n).map(q => [q[0], q[1], z]);
const screwHead = (p, [x, y], z, r = 2, a = 0.6) => {
  cyl(p, x, y, r, z, z + 0.7, 16);
  const d = [Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75];
  line(p, [x - d[0], y - d[1], z + 0.75], [x + d[0], y + d[1], z + 0.75]);
};
// the toothed outline of a gear, round the origin
function gearOuter(n, rp, phase) {
  const T = 2 * Math.PI / n, pts = [], rt = rp + M, rr = rp - 1.25 * M;
  for (let i = 0; i < n; i++) {
    const c = phase + i * T;
    [[-0.26, rr], [-0.14, rt], [0.14, rt], [0.26, rr]].forEach(([f, r]) => pts.push([r * Math.cos(c + f * T), r * Math.sin(c + f * T)]));
  }
  return pts;
}
// a gear about the origin (drawn in (y, z), along x from x0 to x1): solid, or with a rim, five spokes and a hub
function gear(p, g, x0, x1, o = {}) {
  const rp = rpOf(g);
  withFrame(GF, () => {
    const pts = gearOuter(g.n, rp, g.ph);
    if (!o.spokes) { extrude(p, fanRegion(pts), x0, x1); return; }
    const rin = rp - 1.25 * M - 1.3, inner = pts.map(q => { const r = Math.hypot(q[0], q[1]); return [q[0] * rin / r, q[1] * rin / r]; });
    extrude(p, stripRegion([...pts, pts[0]], [...inner, inner[0]]), x0, x1);
    for (let k = 0; k < o.spokes; k++) {
      const a = 2 * Math.PI * k / o.spokes + 0.3, d = [Math.cos(a), Math.sin(a)], nn = [-d[1] * 0.9, d[0] * 0.9];
      extrude(p, polyRegion([[d[0] * 2.4 + nn[0], d[1] * 2.4 + nn[1]], [d[0] * (rin + 0.05) + nn[0], d[1] * (rin + 0.05) + nn[1]], [d[0] * (rin + 0.05) - nn[0], d[1] * (rin + 0.05) - nn[1]], [d[0] * 2.4 - nn[0], d[1] * 2.4 - nn[1]]]), x0, x1);
    }
    cyl(p, 0, 0, 2.6, x0 - 0.3, x1 + 0.3, 20);
  });
}
// a plate outline in (y, z) pushed along x
const plateX = (p, pts, x0, x1) => withFrame(GF, () => extrude(p, polyRegion(pts), x0, x1));
const bushing = (p, y, z, x, r = 2.6) => withFrame(GF, () => { loop(p, ringPts(y, z, r, 20, x)); loop(p, ringPts(y, z, r * 0.6, 14, x)); });

// ---------- the wooden case ----------
const floor = mk("Tray Floor", "case", "major");
extrude(floor, rrRegion(0, 0, HW - 4, HD - 4, 2, 4), FLOOR0, FLOOR);
loop(floor, rrPts(0, 0, HW - WALL, HD - WALL, 1, 3).map(q => [...q, FLOOR + 0.04]));
const IXL = 76;   // bedplate posts
const WALLS = [["Left Wall", -HW], ["Right Wall", HW - WALL]];
const key = { y: BAR[0], z: BAR[1] }, slot = [30, 46, 50.5, 54.5];
WALLS.forEach(([name, x0], i) => {
  const w = mk(name, "case", "major");
  const hole = i === 0 ? [[key.y - 4, key.y + 4, key.z - 4, key.z + 4]] : [slot];
  withFrame(GF, () => extrude(w, rrRegion(0, (FOOT + RIM) / 2, HD, (RIM - FOOT) / 2, 0, 1, hole), x0, x0 + WALL));
});
[["Front Wall", -HD], ["Back Wall", HD - WALL]].forEach(([name, y0]) => {
  const w = mk(name, "case", "major");
  withFrame(GY, () => extrude(w, rrRegion(0, (FOOT + RIM) / 2, HW - WALL, (RIM - FOOT) / 2, 0, 1), y0, y0 + WALL));
});
const dove = mk("Dovetail Joints", "case", "minor");
[-1, 1].forEach(sx => [-1, 1].forEach(sy => {
  for (let j = 0; j < 5; j++) {
    const za = FOOT + 10.8 * j + 1.8, zb = za + 7.2, x = sx * (HW + 0.05), y1 = sy * HD, y2 = sy * (HD - WALL);
    loop(dove, [[x, y1, za], [x, y2, za + 1.6], [x, y2, zb - 1.6], [x, y1, zb]]);
  }
}));
const mould = mk("Panel Mouldings", "case", "minor");
[[-1, "front"], [1, "back"]].forEach(([s]) => [0, 2.2].forEach(ins => {
  const hw = 78 - ins, hh = 18.5 - ins;
  loop(mould, rrPts(0, 33.5, hw, hh, 3, 4).map(q => [q[0], s * (HD + 0.05), q[1]]));
}));
[-1, 1].forEach(s => [0, 2.2].forEach(ins => loop(mould, rrPts(0, 33.5, 38 - ins, 18.5 - ins, 3, 4).map(q => [s * (HW + 0.05), q[0], q[1]]))));
const lip = mk("Brass Lip", "case", "major");
extrude(lip, rrRegion(0, 0, HW, HD, 0, 1, [[-HW + 2.2, HW - 2.2, -HD + 2.2, HD - 2.2]]), RIM - 0.9, RIM);
const feet = mk("Bun Feet", "feet", "major");
[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => revolve(feet, sx * 82, sy * 50.5, [[0, 0], [4.8, 0, true], [5.8, 0.9], [6.3, 2.4, true], [5.9, 4.4], [4.6, FOOT, true], [0, FOOT]], 24));
const esc = mk("Key Escutcheon", "case", "minor");
withFrame(GF, () => {
  extrude(esc, rrRegion(key.y, key.z, 9, 9, 2, 4, [[key.y - 4, key.y + 4, key.z - 4, key.z + 4]]), -HW - 0.8, -HW);
  [[-7, -7], [7, 7]].forEach(([dy, dz]) => { loop(esc, ringPts(key.y + dy, key.z + dz, 1.0, 10, -HW - 0.85)); });
});
const lesc = mk("Lever Escutcheon", "case", "minor");
withFrame(GF, () => {
  extrude(lesc, rrRegion(38, 52.5, 11, 5.5, 1.5, 4, [slot]), HW, HW + 0.8);
  [[29, 52.5], [47, 52.5]].forEach(([y, z]) => loop(lesc, ringPts(y, z, 0.9, 10, HW + 0.85)));
});
const posts = mk("Bedplate Posts", "case", "minor");
[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => cyl(posts, sx * IXL, sy * 40, 3.2, FLOOR, ZB - PLATE_T, 18));

// ---------- hinges and hasp (case halves) ----------
const HY = HD + 1.4, HZ = RIM;                                          // the hinge axis
const hingeX = [-60, 60];
const hleafC = mk("Hinge Leaves (Case)", "case", "minor"), knC = mk("Hinge Knuckles (Case)", "case", "minor"), hpin = mk("Hinge Pins", "case", "minor");
const hleafL = mk("Hinge Leaves (Lid)", "lid", "minor"), knL = mk("Hinge Knuckles (Lid)", "lid", "minor");
// the lid is drawn closed (x, y, z as if shut), then swung up about the hinge axis to 100 degrees
const OPEN = -100 * D;
const LF = q => {
  const dy = q[1] - HY, dz = q[2] - HZ;
  return [q[0], HY + dy * Math.cos(OPEN) - dz * Math.sin(OPEN), HZ + dy * Math.sin(OPEN) + dz * Math.cos(OPEN)];
};
const lidPt = q => r3(LF(q));
hingeX.forEach(cx => {
  withFrame(GY, () => extrude(hleafC, rect(cx - 14, cx + 14, HZ - 9, HZ), HD, HD + 0.7));
  withFrame(LF, () => withFrame(GY, () => extrude(hleafL, rect(cx - 14, cx + 14, HZ, HZ + 9), HD, HD + 0.7)));   // lid half, swung with the lid
  for (let i = 0; i < 5; i++) {
    const x0 = cx - 14 + i * 5.6;
    withFrame(GF, () => cyl(i % 2 ? knL : knC, HY, HZ, 1.5, x0 + 0.1, x0 + 5.5, 14));
  }
  withFrame(GF, () => cyl(hpin, HY, HZ, 0.6, cx - 14.6, cx + 14.6, 8));
  [-10, 0, 10].forEach(dx => {
    withFrame(GY, () => loop(hleafC, ringPts(cx + dx, HZ - 4.5, 0.9, 8, HD + 0.75)));
    withFrame(LF, () => withFrame(GY, () => loop(hleafL, ringPts(cx + dx, HZ + 4.5, 0.9, 8, HD + 0.75))));
  });
});
const staple = mk("Hasp Staple", "case", "minor");
withFrame(GY, () => {
  extrude(staple, rrRegion(0, 56.5, 4, 3.5, 0.8, 3), -HD - 0.7, -HD);
  extrude(staple, rect(-1.8, 1.8, 56.8, 58.6), -HD - 2.6, -HD - 0.7);
});

// ---------- the lid (drawn shut, swung up) ----------
withFrame(LF, () => {
  const shell = mk("Lid Shell", "lid", "major");
  rrBody(shell, 0, 0, HW, HD, 5, [[0, RIM, true], [0, 76, true], [1.6, 78.7], [3.2, LIDTOP, true]], { seg: 6, bottom: false });
  const rr = rrPts(0, 0, HW, HD, 5, 6);
  for (let c = 0; c < 4; c++) [rr[c * 7], rr[c * 7 + 6]].forEach(q => line(shell, [q[0], q[1], RIM], [q[0], q[1], 76]));
  const llip = mk("Lid Lip", "lid", "major");
  extrude(llip, rrRegion(0, 0, HW, HD, 0, 1, [[-HW + 2.2, HW - 2.2, -HD + 2.2, HD - 2.2]]), RIM, RIM + 0.9);
  const inner = mk("Lid Lining", "lid", "minor");
  loop(inner, rrPts(0, 0, HW - 6, HD - 6, 2, 3).map(q => [...q, RIM + 0.9]));
  loop(inner, rrPts(0, 0, HW - 6, HD - 6, 2, 3).map(q => [...q, 74.4]));
  rrPts(0, 0, HW - 6, HD - 6, 2, 3).filter((_, i) => i % 4 === 0).forEach(q => line(inner, [q[0], q[1], RIM + 0.9], [q[0], q[1], 74.4]));
  loop(inner, rrPts(0, 0, HW - 14, HD - 12, 3, 3).map(q => [...q, 74.4]));
  const inlay = mk("Inlay Panel", "lid", "minor");
  extrude(inlay, rrRegion(0, 0, 76, 40.5, 3, 4), LIDTOP, LIDTOP + 0.35);
  const zi = LIDTOP + 0.4;
  [3, 6].forEach(ins => loop(inlay, rrPts(0, 0, 76 - ins, 40.5 - ins, 3, 4).map(q => [...q, zi])));
  const star = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 7 : 17; star.push([r * Math.cos(a), r * Math.sin(a), zi]); }
  loop(inlay, star); loop(inlay, ringPts(0, 0, 20.5, 40, zi));
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; line(inlay, [20.5 * Math.cos(a), 20.5 * Math.sin(a), zi], [31 * Math.cos(a) * 1.0, 31 * Math.sin(a) * 0.55 * 1.0, zi]); }
  [-1, 1].forEach(sx => [-1, 1].forEach(sy => {
    const cx = sx * 62, cy = sy * 26;
    loop(inlay, [[cx - sx * 8, cy, zi], [cx, cy - sy * 8, zi], [cx + sx * 8, cy, zi], [cx, cy + sy * 8, zi]]);
    line(inlay, [cx - sx * 8, cy, zi], [cx + sx * 8, cy, zi]); line(inlay, [cx, cy - sy * 8, zi], [cx, cy + sy * 8, zi]);
  }));
  const card = mk("Tune Card", "lid", "minor");
  extrude(card, rrRegion(0, 0, 38, 22, 1.5, 3), 73.4, 74.4);
  loop(card, rrPts(0, 0, 35, 19, 1, 3).map(q => [...q, 73.35]));
  for (let r = 0; r < 6; r++) line(card, [-30, -12 + r * 4.4, 73.35], [30 - (r % 3) * 9, -12 + r * 4.4, 73.35]);
  [-34, 34].forEach(x => screwHead(card, [x, 0], 73.4 - 0.7, 1.6, 0.4));
  const hasp = mk("Hasp", "lid", "minor");
  withFrame(GY, () => {
    extrude(hasp, rect(-6, 6, 62, 70), -HD - 1.0, -HD);
    extrude(hasp, rrRegion(0, 61, 6, 9, 1.5, 3, [[-2.2, 2.2, 56, 59.5]]), -HD - 1.8, -HD - 1.0);
  });
});

// ---------- the bedplate, its standards and the comb seat ----------
const bed = mk("Bedplate", "bedplate", "major");
extrude(bed, rrRegion(0, 0.75, 84, 47.75, 4, 6, [[-44, 44, -8, 22]]), ZB - PLATE_T, ZB);
const bscr = mk("Bedplate Screws", "bedplate", "minor");
[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy], i) => screwHead(bscr, [sx * IXL, sy * 40], ZB, 2.3, 0.5 + i));
[-58, 58].forEach((x, i) => screwHead(bscr, [x, -44], ZB, 1.8, 1.7 + i));
const wedge = (inset, off) => {
  const pts = [[-51 + inset, -47 + inset], [51 - inset, -47 + inset]];
  for (let k = NT - 1; k >= 0; k--) { const t = TOOTH[k]; pts.push([t.x + PITCH / 2, t.root - off], [t.x - PITCH / 2, t.root - off]); }
  pts.push([-51 + inset, TOOTH[0].root - off]);
  return pts;
};
const BASE_Z0 = 41;
const seat = mk("Comb Seat", "bedplate", "major");
extrude(seat, polyRegion(wedge(1, 1.5)), ZB, BASE_Z0);
withFrame(GY, () => { [-40, 0, 40].forEach(x => loop(seat, rrPts(x, 29, 5, 6, 1, 3).map(q => [q[0], -45.5 - 0.0, q[1]]))); });   // the lightening holes drawn on the seat's front
const lstd = mk("Left Standard", "bedplate", "major");
plateX(lstd, [[-8, ZB], [38, ZB], [38, 50], [31, 53.5], [-4, 53.5], [-8, 48]], -62, -58);
bushing(lstd, YC, ZC, -57.95, 3); bushing(lstd, BAR[0], BAR[1], -57.95, 3);
const rstd = mk("Right Standard", "bedplate", "major");
plateX(rstd, [[-8, ZB], [42, ZB], [42, 52], [36, 54], [-4, 54], [-8, 48]], 58, 62);
bushing(rstd, YC, ZC, 62.05, 3); bushing(rstd, S2[0], S2[1], 62.05, 2); bushing(rstd, S3[0], S3[1], 62.05, 2);
const tbridge = mk("Train Bridge", "bedplate", "major");
plateX(tbridge, [[5, ZB], [41, ZB], [41, 52], [36, 54], [5, 50]], 73, 75.5);
bushing(tbridge, YC, ZC, 72.95, 2.6); bushing(tbridge, S2[0], S2[1], 72.95, 2); bushing(tbridge, S3[0], S3[1], 72.95, 2);
const gbr = mk("Governor Brackets", "bedplate", "minor");
withFrame(GY, () => {
  extrude(gbr, rrRegion(70.5, 53.5, 5.5, 3.2, 1, 3), 27.8, 29.3);
  extrude(gbr, rrRegion(70.5, 53.5, 5.5, 3.2, 1, 3), 46.8, 48.3);
  extrude(gbr, rect(73.5, 76, ZB, 56.7), 45.5, 48.3);
  loop(gbr, ringPts(XB, ZG, 1.3, 12, 29.35));
});
const lpost = mk("Lever Post", "bedplate", "minor");
cyl(lpost, 80, 36, 1.8, ZB, ZG - 0.7, 14);

// ---------- the cylinder ----------
const CB = [0, YC, ZC];
const cylP = mk("Cylinder", "cylinder", "major", "cyl", CB);
withFrame(GF, () => {
  cyl(cylP, 0, 0, RC, -CYL_X, CYL_X, 48);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; line(cylP, [RC * Math.cos(a), RC * Math.sin(a), -CYL_X], [RC * Math.cos(a), RC * Math.sin(a), CYL_X]); }
  [-48.6, 48.6].forEach(x => loop(cylP, ringPts(0, 0, RC + 0.05, 48, x)));
});
const caps = mk("Cylinder Caps", "cylinder", "minor", "cyl", CB);
withFrame(GF, () => [[-CYL_X - 2.4, -CYL_X], [CYL_X, CYL_X + 2.4]].forEach(([a, b]) => { cyl(caps, 0, 0, RC + 0.8, a, b, 40); loop(caps, ringPts(0, 0, 9, 24, a < 0 ? a - 0.05 : b + 0.05)); }));
const shaft = mk("Cylinder Shaft", "cylinder", "major", "cyl", CB);
withFrame(GF, () => cyl(shaft, 0, 0, 1.6, -78, 73.8, 14));
const pins = mk("Pins", "cylinder", "major", "cyl", CB);
PINS.forEach(({ k, a }) => {
  withFrame(q => [q[0], -q[2] * Math.sin(a) - q[1] * Math.cos(a), q[2] * Math.cos(a) - q[1] * Math.sin(a)], () => cyl(pins, TOOTH[k].x, 0, PIN_R, RC - 0.4, RP, 6));
});

// ---------- the comb ----------
const cbase = mk("Comb Base", "comb", "major");
extrude(cbase, polyRegion(wedge(0, 0)), BASE_Z0, TZ1);
const cscr = mk("Comb Screws", "comb", "minor");
[-40, 0, 40].forEach((x, i) => screwHead(cscr, [x, -43.5], TZ1, 2.3, 0.4 + i));
const dwire = mk("Damper Wire", "comb", "minor");
{
  const y = -26, z = TZ0 - 0.5;
  withFrame(GF, () => cyl(dwire, y, z, 0.45, -51.5, -20.8, 8));
  cyl(dwire, -51.5, y, 0.45, ZB, z, 8);
  const dp = mk("Damper Post", "comb", "minor");
  cyl(dp, -51.5, y, 1.4, ZB, z - 0.6, 12);
}
TOOTH.forEach(t => {
  const p = mk("Tooth " + (t.k + 1), "tooth" + t.k, "minor", "tooth" + t.k, [t.x, t.root, TZ0]);
  extrude(p, rect(-TW / 2, TW / 2, 0, t.L), 0, TT);
  line(p, [0, 0.4, TT + 0.02], [0, t.L - 0.4, TT + 0.02]);
});
for (let k = 0; k < 6; k++) {
  const t = TOOTH[k], w = mk("Lead Weight " + (k + 1), "tooth" + k, "minor", "tooth" + k, [t.x, t.root, TZ0]);
  extrude(w, rect(-TW / 2 + 0.2, TW / 2 - 0.2, t.L - 6.2, t.L - 1.6), TT, TT + 1.4);
}

// ---------- the spring motor ----------
const BB = [0, BAR[0], BAR[1]];
const barrel = mk("Barrel", "barrel", "major", "barrel", BB);
withFrame(GF, () => {
  cyl(barrel, 0, 0, 12.5, -75.4, -65.5, 48);
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; line(barrel, [12.5 * Math.cos(a), 12.5 * Math.sin(a), -75.4], [12.5 * Math.cos(a), 12.5 * Math.sin(a), -65.5]); }
  [-73.5, -67.5].forEach(x => loop(barrel, ringPts(0, 0, 12.55, 48, x)));
});
const bcover = mk("Barrel Cover", "barrel", "minor", "barrel", BB);
withFrame(GF, () => {
  cyl(bcover, 0, 0, 12.9, -76.0, -75.4, 48);
  loop(bcover, ringPts(0, 0, 3.2, 20, -76.05)); loop(bcover, ringPts(0, 0, 11.2, 48, -76.05));
  for (let i = 0; i < 3; i++) { const a = i * 2 * Math.PI / 3 + 0.5; loop(bcover, ringPts(8.2 * Math.cos(a), 8.2 * Math.sin(a), 0.9, 8, -76.05)); }
});
const bgear = mk("Barrel Gear", "barrel", "major", "barrel", BB);
gear(bgear, BG, BG.slice[0], BG.slice[1], { spokes: 5 });
const arbor = mk("Winding Arbor", "motor", "major");
withFrame(GF, () => {
  cyl(arbor, BAR[0], BAR[1], 2.2, -95.6, -61, 20);
  extrude(arbor, rect(BAR[0] - 2.5, BAR[0] + 2.5, BAR[1] - 2.5, BAR[1] + 2.5), -97.4, -95.6);
});
const spring = mk("Mainspring", "motor", "minor");
withFrame(GF, () => {
  const N = 7 * 48; let prev = null;
  for (let i = 0; i <= N; i++) {
    const a = 2 * Math.PI * i / 48, r = 3.6 + 7.8 * i / N, q = [BAR[0] + r * Math.cos(a), BAR[1] + r * Math.sin(a), -76.1];
    if (prev) line(spring, prev, q); prev = q;
  }
});
const bridge = mk("Left Bridge", "motor", "major");
plateX(bridge, [[5, ZB], [33, ZB], [33, 53], [22, 53], [22, 22], [15, 22], [15, 48], [5, 48]], -79, -77);
bushing(bridge, YC, ZC, -79.05, 2.4); bushing(bridge, BAR[0], BAR[1], -79.05, 3.2);
const ratchet = mk("Ratchet Wheel", "motor", "major");
withFrame(GF, () => {
  const n = 20, T = 2 * Math.PI / n, pts = [];
  for (let i = 0; i < n; i++) { const a = i * T; pts.push([BAR[0] + 7 * Math.cos(a), BAR[1] + 7 * Math.sin(a)], [BAR[0] + 6 * Math.cos(a + 0.92 * T), BAR[1] + 6 * Math.sin(a + 0.92 * T)]); }
  extrude(ratchet, polyRegion(pts), -83, -80.5);
  cyl(ratchet, BAR[0], BAR[1], 3.3, -85.3, -83, 20);
  line(ratchet, [BAR[0] - 3, BAR[1], -85.35], [BAR[0] + 3, BAR[1], -85.35]);
});
const click = mk("Click", "motor", "minor");
{
  const pk = [BAR[0] - 9.5, BAR[1] + 5.5], tp = [BAR[0] - 4.6, BAR[1] + 4.7];
  const d = [tp[0] - pk[0], tp[1] - pk[1]], l = Math.hypot(...d), nn = [-d[1] / l * 0.8, d[0] / l * 0.8];
  withFrame(GF, () => {
    extrude(click, polyRegion([[pk[0] + nn[0], pk[1] + nn[1]], [tp[0] + nn[0] * 0.4, tp[1] + nn[1] * 0.4], [tp[0] - nn[0] * 0.4, tp[1] - nn[1] * 0.4], [pk[0] - nn[0], pk[1] - nn[1]]]), -83, -80.5);
    cyl(click, pk[0], pk[1], 1.1, -83, -79, 12);
  });
}
const wkey = mk("Winding Key", "key", "major");
{
  const kz = BAR[1], ky = BAR[0];
  withFrame(GF, () => {
    cyl(wkey, ky, kz, 3.6, -101, -96.4, 20); cyl(wkey, ky, kz, 2.2, -107, -101, 16);
    loop(wkey, [[ky - 2.5, kz - 2.5, -96.45], [ky + 2.5, kz - 2.5, -96.45], [ky + 2.5, kz + 2.5, -96.45], [ky - 2.5, kz + 2.5, -96.45]]);
  });
  const wing = [[-104, 0], [-106, 6], [-109, 13.5], [-113, 15.5], [-117, 12.5], [-117.5, 6.5], [-114, 2.8], [-110.5, 1.4], [-108, 0]];
  withFrame(GY, () => {
    extrude(wkey, polyRegion(wing.map(([x, z]) => [x, kz + z])), ky - 1.2, ky + 1.2);
    extrude(wkey, polyRegion(wing.map(([x, z]) => [x, kz - z]).reverse()), ky - 1.2, ky + 1.2);
  });
}

// ---------- the gear train and the governor ----------
const cgear = mk("Cylinder Gear", "cg", "major", "cg", CB);
gear(cgear, CG, CG.slice[0], CG.slice[1], { spokes: 5 });
const cpin = mk("Cylinder Pinion", "cp", "major", "cp", CB);
gear(cpin, CP, CP.slice[0], CP.slice[1]);
withFrame(GF, () => cyl(cpin, 0, 0, 2.3, CP.slice[1], CP.slice[1] + 1.2, 16));
const S2B = [0, S2[0], S2[1]], S3B = [0, S3[0], S3[1]];
const ipin = mk("Intermediate Pinion", "s2", "major", "s2", S2B);
gear(ipin, P2, P2.slice[0], P2.slice[1]);
const iwheel = mk("Intermediate Wheel", "s2", "major", "s2", S2B);
gear(iwheel, W2, W2.slice[0], W2.slice[1], { spokes: 4 });
const ishaft = mk("Intermediate Shaft", "s2", "minor", "s2", S2B);
withFrame(GF, () => cyl(ishaft, 0, 0, 0.9, 62, 74, 12));
const wwheel = mk("Worm Wheel", "s3", "major", "s3", S3B);
gear(wwheel, G3, G3.slice[0], G3.slice[1]);
const wshaft = mk("Worm Wheel Shaft", "s3", "minor", "s3", S3B);
withFrame(GF, () => cyl(wshaft, 0, 0, 0.9, 62, 74, 12));
const GB = [XB, 0, ZG];
const gshaft = mk("Governor Shaft", "gov", "minor", "fly", GB);
withFrame(GY, () => cyl(gshaft, 0, 0, 0.6, 28.5, 47.8, 10));
const worm = mk("Worm", "gov", "major", "fly", GB);
withFrame(GY, () => {
  cyl(worm, 0, 0, RW + 0.1, S3[0] - 3.7, S3[0] + 3.7, 20);
  const pitch = Math.PI * M, turns = 7.4 / pitch, N = Math.round(turns * 24);
  [RW + M, RW - 0.4].forEach((r, h) => {
    let prev = null;
    for (let i = 0; i <= N; i++) {
      const th = 2 * Math.PI * i / 24 + h * 0.2, q = [r * Math.cos(th), r * Math.sin(th), S3[0] - 3.7 + 7.4 * i / N];
      if (prev) line(worm, prev, q); prev = q;
    }
  });
});
const fly = mk("Fly", "gov", "major", "fly", GB);
withFrame(GY, () => {
  cyl(fly, 0, 0, 1.9, FLY_Y - 0.9, FLY_Y + 0.9, 16);
  [-1, 1].forEach(s => {
    extrude(fly, rrRegion(s * 3.9, 0, 1.8, 1.5, 0.6, 3), FLY_Y - 0.5, FLY_Y + 0.5);
    line(fly, [s * 2.2, 0, FLY_Y + 0.55], [s * 5.4, 0, FLY_Y + 0.55]);
  });
});
const lever = mk("Start/Stop Lever", "lever", "major");
const LP = [80, 36], LF0 = [77.4, FLY_Y], LH = [96, 38.5];
const bar = (p, a, b, w, z0, z1) => {
  const d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d), n = [-d[1] / l * w / 2, d[0] / l * w / 2];
  extrude(p, polyRegion([[a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], [b[0] - n[0], b[1] - n[1]], [a[0] - n[0], a[1] - n[1]]]), z0, z1);
};
bar(lever, LP, LH, 1.6, ZG - 0.6, ZG + 0.6);
extrude(lever, rrRegion(99, 38.7, 3.2, 3.4, 1.2, 3), ZG - 1.2, ZG + 1.2);
cyl(lever, LP[0], LP[1], 2.6, ZG - 0.6, ZG + 0.6, 16);
const finger = mk("Brake Finger", "lever", "minor");
bar(finger, LP, LF0, 1.2, ZG - 0.5, ZG + 0.5);
cyl(finger, LF0[0], LF0[1], 0.9, ZG - 1.4, ZG + 1.4, 10);

// ---------- callouts and the tour ----------
const local = (name, p) => r3(BASES[name] ? [p[0] - BASES[name][0], p[1] - BASES[name][1], p[2] - BASES[name][2]] : p);
const pinHot = PINS.find(p => p.k === 9 && p.t > 3) || PINS[0];
const pinAt = ({ k, a }) => [TOOTH[k].x, YC - RP * Math.sin(a), ZC + RP * Math.cos(a)];
const hotspots = [
  ["Winding key", "Butterfly key on the barrel's arbor", [-110, key.y, key.z + 12], ["Winding Key"]],
  ["Mainspring barrel", "A coiled steel spring stores the energy", [-72, BAR[0], BAR[1] + 12.5], ["Barrel"]],
  ["Ratchet and click", "Stop the spring unwinding backwards", [BAR[0] - 0, BAR[1], -83], ["Ratchet Wheel"]],
  ["Barrel gear", "40 teeth, drives the 10-tooth pinion", [-64.2, BAR[0], BAR[1] + rpOf(BG)], ["Barrel Gear"]],
  ["Cylinder gear", "40 teeth, starts the governor train", [65.7, YC, ZC + rpOf(CG) + M], ["Cylinder Gear"]],
  ["Worm and fly", "Governor: a fast fan that holds the speed", [XB + 3.9, FLY_Y, ZG + 0.5], ["Fly"]],
  ["Start/stop lever", "A brake finger that stops the fly", [99, 38.7, ZG + 1.2], ["Start/Stop Lever"]],
  ["Pinned cylinder", "Each pin is one note", [pinAt(pinHot)[0], pinAt(pinHot)[1], pinAt(pinHot)[2]], ["Pins"]],
  ["Steel comb", "30 teeth, long = low, short = high", [TOOTH[14].x, TOOTH[14].root + TOOTH[14].L * 0.5, TZ1], ["Tooth 15"]],
  ["Lead weights", "Lower the pitch of the longest teeth", [TOOTH[2].x, TOOTH[2].root + TOOTH[2].L - 3.9, TT + 1.4 + TZ0], ["Lead Weight 3"]],
  ["Damper wire", "Rests on the bass teeth to stop their ringing", [-36, -26, TZ0 - 0.5], ["Damper Wire"]],
  ["Lid", "The case and lid act as a sounding board", lidPt([0, 0, 68]), ["Lid Shell"]],
].map(([t, s, p, o]) => ({ t, s, p: local(o[0], p), o }));
const pt = (name, p) => [...local(name, p), name];
const tour = {
  points: {
    key: pt("Winding Key", [-108, key.y, key.z]), barrel: pt("Barrel", [-71, BAR[0], BAR[1] + 12.5]), ratchet: pt("Ratchet Wheel", [BAR[0], BAR[1], -83]),
    bgear: pt("Barrel Gear", [-64.2, BAR[0], BAR[1] + rpOf(BG)]), cpin: pt("Cylinder Pinion", [-64.2, YC, ZC + rpOf(CP)]),
    cgear: pt("Cylinder Gear", [65.7, YC, ZC + rpOf(CG)]), iwheel: pt("Intermediate Wheel", [69.7, S2[0], S2[1] + rpOf(W2)]),
    wwheel: pt("Worm Wheel", [69.7, S3[0], S3[1] + rpOf(G3)]), worm: pt("Worm", [XB, S3[0], ZG + 2.2]), fly: pt("Fly", [XB + 3.9, FLY_Y, ZG + 0.5]),
    lever: pt("Start/Stop Lever", [99, 38.7, ZG + 1.2]),
    pins: pt("Pins", pinAt(pinHot)), tooth: pt("Tooth 10", [TOOTH[9].x, TOOTH[9].root + TOOTH[9].L, TZ1]),
    long: pt("Tooth 2", [TOOTH[1].x, TOOTH[1].root + TOOTH[1].L * 0.6, TZ1]), short: pt("Tooth 27", [TOOTH[26].x, TOOTH[26].root + TOOTH[26].L * 0.6, TZ1]),
    weight: pt("Lead Weight 2", [TOOTH[1].x, TOOTH[1].root + TOOTH[1].L - 3.9, TZ0 + TT + 1.4]), lid: pt("Lid Shell", lidPt([0, 0, 78])),
    floor: pt("Tray Floor", [0, 20, FLOOR]),
  },
  steps: [
    { t: "Winding stores the energy", focus: "barrel", dist: 0.55, ex: 1, p: ["key", "ratchet", "barrel"], n: ["Winding Key", "Winding Arbor", "Ratchet Wheel", "Click", "Mainspring", "Barrel", "Barrel Cover"], ms: 4800,
      d: "The butterfly key turns the arbor, which coils the mainspring tight inside the barrel. The ratchet wheel and its click let the arbor turn only one way, so the spring cannot unwind backwards through the key." },
    { t: "The barrel drives the cylinder", focus: "bgear", dist: 0.5, ex: 1, p: ["barrel", "bgear", "cpin"], n: ["Barrel", "Barrel Gear", "Cylinder Pinion", "Cylinder Shaft"], ms: 4600,
      d: "The unwinding spring turns the barrel, whose 40-tooth gear drives a 10-tooth pinion on the cylinder's shaft: the cylinder turns four times as fast as the barrel, once every 8 seconds here." },
    { t: "The gear train", focus: "iwheel", dist: 0.5, ex: 1, p: ["cgear", "iwheel", "wwheel"], n: ["Cylinder Gear", "Intermediate Pinion", "Intermediate Wheel", "Worm Wheel"], ms: 4800,
      d: "A 40-tooth gear on the cylinder drives a 10-tooth pinion, then a 30-tooth wheel drives a 10-tooth worm wheel. Each step speeds the shaft up, 4 times and then 3 times." },
    { t: "The governor keeps a steady speed", focus: "fly", dist: 0.45, ex: 1, p: ["wwheel", "worm", "fly", "lever"], n: ["Worm Wheel", "Worm", "Governor Shaft", "Fly", "Brake Finger", "Start/Stop Lever"], ms: 4800,
      d: "The worm wheel turns a single-start worm, a further 10 times faster: the fly spins 120 times as fast as the cylinder. Air drag on its two blades grows with speed, so the cylinder cannot run away. The lever's brake finger stops the fly, and so the music." },
    { t: "The pinned cylinder is the program", focus: "pins", dist: 0.45, ex: 0, p: ["pins", "tooth"], n: ["Pins", "Cylinder", "Cylinder Caps", "Cylinder Shaft"], ms: 4600,
      d: "Each pin sits at an angle on the cylinder, which is its moment in the tune, and in line with one tooth, which is its note. Ode to Joy, a melody, an octave and a chord pattern, takes a few hundred pins." },
    { t: "A pin plucks a tooth", focus: "tooth", dist: 0.4, ex: 0, p: ["pins", "tooth"], n: ["Pins", "Tooth 10", "Comb Base"], ms: 4600,
      d: "As the cylinder turns, a pin lifts the tip of its tooth and lets it go. The tooth springs back and rings, and the sound dies away in a fraction of a second (slowed down here so the eye can follow)." },
    { t: "Tuned by length, amplified by wood", focus: "weight", dist: 0.6, ex: 0, p: ["long", "short", "weight", "lid"], n: ["Tooth 2", "Tooth 27", "Lead Weight 2", "Damper Wire", "Comb Base", "Tray Floor", "Lid Shell"], ms: 5200,
      d: "A long tooth rings low and a short one high; lead weights lower the longest. The comb alone is faint: screwed to the bedplate, it passes its vibration to the wooden case, and the raised lid and tray act as a sounding board." },
  ],
};

const geometry = geometryScript("CMB_GEOMETRY", "musicbox/build.js", { explode, hotspots, tour,
  constants: { REV, TOOTH, EVENTS: byTooth, PINS: PINS.length, CG: CG.n, P2: P2.n, W2: W2.n, G3: G3.n, CP: CP.n, BG: BG.n, WORM: 1, AMP: 1.1, S2, S3, BAR, YC, ZC, XB, ZG } });
writeGeometry(HERE, geometry);
console.log(`models/musicbox/geometry.js: ${geometry.stats}; ${PINS.length} pins`);
