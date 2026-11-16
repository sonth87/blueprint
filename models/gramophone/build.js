/*
Gramophone (a retro record player with a brass horn): builds its geometry.

An original concept model of a modern retro-style player: a square wooden cabinet (turned corner columns, a moulded
cornice, brass bun feet, two arched speaker grilles and a brass radio panel), a belt-driven turntable with a tonearm,
and a big brass morning-glory horn on a swan neck. In this kind of player the horn is decoration: the sound comes
from two small speakers behind the grilles, and the record's signal is amplified electronically. Layouts of the
inside (motor, belt, speakers, amplifier board, tuning capacitor) are a plausible guess, not a teardown.

Generated in code (with kit/procedural.js) in mm, Z up, X across the front, Y towards the back, the feet at z = 0,
the cabinet centred on the origin. Moving parts, each on its own spool: the platter group (record, label, mat, spindle),
the tonearm about its pivot, the tuning needle, the tuning knob, the tuning-capacitor rotor and the motor pulley.

    node models/gramophone/build.js

Writes models/gramophone/geometry.js.
*/
"use strict";
const { withFrame, part, line, loop, tri, circlePts, rrPts, rrRegion, rect, squareRing, polyRegion, extrude, rrBody, cyl, revolve, loft, sweep, tube,
  r3, geometryScript, writeGeometry } = require("../../kit/procedural");

const HERE = __dirname;
const FR = q => [q[0], q[2], q[1]];   // draws in (x, z), pushes along y
const SD = q => [q[2], q[0], q[1]];   // draws in (y, z), pushes along x
const AX = q => [q[2], q[1], q[0]];   // a cylinder along x: (z, y, x)
const rad = d => d * Math.PI / 180;
const cs = a => [Math.cos(a), Math.sin(a)];
const HP = Math.PI / 2;

// ---------- dimensions (mm) ----------
const HW = 165, WALL = 6, IW = HW - WALL;                       // half width, wall thickness, half inner width
const FOOT_H = 10, PL0 = FOOT_H, PL1 = 40, TOP_WALL = 140, DECK = 160, DECK_BOT = 152;
const COLC = 153.5;                                              // corner column axis
const MID = (PL1 + TOP_WALL) / 2, HH = (TOP_WALL - PL1) / 2;     // wall centre and half height
const FLOOR_TOP = 18, PCB_TOP = 32.6;
const GR = { xc: 108, hw: 29, z0: 86, zs: 100 };                 // grille opening: arched, spring at zs
const PANEL = { hw: 75, hh: 45, cz: 89, y: -169 };
const PANEL_HOLE = [-68, 68, 52, 128];

const PLATTER_Z = 152;                                           // the platter's bottom
const REC_R = 100, MAT_R = 102, PLAT_R = 105, SUB_R = 70;
const PIV = [128, 60];                                           // tonearm pivot (x, y)
const ARM_L = 140;                                               // pivot to stylus
const D_PC = Math.hypot(PIV[0], PIV[1]);
const phiFor = rho => Math.acos((D_PC * D_PC + ARM_L * ARM_L - rho * rho) / (2 * D_PC * ARM_L));
const PHI0 = phiFor(92), PHI1 = phiFor(42);                      // outer and inner groove radius
const PC_ANG = Math.atan2(-PIV[1], -PIV[0]);                     // direction from the pivot to the platter centre
const A0 = PC_ANG + PHI0;                                        // the arm's drawn direction (record start)
const HORN_B = [105, 115];                                       // swan neck foot (x, y)
const MOTOR = [95, -35];                                         // motor pulley axis
const PUL_R = 7, BELT_R1 = SUB_R + 0.5, BELT_R2 = PUL_R + 0.5;
const BELT_Z0 = 144, BELT_Z1 = 148;
const CAP = [50, 110], CAP_Z = 34;                               // tuning capacitor axis and its rotor's base

const offs = {
  feet: [0, 0, -45], shell: [0, 0, 0], board: [0, 0, 130], rotor: { offset: [0, 0, 130], base: [CAP[0], CAP[1], CAP_Z] },
  spkL: [-125, 0, 45], spkR: [125, 0, 45],
  motor: [270, -70, 215], pulley: { offset: [270, -70, 215], base: [MOTOR[0], MOTOR[1], 143] },
  panel: [0, -105, 25], needle: { offset: [0, -105, 25], base: [0, PANEL.y, 88] }, knob: { offset: [0, -105, 25], base: [54, PANEL.y, 98] },
  deck: [0, 0, 270],
  platter: { offset: [0, 0, 370], base: [0, 0, PLATTER_Z] },
  arm: { offset: [0, 0, 440], base: [PIV[0], PIV[1], DECK] },
  horn: [60, 110, 300],
};
const PANEL_OFF = offs.panel;

// ============================================================ FEET
const feet = part("Brass Feet", "feet", "minor");
[[-140, -140], [140, -140], [140, 140], [-140, 140]].forEach(([x, y]) =>
  revolve(feet, x, y, [[0, 0], [8, 0, true], [11, 2.5], [12, 5, true], [10.5, 8], [7.5, FOOT_H, true], [0, FOOT_H]], 28));

// ============================================================ SHELL
const ring = (o, r = 5) => rrRegion(0, 0, o, o, r, 6, [[-IW, IW, -IW, IW]]);
const plinth = part("Plinth", "shell", "major");
extrude(plinth, ring(166), PL0, 22);
extrude(plinth, ring(163.5, 3), 22, 28);
extrude(plinth, ring(165.5), 28, PL1);
withFrame(FR, () => {   // base moulding: a bead and a panelled front on each side, drawn as lines
  [[-1], [1]].forEach(([s]) => line(plinth, [-150, 34, s * 165.55], [150, 34, s * 165.55]));
});
withFrame(SD, () => [-1, 1].forEach(s => line(plinth, [-150, 34, s * 165.55], [150, 34, s * 165.55])));

const floor = part("Floor Board", "shell", "minor");
extrude(floor, rect(-IW, IW, -IW, IW), 14, FLOOR_TOP);
[[-IW + 14, -IW + 14], [IW - 14, -IW + 14], [IW - 14, IW - 14], [-IW + 14, IW - 14]].forEach(([x, y]) => loop(floor, circlePts(x, y, 2.2, 12).map(q => [...q, FLOOR_TOP + 0.05])));

const arch = (xc, side) => {   // one spandrel above the arch (side -1 left of centre, +1 right)
  const pts = [[xc + side * GR.hw, GR.zs + GR.hw], [xc, GR.zs + GR.hw]];
  for (let k = 1; k <= 12; k++) { const a = HP + side * -1 * HP * k / 12; pts.push([xc + GR.hw * Math.cos(a), GR.zs + GR.hw * Math.sin(a)]); }
  return polyRegion(pts);
};
const gHole = xc => [xc - GR.hw, xc + GR.hw, GR.z0, GR.zs + GR.hw];

const front = part("Front Wall", "shell", "major");
withFrame(FR, () => {
  extrude(front, rrRegion(0, MID, IW, HH, 0, 6, [PANEL_HOLE.slice(0, 2).concat([PANEL_HOLE[2], PANEL_HOLE[3]]), gHole(-GR.xc), gHole(GR.xc)]), -HW, -IW);
  [-GR.xc, GR.xc].forEach(xc => [-1, 1].forEach(s => extrude(front, arch(xc, s), -HW, -IW)));
  // panelled moulding between the grilles and the panel
  [[-148, -112, 50, 78], [112, 148, 50, 78]].forEach(([x0, x1, z0, z1]) => loop(front, [[x0, z0, -HW - 0.05], [x1, z0, -HW - 0.05], [x1, z1, -HW - 0.05], [x0, z1, -HW - 0.05]]));
});
const back = part("Back Wall", "shell", "major");
withFrame(FR, () => extrude(back, rrRegion(0, MID, IW, HH, 0), IW, HW));
const sides = part("Side Walls", "shell", "major");
withFrame(SD, () => [[-HW, -IW], [IW, HW]].forEach(([a, b]) => extrude(sides, rrRegion(0, MID, IW, HH, 0), a, b)));

// turned corner columns
const COL = [[0, 40], [9.5, 40, 1], [9.5, 43], [11.5, 44.5, 1], [11.5, 47], [8, 49, 1], [7, 53], [9.5, 58, 1], [10.5, 63], [9.5, 68, 1], [7, 73], [7.5, 76, 1],
  [7.5, 106], [10.5, 108, 1], [10.5, 111], [7.5, 113, 1], [7, 118], [9.5, 123, 1], [10.5, 127], [9.5, 131, 1], [7, 134], [11, 136, 1], [11, 138.5], [9.5, 140, 1], [0, 140]];
const cols = part("Spindle Columns", "shell", "major");
const COLPOS = [[-COLC, -COLC], [COLC, -COLC], [COLC, COLC], [-COLC, COLC]];
COLPOS.forEach(([x, y]) => {
  revolve(cols, x, y, COL.map(([r, z, h]) => [r, z, !!h]), 20);
  for (let i = 0; i < 16; i++) { const a = 2 * Math.PI * i / 16; line(cols, [x + 7.55 * Math.cos(a), y + 7.55 * Math.sin(a), 79], [x + 7.55 * Math.cos(a), y + 7.55 * Math.sin(a), 104]); }
});

// round carved fretwork on both side panels
const fret = part("Side Fretwork", "shell", "minor");
const petal = (p, cx, cy, r0, r1, a, w, z) => {
  const L = [], R = [];
  for (let k = 0; k <= 8; k++) { const s = k / 8, r = r0 + (r1 - r0) * s, d = w * Math.pow(Math.sin(Math.PI * s), 0.8); L.push([cx + r * Math.cos(a - d), cy + r * Math.sin(a - d), z]); R.push([cx + r * Math.cos(a + d), cy + r * Math.sin(a + d), z]); }
  loop(p, L.concat(R.reverse()));
};
const rosette = (p, cx, cy, z) => {
  [38.5, 35, 31].forEach(r => loop(p, circlePts(cx, cy, r, 56).map(q => [...q, z])));
  for (let i = 0; i < 12; i++) petal(p, cx, cy, 7, 29, 2 * Math.PI * i / 12, 0.2, z);
  for (let i = 0; i < 12; i++) petal(p, cx, cy, 3.5, 14, 2 * Math.PI * (i + 0.5) / 12, 0.27, z);
  loop(p, circlePts(cx, cy, 3.5, 14).map(q => [...q, z]));
  for (let i = 0; i < 12; i++) { const a = 2 * Math.PI * (i + 0.5) / 12; loop(p, circlePts(cx + 33 * Math.cos(a), cy + 33 * Math.sin(a), 1.1, 6).map(q => [...q, z])); }
};
withFrame(SD, () => [-1, 1].forEach(s => {
  const x = s * (HW + 0.06);
  rosette(fret, 0, 90, x);
  loop(fret, rrPts(0, 90, 118, 44, 6, 3).map(q => [...q, x]));
  loop(fret, rrPts(0, 90, 122, 48, 8, 3).map(q => [...q, x]));
}));

// back fittings: vents, inlet, line jacks
const bfit = part("Back Fittings", "shell", "minor");
withFrame(FR, () => {
  const y = HW + 0.06;
  extrude(bfit, rect(-62, 62, 52, 96), HW, HW + 2);
  [-48, 48].forEach(x => [60, 88].forEach(z => loop(bfit, circlePts(x, z, 1.6, 10).map(q => [...q, HW + 2.05]))));
  loop(bfit, rrPts(-30, 74, 14, 9, 1.5, 2).map(q => [...q, HW + 2.05]));   // mains inlet
  [-5, 0, 5].forEach(dx => line(bfit, [-30 + dx * 2, 70, HW + 2.05], [-30 + dx * 2, 78, HW + 2.05]));
  [10, 28, 46].forEach(x => { cyl(bfit, x, 80, 3.6, HW + 2, HW + 8, 14); cyl(bfit, x, 66, 3.6, HW + 2, HW + 8, 14); });
  [[-130, -110], [110, 130]].forEach(([a, b]) => { for (let i = 0; i < 6; i++) loop(bfit, [[a, 60 + i * 10, y], [b, 60 + i * 10, y], [b, 64 + i * 10, y], [a, 64 + i * 10, y]]); });
});

// the red power LED on the right side, near the front
const led = part("Power LED", "shell", "minor");
withFrame(SD, () => { cyl(led, -125, 62, 4.2, HW, HW + 1.2, 18); cyl(led, -125, 62, 2.6, HW + 1.2, HW + 3, 16); });

// ============================================================ DECK
const dk = part("Cornice", "deck", "major");
const cring = (o, r = 5) => rrRegion(0, 0, o, o, r, 6, [[-IW, IW, -IW, IW]]);
extrude(dk, cring(166.5), TOP_WALL, 145);
extrude(dk, cring(170.5), 145, 149);
extrude(dk, cring(168), 149, 153);
extrude(dk, cring(166.5), 153, DECK);
withFrame(FR, () => [-1, 1].forEach(s => { for (let x = -150; x <= 150; x += 7.5) line(dk, [x, 146, s * 170.55], [x, 148.2, s * 170.55]); }));
withFrame(SD, () => [-1, 1].forEach(s => { for (let y = -150; y <= 150; y += 7.5) line(dk, [y, 146, s * 170.55], [y, 148.2, s * 170.55]); }));

const deck = part("Deck Top", "deck", "major");
extrude(deck, squareRing(0, 0, IW, 106, 64), DECK_BOT, DECK);
loop(deck, circlePts(0, 0, 108.5, 72).map(q => [...q, DECK + 0.05]));
[[-140, -140], [140, -140], [-140, 140], [140, 140]].forEach(([x, y]) => { loop(deck, circlePts(x, y, 2.4, 14).map(q => [...q, DECK + 0.05])); line(deck, [x - 1.5, y - 1, DECK + 0.05], [x + 1.5, y + 1, DECK + 0.05]); });
loop(deck, circlePts(HORN_B[0], HORN_B[1], 29, 40).map(q => [...q, DECK + 0.05]));   // the horn's seat
loop(deck, circlePts(HORN_B[0], HORN_B[1], 27, 40).map(q => [...q, DECK + 0.05]));
// speed switch: a slot with a slider, 33 / 45
loop(deck, rrPts(-128, -135, 14, 4, 2, 3).map(q => [...q, DECK + 0.05]));
const sw = part("Speed Switch", "deck", "minor");
extrude(sw, rrRegion(-134, -135, 5, 3, 1, 3), DECK, DECK + 3);
[-136, -126, -114].forEach(x => line(sw, [x, -127, DECK + 0.05], [x, -125, DECK + 0.05]));

// tonearm pivot housing and arm rest
const pbase = part("Pivot Base", "deck", "major");
revolve(pbase, PIV[0], PIV[1], [[0, DECK], [24, DECK, true], [24, DECK + 3], [21, DECK + 5, true], [21, DECK + 9], [16, DECK + 11, true], [0, DECK + 12]], 36);
for (let i = 0; i < 24; i++) { const a = 2 * Math.PI * i / 24; line(pbase, [PIV[0] + 21.05 * Math.cos(a), PIV[1] + 21.05 * Math.sin(a), DECK + 5.6], [PIV[0] + 21.05 * Math.cos(a), PIV[1] + 21.05 * Math.sin(a), DECK + 8.6]); }
const REST = [PIV[0] + ARM_L * Math.cos(PC_ANG + rad(60)), PIV[1] + ARM_L * Math.sin(PC_ANG + rad(60))];
const rest = part("Arm Rest", "deck", "minor");
cyl(rest, REST[0], REST[1], 5, DECK, DECK + 3, 18);
cyl(rest, REST[0], REST[1], 2.2, DECK + 3, DECK + 22, 12);
extrude(rest, rrRegion(REST[0], REST[1], 5, 2.2, 1, 3), DECK + 22, DECK + 25);

// ============================================================ PLATTER (about its axis, z = 0 at the platter's bottom)
const plat = part("Platter", "platter", "major", { spool: "platter" });
revolve(plat, 0, 0, [[0, 0], [103, 0, true], [105, 1.5, true], [105, 7, true], [103.5, 8, true], [0, 8]], 72);
for (let i = 0; i < 90; i++) { const a = 2 * Math.PI * i / 90; line(plat, [105.05 * Math.cos(a), 105.05 * Math.sin(a), 2.6], [105.05 * Math.cos(a), 105.05 * Math.sin(a), 6.4]); }   // strobe marks
const sub = part("Sub-platter", "platter", "minor", { spool: "platter" });
cyl(sub, 0, 0, SUB_R, -12, 0, 56, { top: false });
[-8, -4].forEach(z => loop(sub, circlePts(0, 0, SUB_R + 0.05, 56).map(q => [...q, z])));
for (let i = 0; i < 6; i++) { const a = 2 * Math.PI * i / 6 + 0.3; loop(sub, circlePts(40 * Math.cos(a), 40 * Math.sin(a), 11, 16).map(q => [...q, -12.05])); }
const mat = part("Rubber Mat", "platter", "minor", { spool: "platter" });
revolve(mat, 0, 0, [[0, 8], [MAT_R, 8, true], [MAT_R, 9.6, true], [0, 9.6]], 72);
for (let r = 12; r <= MAT_R - 3; r += 18) loop(mat, circlePts(0, 0, r, 48).map(q => [...q, 9.65]));
const rec = part("Record", "platter", "major", { spool: "platter" });
revolve(rec, 0, 0, [[0, 9.6], [REC_R, 9.6, true], [REC_R, 11.4, true], [0, 11.4]], 72);
const TRACKS = [[96, 90], [88, 79], [77, 67], [65, 53], [51, 41]];   // bands of grooves with a gap (a lead-out) between them
TRACKS.forEach(([a, b]) => { for (let r = a; r >= b; r -= 1.6) loop(rec, circlePts(0, 0, r, 72).map(q => [...q, 11.45])); });
loop(rec, circlePts(0, 0, 99, 72).map(q => [...q, 11.45]));
loop(rec, circlePts(0, 0, 36, 56).map(q => [...q, 11.45]));
const lab = part("Record Label", "platter", "minor", { spool: "platter" });
cyl(lab, 0, 0, 31, 11.4, 11.9, 48);
loop(lab, circlePts(0, 0, 29.5, 48).map(q => [...q, 11.95]));
[[24, 0.3, 2.3], [20.5, 0.9, 2.5], [17, 0.2, 2.1]].forEach(([r, a0, span]) => {   // printed lines on the label
  const pts = []; for (let k = 0; k <= 16; k++) pts.push([r * Math.cos(a0 + span * k / 16), r * Math.sin(a0 + span * k / 16), 11.95]);
  for (let k = 0; k < 16; k++) line(lab, pts[k], pts[k + 1]);
});
loop(lab, [[-7, 24, 11.95], [-2, 24, 11.95], [-2, 27.5, 11.95], [-7, 27.5, 11.95]]);
loop(lab, circlePts(0, 0, 5.5, 24).map(q => [...q, 11.95]));
const spindle = part("Spindle", "platter", "minor", { spool: "platter" });
revolve(spindle, 0, 0, [[0, -31], [3.5, -31, true], [3.5, 11.9], [3, 17, true], [1.6, 20.5], [0, 21.2]], 20);

// ============================================================ TONEARM (about the pivot axis; drawn pointing along A0, z = 0 at the deck top)
const ROT = q => [q[0] * Math.cos(A0) - q[1] * Math.sin(A0), q[0] * Math.sin(A0) + q[1] * Math.cos(A0), q[2]];
const armPt = (x, y, z) => r3(ROT([x, y, z]));   // a point given along the arm, in the part's drawn coordinates
const yoke = part("Arm Yoke", "arm", "minor", { spool: "arm" });
const tarm = part("Tonearm Tube", "arm", "major", { spool: "arm" });
const cw = part("Counterweight", "arm", "minor", { spool: "arm" });
const hs = part("Headshell", "arm", "minor", { spool: "arm" });
const cart = part("Cartridge", "arm", "minor", { spool: "arm" });
const stylus = part("Stylus", "arm", "minor", { spool: "arm" });
withFrame(ROT, () => {
  revolve(yoke, 0, 0, [[0, 12], [11, 12, true], [11, 20], [9, 22, true], [9, 26], [0, 26]], 24);
  cyl(yoke, 0, 0, 5, 12, 12.4, 16);
  tube(tarm, [[-12, 0, 24], [0, 0, 24], [30, 0, 25], [70, 0, 25], [100, 0, 22], [114, 0, 16], [121, 0, 13.4]], 2.3, 12);
  withFrame(AX, () => {
    cyl(cw, 24, 0, 12, -36, -14, 28);
    cyl(cw, 24, 0, 8, -14, -12, 24);
    for (let i = 0; i < 20; i++) { const a = 2 * Math.PI * i / 20; line(cw, [24 + 12.03 * Math.cos(a), 12.03 * Math.sin(a), -34], [24 + 12.03 * Math.cos(a), 12.03 * Math.sin(a), -16]); }
  });
  extrude(hs, polyRegion([[118, -3.5], [134, -5.2], [147, -5.2], [147, 5.2], [134, 5.2], [118, 3.5]]), 12.4, 14.4);
  line(hs, [140, 5.2, 13.4], [152, 14, 13.4]); line(hs, [152, 14, 13.4], [153, 16, 13.4]);   // the finger lift
  loop(hs, circlePts(125, 0, 1.2, 8).map(q => [...q, 14.45]));
  rrBody(cart, 140, 0, 8, 4.8, 1, [[0, 6.4, true], [0, 12.4, true]], { seg: 3 });
  loop(cart, rrPts(140, 0, 6, 3, 0.6, 2).map(q => [...q, 6.35]));
  revolve(stylus, 140, 0, [[1.2, 6.4], [0.9, 4.8, true], [0.35, 3.7], [0, 3.5]], 10);
});

// ============================================================ HORN: a lobed bell revolved from a profile, a swan neck swept along a bent path
const HU = 60, H_ZT = 378, ELEV = rad(35), HDIR = [-0.8, -0.6];
const TP = [HORN_B[0] + HU * HDIR[0], HORN_B[1] + HU * HDIR[1], H_ZT];
const dvec = [HDIR[0] * Math.cos(ELEV), HDIR[1] * Math.cos(ELEV), Math.sin(ELEV)];
const e1 = [-HDIR[1], HDIR[0], 0];
const e2 = [dvec[1] * e1[2] - dvec[2] * e1[1], dvec[2] * e1[0] - dvec[0] * e1[2], dvec[0] * e1[1] - dvec[1] * e1[0]];
const HF = q => [TP[0] + q[0] * e1[0] + q[1] * e2[0] + q[2] * dvec[0], TP[1] + q[0] * e1[1] + q[1] * e2[1] + q[2] * dvec[1], TP[2] + q[0] * e1[2] + q[1] * e2[2] + q[2] * dvec[2]];
const BL = 300, R0 = 19, RR = 200, LOBES = 7;
const Rb = u => R0 + (RR - R0) * (Math.exp(3.0 * u) - 1) / (Math.exp(3.0) - 1);
const dep = u => 0.12 * Math.pow(u, 2.5);
const lobe = (th, u) => 1 - dep(u) * (1 - Math.pow(Math.abs(Math.cos(LOBES * th / 2)), 0.6));
const bellR = (th, u) => Rb(u) * lobe(th, u);
const bp = (th, u, off = 0) => { const r = bellR(th, u) + off; return [r * Math.cos(th), r * Math.sin(th), BL * u]; };

const bell = part("Horn Bell", "horn", "major");
const NB = 84, NU = 44;
withFrame(HF, () => {
  const rings = [];
  for (let i = 0; i <= NU; i++) { const u = i / NU; rings.push({ hard: i === 0 || i === NU, pts: Array.from({ length: NB }, (_, k) => bp(2 * Math.PI * k / NB, u)) }); }
  rings.push({ hard: true, pts: Array.from({ length: NB }, (_, k) => { const th = 2 * Math.PI * k / NB; return bp(th, 1, -3.2).map((c, j) => j === 2 ? BL - 3 : c); }) });
  loft(bell, rings);
});
const relief = part("Horn Relief", "horn", "minor");
const leaf = (p, thc, u0, u1, off, tilt, w) => {
  const A = [], B = [];
  for (let k = 0; k <= 10; k++) { const s = k / 10, u = u0 + (u1 - u0) * s, d = w * Math.pow(Math.sin(Math.PI * s), 0.85); A.push(bp(thc + off + tilt * s - d, u, -0.9)); B.push(bp(thc + off + tilt * s + d, u, -0.9)); }
  loop(p, A.concat(B.reverse()));
};
const poly = (p, pts) => { for (let k = 0; k + 1 < pts.length; k++) line(p, pts[k], pts[k + 1]); };
withFrame(HF, () => {
  for (let i = 0; i < LOBES; i++) {
    const thc = 2 * Math.PI * i / LOBES, thn = thc + Math.PI / LOBES;
    poly(relief, Array.from({ length: 26 }, (_, k) => bp(thc, 0.2 + 0.77 * k / 25, -0.9)));                          // stem rib
    poly(relief, Array.from({ length: 26 }, (_, k) => bp(thn, 0.3 + 0.7 * k / 25, -0.9)));                           // groove between lobes
    leaf(relief, thc, 0.66, 0.95, 0, 0, 0.14);                                                                       // flower: centre petal
    leaf(relief, thc, 0.68, 0.9, -0.13, -0.08, 0.075); leaf(relief, thc, 0.68, 0.9, 0.13, 0.08, 0.075);               // side petals
    leaf(relief, thc, 0.46, 0.62, -0.09, -0.07, 0.05); leaf(relief, thc, 0.46, 0.62, 0.09, 0.07, 0.05);               // leaves on the stem
    leaf(relief, thc, 0.3, 0.42, -0.06, -0.05, 0.035); leaf(relief, thc, 0.3, 0.42, 0.06, 0.05, 0.035);
    poly(relief, Array.from({ length: 12 }, (_, k) => bp(thc - 0.4 * lobe(thc, 0.98) * 0 + (-0.5 + k / 11) * 0.7, 0.975, -0.9)));   // beading just behind the rim
  }
});
const studs = part("Rim Studs", "horn", "minor");
withFrame(HF, () => {
  for (let i = 0; i < LOBES; i++) {
    const th = 2 * Math.PI * (i + 0.5) / LOBES, u = 0.945, P = bp(th, u, -0.6), C = [Math.cos(th), Math.sin(th), 0];
    const t1 = [-Math.sin(th), Math.cos(th), 0], t2 = [0, 0, 1], apex = [P[0] - C[0] * 2, P[1] - C[1] * 2, P[2]];
    const ringp = r => Array.from({ length: 10 }, (_, k) => { const a = 2 * Math.PI * k / 10; return [0, 1, 2].map(j => P[j] + r * (Math.cos(a) * t1[j] + Math.sin(a) * t2[j])); });
    const R = ringp(4);
    R.forEach((q, k) => tri(studs, apex, R[(k + 1) % 10], q));
    loop(studs, R); loop(studs, ringp(2.4).map(q => q.map((c, j) => c - C[j] * 1.5)));
  }
});
const ferrule = part("Throat Ferrule", "horn", "minor");
withFrame(HF, () => revolve(ferrule, 0, 0, [[18.4, -9], [21.5, -9, true], [21.5, -4], [23.8, -2, true], [23.8, 2], [21.5, 4, true], [21.5, 9, true], [19.2, 9]], 32));

// swan neck: up from the deck, then a smooth bend towards the bell
const NECK_R = 15, NECK_Z0 = DECK + 14, NECK_UP = 263, RC = 140;
const neckPath = [];
for (let z = NECK_Z0; z < NECK_UP; z += 18) neckPath.push([0, z]);
for (let k = 0; k <= 11; k++) { const f = rad(55) * k / 11; neckPath.push([RC * (1 - Math.cos(f)), NECK_UP + RC * Math.sin(f)]); }
const nk = ([u, z]) => [HORN_B[0] + u * HDIR[0], HORN_B[1] + u * HDIR[1], z];
const neck = part("Swan Neck", "horn", "major");
tube(neck, neckPath.map(nk), NECK_R, 18);
const collar = part("Neck Collar", "horn", "minor");
revolve(collar, HORN_B[0], HORN_B[1], [[27, DECK], [27, DECK + 3, true], [22, DECK + 6, true], [22, DECK + 10], [19.5, DECK + 12, true], [19.5, DECK + 14], [16.5, DECK + 15]], 36);
revolve(collar, HORN_B[0], HORN_B[1], [[16.2, 226], [19.5, 226, true], [19.5, 231], [17.5, 233, true], [19.5, 235, true], [19.5, 240, true], [16.2, 240]], 28);
[[HORN_B[0] + 21, HORN_B[1]], [HORN_B[0] - 21, HORN_B[1]]].forEach(([x, y]) => loop(collar, circlePts(x, y, 1.5, 8).map(q => [...q, DECK + 3.05])));

// ============================================================ PANEL
const px = PANEL.y;
const plate = part("Panel Plate", "panel", "major");
withFrame(FR, () => rrBody(plate, 0, PANEL.cz, PANEL.hw, PANEL.hh, 10, [[0, -165, true], [0, -167.5, true], [1.5, px, true]], { seg: 6 }));
const chassis = part("Panel Chassis", "panel", "minor");
withFrame(FR, () => {
  rrBody(chassis, 0, 90, 62, 36, 2, [[0, -165, true], [0, -148, true]], { seg: 3 });
  [-50, 50].forEach(x => [66, 114].forEach(z => cyl(chassis, x, z, 3, -165, -157, 12)));
});
const trim = part("Panel Trim", "panel", "minor");
withFrame(FR, () => {
  const y = px - 0.06;
  loop(trim, rrPts(0, PANEL.cz, PANEL.hw - 3.5, PANEL.hh - 3.5, 7, 6).map(q => [q[0], q[1], y]));
  loop(trim, rrPts(0, PANEL.cz, PANEL.hw - 6, PANEL.hh - 6, 5, 6).map(q => [q[0], q[1], y]));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {   // corner scrolls: a spiral and a rivet
    const cx = sx * (PANEL.hw - 12), cz = PANEL.cz + sz * (PANEL.hh - 12), pts = [];
    for (let k = 0; k <= 24; k++) { const a = k / 24 * 3.2 * Math.PI, r = 5.5 * (1 - k / 28); pts.push([cx + sx * r * Math.cos(a), cz + sz * r * Math.sin(a), y]); }
    poly(trim, pts);
  });
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => loop(trim, circlePts(sx * (PANEL.hw - 5), PANEL.cz + sz * (PANEL.hh - 5), 1.3, 8).map(q => [...q, y]))));
  // a small crest over the window
  poly(trim, Array.from({ length: 17 }, (_, k) => { const a = k / 16 * Math.PI; return [-14 * Math.cos(a), 127 + 5 * Math.sin(a), y]; }));
});
const win = part("Dial Window", "panel", "minor");
withFrame(FR, () => {
  const y = px - 0.06, cz = 100, ax = 35, az = 22, zb = 86;
  const outline = [[-ax, zb, y], [ax, zb, y]];
  for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI; outline.push([ax * Math.cos(a), cz + az * Math.sin(a), y]); }
  loop(win, outline);
  loop(win, outline.map(q => [q[0] * 0.94, q[0] === q[0] && q[1] >= cz ? cz + (q[1] - cz) * 0.91 : q[1] + (q[1] === zb ? 2 : 0), y]));
  const PV = [0, 88];
  [30, 24].forEach(r => poly(win, Array.from({ length: 31 }, (_, k) => { const a = rad(40 + 100 * k / 30); return [PV[0] + r * Math.cos(a), PV[1] + r * Math.sin(a), y]; })));
  for (let k = 0; k <= 25; k++) { const a = rad(40 + 4 * k), major = k % 5 === 0, r0 = 30, r1 = major ? 24 : 27; line(win, [PV[0] + r0 * Math.cos(a), PV[1] + r0 * Math.sin(a), y], [PV[0] + r1 * Math.cos(a), PV[1] + r1 * Math.sin(a), y]); }
  for (let k = 0; k < 9; k++) { const a = rad(46 + 11 * k); line(win, [PV[0] + 21 * Math.cos(a), PV[1] + 21 * Math.sin(a), y], [PV[0] + 24 * Math.cos(a), PV[1] + 24 * Math.sin(a), y]); }
  loop(win, circlePts(PV[0], PV[1], 3, 12).map(q => [...q, y]));
  line(win, [-30, 91, y], [-26, 95, y]); line(win, [26, 95, y], [30, 91, y]);   // glass glint
});
const disp = part("Display Window", "panel", "minor");
withFrame(FR, () => {
  const y = px - 0.06;
  loop(disp, rrPts(-13, 76, 21, 6.5, 1.5, 2).map(q => [q[0], q[1], y]));
  const seg = (cx, cz, on) => {   // a 7-segment digit
    const S = { a: [[-2, 2.8], [2, 2.8]], b: [[2.2, 0.2], [2.2, 2.6]], c: [[2.2, -2.6], [2.2, -0.2]], d: [[-2, -2.8], [2, -2.8]], e: [[-2.2, -2.6], [-2.2, -0.2]], f: [[-2.2, 0.2], [-2.2, 2.6]], g: [[-2, 0], [2, 0]] };
    on.split("").forEach(k => line(disp, [cx + S[k][0][0], cz + S[k][0][1], y], [cx + S[k][1][0], cz + S[k][1][1], y]));
  };
  seg(-26, 76, "bc"); seg(-19, 76, "abdeg"); seg(-9, 76, "abcdg"); seg(-2, 76, "abcdefg");
  loop(disp, circlePts(-13.8, 73.2, 0.5, 5).map(q => [...q, y]));
});
const btns = part("Panel Buttons", "panel", "minor");
withFrame(FR, () => { for (let i = 0; i < 7; i++) { const x = -33 + i * 11; cyl(btns, x, 62, 3.2, px, px - 1.8, 16); loop(btns, circlePts(x, 62, 4.1, 16).map(q => [...q, px - 0.06])); } });
const slot = part("Media Slot", "panel", "minor");
withFrame(FR, () => {
  const y = px - 0.06;
  loop(slot, rrPts(0, 52, 52, 3.4, 1.2, 2).map(q => [q[0], q[1], y]));
  loop(slot, rrPts(0, 52, 47, 1.1, 0.5, 2).map(q => [q[0], q[1], y]));
  [-56, 56].forEach(x => loop(slot, circlePts(x, 52, 1.3, 8).map(q => [...q, y])));
});
const vol = part("Volume Knob", "panel", "minor");
withFrame(FR, () => {
  const kx = -54, kz = 98;
  cyl(vol, kx, kz, 10.5, px, px - 1.6, 28);
  cyl(vol, kx, kz, 8.6, px - 1.6, px - 8, 28);
  for (let i = 0; i < 28; i++) { const a = 2 * Math.PI * i / 28; line(vol, [kx + 8.62 * Math.cos(a), kz + 8.62 * Math.sin(a), px - 2.4], [kx + 8.62 * Math.cos(a), kz + 8.62 * Math.sin(a), px - 7.4]); }
  line(vol, [kx, kz, px - 8.06], [kx + 5.7, kz + 5.7, px - 8.06]);
  for (let i = 0; i < 9; i++) { const a = rad(225 - 33.75 * i); line(vol, [kx + 12 * Math.cos(a), kz + 12 * Math.sin(a), px - 0.06], [kx + 14 * Math.cos(a), kz + 14 * Math.sin(a), px - 0.06]); }
});
const tkn = part("Tuning Knob", "knob", "minor", { spool: "knob" });
withFrame(FR, () => {
  cyl(tkn, 0, 0, 10.5, 0, -1.6, 28);
  cyl(tkn, 0, 0, 8.6, -1.6, -8, 28);
  for (let i = 0; i < 28; i++) { const a = 2 * Math.PI * i / 28; line(tkn, [8.62 * Math.cos(a), 8.62 * Math.sin(a), -2.4], [8.62 * Math.cos(a), 8.62 * Math.sin(a), -7.4]); }
  line(tkn, [0, 0, -8.06], [0, 6.2, -8.06]);
});
const needle = part("Dial Needle", "needle", "major", { spool: "needle" });
withFrame(FR, () => {
  extrude(needle, polyRegion([[-0.7, -3], [0.7, -3], [0.25, 29], [-0.25, 29]]), -0.7, 0);
  cyl(needle, 0, 0, 2.3, -1.3, 0, 14);
});

// ============================================================ SPEAKERS (axis along y, behind the grilles)
const gridClip = (p, xc, y) => {   // cloth weave inside the arched opening
  const top = x => GR.zs + Math.sqrt(Math.max(0, GR.hw * GR.hw - (x - xc) * (x - xc)));
  for (let x = xc - GR.hw + 2; x < xc + GR.hw; x += 3) line(p, [x, GR.z0 + 0.5, y], [x, Math.min(top(x) - 0.5, GR.zs + GR.hw), y]);
  for (let z = GR.z0 + 2; z < GR.zs + GR.hw; z += 3) {
    const half = z <= GR.zs ? GR.hw : Math.sqrt(Math.max(0, GR.hw * GR.hw - (z - GR.zs) * (z - GR.zs)));
    if (half > 1) line(p, [xc - half + 0.5, z, y], [xc + half - 0.5, z, y]);
  }
};
[["L", -GR.xc], ["R", GR.xc]].forEach(([nm, xc]) => {
  const mod = nm === "L" ? "spkL" : "spkR";
  const d = part("Speaker " + nm, mod, "major");
  const zc = 106;
  withFrame(FR, () => {
    revolve(d, xc, zc, [[0, -138], [3.5, -137.4], [6.5, -134.5, true], [18, -147.5, true], [19.5, -149.5, true], [21, -148], [24, -148, true], [24, -151, true], [22, -151.5, true]], 40);
    revolve(d, xc, zc, [[0, -126], [14, -126, true], [14, -134], [6.5, -134.5]], 28);
    for (let i = 0; i < 4; i++) { const a = rad(45 + 90 * i); loop(d, circlePts(xc + 22.5 * Math.cos(a), zc + 22.5 * Math.sin(a), 1.2, 8).map(q => [...q, -151.55])); line(d, [xc + 14 * Math.cos(a), zc + 14 * Math.sin(a), -134], [xc + 24 * Math.cos(a), zc + 24 * Math.sin(a), -148]); }
  });
  const c = part("Grille Cloth " + nm, mod, "minor");
  withFrame(FR, () => gridClip(c, xc, -IW - 0.4));
});

// ============================================================ MOTOR AND BELT
const mplate = part("Motor Plate", "motor", "major");
extrude(mplate, rrRegion(15, -20, 115, 55, 4, 5), 118, 121);
[[-92, -68], [122, -68], [-92, 28], [122, 28]].forEach(([x, y]) => { cyl(mplate, x, y, 3.5, 121, DECK_BOT, 12); loop(mplate, circlePts(x, y, 1.6, 8).map(q => [...q, 118 - 0.05])); });
revolve(mplate, 0, 0, [[0, 121], [11, 121, true], [11, 136], [9, 138, true], [9, 140], [0, 140]], 28);   // the platter's bearing housing
const mbody = part("Motor Body", "motor", "major");
revolve(mbody, MOTOR[0], MOTOR[1], [[0, 121], [20, 121, true], [20, 140, true], [17, 142, true], [0, 142]], 36);
for (let i = 0; i < 12; i++) { const a = 2 * Math.PI * i / 12; line(mbody, [MOTOR[0] + 20.05 * Math.cos(a), MOTOR[1] + 20.05 * Math.sin(a), 124], [MOTOR[0] + 20.05 * Math.cos(a), MOTOR[1] + 20.05 * Math.sin(a), 138]); }
loop(mbody, circlePts(MOTOR[0], MOTOR[1], 12, 24).map(q => [...q, 142.05]));
[0, 120, 240].forEach(a => loop(mbody, circlePts(MOTOR[0] + 15 * Math.cos(rad(a + 30)), MOTOR[1] + 15 * Math.sin(rad(a + 30)), 1.3, 8).map(q => [...q, 142.05])));
const pul = part("Motor Pulley", "pulley", "minor", { spool: "pulley" });
revolve(pul, 0, 0, [[0, -1], [2.5, -1, true], [2.5, 0], [PUL_R, 0, true], [PUL_R, 1.2], [5.5, 1.8, true], [5.5, 3.2, true], [PUL_R + 0.8, 3.8], [PUL_R + 0.8, 5.2, true], [5.2, 6], [0, 6]], 24);
line(pul, [0, 0, 6.05], [5, 0, 6.05]);   // a mark, so the turning shows

// the belt: round the sub-platter (R1) and the pulley (R2), external tangents
const DM = Math.hypot(MOTOR[0], MOTOR[1]), TM = Math.atan2(MOTOR[1], MOTOR[0]), AL = Math.acos((BELT_R1 - BELT_R2) / DM);
const bpath = [];   // {p: [x, y], n: outward normal}
const arc = (c, r, a0, a1, n) => { for (let k = 0; k < n; k++) { const a = a0 + (a1 - a0) * k / n; bpath.push({ p: [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)], n: [Math.cos(a), Math.sin(a)] }); } };
const straight = (a, b, n, nrm) => { for (let k = 0; k < n; k++) bpath.push({ p: [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n], n: nrm }); };
const T1m = [BELT_R1 * Math.cos(TM - AL), BELT_R1 * Math.sin(TM - AL)], T2m = [MOTOR[0] + BELT_R2 * Math.cos(TM - AL), MOTOR[1] + BELT_R2 * Math.sin(TM - AL)];
const T1p = [BELT_R1 * Math.cos(TM + AL), BELT_R1 * Math.sin(TM + AL)], T2p = [MOTOR[0] + BELT_R2 * Math.cos(TM + AL), MOTOR[1] + BELT_R2 * Math.sin(TM + AL)];
arc([0, 0], BELT_R1, TM + AL, TM - AL + 2 * Math.PI, 72);
straight(T1m, T2m, 14, [Math.cos(TM - AL), Math.sin(TM - AL)]);
arc(MOTOR, BELT_R2, TM - AL, TM + AL, 12);
straight(T2p, T1p, 14, [Math.cos(TM + AL), Math.sin(TM + AL)]);
let BELT_LEN = 0;
for (let i = 0; i < bpath.length; i++) { const a = bpath[i].p, b = bpath[(i + 1) % bpath.length].p; BELT_LEN += Math.hypot(b[0] - a[0], b[1] - a[1]); }
const belt = part("Drive Belt", "motor", "minor");
sweep(belt, bpath.concat([bpath[0]]).map(q => [q.p[0], q.p[1], BELT_Z0]), [[-0.5, 0], [0.5, 0], [0.5, BELT_Z1 - BELT_Z0], [-0.5, BELT_Z1 - BELT_Z0]]);
const NPULSE = 6, perGroup = Math.floor(bpath.length / NPULSE);
const pulses = [];
for (let g = 0; g < NPULSE; g++) {
  const pp = part("Belt Pulse " + (g + 1), "motor", "minor");
  pulses.push(pp);
  for (let i = g * perGroup; i < (g + 1) * perGroup; i += 2) {
    const s = bpath[i];
    line(pp, [s.p[0] + s.n[0] * 0.56, s.p[1] + s.n[1] * 0.56, BELT_Z0 + 0.6], [s.p[0] + s.n[0] * 0.56, s.p[1] + s.n[1] * 0.56, BELT_Z1 - 0.6]);
  }
}

// ============================================================ AMPLIFIER / RADIO BOARD
const pcb = part("Amp Board", "board", "major");
rrBody(pcb, 0, 116, 130, 36, 3, [[0, PCB_TOP - 1.6, true], [0, PCB_TOP, true]], { seg: 3 });
[[-122, 88], [122, 88], [-122, 144], [122, 144]].forEach(([x, y]) => { cyl(pcb, x, y, 3.5, FLOOR_TOP, PCB_TOP - 1.6, 12); loop(pcb, circlePts(x, y, 1.6, 8).map(q => [...q, PCB_TOP + 0.05])); });
const Z = PCB_TOP + 0.05;
[[[-100, 150], [-30, 150], [-30, 80]], [[-20, 100], [20, 100], [20, 124], [26, 124]], [[75, 100], [90, 100], [90, 124]], [[-20, 135], [-20, 146], [60, 146], [60, 134]], [[100, 100], [124, 100], [124, 140]], [[-10, 86], [70, 86], [70, 94]], [[-60, 86], [-30, 86]]]
  .forEach(pts => { for (let k = 0; k + 1 < pts.length; k++) line(pcb, [...pts[k], Z], [...pts[k + 1], Z]); });
const tr = part("Transformer", "board", "major");
rrBody(tr, -85, 118, 25, 20, 1, [[0, PCB_TOP, true], [0, PCB_TOP + 33, true]], { seg: 2 });
rrBody(tr, -85, 118, 15, 28, 1, [[0, PCB_TOP + 4, true], [0, PCB_TOP + 29, true]], { seg: 2 });
for (let z = PCB_TOP + 2.5; z < PCB_TOP + 33; z += 2.5) { line(tr, [-110, 98, z], [-60, 98, z]); line(tr, [-110, 138, z], [-60, 138, z]); }
for (let y = 94; y < 142; y += 2.6) line(tr, [-100, y, PCB_TOP + 33.05], [-70, y, PCB_TOP + 33.05]);
const ecap = part("Filter Capacitors", "board", "minor");
[-38, -20, -2].forEach(x => { cyl(ecap, x, 134, 7, PCB_TOP, PCB_TOP + 24, 24); line(ecap, [x - 7, 134, PCB_TOP + 24.05], [x + 7, 134, PCB_TOP + 24.05]); line(ecap, [x, 127, PCB_TOP + 24.05], [x, 141, PCB_TOP + 24.05]); loop(ecap, circlePts(x, 134, 4.5, 16).map(q => [...q, PCB_TOP + 24.05])); });
const ics = part("Amp ICs and Heatsink", "board", "minor");
[-30, 0].forEach(x => { rrBody(ics, x, 100, 9, 3.6, 0.5, [[0, PCB_TOP, true], [0, PCB_TOP + 3.6, true]], { seg: 2 }); for (let i = 0; i < 7; i++) { const px2 = x - 7.5 + i * 2.5; line(ics, [px2, 96.4, PCB_TOP], [px2, 95, PCB_TOP]); line(ics, [px2, 103.6, PCB_TOP], [px2, 105, PCB_TOP]); } loop(ics, circlePts(x - 6, 100, 0.8, 6).map(q => [...q, PCB_TOP + 3.65])); });
rrBody(ics, 95, 130, 14, 10, 0.5, [[0, PCB_TOP, true], [0, PCB_TOP + 2, true]], { seg: 2 });
for (let i = 0; i < 8; i++) extrude(ics, rect(82 + i * 3.7, 82 + i * 3.7 + 1.3, 121, 139), PCB_TOP + 2, PCB_TOP + 22);
const conn = part("Board Connectors", "board", "minor");
rrBody(conn, -100, 150, 12, 4, 0.5, [[0, PCB_TOP, true], [0, PCB_TOP + 8, true]], { seg: 2 });
for (let i = 0; i < 6; i++) line(conn, [-109 + i * 3.6, 146, PCB_TOP + 8.05], [-109 + i * 3.6, 154, PCB_TOP + 8.05]);
rrBody(conn, 120, 112, 5, 13, 0.5, [[0, PCB_TOP, true], [0, PCB_TOP + 8, true]], { seg: 2 });
// tuning capacitor: stator and frame (the rotor is its own spool)
const tcap = part("Tuning Capacitor", "board", "major");
extrude(tcap, rrRegion(CAP[0], CAP[1], 19, 17, 1.5, 3), 33, 35.5);
extrude(tcap, rrRegion(CAP[0], CAP[1], 19, 17, 1.5, 3), 64, 66.5);
[[-16, -12], [-16, 12], [16, -12], [16, 12]].forEach(([dx, dy]) => cyl(tcap, CAP[0] + dx, CAP[1] + dy, 1.4, 35.5, 64, 10));
const semi = (r, a0, n = 16) => { const pts = []; for (let k = 0; k <= n; k++) { const a = a0 + Math.PI * k / n; pts.push([CAP[0] + r * Math.cos(a), CAP[1] + r * Math.sin(a)]); } return pts; };
for (let k = 0; k < 4; k++) extrude(tcap, polyRegion(semi(15, -HP)), 40 + 6 * k, 40.7 + 6 * k);
cyl(tcap, CAP[0], CAP[1], 4, 66.5, 69, 16);
const rotor = part("Capacitor Rotor", "rotor", "minor", { spool: "rotor" });
for (let k = 0; k < 4; k++) extrude(rotor, polyRegion(Array.from({ length: 17 }, (_, i) => { const a = HP + Math.PI * i / 16; return [14.4 * Math.cos(a), 14.4 * Math.sin(a)]; })), 9 + 6 * k, 9.7 + 6 * k);
cyl(rotor, 0, 0, 2.2, 0, 36, 14);
cyl(rotor, 0, 0, 5, 36, 39, 16);
line(rotor, [0, 0, 39.05], [5, 0, 39.05]);

// ============================================================ callouts and the tour
const hf = q => r3(HF(q));
const localSpool = (name, p) => {
  const B = { Platter: [0, 0, PLATTER_Z], "Sub-platter": [0, 0, PLATTER_Z], "Rubber Mat": [0, 0, PLATTER_Z], Record: [0, 0, PLATTER_Z], "Record Label": [0, 0, PLATTER_Z], Spindle: [0, 0, PLATTER_Z],
    "Dial Needle": [0, PANEL.y, 88], "Tuning Knob": [54, PANEL.y, 98], "Capacitor Rotor": [CAP[0], CAP[1], CAP_Z], "Motor Pulley": [MOTOR[0], MOTOR[1], 143] }[name];
  return B ? r3([p[0] - B[0], p[1] - B[1], p[2] - B[2]]) : r3(p);
};
const ARM_PARTS = ["Arm Yoke", "Tonearm Tube", "Counterweight", "Headshell", "Cartridge", "Stylus"];
const P = (name, p, arm) => [...(arm ? armPt(...p) : localSpool(name, p)), name];
const bellMid = bp(rad(0), 0.9, 0);
const hotspots = [
  ["Brass horn", "Decorative: 7 lobes, 400 mm across", hf(bp(2 * Math.PI * 3 / LOBES, 0.82, -0.9)), ["Horn Bell", "Horn Relief"]],
  ["Swan neck", "Carries the horn up and over", r3(nk(neckPath[neckPath.length - 3]).map((c, i) => c + (i === 2 ? 0 : 0))), ["Swan Neck"]],
  ["Tonearm", "Creeps inward as the record plays", armPt(70, 0, 27.3), ["Tonearm Tube"]],
  ["Cartridge and stylus", "The tip rides the groove", armPt(140, 0, 12.4 + 0.0), ["Cartridge", "Stylus"]],
  ["Platter and record", "33 1/3 rpm", [30, 20, PLATTER_Z + 11.4], ["Record", "Platter"]],
  ["Radio dial", "A needle over a tuning scale", [0, PANEL.y - 0.06, 112], ["Dial Window"]],
  ["Tuning knob", "Turns the tuning capacitor", [54, PANEL.y - 8.06, 98], ["Tuning Knob"]],
  ["Speaker grille", "Cloth over a small driver", [-GR.xc, -IW - 0.4, 116], ["Grille Cloth L", "Speaker L"]],
  ["Spindle column", "Turned, with ring beads", [COLC + 7.55, -COLC, 92], ["Spindle Columns"]],
  ["Moulded cornice", "Frames the turntable deck", [0, -170.5, 147], ["Cornice"]],
  ["Side fretwork", "A carved rosette in a round panel", [HW + 0.06, 0, 128], ["Side Fretwork"]],
  ["Power LED", "Glows red when it is on", [HW + 3, -125, 62], ["Power LED"]],
  ["Brass feet", "Four bun feet", [-140, -150, 4], ["Brass Feet"]],
].map(([t, s, p, o]) => ({ t, s, p: o[0] === "Tonearm Tube" || o[0] === "Cartridge" ? p : localSpool(o[0], p), o }));
const tour = {
  points: {
    motor: [MOTOR[0], MOTOR[1], 131, "Motor Body"], belt: [BELT_R1 * Math.cos(TM - AL) * 0 + T1m[0] * 0.55 + T2m[0] * 0.45, T1m[1] * 0.55 + T2m[1] * 0.45, BELT_Z1, "Drive Belt"],
    record: P("Record", [60, 30, PLATTER_Z + 11.4]), spindle: P("Spindle", [0, 0, PLATTER_Z + 17]),
    stylus: [...armPt(140, 0, 4.2), "Stylus"], cart: [...armPt(140, 0, 11), "Cartridge"], tube: [...armPt(70, 0, 27.3), "Tonearm Tube"],
    pcb: [-60, 125, PCB_TOP, "Amp Board"], trf: [-85, 118, PCB_TOP + 33, "Transformer"], tcap: [CAP[0] + 12, CAP[1] - 17, 50, "Tuning Capacitor"],
    spk: [-GR.xc, -140, 108, "Speaker L"], win: [0, PANEL.y, 112, "Dial Window"], bell: [...hf(bp(2 * Math.PI * 3 / LOBES, 0.85, 0)), "Horn Bell"],
    throat: [...hf([R0, 0, 3]), "Throat Ferrule"], neck: [...r3(nk(neckPath[neckPath.length - 6])), "Swan Neck"],
  },
  steps: [
    { t: "A motor and belt set the speed", focus: "belt", dist: 0.7, ex: 1, p: ["motor", "belt"], n: ["Motor Body", "Motor Pulley", "Drive Belt", "Sub-platter"], ms: 4600,
      d: "A small electric motor turns a pulley about 9 times faster than the platter. A rubber belt carries the turn to the sub-platter under the record and steps it down to a steady 33 1/3 rpm." },
    { t: "The record turns", focus: "spindle", dist: 0.7, ex: 0, p: ["record", "spindle"], n: ["Platter", "Record", "Record Label", "Spindle"], ms: 4200,
      d: "The platter and record turn clockwise at 33 1/3 rpm, one turn in 1.8 seconds. The groove is one long spiral that starts near the rim." },
    { t: "The stylus rides the groove", focus: "stylus", dist: 0.35, ex: 0, p: ["stylus", "cart"], n: ["Stylus", "Cartridge", "Headshell"], ms: 4400,
      d: "A tiny diamond tip sits in the spiral groove and is pulled gently inward by it, so the whole tonearm creeps towards the label over the 20 minutes of a side." },
    { t: "The groove wiggles the cartridge", focus: "cart", dist: 0.35, ex: 0, p: ["cart", "tube"], n: ["Cartridge", "Stylus", "Tonearm Tube", "Counterweight"], ms: 4400,
      d: "The groove walls are wavy copies of the sound. They shake the stylus, and a magnet-and-coil (or crystal) in the cartridge turns that shaking into a tiny electrical signal." },
    { t: "The signal is amplified", focus: "trf", dist: 0.7, ex: 1, p: ["pcb", "trf", "tcap"], n: ["Amp Board", "Transformer", "Filter Capacitors", "Amp ICs and Heatsink", "Tuning Capacitor"], ms: 4600,
      d: "The cartridge's signal is far too small for a speaker. The amplifier board boosts it, using power from the transformer. The tuning capacitor next to it belongs to the radio: turning the knob sweeps it across the stations." },
    { t: "The speakers make the sound", focus: "spk", dist: 0.6, ex: 1, p: ["spk", "win"], n: ["Speaker L", "Speaker R", "Grille Cloth L", "Grille Cloth R"], ms: 4400,
      d: "Each speaker's coil moves its paper cone to and fro with the signal, pushing the air as sound. They sit behind the cloth grilles on the front." },
    { t: "The horn is for looks", focus: "bell", dist: 1.0, ex: 0, p: ["bell", "throat", "neck"], n: ["Horn Bell", "Horn Relief", "Rim Studs", "Swan Neck", "Throat Ferrule", "Neck Collar"], ms: 5000,
      d: "On a true gramophone this flare is the loudspeaker: its small throat is matched to the thin air-pushing diaphragm, and the widening bell lets the sound spread into the room. Here it is only decoration, closed off and not connected to the speakers." },
  ],
};

const geometry = geometryScript("GRAM_GEOMETRY", "models/gramophone/build.js", {
  explode: offs, hotspots, tour,
  constants: { PIV, ARM_L, PHI0, PHI1, PUL_RATIO: BELT_R1 / BELT_R2, BELT_LEN, SUB_BELT_R: BELT_R1, NPULSE, PLATTER_Z, A0 },
});
writeGeometry(HERE, geometry);
console.log(`models/gramophone/geometry.js: ${geometry.stats}`);
const zs = []; for (let u = 0; u <= 1; u += 0.02) for (let k = 0; k < 84; k++) { const th = 2 * Math.PI * k / 84, q = HF(bp(th, u)); zs.push(q[2]); }
console.log("horn z max", Math.max(...zs).toFixed(0), "min", Math.min(...zs).toFixed(0), "phi", (PHI0 * 180 / Math.PI).toFixed(1), (PHI1 * 180 / Math.PI).toFixed(1), "belt", BELT_LEN.toFixed(0));
