// AirPods Pro earbud: the model script for the blueprint engine, which airpodspro/build.js's geometry feeds.
// Three things move, all slowed so they can be seen: the diaphragm and the voice coil move together along the
// nozzle axis (the real driver does it a few hundred to thousands of times a second), rings of sound spread from the
// nozzle through the ear tip and fade, and every few seconds the stem's force sensor presses in and a ring pulses.
// With reduced motion it keeps a still frame.
(function () {
  "use strict";
  const G = window.APP_GEOMETRY, K = G.constants;
  const DETAIL = {
    "Ear Tip": ["Ear tip", "A soft silicone dome about 13 mm across that seals the ear canal; it is hollow and has a small opening at its end."],
    "Ear Tip Ring": ["Ear tip ring", "A stiffer ring inside the base of the tip with a groove that clicks onto the ridge on the nozzle."],
    "Ear Tip Mesh": ["Ear tip mesh", "A fine mesh across the tip's bore that keeps wax and dirt out of the nozzle."],
    "Nozzle": ["Nozzle", "A short tube that leads the driver's sound out of the bud, with a ridge for the tip and a flange inside the shell."],
    "Nozzle Mesh": ["Nozzle mesh", "A fine acoustic mesh across the nozzle's bore; it protects the driver and shapes the sound."],
    "Nozzle Gasket": ["Nozzle gasket", "A thin rubber ring between the nozzle's flange and the shell, so sound only leaves through the nozzle."],
    "Front Shell": ["Front shell", "The half of the white glossy body that faces the ear, with the opening for the nozzle and the windows for the skin sensor and the inward mic."],
    "Seam Gasket": ["Seam gasket", "An adhesive ring on a ledge inside the seam that joins the two halves of the body."],
    "IR Window": ["Infrared window", "A small window in the front shell that the skin-detect sensor looks through."],
    "Inner Mic Mesh": ["Inner mic port", "A tiny meshed port in the front shell that lets the inward-facing microphone hear inside the ear."],
    "Back Shell": ["Back shell", "The outer half of the body, white and glossy; it carries the outer microphone port and the pressure vent."],
    "Outer Grille": ["Outer grille", "A small round insert with seven pin holes on the outside of the back shell: the port of the outward-facing microphone."],
    "Beam Mic Mesh": ["Beam mic mesh", "A fine mesh in a frame behind the outer grille that keeps dust and water out of the microphone."],
    "Beam Mic": ["Outer microphone", "The outward-facing MEMS microphone. With the one at the stem it lets the bud pick out your voice from the noise around you."],
    "Vent Mesh": ["Vent mesh", "A small meshed insert on the back shell: the outside end of the pressure vent."],
    "Driver Frame": ["Driver frame", "The plastic basket that holds the driver together and fixes the surround; it has small ports in its wall."],
    "Magnet Yoke": ["Magnet yoke", "A steel cup that carries the magnet and bends its field into the gap where the voice coil moves."],
    "Neodymium Magnet": ["Neodymium magnet", "The strong disc magnet at the centre of the driver; its field is what the voice coil pushes against."],
    "Pole Plate": ["Pole plate", "A steel disc on top of the magnet that shapes the field in the gap."],
    "Driver Gasket": ["Driver gasket", "A soft ring between the driver and the front shell, so the front of the diaphragm is sealed from the back."],
    "Diaphragm": ["Diaphragm", "The thin dome that moves the air. It is glued to the voice coil and moves in and out along the nozzle's axis."],
    "Surround": ["Surround", "The flexible roll between the diaphragm and the frame; it lets the diaphragm move and keeps the air sealed."],
    "Voice Coil": ["Voice coil", "A coil of fine wire on a thin former, glued to the diaphragm and hanging in the magnet's gap; the audio current makes it move."],
    "Back Volume": ["Back volume", "A sealed chamber behind the driver; its size sets how stiff the air behind the diaphragm is."],
    "Vent Channel": ["Vent channel", "A narrow channel from the back volume to the vent in the back shell, so the pressure inside can follow the outside."],
    "Sensor Flex": ["Sensor flex", "A small flexible circuit behind the front shell that carries the infrared sensor and the inward microphone."],
    "IR Sensor": ["Skin-detect sensor", "An infrared sensor that sees whether skin is close, so the bud knows when it is in an ear."],
    "Inner Mic": ["Inner microphone", "A microphone that faces into the ear; it hears the sound that reaches the eardrum, for noise cancelling."],
    "Sensor Flex Tail": ["Sensor flex tail", "The cable that joins the sensor flex to the main flex in the stem."],
    "Main Flex": ["Main flex", "A tall flexible circuit card in the stem that carries the chip and the other electronics."],
    "H2 Chip": ["H2 chip", "Apple's audio chip: it processes the sound and the microphones and runs the wireless link."],
    "Amplifier": ["Amplifier", "A small chip that turns the chip's signal into the current for the voice coil."],
    "Accelerometer": ["Accelerometer", "A tiny motion sensor that feels taps and the vibration of your voice."],
    "Board Passives": ["Board components", "Small capacitors and resistors that decouple and tune the circuits."],
    "Battery": ["Battery", "A small pillow-shaped lithium-ion cell in the stem, of about 50 mAh."],
    "Battery Tab": ["Battery tab", "A thin metal strip that joins the cell to the circuit."],
    "Antenna Flex": ["Antenna flex", "A flexible strip with a meandering trace along the back wall of the stem: the Bluetooth antenna."],
    "Stem Shell": ["Stem shell", "The stem of the body, white and glossy, with a flat end that has openings for the two contacts and the microphone."],
    "Stem Mic Mesh": ["Stem mic mesh", "A fine mesh behind the mic port in the flat end of the stem."],
    "Force Sensor": ["Force sensor", "A pad inside the front wall of the stem; it feels how hard you squeeze the stem."],
    "Force Flex": ["Force sensor flex", "The thin flex that carries the force sensor's signal to the main flex."],
    "Stem Magnet": ["Stem magnet", "A small magnet in the stem that pulls the bud into its place in the charging case."],
    "Contact Flex": ["Contact flex", "A small flexible circuit at the foot of the stem that joins the contacts and the stem microphone."],
    "Charging Contact L": ["Charging contact", "A gold-plated pad in the flat end of the stem; the case's pins touch it to charge the battery."],
    "Charging Contact R": ["Charging contact", "The second gold-plated pad: the two of them carry power and data."],
    "Stem Mic": ["Stem microphone", "The third microphone, at the bottom of the stem, facing down through a port in the flat end."],
    "Sound Wave 1": ["Sound wave", "A ring of sound drawn spreading from the nozzle through the ear tip. Not a part: it shows what the driver does."],
    "Sound Wave 2": ["Sound wave", "A ring of sound drawn spreading from the nozzle through the ear tip. Not a part: it shows what the driver does."],
    "Sound Wave 3": ["Sound wave", "A ring of sound drawn spreading from the nozzle through the ear tip. Not a part: it shows what the driver does."],
    "Sound Wave 4": ["Sound wave", "A ring of sound drawn spreading from the nozzle through the ear tip. Not a part: it shows what the driver does."],
    "Squeeze Ring": ["Squeeze pulse", "A ring that pulses round the stem when it is squeezed. Not a part: it shows the gesture."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "app-theme",
    touchHint: "Tap the earbud to take it apart",
    view: { az: 35, el: 20, fit: 0.92 },
    spoolOf: o => o.spool || null,
    occluders: ["Back Shell", "Front Shell", "Stem Shell", "Ear Tip", "Battery", "Back Volume", "Driver Frame"],
    // the sound waves and the squeeze ring are drawn as lines only: keep them in the shaded and photo styles
    fxLines: [{ match: /^Sound Wave \d$/, color: 0x6fc8ff }, { match: /^Squeeze Ring$/, color: 0xffb340 }],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/^(Front Shell|Back Shell|Stem Shell)$/, ["plastic", { color: 0xf3f3f1, roughness: 0.16, clearcoat: 1 }]],
      [/^Ear Tip$/, ["rubber", { color: 0xeeeeea, roughness: 0.55 }]], [/^Ear Tip Ring$/, ["plastic", { color: 0xcfd1d3, roughness: 0.4 }]],
      [/Mesh/, ["darkAlu", { color: 0x3a3d42 }]], [/Gasket/, ["rubber", { color: 0x26272a }]],
      [/^Nozzle$/, ["plastic", { color: 0xe6e6e3, roughness: 0.3 }]], [/IR Window/, ["glass"]], [/Outer Grille/, ["steel", { color: 0xb5b8bd }]],
      [/Driver Frame/, ["plastic", { color: 0x3b3e43 }]], [/Yoke|Pole Plate/, "steel"], [/Neodymium|Stem Magnet/, ["steel", { color: 0x70747a }]],
      [/^Diaphragm$|Surround/, ["plastic", { color: 0xd9c9a2, roughness: 0.5 }]], [/Voice Coil/, "copper"], [/Back Volume|Vent Channel/, ["plastic", { color: 0x8d9096 }]],
      [/Flex|Tail|Tab/, ["plastic", { color: 0xd89a3c, roughness: 0.5 }]], [/Chip|Amplifier|Accelerometer|IR Sensor|Mic$|Passives/, "chip"],
      [/^Battery$/, ["alu", { color: 0xc9ccd1 }]], [/Force Sensor/, ["plastic", { color: 0x4b6a98 }]], [/Contact [LR]/, "gold"],
    ],

    setup(E) {
      const V = THREE;
      const n3 = v => new V.Vector3(v[0], v[2], -v[1]);
      const NA = n3(K.N), YA = n3(K.Y);
      const one = k => E.spinners[k] || [];
      const base = n => { const m = E.byName[n] && E.byName[n].mats[0]; return m ? { m, b: m.userData.base } : null; };
      const waves = [1, 2, 3, 4].map(i => ({ g: one("wave" + i), mat: base("Sound Wave " + i), ph: i / 4 }));
      const ring = { g: one("sqring"), mat: base("Squeeze Ring") };
      const WAVE_T = 2.8, SQ_T = 5.0, STILL = 0.5;
      let t = STILL;
      const frac = x => x - Math.floor(x);
      const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
      function pose() {
        // the driver: diaphragm and coil together, about 2 Hz here
        const x = K.dia * Math.sin(2 * Math.PI * 2.0 * t);
        one("dia").concat(one("coil")).forEach(g => g.position.copy(NA).multiplyScalar(x));
        // sound: four rings spreading out of the nozzle, growing and fading
        waves.forEach(w => {
          const f = frac(t / WAVE_T + w.ph), s = 0.22 + 1.45 * f;
          w.g.forEach(g => g.scale.setScalar(s));
          if (w.mat) w.mat.m.userData.base = w.mat.b * 1.4 * Math.sin(Math.PI * f) ** 0.7;
        });
        // the squeeze: pressed in for about half a second every 5 s, with a ring that pulses outward
        const c = t % SQ_T, press = smooth(c / 0.25) * (1 - smooth((c - 0.7) / 0.3));
        one("squeeze").forEach(g => g.position.copy(YA).multiplyScalar(0.4 * press));
        const rf = Math.max(0, Math.min(1, (c - 0.05) / 1.1));
        ring.g.forEach(g => g.scale.setScalar(0.9 + 0.9 * rf));
        if (ring.mat) ring.mat.m.userData.base = c < 1.2 ? ring.mat.b * 1.6 * Math.sin(Math.PI * rf) : 0.0001;
      }
      pose();
      return {
        tick(now, dt) {
          dt = Math.max(0, Math.min(dt, 1 / 30));
          if (E.reduceMotion) return;
          t += dt;
          pose();
        },
      };
    },
  };
})();
