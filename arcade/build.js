/*
Upright arcade cabinet: builds the model page and adds it to the gallery.

After the arcade-cabinet figure in Anatomy (github.com/wheresryan22/anatomy, MIT, by Ryan), rebuilt at full size as a
3D blueprint model: an upright cabinet whose right side comes off to show the coin path (slot, coin mechanism,
chute, coin switch, cash box), the control panel with its joystick and microswitches, the tilted CRT behind its bezel,
the marquee light and speakers, and the game board and power supply on the floor of the cabinet.

Generated in code (with lib/procedural.js) in mm: X across the front, Y back from the kick panel's face (the control
panel reaches forward to y = -150), Z up from the floor. Planes that aren't square to the axes (the control panel's
top, the monitor bezel) are drawn in frames of their own. Moving parts: the joystick (a spool based at its pivot) and a
coin (a spool based at the coin slot) that model.js drops through the coin path; the CRT's picture is
lib/screen-runtime.js on the tube's face.

    node arcade/build.js

Writes arcade/index.html (the page on its own) and replaces or inserts the model in index.html.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { read, withFrame, part, line, loop, rrPts, circlePts, rrRegion, rect, polyRegion, extrude, rrBody, cyl, revolve, loft, tube,
  r3, geometryScript, buildPage, addToGallery } = require("../lib/procedural");

const HERE = __dirname;
const FX = q => [q[2], q[0], q[1]];   // draws in (y, z), pushes along x
const FY = q => [q[0], q[2], q[1]];   // draws in (x, z), pushes along y
// ---------- dimensions (mm) ----------
const HW = 330, T = 18, IW = HW - T;          // half the outer width, panel thickness, half the inner width
const LEG = 20;                               // the levelers' height: the cabinet stands on them
const BACK = 660, TOPZ = 1780;
// the side's outline in (y, z): kick panel, control panel, bezel, marquee, top, back
const SIDE = [[0, LEG], [0, 760], [-150, 820], [-150, 900], [40, 960], [110, 1460], [60, 1480], [60, TOPZ], [BACK, TOPZ], [BACK, LEG]];
// the control panel's top: from its front edge (y -150, z 900) up to (y 40, z 960); s along it, h out of it
const PL = Math.hypot(190, 60), PCU = 190 / PL, PSU = 60 / PL;
const PT = ([x, s, h]) => [x, -150 + s * PCU - h * PSU, 900 + s * PSU + h * PCU];
const PR = ([x, s, h]) => [x, s * PCU - h * PSU, s * PSU + h * PCU];          // the same turn without the move, for parts based at a point
// the bezel's plane: from (y 40, z 960) up to (y 110, z 1460); s up it, h out of it towards the player
const BL = Math.hypot(70, 500), BUY = 70 / BL, BUZ = 500 / BL;
const BZ = ([x, s, h]) => [x, 40 + s * BUY - h * BUZ, 960 + s * BUZ + h * BUY];
const PIC = { x: 200, s0: 100, s1: 400, h: -13.5 };                         // the CRT's picture, 4:3
const STICK = [-170, 95], BUTTONS = [[-40, 88], [18, 100], [76, 108]], STARTS = [[190, 150], [245, 150]];
// the geometry is packed as Int16 at 0.05 mm (±1638 mm), so the 1780 mm cabinet is drawn shifted down to centre on z = 0
const ZC = 890, SH = p => [p[0], p[1], p[2] - ZC];
const PIVOT_W = PT([STICK[0], STICK[1], 0]), SLOT_W = [60, -4, 580];   // in the cabinet's own coordinates
const PIVOT = SH(PIVOT_W), SLOT = SH(SLOT_W);                           // as packed: the joystick's pivot, the right coin slot
const COIN_R = 12.13, COIN_T = 1.75;                                       // a US quarter

const explode = {
  cabinet: [0, 0, 0], side: [460, 0, 0], back: [0, 420, 0], top: [0, 0, 300], marquee: [0, -80, 200],
  bezel: [0, -420, 260], monitor: [0, -170, 30], panel: [0, -300, -60], stick: { offset: [0, -300, -60], base: PIVOT },
  door: [0, -330, -20], coin: [0, -170, -20], coinPath: { offset: [0, -170, -20], base: SLOT }, electronics: [0, 150, -10],
};

withFrame(SH, () => {
// ---------- the cabinet: sides, kick panel, floor, top, back ----------
const left = part("Left Side", "cabinet", "major");
withFrame(FX, () => extrude(left, polyRegion(SIDE), -HW, -IW));
const right = part("Right Side", "side", "major");
withFrame(FX, () => extrude(right, polyRegion(SIDE), IW, HW));
const molding = part("T-Molding", "cabinet", "minor");   // the plastic edge strip round both sides
[-HW - 0.05, HW + 0.05].forEach(x => withFrame(FX, () => {
  const pts = SIDE.map(([y, z]) => [y, z, x]);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], d = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(...d), n = [-d[1] / l * 6, d[0] / l * 6];
    line(molding, [a[0] + n[0], a[1] + n[1], x], [b[0] + n[0], b[1] + n[1], x]);
  }
}));
const kick = part("Kick Panel", "cabinet", "major");
withFrame(FY, () => extrude(kick, rrRegion(0, (LEG + 760) / 2, IW, (760 - LEG) / 2, 0, 6, [[-140, 140, 250, 640]]), 0, T));
const floor = part("Floor", "cabinet", "minor");
extrude(floor, rect(-IW, IW, T, BACK - T), LEG, LEG + T);
const levelers = part("Levelers", "cabinet", "minor");
[[-1, 50], [1, 50], [1, BACK - 50], [-1, BACK - 50]].forEach(([sx, y]) => { cyl(levelers, sx * (HW - 30), y, 18, 0, 5, 24); cyl(levelers, sx * (HW - 30), y, 8, 5, LEG, 16); });
const shelf = part("Board Shelf", "cabinet", "minor");
extrude(shelf, rect(-IW, IW, 360, BACK - T), 580, 598);
const top = part("Top Panel", "top", "major");
extrude(top, rect(-IW, IW, 60, BACK), TOPZ - T, TOPZ);
const back = part("Back Door", "back", "major");
withFrame(FY, () => {
  extrude(back, rect(-IW, IW, LEG + T, TOPZ - T), BACK - T, BACK);
  for (let x = -240; x <= 240; x += 24) loop(back, rrPts(x, 1500, 4, 60, 4, 3).map(q => [...q, BACK + 0.05]));   // vents behind the monitor
  cyl(back, 0, 900, 12, BACK, BACK + 6, 20);                                                                  // lock
  line(back, [-4, 900, BACK + 6.05], [4, 900, BACK + 6.05]);
});

// ---------- the coin door and the coin path ----------
const door = part("Coin Door", "door", "major");
withFrame(FY, () => {
  rrBody(door, 0, 445, 140, 195, 8, [[0, -4, true], [0, 0, true]], { seg: 4 });   // the plan is (x, z), the "heights" are y
  [-1, 1].forEach(s => {
    rrBody(door, s * 60, 580, 22, 34, 4, [[0, -10, true], [0, -4, true]], { seg: 3 });   // the slot plate
    loop(door, rrPts(s * 60, 588, 1.4, 14, 1.3, 3).map(q => [...q, -10.05]));        // the slot
    cyl(door, s * 60, 528, 9, -14, -10, 20);                                          // the reject button
    rrBody(door, s * 60, 320, 30, 22, 4, [[0, -8, true], [0, -4, true]], { seg: 3, top: false });   // the coin return cup
  });
  cyl(door, 0, 430, 10, -9, -4, 20);   // lock
  line(door, [-4, 430, -9.05], [4, 430, -9.05]);
});
const mechs = part("Coin Mechanisms", "coin", "major");
[-60, 60].forEach(x => {
  rrBody(mechs, x, 54, 20, 36, 3, [[0, 470, true], [0, 620, true]], { seg: 3 });
  withFrame(FX, () => loop(mechs, rrPts(54, 560, 24, 40, 6, 3).map(q => [...q, x + 20.05])));   // the side plate's outline
});
const chute = part("Coin Chute", "coin", "minor");
withFrame(FX, () => {
  extrude(chute, polyRegion([[40, 458], [250, 388], [250, 395], [40, 465]]), 30, 90);
  [30, 90].forEach(x0 => extrude(chute, polyRegion([[40, 465], [250, 395], [250, 410], [40, 480]]), x0 - 2, x0));   // its lips
});
const cswitch = part("Coin Switch", "coin", "minor");
rrBody(cswitch, 20, 150, 6, 10, 1, [[0, 430, true], [0, 452, true]], { seg: 2 });
line(cswitch, [26, 145, 446], [56, 150, 425]);   // the wire lever across the chute
tube(cswitch, [[14, 150, 452], [14, 150, 500], [-40, 260, 560], [-60, 380, 598]], 1.5, 6);   // its lead to the board
const cashbox = part("Cash Box", "coin", "major");
rrBody(cashbox, 0, 180, 120, 140, 6, [[0, 260, true], [0, 380, true]], { seg: 4, top: false });
extrude(cashbox, rect(-30, 30, 40, 44), 330, 350);   // handle
const counter = part("Coin Counter", "coin", "minor");
rrBody(counter, -100, 40, 14, 10, 2, [[0, 640, true], [0, 664, true]], { seg: 2 });
loop(counter, rrPts(-100, 30 - 0.05, 9, 4, 1, 2).map(([x, z]) => [x, 30 - 0.05, z]));


// ---------- the control panel ----------
const panel = part("Control Panel", "panel", "major");
withFrame(FX, () => extrude(panel, polyRegion([[-150, 820], [0, 760], [40, 760], [40, 960], [-150, 900]]), -IW, IW));
const overlay = part("Panel Overlay", "panel", "minor");
withFrame(PT, () => {
  loop(overlay, rrPts(0, PL / 2, IW - 14, PL / 2 - 14, 10, 4).map(q => [...q, 0.1]));
  [[-IW + 22, 22], [IW - 22, 22], [IW - 22, PL - 22], [-IW + 22, PL - 22]].forEach(([x, s]) => loop(overlay, circlePts(x, s, 3, 12).map(q => [...q, 0.1])));   // carriage bolts
});
const buttons = part("Buttons", "panel", "major");
withFrame(PT, () => {
  BUTTONS.forEach(([x, s]) => { cyl(buttons, x, s, 16, 0, 4, 32); cyl(buttons, x, s, 12.5, 4, 11, 32); });
  STARTS.forEach(([x, s]) => { cyl(buttons, x, s, 12, 0, 3, 28); cyl(buttons, x, s, 9, 3, 7, 28); });
});
const switches = part("Microswitches", "panel", "minor");
withFrame(PT, () => {
  extrude(switches, rect(STICK[0] - 45, STICK[0] + 45, STICK[1] - 45, STICK[1] + 45), -22, -19);   // the joystick's mounting plate
  [[0, 30], [0, -30], [30, 0], [-30, 0]].forEach(([dx, ds]) => extrude(switches, rect(STICK[0] + dx - (dx ? 4 : 10), STICK[0] + dx + (dx ? 4 : 10), STICK[1] + ds - (ds ? 4 : 10), STICK[1] + ds + (ds ? 4 : 10)), -50, -22));
  BUTTONS.forEach(([x, s]) => extrude(switches, rect(x - 10, x + 10, s - 5, s + 5), -48, -22));
});

// ---------- the monitor: bezel, glass, CRT ----------
const bezel = part("Bezel", "bezel", "major");
withFrame(BZ, () => {
  extrude(bezel, rrRegion(0, BL / 2, IW, BL / 2, 0, 6, [[-PIC.x - 6, PIC.x + 6, PIC.s0 - 6, PIC.s1 + 6]]), -6, 0);
  loop(bezel, rrPts(0, (PIC.s0 + PIC.s1) / 2, PIC.x + 24, (PIC.s1 - PIC.s0) / 2 + 24, 18, 6).map(q => [...q, 0.05]));   // the printed surround
});
const glass = part("Bezel Glass", "bezel", "minor");
// lines only, no surface, so it never hides the picture on the tube behind it
withFrame(BZ, () => {
  [1, 4].forEach(h => loop(glass, rrPts(0, BL / 2, IW, BL / 2 - 4, 0.01, 1).map(q => [...q, h])));
  [[-IW, 4], [IW, 4], [IW, BL - 4], [-IW, BL - 4]].forEach(([x, s]) => line(glass, [x, s, 1], [x, s, 4]));
  [[-150, 330, -90, 390], [-120, 330, -60, 390]].forEach(([x0, s0, x1, s1]) => line(glass, [x0, s0, 4.05], [x1, s1, 4.05]));   // glare
});
const crt = part("CRT", "monitor", "major");
withFrame(BZ, () => {
  const C = (PIC.s0 + PIC.s1) / 2;
  const ring = (hw, hh, r, h, hard) => ({ hard, pts: rrPts(0, C, hw, hh, r, 6).map(q => [...q, h]) });
  loft(crt, [ring(226, 172, 34, -14, true), ring(229, 175, 34, -44, true), ring(160, 122, 60, -150), ring(36, 36, 36, -232, true), ring(26, 26, 26, -260, true), ring(26, 26, 26, -350, true)]);
  extrude(crt, rrRegion(0, C, 226, 172, 34, 6), -14.5, -14, { bottom: false });   // the face
  cyl(crt, 0, C, 12, -372, -350, 16);                                             // the neck's socket
});
const yoke = part("Deflection Yoke", "monitor", "minor");
withFrame(BZ, () => {
  revolve(yoke, 0, (PIC.s0 + PIC.s1) / 2, [[44, -222, true], [60, -200, true], [60, -184, true], [40, -184, true]], 36, true);
  for (let k = 0; k < 8; k++) { const a = 2 * Math.PI * k / 8, C = (PIC.s0 + PIC.s1) / 2; line(yoke, [44 * Math.cos(a), C + 44 * Math.sin(a), -222], [60 * Math.cos(a), C + 60 * Math.sin(a), -200]); }
});
const chassis = part("Monitor Chassis", "monitor", "minor");
withFrame(BZ, () => {
  const C = (PIC.s0 + PIC.s1) / 2;
  extrude(chassis, rrRegion(0, C, 262, 200, 10, 4, [[-232, 232, C - 178, C + 178]]), -34, -28);   // the tube's mounting frame
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, ss]) => loop(chassis, circlePts(sx * 248, C + ss * 186, 4, 12).map(q => [...q, -27.95])));
});
extrude(chassis, rect(-160, 160, 210, 470), 985, 988);   // the monitor's board, under the neck
[[-120, 260], [-40, 300], [60, 250], [110, 380], [-90, 420]].forEach(([x, y], i) => (i % 2 ? cyl(chassis, x, y, 12, 988, 1010, 16) : extrude(chassis, rect(x - 16, x + 16, y - 10, y + 10), 988, 1000)));
cyl(chassis, 130, 300, 30, 988, 1020, 24);   // the flyback transformer

// ---------- the marquee and speakers ----------
const marquee = part("Marquee", "marquee", "major");
withFrame(FY, () => extrude(marquee, rect(-IW, IW, 1498, TOPZ - T), 60, 66));
withFrame(FY, () => loop(marquee, rrPts(0, 1630, IW - 30, 100, 10, 4).map(q => [...q, 59.95])));   // the artwork's edge
const mlight = part("Marquee Light", "marquee", "minor");
withFrame(FX, () => { cyl(mlight, 110, 1630, 13, -280, 280, 20); [-1, 1].forEach(s => extrude(mlight, rect(96, 124, 1612, 1648), s > 0 ? 280 : -296, s > 0 ? 296 : -280)); });
const mbox = part("Speaker Panel", "marquee", "minor");
extrude(mbox, rect(-IW, IW, 60, 300), 1480, 1498);
withFrame(FY, () => extrude(mbox, rect(-IW, IW, 1498, TOPZ - T), 290, 300));   // the marquee box's back
const speakers = part("Speakers", "marquee", "minor");
[-170, 170].forEach(x => {
  revolve(speakers, x, 160, [[52, 1498, true], [46, 1506], [16, 1532, true], [24, 1532, true], [24, 1556, true], [0, 1556]], 32);
  for (let k = 0; k < 7; k++) loop(speakers, rrPts(x, 160 - 36 + k * 12, 34 - Math.abs(k - 3) * 6, 2.5, 2.4, 2).map(q => [...q, 1479.95]));   // the grille slots
});

// ---------- electronics: board, harness, power ----------
const board = part("Game Board", "electronics", "major");
extrude(board, rect(-220, 80, 400, 620), 610, 612);
extrude(board, rect(-180, 40, 396, 404), 604, 618);   // the 56-way edge connector and its plug
for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) extrude(board, rect(-200 + i * 44, -170 + i * 44, 440 + j * 56, 470 + j * 56), 612, 616);   // chips
cyl(board, 50, 590, 10, 612, 632, 16);
const harness = part("Wiring Harness", "electronics", "minor");
tube(harness, [[-120, 396, 611], [-120, 300, 640], [-140, 120, 740], [-160, 20, 790], [-170, -30, 800]], 9, 10);    // to the controls
tube(harness, [[20, 396, 611], [40, 330, 700], [60, 300, 900], [40, 300, 985]], 7, 10);                          // to the monitor board
tube(harness, [[-60, 396, 611], [-80, 260, 600], [-60, 120, 560], [-40, 60, 640]], 5, 8);                         // to the coin door
const psu = part("Power Supply", "electronics", "major");
rrBody(psu, 190, 520, 90, 100, 4, [[0, LEG + T, true], [0, LEG + T + 100, true]], { seg: 3 });
for (let x = 120; x <= 260; x += 14) line(psu, [x, 430, LEG + T + 100.05], [x, 610, LEG + T + 100.05]);
tube(psu, [[190, 420, LEG + T + 80], [190, 380, 300], [120, 420, 580], [60, 500, 612]], 6, 8);   // 5 V and 12 V to the board

});

// parts based at a point of their own are drawn about that point, outside the shift
// the coin, drawn at the slot (its module's base) on edge, ready to drop in
const coin = part("Coin", "coinPath", "major", { spool: "coin" });
withFrame(FX, () => { cyl(coin, 0, 0, COIN_R, -COIN_T / 2, COIN_T / 2, 32); loop(coin, circlePts(0, 0, COIN_R - 1.5, 28).map(q => [...q, COIN_T / 2 + 0.05])); });
// the joystick, drawn about its pivot (its module's base) in the panel's tilt
const stick = part("Joystick", "stick", "major", { spool: "stick" });
withFrame(PR, () => {
  cyl(stick, 0, 0, 20, 0, 1.5, 32);                                     // dust washer
  cyl(stick, 0, 0, 5, -48, 56, 16);                                      // shaft, through the panel
  const ball = [];
  for (let a = -80; a <= 90; a += 10) ball.push([Math.max(0, 17 * Math.cos(a * Math.PI / 180)), 70 + 17 * Math.sin(a * Math.PI / 180)]);
  revolve(stick, 0, 0, [[5, 56, true], ...ball, [0, 87]], 28);
  cyl(stick, 0, 0, 11, -44, -30, 24);                                    // the actuator the switches feel
});

// ---------- callouts and the tour ----------
const at = (name, p) => r3(name === "Joystick" ? p.map((c, i) => c - PIVOT_W[i]) : name === "Coin" ? p.map((c, i) => c - SLOT_W[i]) : SH(p));
const hotspots = [
  ["Coin slot", "A quarter goes in here", [60, -10.05, 588], ["Coin Door"]],
  ["Coin mechanism", "Rejects anything not a quarter", [80, 54, 600], ["Coin Mechanisms"]],
  ["Coin switch", "Each coin flicks it once: one credit", [26, 150, 446], ["Coin Switch"]],
  ["Cash box", "Where the coins end up", [0, 40, 360], ["Cash Box"]],
  ["Joystick", "Four microswitches underneath", PT([STICK[0], STICK[1], 87]), ["Joystick"]],
  ["Buttons", "Leaf or microswitch, one wire each", PT([BUTTONS[1][0], BUTTONS[1][1], 11]), ["Buttons"]],
  ["CRT", "A 19-inch tube, tilted back", BZ([PIC.x - 40, PIC.s1 - 40, PIC.h]), ["CRT"]],
  ["Deflection yoke", "Steers the beam across the screen", BZ([60, (PIC.s0 + PIC.s1) / 2, -200]), ["Deflection Yoke"]],
  ["Marquee", "Lit from behind by a tube", [-200, 60, 1700], ["Marquee"]],
  ["Game board", "The game itself, on one PCB", [-100, 500, 616], ["Game Board"]],
  ["Power supply", "5 V for the logic, 12 V for audio", [190, 420, LEG + T + 60], ["Power Supply"]],
].map(([t, s, p, o]) => ({ t, s, p: at(o[0], p), o }));
const pt = (name, p) => [...at(name, p), name];
const tour = {
  points: {
    slot: pt("Coin Door", [60, -10, 588]), mech: pt("Coin Mechanisms", [60, 54, 545]), sw: pt("Coin Switch", [26, 150, 446]), box: pt("Cash Box", [0, 180, 380]),
    stick: pt("Joystick", PT([STICK[0], STICK[1], 87])), under: pt("Microswitches", PT([STICK[0], STICK[1], -40])), btn: pt("Buttons", PT([BUTTONS[1][0], BUTTONS[1][1], 11])),
    board: pt("Game Board", [-70, 510, 616]), harness: pt("Wiring Harness", [-140, 120, 740]), crt: pt("CRT", BZ([0, 250, PIC.h])), yoke: pt("Deflection Yoke", BZ([0, 250, -200])),
    psu: pt("Power Supply", [190, 520, LEG + T + 100]), marquee: pt("Marquee", [0, 60, 1630]),
  },
  steps: [
    { t: "A coin goes in", focus: "mech", dist: 0.45, ex: 1, p: ["slot", "mech"], n: ["Coin Door", "Coin Mechanisms", "Coin"], ms: 4400,
      d: "A quarter drops through the slot into the coin mechanism, which checks its size, weight and metal. Anything else falls out to the return cup." },
    { t: "One coin, one pulse", focus: "sw", dist: 0.45, ex: 1, p: ["mech", "sw", "box"], n: ["Coin Chute", "Coin Switch", "Cash Box", "Coin"], ms: 4400,
      d: "An accepted coin rolls down the chute and flicks the coin switch's wire on its way to the cash box. That one closed contact is a credit." },
    { t: "The game board counts it", focus: "board", dist: 0.5, ex: 1, p: ["sw", "harness", "board"], n: ["Game Board", "Wiring Harness", "Coin Switch"], ms: 4400,
      d: "Every switch in the cabinet is a wire to the game board's edge connector. The board sees the coin switch close and the screen goes from INSERT COIN to CREDIT 1." },
    { t: "Four switches make a joystick", focus: "under", dist: 0.4, ex: 1, p: ["stick", "under", "btn"], n: ["Joystick", "Microswitches", "Buttons"], ms: 4400,
      d: "Push the stick left and its actuator closes the left microswitch under the panel; diagonals close two at once. The buttons are one switch each." },
    { t: "The picture", focus: "crt", dist: 0.55, ex: 1, p: ["crt", "yoke"], n: ["CRT", "Deflection Yoke", "Monitor Chassis"], ms: 4400,
      d: "The board's video drives a CRT tilted back behind the bezel. The yoke's coils sweep the electron beam across the phosphor line by line." },
    { t: "Power and light", focus: "psu", dist: 0.6, ex: 1, p: ["psu", "board", "marquee"], n: ["Power Supply", "Marquee Light", "Marquee"], ms: 4000,
      d: "A switching supply on the floor gives the board 5 V for its logic and 12 V for the amplifier; a fluorescent tube behind the marquee lights the game's name." },
  ],
};
const screen = { module: "monitor", origin: SH(BZ([-PIC.x, PIC.s0, PIC.h])), right: SH(BZ([PIC.x, PIC.s0, PIC.h])), top: SH(BZ([-PIC.x, PIC.s1, PIC.h])), cornerRadius: 0 };

// ---------- page and gallery ----------
const geometry = geometryScript("AC_GEOMETRY", "arcade/build.js", { explode, hotspots, tour, screen,
  constants: { PIVOT, PCU, PSU, SLOT, COIN_R } });
const model = read(path.join(HERE, "..", "lib", "screen-runtime.js")) + read(path.join(HERE, "model.js"));
const html = buildPage({ template: "cpu", geometry: geometry.js, model, swaps: [
  [/<title>[^<]*<\/title>/, "<title>Arcade Cabinet</title>"],
  [/(<canvas id="scene" aria-label=")[^"]*"/, "$1Line drawing of an upright arcade cabinet: a coin drops through the coin mechanism, rolls past the coin switch into the cash box, and the screen gives a credit; on hover the side, back, bezel, monitor, control panel and coin door come away\""],
  [/(<div id="hotspots" aria-label=")[^"]*"/, "$1Cabinet parts\""],
  [/<a class="mark" href="#top">.*?<\/a>/, '<a class="mark" href="#top"><b>Arcade Cabinet</b><span>Upright</span></a>'],
  [/<div class="dwg" aria-hidden="true">.*?<\/div>/,
    '<div class="dwg" aria-hidden="true">DWG AC-001 &middot; Rev A<br>Units mm &middot; View az 35&deg; / el 18&deg;<br>After &ldquo;Arcade cabinet&rdquo; in Anatomy by Ryan (MIT)</div>'],
] });
fs.writeFileSync(path.join(HERE, "index.html"), html);
const count = addToGallery({ id: "arcade", label: "Arcade Cabinet", kind: "machine", tags: "arcade cabinet upright coin op crt joystick retro game machine animated anatomy",
  key: "ac-theme", category: "Consoles", html }, "steam");
console.log(`arcade/index.html ${(html.length / 1e6).toFixed(2)} MB, ${geometry.stats}; index.html now has ${count} models`);
