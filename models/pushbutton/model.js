// Push button circuit: the model script for the blueprint engine, which pushbutton/build.js inlines after the generated
// geometry. The button presses itself every few seconds (still, open, with reduced motion): the cap, stem and bridge
// come down on a spring, the spring squashes, and when the bridge lands on both posts the filament lights.
(function () {
  "use strict";
  const G = window.PB_GEOMETRY;
  const K = G.constants;
  const DETAIL = {
    "Bench Plate": ["Bench plate", "The board everything is screwed to."],
    "Feet": ["Feet", "Lift the plate off the bench."],
    "Corner Screws": ["Corner screws", "Hold the plate to its frame."],
    "Ruler Strip": ["Ruler strip", "A millimetre scale along the back edge."],
    "Label Plate": ["Label plate", "Engraved with the circuit's ratings: 1.5 V, 0.3 A."],
    "Wires": ["Wires", "One loop from the cell's + terminal through the bulb and the button back to its − terminal."],
    "Switch Base": ["Switch base", "An insulating block the posts and the frame stand on."],
    "Binding Screws": ["Binding screws", "Clamp each wire's ring lug to a contact post underneath."],
    "Contact Posts": ["Contact posts", "Two brass posts, one for each side of the loop. Nothing joins them until the bridge comes down."],
    "Frame": ["Frame", "Two columns and a top plate that guide the stem and hold the spring."],
    "Copper Bridge": ["Copper bridge", "A copper bar on the end of the stem, 7 mm above the posts until the cap is pressed."],
    "Stem": ["Stem", "Joins the cap to the bridge and slides through the top plate."],
    "Cap": ["Cap", "Knurled, so a finger doesn't slip."],
    "Spring": ["Spring", "Six turns between the frame and the cap; it holds the button open and lifts it again on release."],
    "Cell Holder": ["Cell holder", "Holds the cell upright, with a terminal screw for each end."],
    "Cell": ["Cell", "A 1.5 V cell: the loop's source of energy."],
    "Cell Strap": ["Cell strap", "Brings the cell's + terminal down to its screw."],
    "Bulb Socket": ["Bulb socket", "A screw socket on a block, with a terminal each side."],
    "Bulb": ["Bulb", "A glass envelope round the filament, sealed so the hot filament can't burn."],
    "Filament": ["Filament", "A thin tungsten coil. It has most of the loop's resistance, so it gets hot enough to glow."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "pb-theme",
    touchHint: "Tap the circuit to take it apart",
    view: { az: 42, el: 28 },
    spoolOf: o => o.spool || null,
    occluders: ["Bench Plate", "Switch Base", "Cell", "Bulb", "Cap", "Frame"],
    // parts drawn only as lines that stay lines in the shaded and photo styles (an effect, not a surface)
    fxLines: [{ match: /^Filament$/, color: 0xffc060 }],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Bench Plate|Switch Base|Label Plate/, ["greyPaint", { color: 0x3b3f44, roughness: 0.8 }]], [/Feet|Wires/, "rubber"],
      [/Screws|Frame|Stem|Ruler Strip/, "steel"], [/Contact Posts|Bulb Socket|Cell Strap/, ["copper", { color: 0xc9a35a }]], [/Copper Bridge|Spring/, "copper"],
      [/^Cap$|Cell Holder/, ["plastic", { color: 0x1b1c1f }]], [/^Cell$/, ["darkAlu", { color: 0x2d5a3a }]], [/^Bulb$/, "glass"], [/Filament/, "steel"],
    ],

    setup(E) {
      const V = (x, y, z) => new THREE.Vector3(x, z, -y);
      const one = k => (E.spinners[k] || []);
      const lit = ["Filament", "Bulb"].map(n => E.byName[n] && E.byName[n].mats[0]).filter(Boolean);
      const dim = lit.map(m => m.userData.base);
      let clock = 0, pos = 0, rate = 0, glow = 0;
      const place = () => {
        const dz = -K.GAP * pos;
        one("press").forEach(g => g.position.copy(V(0, 0, dz)));
        one("spring").forEach(g => { g.scale.y = (K.SPRING_LEN + dz) / K.SPRING_LEN; });   // three's y is up
        lit.forEach((m, i) => { m.userData.base = dim[i] * (i ? 1 : 0.45) + (1.6 - dim[i] * (i ? 1 : 0.45)) * glow; });
      };
      place();
      return {
        tick(now, dt) {
          if (E.reduceMotion) return;
          dt = Math.max(0, Math.min(dt, 1 / 30));   // the first frame's dt can be a hair below zero
          clock += dt;
          const c = clock % 3.2, target = c > 1.8 && c < 2.8 ? 1 : 0;
          for (let i = 0; i < 4; i++) { rate += ((target - pos) * 520 - rate * 30) * dt / 4; pos += rate * dt / 4; }
          if (pos > 1) { pos = 1; rate = -rate * 0.18; }   // the bridge lands on the posts
          if (pos < 0) { pos = 0; rate = -rate * 0.3; }
          const want = pos > 0.985 ? 1 : 0;
          glow += (want - glow) * (1 - Math.exp(-dt / (want ? 0.06 : 0.22)));
          place();
        },
      };
    },
  };
})();
