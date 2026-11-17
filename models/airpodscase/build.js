/*
AirPods Pro (2nd generation) charging case with both earbuds: builds its geometry.

Generated in code (kit/procedural.js) in mm: X across the front (60.6 mm), Y back (21.7 mm; the front faces -Y), Z up (45.2 mm),
standing upright on its base, lid on top. The case parts are drawn here; each earbud is a call of buildBud() from
models/airpodspro/bud.js ("R " the right bud, "L " a mirrored left one) placed stem-down in its well.
Open state (the page's exploded state): the lid swings about its hinge (the page rotates every lid part about the hinge,
setup() in model.js), the two buds fly up out of the wells, and the case and each bud come apart into components.
Everything of the lid is drawn relative to the hinge point HG (a spool module based there), so the lid can turn.

    node models/airpodscase/build.js

Writes models/airpodscase/geometry.js.
*/
"use strict";
const { withFrame, part, line, loop, circlePts, rrPts, rrRegion, rect, polyRegion, extrude, sheet, loft, rrBody, cyl, revolve, tube, holeWalls,
  r3, geometryScript, writeGeometry } = require("../../kit/procedural");
const { buildBud } = require("../airpodspro/bud");

const HERE = __dirname;
const W = 30.3, D = 10.85, WALL = 1.1, LZ = 30, H = 45.2;           // half width, half depth, wall, parting line, height
const RC = D;                                                        // the plan is a stadium: the two ends are half circles
const RB = 7.5, RT = 7;                                              // the case is rounded all over: the bottom edge and the lid's top edge are rounded by these radii
const HG = [0, 8.9, 30.5];                                          // the hinge axis (along x), at the back of the parting line
const lidF = q => [q[0] - HG[0], q[1] - HG[1], q[2] - HG[2]];       // lid parts are drawn about the hinge
const AX = q => [q[2], q[0], q[1]];                                 // a cylinder along x:   cyl(p, y, z, r, x0, x1)
const AY = q => [q[0], q[2], q[1]];                                 // a cylinder along y:   cyl(p, x, z, r, y0, y1); draws (x, z) and pushes along y
const box = (p, x0, x1, y0, y1, z0, z1, o) => extrude(p, rect(x0, x1, y0, y1), z0, z1, o);
const rbox = (p, cx, cy, hw, hh, r, z0, z1, o) => extrude(p, rrRegion(cx, cy, hw, hh, r, 3), z0, z1, o);
const LID = { spool: "lid" };

// the rings of a rounded edge, as [inset, z, hard]: a quarter circle from the flat side to the face
const ringsBottom = R => Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 2 * (1 - i / 7); return [R * (1 - Math.cos(a)), R * (1 - Math.sin(a)), i === 0 || i === 7]; });   // z = 0 up to the side
const ringsTop = R => Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 2 * (i / 7); return [R * (1 - Math.cos(a)), H - R + R * Math.sin(a), i === 0 || i === 7]; });         // the side up to z = H
// the same, inside the wall, from the top down (the inside of the lid) or from the side down to the floor (the body)
const insideTop = R => Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 2 * (1 - i / 7); return [WALL + (R - WALL) * (1 - Math.cos(a)), H - WALL - (R - WALL) * (1 - Math.sin(a))]; });
const insideBottom = R => Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 2 * (i / 7); return [WALL + (R - WALL) * (1 - Math.cos(a)), WALL + (R - WALL) * (1 - Math.sin(a))]; });
// a hollow rounded body: outer rings bottom to top, inner rings top to bottom, closed at the bottom rim
function hollow(p, cx, cy, hw, hh, r, outer, inner, seg = 5) {
  const ring = ([ins, z, hard]) => ({ hard, pts: rrPts(cx, cy, hw - ins, hh - ins, Math.max(r - ins, 0.2), seg).map(q => [q[0], q[1], z]) });
  const rs = [...outer.map(ring), ...inner.map(ring), { ...ring(outer[0]), hard: false }];
  loft(p, rs);
}
// a flat ring (outer minus inner rounded rectangle) from z0 to z1 with top and bottom faces
function band(p, cx, cy, hw0, hh0, hw1, hh1, r, z0, z1, hardTop = true) {
  const R = (hw, hh, z, hard) => ({ hard, pts: rrPts(cx, cy, hw, hh, r, 5).map(q => [q[0], q[1], z]) });
  loft(p, [R(hw0, hh0, z0, true), R(hw0, hh0, z1, hardTop), R(hw1, hh1, z1, hardTop), R(hw1, hh1, z0, true), R(hw0, hh0, z0, false)]);
}

// ---------- layout ----------
const BX = 15.3, BY = 1.0, BZ = 12.0;                 // the buds' stems: centres at x = +-BX, y = BY, their flat ends at z = BZ
const PC = 14.8, PHW = 13.8, PY = 0.2, PHH = 7.4;     // the head pockets in the insert
const pocket = s => s > 0 ? [PC - PHW, PC + PHW, PY - PHH, PY + PHH] : [-PC - PHW, -PC + PHW, PY - PHH, PY + PHH];
const stemHole = s => [s * BX - 3.6, s * BX + 3.6, BY - 4.2, BY + 4.2];
const INH = 8.45;                                      // the insert's half depth: leaves a channel front and back

// =========================================================== the lid (all about the hinge)
const lidShell = part("Lid Shell", "lidshell", "major", LID);
withFrame(lidF, () => {
  hollow(lidShell, 0, 0, W, D, RC, [[0, 30.1, true], ...ringsTop(RT)], [...insideTop(RT), [WALL, 30.1]], 6);
  extrude(lidShell, rrRegion(0, 0, W - RT, D - RT, RC - RT, 5), H - 0.05, H, { bottom: false, wallIf: () => false });
  // tangent edges where the rounded ends meet the flat front and back
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
    line(lidShell, [sx * W, sy * (D - RC), 30.1], [sx * W, sy * (D - RC), H - RT]);
    line(lidShell, [sx * (W - RC), sy * D, 30.1], [sx * (W - RC), sy * D, H - RT]);
  });
  // the thumb notch at the front: a scoop in the lip, drawn on the front face, and the parting line's lid side
  loop(lidShell, [[-5, -D - 0.05, 30.1], [-4, -D - 0.05, 31.4], [-2, -D - 0.05, 32.2], [2, -D - 0.05, 32.2], [4, -D - 0.05, 31.4], [5, -D - 0.05, 30.1]]);
  line(lidShell, [-W, -D + 3, 30.1], [W, -D + 3, 30.1]);
});
const liner = part("Lid Liner", "lidliner", "major", LID);
const RECESS = s => s > 0 ? [PC - PHW + 0.4, PC + PHW - 2.4, PY - PHH + 0.6, PY + PHH - 0.8] : [-PC - PHW + 2.4, -PC + PHW - 0.4, PY - PHH + 0.6, PY + PHH - 0.8];   // inside the rounded roof
withFrame(lidF, () => {
  extrude(liner, rrRegion(0, 0, W - WALL - 0.1, D - WALL - 0.1, RC - WALL, 5, [RECESS(1), RECESS(-1)]), 30.2, 33.0);
  [1, -1].forEach(s => {
    const r = RECESS(s);
    holeWalls(liner, r, 33.0, 43.5, false);
    extrude(liner, rect(r[0], r[1], r[2], r[3]), 43.0, 43.6, { wallIf: () => false });
    // contour ribs inside the recess
    for (let k = 1; k < 4; k++) line(liner, [r[0] + 0.01, r[2] + 0.01, 33.0 + k * 2.5], [r[0] + 0.01, r[3] - 0.01, 33.0 + k * 2.5]);
  });
});
const lm = part("Lid Magnet L", "lidmag", "minor", LID), rm = part("Lid Magnet R", "lidmag", "minor", LID);
withFrame(lidF, () => { cyl(rm, 27.0, -6.2, 1.8, 33.2, 35.2, 20); cyl(lm, -27.0, -6.2, 1.8, 33.2, 35.2, 20); });
const target = part("Hall Target Magnet", "lidmag", "minor", LID);
withFrame(lidF, () => { rbox(target, -6, -8.9, 1.6, 0.9, 0.2, 31.0, 32.8); });
const barrel = part("Hinge Barrel", "hinge", "major", LID);
withFrame(lidF, () => withFrame(AX, () => {
  cyl(barrel, HG[1], HG[2], 1.9, -17, 17, 24);
  for (const x of [-12, -6, 0, 6, 12]) loop(barrel, circlePts(HG[1], HG[2], 1.92, 24).map(q => [q[0], q[1], x]));
  [-17.0, 17.0].forEach(x => loop(barrel, circlePts(HG[1], HG[2], 0.8, 12).map(q => [q[0], q[1], x])));
}));
const hpin = part("Hinge Pin", "hingepin", "minor");
withFrame(AX, () => { cyl(hpin, HG[1], HG[2], 0.8, -24, -16, 12); cyl(hpin, HG[1], HG[2], 0.8, 16, 24, 12); });
const knuck = part("Hinge Knuckles", "hingepin", "minor");
withFrame(AX, () => [[-23, -17.2], [17.2, 23]].forEach(([a, b]) => cyl(knuck, HG[1], HG[2], 2.2, a, b, 20)));
// the hinge parts above sit in the lid frame so they turn with the lid (barrel) or are placed about the hinge (pin, knuckles)

// =========================================================== the body
const body = part("Body Shell", "bodyshell", "major");
const SPK = [-17, -0.4], USB = [0, -0.4];                           // on the flat of the bottom, which the rounding leaves 45.6 x 6.7 mm
const holes = [[USB[0] - 4.6, USB[0] + 4.6, USB[1] - 1.5, USB[1] + 1.5]];
[-2.4, 0, 2.4].forEach(dx => [-1.4, 1.4].forEach(dy => holes.push([SPK[0] + dx - 0.55, SPK[0] + dx + 0.55, SPK[1] + dy - 0.55, SPK[1] + dy + 0.55])));
hollow(body, 0, 0, W, D, RC, [...ringsBottom(RB), [0, LZ, true]], [[WALL, LZ], ...insideBottom(RB)], 6);
extrude(body, rrRegion(0, 0, W - RB, D - RB, RC - RB, 6, holes), 0, 1.0, { wallIf: (a, b) => Math.abs(a[0]) < W - RB - 0.6 && Math.abs(a[1]) < D - RB - 0.6 });
// tangent edges where the rounded plan corners meet the flat sides
[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
  line(body, [sx * W, sy * (D - RC), RB], [sx * W, sy * (D - RC), LZ]);
  line(body, [sx * (W - RC), sy * D, RB], [sx * (W - RC), sy * D, LZ]);
});
// openings in the walls: the LED lens (front), the system button (back), the screws' recesses underneath
loop(body, [[-1.6, -D - 0.05, 27.7], [1.6, -D - 0.05, 27.7], [1.6, -D - 0.05, 29.2], [-1.6, -D - 0.05, 29.2]]);
withFrame(AY, () => loop(body, circlePts(0, 18, 2.7, 20).map(q => [q[0], q[1], D + 0.05])));
const SCREWS = [[-9, -2], [9, -2], [-9, 2], [9, 2]];
SCREWS.forEach(([x, y]) => loop(body, circlePts(x, y, 1.5, 12).map(q => [...q, -0.02])));

const insert = part("Well Insert", "insert", "major");
{
  extrude(insert, rrRegion(0, 0, 29.0, INH, 2.5, 4, [pocket(1), pocket(-1)]), 9.0, 29.6);
  [1, -1].forEach(s => {
    const sh = stemHole(s), pk = pocket(s);
    const pins = [-1.2, 1.2].map(dx => [s * BX + dx - 0.7, s * BX + dx + 0.7, 0.4 - 0.7, 0.4 + 0.7]);
    extrude(insert, rrRegion(s * PC, PY, PHW, PHH, 0.8, 3, [sh]), 22.0, 22.6);              // the pocket's floor, with the stem well
    holeWalls(insert, sh, 11.0, 22.0, false);                                                // the well
    extrude(insert, rrRegion(s * BX, BY, 3.6, 4.2, 0.4, 3, pins), 10.4, 11.0);               // its floor with the pogo holes
  });
}
[1, -1].forEach(s => {
  const c = part(s > 0 ? "Bud Cradle R" : "Bud Cradle L", "cradle", "minor");
  const R = (cx, cy, hw, hh, z, hard) => ({ hard, pts: rrPts(cx, cy, hw, hh, 0.8, 3).map(q => [q[0], q[1], z]) });
  loft(c, [R(s * PC, PY, PHW - 0.4, PHH - 0.4, 29.2, true), R(s * PC, PY + 0.4, 8.4, 6.0, 25.6), R(s * BX, BY, 3.9, 4.5, 22.6, true)]);
  const g = part(s > 0 ? "Well Gasket R" : "Well Gasket L", "cradle", "minor");
  band(g, s * BX, BY, 5.0, 5.6, 4.1, 4.7, 1.0, 22.6, 23.0);
});
[1, -1].forEach(s => {
  const m = part(s > 0 ? "Well Magnet R" : "Well Magnet L", "wellmag", "minor");
  withFrame(q => q, () => {
    revolve(m, s * BX, 0.4, [[1.9, 7.7, true], [3.4, 7.7, true], [3.4, 9.0, true], [1.9, 9.0, true]], 24, true);
  });
});
const pogo = part("Pogo Pins", "pogo", "minor");
[1, -1].forEach(s => [-1.2, 1.2].forEach(dx => {
  cyl(pogo, s * BX + dx, 0.4, 0.8, 9.4, 10.2, 12);
  cyl(pogo, s * BX + dx, 0.4, 0.45, 10.2, 12.0, 12);
  for (let z = 10.4; z < 11.9; z += 0.4) loop(pogo, circlePts(s * BX + dx, 0.4, 0.47, 8).map(q => [...q, z]));
}));
const pflex = part("Pogo Flex", "pogoflex", "minor");
[1, -1].forEach(s => { extrude(pflex, rect(Math.min(s * BX - 2.4, s * BX + 2.4), Math.max(s * BX - 2.4, s * BX + 2.4), -9.3, 1.8), 9.2, 9.4); });

// the front channel: the main PCB (vertical), its parts, the light pipe; the back channel: antenna, button
const pcb = part("Main PCB", "pcb", "major");
withFrame(AY, () => {
  extrude(pcb, rrRegion(0, 17.9, 23.5, 8.8, 1.5, 3), -9.7, -9.1);
  [[-21, 11], [21, 11], [-21, 24.5], [21, 24.5]].forEach(([x, z]) => loop(pcb, circlePts(x, z, 0.5, 8).map(q => [q[0], q[1], -9.71])));
});
const chg = part("Charger Chip", "pcb", "major");
withFrame(AY, () => { extrude(chg, rrRegion(10, 16, 2.4, 2.4, 0.3, 2), -9.1, -8.5); loop(chg, circlePts(8.9, 17.1, 0.3, 8).map(q => [q[0], q[1], -8.49])); });
const hall = part("Hall Sensor", "pcb", "minor");
withFrame(AY, () => extrude(hall, rrRegion(-6, 25.6, 0.8, 0.8, 0.1, 2), -9.1, -8.7));
const led = part("Status LED", "pcb", "minor");
withFrame(AY, () => extrude(led, rrRegion(0, 26.8, 0.9, 0.35, 0.1, 2), -9.7, -9.1));
const pipe = part("Light Pipe", "lightpipe", "minor");
box(pipe, -1.2, 1.2, -10.5, -9.4, 27.2, 29.3);
box(pipe, -1.5, 1.5, -10.72, -10.5, 27.7, 29.2);
const ledfx = part("LED Glow", "ledfx", "minor", { spool: "led" });
const ledfx2 = part("LED Glow Open", "ledfx", "minor", { spool: "led2" });
[[ledfx, 0.55], [ledfx2, 0.9]].forEach(([p, k]) => withFrame(AY, () => {
  loop(p, rrPts(0, 28.45, 2.0 + 2 * k, 0.7 + k, 0.7, 3).map(q => [q[0], q[1], -D - 0.15]));
  loop(p, rrPts(0, 28.45, 1.7, 0.5, 0.4, 3).map(q => [q[0], q[1], -D - 0.1]));
}));
const uwb = part("UWB Antenna", "uwb", "minor");
withFrame(AY, () => {
  extrude(uwb, rrRegion(13.5, 23.5, 8.5, 4.5, 0.8, 3), 9.3, 9.45);
  const tr = []; for (let x = 6.5; x <= 20.6; x += 0.9) tr.push([x, tr.length % 2 ? 26.8 : 21.0, 9.29]);
  for (let i = 0; i + 1 < tr.length; i++) line(uwb, tr[i], tr[i + 1]);
});
const bcap = part("Button Cap", "button", "minor");
withFrame(AY, () => { cyl(bcap, 0, 18, 2.5, 9.2, 11.0, 20); cyl(bcap, 0, 18, 3.4, 9.2, 9.75, 20); loop(bcap, circlePts(0, 18, 1.2, 14).map(q => [q[0], q[1], 11.01])); });
const bsw = part("Button Switch", "buttonsw", "minor");
withFrame(AY, () => { extrude(bsw, rrRegion(0, 18, 1.6, 1.6, 0.3, 2), 8.65, 9.2); cyl(bsw, 0, 18, 0.9, 9.2, 9.4, 12); });
const bflex = part("Button Flex", "buttonsw", "minor");
withFrame(AY, () => extrude(bflex, rrRegion(0, 12.0, 1.5, 6.0, 0.3, 2), 8.5, 8.65));
box(bflex, -1.5, 1.5, -9.4, 8.65, 7.7, 7.85);
box(bflex, -1.5, 1.5, -9.4, -9.1, 7.7, 10.0);

// the bottom: USB-C port, speaker, lanyard
const usbf = part("USB-C Port Frame", "usb", "major");
hollow(usbf, USB[0], USB[1], 4.7, 1.55, 1.2, [[0, 0.3, true], [0, 4.8, true]], [[0.5, 4.8], [0.5, 0.3]], 3);
const usbt = part("USB-C Tongue", "usb", "minor");
box(usbt, -3.6, 3.6, USB[1] - 0.35, USB[1] + 0.35, 1.0, 4.2);
for (let x = -3.2; x <= 3.21; x += 0.64) line(usbt, [x, USB[1] - 0.36, 1.2], [x, USB[1] - 0.36, 3.2]);
const usbc = part("USB-C Connector", "usb", "minor");
rbox(usbc, USB[0], USB[1], 5.2, 1.9, 0.4, 4.8, 7.4);
const spk = part("Speaker", "speaker", "major");
rbox(spk, SPK[0], SPK[1], 5, 4, 1.2, 1.3, 6.5);
loop(spk, rrPts(SPK[0], SPK[1], 3.6, 2.6, 0.8, 3).map(q => [q[0], q[1], 6.51]));
const spg = part("Speaker Gasket", "speaker", "minor");
band(spg, SPK[0], SPK[1], 5.5, 4.5, 4.9, 3.9, 1.4, 1.0, 1.3);
const lbk = part("Lanyard Bracket", "lanyard", "minor");
box(lbk, 16.6, 21.0, -2.2, 2.2, 1.0, 5.0);
const lpin = part("Lanyard Pin", "lanyard", "minor");
withFrame(AX, () => cyl(lpin, 0, 2.6, 0.6, 14.9, 21.4, 12));
const loopP = part("Lanyard Loop", "lanyard", "major");
{
  const pts = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + Math.PI * i / 16; pts.push([19 + 2.6 * Math.cos(a), 0, 2.6 + 2.6 * Math.sin(a) * 1.0]); }
  tube(loopP, pts.map(q => [q[0], q[1], q[2] - 0.5]).map(q => [q[0], q[1], q[2] < 0.1 ? q[2] : q[2]]), 0.6, 8);
}

// the stack under the wells: coil, magnet ring, shield, battery
const CC = [2.7, -0.9];
const shield = part("Coil Shield", "coilshield", "minor");
extrude(shield, rrRegion(CC[0], CC[1], 19.2, 8.3, 1.5, 3, [[-5.6, 5.6, -4.4, 0.4]]), 1.0, 1.3);
const coil = part("Qi Coil", "coil", "major");
band(coil, CC[0], CC[1], 18.0, 7.5, 8.6, 3.6, 3.0, 1.4, 2.2);
for (let k = 1; k <= 9; k++) { const t = k / 10; loop(coil, rrPts(CC[0], CC[1], 18.0 + (8.6 - 18.0) * t, 7.5 + (3.6 - 7.5) * t, 3.0, 5).map(q => [q[0], q[1], 2.21])); }
const cring = part("Coil Magnet Ring", "coil", "minor");
band(cring, CC[0], CC[1], 19.6, 8.7, 18.8, 7.9, 3.2, 1.4, 2.2);
const bat = part("Case Battery", "cbattery", "major");
extrude(bat, polyRegion([[-15.5, -7.6], [-6.2, -7.6], [-6.2, 0], [6.2, 0], [6.2, -7.6], [20.5, -7.6], [20.5, 7.6], [-15.5, 7.6]]), 3.0, 7.0);
line(bat, [-15.5, 6.2, 7.01], [20.5, 6.2, 7.01]); line(bat, [-15.5, 6.2, 3.0], [-15.5, 6.2, 7.0]);
const bflx = part("Battery Flex", "cbattery", "minor");
box(bflx, 16, 19, -9.2, -8.7, 5.0, 11.0);
box(bflx, 16, 19, -9.2, -7.6, 5.0, 5.2);
const foam = part("Foam Gasket", "cbattery", "minor");
box(foam, -14, -7, 1.0, 7.0, 7.0, 7.5); box(foam, 8, 19, 1.0, 7.0, 7.0, 7.5);
const screws = part("Case Screws", "screws", "minor");
SCREWS.forEach(([x, y]) => { cyl(screws, x, y, 0.8, 0.5, 8.8, 10); cyl(screws, x, y, 1.35, 0.0, 0.5, 14); line(screws, [x - 0.9, y, -0.01], [x + 0.9, y, -0.01]); });

// =========================================================== the buds
const MIX = { R: 1, L: -1 };
const frames = {
  R: q => [q[0] + (BX - 1.9), q[1] + (BY - 1.2), q[2] + BZ],
  L: q => [q[0] + (-BX + 1.9), q[1] + (BY - 1.2), q[2] + BZ],
};
const buds = {};
buds.R = buildBud({ prefix: "R ", mirror: false, frame: frames.R, moduleOf: (n, def) => "R " + def });
buds.L = buildBud({ prefix: "L ", mirror: true, frame: frames.L, moduleOf: (n, def) => "L " + def });

// ---------- explode ----------
const add = (a, b) => a.map((v, i) => v + b[i]);
const mul = (a, k) => a.map(v => v * k);
const along = (...pairs) => r3(pairs.reduce((s, [dir, k]) => add(s, mul(dir, k)), [0, 0, 0]));
const K = 0.45;                                     // the buds' components spread, scaled down from the earbud model
const FLY = { R: [26, 0, 66], L: [-26, 0, 66] };
const explode = {
  lidshell: { offset: [0, 38, 4], base: r3(HG) }, lidmag: { offset: [0, 19, 4], base: r3(HG) }, lidliner: { offset: [0, 0, 4], base: r3(HG) },
  hinge: { offset: [0, 6, 18], base: r3(HG) }, hingepin: [0, 4, 24],
  insert: [0, 0, 24], cradle: [0, 0, 24], pogo: [0, 0, 6], pogoflex: [0, 0, 0], wellmag: [0, 0, -4],
  pcb: [0, -30, 0], lightpipe: [0, -14, 16], ledfx: [0, -4, 0], uwb: [0, 30, 0], button: [0, 24, -12], buttonsw: [0, 16, -22],
  bodyshell: [0, 0, -56], usb: [0, 0, -42], coilshield: [0, 0, -31], coil: [0, 0, -22], cbattery: [0, 0, -12],
  speaker: [-26, 0, -40], lanyard: [28, 0, -46], screws: [0, 0, -50],
};
// the buds: each module's earbud offset (Task 1's, scaled) plus the fly-out
const BUD_OFFS = (info, k) => {
  const d = info.dir;
  return {
    tip: along([d.N, 48]), nozzle: along([d.N, 34]), front: along([d.N, 20]), sensors: along([d.N, 12], [d.Up, -18]),
    diaphragm: along([d.N, 9]), driver: [0, 0, 0], backvol: along([d.N, -10]), back: along([d.N, -28]),
    board: along([d.X, 22]), battery: along([d.X, 46]), antenna: along([d.Y, 22]), force: along([d.Y, -22]),
    stemmag: along([d.X, 10], [d.Z, -8]), stem: along([d.Z, -32]), contacts: along([d.Z, -64]),
  };
};
["R", "L"].forEach(k => {
  const info = buds[k], offs = BUD_OFFS(info);
  Object.keys(offs).forEach(m => { explode[k + " " + m] = r3(add(mul(offs[m], K), FLY[k])); });
  explode[k + " waves"] = { offset: r3(add(mul(info.dir.N, 26 * K), FLY[k])), base: r3(info.waveBase) };
  explode[k + " squeezefx"] = { offset: r3(FLY[k]), base: r3(info.squeezeBase) };
});

// ---------- callouts and the tour ----------
const lid0 = [0, 0, 0];                              // a point on the hinge axis, in the lid frame: it stays put as the lid turns
const hp = (name, p) => ({ p: r3(p), n: name });
const hotspots = [
  ["Hinge", "The lid turns on a barrel", lid0, ["Hinge Barrel", "Lid Shell"]],
  ["Hall sensor", "Wakes the case when the lid moves", [-6, -8.7, 25.6], ["Hall Sensor", "Main PCB"]],
  ["Well insert", "Two wells hold and align the buds", [20, 7.0, 29.6], ["Well Insert"]],
  ["Pogo contacts", "Feed the bud's charging pads", [BX + 1.2, 0.4, 12.0], ["Pogo Pins"]],
  ["Well magnet", "Pulls each stem down into its well", [BX - 3.4, 0.4, 9.0], ["Well Magnet R"]],
  ["Status light", "Under the lid, at the front", [0, -D - 0.05, 28.45], ["Light Pipe", "Body Shell"]],
  ["Charger chip", "Charges the buds and the battery", [10, -8.5, 16], ["Charger Chip", "Main PCB"]],
  ["UWB antenna", "For Precision Finding", [13.5, 9.3, 22], ["UWB Antenna"]],
  ["System button", "On the back: setup and pairing", [0, D + 0.05, 18], ["Button Cap"]],
  ["Case battery", "A flat pouch cell, about 523 mWh", [14, 5, 7.0], ["Case Battery"]],
  ["Wireless coil", "Qi and MagSafe charging", [CC[0] + 13, CC[1], 2.21], ["Qi Coil", "Coil Magnet Ring"]],
  ["USB-C port", "On the bottom", [USB[0], USB[1] - 1.6, 0.3], ["USB-C Port Frame", "USB-C Tongue"]],
  ["Speaker", "Plays the Find My sound", [SPK[0], SPK[1], 6.5], ["Speaker", "Speaker Gasket"]],
  ["Lanyard loop", "A small loop for a strap", [19, 0, 0.1], ["Lanyard Loop"]],
  ["Right earbud", "Stem down in its well", buds.R.skin(100, { s: -3.9 }, 0.12), ["R Outer Grille", "R Back Shell"]],
  ["Left earbud", "The mirror image of the right", buds.L.skin(100, { s: -3.9 }, 0.12), ["L Outer Grille", "L Back Shell"]],
  ["Ear tip", "Soft silicone dome", buds.R.A(6.5, 0, 10.6), ["R Ear Tip"]],
  ["H2 chip", "In the stem of each bud", buds.R.S(0, -1.25, 11.6), ["R H2 Chip", "R Main Flex"]],
  ["Bud battery", "About 50 mAh in each stem", buds.R.S(0, 1.4, 8.2), ["R Battery"]],
].map(([t, s, p, o]) => ({ t, s, p: r3(o[0] === "Hinge Barrel" ? [0, 0, 0] : p), o }));

const P = (name, p) => [...r3(p), name];
const tour = {
  points: {
    case: P("Body Shell", [0, -D - 0.05, 12]), batt: P("Case Battery", [14, 5, 7.0]), coil: P("Qi Coil", [CC[0] + 13, CC[1], 2.21]), hinge: P("Hinge Barrel", [0, 0, 0]),
    hall: P("Hall Sensor", [-6, -8.7, 25.6]), insert: P("Well Insert", [20, 7.0, 29.6]), pogo: P("Pogo Pins", [BX + 1.2, 0.4, 12.0]), magnet: P("Well Magnet R", [BX - 3.4, 0.4, 9.0]),
    led: P("Light Pipe", [0, -D - 0.05, 28.45]), usb: P("USB-C Port Frame", [0, USB[1] - 1.6, 0.3]), spk: P("Speaker", [SPK[0], SPK[1], 6.5]), uwb: P("UWB Antenna", [13.5, 9.3, 22]),
    bud: P("R Back Shell", buds.R.skin(100, { s: -3.9 }, 0.12)), budL: P("L Back Shell", buds.L.skin(100, { s: -3.9 }, 0.12)), tip: P("R Ear Tip", buds.R.A(6.5, 0, 10.6)),
    h2: P("R H2 Chip", buds.R.S(0, -1.25, 11.6)), cont: P("R Charging Contact L", buds.R.S(-1.2, -0.6, -0.07)),
  },
  steps: [
    { t: "A charger in your pocket", focus: "batt", dist: 0.6, ex: 1, p: ["batt", "coil"], n: ["Case Battery", "Battery Flex", "Qi Coil", "Coil Magnet Ring", "Coil Shield"], ms: 4600,
      d: "Each earbud only holds a few hours of charge. The case carries a flat pouch battery of about 523 mWh that charges them again and again before it needs a cable." },
    { t: "The lid and the hall sensor", focus: "hinge", dist: 0.9, ex: 1, p: ["hinge", "hall"], n: ["Lid Shell", "Lid Liner", "Lid Magnet L", "Lid Magnet R", "Hall Target Magnet", "Hinge Barrel", "Hall Sensor"], ms: 4800,
      d: "The lid turns on a hinge barrel at the back. Two magnets hold it shut; a third magnet passes over a hall sensor, so the case knows when it opens and closes." },
    { t: "Wells hold and align the buds", focus: "insert", dist: 0.7, ex: 1, p: ["insert", "magnet"], n: ["Well Insert", "Bud Cradle R", "Bud Cradle L", "Well Gasket R", "Well Gasket L", "Well Magnet R", "Well Magnet L"], ms: 4600,
      d: "Two wells shaped to the stem and the bud's head let each earbud only go in one way. A magnet under each well pulls the stem down and keeps the contacts touching." },
    { t: "Charging: pads and coil", focus: "pogo", dist: 0.55, ex: 1, p: ["pogo", "cont", "coil"], n: ["Pogo Pins", "Pogo Flex", "R Charging Contact L", "R Charging Contact R", "Qi Coil"], ms: 4800,
      d: "Two spring-loaded pins at the bottom of each well touch the gold pads at the foot of the earbud and send it power. The coil lets the case itself charge from a Qi or MagSafe charger." },
    { t: "The light shows the state", focus: "led", dist: 0.5, ex: 1, p: ["led", "hall"], n: ["Status LED", "Light Pipe", "LED Glow", "LED Glow Open", "Main PCB", "Charger Chip"], ms: 4400,
      d: "A small LED on the main board shines through a light pipe at the front. It breathes while the case is closed and charging, and the open lid wakes it." },
    { t: "Speaker and Find My", focus: "spk", dist: 0.6, ex: 1, p: ["spk", "uwb", "usb"], n: ["Speaker", "Speaker Gasket", "UWB Antenna", "USB-C Port Frame", "USB-C Tongue", "USB-C Connector"], ms: 4800,
      d: "A tiny speaker at the bottom plays a sound when you look for the case in the Find My app, and an ultra-wideband antenna lets Precision Finding point to it. The USB-C port charges it by cable." },
    { t: "The earbuds, taken apart", focus: "bud", dist: 0.9, ex: 1, p: ["bud", "budL", "tip", "h2"], n: ["R Ear Tip", "R Back Shell", "R H2 Chip", "R Battery", "L Ear Tip", "L Back Shell", "L H2 Chip", "L Battery"], ms: 5000,
      d: "Each earbud lifts out of its well and comes apart into its own parts: the ear tip, the driver, the electronics, the battery and the contacts, as in the earbud model. The left one is the mirror of the right." },
  ],
};

const constants = {
  H: r3(HG), hingeDeg: 100,
  bud: ["R", "L"].map(k => ({ k, N: r3(buds[k].dir.N), Y: r3(buds[k].dir.Y), Z: r3(buds[k].dir.Z) })),
};
const geometry = geometryScript("APC_GEOMETRY", "airpodscase/build.js", { explode, hotspots, tour, constants, marks: [...buds.R.marks, ...buds.L.marks] });
writeGeometry(HERE, geometry);
console.log(`models/airpodscase/geometry.js: ${geometry.stats}`);
