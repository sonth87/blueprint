// TF-9 turbofan: the model script for the blueprint engine (src/engine.js), which build_pages.py inlines after it.
// The engine's modules slide apart along its axis, the fan and the two spools keep turning, and "." follows
// the air through it from the fan to the exhaust.
(function () {
  "use strict";
  const G = window.TF_GEOMETRY;
  const C = G.constants;
  // a point on the engine: axial station x, radius r, angle around the axis (Blender mm and degrees)
  const polar = (x, r, deg) => { const a = deg * Math.PI / 180; return [x, r * Math.cos(a), r * Math.sin(a)]; };

  // ---------- part notes, shown when you click a part ----------
  const DETAIL = {
    "Nacelle": ["Nacelle", "The streamlined outer case. Its inlet lip guides air smoothly into the fan, and it holds the fan containment ring and the noise-absorbing liner."],
    "Fan Case Liner Joints": ["Fan case liner", "Acoustic panels line the case around the fan. Their honeycomb cores soak up fan noise."],
    "Spinner + Fan Hub": ["Spinner and fan hub", "The cone in front of the fan smooths the air into the blade roots; behind it, the hub holds the 24 blades."],
    "Spinner Spiral": ["Spinner spiral", "A painted spiral that shows ground crews at a glance that the fan is turning."],
    "Fan Blades": ["Fan blades", "24 wide-chord titanium blades, 1,530 mm tip to tip. They make most of the thrust by pushing a huge mass of air backwards."],
    "Fan Disk": ["Fan disk", "The forged disk the blades slot into. It carries their huge outward pull at full speed."],
    "Outlet Guide Vanes": ["Outlet guide vanes", "Forty vanes behind the fan take the swirl out of the bypass air so it leaves straight, as thrust."],
    "Fan Frame Struts": ["Fan frame struts", "Structural struts tie the core to the fan case and carry the engine's mounting loads."],
    "Core Cowl + Casing": ["Core cowl and casing", "The splitter divides the air: the outside flows down the bypass duct, the inside enters the core. The cowl wraps the core all the way back."],
    "Booster Disks": ["Booster disks", "Three disks on the low-pressure spool carry the booster blades, turning with the fan."],
    "Booster Rotors": ["Booster rotors", "Three stages of blades give the core air its first squeeze before the high-pressure compressor."],
    "Booster Stators": ["Booster stators", "Fixed vanes between the booster rotors turn the air back so each stage can push it again."],
    "HPC Disks": ["HP compressor disks", "Nine disks on the high-pressure spool, bolted into one drum."],
    "HPC Rotors": ["HP compressor rotors", "Nine stages of ever-smaller blades squeeze the core air to 22 times its starting pressure."],
    "HPC Stators": ["HP compressor stators", "Fixed vanes between the rotor stages; the front rows swivel to keep the compressor stable at low speed."],
    "Combustor Liners": ["Combustor liners", "The annular chamber where fuel burns continuously. Thousands of tiny holes let in cooling air so the nickel walls survive the flame."],
    "Combustor Inner Casing": ["Combustor inner casing", "The pressure wall on the inside of the combustor, around the shafts."],
    "Fuel Nozzles": ["Fuel nozzles", "Twenty air-blast nozzles atomise the fuel and swirl it with air for a short, clean flame."],
    "HPT Nozzle Guide Vanes": ["HP turbine nozzle vanes", "The hottest parts in the engine. They aim the gas from the combustor onto the turbine blades and are cooled from inside."],
    "HPT Disks": ["HP turbine disks", "Two disks on the high-pressure shaft carry the cooled turbine blades."],
    "HPT Rotors": ["HP turbine rotors", "Two stages of hollow, air-cooled blades. They take energy from the hot gas to drive the compressor."],
    "LPT Disks": ["LP turbine disks", "Four disks on the low-pressure shaft."],
    "LPT Rotors": ["LP turbine rotors", "Four stages that take most of the remaining energy from the gas to turn the fan."],
    "LPT Stators": ["LP turbine stators", "Fixed vanes between the low-pressure turbine stages."],
    "Turbine Rear Frame": ["Turbine rear frame", "Twelve struts hold the rear bearing and straighten the gas leaving the turbine."],
    "Exhaust Plug": ["Exhaust plug", "The cone at the back shapes the core exhaust as it leaves the engine."],
    "HP Shaft": ["HP shaft (N2)", "The outer, shorter shaft: the high-pressure turbine drives the compressor through it."],
    "LP Shaft": ["LP shaft (N1)", "The inner shaft runs the length of the engine, from the low-pressure turbine to the fan and booster."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "tf9-theme",
    touchHint: "Tap the engine to take it apart",
    view: { az: 32, el: 24, near: 10, far: 40000, sway: 0.22, parallax: 0.1, fit: 0.84 },
    modules: {
      nacelle: [450, 0, 0], cowl: [0, 0, 520], fan: [250, 0, 0], bypass: [140, 0, 0], booster: [120, 0, 0],
      hpc: [30, 0, 0], comb: [-70, 0, 0], hpt: [-160, 0, 0], lpt: [-260, 0, 0], rear: [-380, 0, 0], shafts: [0, 0, 0],
    },
    base: { major: 0.95, minor: 0.7, blade: 0.62 },
    spoolOf: o => o.spool || null,
    // outlines for the smooth casings, cones and the fan; the dense blade rows have hard edges of their own
    silhouette: (o, kind) => kind !== "blade" || o.name === "Fan Blades",
    silhouetteFlat: 0.99999,
    // blade rows are picked through a simple drum around them instead of thousands of triangles
    proxy(o, kind, pos) {
      if (kind !== "blade") return null;
      let x0 = Infinity, x1 = -Infinity, r1 = 0;
      for (let i = 0; i < pos.length; i += 3) {
        x0 = Math.min(x0, pos[i]); x1 = Math.max(x1, pos[i]); r1 = Math.max(r1, Math.hypot(pos[i + 1], pos[i + 2]));
      }
      const cyl = new THREE.CylinderGeometry(r1, r1, Math.max(x1 - x0, 8), 48, 1, false);
      cyl.rotateZ(Math.PI / 2);
      cyl.translate((x0 + x1) / 2, 0, 0);
      return cyl;
    },
    occluders: ["Nacelle", "Core Cowl + Casing", "Combustor Inner Casing", "Exhaust Plug"],
    hotspots: [
      { t: "Spinner", s: "Spiral mark shows the fan turning", p: polar(560, 140, 150), o: ["Spinner + Fan Hub", "Spinner Spiral"] },
      { t: "Fan blades x24", s: "Wide-chord titanium, 1,530 mm", p: polar(C.FAN_X + 40, 600, 150), o: ["Fan Blades", "Fan Disk"] },
      { t: "Inlet lip", s: "Anti-iced, 1,560 mm highlight", p: polar(712, 780, 225), o: ["Nacelle"] },
      { t: "Fan containment case", s: "Kevlar wrap, acoustic liner", p: polar(330, 838, 70), o: ["Nacelle", "Fan Case Liner Joints"] },
      { t: "Outlet guide vanes x40", s: "Straighten the bypass flow", p: polar(-30, 640, 200), o: ["Outlet Guide Vanes", "Fan Frame Struts"] },
      { t: "Splitter + core cowl", s: "Divides bypass and core air", p: polar(248, 392, 196), o: ["Core Cowl + Casing"] },
      { t: "LP booster", s: "3 stages on the fan spool", p: polar(120, 330, 150), o: ["Booster Disks", "Booster Rotors", "Booster Stators"] },
      { t: "HP compressor", s: "9 stages, 22:1 pressure ratio", p: polar(-330, 255, 150), o: ["HPC Disks", "HPC Rotors", "HPC Stators"] },
      { t: "Annular combustor", s: "Effusion-cooled nickel liners", p: polar(-700, 262, 196), o: ["Combustor Liners", "Combustor Inner Casing"] },
      { t: "Fuel nozzles x20", s: "Air-blast swirlers", p: polar(-640, 400, 198), o: ["Fuel Nozzles"] },
      { t: "HP turbine", s: "2 stages, cooled blades", p: polar(-860, 265, 150), o: ["HPT Disks", "HPT Rotors", "HPT Nozzle Guide Vanes"] },
      { t: "LP turbine", s: "4 stages, drives the fan", p: polar(-1070, 330, 150), o: ["LPT Disks", "LPT Rotors", "LPT Stators"] },
      { t: "Turbine rear frame", s: "12 struts", p: polar(-1272, 330, 200), o: ["Turbine Rear Frame"] },
      { t: "Exhaust plug", s: "Core exhaust cone", p: polar(-1540, 200, 160), o: ["Exhaust Plug"] },
      { t: "HP shaft (N2)", s: "Outer shaft, compressor to HP turbine", p: polar(-700, 100, 150), o: ["HP Shaft"] },
      { t: "LP shaft (N1)", s: "Inner shaft, fan to LP turbine", p: polar(-1180, 50, 150), o: ["LP Shaft"] },
    ],
    detail: DETAIL,

    // "how it works": follow the air from the fan to the exhaust, in the cut-away quarter of the casings
    tour: {
      points: {
        inlet: polar(C.SPINNER_TIP + 120, 470, 150).concat("Spinner + Fan Hub"),
        fan: polar(C.FAN_X, 470, 150).concat("Fan Blades"),
        ogv: polar(-30, 640, 150).concat("Outlet Guide Vanes"),
        bypassOut: polar(-420, 640, 150).concat("Core Cowl + Casing"),
        booster: polar(120, 330, 150).concat("Booster Disks"),
        hpc: polar(-330, 255, 150).concat("HPC Disks"),
        nozzle: polar(-640, 400, 198).concat("Fuel Nozzles"),
        comb: polar(-700, 262, 150).concat("Combustor Liners"),
        hpt: polar(-860, 265, 150).concat("HPT Disks"),
        hpShaftA: polar(-820, 95, 150).concat("HP Shaft"),
        hpShaftB: polar(-300, 95, 150).concat("HP Shaft"),
        lpt: polar(-1070, 330, 150).concat("LPT Disks"),
        lpShaftA: polar(-1150, 45, 150).concat("LP Shaft"),
        lpShaftB: polar(C.FAN_X - 60, 45, 150).concat("LP Shaft"),
        rear: polar(-1272, 330, 150).concat("Turbine Rear Frame"),
        exhaust: polar(-1600, 150, 150).concat("Exhaust Plug"),
      },
      steps: [
        { t: "Air comes in", focus: "fan", dist: 0.62, ex: 0, p: ["inlet", "fan"], n: ["Fan Blades", "Fan Disk", "Spinner + Fan Hub", "Nacelle"], ms: 4200,
          d: "The fan, 1.53 m across, pulls a huge mass of air into the inlet. It turns with the low-pressure spool, driven from the very back of the engine." },
        { t: "Most of it bypasses the core", focus: "ogv", dist: 0.62, ex: 0, p: ["fan", "ogv", "bypassOut"], n: ["Outlet Guide Vanes", "Fan Frame Struts", "Fan Blades", "Nacelle"], ms: 4400,
          d: "About nine parts in ten flow around the core through the bypass duct. The outlet guide vanes straighten it, and this cool stream makes most of the thrust." },
        { t: "The rest is squeezed", focus: "hpc", dist: 0.5, ex: 0, p: ["fan", "booster", "hpc"], n: ["Booster Disks", "Booster Rotors", "Booster Stators", "HPC Disks", "HPC Rotors", "HPC Stators"], ms: 4400,
          d: "The core air passes three booster stages, then nine high-pressure compressor stages. By the end it is at 22 times its starting pressure and several hundred degrees hot." },
        { t: "Fuel burns", focus: "comb", dist: 0.42, ex: 0, p: ["hpc", "nozzle", "comb"], n: ["Combustor Liners", "Combustor Inner Casing", "Fuel Nozzles"], ms: 4400,
          d: "Twenty nozzles spray fuel into the ring-shaped combustor, where it burns continuously. Air bleeding through tiny holes keeps the liner walls cooler than the flame." },
        { t: "The HP turbine drives the compressor", focus: "hpt", dist: 0.44, ex: 0, p: ["comb", "hpt", "hpShaftA", "hpShaftB", "hpc"], n: ["HPT Disks", "HPT Rotors", "HPT Nozzle Guide Vanes", "HP Shaft", "HPC Rotors"], ms: 4600,
          d: "The hot gas spins two cooled turbine stages. They turn the outer shaft, which drives the compressor just ahead of the combustor." },
        { t: "The LP turbine drives the fan", focus: "lpt", dist: 0.5, ex: 0, p: ["hpt", "lpt", "lpShaftA", "lpShaftB", "fan"], n: ["LPT Disks", "LPT Rotors", "LPT Stators", "LP Shaft", "Fan Blades"], ms: 4800,
          d: "Four more stages take most of what's left in the gas. They turn the inner shaft, which runs the whole length of the engine to the fan and booster." },
        { t: "Out the back", focus: "rear", dist: 0.55, ex: 0, p: ["lpt", "rear", "exhaust"], n: ["Turbine Rear Frame", "Exhaust Plug"], ms: 4200,
          d: "The core gas leaves past the rear frame and around the exhaust plug, adding its push to the bypass stream." },
      ],
    },

    setup(E) {
      const N1 = 0.55, N2 = 1.1;   // spool speeds in rad/s (HP turns twice as fast, as in the blueprint loop)
      let lp = 0, hp = 0;
      return {
        tick(now, dt) {
          if (!E.reduceMotion) { lp -= N1 * dt; hp -= N2 * dt; }
          (E.spinners.lp || []).forEach(g => { g.rotation.x = lp; });
          (E.spinners.hp || []).forEach(g => { g.rotation.x = hp; });
        },
      };
    },
  };
})();
