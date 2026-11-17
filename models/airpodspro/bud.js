/*
One AirPods Pro (2nd generation) earbud, as a reusable pure function: buildBud({ prefix, mirror, frame, moduleOf })
creates every part of one bud (the right one; mirror: true gives the left one) with kit/procedural.js and returns
what a caller needs to explode, label and animate it. Nothing happens when this file is required.

Drawn in mm in the bud's own frame: Z up, the stem's flat bottom end at z = 0, the nozzle pointing inward (-X for the
right bud) and a little forward and down. `frame` then places it (a case puts two buds in its slots);
`mirror` flips x first and fixes the triangles' winding, so a mirrored bud is not inside out.
Orientation the shaded styles need: a triangle's winding says which side is outside, and a mirror reverses it, so every
part's triangles are re-wound once the mirrored bud is built (lines don't care).

Sizes: 30.9 mm tall, about 21.8 mm wide with the ear tip, about 24 mm deep. The layout inside is estimated from
teardowns (driver in the bud behind the nozzle, battery and boards in the stem).
*/
"use strict";
const K = require("../../kit/procedural");
const { withFrame, part, line, loop, circlePts, rrPts, rrRegion, rect, fanRegion, extrude, sheet, rrBody, cyl, revolve, tube, loft } = K;

// ---------- small vector helpers ----------
const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const mul = (a, k) => a.map(v => v * k);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = a => mul(a, 1 / Math.hypot(...a));

// ---------- the bud's axes (bud frame) ----------
const C = [1.0, 0.4, 22.2];                       // centre of the bud body
const N = unit([-1, -0.25, -0.35]);                // the nozzle axis: towards the ear canal (in, forward, a little down)
const UP = unit(sub([0, 0, 1], mul(N, N[2])));    // "up" across the nozzle axis
const FWD = cross(UP, N);                          // forward (-y), so that FWD x UP = N
const AF = (a, b, s) => add(C, add(mul(FWD, a), add(mul(UP, b), mul(N, s))));   // a: forward, b: up, s: along the nozzle
const AROT = (a, b, s) => add(mul(FWD, a), add(mul(UP, b), mul(N, s)));         // the same turned only, about the origin
const ST = [1.9, 1.2];                             // the stem's centre (x, y); its flat end is at z = 0
const SX = (dx, dy, z) => [ST[0] + dx, ST[1] + dy, z];     // stem frame: x across, y front to back
const SFY = q => [ST[0] + q[0], ST[1] + q[2], q[1]];       // draws (x, z) on the stem's front and pushes along y
const STEM = { hw: 3.1, hh: 3.7, r: 2.6, top: 15.4, wall: 0.55 };

// the body: an egg of revolution about the nozzle axis, split by the seam at s = SEAM
const RS = 7.2, RR = 8.8, WALL = 0.7, SEAM = -0.9;
const outerR = s => RR * Math.sqrt(Math.max(0, 1 - (s / RS) ** 2));
const innerR = s => (RR - WALL) * Math.sqrt(Math.max(0, 1 - (s / (RS - WALL)) ** 2));
const sOuter = rho => RS * Math.sqrt(Math.max(0, 1 - (rho / RR) ** 2));
const HOLE = 3.3;                                   // the nozzle opening in the front half

// a profile of [r, z, hard] points made smooth: Catmull-Rom between them, `k` steps a span; the original points keep their flag
function smooth(pts, k) {
  const out = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const f = c => 0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3);
      out.push([f(0), f(1), j === 0 ? !!p1[2] : false]);
    }
  }
  out.push([...pts[pts.length - 1].slice(0, 2), !!pts[pts.length - 1][2]]);
  return out;
}

// default module of each part (the case may rename them through moduleOf)
const MODULE = {
  "Ear Tip": "tip", "Ear Tip Ring": "tip", "Ear Tip Mesh": "tip",
  "Nozzle": "nozzle", "Nozzle Mesh": "nozzle", "Nozzle Gasket": "nozzle",
  "Front Shell": "front", "Seam Gasket": "front", "IR Window": "front", "Inner Mic Mesh": "front",
  "Back Shell": "back", "Outer Grille": "back", "Beam Mic Mesh": "back", "Beam Mic": "back", "Vent Mesh": "back",
  "Driver Frame": "driver", "Magnet Yoke": "driver", "Neodymium Magnet": "driver", "Pole Plate": "driver", "Driver Gasket": "driver",
  "Diaphragm": "diaphragm", "Surround": "diaphragm", "Voice Coil": "diaphragm",
  "Back Volume": "backvol", "Vent Channel": "backvol",
  "Sensor Flex": "sensors", "IR Sensor": "sensors", "Inner Mic": "sensors", "Sensor Flex Tail": "sensors",
  "Main Flex": "board", "H2 Chip": "board", "Amplifier": "board", "Accelerometer": "board", "Board Passives": "board",
  "Battery": "battery", "Battery Tab": "battery",
  "Antenna Flex": "antenna",
  "Stem Shell": "stem", "Stem Mic Mesh": "stem",
  "Force Sensor": "force", "Force Flex": "force",
  "Stem Magnet": "stemmag",
  "Contact Flex": "contacts", "Charging Contact L": "contacts", "Charging Contact R": "contacts", "Stem Mic": "contacts",
  "Sound Wave 1": "waves", "Sound Wave 2": "waves", "Sound Wave 3": "waves", "Sound Wave 4": "waves",
  "Squeeze Ring": "squeezefx",
};

function buildBud({ prefix = "", mirror = false, frame = q => q, moduleOf = (name, def) => def } = {}) {
  const Mx = mirror ? q => [-q[0], q[1], q[2]] : q => q;
  const F = q => frame(Mx(q));
  const F0 = F([0, 0, 0]);
  const L = v => sub(F(v), F0);                    // the frame's turn alone (a direction)
  const made = [];
  const marks = [];                              // text printed on parts (the engine draws it): the H2's name
  const mk = (name, kind, spool) => {
    const p = part(prefix + name, moduleOf(name, MODULE[name]), kind, spool ? { spool: prefix + spool } : undefined);
    made.push(p);
    return p;
  };
  const inF = (g, fn) => withFrame(q => F(g(q)), fn);
  const A = q => AF(q[0], q[1], q[2]);
  const S = q => SX(q[0], q[1], q[2]);

  // a point on the outer (or inner) skin: theta round the nozzle axis (0 forward, 90 up), at s or at radius rho
  function skin(theta, o, inner) {
    const dir = add(mul(FWD, Math.cos(theta * Math.PI / 180)), mul(UP, Math.sin(theta * Math.PI / 180)));
    const s = o.s !== undefined ? o.s : sOuter(o.rho);
    const rho = inner ? innerR(s) : outerR(s);
    const R = inner ? RR - WALL : RR, Sx = inner ? RS - WALL : RS;
    const n = unit(add(mul(dir, rho / (R * R)), mul(N, s / (Sx * Sx))));    // outward normal of the egg
    const t1 = cross(N, dir), t2 = cross(n, t1);
    const P = add(C, add(mul(dir, rho), mul(N, s)));
    return q => add(P, add(mul(t1, q[0]), add(mul(t2, q[1]), mul(n, q[2]))));   // (u, v, w): w outward from the skin
  }

  // ---------- the egg's two halves ----------
  const ARC = 18 * Math.PI / 180;
  const skinPts = (R_, Sx, s0, s1) => {
    const t0 = Math.acos(Math.max(-1, Math.min(1, s0 / Sx))), t1 = Math.acos(Math.max(-1, Math.min(1, s1 / Sx)));
    const k = Math.max(2, Math.round(Math.abs(t1 - t0) / ARC));
    return Array.from({ length: k + 1 }, (_, i) => { const t = t0 + (t1 - t0) * i / k; return [R_ * Math.sin(t), Sx * Math.cos(t)]; });
  };
  const RI = RR - WALL, SI = RS - WALL;
  // meridian lines (6) along the outer skin, so the round shell has a drawing of its own
  const meridians = (p, pts) => {
    for (let k = 0; k < 4; k++) {
      const psi = k * Math.PI / 2 + Math.PI / 4;
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1];
        line(p, [a[0] * Math.cos(psi), a[0] * Math.sin(psi), a[1]], [b[0] * Math.cos(psi), b[0] * Math.sin(psi), b[1]]);
      }
    }
  };

  // front half: from the seam to the nozzle opening (towards the ear)
  {
    const p = mk("Front Shell", "major");
    const shi = SI * Math.sqrt(1 - (HOLE / RI) ** 2), sho = sOuter(HOLE);
    const outer = skinPts(RR, RS, SEAM, sho).map(([r, s], i, a) => [r, s, i % 3 === 0 || i === a.length - 1]);
    const inner = skinPts(RI, SI, shi, SEAM).map(([r, s], i, a) => [r, s, i === 0 || i === a.length - 1]);
    const prof = [...outer, ...inner];
    inF(A, () => {
      revolve(p, 0, 0, prof, 40, true);
      meridians(p, skinPts(RR, RS, SEAM, sho));
    });
  }
  // back half: from the seam to the outer pole
  {
    const p = mk("Back Shell", "major");
    const outer = skinPts(RR, RS, SEAM, -RS).map(([r, s], i, a) => [r, s, i % 3 === 0]);
    const inner = skinPts(RI, SI, -SI, SEAM).map(([r, s], i, a) => [r, s, i === a.length - 1]);
    inF(A, () => {
      revolve(p, 0, 0, [...outer, ...inner], 40, true);
      meridians(p, skinPts(RR, RS, SEAM, -RS));
    });
  }
  { // the adhesive gasket between the halves, a ledge inside the seam
    const p = mk("Seam Gasket", "minor");
    inF(A, () => revolve(p, 0, 0, [[7.3, SEAM, true], [8.0, SEAM, true], [8.0, SEAM + 0.3, true], [7.3, SEAM + 0.3, true]], 40, true));
  }

  // ---------- nozzle, mesh, gasket ----------
  {
    const p = mk("Nozzle", "major");
    inF(A, () => revolve(p, 0, 0, [[4.3, 4.9, true], [4.3, 5.4, true], [2.8, 5.4], [2.8, 7.7], [3.1, 7.8, true], [3.1, 8.2, true], [2.8, 8.3],
      [2.8, 11.6, true], [2.1, 11.6, true], [2.1, 4.9, true]], 32, true));
  }
  {
    const p = mk("Nozzle Gasket", "minor");
    inF(A, () => revolve(p, 0, 0, [[3.35, 5.4, true], [3.95, 5.4, true], [3.95, 5.6, true], [3.35, 5.6, true]], 32, true));
  }
  const meshDisc = (p, r, z, step) => {
    sheet(p, fanRegion(circlePts(0, 0, r, 20)), z);
    for (let x = -r + step; x < r - 0.01; x += step) {
      const h = Math.sqrt(r * r - x * x);
      line(p, [x, -h, z], [x, h, z]); line(p, [-h, x, z], [h, x, z]);
    }
  };
  { const p = mk("Nozzle Mesh", "minor"); inF(A, () => meshDisc(p, 2.05, 11.3, 0.5)); }

  // ---------- ear tip ----------
  {
    const p = mk("Ear Tip", "major");
    const outer = smooth([[4.4, 6.9, true], [5.7, 7.8], [6.4, 9.3], [6.5, 10.6, true], [6.0, 12.0], [4.8, 13.4], [3.5, 14.5], [3.0, 15.0, true]], 3);
    const inner = smooth([[2.4, 15.0, true], [2.4, 14.6], [3.0, 13.8], [4.3, 12.8], [5.5, 11.8], [5.95, 10.6, true], [5.85, 9.3], [5.2, 7.9], [3.95, 7.0, true]], 3);
    const prof = [...outer, ...inner];
    inF(A, () => revolve(p, 0, 0, prof, 36, true));
  }
  {
    const p = mk("Ear Tip Ring", "minor");
    inF(A, () => revolve(p, 0, 0, [[2.95, 6.9, true], [3.95, 6.9, true], [3.95, 8.6, true], [2.95, 8.6, true], [2.95, 8.3], [3.15, 8.3, true], [3.15, 7.7, true], [2.95, 7.7]], 32, true));
  }
  { const p = mk("Ear Tip Mesh", "minor"); inF(A, () => { meshDisc(p, 2.35, 14.3, 0.55); }); }

  // ---------- inserts in the skin: grille, vent, windows, microphone ports ----------
  const insert = (name, mod, theta, o, r, depth, holesFn) => {
    const p = mk(name, mod);
    inF(skin(theta, o, false), () => {
      cyl(p, 0, 0, r, -depth, 0.12, 24);
      if (holesFn) holesFn(p);
    });
    return p;
  };
  insert("Outer Grille", "minor", 100, { s: -3.9 }, 1.5, 0.5, p => {
    loop(p, circlePts(0, 0, 0.28, 8).map(q => [...q, 0.13]));
    circlePts(0, 0, 0.78, 6).forEach(c => loop(p, circlePts(c[0], c[1], 0.26, 8).map(q => [...q, 0.13])));
  });
  insert("Vent Mesh", "minor", 180, { s: -3.2 }, 1.0, 0.5, p => {
    [[-0.45, 0], [0.45, 0], [0, 0.0]].forEach(([x, y]) => loop(p, circlePts(x, y + (x === 0 ? 0 : 0), 0.2, 8).map(q => [...q, 0.13])));
  });
  insert("IR Window", "minor", Math.atan2(-5.0, 1.4) * 180 / Math.PI, { rho: Math.hypot(1.4, 5.0) }, 1.15, 0.6, p => {
    loop(p, circlePts(0, 0, 0.7, 16).map(q => [...q, 0.13]));
  });
  insert("Inner Mic Mesh", "minor", Math.atan2(-5.0, -0.8) * 180 / Math.PI, { rho: Math.hypot(0.8, 5.0) }, 0.55, 0.6, p => {
    [[-0.17, 0], [0.17, 0]].forEach(([x, y]) => loop(p, circlePts(x, y, 0.1, 6).map(q => [...q, 0.13])));
  });

  // the outward-facing (beamforming) mic: a mesh in a frame and the mic behind it, glued inside the back half
  {
    const g = skin(100, { s: -3.9 }, false);
    const p = mk("Beam Mic Mesh", "minor");
    inF(g, () => {
      revolve(p, 0, 0, [[0.95, -0.78, true], [1.4, -0.78, true], [1.4, -1.0, true], [0.95, -1.0, true]], 24, true);
      meshDisc(p, 0.95, -0.9, 0.3);
    });
    const m = mk("Beam Mic", "minor");
    inF(g, () => extrude(m, rrRegion(0, 0, 0.8, 0.8, 0.2, 2), -2.0, -1.05));
  }

  // ---------- the driver, from the ear side back: diaphragm, coil, frame, magnet, yoke ----------
  {
    const p = mk("Diaphragm", "major", "dia");
    inF(A, () => {
      revolve(p, 0, 0, [[0, 4.4, true], [0.7, 4.38], [1.4, 4.35, true], [2.0, 4.26], [2.6, 4.12, true], [3.4, 3.82], [3.8, 3.5, true]], 36);
    });
    const s = mk("Surround", "minor");
    inF(A, () => revolve(s, 0, 0, [[3.8, 3.5, true], [4.3, 3.85], [4.8, 3.9, true], [5.3, 3.75], [5.6, 3.55, true]], 36));
    const c = mk("Voice Coil", "minor", "coil");
    const wr = []; for (let z = 1.8; z <= 3.5001; z += 0.28) wr.push([3.85, z, true]);
    inF(A, () => revolve(c, 0, 0, [...wr, [3.45, 3.5, true], [3.45, 1.8, true]], 32, true));
  }
  {
    const p = mk("Driver Frame", "major");
    inF(A, () => {
      revolve(p, 0, 0, [[5.0, 0.2, true], [5.4, 0.2, true], [5.4, 3.2, true], [6.0, 3.2, true], [6.0, 3.5, true], [5.0, 3.5, true]], 40, true);
      for (let k = 0; k < 6; k++) {   // six small ports in the frame wall
        const a0 = (k * 60 + 30) * Math.PI / 180, da = 7 * Math.PI / 180;
        loop(p, [[-1, 1.2], [1, 1.2], [1, 2.5], [-1, 2.5]].map(([u, z]) => [5.41 * Math.cos(a0 + u * da), 5.41 * Math.sin(a0 + u * da), z]));
      }
    });
    const y = mk("Magnet Yoke", "minor");
    inF(A, () => revolve(y, 0, 0, [[0, -1.1, true], [4.6, -1.1, true], [4.6, 1.8, true], [4.2, 1.8, true], [4.2, -0.7, true], [0, -0.7, true]], 36, true));
    const m = mk("Neodymium Magnet", "major");
    inF(A, () => cyl(m, 0, 0, 3.1, -0.7, 1.5, 28));
    const pl = mk("Pole Plate", "minor");
    inF(A, () => cyl(pl, 0, 0, 3.1, 1.5, 1.8, 28));
    const g = mk("Driver Gasket", "minor");
    inF(A, () => revolve(g, 0, 0, [[5.5, 3.5, true], [6.3, 3.5, true], [6.3, 3.8, true], [5.5, 3.8, true]], 40, true));
  }
  { // the back volume (a sealed cup behind the magnet) and the channel to its pressure vent
    const p = mk("Back Volume", "major");
    inF(A, () => revolve(p, 0, 0, [[5.9, -1.1, true], [5.9, -1.5, true], [5.5, -1.5], [5.5, -4.4, true], [4.7, -5.1, true], [0, -5.1, true],
      [0, -4.75, true], [4.55, -4.75], [5.15, -4.2], [5.15, -1.1, true]], 36, true));
    const v = mk("Vent Channel", "minor");
    inF(A, () => tube(v, [[-5.5, 0, -3.2], [-6.3, 0, -3.2], [-7.05, 0, -3.2]], 0.5, 8));
  }

  // ---------- the optical sensor and the inward mic, on a small flex behind the front shell ----------
  {
    const f = mk("Sensor Flex", "minor");
    inF(A, () => extrude(f, rrRegion(0.7, -5.0, 1.9, 0.6, 0.4, 3), 3.9, 4.05));
    const ir = mk("IR Sensor", "minor");
    inF(A, () => { extrude(ir, rrRegion(1.4, -5.0, 0.75, 0.55, 0.1, 2), 4.05, 4.75); loop(ir, circlePts(1.4, -5.0, 0.3, 10).map(q => [...q, 4.76])); });
    const mic = mk("Inner Mic", "minor");
    inF(A, () => extrude(mic, rrRegion(-0.8, -5.0, 0.5, 0.5, 0.1, 2), 4.05, 4.55));
    const t = mk("Sensor Flex Tail", "minor");   // a ribbon (drawn as a tube) from the sensor flex down to a connector on the main flex
    inF(q => q, () => tube(t, [AF(0.2, -5.4, 4.0), AF(0.2, -6.3, 3.0), SX(-0.8, -2.3, 14.8), SX(-0.8, -1.85, 14.8)], 0.2, 6));
  }

  // ---------- the stem: shell with its flat end, the boards, battery, antenna and the rest ----------
  const capHoles = [[0.25, 2.15, -1.75, 0.55], [-2.15, -0.25, -1.75, 0.55], [-0.75, 0.75, 1.45, 2.15]];   // contacts and the mic port
  {
    const p = mk("Stem Shell", "major");
    inF(S, () => {
      const { hw, hh, r, top, wall } = STEM;
      extrude(p, rrRegion(0, 0, hw - 0.4, hh - 0.4, r - 0.4, 6, capHoles), 0, 0.8);
      const ring = (ins, z, hard) => ({ hard, pts: rrPts(0, 0, hw - ins, hh - ins, Math.max(r - ins, 0.1), 6).map(q => [q[0], q[1], z]) });
      loft(p, [ring(0.4, 0.8, true), ring(0, 1.6, true), ring(0, top, true), ring(wall, top, true), ring(wall, 0.8, false)]);
      const t = r, hx = hw - r, hy = hh - r;   // tangent lines where the arcs meet the straight sides
      [[hx, hh], [-hx, hh], [hx, -hh], [-hx, -hh], [hw, hy], [hw, -hy], [-hw, hy], [-hw, -hy]].forEach(([x, y]) => line(p, [x, y, 1.6], [x, y, top]));
      void t;
    });
    const m = mk("Stem Mic Mesh", "minor");
    inF(S, () => {
      sheet(m, rect(-0.7, 0.7, 1.5, 2.1), 0.35);
      for (let x = -0.4; x < 0.7; x += 0.3) line(m, [x, 1.5, 0.35], [x, 2.1, 0.35]);
      loop(m, [[-0.75, 1.45], [0.75, 1.45], [0.75, 2.15], [-0.75, 2.15]].map(q => [...q, 0.3]));
    });
  }
  { // the main flex (a tall rigid-flex card on the front side of the stem), the H2 and the little ones on it
    const p = mk("Main Flex", "major");
    withFrame(q => F(SFY(q)), () => {
      extrude(p, rrRegion(0, 9.3, 2.3, 5.9, 0.6, 3), -2.0, -1.8);
      [[-1.2, 4.2], [1.2, 4.2], [-1.2, 14.2], [1.2, 14.2]].forEach(([x, z]) => loop(p, circlePts(x, z, 0.25, 8).map(q => [q[0], q[1], -2.01])));
    });
    const h = mk("H2 Chip", "major");
    withFrame(q => F(SFY(q)), () => { extrude(h, rrRegion(0, 11.6, 1.7, 1.7, 0.2, 2), -2.55, -2.0); loop(h, circlePts(-1.1, 12.7, 0.2, 8).map(q => [q[0], q[1], -2.56])); });
    marks.push(K.textMark(prefix + "H2 Chip", "H2", -1.3, 1.3, 10.35, 12.0, -2.55, { T: q => F(SFY(q)), out: [0, 0, -1] }));   // the name printed on the chip
    const a = mk("Amplifier", "minor");
    withFrame(q => F(SFY(q)), () => extrude(a, rrRegion(0, 7.7, 1.0, 1.0, 0.1, 2), -1.8, -1.4));
    const ac = mk("Accelerometer", "minor");
    withFrame(q => F(SFY(q)), () => extrude(ac, rrRegion(0, 5.3, 0.8, 0.8, 0.1, 2), -1.8, -1.5));
    const pa = mk("Board Passives", "minor");
    withFrame(q => F(SFY(q)), () => [[-1.6, 9.2], [-1.6, 10.0], [1.5, 9.4], [1.5, 6.2], [-1.5, 6.6], [1.2, 14.8], [-1.2, 15.0]].forEach(([x, z]) => extrude(pa, rrRegion(x, z, 0.35, 0.2, 0.02, 1), -1.8, -1.55)));
  }
  { // the battery: a pillow cell
    const p = mk("Battery", "major");
    withFrame(q => F(SFY(q)), () => {
      rrBody(p, 0, 8.2, 2.3, 4.6, 0.9, [[0.5, -1.2, true], [0, -0.8, true], [0, 1.0, true], [0.5, 1.4, true]], { seg: 3 });
      line(p, [-1.2, 4.8, 1.41], [1.2, 4.8, 1.41]); line(p, [-1.2, 11.4, 1.41], [1.2, 11.4, 1.41]);
      line(p, [-1.2, 4.8, 1.41], [-1.2, 11.4, 1.41]); line(p, [1.2, 4.8, 1.41], [1.2, 11.4, 1.41]);
    });
    const t = mk("Battery Tab", "minor");
    withFrame(q => F(SFY(q)), () => { extrude(t, rect(-0.6, 0.6, 12.8, 14.6), 0.0, 0.2); extrude(t, rect(-0.6, 0.6, 13.8, 14.6), -1.0, 0.0); });
  }
  { // the antenna: a flex on the back wall with a meander trace
    const p = mk("Antenna Flex", "minor");
    withFrame(q => F(SFY(q)), () => {
      extrude(p, rrRegion(0, 7.9, 2.2, 7.0, 0.5, 3), 2.7, 2.9);
      const tr = []; for (let z = 1.6; z <= 14.2; z += 0.9) tr.push([(tr.length % 2 ? 1.4 : -1.4), z, 2.69]);
      for (let i = 0; i + 1 < tr.length; i++) line(p, tr[i], tr[i + 1]);
    });
  }
  { // the force sensor with its flex
    const p = mk("Force Sensor", "major", "squeeze");
    withFrame(q => F(SFY(q)), () => {
      rrBody(p, 0, 9.2, 1.9, 4.6, 0.7, [[0.3, -3.1, true], [0, -2.8, true], [0, -2.5, true], [0.3, -2.2, true]], { seg: 3 });
      for (let z = 5.6; z <= 12.8; z += 1.8) line(p, [-1.3, z, -2.19], [1.3, z, -2.19]);
      line(p, [-1.3, 5.6, -2.19], [-1.3, 12.8, -2.19]); line(p, [1.3, 5.6, -2.19], [1.3, 12.8, -2.19]);
    });
    const f = mk("Force Flex", "minor");
    withFrame(q => F(SFY(q)), () => { extrude(f, rrRegion(0, 3.4, 0.9, 1.1, 0.2, 2), -2.2, -2.05); extrude(f, rect(-0.6, 0.6, 4.2, 4.9), -2.9, -2.2); });
  }
  { const p = mk("Stem Magnet", "minor"); inF(S, () => { cyl(p, 0, 0.3, 1.3, 1.4, 3.2, 20); loop(p, circlePts(0, 0.3, 0.7, 14).map(q => [...q, 3.21])); }); }

  // ---------- out through the bottom: contact flex, the two gold contacts, the stem mic ----------
  {
    const f = mk("Contact Flex", "minor");
    inF(S, () => extrude(f, rrRegion(0, 0.3, 2.3, 2.5, 0.8, 4), 1.0, 1.2));
    [["Charging Contact L", -1.2], ["Charging Contact R", 1.2]].forEach(([name, x]) => {
      const c = mk(name, "minor");
      inF(S, () => {
        extrude(c, rrRegion(x, -0.6, 0.85, 1.15, 0.5, 3), -0.06, 0.8);
        extrude(c, rrRegion(x, -0.6, 1.15, 1.45, 0.5, 3), 0.8, 1.0);
        loop(c, circlePts(x, -0.6, 0.35, 10).map(q => [...q, -0.07]));
      });
    });
    const m = mk("Stem Mic", "minor");
    inF(S, () => extrude(m, rrRegion(0, 1.8, 0.9, 0.7, 0.1, 2), 1.2, 2.1));
  }

  // ---------- effects, lines only: sound waves from the nozzle and the squeeze ring ----------
  for (let k = 1; k <= 4; k++) {
    const p = mk("Sound Wave " + k, "minor", "wave" + k);
    const R0 = 8, phi = 36 * Math.PI / 180;
    withFrame(q => L(AROT(q[0], q[1], q[2])), () => {
      loop(p, circlePts(0, 0, R0 * Math.sin(phi), 28).map(q => [q[0], q[1], R0 * Math.cos(phi)]));
      for (let j = 0; j < 4; j++) {
        const psi = j * Math.PI / 2;
        for (let i = 0; i < 6; i++) {
          const a = phi * i / 6, b = phi * (i + 1) / 6;
          line(p, [R0 * Math.sin(a) * Math.cos(psi), R0 * Math.sin(a) * Math.sin(psi), R0 * Math.cos(a)], [R0 * Math.sin(b) * Math.cos(psi), R0 * Math.sin(b) * Math.sin(psi), R0 * Math.cos(b)]);
        }
      }
    });
  }
  {
    const p = mk("Squeeze Ring", "minor", "sqring");
    withFrame(q => L(q), () => {
      [-1.6, 1.6].forEach(z => loop(p, rrPts(0, 0, 5.0, 5.6, 3.6, 5).map(q => [q[0], q[1], z])));
      [[5.0, 0], [-5.0, 0], [0, 5.6], [0, -5.6]].forEach(([x, y]) => line(p, [x, y, -1.6], [x, y, 1.6]));
    });
  }

  // a mirrored bud keeps its outside outside: reverse the winding of every triangle
  if (mirror) made.forEach(p => { for (let i = 0; i < p.tris.length; i += 3) { const t = p.tris[i + 1]; p.tris[i + 1] = p.tris[i + 2]; p.tris[i + 2] = t; } });

  const info = {
    parts: made.map(p => p.name),
    prefix, mirror,
    P: F,                                           // a point of the bud frame, placed
    A: (a, b, s) => F(AF(a, b, s)),                  // a point along the nozzle axes, placed
    S: (dx, dy, z) => F(SX(dx, dy, z)),              // a point in the stem frame, placed
    skin: (theta, o, w = 0) => F(skin(theta, o, false)([0, 0, w])),
    dir: {                                           // unit directions, placed
      N: unit(L(N)), Up: unit(L(UP)), Fwd: unit(L(FWD)), Down: unit(L([0, 0, -1])),
      X: unit(L([1, 0, 0])), Y: unit(L([0, 1, 0])), Z: unit(L([0, 0, 1])),
    },
    waveBase: F(AF(0, 0, 9.6)),                      // the sound waves are drawn about this point
    squeezeBase: F(SX(0, 0, 9.0)),
    stemBase: F(SX(0, 0, 0)),
    modules: [...new Set(made.map(p => p.module))],
    marks,                                           // text printed on parts: pass them on in geometryScript's extras
  };
  return info;
}

module.exports = { buildBud, MODULE, geom: { C, N, UP, FWD, ST, STEM, RS, RR, WALL, SEAM, outerR, innerR, sOuter, AF, SX } };
