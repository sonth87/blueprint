/*
Foundry pour: builds its geometry.

After the "Pouring steel" figure in Anatomy (github.com/wheresryan22/anatomy, MIT, by Ryan), rebuilt as an original 3D
blueprint model: a pouring bay with a refractory-lined ladle on trunnions in two pillow blocks on a welded stand, tilted
by a hand wheel through a 40:1 worm gearbox, a counterweight, a sand mould (cope and drag on a bottom board) with a
pouring basin and two risers, and a two-colour pyrometer on a tripod.

Designed in mm with the ladle's trunnion axis through the origin (Z up, the spout towards +x, the front towards -y).
The pour (the ladle's tilt, the flow over the lip, the basin, the sprue, the rising level in the mould, the freezing)
is simulated once here from the real geometry (volume of the lined cone cut by the tilted free surface, steel at
7,000 kg/m3, a Torricelli sprue) and played back by model.js.

    node models/foundry/build.js

Writes models/foundry/geometry.js.
*/
"use strict";
const { withFrame, part, line, tri, loop, rrPts, circlePts, rrRegion, rect, polyRegion, extrude, cyl, revolve, tube,
  r3, geometryScript, writeGeometry } = require("../../kit/procedural");
const HERE = __dirname;
// ---------- the pour, simulated once (mm, mm^3, s) ----------
const RAD = Math.PI / 180;
const ZF = -185, ZTOP = 175;                         // the lining's floor and top, in the ladle's own frame
const RIN = z => 100 + 35 * (z - ZF) / 360;          // the lining's inner radius
const LIP = [262, 167];                               // the pouring lip (x, z) in the ladle's frame
const RHO = 7.0e-6;                                   // liquid steel, kg per mm^3 (7,000 kg/m3)
const V0 = 85 / RHO;                                  // 85 kg of steel
function segArea(R, x0) { if (x0 >= R) return 0; if (x0 <= -R) return Math.PI * R * R; return R * R * Math.acos(x0 / R) - x0 * Math.sqrt(R * R - x0 * x0); }
// the volume of the lining's cavity that lies at or below the horizontal plane z = zp, with the ladle tilted th about the trunnions
function volBelow(th, zp) {
  const s = Math.sin(th), c = Math.cos(th); let V = 0; const dz = 2;
  for (let z = ZF + dz / 2; z < ZTOP; z += dz) {
    const R = RIN(z);
    V += dz * (s < 1e-9 ? (z * c <= zp ? Math.PI * R * R : 0) : segArea(R, (z * c - zp) / s));
  }
  return V;
}
function planeFor(th, V) { let a = -500, b = 500; for (let i = 0; i < 28; i++) { const m = (a + b) / 2; if (volBelow(th, m) < V) a = m; else b = m; } return (a + b) / 2; }
const lipZ = th => -LIP[0] * Math.sin(th) + LIP[1] * Math.cos(th);
const lipX = th => LIP[0] * Math.cos(th) + LIP[1] * Math.sin(th);
const Vlip = th => Math.min(V0, volBelow(th, lipZ(th)));
// the free surface of the steel in the ladle: height, centre and half sizes of its outline (world x, y)
function surface(th, V) {
  if (V < 2e5) return [0, 0, 0.001, 0.001, 0];
  const zp = planeFor(th, V), s = Math.sin(th), c = Math.cos(th);
  let xmin = 1e9, xmax = -1e9, ymax = 0;
  for (let x = -220; x <= 220; x += 1) {
    const z = s < 1e-9 ? zp : (zp + x * s) / c;
    if (z < ZF || z > ZTOP) continue;
    const h2 = RIN(z) ** 2 - x * x; if (h2 <= 0) continue;
    const xw = x * c + z * s; xmin = Math.min(xmin, xw); xmax = Math.max(xmax, xw); ymax = Math.max(ymax, Math.sqrt(h2));
  }
  if (xmax < xmin) return [zp, 0, 0.001, 0.001, 0];
  return [zp, (xmin + xmax) / 2, (xmax - xmin) / 2, ymax, 0];
}

// the mould, in its own coordinates
const FLOOR = -580, SKID = 30, BOARD_T = 25, DRAG_H = 130, COPE_H = 130, XM = 660;
const ZD0 = FLOOR + SKID + BOARD_T, ZP = ZD0 + DRAG_H, ZC = ZP + COPE_H;           // drag bottom, parting plane, cope top
const PL0 = ZP - 40, PL1 = ZP + 20;                                                  // the casting's plate, through the parting plane
const PLATE = { u0: -190, u1: 230, hy: 120 };                                        // plate x range (from XM) and half width
const BOSS = { u: 20, r: 55, h: 30 };
const RISER = { us: [-110, 160], r: 30, ztop: -185 };
const SPRUE = { u: -250, r: 15 };
const BASIN = { r: 55, floor: ZC + 12, top: ZC + 100 };                                // pouring cup: inner radius, floor, rim
const BASIN_H = BASIN.top - BASIN.floor;
const AB = Math.PI * BASIN.r ** 2;
const A_PLATE = (PLATE.u1 - PLATE.u0) * 2 * PLATE.hy;
const A_HUB = Math.PI * BOSS.r ** 2, A_RIS = 2 * Math.PI * RISER.r ** 2;
const V_SPRUE = Math.PI * SPRUE.r ** 2 * (BASIN.floor - (ZP - 15));
const V_PLATE = A_PLATE * (PL1 - PL0);
const V_HUBZONE = (A_HUB + A_RIS) * BOSS.h, V_RIS = A_RIS * (RISER.ztop - (PL1 + BOSS.h));
const V_MOULD = V_SPRUE + V_PLATE + V_HUBZONE + V_RIS;
// the steel's level in the mould for a volume poured in
function mouldLevel(V) {
  if (V <= V_SPRUE) return PL0;
  let v = V - V_SPRUE;
  if (v <= V_PLATE) return PL0 + v / A_PLATE;
  v -= V_PLATE; if (v <= V_HUBZONE) return PL1 + v / (A_HUB + A_RIS);
  v -= V_HUBZONE; return Math.min(RISER.ztop, PL1 + BOSS.h + v / A_RIS);
}
const CD = 0.5, GRAV = 9810, A_SPRUE = Math.PI * SPRUE.r ** 2;

function simulate() {
  const dt = 0.01, DEG = RAD, RATE = 9 * DEG, SAMPLE = 0.1;
  const rows = [];
  let t = 0, th = 0, Vl = V0, Vb = 0, Vm = 0, plug = 0, poured = 0, queue = [];
  const delay = Math.round(0.28 / dt); for (let i = 0; i < delay; i++) queue.push(0);
  let vlStart = 0, phase = "idle", pt = 0, tFull = null, fz = 0, thStart = null, Tl = 1640;
  for (let a = 0; a < 40 * DEG; a += 0.25 * DEG) if (thStart === null && Vlip(a) < V0 - 5e4) thStart = a;
  const hb = () => Vb / AB;
  let out = 0, tPour0 = null, tBack0 = null;
  const steps = Math.round(60 / dt);
  let cycleEnd = null;
  for (let k = 0; k <= steps; k++) {
    t = k * dt; pt += dt;
    // the operator at the hand wheel
    let thd = 0;
    if (phase === "idle" && t > 1.0) { phase = "tilt"; pt = 0; }
    if (phase === "tilt") {
      thd = th < thStart - 2.5 * DEG ? RATE : 2.2 * DEG;
      if (Vl < V0 - 1e3 && tPour0 === null) tPour0 = t;
      if (plug) phase = "pour";
    }
    if (phase === "pour") {
      const dth = 0.5 * DEG, slope = (Vlip(th) - Vlip(th + dth)) / dth;   // mm^3 poured per radian further
      const Qs = plug ? CD * A_SPRUE * Math.sqrt(2 * GRAV * Math.max(0, BASIN.floor + hb() - Math.max(PL0, mouldLevel(Vm)))) : 0;
      const want = Qs + 1.8 * (0.74 * BASIN_H - hb()) * AB;
      thd = slope > 1 ? Math.max(0, Math.min(RATE, want / slope)) : RATE;
      if (mouldLevel(Vm) >= RISER.ztop - 0.5) { phase = "back"; tBack0 = t; }
    }
    if (phase === "back") { thd = -RATE; if (th <= 0.0001) { th = 0; thd = 0; phase = "hold"; pt = 0; } }
    th = Math.max(0, th + thd * dt);
    // the lip: whatever sits above the lip's plane leaves, with a short lag
    let Qin = 0;
    if (phase === "tilt" || phase === "pour" || phase === "back") {
      const ex = Vl - Vlip(th);
      if (ex > 0) { Qin = Math.min(ex / 0.08, ex / dt); Vl -= Qin * dt; }
    }
    queue.push(Qin); const arriving = queue.shift();
    poured += Qin * dt;
    // the basin and the sprue
    Vb += arriving * dt;
    if (!plug && hb() >= 0.74 * BASIN_H) plug = 1;
    let Qs = 0;
    if (plug) {
      Qs = CD * A_SPRUE * Math.sqrt(2 * GRAV * Math.max(0, BASIN.floor + hb() - Math.max(PL0, mouldLevel(Vm))));
      Qs = Math.min(Qs, Vb / dt);
      Vb -= Qs * dt; Vm += Qs * dt;
    }
    if (Vb > AB * BASIN_H) Vb = AB * BASIN_H;
    // after the pour
    let state = 0;
    if (phase === "idle") state = pt < 0.01 && k > 100 ? 11 : 0;
    if (phase === "tilt") state = Qin > 1e3 ? 2 : 1;
    if (phase === "pour") state = hb() > 0.9 * BASIN_H ? 3 : 4;
    if (phase === "back") state = 6;
    let frozen = 0;
    if (phase === "hold") { state = 6; if (pt > 0.7) { phase = "feed"; pt = 0; } }
    if (phase === "feed") { state = 7; if (pt > 2.2) { phase = "freeze"; pt = 0; } }
    if (phase === "freeze") { state = 8; frozen = pt / 3.0; if (pt > 3.0) { phase = "solid"; pt = 0; } }
    if (phase === "solid") { state = 9; frozen = 1; if (pt > 1.0) { phase = "newmould"; pt = 0; } }
    let clear = 0;
    if (phase === "newmould") { state = 10; frozen = 1; clear = Math.min(1, pt / 1.0); if (pt > 1.2) { phase = "refill"; pt = 0; Vm = 0; Vb = 0; plug = 0; vlStart = Vl; } }
    let refill = 0;
    if (phase === "refill") { state = 11; refill = Math.min(1, pt / 2.4); Vl = vlStart + (V0 - vlStart) * refill; if (pt > 2.6) { Vl = V0; phase = "end"; cycleEnd = t; } }
    if (phase === "end") break;
    Tl = 1640 - 0.45 * Math.max(0, t - 1.0);
    if (k >= out * SAMPLE / dt) {
      out++;
      const srf = surface(th, phase === "refill" ? Math.max(0, Vl) : Vl);
      const lvl = mouldLevel(Vm);
      rows.push({
        t: +t.toFixed(2), th: th / DEG, state,
        srf, Vl, poured: poured * RHO, Qin: Qin * 1e-6, Qs: Qs * 1e-6,
        hb: hb(), plug, lvl, sprue: Math.min(1, Vm / V_SPRUE) * (Vm > 0 ? 1 : 0),
        mould: (Vm * RHO), frozen, clear, Tl,
        full: lvl >= RISER.ztop - 0.5 ? 1 : 0,
      });
    }
  }
  return { rows, cycleEnd, tPour0, tBack0, thStart };
}

// ---------- helpers ----------
const FY = q => [q[0], q[2], q[1]];   // draw (x, z), push along y
const FX = q => [q[2], q[0], q[1]];   // draw (y, z), push along x
const sh = b => q => [q[0] - b[0], q[1] - b[1], q[2] - b[2]];
const BASES = {};
const mk = (name, module, kind, spool, base) => { const p = part(name, module, kind, spool ? { spool } : undefined); BASES[name] = base || [0, 0, 0]; return p; };
const at = (base, fn) => withFrame(sh(base), fn);
const box = (p, x0, x1, y0, y1, z0, z1) => extrude(p, rect(x0, x1, y0, y1), z0, z1);
const boxXZ = (p, x0, x1, z0, z1, y0, y1) => withFrame(FY, () => extrude(p, rect(x0, x1, z0, z1), y0, y1));
const polyXZ = (p, pts, y0, y1) => withFrame(FY, () => extrude(p, polyRegion(pts), y0, y1));
const cylY = (p, x, z, r, y0, y1, n = 24) => withFrame(FY, () => cyl(p, x, z, r, y0, y1, n));
const cylX = (p, y, z, r, x0, x1, n = 24) => withFrame(FX, () => cyl(p, y, z, r, x0, x1, n));
const ringZ = (p, cx, cy, r, z, n = 32) => loop(p, circlePts(cx, cy, r, n).map(q => [...q, z]));
const ringY = (p, x, z, r, y, n = 24) => withFrame(FY, () => loop(p, circlePts(x, z, r, n).map(q => [...q, y])));
const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
const loc = (name, p) => r3(p.map((c, i) => c - BASES[name][i]));

// a band of a cone (radius rf(z)) between angles a0 and a1, from z0 to z1
function band(p, rf, z0, z1, a0, a1, o = {}) {
  const n = Math.max(2, Math.ceil((a1 - a0) / (2 * Math.PI) * (o.n || 48)));
  const pt = (a, z) => [rf(z) * Math.cos(a), rf(z) * Math.sin(a), z];
  for (let i = 0; i < n; i++) {
    const A = a0 + (a1 - a0) * i / n, B = a0 + (a1 - a0) * (i + 1) / n;
    tri(p, pt(A, z0), pt(B, z0), pt(B, z1)); tri(p, pt(A, z0), pt(B, z1), pt(A, z1));
    if (o.arcs !== false) { line(p, pt(A, z0), pt(B, z0)); line(p, pt(A, z1), pt(B, z1)); }
  }
  if (o.edges) { line(p, pt(a0, z0), pt(a0, z1)); line(p, pt(a1, z0), pt(a1, z1)); }
  (o.seams || []).forEach(a => { if (a > a0 + 1e-6 && a < a1 - 1e-6) line(p, pt(a, z0), pt(a, z1)); });
}
// a flat annular sector at height z
function annulus(p, r0, r1, z, a0, a1, n = 48) {
  const m = Math.max(2, Math.ceil((a1 - a0) / (2 * Math.PI) * n));
  for (let i = 0; i < m; i++) {
    const A = a0 + (a1 - a0) * i / m, B = a0 + (a1 - a0) * (i + 1) / m;
    const q = (r, a) => [r * Math.cos(a), r * Math.sin(a), z];
    tri(p, q(r0, A), q(r1, A), q(r1, B)); tri(p, q(r0, A), q(r1, B), q(r0, B));
    line(p, q(r1, A), q(r1, B)); line(p, q(r0, A), q(r0, B));
  }
}
// a radial cut face at angle a between two radii (functions of z), from z0 to z1
function cutFace(p, a, ra, rb, z0, z1) {
  const q = (r, z) => [r(z) * Math.cos(a), r(z) * Math.sin(a), z];
  tri(p, q(ra, z0), q(rb, z0), q(rb, z1)); tri(p, q(ra, z0), q(rb, z1), q(ra, z1));
  line(p, q(ra, z0), q(rb, z0)); line(p, q(rb, z0), q(rb, z1)); line(p, q(rb, z1), q(ra, z1)); line(p, q(ra, z1), q(ra, z0));
}
// a ring (inner / outer radius functions of z) from z0 to z1 over an angle range
function ringSeg(p, ri, ro, z0, z1, a0, a1, o = {}) {
  band(p, ro, z0, z1, a0, a1, { seams: o.seams });
  band(p, ri, z0, z1, a0, a1, { arcs: true });
  annulus(p, ri(z0), ro(z0), z0, a0, a1); annulus(p, ri(z1), ro(z1), z1, a0, a1);
  if (a1 - a0 < 2 * Math.PI - 1e-3) { cutFace(p, a0, ri, ro, z0, z1); cutFace(p, a1, ri, ro, z0, z1); }
}

// ---------- layout (mm; the trunnion axis through the origin, along y; the spout looks towards +x) ----------
const WA = [-62 * RAD, -8 * RAD];                 // the cut-away window in the ladle's wall, front right
const WZ = -160;                                  // the window's sill
const RL = z => RIN(z) + 45, RS = z => RIN(z) + 53, RB = z => RIN(z) + 67;
const YF = 290;                                   // the pillow blocks stand at y = -YF and +YF
const WH = [-330, -370, -75], WO = [0, -370, -75];  // hand wheel centre, worm centre
const XB = XM + SPRUE.u;                          // the pouring basin and sprue, in x
const FB = [XB, 0, BASIN.floor], FS = [XB, 0, ZP - 15], FG = [XM, 0, ZP - 15], FC = [XM, 0, PL0], FH = [XM + BOSS.u, 0, PL1], FR = [XM, 0, PL1];
const mod = { stand: [0, 0, 0] };

// ================= STAND =================
{
  const FX0 = -480, FX1 = 1060, FY0 = -880, FY1 = 430, NX = 4, NY = 3, TX = (FX1 - FX0) / NX, TY = (FY1 - FY0) / NY;
  const fl = mk("Floor Plate", "floor", "major");
  box(fl, FX0, FX1, FY0, FY1, FLOOR - 8, FLOOR);
  for (let i = 1; i < NX; i++) line(fl, [FX0 + i * TX, FY0, FLOOR], [FX0 + i * TX, FY1, FLOOR]);
  for (let j = 1; j < NY; j++) line(fl, [FX0, FY0 + j * TY, FLOOR], [FX1, FY0 + j * TY, FLOOR]);
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {          // tread marks of the chequer plate
    const cx = FX0 + (i + 0.5) * TX, cy = FY0 + (j + 0.5) * TY;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const x = cx + a * 90, y = cy + b * 90, d = (a + b) % 2 ? 1 : -1;
      line(fl, [x - 14, y - 14 * d, FLOOR + 0.05], [x + 14, y + 14 * d, FLOOR + 0.05]);
    }
  }
  const bund = mk("Spill Bund", "floor", "minor");
  extrude(bund, rrRegion(0, 0, 310, 460, 0, 2, [[-300, 300, -450, 450]]), FLOOR, FLOOR + 35);
  const sl = mk("Safety Line", "floor", "minor");
  [[XM - 470, XM + 470, -380, 380], [XM - 480, XM + 480, -390, 390]].forEach(([a, b, c, d]) => loop(sl, [[a, c], [b, c], [b, d], [a, d]].map(q => [...q, FLOOR + 0.05])));
  for (let x = XM - 470; x <= XM + 470; x += 60) { line(sl, [x, -380, FLOOR + 0.05], [x + 10, -390, FLOOR + 0.05]); line(sl, [x, 380, FLOOR + 0.05], [x + 10, 390, FLOOR + 0.05]); }

  const bp = mk("Base Plates", "stand", "major"), ab = mk("Anchor Bolts", "stand", "minor");
  const ff = [mk("Front Frame", "stand", "major"), mk("Rear Frame", "stand", "major")];
  const gu = mk("Gussets", "stand", "minor");
  [-1, 1].forEach((sy, fi) => {
    const yc = sy * YF, f = ff[fi];
    box(f, -190, 190, yc - 45, yc + 45, -142, -92);
    [-1, 1].forEach(sx => {
      const x0 = sx * 130;
      box(f, x0 - 45, x0 + 45, yc - 45, yc + 45, FLOOR + 20, -142);
      box(bp, x0 - 100, x0 + 100, yc - 100, yc + 100, FLOOR, FLOOR + 20);
      [-75, 75].forEach(dx => [-75, 75].forEach(dy => {
        cyl(ab, x0 + dx, yc + dy, 8, FLOOR + 20, FLOOR + 62, 10);
        cyl(ab, x0 + dx, yc + dy, 20, FLOOR + 20, FLOOR + 23, 16);
        cyl(ab, x0 + dx, yc + dy, 14, FLOOR + 23, FLOOR + 37, 6);
      }));
      // gussets: beam to post (inside) and post to base plate (outside)
      polyXZ(gu, [[x0 - sx * 45, -142], [x0 - sx * 105, -142], [x0 - sx * 45, -202]], yc - 5, yc + 5);
      polyXZ(gu, [[x0 + sx * 45, FLOOR + 20], [x0 + sx * 95, FLOOR + 20], [x0 + sx * 45, FLOOR + 130]], yc - 5, yc + 5);
    });
  });
  const ti = mk("Frame Ties", "stand", "minor");
  [-1, 1].forEach(sx => box(ti, sx * 130 - 30, sx * 130 + 30, -245, 245, -470, -410));
  [-1, 1].forEach(sy => box(ti, -85, 85, sy * YF - 30, sy * YF + 30, -470, -410));
  // pillow blocks
  const pbp = [mk("Front Pillow Block", "stand", "major"), mk("Rear Pillow Block", "stand", "major")];
  const pbb = mk("Pillow Block Bolts", "stand", "minor");
  [-1, 1].forEach((sy, fi) => {
    const y0 = sy > 0 ? 250 : -330, y1 = y0 + 80, p = pbp[fi];
    const prof = [[-90, -92], [90, -92], [90, -60], [62, -60], [62, 0]];
    for (let k = 1; k < 16; k++) prof.push(polar(62, k * Math.PI / 16)); prof.push([-62, 0]);
    prof.push([-62, -60], [-90, -60]);
    polyXZ(p, prof, y0, y1);
    [y0, y1].forEach(y => { ringY(p, 0, 0, 31, y, 28); withFrame(FY, () => line(p, [-62, 0, y], [62, 0, y])); });
    [-48, 48].forEach(x => { cylY(p, x, 14, 6, y0 + 5, y1 - 5, 10); ringY(p, x, 62, 8, y0 + 40, 12); });
    [-76, 76].forEach(x => [y0 + 16, y1 - 16].forEach(y => { cyl(pbb, x, y, 16, -60, -57, 16); cyl(pbb, x, y, 9, -57, -48, 6); }));
  });
  const gs = mk("Gearbox Support", "stand", "minor");
  box(gs, -105, 105, -400, -335, -142, -110);
  ringZ(gs, 0, -372, 8, -110, 10);
}

// ================= LADLE =================
{
  const sA = [], seamAng = []; for (let a = 0; a < 360; a += 45) seamAng.push(a * RAD);
  const sh0 = mk("Ladle Shell", "ladle", "major", "ladle");
  band(sh0, RS, -230, WZ, 0, 2 * Math.PI, { seams: seamAng });
  band(sh0, RS, WZ, ZTOP + 3, WA[1], 2 * Math.PI + WA[0], { edges: true, seams: seamAng.filter(a => a > WA[1]) });
  cutFace(sh0, WA[0], RL, RS, WZ, ZTOP + 3); cutFace(sh0, WA[1], RL, RS, WZ, ZTOP + 3);
  annulus(sh0, RL(WZ), RS(WZ), WZ, WA[0], WA[1], 12);
  const li = mk("Refractory Lining", "ladle", "major", "ladle");
  band(li, RIN, ZF, WZ, 0, 2 * Math.PI);
  band(li, RIN, WZ, ZTOP, WA[1], 2 * Math.PI + WA[0], { edges: true });
  const fl = circlePts(0, 0, RIN(ZF), 48);
  fl.forEach((q, i) => tri(li, [0, 0, ZF], [...q, ZF], [...fl[(i + 1) % 48], ZF]));
  loop(li, fl.map(q => [...q, ZF]));
  cutFace(li, WA[0], RIN, RL, WZ, ZTOP); cutFace(li, WA[1], RIN, RL, WZ, ZTOP);
  annulus(li, RIN(WZ), RL(WZ), WZ, WA[0], WA[1], 12);
  annulus(li, RIN(ZTOP), RL(ZTOP), ZTOP, WA[1], 2 * Math.PI + WA[0]);
  // brick courses on the lining wall
  for (let z = ZF + 40; z < ZTOP; z += 40) if (z > WZ) { const a0 = WA[1], a1 = 2 * Math.PI + WA[0]; for (let i = 0; i < 40; i++) line(li, [RIN(z) * Math.cos(a0 + (a1 - a0) * i / 40), RIN(z) * Math.sin(a0 + (a1 - a0) * i / 40), z], [RIN(z) * Math.cos(a0 + (a1 - a0) * (i + 1) / 40), RIN(z) * Math.sin(a0 + (a1 - a0) * (i + 1) / 40), z]); }
  const bt = mk("Bottom Plate", "ladle", "major", "ladle");
  cyl(bt, 0, 0, RS(-230) + 2, -238, -230, 40);
  const ft = mk("Ladle Foot", "ladle", "minor", "ladle");
  revolve(ft, 0, 0, [[96, -266, true], [124, -266, true], [124, -238, true], [96, -238, true]], 40, true);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, c = polar(110, a); cyl(ft, c[0], c[1], 7, -266, -262, 8); }
  const rim = mk("Ladle Rim", "ladle", "major", "ladle");
  ringSeg(rim, () => 140, () => 212, ZTOP, ZTOP + 14, 14 * RAD, 346 * RAD);
  const be = mk("Ladle Belt", "ladle", "major", "ladle");
  ringSeg(be, RS, RB, -45, 45, WA[1], 2 * Math.PI + WA[0]);
  const bd = mk("Ladle Band", "ladle", "minor", "ladle");
  ringSeg(bd, z => RS(z), z => RS(z) + 8, -205, -185, 0, 2 * Math.PI);
  const lu = mk("Lifting Lugs", "ladle", "minor", "ladle");
  [-1, 1].forEach(s => { polyXZ(lu, [[-206, ZTOP + 14], [-252, ZTOP + 14], [-252, ZTOP + 44], [-232, ZTOP + 66], [-206, ZTOP + 66]], s * 53 - 5, s * 53 + 5); ringY(lu, -228, ZTOP + 40, 11, s * 53 + 5, 16); ringY(lu, -228, ZTOP + 40, 11, s * 53 - 5, 16); });
  // the spout: a trough on the rim with a lip at LIP
  const sf = mk("Spout Floor", "ladle", "major", "ladle");
  extrude(sf, polyRegion([[150, -36], [LIP[0], -24], [LIP[0], 24], [150, 36]]), LIP[1] - 7, LIP[1]);
  const sn = mk("Spout Near Wall", "ladle", "minor", "ladle"), sfw = mk("Spout Far Wall", "ladle", "minor", "ladle");
  const wall = [[150, LIP[1] - 7], [LIP[0], LIP[1] - 7], [LIP[0], LIP[1] + 14], [214, LIP[1] + 30], [150, LIP[1] + 30]];
  polyXZ(sn, wall, -42, -34); polyXZ(sfw, wall, 34, 42);
  // trunnions
  const pd = mk("Trunnion Pads", "ladle", "major", "ladle");
  cylY(pd, 0, 0, 75, 185, 203, 32); cylY(pd, 0, 0, 75, -203, -185, 32);
  const pf = mk("Trunnion Pin Front", "ladle", "major", "ladle"), pr = mk("Trunnion Pin Rear", "ladle", "major", "ladle");
  cylY(pf, 0, 0, 30, -414, -203, 28); cylY(pr, 0, 0, 30, 203, 335, 28);
  cylY(pr, 0, 0, 36, 335, 346, 20);
  const cc = mk("Pin Collars", "ladle", "minor", "ladle");
  cylY(cc, 0, 0, 42, -235, -215, 28); cylY(cc, 0, 0, 42, 215, 235, 28);
  // the worm wheel segment: 40 teeth in all, 12 of them drawn
  const ws = mk("Worm Wheel Segment", "ladle", "major", "ladle");
  const RF = 56.4, RO = 63, pts = [[0, 0]];
  for (let k = 0; k < 12; k++) { const a = (-117 + 9 * k); [[RF, 0], [RO, 2.8], [RO, 6.2], [RF, 9]].forEach(([r, d]) => { if (!(k > 0 && d === 0)) pts.push(polar(r, (a + d) * RAD)); }); }
  polyXZ(ws, pts, -384, -352);
  const wh = mk("Wheel Hub", "ladle", "minor", "ladle");
  cylY(wh, 0, 0, 48, -388, -348, 28); ringY(wh, 0, 0, 31, -388, 24);
  // the slag / skull line: a wavy mark on the lining where the steel stands
  const sk = mk("Slag Line", "ladle", "minor", "ladle");
  { const z0 = planeFor(0, V0) + 12; let prev = null; for (let i = 0; i <= 120; i++) { const a = WA[1] + (2 * Math.PI + WA[0] - WA[1]) * i / 120, z = z0 + 6 * Math.sin(a * 7) + 3 * Math.sin(a * 17), r = RIN(z) - 0.3, q = [r * Math.cos(a), r * Math.sin(a), z]; if (prev) line(sk, prev, q); prev = q; } }
  // dial needle (module dial)
  const nd = mk("Tilt Needle", "dial", "minor", "ladle");
  polyXZ(nd, [[-3, -14], [3, -14], [1.6, 62], [0, 72], [-1.6, 62]], -409, -405);
  cylY(nd, 0, 0, 9, -411, -405, 16);
}

// ================= COUNTERWEIGHT =================
{
  const arm = mk("Counterweight Arm", "counterweight", "major", "ladle"), br = mk("Arm Bracket", "counterweight", "minor", "ladle");
  box(arm, -440, -196, -18, 18, -55, -15);
  box(br, -198, -180, -48, 48, -80, 8);
  [-30, 30].forEach(y => [-60, -10].forEach(z => cylX(br, y, z, 6, -204, -196, 8)));
  const w = mk("Counterweight Block", "counterweight", "major", "ladle");
  box(w, -455, -315, -90, 90, -15, 105);
  ringZ(w, -385, 0, 17, 105, 20);
  const st = mk("Counterweight Stud", "counterweight", "minor", "ladle"), nu = mk("Stud Nut", "counterweight", "minor", "ladle"), wa = mk("Stud Washer", "counterweight", "minor", "ladle");
  cyl(st, -385, 0, 12, -65, 150, 14);
  for (let z = -60; z < 150; z += 8) ringZ(st, -385, 0, 12.1, z, 14);
  cyl(wa, -385, 0, 26, 105, 110, 24); cyl(nu, -385, 0, 21, 110, 134, 6);
}

// ================= TILTING DRIVE =================
{
  const hs = mk("Gearbox Housing", "drive", "major");
  withFrame(FY, () => extrude(hs, rrRegion(0, -11, 105, 99, 0, 2, [[-97, 97, -102, 80]]), -392, -340));
  box(hs, -105, 105, -348, -340, -110, 88);
  ringY(hs, 0, 0, 31, -340, 24);
  [[-97, -102], [97, -102], [-97, 80], [97, 80]].forEach(([x, z]) => withFrame(FY, () => line(hs, [x, z, -392], [x, z, -348])));
  const cv = mk("Gearbox Cover", "drive", "major");
  withFrame(FY, () => extrude(cv, rrRegion(0, -11, 105, 99, 0, 2, [[-88, 88, -100, -12]]), -400, -392));
  [[-95, 78], [95, 78], [-95, -104], [95, -104], [-95, 0], [95, 0]].forEach(([x, z]) => { cylY(cv, x, z, 5, -403, -400, 6); });
  const wb = mk("Worm Bearings", "drive", "minor");
  [[-125, -105], [105, 125]].forEach(([a, b]) => { cylX(wb, -370, -75, 34, a, b, 24); withFrame(FX, () => loop(wb, circlePts(-370, -75, 13, 16).map(q => [...q, a < 0 ? a : b]))); });
  const dp = mk("Tilt Dial", "dial", "minor");
  { const pts = [[-72, -8], [72, -8]]; for (let k = 0; k <= 18; k++) pts.push(polar(72, k * Math.PI / 18)); polyXZ(dp, pts, -404, -400);
    withFrame(FY, () => {
      for (let d = 0; d <= 90; d += 5) { const a = d * RAD, r0 = d % 30 === 0 ? 52 : d % 10 === 0 ? 58 : 63; line(dp, [r0 * Math.sin(a), r0 * Math.cos(a), -404.05], [69 * Math.sin(a), 69 * Math.cos(a), -404.05]); }
      let prev = null; for (let d = 0; d <= 90; d += 3) { const a = d * RAD, q = [69 * Math.sin(a), 69 * Math.cos(a), -404.05]; if (prev) line(dp, prev, q); prev = q; }
    }); }
  // worm shaft and worm (module worm, about the worm centre)
  const sf = mk("Worm Shaft", "worm", "major", "worm", WO), wm = mk("Worm", "worm", "major", "worm", WO), ky = mk("Shaft Key", "worm", "minor", "worm", WO);
  at(WO, () => {
    cylX(sf, -370, -75, 12, -362, 115, 20);
    cylX(wm, -370, -75, 14, -50, 50, 20);
    const lead = Math.PI * 3, c = [-370, -75];
    [[17.5, 0.5], [17.5, 2.6], [14, 1.5]].forEach(([r, off]) => {
      let prev = null;
      for (let x = -50; x <= 50.001; x += lead / 20) { const a = 2 * Math.PI * (x + off) / lead; const q = [x, c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]; if (prev) line(wm, [prev[0], prev[1], prev[2]], q); prev = q; }
    });
    withFrame(FX, () => { ringZ(wm, c[0], c[1], 17.5, -50, 24); ringZ(wm, c[0], c[1], 17.5, 50, 24); });
    box(ky, -345, -305, -370 - 4, -370 + 4, -75 + 10, -75 + 16);
  });
  // hand wheel (module wheel, about its hub)
  const rm = mk("Hand Wheel Rim", "wheel", "major", "wheel", WH), hb = mk("Hand Wheel Hub", "wheel", "major", "wheel", WH), hd = mk("Wheel Handle", "wheel", "minor", "wheel", WH), wn = mk("Wheel Nut", "wheel", "minor", "wheel", WH);
  const spokes = [1, 2, 3, 4, 5].map(i => mk("Wheel Spoke " + i, "wheel", "minor", "wheel", WH));
  at(WH, () => {
    const R = 150, ring = []; for (let k = 0; k <= 48; k++) { const a = 2 * Math.PI * k / 48; ring.push([WH[0], WH[1] + R * Math.cos(a), WH[2] + R * Math.sin(a)]); }
    tube(rm, ring, 9, 8);
    spokes.forEach((s, i) => { const a = (90 + 72 * i) * RAD, f = r => [WH[0], WH[1] + r * Math.cos(a), WH[2] + r * Math.sin(a)]; tube(s, [f(26), f(90), f(R - 6)], 6, 8); });
    cylX(hb, WH[1], WH[2], 30, WH[0] - 28, WH[0] + 28, 24);
    cylX(wn, WH[1], WH[2], 21, WH[0] - 40, WH[0] - 28, 6);
    const a = (90 + 36) * RAD, hy = WH[1] + R * Math.cos(a), hz = WH[2] + R * Math.sin(a);
    cylX(hd, hy, hz, 14, WH[0] - 6, WH[0] + 4, 14); cylX(hd, hy, hz, 11, WH[0] - 80, WH[0] - 6, 14);
  });
}

// ================= MOULD =================
const inCav = (u, z) =>
  (u > PLATE.u0 && u < PLATE.u1 && z > PL0 && z < PL1) ||
  (u > SPRUE.u - SPRUE.r - 15 && u < PLATE.u0 && z > ZP - 15 && z < ZP) ||
  (Math.abs(u - SPRUE.u) < SPRUE.r && z > ZP - 15 && z < ZC) ||
  (Math.abs(u - BOSS.u) < BOSS.r && z > PL1 && z < PL1 + BOSS.h) ||
  RISER.us.some(ru => Math.abs(u - ru) < RISER.r && z > PL1 && z < ZC);
// the sand, cut through the middle plane (y = 0): outline of the cavity, the sand's edges, and hatching
function sandSection(p, zA, zB) {
  const C = 5, U0 = -290, NU = 116, NZ = Math.round((zB - zA) / C);
  const sand = (i, j) => i >= 0 && i < NU && j >= 0 && j < NZ && !inCav(U0 + (i + 0.5) * C, zA + (j + 0.5) * C);
  const X = XM;
  for (let i = 0; i <= NU; i++) { let s = null; for (let j = 0; j <= NZ; j++) { const e = j < NZ && sand(i - 1, j) !== sand(i, j); if (e && s === null) s = j; if (!e && s !== null) { line(p, [X + U0 + i * C, 0, zA + s * C], [X + U0 + i * C, 0, zA + j * C]); s = null; } } }
  for (let j = 0; j <= NZ; j++) { let s = null; for (let i = 0; i <= NU; i++) { const e = i < NU && sand(i, j - 1) !== sand(i, j); if (e && s === null) s = i; if (!e && s !== null) { line(p, [X + U0 + s * C, 0, zA + j * C], [X + U0 + i * C, 0, zA + j * C]); s = null; } } }
  for (let c = -(zB - zA); c < 580; c += 16) {            // hatching at 45 degrees
    let s = null, last = null;
    for (let u = 0; u <= 580.01; u += 2.5) {
      const z = u - c, i = Math.floor(u / C), j = Math.floor(z / C), ok = u <= 580 && z >= 0 && z <= zB - zA && sand(Math.min(i, NU - 1), Math.min(j, NZ - 1));
      if (ok && s === null) s = [u, z];
      if (ok) last = [u, z];
      if (!ok && s !== null) { if (last[0] - s[0] > 3) line(p, [X + U0 + s[0], 0, zA + s[1]], [X + U0 + last[0], 0, zA + last[1]]); s = null; }
    }
    if (s !== null && last[0] - s[0] > 3) line(p, [X + U0 + s[0], 0, zA + s[1]], [X + U0 + last[0], 0, zA + last[1]]);
  }
}
{
  const bd = mk("Bottom Board", "board", "major"), sk = mk("Board Skids", "board", "minor");
  box(bd, XM - 380, XM + 380, -280, 280, FLOOR + SKID, ZD0);
  [-140, 0, 140].forEach(y => line(bd, [XM - 380, y, ZD0], [XM + 380, y, ZD0]));
  [-1, 1].forEach(s => [-1, 1].forEach(t => cyl(bd, XM + s * 345, t * 250, 5, ZD0, ZD0 + 1, 8)));
  [-1, 1].forEach(s => box(sk, XM + s * 300 - 30, XM + s * 300 + 30, -280, 280, FLOOR, FLOOR + SKID));
  const flask = (name, z0, z1) => {
    const f = mk(name, name === "Drag Flask" ? "drag" : "cope", "major"), h = z1 - z0, zm = (z0 + z1) / 2;
    box(f, XM - 300, XM + 300, 210, 220, z0, z1);                     // back wall
    [-1, 1].forEach(s => box(f, XM + (s > 0 ? 290 : -300), XM + (s > 0 ? 300 : -290), 0, 220, z0, z1));
    [-1, 1].forEach(s => { cylX(f, 110, zm, 14, XM + s * 300, XM + s * 352, 16); cylX(f, 110, zm, 20, XM + s * 322, XM + s * 332, 16); });
    [-100, 100].forEach(dx => { box(f, XM + dx - 6, XM + dx + 6, 220, 246, zm - 22, zm - 10); box(f, XM + dx - 6, XM + dx + 6, 220, 246, zm + 10, zm + 22); });
    box(f, XM - 106, XM + 106, 238, 246, zm - 22, zm + 22);
    [-200, -100, 0, 100, 200].forEach(dx => withFrame(FY, () => { loop(f, circlePts(XM + dx, zm + h * 0.3, 3, 8).map(q => [...q, 220.05])); }));
    return f;
  };
  flask("Drag Flask", ZD0, ZP); flask("Cope Flask", ZP, ZC);
  const ds = mk("Drag Sand", "drag", "minor"), cs = mk("Cope Sand", "cope", "minor");
  sandSection(ds, ZD0, ZP); sandSection(cs, ZP, ZC);
  // plan views: the parting face of the drag and the top of the cope
  loop(ds, [[XM - 290, 0], [XM + 290, 0], [XM + 290, 210], [XM - 290, 210]].map(q => [...q, ZP]));
  const pl = (p, z, u0, u1, y0, y1) => { line(p, [XM + u0, y0, z], [XM + u0, y1, z]); line(p, [XM + u0, y1, z], [XM + u1, y1, z]); line(p, [XM + u1, y1, z], [XM + u1, y0, z]); };
  pl(ds, ZP, PLATE.u0, PLATE.u1, 0, PLATE.hy);
  pl(ds, ZP, SPRUE.u - 30, PLATE.u0, 0, 14);
  [25, 75].forEach(y => { line(ds, [XM - 215, y - 10, ZP], [XM - 190, y - 10, ZP]); line(ds, [XM - 215, y + 10, ZP], [XM - 190, y + 10, ZP]); });
  line(ds, [XM - 215, 0, ZP], [XM - 215, 100, ZP]); line(ds, [XM - 200, 0, ZP], [XM - 200, 100, ZP]);
  const half = (p, cx, r, z) => { let prev = null; for (let k = 0; k <= 12; k++) { const a = Math.PI * k / 12, q = [cx + r * Math.cos(a), r * Math.sin(a), z]; if (prev) line(p, prev, q); prev = q; } };
  half(ds, XM + SPRUE.u, SPRUE.r, ZP);
  loop(cs, [[XM - 290, 0], [XM + 290, 0], [XM + 290, 210], [XM - 290, 210]].map(q => [...q, ZC]));
  RISER.us.forEach(u => half(cs, XM + u, RISER.r, ZC)); half(cs, XM + SPRUE.u, SPRUE.r, ZC);
  // the clamps: a bar over the parting line on each end, hooked under the drag and over the cope
  const cl = mk("Flask Clamps", "drag", "minor");
  [-1, 1].forEach(s => [45, 175].forEach(y => {
    const xa = s > 0 ? XM + 300 : XM - 312, xb = xa + 12;
    box(cl, xa, xb, y - 12, y + 12, ZD0 + 28, ZC - 28);
    box(cl, s > 0 ? xa - 12 : xb, s > 0 ? xa : xb + 12, y - 12, y + 12, ZD0 + 18, ZD0 + 28);
    box(cl, s > 0 ? xa - 12 : xb, s > 0 ? xa : xb + 12, y - 12, y + 12, ZC - 28, ZC - 18);
    cylY(cl, (xa + xb) / 2, ZP + 10, 6, y - 14, y + 14, 10);
  }));
}

// ================= BASIN AND RISERS =================
{
  const bs = mk("Pouring Basin", "basin", "major");
  revolve(bs, XB, 0, [[BASIN.r, BASIN.top, true], [BASIN.r, BASIN.floor, true], [SPRUE.r, BASIN.floor, true], [SPRUE.r, ZC, true], [BASIN.r + 9, ZC, true], [BASIN.r + 9, BASIN.top, true]], 40, true);
  ringZ(bs, XB, 0, BASIN.r + 4.5, BASIN.top, 40);
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; line(bs, [XB + (BASIN.r + 9) * Math.cos(a), (BASIN.r + 9) * Math.sin(a), ZC], [XB + (BASIN.r + 9) * Math.cos(a), (BASIN.r + 9) * Math.sin(a), BASIN.top]); }
  RISER.us.forEach((u, i) => {
    const r = mk("Riser Sleeve " + (i + 1), "basin", "major");
    revolve(r, XM + u, 0, [[RISER.r, ZC + 105, true], [RISER.r, ZC, true], [46, ZC, true], [46, ZC + 105, true]], 32, true);
    ringZ(r, XM + u, 0, 38, ZC + 105, 32);
  });
  const pg = mk("Sprue Plug", "basin", "minor", "plug");
  cyl(pg, XB, 0, 13.5, BASIN.floor - 6, BASIN.floor + 12, 20);
  tube(pg, [[XB, 0, BASIN.floor + 12], [XB + 20, 0, BASIN.floor + 40], [XB + 48, 0, BASIN.floor + 60], [XB + 48, 0, BASIN.top + 45]], 3.2, 8);
  ringY(pg, XB + 48, BASIN.top + 52, 7, 0, 14);
  cylY(pg, XB + 48, BASIN.top + 52, 7, -4, 4, 14);
}

// ================= STEEL (lines only: stacks of level loops, scaled to rise) =================
const stack = (p, base, h, step, loops) => { for (let z = 0; z <= h + 0.01; z += step) loops(z); };
{
  const bsd = mk("Basin Steel", "fbasin", "minor", "fbasin", FB);
  at(FB, () => stack(bsd, FB, BASIN_H, 4, z => ringZ(bsd, XB, 0, BASIN.r - 3, FB[2] + z, 28)));
  const ssd = mk("Sprue Steel", "fsprue", "minor", "fsprue", FS);
  at(FS, () => stack(ssd, FS, BASIN.floor - FS[2], 6, z => ringZ(ssd, XB, 0, SPRUE.r - 2, FS[2] + z, 14)));
  const gsd = mk("Gating Steel", "fgate", "minor", "fgate", FG);
  at(FG, () => stack(gsd, FG, 15, 3, z => {
    const r = (u0, u1, y0, y1) => loop(gsd, [[XM + u0, y0], [XM + u1, y0], [XM + u1, y1], [XM + u0, y1]].map(q => [...q, FG[2] + z]));
    r(SPRUE.u - 28, -200, -13, 13); r(-215, -200, -98, 98); [-75, -25, 25, 75].forEach(y => r(-200, PLATE.u0, y - 9, y + 9));
  }));
  const csd = mk("Casting Steel", "fcast", "minor", "fcast", FC);
  at(FC, () => stack(csd, FC, PL1 - PL0, 6, z => loop(csd, rrPts(XM + (PLATE.u0 + PLATE.u1) / 2, 0, (PLATE.u1 - PLATE.u0) / 2 - 1, PLATE.hy - 1, 14, 3).map(q => [...q, FC[2] + z]))));
  const hsd = mk("Hub Steel", "fhub", "minor", "fhub", FH);
  at(FH, () => stack(hsd, FH, BOSS.h, 5, z => ringZ(hsd, XM + BOSS.u, 0, BOSS.r - 2, FH[2] + z, 28)));
  const rsd = mk("Riser Steel", "friser", "minor", "friser", FR);
  at(FR, () => stack(rsd, FR, RISER.ztop - PL1, 6, z => RISER.us.forEach(u => ringZ(rsd, XM + u, 0, RISER.r - 2, FR[2] + z, 20))));
}

// ================= STREAM and BATH (lines only, placed and scaled by model.js) =================
{
  const sm = mk("Stream", "stream", "minor", "stream");
  const N = 22; let prev = null;
  for (let i = 0; i <= N; i++) { const u = i / N, q = [u, (i % 2 ? 1 : -1), -u * u]; if (prev) line(sm, prev, q); prev = q; }
  let pc = null;
  for (let i = 0; i <= N; i++) { const u = i / N, q = [u, 0, -u * u]; if (pc) line(sm, pc, q); pc = q; }
  for (let i = 0; i <= N; i += 2) { const u = i / N; line(sm, [u, -1, -u * u], [u, 1, -u * u]); }
  const bt = mk("Steel Bath", "bath", "minor", "bath");
  [1, 0.72, 0.44, 0.18].forEach(r => loop(bt, circlePts(0, 0, r, 40).map(q => [...q, 0])));
  line(bt, [-1, 0, 0], [1, 0, 0]); line(bt, [0, -1, 0], [0, 1, 0]);
}

// ================= PYROMETER =================
const PX = 355, PY = -640, PZH = -170, BZ0 = -95;
{
  const tl = mk("Tripod Legs", "pyro", "minor");
  [90, 210, 330].forEach(d => { const a = d * RAD, fx = PX + 230 * Math.cos(a), fy = PY + 230 * Math.sin(a); tube(tl, [[PX, PY, PZH], [(PX + fx) / 2, (PY + fy) / 2, (PZH + FLOOR) / 2], [fx, fy, FLOOR + 6]], 8, 8); cyl(tl, fx, fy, 20, FLOOR, FLOOR + 6, 14); });
  const th = mk("Tripod Head", "pyro", "major");
  cyl(th, PX, PY, 42, PZH - 4, PZH + 14, 20); cyl(th, PX, PY, 16, PZH + 14, PZH + 28, 12);
  cylX(th, PY, PZH + 20, 8, PX + 40, PX + 80, 10);
  const yk = mk("Mounting Yoke", "pyro", "minor");
  box(yk, PX - 34, PX - 28, PY - 40, PY + 30, PZH + 28, BZ0 - 35); box(yk, PX + 28, PX + 34, PY - 40, PY + 30, PZH + 28, BZ0 - 35); box(yk, PX - 34, PX + 34, PY - 40, PY + 30, PZH + 28, PZH + 34);
  cylX(yk, PY, BZ0 - 35, 6, PX - 40, PX + 40, 10);
  const bd = mk("Pyrometer Body", "pyro", "major");
  withFrame(FY, () => extrude(bd, rrRegion(PX, BZ0, 40, 35, 8, 4), -720, -560));
  [-1, 1].forEach(s => withFrame(FY, () => line(bd, [PX + s * 40, BZ0 + 35, -720], [PX + s * 40, BZ0 + 35, -560])));
  cyl(bd, PX - 20, -600, 7, BZ0 + 35, BZ0 + 43, 12);
  const lb = mk("Lens Barrel", "pyro", "major");
  cylY(lb, PX, BZ0, 26, -560, -520, 28); cylY(lb, PX, BZ0, 31, -532, -520, 28); ringY(lb, PX, BZ0, 20, -519.9, 24);
  const dsp = mk("Pyrometer Display", "pyro", "minor");
  withFrame(FY, () => extrude(dsp, rrRegion(PX, BZ0, 37, 23, 3, 3, [[PX - 31, PX + 31, BZ0 - 18, BZ0 + 18]]), -724, -720));
  const ab = mk("Aiming Beam", "pyro", "minor");
  for (let y = -519; y < -6; y += 18) line(ab, [PX, y, BZ0 + (y + 519) * 0.03], [PX, Math.min(y + 11, -4), BZ0 + (y + 530) * 0.03]);
  ringY(ab, PX, BZ0 + 15, 7, -2, 12);
}

// ---------- explode, callouts, tour ----------
const UP = 260;
const explode = {
  floor: [0, 0, -50], stand: [0, 0, 0],
  ladle: [0, 0, UP], bath: [0, 0, UP], stream: [0, 0, UP], counterweight: [-260, 0, UP], dial: [0, -300, 90],
  drive: [0, -300, 0], worm: { offset: [0, -430, -70], base: WO }, wheel: { offset: [-200, -300, 0], base: WH },
  board: [0, 0, 0], drag: [0, 0, 70], cope: [0, 0, 200], basin: [0, 0, 330],
  fbasin: { offset: [0, 0, 330], base: FB }, fsprue: { offset: [0, 0, 200], base: FS }, fgate: { offset: [0, 0, 70], base: FG },
  fcast: { offset: [0, 0, 70], base: FC }, fhub: { offset: [0, 0, 200], base: FH }, friser: { offset: [0, 0, 200], base: FR },
  pyro: [0, -320, 0],
};
const hotspots = [
  ["Ladle", "Refractory-lined steel, 85 kg of steel", [-60, -150, 100], ["Ladle Shell", "Refractory Lining"]],
  ["Pouring lip", "The spout the steel leaves by", [LIP[0], 0, LIP[1]], ["Spout Floor"]],
  ["Trunnion", "The pin the ladle tilts on", [0, -330, 30], ["Trunnion Pin Front"]],
  ["Pillow block", "Bearing housing on the stand", [0, -330, 60], ["Front Pillow Block"]],
  ["Worm wheel", "40 teeth: one turn of the worm is 9 degrees", [30, -370, -58], ["Worm Wheel Segment"]],
  ["Worm", "Single start: self-locking", [-45, -370, -75], ["Worm"]],
  ["Hand wheel", "Five spokes, 40 turns for a full circle", [-330, -370 + 150 * Math.cos(18 * RAD), -75 + 150 * Math.sin(18 * RAD)], ["Hand Wheel Rim"]],
  ["Tilt dial", "Needle shows the ladle's angle", [52, -404.2, 52], ["Tilt Dial"]],
  ["Counterweight", "Balances the spout side", [-385, 0, 105], ["Counterweight Block"]],
  ["Pouring basin", "A cup over the sprue", [XB + 60, 0, BASIN.top], ["Pouring Basin"]],
  ["Sprue plug", "Held down until the basin is full", [XB + 48, 0, BASIN.top + 45], ["Sprue Plug"]],
  ["Riser", "Feeds the casting as it shrinks", [XM + RISER.us[1] + 40, 0, ZC + 105], ["Riser Sleeve 2"]],
  ["Cope flask", "The top half of the mould", [XM + 300, 110, ZP + 65], ["Cope Flask"]],
  ["Drag flask", "The bottom half of the mould", [XM + 300, 110, ZP - 65], ["Drag Flask"]],
  ["Flask clamp", "Holds cope on drag", [XM + 306, 45, ZP], ["Flask Clamps"]],
  ["Casting cavity", "A flanged plate with a hub", [XM + 20, 0, PL0 + 20], ["Drag Sand"]],
  ["Pyrometer", "Two-colour: reads the stream", [PX, -720, BZ0 + 38], ["Pyrometer Body"]],
  ["Spill bund", "Catches any steel that misses", [-300, 0, FLOOR + 35], ["Spill Bund"]],
].map(([t, s, p, o]) => ({ t, s, p: loc(o[0], p), o }));
const pt = (name, p) => [...loc(name, p), name];
const tour = {
  points: {
    ladle: pt("Refractory Lining", [-90, 60, 20]), lip: pt("Spout Floor", [LIP[0], 0, LIP[1]]), gear: pt("Worm Wheel Segment", [20, -370, -58]),
    wheel: pt("Hand Wheel Rim", [-330, -370 + 150 * Math.cos(18 * RAD), -75 + 150 * Math.sin(18 * RAD)]), dial: pt("Tilt Dial", [30, -404.2, 40]),
    cw: pt("Counterweight Block", [-385, 0, 105]), basin: pt("Pouring Basin", [XB + 40, 0, BASIN.top]), sprue: pt("Drag Sand", [XM + SPRUE.u, 0, ZP - 5]),
    gates: pt("Drag Sand", [XM + PLATE.u0, 0, ZP - 5]), cast: pt("Drag Sand", [XM + 30, 0, PL0 + 25]), riser: pt("Riser Sleeve 1", [XM + RISER.us[0], 0, ZC + 105]),
    pyro: pt("Pyrometer Body", [PX, -720, BZ0]), lens: pt("Lens Barrel", [PX, -520, BZ0]),
  },
  steps: [
    { t: "The ladle holds the steel", focus: "ladle", dist: 0.5, ex: 0, p: ["ladle", "lip"], n: ["Ladle Shell", "Refractory Lining", "Steel Bath", "Spout Floor"], ms: 5000,
      d: "A steel shell lined with 45 mm of refractory holds 85 kg of liquid steel at 1,640 degrees. The drawing is cut away at the front so the lining and the bath show." },
    { t: "One wheel tilts it", focus: "gear", dist: 0.45, ex: 1, p: ["wheel", "gear", "dial"], n: ["Hand Wheel Rim", "Worm", "Worm Wheel Segment", "Tilt Needle"], ms: 5000,
      d: "A single-start worm turns a 40-tooth wheel on the trunnion: 40 turns of the hand wheel for one turn of the ladle, so a 43 degree pour is about five turns. At that ratio the gearbox cannot be back-driven: it holds the ladle wherever the wheel stops." },
    { t: "The counterweight balances it", focus: "cw", dist: 0.5, ex: 1, p: ["cw", "ladle"], n: ["Counterweight Arm", "Counterweight Block"], ms: 4500,
      d: "A weight on an arm on the side away from the spout balances the overhang of the spout side about the trunnions, so the wheel does not have to lift the ladle." },
    { t: "The stream fills the basin", focus: "basin", dist: 0.5, ex: 0, p: ["lip", "basin"], n: ["Stream", "Pouring Basin", "Basin Steel", "Sprue Plug"], ms: 5000,
      d: "The steel leaves the lip in a falling stream into the pouring basin. The plug in the sprue stays shut until the basin is full, so the first steel and slag settle there." },
    { t: "Sprue, runner and gates", focus: "gates", dist: 0.5, ex: 1, p: ["sprue", "gates", "cast"], n: ["Sprue Steel", "Gating Steel", "Casting Steel", "Drag Sand", "Cope Sand"], ms: 5000,
      d: "Once the plug lifts, steel drops down the sprue, along the runner and through the gates into the bottom of the cavity, which rises smoothly instead of splashing." },
    { t: "Risers feed the shrinkage", focus: "riser", dist: 0.5, ex: 1, p: ["riser", "cast"], n: ["Riser Sleeve 1", "Riser Sleeve 2", "Riser Steel", "Hub Steel"], ms: 5000,
      d: "Steel shrinks as it freezes. Two insulating riser sleeves keep a reservoir liquid longest, and it feeds the casting until it is solid." },
    { t: "A pyrometer reads the stream", focus: "pyro", dist: 0.5, ex: 0, p: ["lens", "pyro"], n: ["Pyrometer Body", "Pyrometer Display", "Lens Barrel", "Aiming Beam"], ms: 4500,
      d: "A two-colour pyrometer on a tripod compares the stream's glow at two wavelengths, so smoke or a dirty window does not change the reading. It shows the stream's temperature." },
  ],
};

// the sampled run, for model.js
const sim = simulate();
const R1 = (v, n = 1) => +v.toFixed(n);
const run = {
  dt: 0.1, cycle: sim.cycleEnd,
  th: sim.rows.map(r => R1(r.th, 2)), state: sim.rows.map(r => r.state),
  bath: sim.rows.map(r => r.srf.slice(0, 4).map(v => R1(v, 1))),
  vl: sim.rows.map(r => R1(r.Vl / 1e6, 3)), poured: sim.rows.map(r => R1(r.poured, 2)),
  qin: sim.rows.map(r => R1(r.Qin, 3)), hb: sim.rows.map(r => R1(r.hb, 1)), plug: sim.rows.map(r => r.plug),
  lvl: sim.rows.map(r => R1(r.lvl, 1)), mould: sim.rows.map(r => R1(r.mould, 2)), frozen: sim.rows.map(r => R1(r.frozen, 3)), clear: sim.rows.map(r => R1(r.clear, 2)), tl: sim.rows.map(r => R1(r.Tl, 1)),
};
const consts = { XB, XM, LIP, BASIN, BASIN_H, ZP, ZC, PL0, PL1, RISER, BOSS, SPRUE, WH, WO, FB, FS, FG, FC, FH, FR, ZRF: RISER.ztop, H_SPRUE: BASIN.floor - FS[2], H_PLATE: PL1 - PL0, H_RIS: RISER.ztop - PL1, PX, BZ0 };
const screen = { module: "pyro", origin: [PX - 31, -720.4, BZ0 - 18], right: [PX + 31, -720.4, BZ0 - 18], top: [PX - 31, -720.4, BZ0 + 18], cornerRadius: 0 };

const geometry = geometryScript("FDY_GEOMETRY", "models/foundry/build.js", { explode, hotspots, tour, run, consts, screen });
writeGeometry(HERE, geometry);
console.log(`models/foundry/geometry.js: ${geometry.stats}; cycle ${sim.cycleEnd}s`);
