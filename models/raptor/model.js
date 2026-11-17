// Rocket engine on a test stand: the model script for the blueprint engine, which raptor/build.js inlines after the
// generated geometry. A 12-second firing cycle (off with reduced motion): quiet, ignition, steady burn with a flickering
// plume, shutdown. The plume is a lines-only part whose line strength model.js sets.
(function () {
  "use strict";
  const G = window.RE_GEOMETRY;
  const DETAIL = {
    "Stand Columns": ["Stand columns", "Four steel columns on base plates, spliced in sections."],
    "Stand Beams": ["Stand beams", "Tie the columns together at the top and carry the thrust frame."],
    "Deck": ["Deck", "A grated working platform round the engine, open in the middle for the nozzle."],
    "Deck Rails": ["Deck rails", "Guard rails round the deck."],
    "Flame Deflector": ["Flame deflector", "A water-cooled steel cone that turns the plume sideways into the trench."],
    "Deluge Ring": ["Deluge ring", "Sprays water into the plume to absorb heat and sound."],
    "Crosshead": ["Crosshead", "The beam the engine hangs from; every newton of thrust passes through it."],
    "Load Cell": ["Load cell", "Measures the force between the engine and the crosshead: the engine's thrust."],
    "Gimbal": ["Gimbal", "A two-axis pivot on the thrust puck, so the engine can tilt to steer the rocket."],
    "Gimbal Actuators": ["Gimbal actuators", "Two electric actuators at right angles that push the engine round its gimbal."],
    "Injector": ["Injector", "Mixes the oxygen-rich and fuel-rich gas from the two preburners into the chamber."],
    "Main Chamber": ["Main chamber", "Where the two gas flows burn, at about 300 bar, then squeeze through the throat."],
    "Nozzle": ["Nozzle", "The bell that expands the gas to over 3 km/s; its wall is a mesh of channels carrying methane to cool it."],
    "Nozzle Manifold": ["Nozzle manifold", "A ring that spreads methane from the downcomer into the nozzle's cooling channels."],
    "Oxygen Turbopump": ["Oxygen turbopump", "A turbine and a pump on one shaft: raises the liquid oxygen to over 500 bar."],
    "Oxygen-Rich Preburner": ["Oxygen-rich preburner", "Burns a little methane in all of the oxygen to drive the oxygen turbine."],
    "Methane Turbopump": ["Methane turbopump", "Raises the liquid methane to its working pressure."],
    "Fuel-Rich Preburner": ["Fuel-rich preburner", "Burns a little oxygen in all of the methane to drive the methane turbine."],
    "Hot-Gas Manifolds": ["Hot-gas manifolds", "Carry both turbines' exhaust on to the injector: nothing is thrown away."],
    "Oxygen Inlet Duct": ["Oxygen inlet duct", "Liquid oxygen at −183 °C from the vehicle's tank."],
    "Main Oxygen Valve": ["Main oxygen valve", "Opens and throttles the oxygen flow."],
    "Methane Inlet Duct": ["Methane inlet duct", "Liquid methane at −162 °C from the vehicle's tank."],
    "Downcomer": ["Downcomer", "Takes methane from its pump down to the nozzle manifold to cool the nozzle first."],
    "Main Fuel Valve": ["Main fuel valve", "Opens and throttles the methane flow."],
    "Jacket Return": ["Jacket return", "Brings the methane, warmed by the chamber's jacket, up to the fuel-rich preburner."],
    "Engine Controller": ["Engine controller", "The computer that sequences start-up and shutdown and runs the valves."],
    "Harness": ["Harness", "Cables to the valves, igniters and sensors."],
    "Exhaust Plume": ["Exhaust plume", "Methane and oxygen burnt to water and CO₂, with shock diamonds down its length."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "re-theme",
    touchHint: "Tap the engine to take it apart",
    view: { az: 35, el: 12 },
    spoolOf: o => o.spool || null,
    occluders: ["Stand Columns", "Deck", "Crosshead", "Main Chamber", "Nozzle", "Oxygen Turbopump", "Methane Turbopump", "Engine Controller", "Flame Deflector"],
    // parts drawn only as lines that stay lines in the shaded and photo styles (an effect, not a surface)
    fxLines: [{ match: /^Exhaust Plume$/, color: 0xff9a4a }],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Stand|Deck|Crosshead|Flame Deflector/, ["greyPaint", { color: 0x5a5e64, roughness: 0.8 }]], [/Deluge|Rails/, "steel"],
      [/Load Cell|Gimbal/, ["darkAlu", { color: 0x4a4e54 }]], [/Nozzle|Main Chamber|Injector/, ["copper", { color: 0x8a6a4a, roughness: 0.45 }]],
      [/Turbopump|Preburner|Hot-Gas|Inlet Duct|Downcomer|Jacket|Valve/, ["steel", { roughness: 0.35 }]],
      [/Engine Controller/, ["plastic", { color: 0xe8e6e1 }]], [/Harness/, "rubber"], [/Exhaust Plume/, ["plastic", { color: 0xffb36b }]],
    ],

    setup(E) {
      const m = E.byName["Exhaust Plume"] && E.byName["Exhaust Plume"].mats;
      const base = m ? m.map(x => x.userData.base) : [];
      const LOOP = 12;
      const level = t => t < 2 ? 0 : t < 2.6 ? (t - 2) / 0.6 : t < 9.4 ? 1 : t < 10 ? 1 - (t - 9.4) / 0.6 : 0;
      const set = (k, now) => { if (m) m.forEach((x, i) => { x.userData.base = base[i] * 1.5 * k * (0.86 + 0.14 * Math.sin(now / 37) * Math.sin(now / 53)); }); };
      set(0, 0);
      return {
        tick(now) {
          if (E.reduceMotion) { set(0, 0); return; }
          set(level((now / 1000) % LOOP), now);
        },
      };
    },
  };
})();
