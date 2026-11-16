// API 610 OH2 process pump: the model script for the blueprint engine. A 24 s demo cycle (still, at the cavitating moment,
// with reduced motion): normal duty (55 m3/h, 58.7 m, NPSH margin 1.0 m); the drum level falls and the strainer fouls, so
// NPSH available drops below NPSH required; vapour sheets grow on the suction side of the six vanes near the eye and the
// head on the discharge gauge falls; then the level refills, the strainer is cleared, and the throttling globe valve closes
// and reopens (stem rising, handwheel turning). The impeller really runs at about 1,480 rpm; it is drawn about 50 times slower.
(function () {
  "use strict";
  const G = window.PPU_GEOMETRY;
  const K = G.constants;
  const D = (t, s) => [t, s];
  const DETAIL = {
    "Baseplate": D("Baseplate", "A fabricated steel frame of channels carries pump, bearing housing and motor in line, and is grouted to the foundation."),
    "Deck Plate": D("Deck plate", "The top plate of the baseplate, machined where the feet sit."),
    "Grout Holes": D("Grout holes", "Openings through which grout is poured under the plate; the rings are their rims."),
    "Lifting Lugs": D("Lifting lugs", "Four lugs to lift the baseplate and the set on it."),
    "Anchor Bolts": D("Anchor bolts", "Hold the baseplate down on the foundation."),
    "Motor Pads": D("Motor pads", "Raised pads that bring the motor shaft to the pump's height; shims go on top."),
    "Pump Pedestals": D("Pump pedestals", "Blocks under the casing feet and the bearing housing foot, lifting the pump to the shaft height."),
    "Motor Frame": D("Motor frame", "The cast stator frame of the 18.5 kW four-pole motor, about 1,480 rpm at 50 Hz."),
    "Cooling Fins": D("Cooling fins", "Fins on the frame; the shaft fan blows air along them."),
    "Drive End Shield": D("Drive end shield", "Holds the motor's drive-end bearing and the shaft where it leaves."),
    "Fan Cowl": D("Fan cowl", "Covers the cooling fan at the non-drive end and guides air along the fins."),
    "Terminal Box": D("Terminal box", "Where the supply cable meets the stator windings."),
    "Motor Feet": D("Motor feet", "Bolt the motor to its pads."),
    "Motor Shaft": D("Motor shaft", "The keyed shaft that carries the coupling hub."),
    "Lifting Eye": D("Lifting eye", "To lift the motor on its own."),
    "Nameplate": D("Nameplate", "Rating plate on the frame."),
    "Pump Hub": D("Pump hub", "Fits on the pump shaft end and carries one side of the coupling."),
    "Motor Hub": D("Motor hub", "Fits on the motor shaft."),
    "Spacer": D("Spacer", "A removable section between the hubs: the seal and bearing housing can come out without moving the motor."),
    "Disc Packs": D("Disc packs", "Thin steel discs that flex a little to take small misalignment."),
    "Coupling Bolts": D("Coupling bolts", "Six at each end; they turn with the shaft (drawn slowly here)."),
    "Coupling Guard": D("Coupling guard", "A cover over the spinning coupling, required for safety."),
    "Guard Brackets": D("Guard brackets", "Hold the guard to the bearing housing and the motor."),
    "Volute Casing": D("Volute casing", "The spiral casing, cut open above the shaft: its passage widens from the cutwater round to the throat."),
    "Cutwater": D("Cutwater", "The tongue where the spiral starts; it divides the passage from the throat."),
    "Throat": D("Throat", "The end of the spiral, where the liquid leaves upward into the discharge nozzle."),
    "Casing Cover": D("Casing cover", "Closes the back of the casing and carries the seal chamber."),
    "Casing Studs": D("Casing studs", "Hold the cover to the casing."),
    "Casing Feet": D("Casing feet", "Feet at the shaft height, so heat growth does not shift the shaft: a centreline-mounted pump."),
    "Suction Nozzle": D("Suction nozzle", "End suction: liquid enters along the shaft axis through a flange."),
    "Discharge Nozzle": D("Discharge nozzle", "Top discharge: the liquid leaves upward through a flange."),
    "Front Wear Ring": D("Front wear ring", "A replaceable ring that keeps the gap small round the impeller eye, so little liquid leaks back."),
    "Back Wear Ring": D("Back wear ring", "Seals the back of the impeller; leakage past it also sets the thrust."),
    "Impeller Vanes": D("Impeller vanes", "Six backswept vanes. About 1,480 rpm in life, drawn about 50 times slower."),
    "Impeller Shrouds": D("Impeller shrouds", "The two side walls of the closed impeller, drawn as strips so the vanes show through."),
    "Impeller Hub": D("Impeller hub", "Fixes the 410 mm impeller to the shaft."),
    "Pump Shaft": D("Pump shaft", "Carries the impeller; it runs through the seal, the bearings and out to the coupling."),
    "Vapour Sheets S": D("Vapour bubbles", "First bubbles on the suction side of each vane near the eye, when pressure there drops to the vapour pressure."),
    "Vapour Sheets M": D("Vapour pockets", "The bubbles join into short pockets as the suction head falls further."),
    "Vapour Sheets L": D("Vapour sheets", "Long sheets of vapour that choke the passage between the vanes, so the head falls."),
    "Seal Chamber": D("Seal chamber", "The space round the shaft where the mechanical seal sits, full of hot gas oil."),
    "Gland Plate": D("Gland plate", "Holds the stationary seal face and closes the chamber."),
    "Gland Studs": D("Gland studs", "Bolt the gland to the seal chamber."),
    "Shaft Sleeve": D("Shaft sleeve", "A renewable sleeve that protects the shaft under the seal."),
    "Metal Bellows": D("Metal bellows", "A welded metal bellows keeps the rotating face pressed on the stationary one; it suits hot oil where rubber would fail."),
    "Rotating Face": D("Rotating face", "A hard face that turns with the shaft."),
    "Stationary Face": D("Stationary face", "A carbon face held in the gland; the two faces run on a film a few microns thick."),
    "Flush Line": D("Flush line", "Takes liquid from the casing to the seal chamber to cool the faces (the API 682 plan 11 pattern)."),
    "Bearing Bracket": D("Bearing bracket", "Joins the casing cover to the bearing housing and holds the seal."),
    "Bearing Housing": D("Bearing housing", "Holds the two bearing sets and an oil sump, cut open to show them."),
    "Outboard End Cover": D("Outboard end cover", "Closes the housing at the coupling end."),
    "Bearing Cartridge": D("Bearing cartridge", "Sleeves that seat the bearings in the housing."),
    "Radial Bearing": D("Radial bearing", "A ball bearing next to the impeller that carries the radial load."),
    "Thrust Bearings": D("Thrust bearings", "A duplex pair of angular-contact ball bearings that carry the axial thrust."),
    "Bearing Balls": D("Bearing balls", "Steel balls that roll between the races; the cage turns at about 0.4 of shaft speed."),
    "Bearing Lock Nut": D("Bearing lock nut", "Locks the thrust bearings on the shaft."),
    "Oil Sump": D("Oil sump", "An oil bath in the bottom of the housing; its level reaches the lowest balls."),
    "Sight Glass": D("Sight glass", "Shows the oil level."),
    "Constant Level Oiler": D("Constant-level oiler", "An inverted bottle that tops up the sump to a fixed level."),
    "Drain Plug": D("Drain plug", "To drain the oil."),
    "Bearing Housing Foot": D("Bearing housing foot", "Supports the housing on the baseplate."),
    "Suction Pipe": D("Suction pipe", "DN150 line from the drum's boot to the pump, short and low in loss."),
    "Suction Reducer": D("Suction reducer", "Steps the line down to the pump's DN100 suction nozzle."),
    "Suction Flanges": D("Suction flanges", "Bolted joints, so valve and strainer can be taken out."),
    "Suction Flange Bolts": D("Flange bolts", "Stud bolts that clamp the flanges."),
    "Pipe Supports": D("Pipe supports", "Carry the line's weight so the pump nozzle stays free of strain."),
    "Gate Valve Body": D("Gate valve body", "Isolates the pump from the drum; fully open or fully shut, never throttling."),
    "Gate Valve Bonnet": D("Bonnet and yoke", "The cover over the gate and the frame that carries the handwheel."),
    "Gate Valve Stem": D("Gate valve stem", "A rising stem: you see it climb when the valve is opened."),
    "Gate Valve Handwheel": D("Gate valve handwheel", "Turned by hand to raise or lower the gate."),
    "Strainer Body": D("Strainer body", "Holds the basket in the suction line."),
    "Strainer Cap": D("Strainer cap", "Bolted cover to take the basket out and clean it."),
    "Strainer Basket": D("Strainer basket", "A perforated basket that catches debris; as it clogs it takes pressure from the suction."),
    "Discharge Reducer": D("Discharge reducer", "Joins the pump's DN80 nozzle to the DN100 valves (sizes estimated)."),
    "Discharge Pipe": D("Discharge pipe", "Rises from the nozzle, then turns away over the valves."),
    "Discharge Flanges": D("Discharge flanges", "Bolted joints of the discharge line."),
    "Discharge Flange Bolts": D("Discharge flange bolts", "Stud bolts clamping the flanges."),
    "Check Valve Body": D("Check valve body", "A swing check valve: it lets liquid go up and shuts when the pump stops."),
    "Check Valve Cover": D("Check valve cover", "Bolted cover over the flap and its hinge."),
    "Check Flap": D("Check flap", "The hinged flap that lifts with the flow and falls back if it reverses."),
    "Globe Valve Body": D("Globe valve body", "A throttling valve: the flow is set by how far its plug sits from the seat."),
    "Globe Valve Bonnet": D("Globe valve bonnet", "Cover and yoke over the plug and stem."),
    "Globe Stem": D("Globe stem", "Rises as the handwheel opens the valve and sinks as it closes."),
    "Globe Handwheel": D("Globe handwheel", "Turns about 10 times to move the stem from open to shut."),
    "Drum Shell": D("Drum shell", "A vertical vessel, cut away in quarter: the liquid inside stands at the level shown."),
    "Drum Heads": D("Drum heads", "The domed ends of the vessel."),
    "Boot": D("Boot", "A small pot under the drum from which the pump draws; it gives a deeper pool."),
    "Drum Legs": D("Drum legs", "Raise the drum so the liquid level gives suction head."),
    "Feed Nozzle": D("Feed nozzle", "Where gas oil enters the drum."),
    "Vent Nozzle": D("Vent nozzle", "On top, for the vapour space."),
    "Outlet Nozzle": D("Outlet nozzle", "The pump's suction line leaves the boot here."),
    "Vortex Breaker": D("Vortex breaker", "Crossed plates that stop a whirlpool from drawing vapour into the line."),
    "Heel Liquid": D("Heel liquid", "The liquid that always stays in the head and boot."),
    "Level Gauge Chamber": D("Level gauge chamber", "A column joined to the drum above and below, so its level matches the drum's."),
    "Drum Liquid": D("Drum liquid", "Gas oil a little below its bubble point; its level moves with the cycle."),
    "Gauge Flags": D("Gauge flags", "Magnetic flags that flip from white to red below the level."),
    "Gauge Float": D("Gauge float", "A magnetic float riding on the liquid; its field turns the flags."),
    "Discharge Gauge": D("Discharge gauge", "Reads the head the pump makes; the needle drops when it cavitates."),
    "Discharge Needle": D("Discharge needle", "Follows the discharge head."),
    "Gauge Tap": D("Gauge tap", "Takes pressure from the line to the gauge."),
    "Suction Gauge": D("Suction gauge", "Reads pressure in the suction line, which follows the drum level."),
    "Suction Needle": D("Suction needle", "Follows suction pressure."),
    "Suction Gauge Tap": D("Suction gauge tap", "Takes suction pressure to the gauge."),
    "Suction DP Gauge": D("Strainer gauge", "Reads the pressure difference across the strainer: it rises as the basket clogs."),
    "Suction DP Needle": D("Strainer needle", "Rises with the fouling."),
    "DP Impulse Lines": D("Impulse lines", "Take pressure from before and after the strainer to the gauge."),
    "LCS Enclosure": D("Local control station", "A box beside the pump with the motor's start, stop and meter."),
    "LCS Post": D("Station post", "Holds the station at a standing height."),
    "Push Buttons": D("Push buttons", "Start, stop and emergency stop."),
    "Conduit": D("Conduit", "Carries the motor cable to the terminal box."),
    "Ammeter Gauge": D("Ammeter", "Motor current; about 18 A at 9.5 kW, and it wanders when the pump cavitates."),
    "Ammeter Needle": D("Ammeter needle", "Follows the motor current."),
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "pp-theme",
    touchHint: "Tap the pump to take it apart",
    view: { az: 40, el: 24, fit: 0.7 },
    spoolOf: o => o.spool || null,
    occluders: ["Baseplate", "Motor Frame", "Volute Casing", "Drum Shell", "Strainer Body", "Check Valve Body", "Globe Valve Body", "LCS Enclosure", "Bearing Housing"],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Baseplate|Deck|Pedestals|Lugs|Pads|Legs|Supports|Post|Boot/, ["greyPaint", { color: 0x4a4e54, roughness: 0.8 }]],
      [/Motor Frame|Fan Cowl|Shield|Terminal|Enclosure/, ["greyPaint", { color: 0x3b5a7a, roughness: 0.6 }]],
      [/Drum|Level Gauge Chamber|Nozzle|Casing|Volute|Throat|Bracket|Housing/, ["steel", { color: 0xb8bcc2, roughness: 0.5 }]],
      [/Impeller|Wear Ring/, ["copper", { color: 0xc89a5a, roughness: 0.35 }]],
      [/Needle/, ["plastic", { color: 0xc8231b }]], [/Gauge$/, ["plastic", { color: 0xe8e6e1 }]],
      [/Handwheel/, ["plastic", { color: 0xc8231b }]], [/Guard/, ["plastic", { color: 0xe0b020 }]],
      [/Valve|Strainer|Pipe|Reducer|Flange|Hub|Spacer|Shaft|Seal|Gland|Bellows|Bearing/, ["steel", { roughness: 0.35 }]],
    ],

    setup(E) {
      const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
      const spin = (k, ax, a) => (E.spinners[k] || []).forEach(g => g.quaternion.setFromAxisAngle(ax, a));
      const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
      const sm = u => { u = clamp(u); return u * u * (3 - 2 * u); };
      const ramp = (t, a, b, v0, v1) => v0 + (v1 - v0) * sm((t - a) / (b - a));
      const sheets = ["Vapour Sheets S", "Vapour Sheets M", "Vapour Sheets L"].map(n => { const m = E.byName[n] && E.byName[n].mats[0]; return m ? { m, b: m.userData.base } : null; });
      const ang = (frac) => (135 - 270 * clamp(frac)) * Math.PI / 180;
      const STILL = 11;
      let clock = 0, rot = 0;
      function pose(t, dt) {
        t = ((t % 24) + 24) % 24;
        const L = t < 4 ? 0.62 : t < 10 ? ramp(t, 4, 10, 0.62, 0.08) : t < 14 ? 0.08 : t < 19 ? ramp(t, 14, 19, 0.08, 0.62) : 0.62;
        const f = t < 6 ? 0 : t < 11 ? ramp(t, 6, 11, 0, 1) : t < 14 ? 1 : t < 17 ? ramp(t, 14, 17, 1, 0) : 0;
        const v = t < 19 ? 1 : t < 20.5 ? ramp(t, 19, 20.5, 1, 0.35) : t < 22 ? 0.35 : ramp(t, 22, 23.5, 0.35, 1);
        const margin = 1.0 + 3 * (L - 0.62) - 2.2 * f;
        const cav = clamp((0.2 - margin) / 1.6);
        const loss = 0.45 * Math.pow(cav, 1.3);
        const q = 55 * Math.pow(v, 0.8);
        const head = 58.7 * (1 + 0.12 * (1 - q / 55)) * (1 - loss);
        const kW = 9.5 * (q / 55) * (1 - 0.25 * loss) * (0.8 + 0.2 * (q / 55));
        const jit = cav * (Math.sin(t * 37) * 0.04 + Math.sin(t * 91) * 0.03);
        const travel = 60 * (1 - v);
        // impeller and everything on the shaft, slowed about 50 times
        if (dt) rot += dt * 2 * Math.PI * 0.5;
        spin("imp", X, -rot); spin("cpl", X, -rot); spin("cage", X, -rot * 0.4);
        sheets.forEach((s, i) => { if (s) s.m.userData.base = s.b * 1.4 * sm([cav / 0.25, (cav - 0.2) / 0.4, (cav - 0.5) / 0.4][i]); });
        // gauges
        spin("gd", Z, ang(head / 80 + jit)); spin("gs", Z, ang(0.18 + 0.5 * L * (1 - 0.5 * f)));
        spin("gp", Z, ang(0.05 + 0.8 * f)); spin("am", Z, ang(0.45 * Math.pow(kW / 9.5, 0.8) + jit * 1.5));
        // drum, level gauge, globe valve
        const zl = 1100 * L - 100;
        (E.spinners.liq || []).forEach(g => g.scale.set(1, Math.max(0.01, L), 1));
        (E.spinners.lvl || []).forEach(g => g.scale.set(1, Math.max(0.005, zl / 1000), 1));
        (E.spinners.flt || []).forEach(g => g.position.set(0, Math.max(0, zl), 0));
        (E.spinners.gst || []).forEach(g => g.position.set(0, -travel, 0));
        spin("gwh", Y, travel / 6 * 2 * Math.PI);
      }
      pose(E.reduceMotion ? STILL : 0, 0);
      return {
        tick(now, dt) {
          if (E.reduceMotion) return;
          dt = Math.max(0, Math.min(dt, 1 / 30));
          clock += dt;
          pose(clock, dt);
        },
      };
    },
  };
})();
