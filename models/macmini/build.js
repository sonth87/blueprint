/*
Mac mini (M4, 2024): builds its geometry.

Generated in code (with kit/procedural.js) in mm: X across the front, Y back from the front face (the front faces
-Y, towards the default view), Z up; a 127 x 127 x 50 rounded square. Air comes in through the gap round the
foot ring underneath, a blower fan (a module of its own, based at its hub, so the page can spin it) pushes it
through the fin stack under the M4 chip and out at the back. The power supply is built in, above the logic
board. The page's chrome and the shared engine come from the X9 page already in the gallery.

    node models/macmini/build.js

Writes models/macmini/geometry.js.
*/
"use strict";
const { withFrame, part, line, loop, rrPts, circlePts, rrRegion, rect, fanRegion, stripRegion, extrude, rrBody, cyl, revolve, tube,
  r3, geometryScript, writeGeometry } = require("../../kit/procedural");

const HERE = __dirname;
const FY = q => [q[0], q[2], q[1]];            // draws in (x, z) on the front, pushes along y
const RB = q => [-q[0], -q[2], q[1]];          // draws in (x, z) on the back, seen from behind
// ---------- dimensions (mm) ----------
const HW = 63.5, H = 50, R = 18, FOOT = 2;     // half the 127 mm footprint, height, plan corner radius, foot height
const PLATE = FOOT + 1.5;                      // the bottom cover's top face
const BZ0 = 18, BZ = 19.5;                     // the logic board's underside and top
const PORT_Z = 23;                             // the ports' centre height, front and back
const FAN = [0, -8, 4];                        // the blower's hub, on the bottom cover
const PSU = [28, 46];                          // the power supply's bottom and top

const explode = {
  shell: [0, 0, 135], psu: [0, 0, 58], ssd: [-40, 0, 18], board: [0, 0, 0], cooling: [0, 0, -26],
  fan: { offset: [0, 0, -50], base: FAN }, fanHousing: [0, 0, -50], bottom: [0, 0, -78],
};

// ---------- the enclosure ----------
const shell = part("Enclosure", "shell", "major");
rrBody(shell, 0, 0, HW, HW, R, [[0, FOOT, true], [0, H - 2.4, true], [0.9, H - 0.7], [2.4, H, true]], { seg: 8, bottom: false });
// tangent edges: where each rounded corner meets the flat sides, so the sides read as a drawing, not just a fill
[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
  const cx = sx * (HW - R), cy = sy * (HW - R);
  line(shell, [sx * HW, cy, FOOT], [sx * HW, cy, H - 2.4]);
  line(shell, [cx, sy * HW, FOOT], [cx, sy * HW, H - 2.4]);
});
// the openings for the ports, front and back
const USBC = [4.4, 1.6, 1.5];
const FRONT = [[-42, USBC], [-30, USBC]];
const REAR = [[38, "power"], [22, [4.2, 3.4, 0.6]], [6, [7.2, 2.6, 0.8]], [-10, USBC], [-22, USBC], [-34, USBC]];   // power, Ethernet, HDMI, 3 x Thunderbolt
withFrame(FY, () => {
  FRONT.forEach(([x, [w, h, r]]) => loop(shell, rrPts(x, PORT_Z, w + 0.4, h + 0.4, r, 3).map(q => [...q, -HW - 0.05])));
  loop(shell, circlePts(-18, PORT_Z, 2.2, 20).map(q => [...q, -HW - 0.05]));   // headphone jack
});
withFrame(RB, () => {
  REAR.forEach(([x, s]) => {
    if (s === "power") loop(shell, circlePts(-x, PORT_Z, 5.2, 28).map(q => [...q, -HW - 0.05]));
    else loop(shell, rrPts(-x, PORT_Z, s[0] + 0.4, s[1] + 0.4, s[2], 3).map(q => [...q, -HW - 0.05]));
  });
  for (let x = -40; x <= 40; x += 4) loop(shell, rrPts(x, 6.5, 1, 3, 0.9, 2).map(q => [...q, -HW - 0.05]));   // exhaust slots low on the back
});
const led = part("Status Light", "shell", "minor");
withFrame(FY, () => cyl(led, 40, PORT_Z, 0.9, -HW - 0.2, -HW + 0.4, 16));

// ---------- underneath: bottom cover, foot ring, power button ----------
const bottom = part("Bottom Cover", "bottom", "major");
rrBody(bottom, 0, 0, HW - 1.2, HW - 1.2, R - 1.2, [[0, FOOT, true], [0, PLATE, true]], { seg: 8 });
for (let k = 0; k < 64; k++) {   // the intake: slots round the foot ring
  const a = 2 * Math.PI * k / 64, c = Math.cos(a), s = Math.sin(a), n = [-s * 0.7, c * 0.7];
  loop(bottom, [[56 * c + n[0], 56 * s + n[1]], [60 * c + n[0], 60 * s + n[1]], [60 * c - n[0], 60 * s - n[1]], [56 * c - n[0], 56 * s - n[1]]]
    .map(q => [...q, FOOT - 0.05]));
}
const foot = part("Foot Ring", "bottom", "minor");
revolve(foot, 0, 0, [[50, 0, true], [54, 0, true], [54, FOOT, true], [50, FOOT, true]], 64, true);
const button = part("Power Button", "bottom", "minor");
cyl(button, -HW + 12, HW - 12, 4, 0.6, FOOT, 24);
loop(button, circlePts(-HW + 12, HW - 12, 2.6, 20).map(q => [...q, 0.55]));

// ---------- the blower fan and its housing ----------
const fan = part("Fan", "fan", "minor", { spool: "fan" });
cyl(fan, 0, 0, 10, 0.5, 11, 28);
for (let k = 0; k < 31; k++) {
  const left = [], right = [];
  for (let s = 0; s <= 4; s++) {
    const r = 10.5 + 19.5 * s / 4, a = 2 * Math.PI * k / 31 + 0.5 * s / 4, n = [Math.cos(a + Math.PI / 2) * 0.3, Math.sin(a + Math.PI / 2) * 0.3];
    const c = [r * Math.cos(a), r * Math.sin(a)];
    left.push([c[0] + n[0], c[1] + n[1]]); right.push([c[0] - n[0], c[1] - n[1]]);
  }
  extrude(fan, stripRegion(left, right), 1, 10.5);
}
const housing = part("Fan Housing", "fanHousing", "minor");
{
  const pts = [], OUT = 26;
  for (let s = 0; s <= 24; s++) { const a = Math.PI + Math.PI * s / 24; pts.push([FAN[0] + 33 * Math.cos(a), FAN[1] + 33 * Math.sin(a)]); }
  pts.push([FAN[0] + 33, OUT], [FAN[0] - 33, OUT]);
  extrude(housing, fanRegion(pts), FAN[2], FAN[2] + 11.5, { top: false, wallIf: (a, b) => !(Math.abs(a[1] - OUT) < 1e-6 && Math.abs(b[1] - OUT) < 1e-6) });
  loop(housing, circlePts(FAN[0], FAN[1], 14, 28).map(q => [...q, FAN[2] - 0.05]));   // the intake under the hub
}

// ---------- cooling: thermal plate, heat pipes, fin stack ----------
const CHIP = [0, 4];
const plate = part("Thermal Plate", "cooling", "minor");
extrude(plate, rrRegion(CHIP[0], CHIP[1], 15, 13, 1.5, 3), 15.6, 16.6);
const pipes = part("Heat Pipes", "cooling", "minor");
[-7, 7].forEach(x => tube(pipes, [[x, -4, 16.1], [x, 14, 16.1], [x * 2.6, 30, 16.1], [x * 2.6, 56, 16.1]], 1.2, 10));
const fins = part("Fin Stack", "cooling", "major");
for (let x = -32; x <= 32; x += 2) extrude(fins, rect(x - 0.15, x + 0.15, 27, 58), FAN[2] + 0.5, 14.8);

// ---------- the logic board, M4 underneath, memory, SSD and ports ----------
const board = part("Logic Board", "board", "major");
extrude(board, rrRegion(0, 0, HW - 4, HW - 4, R - 4, 6), BZ0, BZ);
[[-50, -50], [50, -50], [50, 50], [-50, 50]].forEach(([x, y]) => loop(board, circlePts(x, y, 1.6, 10).map(q => [...q, BZ + 0.05])));
const soc = part("M4 Chip", "board", "major");   // on the board's underside, facing the thermal plate
extrude(soc, rrRegion(CHIP[0], CHIP[1], 14, 12, 1, 2), 17, BZ0);
extrude(soc, rrRegion(CHIP[0] - 4, CHIP[1], 6.5, 7.5, 0.4, 2), 16.6, 17);
const mem = part("Unified Memory", "board", "minor");
[-5, 5].forEach(dy => extrude(mem, rrRegion(CHIP[0] + 7.5, CHIP[1] + dy, 4, 4.3, 0.4, 2), 16.6, 17));
const comps = part("Board Components", "board", "minor");
for (let i = 0; i < 6; i++) extrude(comps, rrRegion(-20 + i * 8, -14, 2.6, 2.6, 0.4, 2), BZ, BZ + 1.8);   // power stages
[[14, 22, 6, 5], [-30, 26, 5, 5], [32, -18, 7, 6]].forEach(([x, y, w, h]) => extrude(comps, rrRegion(x, y, w, h, 0.6, 2), BZ, BZ + 1.2));   // controllers
const ssd = part("SSD", "ssd", "major");   // a removable module on the board, not soldered down
extrude(ssd, rect(-52, -18, -42, -24), BZ, BZ + 1.2);
[-44, -32].forEach(x => extrude(ssd, rrRegion(x, -33, 5, 6, 0.4, 2), BZ + 1.2, BZ + 2.2));
extrude(ssd, rect(-54, -52, -40, -26), BZ, BZ + 2.6);   // its connector
const fports = part("Front Ports", "board", "minor");
FRONT.forEach(([x, [w, h]]) => extrude(fports, rect(x - w - 0.8, x + w + 0.8, -HW + 0.7, -HW + 9), PORT_Z - h - 1.5, PORT_Z + h + 1.5));
extrude(fports, rect(-21.5, -14.5, -HW + 0.7, -HW + 12), PORT_Z - 3.5, PORT_Z + 3.5);   // headphone jack
const rports = part("Rear Ports", "board", "minor");
REAR.forEach(([x, s]) => {
  if (s === "power") return;
  extrude(rports, rect(x - s[0] - 0.8, x + s[0] + 0.8, HW - 11, HW - 0.7), BZ, PORT_Z + s[1] + 1.5);
});

// ---------- the built-in power supply ----------
const psu = part("Power Supply", "psu", "major");
rrBody(psu, 0, 4, HW - 8, HW - 14, R - 6, [[0, PSU[0], true], [0, PSU[1], true]], { seg: 4 });
for (let x = -45; x <= 45; x += 9) line(psu, [x, -40, PSU[1] + 0.05], [x, 48, PSU[1] + 0.05]);
const inlet = part("Power Inlet", "psu", "minor");
extrude(inlet, rect(32, 44, HW - 12, HW - 0.7), BZ + 0.1, PSU[0]);
withFrame(RB, () => cyl(inlet, -38, PORT_Z, 4.6, -HW - 0.1, -HW + 0.7, 28));

// ---------- callouts and the tour ----------
const local = (name, p) => r3(name === "Fan" ? p.map((c, i) => c - FAN[i]) : p);
const hotspots = [
  ["Front USB-C", "Two ports, 10 Gb/s", [-36, -HW - 0.05, PORT_Z], ["Front Ports", "Enclosure"]],
  ["Headphone jack", "3.5 mm, on the front", [-18, -HW - 0.05, PORT_Z], ["Front Ports"]],
  ["Status light", "White when it's on", [40, -HW - 0.2, PORT_Z], ["Status Light"]],
  ["Thunderbolt 4", "Three on the back", [-22, HW + 0.05, PORT_Z], ["Rear Ports", "Enclosure"]],
  ["HDMI and Ethernet", "Next to the power socket", [14, HW + 0.05, PORT_Z], ["Rear Ports"]],
  ["Power supply", "Built in, no brick", [-30, -30, PSU[1]], ["Power Supply"]],
  ["M4 chip", "CPU, GPU and Neural Engine", [CHIP[0], CHIP[1], 17], ["M4 Chip", "Logic Board"]],
  ["Unified memory", "On the chip's package", [7.5, 9, 16.6], ["Unified Memory"]],
  ["SSD module", "Removable, on the board", [-35, -33, BZ + 2.2], ["SSD"]],
  ["Blower fan", "Pulls air up from underneath", [0, -30, 15], ["Fan", "Fan Housing"]],
  ["Fin stack", "Air leaves at the back", [20, 50, 14.8], ["Fin Stack", "Heat Pipes"]],
  ["Power button", "Underneath, rear corner", [-HW + 12, HW - 12, 0.6], ["Power Button"]],
].map(([t, s, p, o]) => ({ t, s, p: local(o[0], p), o }));
const pt = (name, p) => [...local(name, p), name];
const tour = {
  points: {
    intake: pt("Bottom Cover", [0, -58, FOOT - 0.05]), fan: pt("Fan", FAN), fins: pt("Fin Stack", [0, 45, 14.8]),
    out: pt("Enclosure", [0, HW + 0.05, 6.5]), chip: pt("M4 Chip", [CHIP[0], CHIP[1], 17]), plate: pt("Thermal Plate", [0, 4, 16.6]),
    pipe: pt("Heat Pipes", [7, 14, 16.1]), mem: pt("Unified Memory", [7.5, 9, 16.6]), ssd: pt("SSD", [-35, -33, BZ + 2.2]),
    psu: pt("Power Supply", [0, 0, PSU[1]]), inlet: pt("Power Inlet", [38, HW, PORT_Z]), rear: pt("Rear Ports", [-10, HW - 0.7, PORT_Z]),
    front: pt("Front Ports", [-36, -HW + 0.7, PORT_Z]), button: pt("Power Button", [-HW + 12, HW - 12, 0.6]),
  },
  steps: [
    { t: "Air in from underneath", focus: "fan", dist: 0.5, ex: 1, p: ["intake", "fan"], n: ["Bottom Cover", "Foot Ring", "Fan", "Fan Housing"], ms: 4200,
      d: "There are no vents on the sides or the top. A blower fan pulls cool air in through the gap round the foot ring, under the machine." },
    { t: "Through the fins, out the back", focus: "fins", dist: 0.5, ex: 1, p: ["fan", "fins", "out"], n: ["Fin Stack", "Fan Housing"], ms: 4200,
      d: "The blower pushes the air sideways through a fin stack and out of a slot low on the back." },
    { t: "Heat from the M4", focus: "chip", dist: 0.4, ex: 1, p: ["chip", "plate", "pipe", "fins"], n: ["M4 Chip", "Thermal Plate", "Heat Pipes"], ms: 4400,
      d: "The M4 sits on the underside of the logic board, face down on a thermal plate. Two heat pipes carry its heat back to the fins." },
    { t: "One chip, shared memory", focus: "chip", dist: 0.36, ex: 1, p: ["chip", "mem"], n: ["M4 Chip", "Unified Memory"], ms: 4200,
      d: "The CPU, GPU and Neural Engine share one pool of unified memory, mounted on the chip's own package: 16, 24 or 32 GB." },
    { t: "Storage on a module", focus: "ssd", dist: 0.4, ex: 1, p: ["ssd"], n: ["SSD"], ms: 3800,
      d: "The flash storage is on a small module that plugs into the board, rather than chips soldered to it." },
    { t: "Power inside", focus: "psu", dist: 0.45, ex: 1, p: ["psu", "inlet"], n: ["Power Supply", "Power Inlet"], ms: 3800,
      d: "The power supply fills the top of the case, so a single cable plugs straight into the back. No external brick." },
    { t: "Ports, front and back", focus: "rear", dist: 0.55, ex: 0, p: ["front", "rear", "button"], n: ["Front Ports", "Rear Ports", "Power Button"], ms: 4400,
      d: "Two USB-C ports and a headphone jack on the front; three Thunderbolt 4, HDMI and Gigabit Ethernet on the back. The power button is underneath, at the back left." },
  ],
};

const geometry = geometryScript("MM4_GEOMETRY", "macmini/build.js", { explode, hotspots, tour, constants: { HW, H } });
writeGeometry(HERE, geometry);
console.log(`models/macmini/geometry.js: ${geometry.stats}`);
