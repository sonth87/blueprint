// Power station unit: the model script for the blueprint engine, which powerstation/build.js's geometry feeds.
// A 40-second loop that mirrors the original: turning gear, run-up, excitation, synchronising, loading, then
// isolating. On the first, third... loop the order is right (unload, open the breaker, then the disconnector); on the
// others the disconnector is opened first, on load, and an arc draws between the blades until the breaker clears it.
// The rotor turns at its true rpm slowed 100 times. With reduced motion the unit stands still, loaded.
(function () {
  "use strict";
  const G = window.PS_GEOMETRY;
  const K = G.constants;
  const DETAIL = {
    "Site Slab": ["Site slab", "The concrete apron the whole unit stands on, with a 5 m grid drawn on it."],
    "Equipment Pads": ["Equipment pads", "A concrete pad under each stand and post, and a low bund round the transformer to hold its oil if it leaks."],
    "Bay Fence": ["Bay fence", "A mesh fence round the live 400 kV equipment, with a gap for the gate."],
    "Foundation Raft": ["Foundation raft", "A thick concrete slab that spreads the load of the machine over the ground."],
    "Foundation Table": ["Foundation table", "A concrete deck on columns that carries the generator and the turbine."],
    "Anchor Bolts": ["Anchor bolts", "Hold the stator, the bearing pedestals and the turbine pedestal down on the table."],
    "Table Stair": ["Table stair", "Steps and a handrail up to the operating deck on top of the table."],
    "Turbine Casing Stub": ["Turbine casing stub", "Only the end of the steam turbine is drawn: its casing and the flange where the exhaust end stops."],
    "Turbine Bearing Pedestal": ["Turbine bearing pedestal", "Carries the turbine's last bearing on the table."],
    "Turbine Shaft Stub": ["Turbine shaft stub", "The end of the turbine shaft that bolts to the generator's rotor at the coupling."],
    "Coupling Flanges": ["Coupling flanges", "Two forged flanges bolted together: the turbine's torque goes through them into the generator's rotor."],
    "Bearing Pedestals": ["Bearing pedestals", "Split bearing housings, one each side of the stator, with the shaft journal turning in an oil film."],
    "Bearing Oil Pipes": ["Bearing oil pipes", "Feed lubricating oil to the bearings and carry it back to the tank."],
    "Generator Rating Plate": ["Generator rating plate", "A plate for the machine's rating: here 660 MW, 22 kV, 3,000 rpm."],
    "Stator Frame": ["Stator frame", "The fabricated steel shell of the stator; here its front is cut away, along its whole length."],
    "Frame Soleplates": ["Frame soleplates", "Steel feet that carry the stator's weight onto the table."],
    "Stator Core": ["Stator core", "A stack of thin insulated steel laminations with slots round its bore; gaps between the packs let the cooling gas through."],
    "Core End Plates": ["Core end plates", "Press the laminations together at each end, held by key bars along the back of the core."],
    "Stator Bars": ["Stator bars", "The three-phase winding's bars, two in each slot; the rotor's field induces about 22 kV in them."],
    "End Windings": ["End windings", "Where the bars leave the core and bend round to join the next slot, braced in a basket."],
    "Winding Supports": ["Winding supports", "Rings and rods that hold the end windings against the large forces on them."],
    "End Shields": ["End shields", "Close the ends of the stator frame and carry the seals round the shaft."],
    "Terminal Box": ["Terminal box", "Where the three phase leads leave the stator."],
    "Generator Terminals": ["Generator terminals", "The three phase terminals, each ending at a bus duct."],
    "Rotor Body": ["Rotor body", "A solid forged steel cylinder, with the winding laid in slots along it; it has two poles, so at 3,000 rpm it makes 50 Hz. Here it turns slowed 100 times, or it would be a blur."],
    "Slot Wedges": ["Slot wedges", "Wedges that lock the winding in its slots against the centrifugal force; the slitted strips are the two poles' faces."],
    "Retaining Rings": ["Retaining rings", "Heavy steel rings that hold the ends of the winding against the centrifugal force."],
    "Rotor Fans": ["Rotor fans", "Fans on the rotor's ends that drive cooling gas through the machine."],
    "Rotor Shaft": ["Rotor shaft", "The shaft that carries the rotor from the coupling to the exciter, turning in two bearings."],
    "Exciter Housing": ["Exciter housing", "The casing round the brushless exciter."],
    "Exciter Field Poles": ["Exciter field poles", "Stationary poles of the main exciter, carrying a small direct current that is regulated to control the generator voltage."],
    "Exciter Armature": ["Exciter armature", "A winding turning on the shaft; the current it generates is rectified and goes straight into the rotor."],
    "Rotating Rectifier Wheel": ["Rotating rectifier wheel", "Diodes on a wheel on the shaft turn the exciter's alternating current to direct current, so no brushes or slip rings are needed."],
    "Pilot Exciter": ["Pilot exciter", "A small generator with permanent magnets that powers the voltage regulator."],
    "Pilot Magnet Rotor": ["Pilot magnet rotor", "The permanent-magnet rotor of the pilot exciter, on the end of the shaft."],
    "Bus Duct Enclosures": ["Bus duct enclosures", "A round aluminium duct round each phase; each phase has its own, so a fault cannot jump between phases."],
    "Expansion Bellows": ["Expansion bellows", "Flexible joints that let the ducts expand and absorb the machine's vibration."],
    "Duct Conductors": ["Duct conductors", "The aluminium conductor of each phase inside its duct; it carries about 17,000 amperes at full load."],
    "Duct Support Insulators": ["Duct support insulators", "Hold each conductor in the middle of its duct."],
    "Duct Steel Supports": ["Duct steel supports", "Steel portal frames that carry the ducts at their height."],
    "Duct Flanges": ["Duct flanges", "Bolted flanges where each duct meets the generator and the transformer."],
    "Transformer Tank": ["Transformer tank", "A welded steel tank holding the core, the windings and the oil that insulates and cools them."],
    "Tank Stiffeners": ["Tank stiffeners", "Ribs that keep the tank walls from flexing; lifting lugs sit on the lid."],
    "LV Turret": ["LV turret", "The box on the 22 kV side where the low-voltage bushings enter the tank."],
    "LV Bushings": ["LV bushings", "Three large bushings that bring the 22 kV phases into the tank from the bus ducts."],
    "HV Bushings": ["HV bushings", "Three tall porcelain bushings that carry the 400 kV phases out of the tank."],
    "Neutral Bushing": ["Neutral bushing", "Brings the high-voltage winding's neutral point out so it can be earthed."],
    "Conservator": ["Conservator", "A tank above the main one that takes up the oil as it expands and contracts with temperature."],
    "Buchholz Relay and Pipework": ["Buchholz relay", "A gas relay in the pipe to the conservator: gas from an internal fault collects in it and trips the unit."],
    "Transformer Rating Plate": ["Transformer rating plate", "Lists the transformer's ratio, power and cooling."],
    "Tap Changer Cabinet": ["Tap changer cabinet", "The drive of the on-load tap changer, which adjusts the turns ratio in small steps."],
    "Radiators": ["Radiators", "Panels on the side of the tank: the hot oil rises through them and cools."],
    "Cooler Bank": ["Cooler bank", "A separate bank of cooling radiators with fans, for heat the tank-mounted ones cannot lose."],
    "Cooling Pipework": ["Cooling pipework", "Carries oil between the tank and the cooler bank."],
    "Cooler Fan 1": ["Cooler fan", "Blows air up through the cooler's fins; it turns faster as the load rises."],
    "Cooler Fan 2": ["Cooler fan", "Blows air up through the cooler's fins; it turns faster as the load rises."],
    "Cooler Fan 3": ["Cooler fan", "Blows air up through the cooler's fins; it turns faster as the load rises."],
    "Fan Guard 1": ["Fan guard", "A grille over the fan."],
    "Fan Guard 2": ["Fan guard", "A grille over the fan."],
    "Fan Guard 3": ["Fan guard", "A grille over the fan."],
    "Arrester Stands": ["Arrester stands", "Steel stands that lift each surge arrester clear of the ground."],
    "Arrester Insulators": ["Surge arresters", "A stack of zinc-oxide blocks in a porcelain housing: it conducts only when the voltage surges (lightning, switching) and leads the surge to earth."],
    "Arrester Grading Rings": ["Grading rings", "Rings that spread the electric field evenly over the top of the arrester."],
    "Surge Counters": ["Surge counters", "Count the surges each arrester has carried."],
    "CT Stands": ["CT stands", "Steel stands that hold each current transformer up."],
    "CT Insulators": ["CT insulators", "A porcelain column that insulates the head, at 400 kV, from the ground."],
    "CT Heads": ["Current transformers", "The head carries the line current through a coil, and its secondary windings give a small copy for the protection and meters."],
    "CT Secondary Boxes": ["CT secondary boxes", "Where the secondary leads of each current transformer end."],
    "Breaker Frames": ["Breaker frames", "Steel frames that carry each breaker's support column and mechanism."],
    "Breaker Columns": ["Breaker columns", "A porcelain support column for each pole, drawn without a surface to show the insulating rod inside."],
    "Breaker Heads": ["Breaker heads", "The housing at the top of each pole, in the middle of its two interrupter chambers."],
    "Interrupter Chambers": ["Interrupter chambers", "Porcelain chambers filled with SF6 gas, with the contacts inside."],
    "Cut-open Interrupter": ["Cut-open interrupter", "One chamber of the middle pole with its front half cut away to show the contacts."],
    "Fixed Contact": ["Fixed contact", "The stationary contact and the insulating nozzle that directs SF6 gas across the arc as the contacts part."],
    "Operating Mechanisms": ["Operating mechanisms", "A spring mechanism in each cabinet that drives the rod; it opens or closes the contacts in a few hundredths of a second."],
    "Operating Rods": ["Operating rods", "Insulating rods that carry the mechanism's motion up the column to the contacts."],
    "Moving Contact": ["Moving contact", "Slides out of the fixed contact when the breaker opens; SF6 gas blown across the gap puts out the arc."],
    "Disconnector Frames": ["Disconnector frames", "The steel base that carries the two post insulators of each disconnector."],
    "Disconnector Posts": ["Disconnector posts", "Post insulators that carry the blades at 400 kV; each turns on its base to swing its blade."],
    "Rotary Bases": ["Rotary bases", "A bearing under each post that lets the whole post turn."],
    "Disconnector Drive": ["Disconnector drive", "A motor cabinet with rods to the two rotary bases."],
    "Blade L1 West": ["Disconnector blade", "Phase 1's west blade: it swings with its post and ends in a pair of contact fingers."],
    "Blade L1 East": ["Disconnector blade", "Phase 1's east blade: it swings with its post and ends in a contact pin."],
    "Blade L2 West": ["Disconnector blade", "Phase 2's west blade: when the two meet in the middle, the phase conducts."],
    "Blade L2 East": ["Disconnector blade", "Phase 2's east blade: a centre-break disconnector opens at the middle of the blades."],
    "Blade L3 West": ["Disconnector blade", "Phase 3's west blade."],
    "Blade L3 East": ["Disconnector blade", "Phase 3's east blade."],
    "Arc L1": ["Arc", "Phase 1's arc, drawn only when the blades open on load."],
    "Arc L2": ["Arc", "Phase 2's arc, drawn only when the blades open on load."],
    "Arc L3": ["Arc", "Phase 3's arc, drawn only when the blades open on load."],
    "Bay Conductors": ["Bay conductors", "Tubes and cables that link the transformer to the equipment and on to the line."],
    "Bay Terminals": ["Bay terminals", "Bolted terminals where the conductors meet each piece of equipment."],
    "Gantry Towers": ["Gantry towers", "Two steel lattice towers that carry the beam and the pull of the line."],
    "Gantry Crossbeam": ["Gantry crossbeam", "A lattice beam that carries the three insulator strings."],
    "Insulator Strings": ["Insulator strings", "Discs of glass or porcelain in a string that hold each line conductor off the gantry."],
    "Line Conductors": ["Line conductors", "The three overhead conductors of the line leaving the station at 400 kV."],
    "Tower Ladder": ["Tower ladder", "A ladder with a safety cage up one tower leg."],
    "Desk Body": ["Synchronising desk", "The desk where the operator watches the unit and brings it to the grid."],
    "Desk Dial Faces": ["Desk dials", "Left to right: speed, generator voltage, power and the synchroscope."],
    "Speed Needle": ["Speed needle", "Reads the shaft speed, up to 3,600 rpm."],
    "Voltage Needle": ["Voltage needle", "Reads the generator voltage, up to 25 kV."],
    "Power Needle": ["Power needle", "Reads the power the unit sends out, up to 750 MW."],
    "Synchroscope Needle": ["Synchroscope needle", "Turns at the difference between the generator's frequency and the grid's: the breaker is closed as it passes the top."],
    "Lamp Breaker": ["Breaker lamp", "Lit while the breaker is closed."],
    "Lamp Disconnector": ["Disconnector lamp", "Lit while the disconnector is closed."],
    "Lamp Alarm": ["Alarm lamp", "Lights when the disconnector is opened on load, the wrong order."],
    "Mimic Diagram": ["Mimic diagram", "A single-line drawing of the unit: generator, transformer, breaker, disconnector and line."],
    "Desk Buttons": ["Desk buttons", "Push buttons for the operator."],
    "Desk Nameplate": ["Desk nameplate", "Names the desk."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "pwr-theme",
    touchHint: "Tap the power station to take it apart",
    view: { az: 32, el: 26, fit: 0.62 },
    spoolOf: o => o.spool || null,
    occluders: ["Site Slab", "Foundation Table", "Stator Frame", "Transformer Tank", "Cooler Bank", "Desk Body", "Exciter Housing", "Turbine Casing Stub"],
    // parts drawn only as lines that stay lines in the shaded and photo styles (an effect, not a surface)
    fxLines: [{ match: /^Arc L\d$/, color: 0xbfe6ff }],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Site Slab|Equipment Pads|Foundation|Table Stair/, ["greyPaint", { color: 0x7d7f80, roughness: 0.9 }]], [/Anchor Bolts|Bay Fence|Duct Steel|Frames|Stands|Gantry|Tower|Cooler Bank|Cooling|Radiators/, ["steel", { roughness: 0.5 }]],
      [/Insulators|Posts|Chambers|Columns|CT Heads|Bushings|Cut-open|Insulator Strings|Support Insulators/, ["plastic", { color: 0xb08a62, roughness: 0.4 }]],
      [/Stator Frame|Turbine Casing|Exciter Housing|Pilot Exciter|Terminal Box|End Shields|Bearing Pedestals|Turbine Bearing/, ["greyPaint", { color: 0x5b7c8c, roughness: 0.6 }]],
      [/Stator Core|Core End/, ["steel", { roughness: 0.25 }]], [/Stator Bars|End Windings|Winding Supports|Exciter Armature/, ["copper", { color: 0xb87333, roughness: 0.4 }]],
      [/Rotor|Coupling|Shaft|Slot Wedges|Retaining|Rectifier|Pilot Magnet|Fans/, ["steel", { roughness: 0.2 }]],
      [/Bus Duct|Duct Flanges|Expansion|Duct Conductors|Generator Terminals/, ["alu", { color: 0xcfd2d6, roughness: 0.3 }]],
      [/Transformer Tank|LV Turret|Conservator|Tap Changer|Tank Stiff|Buchholz/, ["greyPaint", { color: 0x7c8b6e, roughness: 0.6 }]],
      [/Bay Conductors|Line Conductors|Terminals|Grading|Moving Contact|Fixed Contact|Blade|Operating/, ["alu", { color: 0xcfd2d6, roughness: 0.3 }]],
      [/Arc/, ["plastic", { color: 0xaee3ff }]], [/Desk Body|Mimic|Desk Dial|Nameplate|Plate/, ["darkAlu", { color: 0x3b3f44 }]],
      [/Needle/, ["plastic", { color: 0xc8231b }]], [/Lamp/, ["plastic", { color: 0xe0a800 }]], [/Desk Buttons/, ["plastic", { color: 0x1b1c1f }]],
    ],

    setup(E) {
      const T = THREE;
      const ease = (a, b, t) => { const u = Math.max(0, Math.min(1, (t - a) / (b - a))); return u * u * (3 - 2 * u); };
      const one = k => E.spinners[k] || [];
      const LOOP = 40, ARC_ON = 26.5, BREAKER_OPEN = 29.2;
      const axisX = new T.Vector3(1, 0, 0), axisY = new T.Vector3(0, 1, 0), axisBack = new T.Vector3(0, 0, -1);
      const q = new T.Quaternion(), P = new T.Vector3(), R = new T.Vector3();
      // turn group g by angle about an axis through the point (three coordinates), keeping that point in place
      const turn = (g, axis, ang, px, py, pz) => {
        q.setFromAxisAngle(axis, ang);
        P.set(px, py, pz); R.copy(P).applyQuaternion(q);
        g.quaternion.copy(q); g.position.copy(P).sub(R);
      };
      const mat = n => E.byName[n] && E.byName[n].mats[0];
      const lit = (n, v) => { const m = mat(n); if (m) { if (m.userData.baseHome === undefined) m.userData.baseHome = m.userData.base; m.userData.base = m.userData.baseHome * v; } };

      // the unit's state at time t (s) of loop `wrong`
      function sim(t, wrong) {
        const rpm = t < 3 ? 4 : t < 9 ? 4 + 2996 * ease(3, 9, t) : t < 33 ? 3000 : 3000 - 2996 * ease(33, 38, t);
        const kv = 22 * (ease(9, 13, t) - ease(33, 37, t));
        let mw = 660 * ease(19, 25, t);
        if (!wrong) mw *= 1 - ease(26, 29, t); else if (t >= BREAKER_OPEN) mw = 0;
        const bo = t < 17.5 ? 1 : t < 17.8 ? 1 - (t - 17.5) / 0.3 : t < BREAKER_OPEN ? 0 : t < BREAKER_OPEN + 0.25 ? (t - BREAKER_OPEN) / 0.25 : 1;
        const d0 = wrong ? ARC_ON : 31, d1 = wrong ? 29.0 : 33.5;
        const dop = Math.max(0, ease(d0, d1, t) - ease(36, 38.5, t));
        const sync = t < 13 ? -2 * Math.PI * 1.125 : t < 17.5 ? -2 * Math.PI * (17.5 - t) / 4 : 0;
        const arc = wrong && t >= ARC_ON && t < BREAKER_OPEN + 0.12 ? (t < BREAKER_OPEN ? 1 : 0.5) : 0;
        const alarm = wrong && t >= ARC_ON && t < 32;
        return { rpm, kv, mw, bo, dop, sync, arc, alarm };
      }
      let clock = 7, spin = 0, fan = 0, st = sim(7, false);
      const needleAngle = [() => (-135 + 270 * st.rpm / 3600) * Math.PI / 180, () => (-135 + 270 * st.kv / 25) * Math.PI / 180, () => (-135 + 270 * st.mw / 750) * Math.PI / 180, () => st.sync];
      function place(now) {
        // the rotor, exciter, coupling and shaft stub turn together about the generator axis (three: y = our z)
        one("rotor").forEach(g => turn(g, axisX, spin, 0, K.AXIS_Z, 0));
        one("rods").forEach(g => g.position.set(0, -K.ROD_STROKE * st.bo, 0));
        one("contact").forEach(g => g.position.set(K.CONTACT_STROKE * st.bo, 0, 0));
        const a = st.dop * K.BLADE_MAX;
        for (let ph = 0; ph < 3; ph++) {
          [["w", 0, 1], ["e", 1, -1]].forEach(([s, i, sign]) => one("blade" + ph + s).forEach(g => turn(g, axisY, sign * a, K.BLADES[ph][i][0], 0, -K.BLADES[ph][i][1])));
          const gap = K.BLADE.GAP0 + 2 * K.BLADE.B * (1 - Math.cos(a));
          const on = st.arc > 0 && gap > 0.12;
          const [cx, cy, cz] = K.ARCS[ph], k = Math.max(0.5, Math.min(1, gap / 1.0));
          const jit = on ? (Math.random() - 0.5) * 0.035 * K.U : 0;
          one("arc" + ph).forEach(g => {
            const sx = on ? gap : 0.0001;
            g.scale.set(sx, k, k);
            g.position.set(cx * (1 - sx), cz * (1 - k) + jit, -cy * (1 - k) - K.B_U * Math.sin(a) + jit * 0.5);
          });
          lit("Arc L" + (ph + 1), on ? st.arc * (1.2 + Math.random() * 1.4) : 0);
        }
        needleAngle.forEach((f, i) => one("ndl" + i).forEach(g => { const n = K.NEEDLES[i]; turn(g, axisBack, f(), n[0], n[1], -n[2]); }));
        for (let i = 0; i < 3; i++) one("cfan" + (i + 1)).forEach(g => turn(g, axisY, fan * (1 + 0.15 * i), K.FANS[i][0], 0, -K.FANS[i][1]));
        lit("Lamp Breaker", st.bo < 0.5 ? 1.6 : 0.15); lit("Lamp Disconnector", st.dop < 0.1 ? 1.6 : 0.15); lit("Lamp Alarm", st.alarm ? (Math.sin(now / 90) > -0.3 ? 1.8 : 0.4) : 0.1);
      }
      st = sim(24, false); spin = 0; place(0);
      return {
        tick(now, dt) {
          if (E.reduceMotion) return;
          dt = Math.max(0, Math.min(dt, 1 / 30));   // the first frame's dt can be a hair below zero
          clock += dt;
          const t = clock % LOOP, wrong = Math.floor(clock / LOOP) % 2 === 1;
          st = sim(t, wrong);
          spin += st.rpm / 60 * 2 * Math.PI * dt / 100;   // the true speed slowed 100 times: 3,000 rpm shows as half a turn a second
          fan += dt * (1.5 + 8 * st.mw / 660);
          place(now);
        },
      };
    },
  };
})();
