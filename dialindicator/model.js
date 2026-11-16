// Dial indicator: the model script for the blueprint engine, which dialindicator/build.js inlines after the generated
// geometry. A tour runs all the time (still with reduced motion): the carriage steps from block to block, the
// plunger rides onto each one on a spring, and the needle (1 mm a turn) and the turn counter follow the plunger.
(function () {
  "use strict";
  const G = window.DI_GEOMETRY;
  const K = G.constants;
  const DETAIL = {
    "Surface Plate": ["Surface plate", "A heavy, lapped plate: the flat reference every height here is measured from."],
    "Feet": ["Feet", "Four feet, so the plate rests on four points and doesn't rock."],
    "Corner Screws": ["Corner screws", "Hold the plate to its stand."],
    "Ruler Strip": ["Ruler strip", "A millimetre scale along the back edge, a long tick every 5 mm."],
    "Rails": ["Rails", "Two ground rails the carriage slides along, square to the dial."],
    "End Stops": ["End stops", "Keep the carriage on its rails."],
    "Magnetic Base": ["Magnetic base", "A switchable magnet: turned on, it grips the plate; turned off, it lifts away."],
    "Magnet Switch": ["Magnet switch", "Turns a permanent magnet inside the base so its field runs into the plate, or stays inside."],
    "Post": ["Post", "A steel post the clamp slides up and down to set the dial's height."],
    "Post Clamp": ["Post clamp", "Locks the arm at any height with its thumb screw."],
    "Arm": ["Arm", "Carries the dial out over the carriage."],
    "Dial Body": ["Dial body", "Holds the rack and the gear train that turn a straight push of the plunger into turns of the needle."],
    "Bezel": ["Bezel", "Knurled, so it can be turned to put zero under the needle wherever it stops."],
    "Dial Face": ["Dial face", "100 divisions of 0.01 mm round the edge, and a small counter for whole millimetres."],
    "Needle": ["Needle", "One turn is 1 mm of plunger travel."],
    "Counter Hand": ["Counter hand", "Moves one division for every turn of the needle."],
    "Stem": ["Stem", "The sleeve the plunger slides in, and what the dial is clamped by in other set-ups."],
    "Back Lug": ["Back lug", "Fixes the dial to the arm."],
    "Lift Lever": ["Lift lever", "Lifts the plunger clear so the work can slide under it without a knock."],
    "Plunger": ["Plunger", "Spring-loaded downwards, with a hard ball tip that touches the work."],
    "Carriage": ["Carriage", "Slides along the rails, carrying the blocks under the plunger."],
    "Carriage Handle": ["Carriage handle", "A knurled knob to push the carriage by."],
    "Gauge Blocks": ["Gauge blocks", "Steel blocks 18, 14 and 10 mm tall, each made to within a micrometre."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "di-theme",
    touchHint: "Tap the dial indicator to take it apart",
    view: { az: 42, el: 28 },
    spoolOf: o => o.spool || null,
    occluders: ["Surface Plate", "Magnetic Base", "Dial Body", "Carriage", "Gauge Blocks"],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Surface Plate/, ["greyPaint", { color: 0x3b3f44, roughness: 0.8 }]], [/Feet/, "rubber"], [/Corner Screws|End Stops|Rails|Post$|Stem|Plunger/, "steel"],
      [/Ruler Strip|Gauge Blocks/, ["steel", { roughness: 0.15 }]], [/Magnetic Base|Post Clamp|Arm|Back Lug/, ["darkAlu", { color: 0x4a4e54 }]],
      [/Magnet Switch|Carriage Handle|Lift Lever/, ["plastic", { color: 0x1b1c1f }]], [/Dial Body|Bezel/, ["alu", { color: 0xcfd2d6, roughness: 0.3 }]],
      [/Dial Face/, ["plastic", { color: 0xf4f4f0, roughness: 0.5 }]], [/Needle|Counter Hand/, ["plastic", { color: 0xc8231b }]], [/Carriage/, "alu"],
    ],

    setup(E) {
      const V = (x, y, z) => new THREE.Vector3(x, z, -y);
      const one = k => (E.spinners[k] || []);
      const under = cx => {   // the top under the plunger with the carriage at cx
        let top = K.CARRIAGE_TOP;
        K.BLOCKS.forEach((h, i) => {
          const from = cx - 24 + K.STEP * i, to = from + K.BLOCK_W;
          if (to > K.DIAL[0] - K.TIP_R && from < K.DIAL[0] + K.TIP_R) top = Math.max(top, K.CARRIAGE_TOP + h);
        });
        return top;
      };
      let clock = 0, x = K.START, tip = K.REST, rate = 0;
      const place = () => {
        const dx = x - K.START, dz = tip - K.REST, mm = tip - K.CARRIAGE_TOP;   // the reading is the height over the carriage
        one("carriage").forEach(g => g.position.copy(V(dx, 0, 0)));
        one("plunger").forEach(g => g.position.copy(V(0, 0, dz)));
        one("needle").forEach(g => g.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -2 * Math.PI * mm));
        one("counter").forEach(g => g.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -2 * Math.PI * mm / 10));
      };
      place();
      return {
        tick(now, dt) {
          if (E.reduceMotion) return;
          dt = Math.max(0, Math.min(dt, 1 / 30));   // the first frame's dt can be a hair below zero
          clock += dt;
          const target = K.STOPS[Math.floor(clock / 3.2) % K.STOPS.length];
          x += (target - x) * (1 - Math.exp(-dt / 0.35));
          const want = under(x);
          for (let i = 0; i < 4; i++) { rate += ((want - tip) * 420 - rate * 26) * dt / 4; tip += rate * dt / 4; }
          place();
        },
      };
    },
  };
})();
