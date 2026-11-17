// Combination lock: the model script for the blueprint engine, which combolock/build.js inlines after the generated
// geometry. It plays back the dialling that build.js simulated (dial, the three wheels, the bolt and the lever, 30 times
// a second), looping: 4 turns left to 20, 3 right to 60, 2 left to 40, right until the fence drops and the bolt comes
// in, then closed again and scrambled. With reduced motion it stays at the open moment.
(function () {
  "use strict";
  const G = window.CL_GEOMETRY;
  const K = G.constants;
  const DETAIL = {
    "Door Section": ["Door", "A section through the safe's door: the dial is outside, the lock is bolted to its inside."],
    "Dial Ring": ["Dial ring", "Fixed to the door, with the index mark the numbers are read against."],
    "Dial": ["Dial", "100 graduations. Its spindle runs through the door to the drive cam."],
    "Drive Cam": ["Drive cam", "Fixed to the spindle. Its pin drives the wheel pack; its gate takes the lever's nose."],
    "Wheel 1": ["Wheel 1", "Set by the first number. Furthest from the cam, so it takes the most turns to reach."],
    "Wheel 2": ["Wheel 2", "Set by the second number."],
    "Wheel 3": ["Wheel 3", "Set by the third number; driven straight from the cam's pin."],
    "Wheel Post": ["Wheel post", "A fixed post the wheels turn on, each free of the others but for its pins and flies."],
    "Lock Case": ["Lock case", "Bolted to the inside of the door."],
    "Back Cover": ["Back cover", "Closes the case; only a locksmith takes it off."],
    "Bolt": ["Bolt", "Slides out of the case into the door frame to hold the door shut."],
    "Lever and Fence": ["Lever and fence", "Pivots on the bolt. The fence rests on the wheels and the nose on the cam until every gate lines up."],
    "Lever Spring": ["Lever spring", "Pushes the lever down onto the wheels and the cam."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "cl-theme",
    touchHint: "Tap the lock to take it apart",
    view: { az: 145, el: 24, fit: 1.3 },   // the door is lines only, so the framing (from filled parts) leaves it out: stand further back
    spoolOf: o => o.spool || null,
    occluders: ["Lock Case", "Back Cover", "Dial", "Wheel 1", "Wheel 2", "Wheel 3", "Drive Cam", "Bolt"],
    // parts drawn only as lines that stay lines in the shaded and photo styles (an effect, not a surface)
    fxLines: [/^Door Section$/],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Dial$|Dial Ring/, ["darkAlu", { color: 0x2b2d31, roughness: 0.35 }]], [/Wheel \d|Drive Cam/, ["copper", { color: 0xc9a35a, roughness: 0.35 }]],
      [/Lock Case|Back Cover/, ["greyPaint", { color: 0x3b3f44 }]], [/Bolt|Lever|Wheel Post/, "steel"], [/Door Section/, "steel"],
    ],

    setup(E) {
      const Z = new THREE.Vector3(0, 0, 1);   // our spindle axis (y) is three's -z; turning from +x to +z is about three's +z
      const one = k => (E.spinners[k] || []);
      const F = K.frames, N = F.length;
      const openFrame = F.findIndex(f => f[4] > 0.999) + 2;
      const show = f => {
        const [a, w1, w2, w3, bolt, lever] = f;
        one("dial").forEach(g => g.quaternion.setFromAxisAngle(Z, a));
        [w1, w2, w3].forEach((w, k) => one("wheel" + (k + 1)).forEach(g => g.quaternion.setFromAxisAngle(Z, w)));
        one("bolt").forEach(g => { g.position.x = -K.TRAVEL * bolt; });
        one("lever").forEach(g => { g.position.x = -K.TRAVEL * bolt; g.quaternion.setFromAxisAngle(Z, K.DROP * lever); });
      };
      const at = t => {   // between samples, so the dial turns smoothly
        const x = (t * K.FPS) % N, i = Math.floor(x), u = x - i, a = F[i], b = F[(i + 1) % N];
        return i === N - 1 ? a : a.map((v, k) => v + (b[k] - v) * u);
      };
      show(F[openFrame] || F[0]);
      return {
        tick(now) { if (!E.reduceMotion) show(at(now / 1000)); },
      };
    },
  };
})();
