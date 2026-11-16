// Watch movement: the model script for the blueprint engine, which watch/build.js inlines after the generated geometry.
// The movement runs at its true rates (still with reduced motion): the balance swings at 2.5 Hz through about 210°
// each way; at every swing through the middle the pallet fork flips and the escape wheel steps half a tooth (1/30 of a
// turn); the fourth wheel turns once a minute and the rest of the train follows at its ratios.
(function () {
  "use strict";
  const G = window.WM_GEOMETRY;
  const DETAIL = {
    "Main Plate": ["Main plate", "The base everything is built on. The dial and hands are on its other side."],
    "Pillars": ["Pillars", "Hold the bridges at the right height over the plate."],
    "Mainspring Barrel": ["Mainspring barrel", "A drum round the coiled mainspring; its toothed edge drives the train as the spring unwinds."],
    "Mainspring": ["Mainspring", "A long, thin steel spring. Fully wound it runs the watch for about 40 hours."],
    "Centre Wheel": ["Centre wheel", "Turns once an hour; its arbor comes through to the dial side and carries the minute hand."],
    "Third Wheel": ["Third wheel", "Steps the speed up between the centre and the fourth wheel."],
    "Fourth Wheel": ["Fourth wheel", "Turns once a minute; it carries the small seconds hand."],
    "Escape Wheel": ["Escape wheel", "15 club-shaped teeth. It may only move when the pallet fork lets it, half a tooth per beat."],
    "Pallet Fork": ["Pallet fork", "A lever on a pivot: one end catches the escape wheel's teeth, the other the balance's impulse jewel."],
    "Pallet Stones": ["Pallet stones", "Two ruby stones, entry and exit, that lock the escape wheel and take its push."],
    "Balance Wheel": ["Balance wheel", "The watch's pendulum. It swings to and fro, and each swing lets the train advance by one beat."],
    "Hairspring": ["Hairspring", "A fine spiral that pulls the balance back to the middle; its length and stiffness set the rate."],
    "Barrel Bridge": ["Barrel bridge", "Holds the top pivots of the barrel and the centre wheel."],
    "Train Bridge": ["Train bridge", "Holds the third, fourth and escape wheels, with Geneva stripes on its face."],
    "Pallet Bridge": ["Pallet bridge", "Holds the pallet fork's top pivot."],
    "Balance Cock": ["Balance cock", "Holds the balance from one side only, so the balance can be seen."],
    "Regulator": ["Regulator", "Moving its arm towards + or − shortens or lengthens the working hairspring a little."],
    "Jewels": ["Jewels", "Synthetic rubies the pivots turn in: hard, smooth and slow to wear."],
    "Balance Jewel": ["Balance jewel", "A shock-protected jewel for the fast, delicate balance staff."],
    "Screws": ["Screws", "Hold the bridges to the plate."],
    "Cock Screw": ["Cock screw", "The single screw the balance cock hangs from."],
    "Ratchet Wheel": ["Ratchet wheel", "On the barrel's arbor: turning it winds the mainspring."],
    "Crown Wheel": ["Crown wheel", "Passes the crown's turn on to the ratchet wheel."],
    "Click": ["Click", "A sprung pawl on the ratchet wheel, so the mainspring can't unwind back through the crown."],
    "Winding Stem": ["Winding stem", "From the crown into the movement, with the winding pinion on it."],
    "Crown": ["Crown", "Turned to wind the watch."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "wm-theme",
    touchHint: "Tap the movement to take it apart",
    view: { az: 30, el: 42 },
    spoolOf: o => o.spool || null,
    occluders: ["Main Plate", "Barrel Bridge", "Train Bridge", "Balance Cock", "Mainspring Barrel"],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Main Plate|Bridge|Balance Cock|Pillars/, ["alu", { color: 0xd8dadd, roughness: 0.28 }]],
      [/Wheel|Barrel|Ratchet|Regulator/, ["copper", { color: 0xd4b06a, roughness: 0.3 }]],
      [/Jewel|Pallet Stones/, ["plastic", { color: 0xb3122a, roughness: 0.15 }]], [/Screws|Cock Screw/, ["steel", { color: 0x2b4aa8 }]],
      [/Mainspring$|Hairspring|Pallet Fork|Winding Stem|Click/, "steel"], [/Crown$/, ["steel", { roughness: 0.2 }]],
    ],

    setup(E) {
      const Y = new THREE.Vector3(0, 1, 0);
      const spin = (k, a) => (E.spinners[k] || []).forEach(g => g.quaternion.setFromAxisAngle(Y, a));
      const F = 2.5, AMP = 3.66, STEP = 2 * Math.PI / 30;     // balance frequency (Hz), amplitude (rad), escape step a beat
      const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
      const pose = t => {
        const bal = AMP * Math.sin(2 * Math.PI * F * t);
        const beats = 2 * F * t, b = Math.floor(beats), jump = ease((beats - b) * 9);   // the step comes right after the balance passes the middle
        const esc = -(b + jump) * STEP;                                               // escape wheel, clockwise
        const fork = (b % 2 ? 1 : -1) * (1 - 2 * jump) * 0.16;                      // the fork flips from one banking to the other
        const fourth = -esc / 10;                                                   // 1 turn a minute
        spin("balance", bal); spin("hair", bal * 0.22); spin("pallet", fork);
        spin("escape", esc); spin("fourth", fourth); spin("third", -fourth / 7.5); spin("centre", fourth / 60); spin("barrel", -fourth / 480);
      };
      let t = 0;
      pose(0.05);
      return {
        tick(now, dt) {
          if (E.reduceMotion) return;
          t += Math.max(0, Math.min(dt, 1 / 30));   // the first frame's dt can be a hair below zero
          pose(t);
        },
      };
    },
  };
})();
