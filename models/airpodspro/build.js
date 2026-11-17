/*
AirPods Pro (2nd generation) earbud, exploded: builds its geometry.

Generated in code (kit/procedural.js) in mm, with the bud's geometry in bud.js (shared with the case model, which has
two of them). Z up, the stem's flat end at z = 0; the right bud's nozzle points inward (-X), forward and a little down.
It comes apart along its own axes: the ear tip, nozzle, front half, diaphragm, driver, back volume and back half slide
along the nozzle axis; the stem's boards slide sideways and the shell, contacts slide down.

    node models/airpodspro/build.js

Writes models/airpodspro/geometry.js.
*/
"use strict";
const { r3, geometryScript, writeGeometry, textMark } = require("../../kit/procedural");
const { buildBud, geom } = require("./bud");

const HERE = __dirname;
const info = buildBud({});
const d = info.dir;
const add = (a, b) => a.map((v, i) => v + b[i]);
const mul = (a, k) => a.map(v => v * k);
const along = (...pairs) => r3(pairs.reduce((s, [dir, k]) => add(s, mul(dir, k)), [0, 0, 0]));

const explode = {
  tip: along([d.N, 48]), waves: { offset: along([d.N, 26]), base: r3(info.waveBase) },
  nozzle: along([d.N, 34]), front: along([d.N, 20]), sensors: along([d.N, 12], [d.Up, -18]),
  diaphragm: along([d.N, 9]), driver: [0, 0, 0], backvol: along([d.N, -10]), back: along([d.N, -28]),
  board: along([d.X, 22]), battery: along([d.X, 46]), antenna: along([d.Y, 22]), force: along([d.Y, -22]),
  stemmag: along([d.X, 10], [d.Z, -8]), stem: along([d.Z, -32]), contacts: along([d.Z, -64]),
  squeezefx: { offset: [0, 0, 0], base: r3(info.squeezeBase) },
};

// ---------- callouts and the tour ----------
const A = (a, b, s) => r3(info.A(a, b, s)), S = (dx, dy, z) => r3(info.S(dx, dy, z));
const skin = (th, o, w) => r3(info.skin(th, o, w));
const IRTH = Math.atan2(-5.0, 1.4) * 180 / Math.PI, IRO = { rho: Math.hypot(1.4, 5.0) };
const MICTH = Math.atan2(-5.0, -0.8) * 180 / Math.PI, MICO = { rho: Math.hypot(0.8, 5.0) };
const hotspots = [
  ["Silicone ear tip", "13 mm across, seals the canal", A(6.5, 0, 10.6), ["Ear Tip"]],
  ["Acoustic mesh", "Keeps wax out of the tip", A(0, 0, 14.3), ["Ear Tip Mesh"]],
  ["Nozzle", "Sound leaves here, through a mesh", A(2.8, 0, 9.6), ["Nozzle", "Nozzle Mesh"]],
  ["Dynamic driver", "Diaphragm, coil and magnet", A(0, 0, 4.4), ["Diaphragm", "Voice Coil", "Neodymium Magnet", "Driver Frame"]],
  ["Neodymium magnet", "The field the coil moves in", A(3.1, 0, 0.4), ["Neodymium Magnet", "Magnet Yoke"]],
  ["Back volume", "A sealed cup behind the driver", A(0, 0, -5.1), ["Back Volume"]],
  ["Pressure vent", "Lets the back volume breathe", skin(180, { s: -3.2 }, 0.12), ["Vent Mesh", "Vent Channel"]],
  ["Outer microphone", "Faces out, for beamforming", skin(100, { s: -3.9 }, 0.12), ["Outer Grille", "Beam Mic Mesh", "Beam Mic"]],
  ["Inner microphone", "Listens inside the ear", skin(MICTH, MICO, 0.12), ["Inner Mic Mesh", "Inner Mic"]],
  ["Skin sensor", "Infrared: is the bud in an ear?", skin(IRTH, IRO, 0.12), ["IR Window", "IR Sensor"]],
  ["H2 chip", "Apple's own audio chip", S(0, -1.25, 11.6), ["H2 Chip", "Main Flex"]],
  ["Accelerometer", "Taps, speech, motion", S(0, -1.5, 5.3), ["Accelerometer", "Main Flex"]],
  ["Battery", "A pillow cell of about 50 mAh", S(0, 1.4, 8.2), ["Battery"]],
  ["Antenna", "A flex strip down the back wall", S(0, 2.69, 8), ["Antenna Flex"]],
  ["Force sensor", "Reads the squeeze on the stem", S(0, -3.1, 9.2), ["Force Sensor"]],
  ["Charging contacts", "Two gold pads at the foot", S(-1.2, -0.6, -0.07), ["Charging Contact L", "Charging Contact R"]],
  ["Stem microphone", "Third mic, at the bottom", S(0, 1.8, 0.35), ["Stem Mic Mesh", "Stem Mic"]],
  ["Case magnet", "Pulls the bud into the case", S(0, 0.3, 3.21), ["Stem Magnet"]],
].map(([t, s, p, o]) => ({ t, s, p, o }));

const pt = (name, p) => [...p, name];
const tour = {
  points: {
    tip: pt("Ear Tip", A(6.5, 0, 10.6)), tipMesh: pt("Ear Tip Mesh", A(0, 0, 14.3)), nozzle: pt("Nozzle", A(2.8, 0, 9.6)),
    driver: pt("Diaphragm", A(0, 0, 4.4)), magnet: pt("Neodymium Magnet", A(3.1, 0, 0.4)), coil: pt("Voice Coil", A(3.85, 0, 2.6)),
    backvol: pt("Back Volume", A(0, 0, -5.1)), vent: pt("Vent Mesh", skin(180, { s: -3.2 }, 0.12)), channel: pt("Vent Channel", A(-6.3, 0, -3.2)),
    outer: pt("Outer Grille", skin(100, { s: -3.9 }, 0.12)), beam: pt("Beam Mic", A(0.3, 7.0, -3.2)), inner: pt("Inner Mic", A(-0.8, -5.0, 4.5)),
    stemMic: pt("Stem Mic Mesh", S(0, 1.8, 0.35)), h2: pt("H2 Chip", S(0, -1.25, 11.6)), amp: pt("Amplifier", S(0, -1.4, 7.7)),
    accel: pt("Accelerometer", S(0, -1.5, 5.3)), ir: pt("IR Sensor", A(1.4, -5.0, 4.75)), battery: pt("Battery", S(0, 1.4, 8.2)),
    contacts: pt("Charging Contact L", S(-1.2, -0.6, -0.07)), magnetStem: pt("Stem Magnet", S(0, 0.3, 3.21)),
    force: pt("Force Sensor", S(0, -3.1, 9.2)), ring: pt("Squeeze Ring", r3(info.squeezeBase)),
  },
  steps: [
    { t: "The ear tip seals the ear", focus: "tip", dist: 0.5, ex: 1, p: ["tip", "tipMesh", "nozzle"], n: ["Ear Tip", "Ear Tip Ring", "Ear Tip Mesh", "Nozzle"], ms: 4400,
      d: "A silicone dome, 13 mm across, presses against the canal wall so sound is not lost and outside noise is shut out. Its stiff inner ring clicks onto the nozzle." },
    { t: "The driver makes the sound", focus: "driver", dist: 0.42, ex: 1, p: ["driver", "coil", "magnet"], n: ["Diaphragm", "Surround", "Voice Coil", "Neodymium Magnet", "Magnet Yoke", "Driver Frame"], ms: 4600,
      d: "The audio current runs through a voice coil in the field of a neodymium magnet. The coil pushes the diaphragm in and out, and that moves the air as sound." },
    { t: "Pressure and the vent", focus: "backvol", dist: 0.42, ex: 1, p: ["backvol", "channel", "vent"], n: ["Back Volume", "Vent Channel", "Vent Mesh"], ms: 4400,
      d: "Behind the diaphragm a sealed chamber sets how the driver sounds at low frequencies. A narrow channel and a fine mesh vent let the pressure inside equalise with the outside." },
    { t: "Three microphones", focus: "outer", dist: 0.42, ex: 1, p: ["outer", "beam", "inner", "stemMic"], n: ["Outer Grille", "Beam Mic Mesh", "Beam Mic", "Inner Mic", "Inner Mic Mesh", "Stem Mic", "Stem Mic Mesh"], ms: 4600,
      d: "One mic faces out and one at the stem's end: together they pick up your voice and the noise around you, for beamforming and noise cancelling. A mic facing into the ear hears what reaches the eardrum." },
    { t: "Chip and sensors", focus: "h2", dist: 0.42, ex: 1, p: ["h2", "amp", "accel", "ir"], n: ["H2 Chip", "Amplifier", "Accelerometer", "Main Flex", "IR Sensor", "Sensor Flex"], ms: 4600,
      d: "The H2 chip does the audio processing and the wireless link. An infrared sensor sees skin and pauses the music when the bud is out; an accelerometer feels taps and speech." },
    { t: "Battery and contacts", focus: "battery", dist: 0.5, ex: 1, p: ["battery", "magnetStem", "contacts"], n: ["Battery", "Battery Tab", "Charging Contact L", "Charging Contact R", "Contact Flex", "Stem Magnet", "Antenna Flex"], ms: 4400,
      d: "A tiny pillow cell of about 50 mAh powers it for hours. Two gold contacts at the foot charge it in the case, where a small magnet pulls the stem into place; a flex antenna runs the length of the stem." },
    { t: "The squeeze", focus: "force", dist: 0.5, ex: 1, p: ["force", "ring"], n: ["Force Sensor", "Force Flex", "Squeeze Ring"], ms: 4600,
      d: "Squeeze the stem and a force sensor in its wall feels the pressure. The bud turns that gesture into play, pause or a change of listening mode." },
  ],
};

const constants = { N: r3(d.N), Y: r3(d.Y), Z: r3(d.Z), dia: 0.35 };
const geometry = geometryScript("APP_GEOMETRY", "airpodspro/build.js", { explode, hotspots, tour, constants, marks: info.marks });
writeGeometry(HERE, geometry);
console.log(`models/airpodspro/geometry.js: ${geometry.stats}`);
