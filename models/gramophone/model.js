// Gramophone: the model script for the blueprint engine. The platter and record turn at 33 1/3 rpm (0.556 rev a
// second, clockwise), the belt's marks run round at the belt's true speed, the motor pulley turns at the true
// pulley ratio, the tonearm creeps inward across the record over 40 seconds and then swings back, the radio's tuning
// knob, the capacitor's rotor and the dial needle sweep together, and the LED glows gently. Still with reduced motion.
(function () {
  "use strict";
  const G = window.GRAM_GEOMETRY;
  const K = G.constants;
  const DETAIL = {
    "Brass Feet": ["Brass feet", "Four turned bun feet that lift the cabinet off the table."],
    "Plinth": ["Plinth", "The moulded wooden base the walls stand on; hollow, so the parts inside can be reached."],
    "Floor Board": ["Floor board", "The board that the amplifier's standoffs sit on."],
    "Front Wall": ["Front wall", "Cut away for the radio panel and for two arched speaker openings."],
    "Back Wall": ["Back wall", "Closes the cabinet at the back."],
    "Side Walls": ["Side walls", "The two wooden sides of the cabinet."],
    "Spindle Columns": ["Spindle columns", "Four turned corner columns with ring beads; they are decoration, the walls carry the load."],
    "Side Fretwork": ["Side fretwork", "A round carved rosette of petals on each side, in a raised panel."],
    "Back Fittings": ["Back fittings", "A mains inlet, line-in jacks and vent slots on the back."],
    "Power LED": ["Power LED", "A small red lamp that shows the player is switched on."],
    "Cornice": ["Cornice", "A stepped moulding round the top edge, with small dentils."],
    "Deck Top": ["Deck top", "The wooden top with a round well for the platter and a seat for the horn's foot."],
    "Speed Switch": ["Speed switch", "A slider on the deck to choose the record speed."],
    "Pivot Base": ["Pivot base", "The housing the tonearm swings on."],
    "Arm Rest": ["Arm rest", "Where the tonearm is parked when the record is not playing."],
    "Platter": ["Platter", "A round metal turntable, 210 mm across, with strobe marks round its edge."],
    "Sub-platter": ["Sub-platter", "The drum under the platter. The belt runs round it, so the belt turns the whole platter."],
    "Rubber Mat": ["Rubber mat", "A soft mat that holds the record and damps its vibration."],
    "Record": ["Record", "A black vinyl disc with one long spiral groove, here shown as bands of rings."],
    "Record Label": ["Record label", "A coloured paper label; it is not grooved."],
    "Spindle": ["Spindle", "Centres the record on the platter and carries the platter's shaft down to the bearing."],
    "Arm Yoke": ["Arm yoke", "The bearing at the pivot, free to turn sideways to follow the groove."],
    "Tonearm Tube": ["Tonearm tube", "A light curved tube that carries the cartridge across the record."],
    "Counterweight": ["Counterweight", "Balances the arm so the stylus presses on the groove with just a gram or two."],
    "Headshell": ["Headshell", "The plate that holds the cartridge at the end of the arm."],
    "Cartridge": ["Cartridge", "Turns the stylus's tiny movements into a small electrical signal."],
    "Stylus": ["Stylus", "A tiny hard tip that rides in the groove and is shaken by its wiggles."],
    "Horn Bell": ["Horn bell", "A brass flare about 400 mm across with a seven-lobed rim. In this player it is a decoration; the sound comes from the speakers."],
    "Horn Relief": ["Horn relief", "Flowers and stems embossed on the inside of the bell."],
    "Rim Studs": ["Rim studs", "Small rivets round the rim, one at each notch between the lobes."],
    "Throat Ferrule": ["Throat ferrule", "A ringed joint where the neck meets the bell."],
    "Swan Neck": ["Swan neck", "A brass tube bent in one smooth curve from the deck up and over to the bell."],
    "Neck Collar": ["Neck collar", "Ring mouldings where the neck stands on the deck, and a band part-way up."],
    "Panel Plate": ["Panel plate", "A brass-coloured front plate holding the radio's dial, knobs, display and buttons."],
    "Panel Chassis": ["Panel chassis", "The box behind the plate that the controls are mounted to."],
    "Panel Trim": ["Panel trim", "Engraved borders, corner scrolls, rivets and a small crest on the plate."],
    "Dial Window": ["Dial window", "An arched window over the tuning scale, with ticks every 4 degrees of the needle's swing."],
    "Dial Needle": ["Dial needle", "Swings over the scale as the tuning changes; it moves with the tuning knob."],
    "Display Window": ["Display window", "A small display with four seven-segment digits."],
    "Panel Buttons": ["Panel buttons", "A row of seven small buttons for source and playback."],
    "Media Slot": ["Media slot", "A slot strip below the buttons for a memory card or disc."],
    "Volume Knob": ["Volume knob", "A knurled knob with a pointer and a scale round it."],
    "Tuning Knob": ["Tuning knob", "Turns the tuning capacitor, and with it the dial needle, to find a station."],
    "Speaker L": ["Left speaker", "A small paper-cone driver behind the left grille; its coil moves the cone to make sound."],
    "Speaker R": ["Right speaker", "The matching driver behind the right grille."],
    "Grille Cloth L": ["Left grille cloth", "Open-weave cloth in the arched opening, so sound passes and the cone is hidden."],
    "Grille Cloth R": ["Right grille cloth", "Open-weave cloth in the right arched opening."],
    "Motor Plate": ["Motor plate", "A plate hung under the deck that carries the motor and the platter's bearing."],
    "Motor Body": ["Motor body", "A small electric motor that turns the pulley."],
    "Motor Pulley": ["Motor pulley", "A small stepped pulley; it turns about nine times faster than the platter."],
    "Drive Belt": ["Drive belt", "A thin rubber band between the pulley and the sub-platter; it also keeps motor vibration from reaching the platter."],
    "Amp Board": ["Amp board", "The circuit board of the amplifier and radio, with traces on its top."],
    "Transformer": ["Transformer", "Steps the mains down to the low voltage the amplifier uses."],
    "Filter Capacitors": ["Filter capacitors", "Smooth the power supply so it does not hum in the sound."],
    "Amp ICs and Heatsink": ["Amp ICs and heatsink", "The amplifier chips and a finned heatsink to carry away their heat."],
    "Board Connectors": ["Board connectors", "Sockets that take the cartridge's and the speakers' wires."],
    "Tuning Capacitor": ["Tuning capacitor", "Fixed plates of a variable capacitor, which sets the radio's station."],
    "Capacitor Rotor": ["Capacitor rotor", "Moving plates that slide between the fixed ones as the tuning knob turns."],
  };
  for (let i = 1; i <= K.NPULSE; i++) DETAIL["Belt Pulse " + i] = ["Belt marks " + i, "Ticks on the belt that glow in turn, running round at the belt's real speed."];

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "gp-theme",
    touchHint: "Tap the gramophone to take it apart",
    view: { az: 18, el: 24, fit: 1.0 },
    spoolOf: o => o.spool || null,
    occluders: ["Front Wall", "Back Wall", "Side Walls", "Deck Top", "Panel Plate", "Plinth", "Horn Bell", "Amp Board"],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Plinth|Floor Board|Wall|Spindle Columns|Cornice|Deck Top|Side Fretwork|Back Fittings/, ["ceramic", { color: 0x6b3a1e, roughness: 0.45 }]],
      [/Brass Feet|Horn|Throat|Swan|Neck|Panel Plate|Panel Trim|Panel Chassis|Knob|Pivot Base|Arm Yoke|Counterweight|Arm Rest/, ["gold", { color: 0xb08a3c, roughness: 0.32 }]],
      [/Platter|Sub-platter|Motor|Spindle$|Speed Switch|Tonearm Tube|Headshell|Stylus|Cartridge|Panel Buttons|Dial Needle/, "steel"],
      [/Rubber Mat|Drive Belt|Belt Pulse/, "rubber"], [/^Record$/, "gloss"], [/Record Label/, ["paint", { color: 0xb3261e }]],
      [/Dial Window|Display Window|Media Slot/, "glass"], [/Power LED/, ["plastic", { color: 0xd01818 }]],
      [/Grille Cloth/, ["plastic", { color: 0x8a7a52 }]], [/Speaker/, "plastic"], [/Amp Board/, "pcb"], [/Transformer/, "darkAlu"],
      [/ICs|Capacitor|Connectors/, "chip"],
    ],

    setup(E) {
      const Y = new THREE.Vector3(0, 1, 0), NZ = new THREE.Vector3(0, 0, -1);
      const spin = (k, a) => (E.spinners[k] || []).forEach(g => g.quaternion.setFromAxisAngle(Y, a));
      const ease = u => u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u);
      const W_PLATTER = -2 * Math.PI * (100 / 60 / 3);     // 33 1/3 rpm clockwise, rad/s
      const BELT_V = Math.abs(W_PLATTER) * K.SUB_BELT_R, PERIOD = K.BELT_LEN / BELT_V;
      const PLAY = 40, CYCLE = 42, TUNE = 26;
      const pulses = [], leds = [];
      for (let i = 1; i <= K.NPULSE; i++) { const o = E.byName["Belt Pulse " + i]; if (o) pulses.push({ m: o.mats[0], dim: o.mats[0].userData.base }); }
      const led = E.byName["Power LED"] && E.byName["Power LED"].mats[0], ledDim = led ? led.userData.base : 0;
      let t = 0, glowT = 0;
      const pose = () => {
        spin("platter", W_PLATTER * t);
        spin("pulley", W_PLATTER * K.PUL_RATIO * t);
        const u = t % CYCLE;
        let phi, lift = 0;
        if (u < PLAY) phi = K.PHI0 + (K.PHI1 - K.PHI0) * u / PLAY;
        else { const s = (u - PLAY) / (CYCLE - PLAY); phi = K.PHI1 + (K.PHI0 - K.PHI1) * ease(s); lift = 5 * Math.sin(Math.PI * s); }
        (E.spinners.arm || []).forEach(g => { g.quaternion.setFromAxisAngle(Y, phi - K.PHI0); g.position.set(0, lift, 0); });
        const f = 0.5 - 0.5 * Math.cos(2 * Math.PI * t / TUNE);
        (E.spinners.needle || []).forEach(g => g.quaternion.setFromAxisAngle(NZ, (f - 0.5) * rad(96)));
        (E.spinners.knob || []).forEach(g => g.quaternion.setFromAxisAngle(NZ, (f - 0.5) * rad(270)));
        spin("rotor", f * rad(170));
        pulses.forEach((p, k) => { const c = Math.cos(2 * Math.PI * (k / K.NPULSE + t / PERIOD)); const g = Math.max(0, c) ** 3; p.m.userData.base = p.dim * 0.5 + (1.6 - p.dim * 0.5) * g; });
        if (led) led.userData.base = ledDim * 0.7 + (1.5 - ledDim * 0.7) * (0.5 + 0.5 * Math.sin(2 * Math.PI * glowT / 4));
      };
      function rad(d) { return d * Math.PI / 180; }
      pose();
      return {
        tick(now, dt) {
          dt = Math.max(0, Math.min(dt, 1 / 30));   // the first frame's dt can be a hair below zero
          glowT += dt;
          if (E.reduceMotion) return;
          t += dt;
          pose();
        },
      };
    },
  };
})();
