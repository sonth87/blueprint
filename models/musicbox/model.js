// Music box: the model script for the blueprint engine, which build.js's generated geometry precedes.
// The mechanism runs at its real ratios (still with reduced motion): the cylinder turns once in 8 s; the barrel turns at
// 10/40 of that, the intermediate shaft at 40/10 and the worm wheel at 3 times that, and the governor's fly, driven by a
// single-start worm, at 10 times the worm wheel: 120 times the cylinder. Every pin was placed in build.js from the tune;
// here each tooth is struck at the times that list gives it, springs back and rings with a decaying oscillation (the
// ringing is slowed to 9 to 18 Hz so it can be seen: the real teeth sound at 260 to 4000 Hz, and the swing is a little exaggerated).
(function () {
  "use strict";
  const G = window.CMB_GEOMETRY;
  const K = G.constants;
  const DETAIL = {
    "Tray Floor": ["Tray floor", "The floor board sits in a rebate cut round the walls' lower edge; the mechanism's pillars stand on it."],
    "Left Wall": ["Left wall", "Has the hole the winding arbor comes through."],
    "Right Wall": ["Right wall", "Has the slot the start/stop lever slides in."],
    "Front Wall": ["Front wall", "Joined to the side walls with dovetails; it carries the hasp's staple."],
    "Back Wall": ["Back wall", "Carries the hinges."],
    "Dovetail Joints": ["Dovetail joints", "The corners are dovetailed, so the walls can't be pulled apart however much the case is knocked."],
    "Panel Mouldings": ["Panel mouldings", "Moulded frames on the walls: decoration, and a stiffening of the thin wood."],
    "Brass Lip": ["Brass lip", "A thin brass strip on the tray's rim, where the lid closes."],
    "Bun Feet": ["Bun feet", "Four turned feet, so the case rests on its corners and the base can sound."],
    "Key Escutcheon": ["Key escutcheon", "A brass plate round the winding hole."],
    "Lever Escutcheon": ["Lever escutcheon", "A brass plate round the lever's slot."],
    "Bedplate Posts": ["Bedplate posts", "Four posts that stand the bedplate off the floor, screwed up from below."],
    "Hinge Leaves (Case)": ["Hinge leaves (case)", "The brass leaves screwed to the back wall."],
    "Hinge Knuckles (Case)": ["Hinge knuckles (case)", "The knuckles that belong to the case; the lid's interleave with them."],
    "Hinge Pins": ["Hinge pins", "One steel pin through each hinge's knuckles: the axis the lid turns on."],
    "Hasp Staple": ["Hasp staple", "The small staple the lid's hasp fits over to hold it shut."],
    "Hinge Leaves (Lid)": ["Hinge leaves (lid)", "The leaves screwed to the lid's back."],
    "Hinge Knuckles (Lid)": ["Hinge knuckles (lid)", "The knuckles that belong to the lid."],
    "Lid Shell": ["Lid", "A hollow wooden lid, here raised to 100 degrees. Closed, it covers the mechanism; open, it works with the case as a soundboard."],
    "Lid Lip": ["Lid lip", "The matching brass edge on the lid."],
    "Lid Lining": ["Lid lining", "The recess of the lid and the panel of its underside."],
    "Inlay Panel": ["Inlay panel", "A marquetry panel on the lid's top, drawn here in lines: a star in the middle and a motif in each corner."],
    "Tune Card": ["Tune card", "A plate under the lid that names the tune."],
    "Hasp": ["Hasp", "A brass tab with a slot that drops over the staple on the front wall."],
    "Bedplate": ["Bedplate", "The brass plate everything of the movement is screwed to. It has an opening under the cylinder."],
    "Bedplate Screws": ["Bedplate screws", "Fix the bedplate to its four posts."],
    "Comb Seat": ["Comb seat", "A cast block on the bedplate that the comb's base is screwed to."],
    "Left Standard": ["Left standard", "An upright that carries the cylinder's left pivot and the barrel's arbor."],
    "Right Standard": ["Right standard", "An upright that carries the cylinder's right pivot and the first ends of the gear train's shafts."],
    "Train Bridge": ["Train bridge", "Holds the other ends of the cylinder's shaft and the train's two shafts."],
    "Governor Brackets": ["Governor brackets", "Two small ears that hold the governor shaft's ends."],
    "Lever Post": ["Lever post", "The pivot the start/stop lever turns on."],
    "Cylinder": ["Cylinder", "A brass drum 28 mm across and 100 mm long, turned by the motor. The tune is pinned into it."],
    "Cylinder Caps": ["Cylinder caps", "Plug each end of the drum."],
    "Cylinder Shaft": ["Cylinder shaft", "The steel shaft the cylinder turns on, with a pivot at each end."],
    "Pins": ["Pins", "Small steel pins in the cylinder. The angle round the drum sets when a note sounds, the position along it which tooth it plucks."],
    "Comb Base": ["Comb base", "The solid end of the comb, a wedge because the teeth are of different lengths. Held by three screws."],
    "Comb Screws": ["Comb screws", "Three screws that clamp the comb to its seat."],
    "Damper Wire": ["Damper wire", "A fine wire that lightly touches the bass teeth to stop their ringing."],
    "Damper Post": ["Damper post", "Holds the damper wire."],
    "Barrel": ["Barrel", "A drum round the mainspring. It turns slowly as the spring unwinds: a quarter as fast as the cylinder."],
    "Barrel Cover": ["Barrel cover", "Closes the barrel; the mainspring is drawn through it."],
    "Barrel Gear": ["Barrel gear", "40 teeth, driving the 10-tooth pinion on the cylinder's shaft."],
    "Winding Arbor": ["Winding arbor", "The fixed centre of the barrel, with a square end that comes out through the case for the key."],
    "Mainspring": ["Mainspring", "A long, thin strip of spring steel coiled in a spiral. It is hooked to the arbor at its inner end and the barrel at its outer."],
    "Left Bridge": ["Left bridge", "Holds the arbor's and the cylinder shaft's outer ends."],
    "Ratchet Wheel": ["Ratchet wheel", "Fixed to the arbor: winding turns it, and the click holds it."],
    "Click": ["Click", "A pawl that drops between the ratchet's teeth, so the spring cannot unwind backwards."],
    "Winding Key": ["Winding key", "A butterfly key: it fits over the square end of the arbor outside the case."],
    "Cylinder Gear": ["Cylinder gear", "40 teeth on the cylinder shaft. It drives the governor train."],
    "Cylinder Pinion": ["Cylinder pinion", "10 teeth, driven by the barrel gear."],
    "Intermediate Pinion": ["Intermediate pinion", "10 teeth, driven by the cylinder gear: it turns four times as fast."],
    "Intermediate Wheel": ["Intermediate wheel", "30 teeth on the same shaft, driving the worm wheel."],
    "Intermediate Shaft": ["Intermediate shaft", "Carries the intermediate pinion and wheel."],
    "Worm Wheel": ["Worm wheel", "A 10-tooth wheel, three times faster than the intermediate shaft, that the governor's worm engages."],
    "Worm Wheel Shaft": ["Worm wheel shaft", "Carries the worm wheel."],
    "Governor Shaft": ["Governor shaft", "Carries the worm and the fly; it turns 120 times as fast as the cylinder."],
    "Worm": ["Worm", "A single-start screw thread: each turn moves the worm wheel on by one tooth, so the shaft turns ten times for each turn of the wheel."],
    "Fly": ["Fly", "Two small blades that spin fast. The air resists them harder the faster they go, which holds the speed steady."],
    "Start/Stop Lever": ["Start/stop lever", "Slides in its slot; a brake finger on its inner end stops the fly, and so the music."],
    "Brake Finger": ["Brake finger", "A small pad that meets the fly's blade when the lever is pushed to stop."],
  };
  TOOTH_DETAIL();
  function TOOTH_DETAIL() {
    K.TOOTH.forEach(t => {
      DETAIL["Tooth " + (t.k + 1)] = ["Tooth " + (t.k + 1), "Plucked by its pins: " + t.L.toFixed(1) + " mm long, about " + Math.round(t.f) + " Hz. The longer the tooth, the lower its note."];
    });
    for (let k = 0; k < 6; k++) DETAIL["Lead Weight " + (k + 1)] = ["Lead weight " + (k + 1), "A lead blob near the tip of tooth " + (k + 1) + ". The extra mass lowers its note."];
  }

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "mb-theme",
    touchHint: "Tap the music box to take it apart",
    view: { az: 30, el: 38, fit: 0.78 },
    spoolOf: o => o.spool || null,
    occluders: ["Tray Floor", "Left Wall", "Right Wall", "Front Wall", "Back Wall", "Bedplate", "Lid Shell", "Cylinder", "Comb Base", "Comb Seat"],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Wall|Floor|Lid Shell|Lid Lining|Bun Feet/, ["wood", { color: 0x7a4a26, roughness: 0.6 }]],
      [/Inlay/, ["wood", { color: 0xc99a5e, roughness: 0.5 }]],
      [/Brass Lip|Lid Lip|Hinge|Hasp|Escutcheon|Cylinder|Pins|Gear|Pinion|Wheel(?! Shaft)|Barrel|Bedplate$|Standard|Bridge|Seat|Fly|Worm$|Tune Card|Key/, ["copper", { color: 0xd4b06a, roughness: 0.3 }]],
      [/Tooth|Comb|Lead Weight|Spring|Click|Shaft|Arbor|Wire|Post|Screws|Finger|Lever|Bracket|Damper/, "steel"],
    ],

    setup(E) {
      const X = new THREE.Vector3(1, 0, 0), Yax = new THREE.Vector3(0, 0, -1);   // our X and our Y, in the engine's axes
      const spin = (k, a, axis) => (E.spinners[k] || []).forEach(g => g.quaternion.setFromAxisAngle(axis || X, a));
      const W = 2 * Math.PI / K.REV;
      const AMP = K.AMP, LIFT = 0.07, RING = 0.4;
      const ev = K.EVENTS, T = K.TOOTH;
      const ang = (k, t) => {                      // the tooth's tip angle at time t: lifted by the pin about to pass, then ringing
        const l = ev[k]; if (!l.length) return 0;
        let a = 0;
        for (let i = 0; i < l.length; i++) {
          let d = t - l[i]; if (d < -K.REV / 2) d += K.REV; if (d > K.REV / 2) d -= K.REV;
          if (d >= 0 && d < RING) a += Math.exp(-d / 0.11) * Math.cos(2 * Math.PI * (9 + 0.3 * k) * d);
          else if (d < 0 && d > -LIFT) a += 1 - (-d) / LIFT;
        }
        return a * AMP / T[k].L;
      };
      const pose = clock => {
        const t = clock % K.REV, c = -W * clock;
        spin("cyl", c); spin("cg", c); spin("cp", c);
        spin("barrel", -c * K.CP / K.BG);
        const s2 = -c * K.CG / K.P2, s3 = -s2 * K.W2 / K.G3;
        spin("s2", s2); spin("s3", s3);
        spin("fly", -s3 * K.WORM * 10, Yax);
        for (let k = 0; k < T.length; k++) spin("tooth" + k, ang(k, t));
      };
      let clock = 0.03;
      pose(clock);
      return {
        tick(now, dt) {
          if (E.reduceMotion) return;
          clock += Math.max(0, Math.min(dt, 1 / 30));
          pose(clock);
        },
      };
    },
  };
})();
