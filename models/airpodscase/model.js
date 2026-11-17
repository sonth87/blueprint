// AirPods Pro case with both earbuds: the model script for the blueprint engine (geometry from airpodscase/build.js).
// Open state = the engine's explode amount e (0 closed, 1 open): setup()'s tick turns every lid part (the "lid" spools)
// about the hinge by e x 100 degrees, while the buds fly up and everything comes apart by translation. The status LED
// breathes while the lid is closed and glows green once it is open; with the lid open each bud's driver moves and its sound
// rings run, and the squeeze ring pulses every few seconds. With reduced motion everything keeps a still frame (the lid
// still follows e).
(function () {
  "use strict";
  const G = window.APC_GEOMETRY, K = G.constants;
  const BUD = {

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
  const DETAIL = {
    "Lid Shell": ["Lid shell", "The top of the case: white polycarbonate, rounded, with a small thumb notch at the front. It is hollow and turns on the hinge."],
    "Lid Liner": ["Lid liner", "The lid's inner plate, with two deep recesses that cover the heads of the earbuds when the case is closed."],
    "Lid Magnet L": ["Lid magnet", "A small magnet at the front left of the lid that holds it shut."],
    "Lid Magnet R": ["Lid magnet", "A small magnet at the front right of the lid that holds it shut."],
    "Hall Target Magnet": ["Hall target magnet", "A magnet in the lid that sits over the hall sensor when the lid is closed."],
    "Hinge Barrel": ["Hinge barrel", "A round barrel along the back edge of the lid that turns about the hinge pins."],
    "Hinge Pin": ["Hinge pins", "Two short steel pins, one at each end, that the barrel turns on."],
    "Hinge Knuckles": ["Hinge knuckles", "The two bearings at the ends of the hinge that hold the pins in the body."],
    "Body Shell": ["Body shell", "The lower half of the case in white polycarbonate: a rounded shell with the USB-C port, the speaker holes and the screw recesses in its base."],
    "Well Insert": ["Well insert", "The inner block of the body: two pockets for the earbud heads, each with a narrow well for the stem."],
    "Bud Cradle R": ["Right cradle", "A sloped contour in the right pocket that guides the earbud's head and stem into its well."],
    "Bud Cradle L": ["Left cradle", "A sloped contour in the left pocket that guides the earbud's head and stem into its well."],
    "Well Gasket R": ["Right well gasket", "A thin soft ring at the mouth of the right well, between the earbud and the insert."],
    "Well Gasket L": ["Left well gasket", "A thin soft ring at the mouth of the left well, between the earbud and the insert."],
    "Well Magnet R": ["Well magnet", "A ring magnet under the right well, round the charging pins: it pulls the earbud's stem down."],
    "Well Magnet L": ["Well magnet", "A ring magnet under the left well, round the charging pins: it pulls the earbud's stem down."],
    "Pogo Pins": ["Pogo pins", "Four spring-loaded pins, two at the bottom of each well, that touch the charging contacts at the foot of the earbuds."],
    "Pogo Flex": ["Pogo flex", "Two small flexible circuits under the wells that join the pogo pins to the main board."],
    "Main PCB": ["Main board", "A tall circuit board against the inside of the front wall that carries the case's electronics."],
    "Charger Chip": ["Charger chip", "The chip that charges the case's battery and sends power on to the earbuds."],
    "Hall Sensor": ["Hall sensor", "A sensor that detects the lid's magnet, so the case knows whether the lid is open or closed."],
    "Status LED": ["Status LED", "A small LED on the main board that shows the charging state."],
    "Light Pipe": ["Light pipe", "A small clear piece that carries the LED's light to the lens at the front, just under the lid."],
    "LED Glow": ["LED glow (closed)", "A drawn glow showing the light breathing while the lid is closed. Not a part."],
    "LED Glow Open": ["LED glow (open)", "A drawn glow showing the light on, green, while the lid is open. Not a part."],
    "UWB Antenna": ["UWB antenna", "A flexible antenna on the inside of the back wall for ultra-wideband, which lets Precision Finding point to the case."],
    "Button Cap": ["System button", "The button on the back of the case, for setup and pairing."],
    "Button Switch": ["Button switch", "A small switch behind the button cap that senses a press."],
    "Button Flex": ["Button flex", "A thin flexible circuit that joins the switch to the main board."],
    "USB-C Port Frame": ["USB-C port frame", "The metal shell of the port in the base of the case, where the charging cable plugs in."],
    "USB-C Tongue": ["USB-C tongue", "The flat tongue with the contacts in the middle of the port."],
    "USB-C Connector": ["USB-C connector", "The connector body above the port, soldered to a circuit."],
    "Speaker": ["Speaker", "A tiny speaker in the base that plays a sound when you look for the case with Find My, and the pairing chimes."],
    "Speaker Gasket": ["Speaker gasket", "A soft ring that seals the speaker to the holes in the base."],
    "Lanyard Bracket": ["Lanyard bracket", "A small bracket inside the base that holds the lanyard pin."],
    "Lanyard Pin": ["Lanyard pin", "The pin the lanyard loop hooks onto."],
    "Lanyard Loop": ["Lanyard loop", "A small loop at the bottom of the case, for a strap."],
    "Coil Shield": ["Coil shield", "A thin ferrite sheet under the coil that keeps the magnetic field out of the case's own electronics."],
    "Qi Coil": ["Wireless charging coil", "A flat coil of many turns in the base: it takes power from a Qi or MagSafe charger."],
    "Coil Magnet Ring": ["Coil magnet ring", "A ring of magnets round the coil that lines the case up on a MagSafe charger."],
    "Case Battery": ["Case battery", "A flat lithium-ion pouch cell of about 523 mWh, with a notch for the USB-C port."],
    "Battery Flex": ["Battery flex", "A thin flexible circuit that joins the battery to the main board."],
    "Foam Gasket": ["Foam gasket", "Pads of foam on top of the battery that hold it in place."],
    "Case Screws": ["Case screws", "Four screws from the base that hold the body together."],
  };
  Object.keys(BUD).forEach(n => { DETAIL["R " + n] = BUD[n]; DETAIL["L " + n] = BUD[n]; });

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "apc-theme",
    touchHint: "Tap the case to open it",
    view: { az: 32, el: 20, fit: 0.85 },
    spoolOf: o => o.spool || null,
    occluders: ["Body Shell", "Lid Shell", "Well Insert", "R Back Shell", "L Back Shell", "R Front Shell", "L Front Shell", "R Stem Shell", "L Stem Shell"],
    fxLines: [{ match: /^[RL] Sound Wave \d$/, color: 0x6fc8ff }, { match: /^[RL] Squeeze Ring$/, color: 0xffb340 }, { match: /^LED Glow$/, color: 0xffb340 }, { match: /^LED Glow Open$/, color: 0x4cff7a }],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/^(Lid Shell|Body Shell)$/, ["plastic", { color: 0xf3f3f1, roughness: 0.2, clearcoat: 1 }]],
      [/^Lid Liner$|^Well Insert$|Cradle/, ["plastic", { color: 0xe9e9e6, roughness: 0.5 }]],
      [/Lid Magnet|Hall Target|Well Magnet|Coil Magnet/, ["steel", { color: 0x70747a }]], [/Hinge|Pogo Pins|Lanyard Pin|Lanyard Bracket|Screws/, "steel"],
      [/^Lanyard Loop$/, ["alu", { color: 0xc9ccd1 }]], [/Light Pipe/, ["glass", { color: 0xdfe6ea }]], [/Gasket|Foam/, ["rubber", { color: 0x2c2d30 }]],
      [/^(Main PCB|Charger Chip|Hall Sensor|Status LED)$/, "pcb"], [/Flex|Antenna/, ["plastic", { color: 0xd89a3c, roughness: 0.5 }]],
      [/Button Cap/, ["plastic", { color: 0xf3f3f1, roughness: 0.25 }]], [/Button Switch|USB-C Connector/, "chip"], [/USB-C (Port|Tongue)/, "steel"],
      [/Speaker/, ["plastic", { color: 0x44474c }]], [/Qi Coil/, "copper"], [/Coil Shield/, ["plastic", { color: 0x3a3d42 }]], [/Case Battery/, ["alu", { color: 0xc9ccd1 }]],

      [/^[RL] (Front Shell|Back Shell|Stem Shell)$/, ["plastic", { color: 0xf3f3f1, roughness: 0.16, clearcoat: 1 }]],
      [/^[RL] Ear Tip$/, ["rubber", { color: 0xeeeeea, roughness: 0.55 }]], [/^[RL] Ear Tip Ring$/, ["plastic", { color: 0xcfd1d3, roughness: 0.4 }]],
      [/Mesh/, ["darkAlu", { color: 0x3a3d42 }]], [/Gasket/, ["rubber", { color: 0x26272a }]],
      [/^[RL] Nozzle$/, ["plastic", { color: 0xe6e6e3, roughness: 0.3 }]], [/IR Window/, ["glass"]], [/Outer Grille/, ["steel", { color: 0xb5b8bd }]],
      [/Driver Frame/, ["plastic", { color: 0x3b3e43 }]], [/Yoke|Pole Plate/, "steel"], [/Neodymium|Stem Magnet/, ["steel", { color: 0x70747a }]],
      [/^[RL] Diaphragm$|Surround/, ["plastic", { color: 0xd9c9a2, roughness: 0.5 }]], [/Voice Coil/, "copper"], [/Back Volume|Vent Channel/, ["plastic", { color: 0x8d9096 }]],
      [/Flex|Tail|Tab/, ["plastic", { color: 0xd89a3c, roughness: 0.5 }]], [/Chip|Amplifier|Accelerometer|IR Sensor|Mic$|Passives/, "chip"],
      [/^[RL] Battery$/, ["alu", { color: 0xc9ccd1 }]], [/Force Sensor/, ["plastic", { color: 0x4b6a98 }]], [/Contact [LR]/, "gold"],
    ],

    setup(E) {
      const V = THREE;
      const n3 = v => new V.Vector3(v[0], v[2], -v[1]);
      const X = new V.Vector3(1, 0, 0);
      const base = n => { const m = E.byName[n] && E.byName[n].mats[0]; return m ? { m, b: m.userData.base } : null; };
      const lids = E.spinners.lid || [];
      const buds = K.bud.map(b => {
        const p = b.k + " ", one = s => E.spinners[p + s] || [];
        return {
          N: n3(b.N), Y: n3(b.Y), dia: one("dia"), coil: one("coil"), squeeze: one("squeeze"), sqring: one("sqring"), sqmat: base(p + "Squeeze Ring"),
          waves: [1, 2, 3, 4].map(i => ({ g: one("wave" + i), mat: base(p + "Sound Wave " + i), ph: i / 4 })),
        };
      });
      const led1 = { g: E.spinners.led || [], mat: base("LED Glow") }, led2 = { g: E.spinners.led2 || [], mat: base("LED Glow Open") };
      const WAVE_T = 2.8, SQ_T = 5.0, STILL = 0.5;
      let t = STILL;
      const frac = x => x - Math.floor(x);
      const smooth = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
      const q = new V.Quaternion();
      function pose(e) {
        // the lid: every lid part turns about the hinge (an x axis) as the case opens
        q.setFromAxisAngle(X, -K.hingeDeg * Math.PI / 180 * e);
        lids.forEach(g => g.quaternion.copy(q));
        const on = smooth((e - 0.55) / 0.35);       // the buds' effects run once the lid is open
        // status LED: breathes (amber-white) while closed, steady green once open
        const br = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2.2));
        if (led1.mat) led1.mat.m.userData.base = Math.max(0.0001, led1.mat.b * 2 * br * (1 - smooth(e / 0.4)));
        if (led2.mat) led2.mat.m.userData.base = Math.max(0.0001, led2.mat.b * 2.2 * smooth((e - 0.3) / 0.4));
        buds.forEach(b => {
          const x = K.dia * Math.sin(2 * Math.PI * 2.0 * t) * on;
          b.dia.concat(b.coil).forEach(g => g.position.copy(b.N).multiplyScalar(x));
          b.waves.forEach(w => {
            const f = frac(t / WAVE_T + w.ph), s = 0.22 + 1.45 * f;
            w.g.forEach(g => g.scale.setScalar(s));
            if (w.mat) w.mat.m.userData.base = Math.max(0.0001, w.mat.b * 1.4 * Math.sin(Math.PI * f) ** 0.7 * on);
          });
          const c = t % SQ_T, press = smooth(c / 0.25) * (1 - smooth((c - 0.7) / 0.3)) * on;
          b.squeeze.forEach(g => g.position.copy(b.Y).multiplyScalar(0.4 * press));
          const rf = Math.max(0, Math.min(1, (c - 0.05) / 1.1));
          b.sqring.forEach(g => g.scale.setScalar(0.9 + 0.9 * rf));
          if (b.sqmat) b.sqmat.m.userData.base = c < 1.2 ? Math.max(0.0001, b.sqmat.b * 1.6 * Math.sin(Math.PI * rf) * on) : 0.0001;
        });
      }
      pose(0);
      return {
        tick(now, dt, e) {
          dt = Math.max(0, Math.min(dt, 1 / 30));
          if (!E.reduceMotion) t += dt;
          pose(e || 0);
        },
      };
    },
  };
})();
