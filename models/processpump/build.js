/*
API 610 OH2 process pump that cavitates: builds its geometry.

After the "Process pump" figure in Anatomy (github.com/wheresryan22/anatomy, MIT, by Ryan), rebuilt as a 3D blueprint
model: a centreline-mounted, end-suction, top-discharge refinery pump on a fabricated baseplate, cut open above the
shaft (volute, six backswept vanes, seal chamber, bearing housing), its spacer coupling and 18.5 kW four-pole motor,
a suction drum cut away in quarter behind the motor end, the suction and discharge lines with their valves and gauges.

Designed in mm, X along the shaft (suction end at -X), Y back from the front (front faces -Y), Z up from the floor,
and drawn shifted down by ZC so everything stays inside the Int16 range. Every module is drawn about its own base
point (the shaft axis, a gauge centre...) so spool parts can turn or slide about it. Sizes and the internal layout
are estimates from API 610 practice; the figure's own dimensions were not available.

    node models/processpump/build.js
*/
"use strict";
const { withFrame, part, line, loop, tri, circlePts, rrRegion, rect, polyRegion, extrude, cyl, revolve, loft, tube,
  r3, geometryScript, writeGeometry } = require("../../kit/procedural");
const HERE = __dirname;
const FX = q => [q[2], q[0], q[1]];   // draw in (y, z), push along x
const FY = q => [q[0], q[2], q[1]];   // draw in (x, z), push along y
const PI = Math.PI, rad = d => d * PI / 180;
const ZC = 1000, ZA = 520, XI = -270;       // shift, shaft height, impeller plane
const MODS = {}, explode = {}, PM = {};
function mod(name, base, offset, fn) {
  MODS[name] = base; explode[name] = { offset, base: [base[0], base[1], base[2] - ZC] };
  withFrame(q => [q[0] - base[0], q[1] - base[1], q[2] - base[2]], fn);
}
const P = (name, m, kind, ex) => { PM[name] = m; return part(name, m, kind, ex); };
const box = (p, x0, x1, y0, y1, z0, z1, o) => extrude(p, rect(x0, x1, y0, y1), z0, z1, o);
const sub = (a, b) => a.map((v, i) => v - b[i]), add = (a, b) => a.map((v, i) => v + b[i]), mul = (a, k) => a.map(v => v * k);
const nrm = a => mul(a, 1 / Math.hypot(...a));
const off = (ax, c, u, v) => ax === "x" ? [c[0], c[1] + u, c[2] + v] : ax === "y" ? [c[0] + u, c[1], c[2] + v] : [c[0] + u, c[1] + v, c[2]];
// cylinder about an axis through c, from a0 to a1 along it
function cylA(p, ax, c, r, a0, a1, n = 24, o) {
  if (ax === "z") cyl(p, c[0], c[1], r, a0, a1, n, o);
  else if (ax === "x") withFrame(FX, () => cyl(p, c[1], c[2], r, a0, a1, n, o));
  else withFrame(FY, () => cyl(p, c[0], c[2], r, a0, a1, n, o));
}
// turned profile [r, along, hard] about an axis through c
function revA(p, ax, c, prof, n = 40, closed = false) {
  if (ax === "z") revolve(p, c[0], c[1], prof, n, closed);
  else if (ax === "x") withFrame(FX, () => revolve(p, c[1], c[2], prof, n, closed));
  else withFrame(FY, () => revolve(p, c[0], c[2], prof, n, closed));
}
// a closed wall section given as [along, r] points, turned
const wall = (p, ax, c, poly, n = 40) => revA(p, ax, c, poly.map(([a, r]) => [r, a, true]), n, true);
function bolts(p, ax, c, pcd, n, r, a0, a1, rot = 0, hex = 6) {
  circlePts(0, 0, pcd, n, rot).forEach(([u, v]) => cylA(p, ax, off(ax, c, u, v), r, a0, a1, hex));
}
function holes(p, ax, c, pcd, n, r, at, rot = 0) {
  circlePts(0, 0, pcd, n, rot).forEach(([u, v]) => {
    const q = off(ax, c, u, v);
    loop(p, circlePts(0, 0, r, 10).map(([a, b]) => { const w = off(ax, q, a, b); w[ax === "x" ? 0 : ax === "y" ? 1 : 2] = at; return w; }));
  });
}
// a closed section swept along rings (casing, drum walls): lines at its corners and along the sweep
function skin(p, poly, stations, ringAt) {
  const rings = stations.map(ringAt), last = rings.length - 1;
  loft(p, rings.map((pts, i) => ({ pts, hard: i === 0 || i === last })));
  let T = null;
  try { T = polyRegion(poly); } catch (e) { console.warn("cap skipped", p.name); }
  if (T) [0, last].forEach(e => T.forEach(t => { const ix = t.map(q => poly.indexOf(q)); tri(p, rings[e][ix[0]], rings[e][ix[1]], rings[e][ix[2]]); }));
  poly.forEach((_, k) => { for (let i = 0; i < last; i++) line(p, rings[i][k], rings[i + 1][k]); });
}
const steps = (a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => a0 + (a1 - a0) * i / n);
// the section [x, r] swept about the shaft axis from angle a0 to a1 (degrees; 180..360 is the lower half)
const sweepX = (p, poly, a0, a1, n = 14, yc = 0, zc = ZA) =>
  skin(p, poly, steps(a0, a1, Math.max(2, Math.round(n * Math.abs(a1 - a0) / 180))), t => poly.map(([x, r]) => [x, yc + r * Math.cos(rad(t)), zc + r * Math.sin(rad(t))]));
const sweepZ = (p, poly, a0, a1, cx, cy, n = 18) =>
  skin(p, poly, steps(a0, a1, n), t => poly.map(([r, z]) => [cx + r * Math.cos(rad(t)), cy + r * Math.sin(rad(t)), z]));
// round pipe along a polyline with rounded bends
function bendPath(pts, R, seg = 6) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const A = pts[i - 1], B = pts[i], C = pts[i + 1], u = nrm(sub(A, B)), v = nrm(sub(C, B));
    const phi = Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2])));
    const t = Math.min(R / Math.tan(phi / 2), Math.hypot(...sub(A, B)) * 0.9, Math.hypot(...sub(C, B)) * 0.9);
    const P1 = add(B, mul(u, t)), P2 = add(B, mul(v, t));
    for (let s = 0; s <= seg; s++) { const k = s / seg; out.push(P1.map((_, j) => (1 - k) * (1 - k) * P1[j] + 2 * k * (1 - k) * B[j] + k * k * P2[j])); }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
const pipe = (p, pts, r, R = 150, n = 16) => tube(p, bendPath(pts, R), r, n);
const ball = (p, c, r) => revolve(p, c[0], c[1], Array.from({ length: 7 }, (_, k) => [r * Math.sin(PI * k / 6), c[2] - r * Math.cos(PI * k / 6), k === 3]), 10);
// a dial gauge facing -Y with its centre of the face at c: body, bezel, ticks. Needle: see needle().
function gauge(id, name, c, R, off3, D = 55) {
  mod(id, c, off3, () => {
    const g = P(name + " Gauge", id, "minor");
    withFrame(FY, () => {
      cyl(g, c[0], c[2], R, c[1], c[1] + D, 32);
      cyl(g, c[0], c[2], R * 0.35, c[1] + D, c[1] + D + 14, 12);
      [R + 3, R - 3].forEach(r => loop(g, circlePts(c[0], c[2], r, 40).map(([a, b]) => [a, b, c[1] - 5])));
      loop(g, circlePts(c[0], c[2], R + 3, 40).map(([a, b]) => [a, b, c[1]]));
      for (let i = 0; i <= 24; i++) {
        const a = rad(135 - 270 * i / 24), d = [-Math.sin(a), Math.cos(a)], r1 = R - 4, r0 = R - (i % 4 ? 8 : 12);
        line(g, [c[0] + d[0] * r0, c[2] + d[1] * r0, c[1] - 0.5], [c[0] + d[0] * r1, c[2] + d[1] * r1, c[1] - 0.5]);
      }
      loop(g, circlePts(c[0], c[2], 3, 8).map(([a, b]) => [a, b, c[1] - 0.5]));
    });
    const nd = P(name + " Needle", id, "minor", { spool: id });
    withFrame(FY, () => {
      extrude(nd, polyRegion([[-1.4, -R * 0.22], [1.4, -R * 0.22], [0.5, R - 7], [-0.5, R - 7]].map(([a, b]) => [c[0] + a, c[2] + b])), c[1] - 2.4, c[1] - 1.6);
      cyl(nd, c[0], c[2], 3.2, c[1] - 2.4, c[1] - 1.2, 12);
    });
  });
}
// ================= baseplate =================
const BX0 = -800, BX1 = 1600, BY = 350, BH = 152, TOPZ = BH + 8;
mod("base", [400, 0, 0], [0, 0, -170], () => {
  const bp = P("Baseplate", "base", "major");
  extrude(bp, rrRegion((BX0 + BX1) / 2, 0, (BX1 - BX0) / 2, BY, 0, 3, [[BX0 + 30, BX1 - 30, -BY + 30, BY - 30]]), 0, BH);
  [-500, -120, 330, 700, 1150].forEach(x => box(bp, x - 15, x + 15, -BY + 30, BY - 30, 0, BH - 12));
  const dp = P("Deck Plate", "base", "major");
  box(dp, BX0, BX1, -BY, BY, BH, TOPZ);
  const gh = P("Grout Holes", "base", "minor");
  [-300, 100, 530, 930, 1350].forEach(x => [-250, 250].forEach(y => [36, 27].forEach(r => loop(gh, circlePts(x, y, r, 18).map(q => [...q, TOPZ + 0.1])))));
  const lug = P("Lifting Lugs", "base", "minor");
  [-700, 1500].forEach(x => [-335, 335].forEach(y => withFrame(FY, () => {
    extrude(lug, polyRegion([[-45, 0], [45, 0], [45, 45], [30, 72], [-30, 72], [-45, 45]].map(([a, b]) => [x + a, TOPZ + b])), y - 8, y + 8);
    [y - 8.1, y + 8.1].forEach(yy => loop(lug, circlePts(x, TOPZ + 48, 17, 14).map(([a, b]) => [a, b, yy])));
  })));
  const ab = P("Anchor Bolts", "base", "minor");
  [-700, -300, 100, 500, 900, 1300, 1500].forEach(x => [-322, 322].forEach(y => {
    cylA(ab, "z", [x, y, 0], 24, TOPZ, TOPZ + 6, 16); cylA(ab, "z", [x, y, 0], 19, TOPZ + 6, TOPZ + 24, 6); cylA(ab, "z", [x, y, 0], 10, TOPZ + 24, TOPZ + 50, 10);
  }));
  const mp = P("Motor Pads", "base", "minor");
  [[695, 825], [935, 1065]].forEach(([a, b]) => { box(mp, a, b, -150, 150, TOPZ, 360); bolts(mp, "z", [(a + b) / 2, 0, 0], 100, 4, 8, 360, 364, 0.8, 6); });
  const pp = P("Pump Pedestals", "base", "minor");
  [[-355, -305], [270, 350]].forEach(([a, b]) => box(pp, -335, -215, a, b, TOPZ, ZA - 14));
  box(pp, 40, 260, -125, 125, TOPZ, ZA - 100);
});
// ================= motor =================
mod("motor", [900, 0, ZA], [380, 0, 70], () => {
  const C = [0, 0, ZA];
  const fr = P("Motor Frame", "motor", "major");
  revA(fr, "x", C, [[150, 690, true], [155, 698, true], [155, 1090, true], [150, 1098, true], [120, 1098, true]], 48);
  const fins = P("Cooling Fins", "motor", "minor");
  for (let i = 0; i < 36; i++) {
    const a = rad(10 * i), c = Math.cos(a), s = Math.sin(a);
    [[705, 1085]].forEach(([x0, x1]) => { line(fins, [x0, 167 * c, ZA + 167 * s], [x1, 167 * c, ZA + 167 * s]); line(fins, [x0, 155 * c, ZA + 155 * s], [x0, 167 * c, ZA + 167 * s]); line(fins, [x1, 155 * c, ZA + 155 * s], [x1, 167 * c, ZA + 167 * s]); });
  }
  const de = P("Drive End Shield", "motor", "major");
  revA(de, "x", C, [[150, 690, true], [150, 668, true], [100, 660, true], [60, 660, true], [60, 640, true], [24, 640, true]], 40);
  bolts(de, "x", C, 128, 8, 7, 688, 696, 0.2, 6);
  const cow = P("Fan Cowl", "motor", "major");
  revA(cow, "x", C, [[150, 1098, true], [152, 1124, true], [152, 1250, true], [140, 1290, true], [110, 1300, true], [0, 1300, true]], 48);
  withFrame(FX, () => { for (let i = 0; i < 12; i++) { const a = rad(30 * i); loop(cow, [[44, 5], [98, 5], [98, -5], [44, -5]].map(([r, w]) => [r * Math.cos(a) - w * Math.sin(a), ZA + r * Math.sin(a) + w * Math.cos(a), 1300.1])); } });
  for (let i = 0; i < 16; i++) { const a = rad(22.5 * i + 5); loop(cow, [[1170, 0], [1240, 0], [1240, 6], [1170, 6]].map(([x, d]) => [x, 152.1 * Math.cos(a + rad(d)), ZA + 152.1 * Math.sin(a + rad(d))])); }
  const tb = P("Terminal Box", "motor", "major");
  box(tb, 820, 950, -75, 75, ZA + 148, ZA + 236); box(tb, 812, 958, -82, 82, ZA + 236, ZA + 248);
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => cylA(tb, "z", [885 + a * 58, b * 62, 0], 5, ZA + 248, ZA + 253, 8));
  cylA(tb, "y", [885, 0, ZA + 200], 24, -75, -96, 16);
  const ft = P("Motor Feet", "motor", "minor");
  [[705, 815], [945, 1055]].forEach(([a, b]) => { box(ft, a, b, -135, 135, 360, 380); [-1, 1].forEach(sx => [-1, 1].forEach(sy => cylA(ft, "z", [(a + b) / 2 + sx * 40, sy * 105, 0], 12, 380, 392, 6))); });
  const sh = P("Motor Shaft", "motor", "minor");
  revA(sh, "x", C, [[21, 534, true], [21, 640, true], [21, 560, true]].slice(0, 2), 24);
  const eye = P("Lifting Eye", "motor", "minor");
  cylA(eye, "z", [1010, 0, 0], 20, ZA + 150, ZA + 166, 16);
  tube(eye, circlePts(0, 0, 26, 18, -1.2).concat([circlePts(0, 0, 26, 18, -1.2)[0]]).map(([a, b]) => [1010 + a, 0, ZA + 166 + 26 + b]).slice(0, 17), 6, 8);
  const np = P("Nameplate", "motor", "minor");
  withFrame(FY, () => { extrude(np, rect(850, 960, ZA - 22, ZA + 24), -160, -155); for (let i = 1; i < 5; i++) line(np, [858, ZA - 22 + i * 9, -160.1], [952, ZA - 22 + i * 9, -160.1]); });
});
// ================= coupling =================
mod("coupling", [450, 0, ZA], [120, 0, 120], () => {
  const C = [0, 0, ZA];
  wall(P("Pump Hub", "coupling", "major"), "x", C, [[320, 22], [320, 50], [376, 50], [376, 82], [392, 82], [392, 22]], 40);
  wall(P("Motor Hub", "coupling", "major"), "x", C, [[518, 21], [518, 82], [534, 82], [534, 50], [590, 50], [590, 21]], 40);
  wall(P("Spacer", "coupling", "major"), "x", C, [[398, 36], [398, 80], [410, 80], [410, 44], [500, 44], [500, 80], [512, 80], [512, 36]], 40);
  const dpk = P("Disc Packs", "coupling", "minor");
  [[392, 398], [512, 518]].forEach(([a, b]) => wall(dpk, "x", C, [[a, 56], [a, 80], [b, 80], [b, 56]], 40));
  const cb = P("Coupling Bolts", "coupling", "minor", { spool: "cpl" });
  [[368, 376, 412, 420, 0], [492, 500, 536, 544, 0.5]].forEach(([h0, h1, n0, n1, rot]) => {
    circlePts(0, 0, 68, 6, rot).forEach(([u, v]) => { const c = off("x", C, u, v); cylA(cb, "x", c, 8, h0, h1, 6); cylA(cb, "x", c, 5, h1, n0, 10); cylA(cb, "x", c, 8, n0, n1, 6); });
  });
});
mod("guard", [450, 0, ZA], [120, 0, 330], () => {
  const g = P("Coupling Guard", "guard", "major");
  sweepX(g, [[300, 108], [300, 114], [650, 114], [650, 108]], 25, 155, 14);
  for (let i = 0; i < 6; i++) { const x = 340 + 52 * i; loop(g, [[x, 60], [x + 34, 60], [x + 34, 120], [x, 120]].map(([xx, a]) => [xx, 115 * Math.cos(rad(a)), ZA + 115 * Math.sin(rad(a)) + 0.1])); }
  const br = P("Guard Brackets", "guard", "minor");
  [[296, 304], [646, 654]].forEach(([a, b]) => sweepX(br, [[a, 96], [a, 114], [b, 114], [b, 96]], 25, 155, 6));
});
// ================= casing =================
const RC = 218, RV = psi => RC + 70 * psi / 360;
const NOZ = [XI - 2, -260];     // discharge nozzle axis (x, y)
mod("casing", [XI, 0, ZA], [-200, -150, 0], () => {
  const vp = (rv) => [[-52, 62], [-52, rv + 14], [34, rv + 14], [34, rv], [-38, rv], [-38, 62]];
  const vc = P("Volute Casing", "casing", "major");
  const ring = psi => vp(RV(psi)).map(([x, r]) => [XI + x, -r * Math.cos(rad(psi)), ZA + r * Math.sin(rad(psi))]);
  [[0, 70], [130, 360]].forEach(([a, b]) => skin(vc, vp(RV(a + 1)), steps(a, b, Math.round((b - a) / 12)), ring));
  const ct = P("Cutwater", "casing", "minor");
  withFrame(FX, () => extrude(ct, polyRegion([[-232, ZA - 45], [-212, ZA], [-232, ZA + 45]]), XI - 38, XI + 34));
  const th = P("Throat", "casing", "major");
  extrude(th, rrRegion(XI - 9, -260, 43, 42, 0, 3, [[XI - 38, XI + 40, -288, -232]]), ZA, ZA + 130);
  const cc = P("Casing Cover", "casing", "major");
  sweepX(cc, [[XI + 34, 58], [XI + 34, 304], [XI + 54, 304], [XI + 54, 58]], 115, 415, 12);
  const cs = P("Casing Studs", "casing", "minor");
  steps(135, 345, 7).forEach(ps => { const r = RV(ps) + 6, y = -r * Math.cos(rad(ps)), z = ZA + r * Math.sin(rad(ps)); cylA(cs, "x", [0, y, z], 11, XI + 54, XI + 66, 6); cylA(cs, "x", [0, y, z], 6, XI + 66, XI + 84, 8); });
  const cf = P("Casing Feet", "casing", "minor");
  [[-355, -300], [265, 355]].forEach(([a, b]) => { box(cf, XI - 62, XI + 44, a, b, ZA - 14, ZA + 14); loop(cf, circlePts(XI - 9, (a + b) / 2, 11, 10).map(q => [...q, ZA + 14.1])); });
  const sn = P("Suction Nozzle", "casing", "major");
  wall(sn, "x", [0, 0, ZA], [[-640, 51], [-640, 108], [-616, 108], [-616, 57], [-420, 57], [-322, 84], [-322, 51]], 40);
  holes(sn, "x", [0, 0, ZA], 90, 8, 9, -640.1);
  const dn = P("Discharge Nozzle", "casing", "major");
  wall(dn, "z", [NOZ[0], NOZ[1], 0], [[ZA + 130, 36], [ZA + 130, 62], [ZA + 146, 62], [ZA + 190, 50], [ZA + 300, 50], [ZA + 300, 95], [ZA + 322, 95], [ZA + 322, 36]], 32);
  holes(dn, "z", [NOZ[0], NOZ[1], 0], 74, 8, 8, ZA + 322.1);
  const wr = P("Front Wear Ring", "casing", "minor");
  wall(wr, "x", [0, 0, ZA], [[XI - 50, 54], [XI - 50, 62], [XI - 38, 62], [XI - 38, 54]], 36);
  const bw = P("Back Wear Ring", "casing", "minor");
  wall(bw, "x", [0, 0, ZA], [[XI + 28, 96], [XI + 28, 104], [XI + 34, 104], [XI + 34, 96]], 36);
});
// ================= rotor: impeller, shaft =================
const RIN = 58, ROUT = 205, NV = 6;
const xFr = u => -18 - 44 * Math.pow(1 - u, 1.7), xBk = u => 24 - 6 * u;
const vAng = u => -rad(100) * Math.pow(u, 0.85);
const RP = (x, y, z) => [XI + x, y, ZA + z];
// a point on vane i at u (0 inlet, 1 tip), arc offset d (mm) and s across (0 front, 1 back)
function vp3(i, u, d = 0, s = 0.5) {
  const r = RIN + (ROUT - RIN) * u, psi = rad(60 * i) + vAng(u) + d / r;
  return RP(xFr(u) + s * (xBk(u) - xFr(u)), -r * Math.cos(psi), r * Math.sin(psi));
}
const loopOn = (p, i, uc, sc, du, ds, n = 14) => loop(p, Array.from({ length: n }, (_, k) => vp3(i, uc + du * Math.cos(2 * PI * k / n), -3.2, sc + ds * Math.sin(2 * PI * k / n))));
mod("rotor", [XI, 0, ZA], [-60, 0, 260], () => {
  const C = [0, 0, ZA];
  const vn = P("Impeller Vanes", "rotor", "major", { spool: "imp" });
  for (let i = 0; i < NV; i++) {
    const rings = steps(0, 1, 12).map(u => [vp3(i, u, -2.5, 0), vp3(i, u, -2.5, 1), vp3(i, u, 2.5, 1), vp3(i, u, 2.5, 0)]);
    loft(vn, rings.map((pts, k) => ({ pts, hard: k === 0 || k === 12 })));
    for (let k = 0; k < 4; k++) for (let j = 0; j < 12; j++) line(vn, rings[j][k], rings[j + 1][k]);
    [0, 12].forEach(e => { tri(vn, rings[e][0], rings[e][1], rings[e][2]); tri(vn, rings[e][0], rings[e][2], rings[e][3]); });
  }
  const sr = P("Impeller Shrouds", "rotor", "minor");
  [[xFr, -6], [xBk, 6]].forEach(([f, d]) => {
    [0, 0.12, 0.3, 0.55, 0.8, 1].forEach(u => loop(sr, circlePts(0, 0, RIN + (ROUT - RIN) * u, 48).map(([y, z]) => RP(f(u) + d, y, z))));
    for (let k = 0; k < 16; k++) { const a = 2 * PI * k / 16; for (let j = 0; j < 8; j++) { const u0 = j / 8, u1 = (j + 1) / 8, r0 = RIN + (ROUT - RIN) * u0, r1 = RIN + (ROUT - RIN) * u1; line(sr, RP(f(u0) + d, r0 * Math.cos(a), r0 * Math.sin(a)), RP(f(u1) + d, r1 * Math.cos(a), r1 * Math.sin(a))); } }
  });
  loop(sr, circlePts(0, 0, ROUT, 48).map(([y, z]) => RP(-18, y, z))); loop(sr, circlePts(0, 0, ROUT, 48).map(([y, z]) => RP(18, y, z)));
  revA(P("Impeller Hub", "rotor", "major"), "x", C, [[22, XI - 52, true], [34, XI - 50, true], [40, XI - 34, true], [40, XI + 60, true], [22, XI + 60, true]], 36);
  const shf = P("Pump Shaft", "rotor", "major");
  revA(shf, "x", C, [[22, -312, true], [22, -100, true], [25, -100, true], [25, 45, true], [22, 45, true], [22, 330, true], [22, 450, true]], 28);
  const S1 = P("Vapour Sheets S", "rotor", "minor", { spool: "imp" }), S2 = P("Vapour Sheets M", "rotor", "minor", { spool: "imp" }), S3 = P("Vapour Sheets L", "rotor", "minor", { spool: "imp" });
  for (let i = 0; i < NV; i++) {
    [0, 1, 2].forEach(k => loopOn(S1, i, 0.04 + 0.05 * k, 0.25 + 0.25 * k, 0.022, 0.09, 10));
    loopOn(S2, i, 0.12, 0.35, 0.06, 0.2); loopOn(S2, i, 0.19, 0.7, 0.05, 0.18);
    loopOn(S3, i, 0.22, 0.5, 0.2, 0.42, 20); loopOn(S3, i, 0.2, 0.5, 0.12, 0.3, 16);
    [0.25, 0.4, 0.55, 0.7, 0.85].forEach(s => line(S3, vp3(i, 0.3, -3.2, s), vp3(i, 0.5, -3.2, s + 0.03)));
  }
});
// ================= seal =================
mod("seal", [-150, 0, ZA], [-30, -230, 40], () => {
  const C = [0, 0, ZA], lo = (p, poly, n = 12) => sweepX(p, poly, 180, 360, n);
  lo(P("Seal Chamber", "seal", "major"), [[-216, 58], [-216, 78], [-94, 78], [-94, 58]]);
  const gl = P("Gland Plate", "seal", "major");
  lo(gl, [[-136, 46], [-136, 56], [-100, 56], [-100, 100], [-76, 100], [-76, 40]]);
  const gs = P("Gland Studs", "seal", "minor");
  steps(200, 340, 4).forEach(a => { const y = 84 * Math.cos(rad(a)), z = ZA + 84 * Math.sin(rad(a)); cylA(gs, "x", [0, y, z], 8, -76, -66, 6); cylA(gs, "x", [0, y, z], 4, -100, -76, 8); });
  lo(P("Shaft Sleeve", "seal", "minor"), [[-212, 22], [-212, 27], [-78, 27], [-78, 22]]);
  const bo = [];
  for (let k = 0; k <= 8; k++) bo.push([-208 + 7.5 * k, k % 2 ? 36 : 52]);
  lo(P("Metal Bellows", "seal", "minor"), bo.concat(bo.slice().reverse().map(([x, r]) => [x, r - 2])), 10);
  lo(P("Rotating Face", "seal", "minor"), [[-148, 30], [-148, 44], [-136, 44], [-136, 30]]);
  lo(P("Stationary Face", "seal", "minor"), [[-136, 30], [-136, 44], [-124, 44], [-124, 30]]);
  const fl = P("Flush Line", "seal", "minor");
  pipe(fl, [[-236, -262, ZA + 70], [-170, -262, ZA + 70], [-170, -140, ZA + 70], [-130, -140, ZA], [-130, -80, ZA]], 8, 40, 8);
  cylA(fl, "y", [-130, 0, ZA], 14, -100, -78, 12); cylA(fl, "y", [-200, 0, ZA + 70], 16, -200, -190, 10);
});
// ================= bearing housing =================
mod("bearing", [100, 0, ZA], [60, 0, 190], () => {
  const C = [0, 0, ZA], lo = (p, poly, n = 14) => sweepX(p, poly, 180, 360, n);
  lo(P("Bearing Bracket", "bearing", "major"), [[-216, 112], [-216, 165], [-198, 165], [-198, 122], [-78, 122], [-78, 165], [-60, 165], [-60, 112]]);
  lo(P("Bearing Housing", "bearing", "major"), [[-60, 30], [-60, 125], [-40, 125], [-40, 100], [290, 100], [290, 125], [310, 125], [310, 30], [290, 30], [290, 72], [-40, 72], [-40, 30]]);
  lo(P("Outboard End Cover", "bearing", "minor"), [[310, 30], [310, 105], [330, 105], [330, 30]]);
  const bc = P("Bearing Cartridge", "bearing", "minor");
  lo(bc, [[0, 50], [0, 72], [44, 72], [44, 50]]); lo(bc, [[215, 50], [215, 72], [290, 72], [290, 50]]);
  const rb = P("Radial Bearing", "bearing", "major");
  wall(rb, "x", C, [[10, 22], [10, 28], [34, 28], [34, 22]], 28); wall(rb, "x", C, [[10, 44], [10, 50], [34, 50], [34, 44]], 28);
  const tb = P("Thrust Bearings", "bearing", "major");
  [[218, 238], [240, 260]].forEach(([a, b]) => { wall(tb, "x", C, [[a, 22], [a, 28], [b, 28], [b, 22]], 28); wall(tb, "x", C, [[a, 44], [a, 50], [b, 50], [b, 44]], 28); });
  const bb = P("Bearing Balls", "bearing", "minor", { spool: "cage" });
  [22, 228, 250].forEach(x => circlePts(0, 0, 36, 9).forEach(([y, z]) => ball(bb, [x, y, ZA + z], 8)));
  const ln = P("Bearing Lock Nut", "bearing", "minor");
  cylA(ln, "x", [0, 0, ZA], 38, 262, 276, 8); cylA(ln, "x", [0, 0, ZA], 30, 276, 288, 16);
  const oil = P("Oil Sump", "bearing", "minor");
  loop(oil, [[-36, -49], [286, -49], [286, 49], [-36, 49]].map(([x, y]) => [x, y, ZA - 52]));
  for (let i = 0; i < 9; i++) { const x = -20 + 34 * i; line(oil, [x, -40, ZA - 52], [x + 16, 40, ZA - 52]); }
  const sg = P("Sight Glass", "bearing", "minor");
  withFrame(FY, () => { cyl(sg, 140, ZA - 52, 30, -104, -72, 20); loop(sg, circlePts(140, ZA - 52, 21, 20).map(([a, b]) => [a, b, -105])); line(sg, [118, ZA - 58, -105], [162, ZA - 58, -105]); });
  const ol = P("Constant Level Oiler", "bearing", "minor");
  pipe(ol, [[205, -90, ZA - 40], [205, -150, ZA - 40], [205, -150, ZA - 10]], 6, 20, 6);
  revolve(ol, 205, -150, [[0, ZA - 10, true], [24, ZA - 2, true], [34, ZA + 40, true], [24, ZA + 86, true], [10, ZA + 100, true], [0, ZA + 102, true]], 20);
  cylA(ol, "z", [205, -150, 0], 12, ZA + 102, ZA + 116, 10);
  const dr = P("Drain Plug", "bearing", "minor");
  cylA(dr, "z", [70, 0, 0], 12, ZA - 112, ZA - 98, 6);
  const ft = P("Bearing Housing Foot", "bearing", "major");
  box(ft, 60, 240, -125, 125, TOPZ, ZA - 98); [-1, 1].forEach(s => [90, 210].forEach(x => cylA(ft, "z", [x, s * 100, 0], 11, ZA - 98, ZA - 90, 6)));
  box(ft, 40, 260, -140, 140, TOPZ, TOPZ + 14);
});
// ================= suction line =================
const XD = 900, YD = 850, GX = -1400, ZB = ZA;
mod("suction", [-300, 400, ZA], [-250, 200, 40], () => {
  const sp = P("Suction Pipe", "suction", "major");
  pipe(sp, [[XD - 215, YD, ZB], [GX, YD, ZB], [GX, 591, ZB]], 84, 200, 16);
  pipe(sp, [[GX, 309, ZB], [GX, 0, ZB], [-1176, 0, ZB]], 84, 200, 16);
  const rd = P("Suction Reducer", "suction", "major");
  wall(rd, "x", [0, 0, ZB], [[-880, 51], [-880, 142], [-854, 142], [-854, 84], [-690, 57], [-664, 57], [-664, 108], [-640, 108], [-640, 51]], 40);
  const sf = P("Suction Flanges", "suction", "minor");
  wall(sf, "x", [0, 0, ZB], [[-1176, 70], [-1176, 142], [-1150, 142], [-1150, 70]], 40);
  [[GX, 565, 591], [GX, 309, 335]].forEach(([x, a, b]) => wall(sf, "y", [x, 0, ZB], [[a, 70], [a, 142], [b, 142], [b, 70]], 40));
  const sb = P("Suction Flange Bolts", "suction", "minor");
  bolts(sb, "x", [0, 0, ZB], 120, 8, 8, -1182, -1120, 0.2, 6); bolts(sb, "x", [0, 0, ZB], 120, 8, 8, -886, -848, 0.2, 6); bolts(sb, "x", [0, 0, ZB], 90, 8, 8, -670, -610, 0.4, 6);
  [[565, 591], [309, 335]].forEach(([a, b]) => bolts(sb, "y", [GX, 0, ZB], 120, 8, 8, a - 36, b + 36, 0.2, 6));
  const ps = P("Pipe Supports", "suction", "minor");
  [300, -600].forEach(x => { box(ps, x - 80, x + 80, YD - 60, YD + 60, 0, 14); box(ps, x - 45, x + 45, YD - 40, YD + 40, 14, ZB - 84); box(ps, x - 70, x + 70, YD - 30, YD + 30, ZB - 96, ZB - 84); });
});
mod("gate", [GX, 450, ZA], [-120, 60, 180], () => {
  const C = [GX, 0, ZB];
  const gb = P("Gate Valve Body", "gate", "major");
  wall(gb, "y", C, [[335, 70], [335, 142], [361, 142], [361, 100], [539, 100], [539, 142], [565, 142], [565, 70]], 36);
  holes(gb, "y", C, 120, 8, 8, 335.1); holes(gb, "y", C, 120, 8, 8, 564.9);
  const bn = P("Gate Valve Bonnet", "gate", "major");
  wall(bn, "z", [GX, 450, 0], [[ZB + 60, 0], [ZB + 60, 70], [ZB + 160, 70], [ZB + 160, 100], [ZB + 182, 100], [ZB + 182, 0]].slice(0, 6), 28);
  [-70, 70].forEach(s => cylA(bn, "z", [GX + s, 450, 0], 13, ZB + 182, ZB + 380, 10));
  box(bn, GX - 100, GX + 100, 405, 495, ZB + 380, ZB + 400);
  bolts(bn, "z", [GX, 450, 0], 84, 6, 7, ZB + 182, ZB + 192, 0, 6);
  const st = P("Gate Valve Stem", "gate", "minor");
  cylA(st, "z", [GX, 450, 0], 13, ZB + 160, ZB + 470, 14);
  for (let z = ZB + 220; z < ZB + 380; z += 10) loop(st, circlePts(GX, 450, 13.1, 12).map(q => [...q, z]));
  const hw = P("Gate Valve Handwheel", "gate", "major");
  const zw = ZB + 440;
  cylA(hw, "z", [GX, 450, 0], 30, zw - 14, zw + 30, 18);
  tube(hw, circlePts(0, 0, 140, 36).concat([circlePts(0, 0, 140, 36)[0]]).map(([a, b]) => [GX + a, 450 + b, zw]), 8, 8);
  for (let k = 0; k < 6; k++) { const a = 2 * PI * k / 6, c = Math.cos(a), s = Math.sin(a); extrude(hw, polyRegion([[30, -5], [136, -5], [136, 5], [30, 5]].map(([r, w]) => [GX + r * c - w * s, 450 + r * s + w * c])), zw - 4, zw + 4); }
});
mod("strainer", [-1015, 0, ZB], [-100, -200, -60], () => {
  const C = [0, 0, ZB];
  const sbd = P("Strainer Body", "strainer", "major");
  wall(sbd, "x", C, [[-1150, 70], [-1150, 142], [-1124, 142], [-1124, 95], [-906, 95], [-906, 142], [-880, 142], [-880, 70]], 36);
  wall(sbd, "z", [-1015, 0, 0], [[ZB - 20, 70], [ZB - 20, 100], [ZB - 230, 100], [ZB - 230, 70]], 30);
  const sc = P("Strainer Cap", "strainer", "minor");
  cylA(sc, "z", [-1015, 0, 0], 125, ZB - 254, ZB - 230, 30); bolts(sc, "z", [-1015, 0, 0], 108, 8, 8, ZB - 262, ZB - 254, 0, 6);
  const bk = P("Strainer Basket", "strainer", "minor");
  steps(ZB - 215, ZB - 30, 8).forEach(z => loop(bk, circlePts(-1015, 0, 68, 24).map(q => [...q, z])));
  for (let k = 0; k < 16; k++) { const a = 2 * PI * k / 16; line(bk, [-1015 + 68 * Math.cos(a), 68 * Math.sin(a), ZB - 215], [-1015 + 68 * Math.cos(a), 68 * Math.sin(a), ZB - 30]); }
});
// ================= discharge line =================
const DX = NOZ[0], DY = NOZ[1], ZT = ZB + 322 - 0, ZG = 1500, GY = -700;
mod("discharge", [DX, DY, 1000], [0, -300, 160], () => {
  const rd = P("Discharge Reducer", "discharge", "major");
  wall(rd, "z", [DX, DY, 0], [[842, 36], [842, 95], [864, 95], [864, 44], [944, 57], [944, 108], [966, 108], [966, 36]], 32);
  const dpipe = P("Discharge Pipe", "discharge", "major");
  pipe(dpipe, [[DX, DY, 1258], [DX, DY, ZG], [DX, -511, ZG]], 57, 170, 14);
  tube(dpipe, [[DX, -889, ZG], [DX, -1100, ZG]], 57, 16);
  const df = P("Discharge Flanges", "discharge", "minor");
  wall(df, "z", [DX, DY, 0], [[1236, 51], [1236, 108], [1258, 108], [1258, 51]], 32);
  [[-535, -511], [-889, -865], [-1124, -1100], [-1148, -1124]].forEach(([a, b]) => wall(df, "y", [DX, 0, ZG], [[Math.min(a, b), 51], [Math.min(a, b), 108], [Math.max(a, b), 108], [Math.max(a, b), 51]], 32));
  const fb = P("Discharge Flange Bolts", "discharge", "minor");
  bolts(fb, "z", [DX, DY, 0], 80, 8, 7, 842 - 10, 864 + 10, 0.2, 6); bolts(fb, "z", [DX, DY, 0], 80, 8, 7, 944 - 10, 966 + 10, 0.2, 6);
  bolts(fb, "z", [DX, DY, 0], 84, 8, 7, 1258 - 40, 1258 + 12, 0.1, 6);
  [[-535, -511], [-889, -865], [-1148, -1100]].forEach(([a, b]) => bolts(fb, "y", [DX, 0, ZG], 84, 8, 7, a - 40, b + 40, 0.1, 6));
});
mod("check", [DX, DY, 1100], [160, 0, 140], () => {
  const cb = P("Check Valve Body", "check", "major");
  wall(cb, "z", [DX, DY, 0], [[966, 51], [966, 108], [988, 108], [988, 75], [1214, 75], [1214, 108], [1236, 108], [1236, 51]], 32);
  const cv = P("Check Valve Cover", "check", "major");
  cylA(cv, "y", [DX, 0, 1100], 62, DY - 62, DY - 30, 24); cylA(cv, "y", [DX, 0, 1100], 38, DY - 80, DY - 62, 18);
  bolts(cv, "y", [DX, 0, 1100], 50, 6, 6, DY - 70, DY - 62, 0, 6);
  const fp = P("Check Flap", "check", "minor");
  loop(fp, circlePts(DX, 1100, 44, 20).map(([a, b]) => [a, DY - 20, b]).map(([a, y, b]) => [a, y, b]));
  line(fp, [DX, DY - 20, 1144], [DX, DY - 20, 1170]); line(fp, [DX - 20, DY - 20, 1170], [DX + 20, DY - 20, 1170]);
});
mod("globe", [DX, GY, ZG], [0, -180, 160], () => {
  const gb = P("Globe Valve Body", "globe", "major");
  wall(gb, "y", [DX, 0, ZG], [[-865, 51], [-865, 108], [-841, 108], [-841, 75], [-790, 112], [-700, 122], [-610, 112], [-559, 75], [-559, 108], [-535, 108], [-535, 51]], 36);
  const bn = P("Globe Valve Bonnet", "globe", "major");
  wall(bn, "z", [DX, GY, 0], [[ZG + 100, 0], [ZG + 100, 58], [ZG + 180, 58], [ZG + 180, 85], [ZG + 202, 85], [ZG + 202, 0]], 28);
  [-48, 48].forEach(s => cylA(bn, "z", [DX + s, GY, 0], 12, ZG + 202, ZG + 400, 10));
  box(bn, DX - 80, DX + 80, GY - 45, GY + 45, ZG + 400, ZG + 420);
  bolts(bn, "z", [DX, GY, 0], 70, 6, 7, ZG + 202, ZG + 212, 0, 6);
  const gs = P("Globe Stem", "globe", "minor", { spool: "gst" });
  cylA(gs, "z", [DX, GY, 0], 11, ZG + 150, ZG + 490, 14);
  for (let z = ZG + 215; z < ZG + 400; z += 10) loop(gs, circlePts(DX, GY, 11.1, 12).map(q => [...q, z]));
});
mod("gwheel", [DX, GY, ZG + 445], [0, 0, 160], () => {
  const hw = P("Globe Handwheel", "gwheel", "major", { spool: "gwh" });
  const zw = ZG + 445;
  cylA(hw, "z", [DX, GY, 0], 28, zw - 22, zw + 22, 16);
  tube(hw, circlePts(0, 0, 130, 36).concat([circlePts(0, 0, 130, 36)[0]]).map(([a, b]) => [DX + a, GY + b, zw]), 8, 8);
  for (let k = 0; k < 6; k++) { const a = 2 * PI * k / 6, c = Math.cos(a), s = Math.sin(a); extrude(hw, polyRegion([[28, -5], [126, -5], [126, 5], [28, 5]].map(([r, w]) => [DX + r * c - w * s, GY + r * s + w * c])), zw - 4, zw + 4); }
});
// ================= suction drum (cut in quarter) =================
const DR = 300, DT = 12, ZB0 = 1000, ZB1 = 2200, ZLV = 1100, MX = XD - 400, MY = YD - 120;
const ell = (zt, sgn, a, b, r0, r1, n) => steps(r0, r1, n).map(r => [r, zt + sgn * b * Math.sqrt(Math.max(0, 1 - (r / a) * (r / a)))]);
mod("drum", [XD, YD, 1400], [200, 260, 120], () => {
  const A = [0, 270];
  sweepZ(P("Drum Shell", "drum", "major"), [[DR - DT, ZB0], [DR, ZB0], [DR, ZB1], [DR - DT, ZB1]], 0, 270, XD, YD, 20);
  const hd = P("Drum Heads", "drum", "major");
  const bo = ell(ZB0, -1, DR, 150, 300, 88, 8), bi = ell(ZB0, -1, DR - DT, 150 - DT, 88, DR - DT, 8);
  sweepZ(hd, bo.concat(bi), 0, 270, XD, YD, 20);
  const to = ell(ZB1, 1, DR, 150, 300, 55, 8), ti = ell(ZB1, 1, DR - DT, 150 - DT, 55, DR - DT, 8);
  sweepZ(hd, to.concat(ti), 0, 270, XD, YD, 20);
  sweepZ(P("Boot", "drum", "major"), [[88, 860], [100, 860], [100, 450], [0, 450], [0, 462], [88, 462]], 0, 270, XD, YD, 14);
  const lg = P("Drum Legs", "drum", "minor");
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => { const x = XD + a * 250, y = YD + b * 250; box(lg, x - 28, x + 28, y - 28, y + 28, 14, 1040); box(lg, x - 70, x + 70, y - 70, y + 70, 0, 14); box(lg, XD + a * 185, XD + a * 275, YD + b * 185, YD + b * 275, 990, 1040); });
  const fn = P("Feed Nozzle", "drum", "minor");
  wall(fn, "x", [0, YD, 2060], [[XD - 300, 38], [XD - 300, 50], [XD - 430, 50], [XD - 430, 80], [XD - 454, 80], [XD - 454, 38]], 28);
  holes(fn, "x", [0, YD, 2060], 66, 8, 6, XD - 454.1);
  const vn = P("Vent Nozzle", "drum", "minor");
  wall(vn, "z", [XD, YD, 0], [[2345, 45], [2345, 55], [2420, 55], [2420, 80], [2442, 80], [2442, 45]], 28);
  const on = P("Outlet Nozzle", "drum", "major");
  wall(on, "x", [0, YD, ZB], [[XD - 100, 84], [XD - 100, 96], [XD - 190, 96], [XD - 190, 142], [XD - 216, 142], [XD - 216, 84]], 32);
  const vb = P("Vortex Breaker", "drum", "minor");
  box(vb, XD - 95, XD - 55, YD - 45, YD + 45, ZB - 30, ZB + 30); box(vb, XD - 95, XD - 55, YD - 4, YD + 4, ZB - 50, ZB + 50);
  const hl = P("Heel Liquid", "drum", "minor");
  const zin = s => ZB0 - (DR - DT === 0 ? 0 : 138) * Math.sqrt(Math.max(0, 1 - (s / 288) * (s / 288)));
  steps(0, 276, 11).forEach(s => {
    const z0 = s < 86 ? 464 : zin(s);
    line(hl, [XD, YD - s, z0], [XD, YD - s, ZB0]); line(hl, [XD + s, YD, z0], [XD + s, YD, ZB0]);
  });
  line(hl, [XD, YD - 86, 464], [XD, YD + 0, 464]);
  // magnetic level gauge
  const lc = P("Level Gauge Chamber", "drum", "major");
  cylA(lc, "z", [MX, MY, 0], 46, 1080, 2120, 24);
  [1150, 2050].forEach(z => { cylA(lc, "x", [0, MY, z], 24, MX + 46, XD - 275, 14); wall(lc, "x", [0, MY, z], [[MX + 46, 24], [MX + 46, 36], [MX + 62, 36], [MX + 62, 24]], 14); });
  withFrame(FY, () => { loop(lc, [[MX - 15, 1140], [MX + 15, 1140], [MX + 15, 2060], [MX - 15, 2060]].map(([a, b]) => [a, b, MY - 46.2]));
    for (let z = 1140; z <= 2060; z += 40) line(lc, [MX + 15, z, MY - 46.2], [MX + 24, z, MY - 46.2]); });
});
mod("liquid", [XD, YD, ZB0], [60, 60, 250], () => {
  const lq = P("Drum Liquid", "liquid", "minor", { spool: "liq" });
  const H = 1100, Ri = DR - DT;
  steps(0, Ri, 12).forEach(s => { line(lq, [XD, YD - s, ZB0], [XD, YD - s, ZB0 + H]); line(lq, [XD + s, YD, ZB0], [XD + s, YD, ZB0 + H]); });
  [Ri, Ri * 0.75, Ri * 0.5, Ri * 0.25].forEach(r => { const pts = steps(270, 360, 10).map(a => [XD + r * Math.cos(rad(a)), YD + r * Math.sin(rad(a)), ZB0 + H]); pts.forEach((q, i) => i && line(lq, pts[i - 1], q)); });
  line(lq, [XD, YD, ZB0 + H], [XD, YD - Ri, ZB0 + H]); line(lq, [XD, YD, ZB0 + H], [XD + Ri, YD, ZB0 + H]);
});
mod("mlg", [MX, MY, ZLV], [-120, -120, 80], () => {
  const fl = P("Gauge Flags", "mlg", "minor", { spool: "lvl" });
  for (let z = ZLV + 40; z < ZLV + 1000; z += 24) loop(fl, [[MX - 13, z], [MX + 13, z], [MX + 13, z + 19], [MX - 13, z + 19]].map(([a, b]) => [a, MY - 46.5, b]));
  const ft = P("Gauge Float", "mlg", "minor", { spool: "flt" });
  cylA(ft, "z", [MX, MY, 0], 30, ZLV - 20, ZLV + 20, 16);
});
// ================= instruments =================
gauge("gd", "Discharge", [DX, -400, 1295], 55, [0, -200, 60]);
mod("gdt", [DX, -330, 1295], [0, -200, 60], () => { pipe(P("Gauge Tap", "gdt", "minor"), [[DX, DY - 57, 1295], [DX, -345, 1295]], 8, 10, 4); });
gauge("gs", "Suction", [-760, -55, ZA + 200], 52, [0, -200, 80]);
mod("gst2", [-760, 0, ZA + 110], [0, -200, 80], () => pipe(P("Suction Gauge Tap", "gst2", "minor"), [[-760, 0, ZA + 74], [-760, 0, ZA + 150]], 8, 10, 4));
gauge("gp", "Suction DP", [-1015, -230, ZA + 300], 56, [-80, -200, 80]);
mod("gpt", [-1015, -60, ZA + 200], [-80, -200, 80], () => {
  const it = P("DP Impulse Lines", "gpt", "minor");
  pipe(it, [[-1130, 0, ZA + 92], [-1130, 0, ZA + 150], [-1040, -190, ZA + 150], [-1040, -190, ZA + 252]], 6, 30, 6);
  pipe(it, [[-900, 0, ZA + 92], [-900, 0, ZA + 150], [-990, -190, ZA + 150], [-990, -190, ZA + 252]], 6, 30, 6);
});
// local control station
const LX = 1480, LY = -560;
mod("lcs", [LX, LY, 1100], [0, -250, 120], () => {
  const en = P("LCS Enclosure", "lcs", "major");
  box(en, LX - 140, LX + 140, LY - 70, LY + 70, 1000, 1380);
  loop(en, [[LX - 124, 1016], [LX + 124, 1016], [LX + 124, 1364], [LX - 124, 1364]].map(([a, b]) => [a, LY - 70.1, b]));
  const ps = P("LCS Post", "lcs", "minor");
  cylA(ps, "z", [LX, LY, 0], 30, 14, 1000, 20); box(ps, LX - 110, LX + 110, LY - 110, LY + 110, 0, 14); bolts(ps, "z", [LX, LY, 0], 150, 4, 9, 14, 22, 0.78, 6);
  const pb = P("Push Buttons", "lcs", "minor");
  [[LX - 80, 12], [LX, 12], [LX + 80, 24]].forEach(([x, r]) => { withFrame(FY, () => { cyl(pb, x, 1100, r + 6, LY - 74, LY - 70, 20); cyl(pb, x, 1100, r, LY - 90, LY - 74, 20); }); });
  const cd = P("Conduit", "lcs", "minor");
  pipe(cd, [[LX - 40, LY + 70, 1120], [LX - 40, LY + 110, 1120], [885, LY + 110, 720], [885, -100, 720]], 14, 60, 6);
});
gauge("am", "Ammeter", [LX, LY - 70, 1250], 52, [0, -250, 120], 30);
// ================= exploded view: each module along its own axis, in flow order =================
const EXP = {
  base: [0, 0, -260], motor: [650, 0, 60], coupling: [330, 0, 130], guard: [330, 0, 430], bearing: [150, 0, 50], seal: [60, -260, 130],
  casing: [-120, 200, 170], rotor: [350, 350, 700],
  suction: [-450, 60, -40], gate: [-300, 60, 300], strainer: [-250, -320, -80],
  discharge: [300, 150, 100], check: [-60, 420, 380], globe: [300, -260, 130], gwheel: [300, -260, 430],
  drum: [300, 300, 400], liquid: [300, 300, 400], mlg: [300, 300, 400],
  gd: [300, -150, 160], gdt: [300, 0, 130], gs: [-450, -260, 100], gst2: [-450, -130, 40], gp: [-250, -540, 100], gpt: [-250, -430, 40],
  lcs: [150, -250, 100], am: [150, -250, 100],
};
Object.keys(EXP).forEach(k => { explode[k].offset = EXP[k]; });
// ================= callouts and tour =================
const loc = (n, p) => r3(sub(p, MODS[PM[n]]));
const rv = (psi, x) => { const r = RV(psi) + 14; return [x, -r * Math.cos(rad(psi)), ZA + r * Math.sin(rad(psi))]; };
const H = [
  ["Suction drum", "Cut in quarter; its level is the suction head", [XD - 300, YD, 1700], "Drum Shell"],
  ["Level gauge", "Magnetic float, flags flip with the level", [MX, MY - 47, 1700], "Level Gauge Chamber"],
  ["Gate valve", "Rising stem, open in service", [GX + 140, 450, ZB + 440], "Gate Valve Handwheel"],
  ["Strainer", "A clogging basket takes suction pressure", [-1015, 0, ZB + 95], "Strainer Body"],
  ["Strainer gauge", "Differential pressure across the basket", [-1015, -235, ZA + 300], "Suction DP Gauge"],
  ["Suction nozzle", "End suction, DN100", [-628, 0, ZA + 108], "Suction Nozzle"],
  ["Volute", "The spiral passage grows from the cutwater", rv(250, XI - 9), "Volute Casing"],
  ["Cutwater", "Where the spiral starts", [XI - 9, -214, ZA], "Cutwater"],
  ["Impeller", "Six backswept vanes, 410 mm", vp3(0, 0.75, 0, 0.5), "Impeller Vanes"],
  ["Vapour sheets", "Form on the suction side near the eye", vp3(0, 0.15, -3.2, 0.4), "Vapour Sheets L"],
  ["Mechanical seal", "Metal bellows in the seal chamber", [-176, 0, ZA - 52], "Metal Bellows"],
  ["Bearing housing", "Ball bearings and an oil sump", [100, -94, ZA - 34], "Bearing Housing"],
  ["Spacer coupling", "Lets the seal be changed without moving the motor", [455, 0, ZA + 44], "Spacer"],
  ["Motor", "18.5 kW, four poles", [780, 0, ZA + 155], "Motor Frame"],
  ["Check valve", "Swing flap stops back flow", [DX + 75, DY, 1100], "Check Valve Body"],
  ["Globe valve", "Throttles the flow", [DX + 130, GY, ZG + 445], "Globe Handwheel"],
  ["Discharge gauge", "Head: falls when it cavitates", [DX, -405, 1295], "Discharge Gauge"],
  ["Ammeter", "Motor current", [LX, LY - 75, 1250], "Ammeter Gauge"],
  ["Baseplate", "Fabricated, grouted on site", [1500, -350, 76], "Baseplate"],
].map(([t, s, p, o]) => ({ t, s, p: loc(o, p), o: [o] }));
const T = (n, p) => [...loc(n, p), n];
const tour = {
  points: {
    drum: T("Drum Shell", [XD - 300, YD, 1700]), lvl: T("Level Gauge Chamber", [MX, MY - 47, 1700]), outl: T("Outlet Nozzle", [XD - 150, YD, ZB + 96]),
    strn: T("Strainer Body", [-1015, 0, ZB + 95]), snoz: T("Suction Nozzle", [-628, 0, ZA + 108]),
    imp: T("Impeller Vanes", vp3(1, 0.8, 0, 0.5)), eye: T("Impeller Vanes", vp3(0, 0.05, 0, 0.5)), vol: T("Volute Casing", rv(250, XI - 9)), cut: T("Cutwater", [XI - 9, -214, ZA]),
    thr: T("Throat", [XI - 9, -302, ZA + 120]), seal: T("Metal Bellows", [-176, 0, ZA - 52]), brg: T("Bearing Housing", [100, -94, ZA - 34]), cpl: T("Spacer", [455, 0, ZA + 44]),
    vap: T("Vapour Sheets L", vp3(2, 0.15, -3.2, 0.4)), chk: T("Check Valve Body", [DX + 75, DY, 1100]), glb: T("Globe Valve Body", [DX, GY - 122, ZG]), dg: T("Discharge Gauge", [DX, -405, 1295]),
    mot: T("Motor Frame", [780, 0, ZA + 155]),
  },
  steps: [
    { t: "The drum feeds the suction", focus: "lvl", dist: 0.8, ex: 0, p: ["drum", "lvl", "outl"], n: ["Drum Shell", "Drum Liquid", "Level Gauge Chamber", "Gauge Flags"], ms: 4600,
      d: "The liquid level in the drum, shown in the cut and on the magnetic gauge, is most of the suction head. It sits just below its bubble point, so there is little margin." },
    { t: "Strainer and suction line", focus: "strn", dist: 0.8, ex: 0, p: ["outl", "strn", "snoz"], n: ["Strainer Body", "Gate Valve Body", "Suction Pipe", "Suction DP Gauge"], ms: 4200,
      d: "Each metre of line, the strainer and the gate valve take pressure from the head. A fouled basket, read on its differential gauge, eats NPSH available." },
    { t: "The impeller adds energy", focus: "imp", dist: 0.5, ex: 0, p: ["eye", "imp"], n: ["Impeller Vanes", "Impeller Shrouds", "Impeller Hub"], ms: 4400,
      d: "Six backswept vanes on the 410 mm impeller whirl the liquid at about 1,480 rpm and fling it outward, raising its speed and pressure." },
    { t: "The volute makes pressure", focus: "vol", dist: 0.55, ex: 0, p: ["cut", "vol", "thr"], n: ["Volute Casing", "Cutwater", "Throat", "Discharge Nozzle"], ms: 4400,
      d: "The spiral casing grows from the cutwater so the passage widens; the liquid slows and its speed turns into pressure before the throat leads it up the discharge nozzle." },
    { t: "Seal and bearings", focus: "seal", dist: 0.5, ex: 1, p: ["seal", "brg", "cpl"], n: ["Metal Bellows", "Seal Chamber", "Gland Plate", "Bearing Housing", "Thrust Bearings", "Radial Bearing"], ms: 4600,
      d: "A metal bellows seal keeps the hot gas oil in the seal chamber; ball bearings in an oil sump carry the shaft and its thrust; a spacer coupling joins the 18.5 kW motor." },
    { t: "The discharge valves", focus: "glb", dist: 0.6, ex: 0, p: ["chk", "glb", "dg"], n: ["Discharge Reducer", "Check Valve Body", "Globe Valve Body", "Globe Handwheel", "Discharge Gauge"], ms: 4200,
      d: "The discharge rises through a reducer, a swing check valve and a throttling globe valve. Closing the globe valve cuts the flow, and the gauge shows the head the pump makes." },
    { t: "Cavitation", focus: "vap", dist: 0.35, ex: 0, p: ["eye", "vap"], n: ["Vapour Sheets S", "Vapour Sheets M", "Vapour Sheets L", "Impeller Vanes"], ms: 5200,
      d: "When the suction head falls below what the impeller needs (NPSH required), the liquid boils at the low pressure behind each vane's inlet edge. Vapour sheets grow; they collapse violently downstream, pitting the metal, and the head on the discharge gauge drops." },
  ],
};
const geometry = geometryScript("PPU_GEOMETRY", "processpump/build.js", { explode, hotspots: H, tour,
  constants: { ZLV, LEVEL_SPAN: 1100, ZB0, MLG_RANGE: 1000 } });
writeGeometry(HERE, geometry);
console.log(`models/processpump/geometry.js: ${geometry.stats}`);
