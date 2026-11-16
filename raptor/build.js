/*
Full-flow staged-combustion rocket engine on a test stand: builds the model page and adds it to the gallery.

After the "Raptor 2" figure in Anatomy (github.com/wheresryan22/anatomy, MIT, by Ryan), rebuilt as a 3D blueprint model
at full size: a methane / liquid-oxygen engine about 3.1 m tall hanging from the thrust frame of a vertical test
stand. Both propellants go through their own turbopump, each driven by its own preburner (oxygen-rich on the oxygen
side, fuel-rich on the methane side), and all of both flows reach the main chamber as hot gas: full-flow staged
combustion. Methane cools the nozzle first, down the downcomer to the nozzle's manifold and up its wall tubes.

Designed in mm with the gimbal's pivot at the origin and Z up, and packed in cm (the stand is 4.7 m tall, past the
Int16 range in mm), so everything exported (explode offsets, callouts, tour points) goes through S() as well. The
exhaust plume is a lines-only part that model.js fades in and out on a firing cycle.

    node raptor/build.js

Writes raptor/index.html (the page on its own) and replaces or inserts the model in index.html.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { read, withFrame, part, line, loop, circlePts, rrPts, rrRegion, rect, extrude, rrBody, cyl, revolve, tube,
  r3, geometryScript, buildPage, addToGallery } = require("../lib/procedural");

const HERE = __dirname;
const S = p => p.map(c => c / 10);                     // mm → cm, for everything packed or exported
const FX = q => [q[2], q[0], q[1]];
const FY = q => [q[0], q[2], q[1]];
// ---------- the engine (mm, the gimbal's pivot at the origin) ----------
const THROAT = [175, -1080], EXIT_R = 650, EXIT_Z = -3050;
const bell = u => [190 + (EXIT_R - 190) * Math.pow(u, 0.6), -1120 + (EXIT_Z + 1120) * u];   // the nozzle's contour, u = 0 at the throat
const nozzleR = z => { let u = 0; for (let i = 0; i < 40; i++) u = Math.min(1, Math.max(0, (z + 1120) / (EXIT_Z + 1120))); return bell(u)[0]; };
const MANIFOLD_Z = -1700, MANIFOLD_R = nozzleR(MANIFOLD_Z) + 40;
const OTP = [540, 0], FTP = [-540, 0];                 // the turbopumps' axes
// ---------- the stand ----------
const COL = [1250, 950], GROUND = -4300, TOP = 420, DECK_Z = -1350;

const explode = {
  stand: [0, 0, 0], frame: [0, 0, 70], gimbal: [0, 0, 35], chamber: [0, 0, 0], nozzle: [0, 0, -75], otp: [70, 0, 10], ftp: [-70, 0, 10],
  hotgas: [0, 0, 22], lox: [55, -45, 45], fuel: [-55, -45, 45], downcomer: [-95, 0, -30], controller: [0, 80, 0], plume: [0, 0, -75],
};

withFrame(S, () => {
// ---------- test stand ----------
const columns = part("Stand Columns", "stand", "major");
[[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
  rrBody(columns, sx * COL[0], sy * COL[1], 90, 90, 6, [[0, GROUND + 60, true], [0, TOP, true]], { seg: 2 });
  rrBody(columns, sx * COL[0], sy * COL[1], 170, 170, 8, [[0, GROUND, true], [0, GROUND + 60, true]], { seg: 2 });   // base plates
  for (let z = GROUND + 400; z < TOP - 200; z += 600) loop(columns, rrPts(sx * COL[0], sy * COL[1], 92, 92, 6, 2).map(q => [...q, z]));   // splice bands
});
const beams = part("Stand Beams", "stand", "major");
[-1, 1].forEach(s => {
  extrude(beams, rect(-COL[0] - 90, COL[0] + 90, s * COL[1] - 80, s * COL[1] + 80), TOP - 220, TOP);   // the two long top beams
  withFrame(FX, () => extrude(beams, rect(-COL[1] - 90, COL[1] + 90, TOP - 200, TOP - 20), s * COL[0] - 70, s * COL[0] + 70));
});
const deck = part("Deck", "stand", "major");
extrude(deck, rrRegion(0, 0, COL[0] + 250, COL[1] + 250, 20, 4, [[-560, 560, -560, 560]]), DECK_Z - 40, DECK_Z);
for (let x = -COL[0] - 200; x <= COL[0] + 200; x += 100) if (Math.abs(x) > 600) line(deck, [x, -COL[1] - 240, DECK_Z + 2], [x, COL[1] + 240, DECK_Z + 2]);   // grating
const rails = part("Deck Rails", "stand", "minor");
[1].forEach(s => {   // the back only: a front rail would hide the engine
  [DECK_Z + 1050, DECK_Z + 550].forEach(z => tube(rails, [[-COL[0] - 240, s * (COL[1] + 240), z], [COL[0] + 240, s * (COL[1] + 240), z]], 20, 8));
  for (let x = -COL[0] - 240; x <= COL[0] + 240; x += (2 * COL[0] + 480) / 6) tube(rails, [[x, s * (COL[1] + 240), DECK_Z], [x, s * (COL[1] + 240), DECK_Z + 1050]], 18, 8);
});
const deflector = part("Flame Deflector", "stand", "major");
revolve(deflector, 0, 0, [[0, GROUND + 520], [180, GROUND + 380, true], [900, GROUND + 60, true], [900, GROUND, true], [0, GROUND]], 64);
const deluge = part("Deluge Ring", "stand", "minor");
tube(deluge, [...circlePts(0, 0, 1050, 48), [1050, 0]].map(([x, y]) => [x, y, GROUND + 120]), 45, 10);
for (let k = 0; k < 24; k++) { const a = 2 * Math.PI * k / 24; cyl(deluge, 1000 * Math.cos(a), 1000 * Math.sin(a), 14, GROUND + 140, GROUND + 190, 8); }   // nozzles spraying water at the plume
tube(deluge, [[1050, 0, GROUND + 120], [COL[0] - 100, 0, GROUND + 120], [COL[0] - 100, 0, GROUND + 60]], 45, 10);

// the thrust frame: crosshead, load cell, thrust puck
const crosshead = part("Crosshead", "frame", "major");
extrude(crosshead, rect(-COL[0], COL[0], -150, 150), TOP - 220 - 260, TOP - 220);
withFrame(FY, () => [-150, 150].forEach(y => { for (let x = -COL[0] + 150; x < COL[0]; x += 300) line(crosshead, [x, TOP - 470, y + Math.sign(y) * 0.5], [x + 150, TOP - 230, y + Math.sign(y) * 0.5]); }));   // web stiffeners
const loadcell = part("Load Cell", "frame", "major");
cyl(loadcell, 0, 0, 150, 170, 210, 40);
revolve(loadcell, 0, 0, [[110, 210, true], [110, 300, true], [150, 300, true], [150, TOP - 480, true], [0, TOP - 480]], 40);
tube(loadcell, [[150, 0, 260], [420, 0, 260], [600, 160, TOP - 300]], 9, 8);   // its signal cable

// ---------- the engine ----------
const gimbal = part("Gimbal", "gimbal", "major");
cyl(gimbal, 0, 0, 190, 120, 170, 48);                                            // the thrust puck
revolve(gimbal, 0, 0, [[0, 120], [150, 120, true], [150, 40, true], [110, 0], [150, -40, true], [150, -150, true], [0, -150]], 40);   // the gimbal's block round its pivot
[-1, 1].forEach(s => withFrame(FX, () => cyl(gimbal, 0, 0, 55, s * 150, s * 185, 24)));   // trunnions
const actuators = part("Gimbal Actuators", "gimbal", "minor");
[[0, -1], [1, 0]].forEach(([ax, ay]) => {
  const top = [ax * 900, ay * 900, TOP - 480], end = [ax * 330, ay * 330, -820];
  tube(actuators, [top, [top[0] * 0.8 + end[0] * 0.2, top[1] * 0.8 + end[1] * 0.2, top[2] * 0.8 + end[2] * 0.2]], 70, 16);   // cylinder
  tube(actuators, [[top[0] * 0.78 + end[0] * 0.22, top[1] * 0.78 + end[1] * 0.22, top[2] * 0.78 + end[2] * 0.22], end], 35, 12);   // rod
});
const injector = part("Injector", "chamber", "major");
revolve(injector, 0, 0, [[0, -150], [150, -165, true], [270, -250], [310, -380, true], [310, -460, true], [0, -460]], 56);
for (let k = 0; k < 24; k++) { const a = 2 * Math.PI * k / 24; cyl(injector, 330 * Math.cos(a), 330 * Math.sin(a), 16, -460, -420, 10); }   // the flange's bolts
const chamber = part("Main Chamber", "chamber", "major");
revolve(chamber, 0, 0, [[330, -440, true], [330, -480, true], [300, -480, true], [300, -880, true], [255, -990], [THROAT[0], THROAT[1], true], [190, -1120, true]], 56);
[-560, -660, -760].forEach(z => tube(chamber, [...circlePts(0, 0, 306, 40), [306, 0]].map(([x, y]) => [x, y, z]), 9, 6));   // the cooling jacket's bands
const nozzle = part("Nozzle", "nozzle", "major");
{
  const prof = [[190, -1120, true]];
  for (let i = 1; i <= 18; i++) prof.push(bell(i / 18));
  prof[prof.length - 1].push(true);
  prof.push([EXIT_R + 18, EXIT_Z, true], [EXIT_R + 18, EXIT_Z + 50, true]);   // the stiffening lip
  revolve(nozzle, 0, 0, prof, 72);
  for (let k = 0; k < 72; k++) {   // the wall's cooling tubes, top to bottom
    const a = 2 * Math.PI * k / 72; let prev = null;
    for (let i = 0; i <= 18; i++) { const [r, z] = bell(i / 18), q = [(r + 2) * Math.cos(a), (r + 2) * Math.sin(a), z]; if (prev) line(nozzle, prev, q); prev = q; }
  }
}
const nmanifold = part("Nozzle Manifold", "nozzle", "minor");
tube(nmanifold, [...circlePts(0, 0, MANIFOLD_R, 56), [MANIFOLD_R, 0]].map(([x, y]) => [x, y, MANIFOLD_Z]), 45, 12);

// the two turbopumps and their preburners, either side of the chamber
function turbopump(p, pre, [x, y], side) {
  revolve(p, x, y, [[0, -1000], [150, -1000, true], [260, -930, true], [270, -860], [200, -800, true], [170, -760, true], [190, -700, true], [190, -520, true], [150, -480, true], [0, -480]], 40);   // pump volute, shaft housing, turbine
  for (let z = -680; z >= -760; z -= 40) loop(p, circlePts(x, y, 192, 32).map(q => [...q, z]));
  tube(p, [[x + side * 150, y, -900], [x + side * 330, y, -900], [x + side * 330, y, -760]], 70, 14);   // pump discharge
  revolve(pre, x, y, [[0, -480], [160, -480, true], [160, -430, true], [130, -420], [130, -160, true], [100, -120], [0, -100]], 36);   // the preburner on top of its turbine
  for (let k = 0; k < 8; k++) { const a = 2 * Math.PI * k / 8; cyl(pre, x + 172 * Math.cos(a), y + 172 * Math.sin(a), 10, -470, -440, 8); }
  cyl(pre, x - side * 70, y + 90, 22, -200, -120, 10);   // igniter
}
const otp = part("Oxygen Turbopump", "otp", "major"), orpb = part("Oxygen-Rich Preburner", "otp", "major");
turbopump(otp, orpb, OTP, 1);
const ftp = part("Methane Turbopump", "ftp", "major"), frpb = part("Fuel-Rich Preburner", "ftp", "major");
turbopump(ftp, frpb, FTP, -1);
const hotgas = part("Hot-Gas Manifolds", "hotgas", "major");
[[OTP, 1], [FTP, -1]].forEach(([[x, y], s]) => tube(hotgas, [[x - s * 150, y, -560], [x - s * 260, y, -520], [s * 300, 0, -400], [s * 230, 0, -300]], 95, 16));
// propellant inlets: oxygen and methane come down from the vehicle above
const lox = part("Oxygen Inlet Duct", "lox", "major");
tube(lox, [[OTP[0] + 120, -560, TOP - 480], [OTP[0] + 120, -560, -300], [OTP[0] + 120, -320, -940], [OTP[0] + 10, -150, -960]], 105, 16);
revolve(lox, OTP[0] + 120, -560, [[150, TOP - 520, true], [150, TOP - 480, true], [0, TOP - 480]], 32);   // the flange at the vehicle's interface
const mov = part("Main Oxygen Valve", "lox", "minor");
rrBody(mov, OTP[0] + 120, -560, 150, 150, 30, [[0, -420, true], [0, -200, true]], { seg: 3 });
withFrame(FX, () => cyl(mov, -560, -310, 60, OTP[0] + 270, OTP[0] + 360, 20));   // its actuator
const fuel = part("Methane Inlet Duct", "fuel", "major");
tube(fuel, [[FTP[0] - 120, -560, TOP - 480], [FTP[0] - 120, -560, -300], [FTP[0] - 120, -320, -940], [FTP[0] - 10, -150, -960]], 85, 16);
revolve(fuel, FTP[0] - 120, -560, [[130, TOP - 520, true], [130, TOP - 480, true], [0, TOP - 480]], 32);
const downcomer = part("Downcomer", "downcomer", "major");
tube(downcomer, [[FTP[0] - 330, 0, -760], [FTP[0] - 330, 0, -1100], [-MANIFOLD_R - 60, 0, -1500], [-MANIFOLD_R - 20, 0, MANIFOLD_Z + 30]], 70, 14);
const mfv = part("Main Fuel Valve", "downcomer", "minor");
withFrame(FX, () => rrBody(mfv, 0, -1000, 130, 110, 20, [[0, FTP[0] - 470, true], [0, FTP[0] - 190, true]], { seg: 3 }));
cyl(mfv, FTP[0] - 330, 140, 50, -1060, -940, 20);
const jacket = part("Jacket Return", "downcomer", "minor");
tube(jacket, [[-200, -260, -1000], [-300, -380, -800], [FTP[0] + 60, -200, -470]], 40, 10);   // warmed methane back up from the chamber's jacket to the fuel-rich preburner
const controller = part("Engine Controller", "controller", "major");
rrBody(controller, 0, 520, 230, 90, 12, [[0, -1050, true], [0, -650, true]], { seg: 3 });
for (let z = -1010; z <= -700; z += 34) line(controller, [-200, 610.5, z], [200, 610.5, z]);   // its fins
extrude(controller, rect(-140, 140, 300, 430), -880, -840);   // bracket to the chamber
const harness = part("Harness", "controller", "minor");
[[[-150, 430, -700], [-300, 300, -560], [FTP[0] + 80, 140, -300]], [[150, 430, -700], [300, 300, -560], [OTP[0] - 80, 140, -300]], [[-120, 430, -1000], [-400, 200, -1050], [FTP[0] - 330, 120, -1000]], [[120, 430, -1000], [450, 100, -600], [OTP[0] + 120, -400, -330]]]
  .forEach(r => tube(harness, r, 16, 8));

// the exhaust plume with its shock diamonds: lines only, faded in and out by model.js
const plume = part("Exhaust Plume", "plume", "minor");
{
  const L = GROUND + 560 - EXIT_Z, cells = 4;
  const rAt = u => EXIT_R * (0.9 - 0.25 * u) * (1 - 0.18 * Math.abs(Math.sin(Math.PI * cells * u)));
  for (let i = 0; i <= 12; i++) { const u = i / 12; loop(plume, circlePts(0, 0, rAt(u), 48).map(q => [...q, EXIT_Z + L * u])); }
  for (let k = 0; k < 16; k++) {
    const a = 2 * Math.PI * k / 16; let prev = null;
    for (let i = 0; i <= 48; i++) { const u = i / 48, r = rAt(u), q = [r * Math.cos(a), r * Math.sin(a), EXIT_Z + L * u]; if (prev) line(plume, prev, q); prev = q; }
  }
  for (let c = 0; c < cells; c++) {   // the bright disc of each Mach diamond
    const u = (c + 0.5) / cells, z = EXIT_Z + L * u;
    loop(plume, circlePts(0, 0, rAt(u) * 0.55, 36).map(q => [...q, z]));
    for (let k = 0; k < 12; k++) { const a = Math.PI * k / 6; line(plume, [rAt(u) * 0.55 * Math.cos(a), rAt(u) * 0.55 * Math.sin(a), z], [0, 0, z]); }
  }
}
});

// ---------- callouts and the tour (designed in mm, exported in cm) ----------
const X = p => r3(S(p));
const hotspots = [
  ["Thrust frame", "The load cell weighs the thrust", [0, 150, 300], ["Load Cell", "Crosshead"]],
  ["Gimbal", "Steers the engine by ±15°", [150, 0, -40], ["Gimbal", "Gimbal Actuators"]],
  ["Oxygen turbopump", "Driven by oxygen-rich gas", [OTP[0] + 270, 0, -860], ["Oxygen Turbopump", "Oxygen-Rich Preburner"]],
  ["Methane turbopump", "Driven by fuel-rich gas", [FTP[0] - 270, 0, -860], ["Methane Turbopump", "Fuel-Rich Preburner"]],
  ["Hot-gas manifolds", "Both turbines' exhaust into the injector", [300, 0, -400], ["Hot-Gas Manifolds"]],
  ["Main chamber", "About 300 bar", [300, 0, -700], ["Main Chamber", "Injector"]],
  ["Downcomer", "Methane to cool the nozzle first", [-MANIFOLD_R - 60, 0, -1500], ["Downcomer", "Main Fuel Valve"]],
  ["Nozzle", "Cooled by its own fuel", [nozzleR(-2400), 0, -2400], ["Nozzle", "Nozzle Manifold"]],
  ["Engine controller", "Valves, igniters, sensors", [0, 610, -850], ["Engine Controller", "Harness"]],
  ["Flame deflector", "Turns the plume aside, under water", [500, 0, GROUND + 220], ["Flame Deflector", "Deluge Ring"]],
].map(([t, s, p, o]) => ({ t, s, p: X(p), o }));
const pt = (name, p) => [...X(p), name];
const tour = {
  points: {
    lox: pt("Oxygen Inlet Duct", [OTP[0] + 120, -560, 0]), ch4: pt("Methane Inlet Duct", [FTP[0] - 120, -560, 0]),
    otp: pt("Oxygen Turbopump", [OTP[0], 0, -860]), ftp: pt("Methane Turbopump", [FTP[0], 0, -860]), orpb: pt("Oxygen-Rich Preburner", [OTP[0], 0, -300]), frpb: pt("Fuel-Rich Preburner", [FTP[0], 0, -300]),
    hot: pt("Hot-Gas Manifolds", [300, 0, -400]), inj: pt("Injector", [0, 0, -300]), throat: pt("Main Chamber", [THROAT[0], 0, THROAT[1]]),
    down: pt("Downcomer", [-MANIFOLD_R - 60, 0, -1500]), mani: pt("Nozzle Manifold", [-MANIFOLD_R, 0, MANIFOLD_Z]), exit: pt("Nozzle", [EXIT_R, 0, EXIT_Z]),
    cell: pt("Load Cell", [0, 0, 300]), plume: pt("Exhaust Plume", [0, 0, -3500]),
  },
  steps: [
    { t: "Two cold propellants", focus: "otp", dist: 0.55, ex: 1, p: ["lox", "otp", "ch4", "ftp"], n: ["Oxygen Inlet Duct", "Methane Inlet Duct", "Main Oxygen Valve", "Oxygen Turbopump", "Methane Turbopump"], ms: 4600,
      d: "Liquid oxygen at −183 °C and liquid methane at −162 °C come down from the vehicle's tanks, each into its own turbopump." },
    { t: "Each pump has its own preburner", focus: "orpb", dist: 0.55, ex: 1, p: ["orpb", "otp", "frpb", "ftp"], n: ["Oxygen-Rich Preburner", "Fuel-Rich Preburner", "Oxygen Turbopump", "Methane Turbopump"], ms: 4800,
      d: "A little methane burns in nearly all the oxygen to drive the oxygen pump's turbine; a little oxygen burns in nearly all the methane to drive the methane pump's. Neither gas is hot enough to melt its turbine." },
    { t: "Full flow: everything ends up in the chamber", focus: "hot", dist: 0.55, ex: 1, p: ["orpb", "hot", "inj", "frpb"], n: ["Hot-Gas Manifolds", "Injector", "Main Chamber"], ms: 4800,
      d: "Nothing is dumped overboard. Both turbines' exhaust, oxygen-rich and fuel-rich gas, goes on through the hot-gas manifolds to the injector, where they meet and burn at about 300 bar." },
    { t: "The fuel cools the engine first", focus: "down", dist: 0.6, ex: 1, p: ["ftp", "down", "mani", "throat"], n: ["Downcomer", "Main Fuel Valve", "Nozzle Manifold", "Nozzle", "Jacket Return"], ms: 4800,
      d: "Methane from its pump runs down the downcomer to a manifold on the nozzle and up through the channels in its wall and the chamber's jacket, keeping metal next to 3,500 °C gas cool enough to survive." },
    { t: "Thrust", focus: "exit", dist: 0.75, ex: 0, p: ["throat", "exit", "plume"], n: ["Nozzle", "Exhaust Plume", "Main Chamber"], ms: 4600,
      d: "The gas speeds through the narrow throat and expands down the bell to over 3 km/s. The bright rings in the plume are shock diamonds, where the exhaust over- and under-shoots the air's pressure." },
    { t: "On the test stand", focus: "cell", dist: 0.8, ex: 0, p: ["cell", "plume"], n: ["Load Cell", "Crosshead", "Flame Deflector", "Deluge Ring"], ms: 4400,
      d: "The engine hangs from a load cell that measures its thrust, about 230 tonnes-force. Below, a water-cooled deflector turns the plume aside and a deluge ring sprays water to soak up heat and sound." },
  ],
};

// ---------- page and gallery ----------
const geometry = geometryScript("RE_GEOMETRY", "raptor/build.js", { explode, hotspots, tour });
const html = buildPage({ template: "cpu", geometry: geometry.js, model: read(path.join(HERE, "model.js")), swaps: [
  [/<title>[^<]*<\/title>/, "<title>Rocket Engine Test Stand</title>"],
  [/(<canvas id="scene" aria-label=")[^"]*"/, "$1Line drawing of a full-flow staged-combustion methane rocket engine firing on a vertical test stand: on hover the turbopumps, preburners, ducts, nozzle and controller move apart\""],
  [/(<div id="hotspots" aria-label=")[^"]*"/, "$1Engine parts\""],
  [/<a class="mark" href="#top">.*?<\/a>/, '<a class="mark" href="#top"><b>Rocket Engine</b><span>Full-flow, on a test stand</span></a>'],
  [/<div class="dwg" aria-hidden="true">.*?<\/div>/,
    '<div class="dwg" aria-hidden="true">DWG RE-001 &middot; Rev A<br>Units cm &middot; View az 35&deg; / el 12&deg;<br>After &ldquo;Raptor 2&rdquo; in Anatomy by Ryan (MIT); concept, not affiliated with SpaceX</div>'],
] });
fs.writeFileSync(path.join(HERE, "index.html"), html);
const count = addToGallery({ id: "raptor", label: "Rocket Engine (Raptor-class)", kind: "engine", tags: "rocket engine raptor methane full flow staged combustion turbopump preburner nozzle test stand plume spacex animated anatomy",
  key: "re-theme", category: "Engines", html }, "v8");
console.log(`raptor/index.html ${(html.length / 1e6).toFixed(2)} MB, ${geometry.stats}; index.html now has ${count} models`);
