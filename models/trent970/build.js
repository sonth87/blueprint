/*
Rolls-Royce Trent 970 turbofan on a ground-run thrust frame: builds its geometry.

After the "Turbofan ground run" figure in Anatomy (github.com/wheresryan22/anatomy, MIT, by Ryan), rebuilt here as a 3D
blueprint model at full size: a three-spool turbofan about 4.5 m long with a 2.95 m, 24-blade fan, hung by its pylon under
the live frame of a ground-run thrust frame on a concrete pad, with its near upper quarter cut away. A load cell between
the live frame and the fixed frame reads the thrust on a dial hung from the end of the strongback.

Drawn in cm (an engine this size does not fit the Int16 packing in mm). The engine's axis runs along X, the intake at -X,
at height ZE above the pad; Z is up and the near side is -Y. Every part of a spool is drawn about the axis (relative to
ZE) and its module has base [0, 0, ZE], so model.js can turn it with a quaternion about X. Everything else is drawn in
world coordinates (static engine parts through the ZF frame).

    node models/trent970/build.js

Writes models/trent970/geometry.js. Layout of the engine's inside (blade counts, stage radii, bearing places) is estimated
from the published stage counts and the general Trent 900 arrangement, not from drawings.
*/
"use strict";
const { withFrame, part, line, tri, loop, circlePts, rect, polyRegion, extrude, revolve, tube, r3, geometryScript, writeGeometry } =
  require("../../kit/procedural");

const HERE = __dirname;
const PI = Math.PI, TAU = 2 * PI;
const rad = d => d * PI / 180;
const ZE = 300;                                                // engine axis height above the pad
const AX = (x, r, a) => [x, r * Math.sin(a), r * Math.cos(a)]; // axial station, radius, angle from the top towards +Y (near side is negative)
const ZF = q => [q[0], q[1], q[2] + ZE];                       // the engine's static parts: axis at ZE
const AXZ = q => [q[2], q[0], q[1]];                           // revolve about X (radius in, radius in, axial); region (y, z) pushed along x
const FY = q => [q[0], q[2], q[1]];                            // region (x, z) pushed along y
const CUT = [0, 1.5 * PI];                                     // cowls and casings are kept from the top round the far side to the near-lower side

// ---------- helpers ----------
const rev = (p, prof, n = 48, closed = false) => withFrame(AXZ, () => revolve(p, 0, 0, prof, n, closed));   // profile [r, x, hard]
const box = (p, x0, x1, y0, y1, z0, z1) => extrude(p, rect(x0, x1, y0, y1), z0, z1);
const xAt = (x, a) => (typeof x === "function" ? x(a) : x);
// a double skin round the axis from angle a0 to a1: outer and inner profiles [x, r, hard] of equal length; the cut
// faces and the end faces are closed and lined, so the cut-away shows a real wall thickness
function skin(p, outer, inner, [a0, a1], n, o = {}) {
  const full = Math.abs(a1 - a0 - TAU) < 1e-6;
  const rings = prof => prof.map(([x, r, h]) => ({ h, pts: Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return AX(xAt(x, a), r, a); }) }));
  const O = rings(outer), I = rings(inner), K = outer.length;
  const quad = (A, B) => { for (let i = 0; i < n; i++) { tri(p, A[i], A[i + 1], B[i + 1]); tri(p, A[i], B[i + 1], B[i]); } };
  for (let k = 0; k + 1 < K; k++) { quad(O[k].pts, O[k + 1].pts); quad(I[k].pts, I[k + 1].pts); }
  const ringLine = pts => { for (let i = 0; i < n; i++) line(p, pts[i], pts[i + 1]); };
  [0, K - 1].forEach(k => { ringLine(O[k].pts); ringLine(I[k].pts); quad(O[k].pts, I[k].pts); });
  O.forEach((g, k) => { if (g.h) ringLine(g.pts); if (I[k].h || o.innerHard) ringLine(I[k].pts); });
  if (!full) [0, n].forEach(i => {
    for (let k = 0; k + 1 < K; k++) {
      line(p, O[k].pts[i], O[k + 1].pts[i]); line(p, I[k].pts[i], I[k + 1].pts[i]);
      tri(p, O[k].pts[i], O[k + 1].pts[i], I[k + 1].pts[i]); tri(p, O[k].pts[i], I[k + 1].pts[i], I[k].pts[i]);
    }
    for (let k = 0; k < K; k++) if (k === 0 || k === K - 1 || O[k].h) line(p, O[k].pts[i], I[k].pts[i]);
  });
  if (o.seams) for (let i = 0; i <= n; i += Math.max(1, Math.round(n / o.seams))) for (let k = 0; k + 1 < K; k++) line(p, O[k].pts[i], O[k + 1].pts[i]);
}
// one blade of a row, as a thin lens: n of them round the axis. o.x/c/st/th/cam are functions of u (0 root, 1 tip)
function bladeRow(p, o) {
  const ns = o.ns || 2, nc = o.nc || 3;
  for (let b = 0; b < o.n; b++) {
    const a0 = (o.a0 || 0) + TAU * b / o.n;
    const sides = [1, -1].map(sg => {
      const g = [];
      for (let k = 0; k < ns; k++) {
        const u = ns > 1 ? k / (ns - 1) : 0, r = o.r0 + (o.r1 - o.r0) * u;
        const c = o.c(u), st = o.st(u), x0 = o.x(u), t = o.th(u), cam = o.cam ? o.cam(u) : 0;
        const row = [];
        for (let j = 0; j < nc; j++) {
          const s = j / (nc - 1), bump = Math.sin(PI * s);
          const off = sg * t * Math.pow(bump, 0.8) + cam * bump;
          const ax = x0 + s * c * Math.cos(st) - off * Math.sin(st);
          const tg = s * c * Math.sin(st) - c * Math.sin(st) / 2 + off * Math.cos(st);
          row.push(AX(ax, r, a0 + tg / r));
        }
        g.push(row);
      }
      return g;
    });
    sides.forEach(g => {
      for (let k = 0; k + 1 < ns; k++) for (let j = 0; j + 1 < nc; j++) { tri(p, g[k][j], g[k][j + 1], g[k + 1][j + 1]); tri(p, g[k][j], g[k + 1][j + 1], g[k + 1][j]); }
      for (let j = 0; j + 1 < nc; j++) { line(p, g[0][j], g[0][j + 1]); line(p, g[ns - 1][j], g[ns - 1][j + 1]); }
      for (let k = 0; k + 1 < ns; k++) { line(p, g[k][0], g[k + 1][0]); line(p, g[k][nc - 1], g[k + 1][nc - 1]); }
    });
  }
}
const ring3 = (x, r, n = 48, a0 = 0) => Array.from({ length: n }, (_, i) => AX(x, r, a0 + TAU * i / n));
// the hub rim of a rotor row: lines only, so the shafts inside stay visible through it
function rim(p, x, r, hw, rin, spokes = 24) {
  [x - hw, x + hw].forEach(xx => { loop(p, ring3(xx, r, 48)); loop(p, ring3(xx, rin, 48)); });
  for (let i = 0; i < spokes; i++) {
    const a = TAU * i / spokes;
    line(p, AX(x - hw, r, a), AX(x + hw, r, a));
    line(p, AX(x - hw, rin, a), AX(x - hw, r, a)); line(p, AX(x + hw, rin, a), AX(x + hw, r, a));
  }
}
// a lines-only drum through stage rims [x, r]
function drum(p, pts, n = 48, seams = 16) {
  pts.forEach(([x, r]) => loop(p, ring3(x, r, n)));
  for (let i = 0; i < seams; i++) for (let k = 0; k + 1 < pts.length; k++) line(p, AX(pts[k][0], pts[k][1], TAU * i / seams), AX(pts[k + 1][0], pts[k + 1][1], TAU * i / seams));
}
// LCG so the random-looking streaks are the same every build
let seed = 7;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

// ---------- the engine's stations (cm) ----------
const R_FAN = 147.6, R_HUB = 46.5;
const IPC = Array.from({ length: 8 }, (_, i) => ({ x: -118 + 10 * i, rh: 36 + 0.9 * i, rc: 54 - 1.0 * i, n: [52, 52, 56, 56, 60, 60, 64, 64][i], c: 7 - 0.3 * i }));
const HPC = Array.from({ length: 6 }, (_, j) => ({ x: -26 + 8.8 * j, rh: 27 + 0.8 * j, rc: 41 - 1.0 * j, n: [66, 70, 74, 78, 82, 86][j], c: 5 - 0.25 * j }));
const LPT = Array.from({ length: 5 }, (_, k) => ({ x: 120 + 15 * k, xs: 110 + 15 * k, rh: 30 + 2.4 * k, rc: 46 + 4.4 * k, n: [74, 78, 82, 86, 90][k], c: 8 + 0.5 * k }));
const HPT = { x: 84, rh: 25, rc: 34.8 }, IPT = { x: 100, rh: 27, rc: 40.6 };
const X_EXIT = 218;                                         // core nozzle exit
const PLUG_TIP = 268;
const XJET = 480;                                           // far end of the hot jet

// ---------- the world: pad and frame ----------
const COLX = [-330, 330], COLY = [-215, 215], TOPZ = [604, 640];
const LIVE_Z = [536, 560], XD = -430, YD = -25.2, ZD = 505;     // dial centre and its needle plane

const explode = {
  pad: [0, 0, -34], fixed: [0, 0, 78], bracket: [60, 0, 78], flex: [0, 0, 56], live: [0, 0, 36], loadcell: [-110, 0, 40], strongback: [-120, 0, 70], dialcase: [-170, -25, 52],
  needle: { offset: [-170, -60, 52], base: [XD, YD - 1, ZD] },
  pylon: [0, 0, 18], mounts: [0, 30, 6],
  intake: [-190, -50, 30], fancase: [-130, -55, 45], fancowl: [-30, -85, 60], reverser: [130, -70, 40], cascades: [90, -35, 8], corecowl: [60, -100, 20],
  fan: { offset: [-250, 0, 10], base: [0, 0, ZE] }, ogv: [-150, 0, -10],
  ipc: { offset: [-115, 0, 0], base: [0, 0, ZE] }, ipcase: [-115, -50, -50],
  hpc: { offset: [-50, 0, 0], base: [0, 0, ZE] }, hpcase: [-50, -50, -50],
  comb: [20, -55, -40], hptn: [45, 0, -45], hpt: { offset: [55, 0, 0], base: [0, 0, ZE] }, iptn: [80, 0, -45], ipt: { offset: [95, 0, 0], base: [0, 0, ZE] },
  lpt: { offset: [150, 0, 0], base: [0, 0, ZE] }, lptstat: [130, -30, -55],
  lpshaft: { offset: [-40, 0, -85], base: [0, 0, ZE] }, ipshaft: { offset: [-40, 0, -125], base: [0, 0, ZE] }, hpshaft: { offset: [-40, 0, -165], base: [0, 0, ZE] },
  bearings: [0, 0, -195], nozzle: [225, 0, 0], air: [-90, 0, 20], wind: [110, 0, 30], jet: [200, 0, 0],
};

// pad and world parts first (no engine frame)
const pad = part("Concrete Pad", "pad", "major");
box(pad, -540, 520, -270, 270, -25, 0);
for (let x = -400; x < 520; x += 140) line(pad, [x, -270, 0.2], [x, 270, 0.2]);                    // expansion joints
for (const y of [-135, 0, 135]) line(pad, [-540, y, 0.2], [520, y, 0.2]);
loop(pad, [[-520, -110, 0.2], [-520, 110, 0.2], [-400, 110, 0.2], [-400, -110, 0.2]]);              // a recessed slab under the intake
loop(pad, [[290, -90, 0.2], [290, 90, 0.2], [500, 90, 0.2], [500, -90, 0.2]]);                     // blast apron under the jet
const anchors = part("Anchor Plates", "pad", "minor");
COLX.forEach(x => COLY.forEach(y => {
  box(anchors, x - 30, x + 30, y - 30, y + 30, 0, 8);
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => tube(anchors, [[x + sx * 22, y + sy * 22, 8], [x + sx * 22, y + sy * 22, 15]], 2.4, 8));   // anchor bolts
}));

const fixed = part("Fixed Frame", "fixed", "major");
COLX.forEach(x => COLY.forEach(y => {
  box(fixed, x - 15, x + 15, y - 15, y + 15, 8, TOPZ[0]);
  line(fixed, [x - 15, y - 15.2, 8], [x - 15, y - 15.2, TOPZ[0]]);
  for (let z = 120; z < 590; z += 120) { loop(fixed, [[x - 15.3, y - 15.3, z], [x + 15.3, y - 15.3, z], [x + 15.3, y + 15.3, z], [x - 15.3, y + 15.3, z]]); }   // splice bands
}));
COLY.forEach(y => box(fixed, COLX[0] - 15, COLX[1] + 15, y - 15, y + 15, TOPZ[0], TOPZ[1]));       // outer beams along the engine
[-70, 70].forEach(y => box(fixed, COLX[0] - 15, COLX[1] + 15, y - 10, y + 10, TOPZ[0], TOPZ[1]));   // inner beams the live frame hangs from
COLX.forEach(x => box(fixed, x - 15, x + 15, COLY[0] - 15, COLY[1] + 15, TOPZ[0], TOPZ[1]));        // cross beams
const brace = part("Frame Bracing", "fixed", "minor");
COLX.forEach((x, i) => COLY.forEach(y => tube(brace, [[x, y, 500], [x + (i ? -90 : 90), y, TOPZ[0]]], 3.2, 8)));   // knee braces
const bracket = part("Reaction Bracket", "bracket", "major");
[-70, 70].forEach(y => box(bracket, -226, -196, y - 8, y + 8, 524, TOPZ[0]));                            // two hangers from the inner beams
box(bracket, -203, -193, -78, 78, 524, 604);                                                          // the plate the load cell and the strongback bear on
for (let z = 536; z < 604; z += 17) line(bracket, [-203.2, -78, z], [-203.2, 78, z]);

const flex = part("Flexures", "flex", "minor");
[-112, 128].forEach(x => [-70, 70].forEach(y => { box(flex, x - 0.7, x + 0.7, y - 13, y + 13, LIVE_Z[1], TOPZ[0]); box(flex, x - 3, x + 3, y - 15, y + 15, LIVE_Z[1], LIVE_Z[1] + 4); box(flex, x - 3, x + 3, y - 15, y + 15, TOPZ[0] - 4, TOPZ[0]); }));
const live = part("Live Frame", "live", "major");
[-70, 70].forEach(y => {   // I-beams along the engine
  box(live, -139, 150, y - 8, y + 8, LIVE_Z[0], LIVE_Z[0] + 4); box(live, -139, 150, y - 8, y + 8, LIVE_Z[1] - 4, LIVE_Z[1]); box(live, -139, 150, y - 1.2, y + 1.2, LIVE_Z[0] + 4, LIVE_Z[1] - 4);
});
[[-139, -119], [-92, -72], [90, 110], [130, 150]].forEach(([a, b]) => box(live, a, b, -78, 78, LIVE_Z[0], LIVE_Z[1]));   // cross members

// the load cell and the strongback
const loadcell = part("Load Cell", "loadcell", "major");
withFrame(q => [q[0], q[1], q[2] + 548], () => {
  rev(loadcell, [[0, -192], [13, -192, true], [13, -188, true], [8.5, -188, true], [8.5, -143, true], [13, -143, true], [13, -139, true], [0, -139]], 40);
  [-190, -141].forEach(x => { for (let k = 0; k < 6; k++) { const a = TAU * k / 6; tube(loadcell, [[x - 0.8, 10.8 * Math.cos(a), 10.8 * Math.sin(a)], [x + 0.8, 10.8 * Math.cos(a), 10.8 * Math.sin(a)]], 1.2, 6); } });
  loop(loadcell, ring3(-165, 8.6, 36).map(q => [q[0], q[2] - 0, q[1]]));
});
const cable = part("Signal Cable", "loadcell", "minor");
tube(cable, [[-165, -9, 549], [-172, -18.5, 552], [-196, -18.5, 566], [-410, -18.5, 566], [-428, -18.5, 548], [-430, -18.5, ZD + 34]], 1.2, 8);
const strong = part("Strongback", "strongback", "major");
box(strong, -440, -196, -14, 14, 556, 580);
for (let x = -420; x < -200; x += 22) { line(strong, [x, -14.2, 556], [x, -14.2, 580]); line(strong, [x, -14.2, 556], [x + 22, -14.2, 580]); }
[XD - 8, XD + 8].forEach(x => tube(strong, [[x, -14, 556], [x, -17.2, ZD + 33.5]], 1.4, 8));         // the hangers the dial hangs on
const dial = part("Dial Gauge", "dialcase", "major");
withFrame(q => [q[0] + XD, q[1], q[2] + ZD], () => {
  withFrame(q => [q[0], q[2], q[1]], () => revolve(dial, 0, 0, [[0, -17], [34, -17, true], [34, -25.5, true], [32.5, -27, true], [30.5, -27, true], [30.5, -24.8, true], [0, -24.8]], 64));
  for (let i = 0; i <= 80; i++) {   // 0 to 400 kN round 270 degrees: a tick every 5 kN, long at every 50
    const th = rad(-135 + 270 * i / 80), major = i % 10 === 0, r0 = major ? 21.5 : i % 2 === 0 ? 25 : 26.6;
    line(dial, [29 * Math.sin(th), -25, 29 * Math.cos(th)], [r0 * Math.sin(th), -25, r0 * Math.cos(th)]);
  }
  for (let i = 0; i < 80; i++) { const a = rad(-135 + 270 * i / 80), b = rad(-135 + 270 * (i + 1) / 80); line(dial, [29 * Math.sin(a), -25, 29 * Math.cos(a)], [29 * Math.sin(b), -25, 29 * Math.cos(b)]); }
  loop(dial, Array.from({ length: 24 }, (_, i) => [8 * Math.sin(TAU * i / 24), -24.9, 8 * Math.cos(TAU * i / 24)]));
});
const needle = part("Dial Needle", "needle", "major", { spool: "dial" });
withFrame(FY, () => extrude(needle, polyRegion([[-1.3, -7], [1.3, -7], [0.45, 27.5], [-0.45, 27.5]]), -0.4, 0.4));
withFrame(q => [q[0], q[2], q[1]], () => revolve(needle, 0, 0, [[0, 1.2], [3.2, 1.2, true], [3.2, -0.4, true], [0, -0.4]], 24));

// ---------- the engine, static parts (axis at ZE) ----------
withFrame(ZF, () => {
  const lip = (x0, w) => a => x0 - w * (1 - Math.cos(a)) / 2;              // the scarfed lip: the bottom reaches further forward
  const intake = part("Intake Cowl", "intake", "major");
  skin(intake,
    [[lip(-251, 14), 159, true], [lip(-247, 10), 163], [lip(-236, 4), 166.5], [-222, 169, true], [-196, 171, true]],
    [[lip(-251, 14), 150], [lip(-247, 10), 149.6], [lip(-236, 4), 149.6], [-222, 149.6], [-196, 149.6, true]], CUT, 96, { seams: 12 });
  const liner = part("Acoustic Liner", "intake", "minor");
  {   // the perforated inner barrel with its honeycomb
    const n = 96;
    skin(liner, [[-243, 149.2, true], [-196, 149.2, true]], [[-243, 148], [-196, 148]], CUT, n);
    for (let x = -243; x <= -196; x += 3.4) { for (let i = 0; i < n; i++) { const a = CUT[1] * i / n; if (i % 2 === 0) line(liner, AX(x, 148, a), AX(x, 148, a + CUT[1] / n)); } }
    for (let i = 0; i <= n; i += 1) { const a = CUT[1] * i / n; for (let x = -243; x < -196; x += 6.8) line(liner, AX(x + (i % 2 ? 0 : 3.4), 148, a), AX(x + (i % 2 ? 3.4 : 6.8), 148, a)); }
  }
  const fancase = part("Fan Case", "fancase", "major");
  skin(fancase,
    [[-196, 152, true], [-193, 152], [-193, 157.5, true], [-190, 157.5, true], [-190, 153], [-170, 153.4, true], [-146, 153.4, true], [-132, 153], [-132, 157.5, true], [-128, 157.5, true], [-128, 152, true], [-125, 152, true]],
    [[-196, 148.3], [-193, 148.3], [-193, 148.3], [-190, 148.3], [-190, 148.3], [-170, 148.3], [-146, 148.3], [-132, 148.3], [-132, 148.3], [-128, 148.3], [-128, 148.3], [-125, 148.3]], CUT, 96);
  const fancowl = part("Fan Cowl", "fancowl", "major");
  skin(fancowl,
    [[-196, 171, true], [-160, 172.6], [-120, 172.4, true], [-60, 168], [-10, 162, true]],
    [[-196, 158.5], [-130, 158.5], [-126, 149.4], [-60, 148.6], [-10, 147]], CUT, 96, { seams: 12 });
  for (let k = 0; k < 4; k++) { const a = rad(110 + 40 * k); [-160, -90].forEach(x => { loop(fancowl, [AX(x, 172.4 - 0.05, a), AX(x + 6, 172.2, a), AX(x + 6, 172.2, a + 0.05), AX(x, 172.4, a + 0.05)]); }); }   // latches
  const reverser = part("Thrust Reverser Sleeve", "reverser", "major");
  skin(reverser,
    [[-10, 162, true], [10, 160], [40, 155], [75, 148.5], [110, 142, true]],
    [[-10, 147], [10, 146.5], [40, 144.5], [75, 141.5], [110, 139]], CUT, 96, { seams: 12 });
  const casc = part("Reverser Cascades", "cascades", "minor");
  {
    const n = 72, xs = Array.from({ length: 11 }, (_, i) => 2 + 5.8 * i);
    xs.forEach(x => { loop(casc, ring3(x, 145.6, n)); });
    for (let i = 0; i < n; i++) { const a = TAU * i / n; for (let k = 0; k + 1 < xs.length; k++) line(casc, AX(xs[k], 145.6, a), AX(xs[k + 1], 145.6, a + TAU / n * 0.55)); }
    loop(casc, ring3(2, 141, n)); loop(casc, ring3(60, 141, n));
    for (let i = 0; i < n; i += 3) { const a = TAU * i / n; line(casc, AX(2, 141, a), AX(2, 145.6, a)); line(casc, AX(60, 141, a), AX(60, 145.6, a)); }
  }

  const corecowl = part("Core Cowl", "corecowl", "major");
  {
    const pts = [[-136, 56.2, true], [-100, 60.5], [-60, 61, true], [-40, 57], [0, 50.8], [40, 50.2, true], [70, 51.5], [100, 55.5, true], [130, 63.4], [170, 69.4], [196, 70.2, true]];
    skin(corecowl, pts, pts.map(([x, r, h]) => [x, r - 1.6, false]), CUT, 96, { seams: 12 });
  }
  const ogv = part("Outlet Guide Vanes", "ogv", "major");
  bladeRow(ogv, { n: 40, ns: 4, nc: 3, r0: 57.5, r1: 148.2, x: () => -148, c: () => 18, st: u => rad(14 + 12 * u), th: () => 1.4, a0: 0.04 });
  const inter = part("Intermediate Case", "ogv", "major");
  {
    skin(inter, [[-138, 55.3, true], [-130, 56.2], [-122, 55.6, true]], [[-138, 54.2], [-130, 54.6], [-122, 54.6]], CUT, 64);
    bladeRow(inter, { n: 10, ns: 2, nc: 3, r0: 15, r1: 54.6, x: () => -134, c: () => 12, st: () => 0, th: () => 1.6 });
    rev(inter, [[14, -140, true], [16, -134, true], [18.5, -124, true], [22, -118, true]], 40);
  }
  // compressor casings and stator rows
  const ipcase = part("IP Compressor Casing", "ipcase", "major");
  {
    const O = [], I = [];
    IPC.forEach((s, i) => { O.push([s.x - 5, s.rc + 1.4, true], [s.x + 4.9, s.rc + 1.4 - (i < 7 ? 0.0 : 0)]); I.push([s.x - 5, s.rc + 0.3], [s.x + 4.9, s.rc + 0.3]); });
    O.push([-42, 49.2, true]); I.push([-42, 47.6]);
    skin(ipcase, O, I, CUT, 72, { seams: 8 });
  }
  const ipst = part("IPC Stator Vanes", "ipcase", "minor");
  IPC.forEach((s, i) => bladeRow(ipst, { n: s.n - 4, ns: 2, nc: 3, r0: s.rh + 0.4, r1: s.rc + 0.4, x: () => s.x + 3, c: () => s.c - 1, st: () => rad(-34), th: () => 0.35, a0: 0.02 + 0.03 * i }));
  const hpcase = part("HP Compressor Casing", "hpcase", "major");
  {
    const O = [[-42, 48.6, true], [-34, 43.2]], I = [[-42, 47.2], [-34, 41.8]];
    HPC.forEach(s => { O.push([s.x - 4.6, s.rc + 1.4, true], [s.x + 4.4, s.rc + 1.4]); I.push([s.x - 4.6, s.rc + 0.3], [s.x + 4.4, s.rc + 0.3]); });
    O.push([24, 36.6, true]); I.push([24, 35.4]);
    skin(hpcase, O, I, CUT, 72, { seams: 8 });
  }
  const hpst = part("HPC Stator Vanes", "hpcase", "minor");
  HPC.forEach((s, j) => bladeRow(hpst, { n: s.n - 6, ns: 2, nc: 3, r0: s.rh + 0.3, r1: s.rc + 0.4, x: () => s.x + 3.8, c: () => s.c - 0.6, st: () => rad(-34), th: () => 0.28, a0: 0.02 + 0.03 * j }));

  // combustor
  const ccase = part("Combustor Casing", "comb", "major");
  skin(ccase, [[24, 37.4, true], [32, 43.2], [66, 43.2, true], [74, 36.2, true]], [[24, 36.2], [32, 42], [66, 42], [74, 35]], CUT, 72, { seams: 8 });
  const cliner = part("Combustor Liner", "comb", "major");
  {
    skin(cliner, [[37, 37.6, true], [56, 37.6, true], [72, 34, true]], [[37, 36.8], [56, 36.8], [72, 33.2]], CUT, 72);
    rev(cliner, [[21, 37, true], [21.6, 56, true], [25, 72, true]], 56);                                 // the inner liner
    rev(cliner, [[21, 36, true], [37, 36, true], [37, 38, true], [21, 38, true]], 56, true);              // the dome plate
    for (let k = 0; k < 20; k++) {                                                                       // swirler cups round the dome
      const a = TAU * (k + 0.5) / 20;
      loop(cliner, Array.from({ length: 12 }, (_, i) => { const t = TAU * i / 12; return [35.9, (29.2 + 3.2 * Math.sin(t)) * Math.sin(a + 3.2 * Math.cos(t) / 29.2), (29.2 + 3.2 * Math.sin(t)) * Math.cos(a + 3.2 * Math.cos(t) / 29.2)]; }));
    }
    for (let k = 0; k < 24; k++) { const a = TAU * k / 24 + 0.05; [44, 50].forEach(x => { line(cliner, AX(x, 37.6, a), AX(x + 2.5, 37.6, a)); line(cliner, AX(x + 1, 21.3, a), AX(x + 3.5, 21.3, a)); }); }   // dilution holes
  }
  const fnoz = part("Fuel Spray Nozzles", "comb", "major");
  for (let k = 0; k < 20; k++) {
    const a = TAU * (k + 0.5) / 20;
    tube(fnoz, [AX(31, 29.2, a), AX(34.2, 29.2, a)], 1.3, 8);                                             // the spray tip at the dome
    tube(fnoz, [AX(26, 29.2, a), AX(31, 29.2, a)], 0.8, 6);
    tube(fnoz, [AX(26, 29.2, a), AX(26, 44.5, a)], 0.9, 6);                                               // the feed stem out through the casing
  }
  const fman = part("Fuel Manifold", "comb", "minor");
  tube(fman, [...ring3(26, 46.4, 48), AX(26, 46.4, 0)], 0.9, 6);

  // turbine stators
  const hptn = part("HPT Nozzle Guide Vanes", "hptn", "major");
  bladeRow(hptn, { n: 36, ns: 3, nc: 3, r0: 25, r1: 34.2, x: () => 73, c: () => 6, st: () => rad(-50), th: () => 1.0, a0: 0.03 });
  const iptn = part("IPT Nozzle Guide Vanes", "iptn", "major");
  bladeRow(iptn, { n: 40, ns: 3, nc: 3, r0: 27, r1: 40.4, x: () => 91, c: () => 5.6, st: () => rad(-48), th: () => 0.8, a0: 0.03 });
  const lptst = part("LPT Stators", "lptstat", "minor");
  LPT.forEach((s, k) => bladeRow(lptst, { n: s.n - 8, ns: 2, nc: 3, r0: s.rh - 0.4, r1: s.rc + 0.6, x: () => s.xs, c: () => s.c - 1, st: () => rad(-46), th: () => 0.5, a0: 0.02 }));
  const tcase = part("Turbine Casing", "lptstat", "major");
  {
    const O = [[72, 36.4, true], [90, 39], [96, 42.6, true], [108, 43.4], [110, 47.6, true]], I = [[72, 35.2], [90, 37.8], [96, 41.4], [108, 42.2], [110, 46.6]];
    LPT.forEach(s => { O.push([s.xs - 4, s.rc + 1.7, true], [s.x + 5.6, s.rc + 1.7]); I.push([s.xs - 4, s.rc + 0.6], [s.x + 5.6, s.rc + 0.6]); });
    O.push([190, 66.6, true], [196, 66.8, true]); I.push([190, 65.4], [196, 65.6]);
    skin(tcase, O, I, CUT, 72, { seams: 8 });
  }
  // nozzle group
  const nozz = part("Core Nozzle", "nozzle", "major");
  skin(nozz, [[196, 70.4, true], [208, 62.5], [X_EXIT, 53.4, true]], [[196, 68.6], [208, 60.8], [X_EXIT, 51.8]], [0, TAU], 72);
  const plug = part("Exhaust Plug", "nozzle", "major");
  rev(plug, [[0, PLUG_TIP], [4, PLUG_TIP - 8], [14, 256], [30, 242, true], [42, 224], [46, 207, true], [44, 198, true], [0, 198]], 56);
  const tef = part("Turbine Exit Frame", "nozzle", "major");
  {
    bladeRow(tef, { n: 12, ns: 3, nc: 3, r0: 42.5, r1: 65.5, x: () => 190.5, c: () => 9, st: () => 0, th: () => 1.7 });
    rev(tef, [[42, 190, true], [44, 192], [44.5, 198, true]], 40);
    skin(tef, [[190, 66, true], [198, 66.4, true]], [[190, 65], [198, 65.4]], [0, TAU], 64);
  }
  const bh = part("Bearing Housings", "bearings", "minor");
  rev(bh, [[13, -158, true], [14.5, -152], [18, -138, true], [23, -128]], 40);               // the front bearing cone, tied to the intermediate case
  rev(bh, [[17.2, -104, true], [19, -112], [26, -128, true]], 40);                           // the intermediate pressure thrust bearing
  rev(bh, [[22.8, -28, true], [25, -34], [30.5, -42, true]], 40);                            // the high pressure thrust bearing
  rev(bh, [[13.2, 183, true], [15, 190], [28, 194, true]], 40);                              // the rear roller bearing, on the exit frame
  const bear = part("Bearings", "bearings", "major");
  [[-152, 6.5, 12.6, "ball"], [-112, 11, 17, "ball"], [-34, 16, 22.6, "ball"], [84, 16, 22.6, "roller"], [106, 11, 17, "roller"], [186, 6.5, 12.6, "roller"]].forEach(([x, ri, ro, kind]) => {
    const w = kind === "ball" ? 4.4 : 5.6, rb = (ri + ro) / 2;
    rev(bear, [[ri, x - w / 2, true], [ri + 1.5, x - w / 2, true], [ri + 1.5, x + w / 2, true], [ri, x + w / 2, true]], 40, true);
    rev(bear, [[ro - 1.5, x - w / 2, true], [ro, x - w / 2, true], [ro, x + w / 2, true], [ro - 1.5, x + w / 2, true]], 40, true);
    if (kind === "ball") tube(bear, [...ring3(x, rb, 28), AX(x, rb, 0)], (ro - ri - 3) / 2, 6);
    else for (let k = 0; k < 18; k++) { const a = TAU * k / 18; tube(bear, [AX(x - 2, rb, a), AX(x + 2, rb, a)], (ro - ri - 3) / 2, 6); }
  });

  // pylon, bifurcation and mounts
  const pylon = part("Pylon", "pylon", "major");
  withFrame(FY, () => {
    extrude(pylon, polyRegion([[-115, 467], [-100, 536], [140, 536], [205, 478], [236, 408], [190, 404], [110, 444], [40, 455], [-60, 467]].map(q => [q[0], q[1] - ZE])), -24, 24);
    box(pylon, -105, 140, -44, 44, 532 - ZE, 536 - ZE);
  });
  [[-40, 467], [40, 455], [110, 444]].forEach(([x, z]) => line(pylon, [x, -24.2, z - ZE + 3], [x + 8, -24.2, 536 - ZE]));
  [472, 495, 518].forEach(z => line(pylon, [-100 + (z - 472) * 0.4, -24.2, z - ZE], [150 + (z - 472) * 0.6, -24.2, z - ZE]));
  for (let x = -90; x < 130; x += 22) tube(pylon, [[x, -44.2, 534 - ZE], [x, -44.2, 534 - ZE + 0.3]], 1.5, 6);
  const bif = part("Upper Bifurcation", "pylon", "minor");
  withFrame(FY, () => extrude(bif, polyRegion([[-128, 58], [-128, 150], [108, 143], [108, 70], [60, 62], [0, 60]]), -3.5, 3.5));
  const mounts = part("Engine Mounts", "mounts", "minor");
  [[-125, -109, 58, 152], [80, 96, 62, 146]].forEach(([x0, x1, z0, z1]) => { [-1, 1].forEach(s => box(mounts, x0, x1, s * 9 - 1.5, s * 9 + 1.5, z0, z1)); box(mounts, x0 - 4, x1 + 4, -11, 11, z1, z1 + 4); });
});

// ---------- spool parts (drawn about the axis, relative to it) ----------
const spinner = part("Spinner", "fan", "major", { spool: "fan" });
rev(spinner, [[0, -228], [6, -224.5], [14, -217], [24, -206], [33, -196], [40, -188, true], [44.4, -182, true], [44.4, -180, true]], 56);
for (let k = 0; k < 3; k++) {   // the painted spiral
  let prev = null;
  for (let i = 0; i <= 28; i++) { const t = i / 28, x = -226 + 46 * t, r = (x < -212 ? 4 + (x + 226) * 0.7 : 14 + (x + 212) * 0.65) * 0.98, q = AX(x, Math.min(r, 44.4), TAU * k / 3 + 5 * t); if (prev) line(spinner, prev, q); prev = q; }
}
const fdisc = part("Fan Disc", "fan", "major", { spool: "fan" });
rev(fdisc, [[44.4, -190, true], [46.3, -186, true], [46.3, -170, true], [44.4, -166, true], [38, -152, true], [20, -139, true], [14, -138, true]], 56);
for (let i = 0; i < 24; i++) { const a = TAU * (i + 0.5) / 24; line(fdisc, AX(-186, 46.3, a), AX(-170, 46.3, a)); }   // the blade slots
[-175, -158].forEach(x => loop(fdisc, ring3(x, x === -175 ? 30 : 40, 40)));
const fblade = part("Fan Blades", "fan", "major", { spool: "fan" });
bladeRow(fblade, {
  n: 24, ns: 8, nc: 5, r0: R_HUB, r1: R_FAN,
  x: u => -190 + 9 * Math.pow(u, 1.8) - 3 * u, c: u => 26 + 26 * Math.pow(u, 0.85), st: u => rad(36 + 30 * Math.pow(u, 1.2)),
  th: u => 2.6 * (1 - u) + 0.8, cam: u => 1.6 * (1 - u * 0.6),
});

IPC.forEach((s, i) => {
  const p = part("IPC Rotor " + (i + 1), "ipc", "major", { spool: "ip" });
  rim(p, s.x, s.rh, 4.8, s.rh - 3.4, 24);
  bladeRow(p, { n: s.n, ns: 2, nc: 3, r0: s.rh, r1: s.rc - 0.35, x: () => s.x - s.c * 0.4, c: () => s.c, st: () => rad(40 + 0.7 * i), th: () => 0.3 });
});
const ipdrum = part("IP Compressor Drum", "ipc", "minor", { spool: "ip" });
drum(ipdrum, IPC.map(s => [s.x, s.rh - 3.4]).concat([[-42, 41]]), 48, 18);
HPC.forEach((s, j) => {
  const p = part("HPC Rotor " + (j + 1), "hpc", "major", { spool: "hp" });
  rim(p, s.x, s.rh, 3.6, s.rh - 3, 24);
  bladeRow(p, { n: s.n, ns: 2, nc: 3, r0: s.rh, r1: s.rc - 0.3, x: () => s.x - s.c * 0.4, c: () => s.c, st: () => rad(42 + 0.8 * j), th: () => 0.24 });
});
const hpdrum = part("HP Compressor Drum", "hpc", "minor", { spool: "hp" });
drum(hpdrum, HPC.map(s => [s.x, s.rh - 3]).concat([[22, 30]]), 48, 18);

const hpt = part("HPT Rotor 1", "hpt", "major", { spool: "hp" });
{
  rim(hpt, HPT.x, HPT.rh, 3.6, HPT.rh - 4, 24);
  [HPT.x - 2, HPT.x + 2].forEach(x => { loop(hpt, ring3(x, 14, 40)); for (let i = 0; i < 20; i++) line(hpt, AX(x, 14, TAU * i / 20), AX(x, HPT.rh - 4, TAU * i / 20)); });
  bladeRow(hpt, { n: 70, ns: 3, nc: 3, r0: HPT.rh, r1: HPT.rc - 0.5, x: () => HPT.x - 2.4, c: () => 6, st: () => rad(46), th: () => 1.0 });
}
const ipt = part("IPT Rotor 1", "ipt", "major", { spool: "ip" });
{
  rim(ipt, IPT.x, IPT.rh, 3.6, IPT.rh - 4, 24);
  [IPT.x - 2, IPT.x + 2].forEach(x => { loop(ipt, ring3(x, 14, 40)); for (let i = 0; i < 20; i++) line(ipt, AX(x, 14, TAU * i / 20), AX(x, IPT.rh - 4, TAU * i / 20)); });
  bladeRow(ipt, { n: 76, ns: 3, nc: 3, r0: IPT.rh, r1: IPT.rc - 0.5, x: () => IPT.x - 2.8, c: () => 7, st: () => rad(46), th: () => 1.0 });
}
LPT.forEach((s, k) => {
  const p = part("LPT Rotor " + (k + 1), "lpt", "major", { spool: "lpt" });
  rim(p, s.x, s.rh, 4.6, s.rh - 3.5, 24);
  [s.x - 2, s.x + 2].forEach(x => { loop(p, ring3(x, 9.5, 40)); loop(p, ring3(x, 20, 40)); for (let i = 0; i < 18; i++) line(p, AX(x, 9.5, TAU * i / 18), AX(x, s.rh - 3.5, TAU * i / 18)); });
  bladeRow(p, { n: s.n, ns: 2, nc: 3, r0: s.rh, r1: s.rc - 0.5, x: () => s.x - s.c * 0.4, c: () => s.c, st: () => rad(46), th: () => 0.75 });
});
// the three concentric shafts: lines only, so the inner ones show through
function shaft(name, spool, x0, x1, r, extra) {
  const p = part(name, spool.mod, "major", { spool: spool.s });
  const xs = []; for (let x = x0; x <= x1 + 0.01; x += 12) xs.push(Math.min(x, x1));
  xs.forEach((x, i) => loop(p, ring3(x, r, 28)));
  loop(p, ring3(x0, r, 28)); loop(p, ring3(x1, r, 28));
  for (let i = 0; i < 12; i++) line(p, AX(x0, r, TAU * i / 12), AX(x1, r, TAU * i / 12));
  for (let i = 0; i < 28; i++) { const a = TAU * i / 28; line(p, AX(x0, r, a), AX(x0, r - 1.6, a)); line(p, AX(x1, r, a), AX(x1, r - 1.6, a)); }
  if (extra) extra(p);
  return p;
}
shaft("HP Shaft", { s: "hp", mod: "hpshaft" }, -40, 80, 16);
shaft("IP Shaft", { s: "ip", mod: "ipshaft" }, -120, 98, 11);
shaft("LP Shaft", { s: "lpt", mod: "lpshaft" }, -150, 190, 6.5, p => { for (let k = 0; k < 2; k++) { let prev = null; for (let i = 0; i <= 40; i++) { const x = -150 + 340 * i / 40, q = AX(x, 6.5, TAU * k / 2 + x / 18); if (prev) line(p, prev, q); prev = q; } } });

// ---------- the air: lines only, in three phases so the dashes march when model.js fades the phases in turn ----------
const PH = ["A", "B", "C"];
const airParts = {};
const air = (kind, label, mod) => PH.map(ph => (airParts[kind + ph] = part(label + " " + ph, mod, "minor")));
const [airA, airB, airC] = air("in", "Intake Air", "air");
const [windA, windB, windC] = air("by", "Bypass Wind", "wind");
const [jetA, jetB, jetC] = air("jet", "Core Jet", "jet");
withFrame(ZF, () => {
  const rIn = (rho, x) => { const t = (x + 560) / 355; return rho * (1 + 0.5 * Math.pow(Math.max(0, 1 - t), 2.2)); };
  [28, 48, 68, 88, 108, 126, 142].forEach((rho, ri) => {
    const cnt = Math.max(8, Math.round(rho / 7)), P = [airA, airB, airC];
    for (let i = 0; i < cnt; i++) {
      const a = TAU * (i + 0.37 * ri) / cnt, x0 = -560 + 28 * ((i + ri) % 3) * 0.33;
      for (let k = 0, x = x0; x < -212; k++, x += 28) { const xe = Math.min(x + 15, -207); line(P[(k + ri) % 3], AX(x, rIn(rho, x), a), AX(xe, rIn(rho, xe), a)); }
    }
  });
  [76, 92, 108, 124, 134].forEach((rho, ri) => {
    const P = [windA, windB, windC];
    for (let i = 0; i < 14; i++) {
      const a = TAU * (i + 0.5 * (ri % 2)) / 14;
      const rr = x => (x < 112 ? rho * (x < -30 ? 1 : 1) : rho + 0.1 * (x - 112) * (rho / 100));
      for (let k = 0, x = -112 + 14 * ri % 40; x < 440; k++, x += 38) line(P[(k + ri) % 3], AX(x, rr(x), a), AX(x + 22, rr(x + 22), a));
    }
  });
  const rj = x => 46 + 0.105 * (x - X_EXIT);
  [0.3, 0.62, 0.92].forEach((f, fi) => {
    const P = [jetA, jetB, jetC];
    for (let i = 0; i < 12; i++) {
      const a = TAU * (i + 0.5 * fi) / 12;
      for (let k = 0, x = X_EXIT + 4 + rnd() * 10; x < XJET; k++, x += 24 + rnd() * 14) { const xe = x + 14 + rnd() * 10; line(P[(k + fi) % 3], AX(x, f * rj(x), a + 0.04 * rnd()), AX(xe, f * rj(xe), a + 0.04 * rnd())); }
    }
  });
  for (let k = 0, x = X_EXIT + 26; x < XJET; k++, x += 34) { loop([jetA, jetB, jetC][k % 3], ring3(x, 0.55 * rj(x), 36)); if (k % 2 === 0) loop([jetA, jetB, jetC][(k + 1) % 3], ring3(x + 11, 0.95 * rj(x), 36)); }
});

// ---------- callouts and the tour ----------
const W = (x, r, a) => r3(AX(x, r, a).map((c, i) => (i === 2 ? c + ZE : c)));      // a point on a static part
const L = (x, r, a) => r3(AX(x, r, a));                                              // a point on a spool part (relative to the axis)
const hotspots = [
  ["Scarfed intake", "Acoustic liner, lower lip forward", W(-246, 163, rad(100)), ["Intake Cowl", "Acoustic Liner"]],
  ["Fan", "24 swept blades, 2.95 m across", L(-176, 140, rad(-95)), ["Fan Blades", "Fan Disc", "Spinner"]],
  ["Outlet guide vanes", "Straighten the bypass flow", W(-148, 120, rad(-60)), ["Outlet Guide Vanes", "Intermediate Case"]],
  ["Thrust reverser", "Translating sleeve and cascades", W(25, 157.5, rad(-110)), ["Thrust Reverser Sleeve", "Reverser Cascades"]],
  ["IP compressor", "Eight stages", L(-78, 51, rad(-80)), ["IPC Rotor 4", "IP Compressor Drum", "IP Compressor Casing"]],
  ["HP compressor", "Six stages", L(-4, 36, rad(-55)), ["HPC Rotor 3", "HP Compressor Drum", "HP Compressor Casing"]],
  ["Combustor", "Annular, 20 fuel nozzles", W(26, 44.5, rad(-40)), ["Fuel Spray Nozzles", "Combustor Liner", "Combustor Casing", "Fuel Manifold"]],
  ["HP and IP turbines", "One stage each", L(HPT.x, 34, rad(-50)), ["HPT Rotor 1", "IPT Rotor 1", "HPT Nozzle Guide Vanes"]],
  ["LP turbine", "Five stages drive the fan", L(LPT[2].x, LPT[2].rc - 1, rad(-30)), ["LPT Rotor 3", "LPT Stators", "Turbine Casing"]],
  ["Three shafts", "LP inside IP inside HP", L(10, 16, rad(-90)), ["HP Shaft", "IP Shaft", "LP Shaft", "Bearings"]],
  ["Core nozzle", "Hot jet leaves round the plug", W(210, 58.6, rad(100)), ["Core Nozzle", "Exhaust Plug", "Turbine Exit Frame"]],
  ["Pylon", "Hangs the engine from the live frame", [-60, -24, 467], ["Pylon", "Engine Mounts", "Upper Bifurcation"]],
  ["Live frame", "Free to move along the thrust line", [20, -78, 548], ["Live Frame", "Flexures"]],
  ["Load cell", "Reads the thrust", [-165, -13, 548], ["Load Cell", "Reaction Bracket", "Strongback"]],
  ["Thrust dial", "Hung from the end of the strongback", [XD + 24, -27, ZD + 14], ["Dial Gauge", "Dial Needle", "Signal Cable"]],
].map(([t, s, p, o]) => ({ t, s, p, o }));
const pt = (name, p) => [...p, name];
const tour = {
  points: {
    lip: pt("Intake Cowl", W(-246, 163, rad(100))), fan: pt("Fan Blades", L(-176, 100, rad(-95))), ogv: pt("Outlet Guide Vanes", W(-148, 100, rad(-60))),
    casc: pt("Reverser Cascades", W(30, 145.6, rad(30))), ipc: pt("IPC Rotor 4", L(-78, 51, rad(-80))), hpc: pt("HPC Rotor 3", L(-4, 36, rad(-55))),
    comb: pt("Fuel Spray Nozzles", W(26, 44.5, rad(-40))), hpt: pt("HPT Rotor 1", L(HPT.x, 34, rad(-50))), lpt: pt("LPT Rotor 3", L(LPT[2].x, LPT[2].rc - 1, rad(-30))),
    shaft: pt("LP Shaft", L(60, 6.5, rad(-90))), exit: pt("Core Nozzle", W(210, 58.6, rad(100))), plug: pt("Exhaust Plug", W(240, 33, rad(60))),
    cell: pt("Load Cell", [-165, -13, 548]), dial: pt("Dial Gauge", [XD, -27, ZD + 29]), jet: pt("Core Jet A", W(300, 0.3 * rj0(300), 0)),
  },
  steps: [
    { t: "Air in", focus: "lip", dist: 0.9, ex: 0, p: ["lip", "fan"], n: ["Intake Cowl", "Acoustic Liner", "Intake Air A", "Intake Air B", "Intake Air C"], ms: 5000,
      d: "The fan draws air into the scarfed intake in converging streaks. The liner on the intake barrel soaks up fan noise." },
    { t: "Fan and bypass", focus: "fan", dist: 0.7, ex: 1, p: ["fan", "ogv", "casc"], n: ["Fan Blades", "Fan Disc", "Spinner", "Outlet Guide Vanes", "Thrust Reverser Sleeve", "Reverser Cascades", "Bypass Wind A", "Bypass Wind B", "Bypass Wind C"], ms: 5600,
      d: "The 24 fan blades compress the air; the outlet guide vanes straighten it, and most of it flows down the bypass duct and out of the bypass nozzle as cold wind. Only the inner part of the flow enters the core." },
    { t: "Compression", focus: "ipc", dist: 0.65, ex: 1, p: ["ipc", "hpc"], n: ["IPC Rotor 1", "IPC Rotor 2", "IPC Rotor 3", "IPC Rotor 4", "IPC Rotor 5", "IPC Rotor 6", "IPC Rotor 7", "IPC Rotor 8", "HPC Rotor 1", "HPC Rotor 2", "HPC Rotor 3", "HPC Rotor 4", "HPC Rotor 5", "HPC Rotor 6", "IPC Stator Vanes", "HPC Stator Vanes"], ms: 5600,
      d: "The eight-stage intermediate compressor and the six-stage high pressure compressor squeeze the core air, each row of rotor blades followed by a row of stator vanes." },
    { t: "Combustion", focus: "comb", dist: 0.55, ex: 1, p: ["comb"], n: ["Fuel Spray Nozzles", "Fuel Manifold", "Combustor Liner", "Combustor Casing"], ms: 5000,
      d: "About 20 fuel spray nozzles feed the annular combustor, where fuel burns continuously in the compressed air." },
    { t: "Turbines and three shafts", focus: "lpt", dist: 0.7, ex: 1, p: ["hpt", "lpt", "shaft"], n: ["HPT Rotor 1", "IPT Rotor 1", "LPT Rotor 1", "LPT Rotor 2", "LPT Rotor 3", "LPT Rotor 4", "LPT Rotor 5", "HP Shaft", "IP Shaft", "LP Shaft", "Bearings"], ms: 6200,
      d: "One high pressure turbine stage drives the high pressure compressor, one intermediate stage the intermediate compressor, and five low pressure stages drive the fan, each through its own shaft. The three shafts run one inside the other on bearings at their own speeds." },
    { t: "Nozzle and thrust", focus: "exit", dist: 0.8, ex: 0, p: ["exit", "plug", "jet"], n: ["Core Nozzle", "Exhaust Plug", "Core Jet A", "Core Jet B", "Core Jet C", "Bypass Wind A", "Bypass Wind B", "Bypass Wind C"], ms: 5000,
      d: "The core gas leaves round the plug as a shimmering hot jet; the cold bypass flow carries most of the thrust. The reaction pushes the engine forward, towards the intake." },
    { t: "Thrust frame and load cell", focus: "cell", dist: 0.9, ex: 0, p: ["cell", "dial"], n: ["Load Cell", "Live Frame", "Flexures", "Strongback", "Dial Gauge", "Dial Needle", "Reaction Bracket"], ms: 6000,
      d: "The engine hangs from the live frame, which can move only a hair along the thrust line. A load cell between the live frame and the fixed frame reads the thrust on a dial hung from the end of the strongback." },
  ],
};
function rj0(x) { return 46 + 0.105 * (x - X_EXIT); }

const geometry = geometryScript("T97_GEOMETRY", "trent970/build.js", { explode, hotspots, tour, constants: { ZE, XD, YD, ZD } });
writeGeometry(HERE, geometry);
console.log(`models/trent970/geometry.js: ${geometry.stats}`);
