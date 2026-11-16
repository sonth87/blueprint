// X9 desktop processor: the model script for the blueprint engine (src/engine.js), which build_pages.py inlines after it.
// The package stacks in three modules: the heat spreader lifts off, the substrate with its dies stays in the
// middle, and the LGA socket drops away underneath. "." plays a tour from the socket pins up to the lid.
(function () {
  "use strict";
  const G = window.CPU_GEOMETRY;
  const C = G.constants;
  const IHS_DROP = C.IHS_Z - (C.SUB_T + 0.1), SKT_RISE = -C.FLOOR_Z;
  const partOf = name => name.startsWith("IHS") ? "ihs" : (name.startsWith("Socket") || name.startsWith("LGA")) ? "socket"
    : name === "Construction Lines" ? "guides" : "core";

  // ---------- part notes, shown when you click a part ----------
  const DETAIL = {
    "IHS Plateau": ["Heat spreader", "A nickel-plated copper lid soldered over the dies. It spreads their heat across a much larger area so the cooler on top can carry it away."],
    "IHS Flange": ["Heat spreader flange", "The thin rim the socket's retention frame presses down on. Two notches key it so the package only fits one way round."],
    "IHS Logo": ["Laser marking", "The brand and model are laser-etched into the nickel plating."],
    "IHS Data Matrix": ["Data matrix", "A 16 x 16 two-dimensional code that identifies this exact chip: its batch, wafer and test results."],
    "Sealant Bead": ["Sealant bead", "A bead of silicone glues the heat spreader's rim to the substrate and seals the dies in."],
    "CCD 0": ["Compute die 0", "Eight cores and 32 MB of L3 cache on one piece of silicon. This is where your programs actually run."],
    "CCD 1": ["Compute die 1", "A second, identical compute die. Splitting the cores across small dies keeps manufacturing yields high."],
    "CCD 0 Floorplan": ["Core layout", "The die's floorplan: the cores along both sides with the shared L3 cache in the middle."],
    "CCD 1 Floorplan": ["Core layout", "The same floorplan as die 0: cores along the edges, cache in the centre."],
    "I/O Die": ["I/O die", "Memory controllers for DDR5, PCIe 5.0 lanes, USB and the integrated graphics. Everything going in or out of the processor passes through it."],
    "I/O Die Floorplan": ["I/O die layout", "The memory, PCIe and display blocks laid out around the die's edge, close to their pins."],
    "Substrate": ["Organic substrate", "A 12-layer circuit board, 45 x 37.5 mm, that routes thousands of connections from the dies to the contact pads underneath."],
    "Decoupling Capacitors": ["Decoupling capacitors", "Dozens of tiny ceramic capacitors that hold a little charge right beside the dies, so the cores never wait for power when their load jumps."],
    "Pin1 Marker + Fiducials": ["Pin 1 marker", "A gold triangle shows which way the package goes into the socket; the small dots let assembly machines line it up."],
    "Socket Frame": ["Socket frame", "A heat-resistant plastic frame that holds the package in place while the motherboard's load plate clamps it down."],
    "Socket Floor + Keys": ["Socket floor", "The floor carries the contact grid. Two keys match the notches in the package so it can't go in the wrong way."],
    "LGA Contacts": ["LGA contacts", G.contacts.toLocaleString("en-US") + " springy gold contacts, 0.95 mm apart. The package sits on them, so there are no pins to bend on the processor."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "x9-theme",
    touchHint: "Tap the processor to take it apart",
    view: { az: 45, el: 30, near: 1, far: 2000, sway: 0.32, parallax: 0.12 },
    globalIndices: true,
    kindOf: o => o.group,
    moduleOf: o => partOf(o.name),
    // assembled at base, apart at base + offset: the lid lifts off and the socket drops away
    modules: {
      ihs: { base: [0, 0, -IHS_DROP], offset: [0, 0, IHS_DROP] },
      core: { offset: [0, 0, 0] },
      socket: { base: [0, 0, SKT_RISE], offset: [0, 0, -SKT_RISE] },
      guides: { offset: [0, 0, 0] },
    },
    base: { major: 0.95, minor: 0.5, guides: 0.32, hidden: 0.09 },
    hiddenLines: ["major"],
    guides: false,   // the drawing brings its own construction lines
    silhouette: o => !["LGA Contacts", "Construction Lines", "Decoupling Capacitors"].includes(o.name),
    silhouetteMinArea: 0.0005,
    occluders: ["Substrate", "I/O Die", "CCD 0", "CCD 1", "IHS Flange", "IHS Plateau", "Socket Frame", "Socket Floor + Keys"],
    hotspots: [
      { t: "Integrated heat spreader", s: "Ni-plated copper, 33.0 x 29.0 mm", p: [-5.0, 5.5, C.IHS_Z + 3.0], o: ["IHS Plateau", "IHS Logo"] },
      { t: "2D data matrix", s: "16 x 16 ECC200, laser etched", p: [4.6 + 16 * 0.36, -7.5, C.IHS_Z + 3.0], o: ["IHS Data Matrix"] },
      { t: "IHS flange + key notch", s: "0.9 mm thick", p: [C.IHS_HW, 0, C.IHS_Z + 0.45], o: ["IHS Flange"] },
      { t: "Compute dies (CCD) x2", s: "8 cores + 32 MB L3 each", p: [9.6, -6.7, C.SUB_T + 0.89], o: ["CCD 0", "CCD 0 Floorplan", "CCD 1", "CCD 1 Floorplan"] },
      { t: "I/O die", s: "DDR5 / PCIe 5.0 / iGPU", p: [-7.8, -6.0, C.SUB_T + 0.89], o: ["I/O Die", "I/O Die Floorplan"] },
      { t: "Sealant bead", s: "RTV silicone", p: [-C.IHS_HW + 0.4, -6.0, C.SUB_T + 0.08], o: ["Sealant Bead"] },
      { t: "Decoupling capacitors", s: "0402 / 0603 / 0805 MLCC", p: [20.2, -9.0, C.SUB_T + 0.5], o: ["Decoupling Capacitors"] },
      { t: "Organic substrate", s: "45.0 x 37.5 x 1.2 mm, 12-layer ABF", p: [5.0, -C.SUB_HH, C.SUB_T * 0.5], o: ["Substrate"] },
      { t: "Alignment notch", s: "Keyed, R1.0", p: [-12.0, -C.SUB_HH + 1.0, C.SUB_T], o: ["Substrate"] },
      { t: "Pin 1 indicator", s: "Orientation mark + fiducials", p: [-C.SUB_HW + 1.8, -C.SUB_HH + 1.5, C.SUB_T + 0.04], o: ["Pin1 Marker + Fiducials"] },
      { t: "LGA socket", s: G.contacts.toLocaleString("en-US") + " spring contacts", p: [14.0, -C.SKT_HH, C.SKT_Z - 1.5], o: ["Socket Frame"] },
      { t: "Contact array", s: "0.95 mm pitch", p: [-14.0, -14.0, C.FLOOR_Z + 0.12], o: ["LGA Contacts", "Socket Floor + Keys"] },
      { t: "Retention frame", s: "LCP, UL 94V-0", p: [-C.SKT_HW + 2.4, -12.0, C.SKT_Z], o: ["Socket Frame"] },
    ],
    detail: DETAIL,

    // "how it works": power and data come up from the socket, the dies do the work, heat leaves through the lid
    tour: {
      points: {
        pins: [-6, -4, C.FLOOR_Z + 0.2, "LGA Contacts"],
        subBot: [-6, -4, 0, "Substrate"],
        subTop: [-2, -9, C.SUB_T, "Substrate"],
        io: [-7.8, -6.0, C.SUB_T + 0.89, "I/O Die"],
        ccd0: "CCD 0",
        ccd1: "CCD 1",
        caps: [20.2, -9.0, C.SUB_T + 0.5, "Decoupling Capacitors"],
        lid: [0, 0, C.IHS_Z + 3.0, "IHS Plateau"],
      },
      steps: [
        { t: "Power arrives through the socket", focus: "pins", dist: 0.55, ex: 1, p: ["pins", "subBot"], n: ["LGA Contacts", "Socket Floor + Keys", "Socket Frame"], ms: 4200,
          d: "The package sits on " + G.contacts.toLocaleString("en-US") + " spring contacts. Most of them carry power and ground; the rest carry memory, PCIe and display signals." },
        { t: "The substrate spreads it out", focus: "subTop", dist: 0.5, ex: 1, p: ["subBot", "caps", "subTop"], n: ["Substrate", "Decoupling Capacitors"], ms: 4200,
          d: "Twelve layers of copper wiring route every contact to the right die. The capacitors along the edge hold charge close by, smoothing sudden jumps in current." },
        { t: "The I/O die talks to the world", focus: "io", dist: 0.34, ex: 1, p: ["subTop", "io"], n: ["I/O Die", "I/O Die Floorplan"], ms: 4200,
          d: "Memory controllers, PCIe lanes, USB and the integrated graphics live here. Everything going in or out of the processor passes through this die." },
        { t: "The cores do the work", focus: "ccd0", dist: 0.36, ex: 1, p: ["io", "ccd0", "io", "ccd1"], n: ["CCD 0", "CCD 0 Floorplan", "CCD 1", "CCD 1 Floorplan", "I/O Die"], ms: 4600,
          d: "Links through the substrate feed both compute dies. Each has eight cores and its own 32 MB of L3 cache, so most data never has to leave the die." },
        { t: "Heat goes up into the lid", focus: "lid", dist: 0.5, ex: 1, p: ["ccd0", "lid"], n: ["IHS Plateau", "IHS Flange", "Sealant Bead", "CCD 0", "CCD 1"], ms: 4200,
          d: "A thin thermal layer bonds the dies to the copper heat spreader, which spreads their heat over its whole top for the cooler to carry away." },
        { t: "Closed up, ready for a cooler", focus: "lid", dist: 0.85, ex: 0, p: [], n: null, ms: 4000,
          d: "The heat spreader seals the dies in, and the motherboard's load plate presses the whole package onto its contacts. Up to 125 W leaves through the lid." },
      ],
    },

    setup(E) {
      const guides = E.partGroups["Construction Lines"];
      return { tick(now, dt, e) { if (guides) guides.visible = e > 0.9 && E.xray(); } };
    },
  };
})();
