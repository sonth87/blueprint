// Trent 970 turbofan on a ground-run thrust frame: the model script for the blueprint engine.
// A 14-second thrust cycle (still with reduced motion): the three spools wind up from ground idle to take-off and back at
// their own relative speeds, slowed 240 times; the load cell dial follows the thrust (about the square of N1); the air
// streaks, the cold bypass wind and the hot core jet are lines-only parts whose strength follows the thrust.
(function () {
  "use strict";
  const G = window.T97_GEOMETRY;
  const D = (t, s) => [t, s];
  const DETAIL = {
    "Concrete Pad": D("Concrete pad", "The slab the thrust frame stands on, with expansion joints, a recessed apron under the intake and a blast apron under the jet."),
    "Anchor Plates": D("Anchor plates", "Steel plates bolted down to the pad under each column of the fixed frame."),
    "Fixed Frame": D("Fixed frame", "Four columns and a grid of beams that stand on the pad and carry the live frame; the thrust is reacted through it into the ground."),
    "Frame Bracing": D("Frame bracing", "Knee braces that stiffen the columns against the thrust and the beams."),
    "Reaction Bracket": D("Reaction bracket", "Hangs from the fixed frame's inner beams; the load cell and the strongback bear on its plate."),
    "Flexures": D("Flexures", "Thin vertical plates the live frame hangs from: stiff in every direction but along the engine, so the frame is free to move a hair under thrust."),
    "Live Frame": D("Live frame", "The beam frame the engine's pylon bolts to. It hangs from the fixed frame, so the engine's thrust pushes it forward against the load cell."),
    "Load Cell": D("Load cell", "A strain-gauged steel cylinder between the live frame and the fixed frame. It squeezes a little as the engine pushes forward, and the gauges turn that into the thrust reading."),
    "Signal Cable": D("Signal cable", "Carries the load cell's signal along the strongback to the dial."),
    "Strongback": D("Strongback", "A stiff beam from the reaction bracket out in front of the engine. The dial is hung from its end, clear of the intake flow."),
    "Dial Gauge": D("Dial gauge", "Reads the thrust over 270 degrees of scale, 0 to 400 kN, with a tick every 5 kN."),
    "Dial Needle": D("Dial needle", "Follows the load cell's reading: about 14 kN at ground idle and about 334 kN at take-off thrust."),
    "Pylon": D("Pylon", "The strut that carries the engine from above. Its top flange bolts to the live frame and its aft fairing runs back along the core."),
    "Upper Bifurcation": D("Upper bifurcation", "A fairing wall across the bypass duct that carries the pylon's pipes and wiring down to the core."),
    "Engine Mounts": D("Engine mounts", "Two mounts hold the engine to the pylon: one at the front on the intermediate case, one at the rear on the turbine case."),
    "Intake Cowl": D("Intake cowl", "The nose cowl, scarfed: its lip is cut at an angle, with the lower edge reaching further forward than the upper."),
    "Acoustic Liner": D("Acoustic liner", "A perforated barrel over a honeycomb in the intake that absorbs fan noise."),
    "Fan Case": D("Fan case", "The ring round the fan blades. It is strong enough to contain a blade if one ever breaks."),
    "Fan Cowl": D("Fan cowl", "The outer cowl between the intake and the thrust reverser; its inner wall is the outside of the bypass duct."),
    "Thrust Reverser Sleeve": D("Thrust reverser sleeve", "The aft part of the nacelle. On landing it slides back to uncover the cascades and send the bypass air forward."),
    "Reverser Cascades": D("Reverser cascades", "Rings of angled vanes that turn the bypass air forward when the sleeve slides back."),
    "Spinner": D("Spinner", "The cone on the fan that guides the air round the hub. A painted spiral shows that the fan is turning."),
    "Fan Disc": D("Fan disc", "The disc and hub the 24 fan blades are fitted into, joined to the low pressure shaft."),
    "Fan Blades": D("Fan blades", "Twenty-four wide-chord, swept blades, 2.95 m across the tips. They push most of the air round the core and make most of the thrust."),
    "Outlet Guide Vanes": D("Outlet guide vanes", "A ring of fixed vanes in the bypass duct that takes the swirl out of the fan's air so it leaves straight."),
    "Intermediate Case": D("Intermediate case", "Splits the fan's air between the core and the bypass duct, and carries the front engine mount and the front bearings on its struts."),
    "Core Cowl": D("Core cowl", "The outer skin of the engine core; it is also the inside wall of the bypass duct."),
    "IP Compressor Casing": D("IP compressor casing", "The stationary casing round the eight intermediate pressure stages, stepping in as the air is squeezed."),
    "IPC Stator Vanes": D("IPC stator vanes", "Fixed vanes between the intermediate compressor's rotor rows, that straighten the air for the next stage."),
    "IP Compressor Drum": D("IP compressor drum", "The drum the eight rotor rows are fitted to, turning with the intermediate pressure shaft."),
    "HP Compressor Casing": D("HP compressor casing", "The stationary casing round the six high pressure stages."),
    "HPC Stator Vanes": D("HPC stator vanes", "Fixed vanes between the high pressure compressor's rotor rows."),
    "HP Compressor Drum": D("HP compressor drum", "The drum the six high pressure rotor rows are fitted to; the fastest-turning part of the engine."),
    "Combustor Casing": D("Combustor casing", "The pressure vessel round the combustor; its diffuser slows the air coming out of the compressor."),
    "Combustor Liner": D("Combustor liner", "The annular flame tube: outer and inner liners joined by a dome with a ring of swirlers, and rows of holes for cooling and dilution air."),
    "Fuel Spray Nozzles": D("Fuel spray nozzles", "About twenty nozzles spread round the dome, each spraying fuel into the swirling air."),
    "Fuel Manifold": D("Fuel manifold", "The ring pipe that feeds fuel to every spray nozzle."),
    "HPT Nozzle Guide Vanes": D("HPT nozzle guide vanes", "Fixed vanes that aim the gas from the combustor onto the high pressure turbine blades."),
    "HPT Rotor 1": D("HPT rotor", "The single high pressure turbine stage; it drives the high pressure compressor through the outer shaft."),
    "IPT Nozzle Guide Vanes": D("IPT nozzle guide vanes", "Fixed vanes that aim the gas onto the intermediate pressure turbine."),
    "IPT Rotor 1": D("IPT rotor", "The single intermediate pressure turbine stage; it drives the intermediate compressor through the middle shaft."),
    "LPT Stators": D("LPT stators", "Fixed vanes before each of the five low pressure turbine rotors."),
    "Turbine Casing": D("Turbine casing", "The casing round the turbines; it widens in steps as the gas expands."),
    "HP Shaft": D("HP shaft", "The outer, shortest shaft: it joins the high pressure turbine to the high pressure compressor."),
    "IP Shaft": D("IP shaft", "The middle shaft: it joins the intermediate pressure turbine to the intermediate compressor."),
    "LP Shaft": D("LP shaft", "The inner, longest shaft: it joins the five-stage low pressure turbine at the back to the fan at the front."),
    "Bearings": D("Bearings", "Ball bearings take the shafts' thrust, roller bearings carry their weight; each shaft rests on its own."),
    "Bearing Housings": D("Bearing housings", "Cones that hold the bearings and tie them to the engine's structure."),
    "Core Nozzle": D("Core nozzle", "The ring the core gas leaves through, round the plug."),
    "Exhaust Plug": D("Exhaust plug", "The cone behind the turbine that shapes the core flow as it leaves."),
    "Turbine Exit Frame": D("Turbine exit frame", "Struts behind the last turbine that hold the rear bearing and straighten the gas."),
    "Intake Air A": D("Intake air", "Streaks of air drawn towards the intake, converging on the fan; they march faster as the thrust rises."),
    "Bypass Wind A": D("Bypass wind", "Most of the air passes round the core and leaves the bypass nozzle cold: the main part of the thrust."),
    "Core Jet A": D("Core jet", "The rest of the air is burned with fuel and leaves round the plug as a hot jet that shimmers."),
  };
  ["B", "C"].forEach(k => { DETAIL["Intake Air " + k] = DETAIL["Intake Air A"]; DETAIL["Bypass Wind " + k] = DETAIL["Bypass Wind A"]; DETAIL["Core Jet " + k] = DETAIL["Core Jet A"]; });
  for (let i = 1; i <= 8; i++) DETAIL["IPC Rotor " + i] = D("IPC rotor " + i, "Stage " + i + " of the eight-stage intermediate pressure compressor: a ring of small blades that pushes the air on and squeezes it.");
  for (let i = 1; i <= 6; i++) DETAIL["HPC Rotor " + i] = D("HPC rotor " + i, "Stage " + i + " of the six-stage high pressure compressor: a row of ever smaller blades.");
  for (let i = 1; i <= 5; i++) DETAIL["LPT Rotor " + i] = D("LPT rotor " + i, "Stage " + i + " of the five-stage low pressure turbine; it turns the fan through the long inner shaft.");

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "t97-theme",
    touchHint: "Tap the engine to take it apart",
    view: { az: 30, el: 20, fit: 0.72 },
    spoolOf: o => o.spool || null,
    occluders: ["Concrete Pad", "Fixed Frame", "Intake Cowl", "Fan Cowl", "Thrust Reverser Sleeve", "Core Cowl", "Pylon", "Live Frame", "Strongback", "Fan Blades"],
    // parts drawn only as lines that stay lines in the shaded and photo styles (an effect, not a surface)
    fxLines: [{ match: /^(Intake Air [ABC]|Bypass Wind [ABC])$/, color: 0xa8d4ff }, { match: /^Core Jet [ABC]$/, color: 0xffa04a }, /^(LP Shaft|IP Shaft|HP Shaft|IP Compressor Drum|HP Compressor Drum)$/],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Concrete/, ["greyPaint", { color: 0x8a8b86, roughness: 0.95 }]], [/Anchor|Fixed Frame|Bracing|Bracket|Strongback|Live Frame|Flexures/, ["greyPaint", { color: 0x5a5e64, roughness: 0.7 }]],
      [/Load Cell|Dial Gauge/, ["darkAlu", { color: 0x4a4e54 }]], [/Needle/, ["plastic", { color: 0xd83a2a }]], [/Cable|Harness/, "rubber"],
      [/Pylon|Bifurcation|Mounts/, ["alu", { color: 0xc4c6c9 }]], [/Cowl|Sleeve|Fan Case|Liner/, ["alu", { color: 0xe4e5e7, roughness: 0.3 }]],
      [/Fan Blades|Spinner|Fan Disc/, ["alu", { color: 0xd0d2d6, roughness: 0.2 }]], [/Combustor|Fuel|Turbine|HPT|IPT|LPT/, ["copper", { color: 0x9a7a5a, roughness: 0.4 }]],
      [/Shaft|Bearing/, "steel"], [/Air|Wind/, ["plastic", { color: 0xaed8f5 }]], [/Jet/, ["plastic", { color: 0xffb36b }]],
    ],

    setup(E) {
      const AXIS = new THREE.Vector3(1, 0, 0), BACK = new THREE.Vector3(0, 0, -1);
      const turn = (k, a, ax) => (E.spinners[k] || []).forEach(g => g.quaternion.setFromAxisAngle(ax || AXIS, a));
      const sm = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
      // the thrust lever over a 14 s cycle: ground idle, up to take-off, hold, back to idle
      const LOOP = 14;
      const lever = t => { const p = (t % LOOP) / LOOP; return p < 0.07 ? 0 : p < 0.45 ? sm((p - 0.07) / 0.38) : p < 0.58 ? 1 : p < 0.93 ? 1 - sm((p - 0.58) / 0.35) : 0; };
      const N1_0 = 0.21, N1_1 = 0.943, T_0 = 14, T_1 = 334;
      // N1 as a share of 2900 rpm, N2 of 8300 rpm, N3 of 12200 rpm; the spools run 240 times slower than real
      const SLOW = 240, RPM = [2900, 8300, 12200];
      const state = s => {
        const n1 = N1_0 + (N1_1 - N1_0) * s, f = (n1 * n1 - N1_0 * N1_0) / (N1_1 * N1_1 - N1_0 * N1_0);
        return { n1, n2: 0.6 + 0.37 * s, n3: 0.68 + 0.3 * s, f, kn: T_0 + (T_1 - T_0) * f };
      };
      const mats = names => names.map(n => E.byName[n]).filter(Boolean).map(e => e.mats[0]);
      const sets = [["Intake Air A", "Intake Air B", "Intake Air C"], ["Bypass Wind A", "Bypass Wind B", "Bypass Wind C"], ["Core Jet A", "Core Jet B", "Core Jet C"]].map(l => mats(l));
      const base = sets.map(l => l.map(m => m.userData.base));
      const GAIN = [[0.2, 1.5], [0.12, 1.5], [0.15, 1.7]];
      const air = (f, now) => {
        const t = now / 1000;
        sets.forEach((l, k) => l.forEach((m, i) => {
          const speed = 0.7 + 1.8 * f, ph = (t * speed - i / 3) % 1, pulse = 0.3 + 0.7 * Math.pow(0.5 + 0.5 * Math.cos(TAU * ph), 1.5);
          const flick = k === 2 ? 0.8 + 0.2 * Math.sin(now / (37 + 9 * i)) * Math.sin(now / (53 + 7 * i)) : 1;
          m.userData.base = base[k][i] * (GAIN[k][0] + (GAIN[k][1] - GAIN[k][0]) * f) * pulse * flick;
        }));
      };
      const TAU = 2 * Math.PI;
      let aFan = 0, aIp = 0, aHp = 0, t = 0;
      const pose = (s, now) => {
        const st = state(s);
        turn("fan", aFan); turn("lpt", aFan); turn("ip", aIp); turn("hp", aHp);
        turn("dial", (-135 + 270 * st.kn / 400) * Math.PI / 180, BACK);
        air(st.f, now);
      };
      pose(0.55, 0);
      return {
        tick(now, dt) {
          if (E.reduceMotion) return;
          dt = Math.max(0, Math.min(dt, 1 / 30));
          t += dt;
          const st = state(lever(t));
          aFan += TAU * st.n1 * RPM[0] / 60 / SLOW * dt;
          aIp += TAU * st.n2 * RPM[1] / 60 / SLOW * dt;
          aHp += TAU * st.n3 * RPM[2] / 60 / SLOW * dt;
          pose(lever(t), now);
        },
      };
    },
  };
})();
