// Foundry pour: the model script for the blueprint engine, which foundry/build.js inlines after the generated geometry
// and lib/screen-runtime.js. One loop of about 32 s, played back from the run simulated in build.js (a still frame
// with reduced motion): the hand wheel turns, the worm and the wheel on the ladle follow at 40:1, the ladle tilts,
// the stream, the basin, the sprue, the mould and the risers fill from the real volumes, the casting freezes, and
// a new mould and a refilled ladle start again.
(function () {
  "use strict";
  const G = window.FDY_GEOMETRY, K = G.consts, RUN = G.run;
  const DETAIL = {
    "Floor Plate": ["Floor plate", "Chequer plate over the foundry floor, so a dropped splash of steel lands on steel, not on concrete."],
    "Spill Bund": ["Spill bund", "A low steel wall round the stand that holds back any steel that misses the mould."],
    "Safety Line": ["Safety line", "The painted keep-out line round the pouring area."],
    "Base Plates": ["Base plates", "Four thick plates welded under the posts, bolted to the floor."],
    "Anchor Bolts": ["Anchor bolts", "Sixteen studs with nuts and washers that hold the base plates to the floor."],
    "Front Frame": ["Front frame", "Two posts and a beam welded together, carrying the front pillow block."],
    "Rear Frame": ["Rear frame", "The same welded frame on the far side of the ladle, carrying the rear pillow block."],
    "Gussets": ["Gussets", "Triangular plates welded into the corners so the posts do not rack under the ladle's weight."],
    "Frame Ties": ["Frame ties", "Low tubes that join the four posts into one rigid frame."],
    "Front Pillow Block": ["Front pillow block", "A split bearing housing that carries the front trunnion pin and lets the ladle turn."],
    "Rear Pillow Block": ["Rear pillow block", "Carries the rear trunnion pin; the same housing as the front one."],
    "Pillow Block Bolts": ["Pillow block bolts", "Hold each bearing housing down on its beam."],
    "Gearbox Support": ["Gearbox support", "A plate that carries the gearbox off the front of the beam."],
    "Ladle Shell": ["Ladle shell", "Welded steel plate in the shape of a cone, 8 mm thick. It is cut away at the front here to show the lining."],
    "Refractory Lining": ["Refractory lining", "45 mm of refractory brick inside the shell. It stands the steel's heat so the shell does not melt."],
    "Bottom Plate": ["Bottom plate", "The plate welded across the base of the shell, under the lining's floor."],
    "Ladle Foot": ["Ladle foot", "A ring under the bottom plate that lets the ladle stand upright on the floor."],
    "Ladle Rim": ["Ladle rim", "A steel ring round the open top that protects the top course of lining; it is broken at the spout."],
    "Ladle Belt": ["Ladle belt", "A thick ring round the middle of the shell that stiffens it and carries the trunnion pads."],
    "Ladle Band": ["Ladle band", "A hoop round the lower shell that keeps the cone round."],
    "Lifting Lugs": ["Lifting lugs", "Ears on the rim for the crane's hook, when the ladle is lifted away to be relined."],
    "Spout Floor": ["Spout floor", "The floor of the pouring trough; its edge is the lip the steel flows over."],
    "Spout Near Wall": ["Spout near wall", "One side of the pouring trough; it keeps the stream together."],
    "Spout Far Wall": ["Spout far wall", "The other side of the pouring trough."],
    "Trunnion Pads": ["Trunnion pads", "Thick discs welded to the belt that spread the load of the pins into the shell."],
    "Trunnion Pin Front": ["Front trunnion pin", "The 60 mm pin the ladle tilts on. It also carries the worm wheel and the dial needle."],
    "Trunnion Pin Rear": ["Rear trunnion pin", "The pin on the far side; it just turns in its bearing."],
    "Pin Collars": ["Pin collars", "Rings on the pins that keep the ladle from sliding along them."],
    "Worm Wheel Segment": ["Worm wheel segment", "Part of a 40-tooth wheel on the front pin, 12 teeth drawn: the ladle only turns about 60 degrees, so a segment is enough."],
    "Wheel Hub": ["Wheel hub", "Clamps the worm wheel segment to the trunnion pin."],
    "Slag Line": ["Slag line", "The ring on the lining where slag and the steel's top surface have been standing."],
    "Tilt Needle": ["Tilt needle", "Fixed to the end of the pin: it points straight up when the ladle is upright and turns with it."],
    "Counterweight Arm": ["Counterweight arm", "A bar bolted to the belt, on the side away from the spout."],
    "Arm Bracket": ["Arm bracket", "Bolts the arm to the ladle's belt."],
    "Counterweight Block": ["Counterweight", "A cast block, the weight that balances the spout side about the trunnions."],
    "Counterweight Stud": ["Counterweight stud", "A threaded rod through the arm and the block."],
    "Stud Nut": ["Stud nut", "Holds the block down on the arm."],
    "Stud Washer": ["Stud washer", "Spreads the nut's load over the block."],
    "Gearbox Housing": ["Gearbox housing", "The case round the worm and the wheel. It is open at the front under the cover's window so the gears show."],
    "Gearbox Cover": ["Gearbox cover", "Closes the front of the case; the window lets the gears be inspected, and the dial is on it."],
    "Worm Bearings": ["Worm bearings", "Bosses in the case ends that carry the worm shaft."],
    "Tilt Dial": ["Tilt dial", "A scale from 0 to 90 degrees; the needle reads the ladle's angle."],
    "Worm Shaft": ["Worm shaft", "The shaft from the hand wheel through the case."],
    "Worm": ["Worm", "A single-start thread, 9.4 mm lead. One turn moves the wheel on by one tooth, which is 9 degrees."],
    "Shaft Key": ["Shaft key", "Locks the hand wheel to the shaft."],
    "Hand Wheel Rim": ["Hand wheel rim", "The rim that the operator turns."],
    "Hand Wheel Hub": ["Hand wheel hub", "Joins the five spokes to the shaft."],
    "Wheel Handle": ["Wheel handle", "A grip on the rim for quick turns."],
    "Wheel Nut": ["Wheel nut", "Holds the wheel on the shaft."],
    "Wheel Spoke 1": ["Wheel spoke", "One of five spokes."], "Wheel Spoke 2": ["Wheel spoke", "One of five spokes."], "Wheel Spoke 3": ["Wheel spoke", "One of five spokes."],
    "Wheel Spoke 4": ["Wheel spoke", "One of five spokes."], "Wheel Spoke 5": ["Wheel spoke", "One of five spokes."],
    "Bottom Board": ["Bottom board", "The wooden board the mould is built and poured on."],
    "Board Skids": ["Board skids", "Two timbers under the board so a fork can get under it."],
    "Drag Flask": ["Drag flask", "The steel box that holds the lower half of the mould; the front is cut away to show the sand."],
    "Cope Flask": ["Cope flask", "The steel box for the upper half of the mould; it lifts off to open the mould."],
    "Drag Sand": ["Drag sand", "Rammed sand of the lower half, drawn in section with hatching; the cavity is the flanged plate."],
    "Cope Sand": ["Cope sand", "Rammed sand of the upper half with the sprue, the hub and the riser holes."],
    "Flask Clamps": ["Flask clamps", "Clamp the cope to the drag so the steel's pressure cannot lift it."],
    "Pouring Basin": ["Pouring basin", "A cup on the cope that takes the stream and feeds the sprue."],
    "Riser Sleeve 1": ["Riser sleeve", "An insulating sleeve over a riser, to keep its steel liquid longest."],
    "Riser Sleeve 2": ["Riser sleeve", "The second riser sleeve, on the far end of the casting."],
    "Sprue Plug": ["Sprue plug", "Closes the sprue until the basin is full, then is lifted."],
    "Basin Steel": ["Steel in the basin", "Drawn as level lines that rise with the volume that has arrived and drained."],
    "Sprue Steel": ["Steel in the sprue", "The column of steel dropping from the basin to the runner."],
    "Gating Steel": ["Steel in the gating", "The runner and gates that lead the steel into the bottom of the cavity."],
    "Casting Steel": ["Steel in the casting", "The steel filling the flanged plate, with the level taken from the volume poured."],
    "Hub Steel": ["Steel in the hub", "The raised hub of the casting, above the parting plane."],
    "Riser Steel": ["Steel in the risers", "Steel in the two risers, drawn up to the filling level."],
    "Stream": ["Stream", "The falling steel. Its width follows the flow over the lip, and its length the fall."],
    "Steel Bath": ["Steel bath", "The top surface of the steel in the ladle, flat however the ladle tilts."],
    "Tripod Legs": ["Tripod legs", "Three legs that hold the pyrometer at a fixed distance."],
    "Tripod Head": ["Tripod head", "A pan-and-tilt head with a lock."],
    "Mounting Yoke": ["Mounting yoke", "A fork that holds the body and lets it aim up and down."],
    "Pyrometer Body": ["Pyrometer", "A two-colour (ratio) pyrometer. It compares the steel's glow at two wavelengths."],
    "Lens Barrel": ["Lens barrel", "The optics that gather the glow of the stream."],
    "Pyrometer Display": ["Pyrometer display", "Shows the stream's temperature and the pour's progress."],
    "Aiming Beam": ["Aiming beam", "A thin sight line to the spot the pyrometer is reading."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "fdy-theme",
    touchHint: "Tap the foundry to take it apart",
    view: { az: 35, el: 22, fit: 0.8 },
    spoolOf: o => o.spool || null,
    occluders: ["Ladle Shell", "Refractory Lining", "Gearbox Housing", "Gearbox Cover", "Front Frame", "Rear Frame", "Drag Flask", "Cope Flask", "Pouring Basin", "Pyrometer Body", "Counterweight Block"],
    // parts drawn only as lines that stay lines in the shaded and photo styles (an effect, not a surface)
    fxLines: [{ match: /^(Steel Bath|Basin Steel|Sprue Steel|Gating Steel|Casting Steel|Hub Steel|Riser Steel)$/, color: 0xff9a2e }, { match: /^Stream$/, color: 0xffc766 }, { match: /^Aiming Beam$/, color: 0xff3b30 }, /^(Slag Line|Drag Sand|Cope Sand)$/],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Floor Plate|Spill Bund|Safety Line/, ["greyPaint", { color: 0x4a4d52, roughness: 0.8 }]], [/Frame|Gussets|Base Plates|Support/, ["greyPaint", { color: 0x3d5a7a, roughness: 0.6 }]],
      [/Pillow|Bolts|Collars|Bearings|Anchor/, "steel"], [/Ladle Shell|Rim|Belt|Band|Bottom Plate|Foot|Lugs|Pads|Spout|Pin/, ["greyPaint", { color: 0x6b6f75, roughness: 0.7 }]],
      [/Lining/, ["plastic", { color: 0xc9a46a, roughness: 0.9 }]], [/Slag/, ["plastic", { color: 0x55504a }]],
      [/Counterweight|Stud|Nut|Washer|Arm/, ["darkAlu", { color: 0x4a4e54 }]], [/Gearbox|Worm|Shaft|Key|Hub/, "steel"],
      [/Wheel|Handle/, ["plastic", { color: 0xd2341f, roughness: 0.4 }]], [/Dial|Needle/, ["plastic", { color: 0xf2efe6 }]],
      [/Board|Skids/, ["plastic", { color: 0xb08a5a, roughness: 0.9 }]], [/Flask|Clamps/, ["greyPaint", { color: 0x5a5e64 }]], [/Sand/, ["plastic", { color: 0xd8c8a0 }]],
      [/Basin|Sleeve|Plug/, ["plastic", { color: 0xe0dccf }]], [/Steel|Stream|Bath/, ["plastic", { color: 0xff8a2a }]],
      [/Tripod|Yoke/, ["darkAlu", { color: 0x2c2f33 }]], [/Pyrometer|Lens/, ["plastic", { color: 0x22252a }]], [/Aiming/, ["plastic", { color: 0xff3030 }]],
    ],

    setup(E) {
      const V = THREE;
      const one = k => E.spinners[k] || [];
      const AX = new V.Vector3(0, 0, 1), AXX = new V.Vector3(1, 0, 0);
      const base = n => { const m = E.byName[n] && E.byName[n].mats[0]; return m ? { m, b: m.userData.base } : null; };
      const fillNames = ["Basin Steel", "Sprue Steel", "Gating Steel", "Casting Steel", "Hub Steel", "Riser Steel", "Stream", "Steel Bath"];
      const B = {}; fillNames.forEach(n => { B[n] = base(n); });
      const N = RUN.th.length, CYC = RUN.cycle, STILL = 9.0;
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const lerp = (arr, f) => { const i = Math.floor(f) % N, j = (i + 1) % N, u = f - Math.floor(f); return arr[i] + (arr[j] - arr[i]) * u; };
      const RAD = Math.PI / 180, RHO = 7.0;   // kg per litre
      const fmt = v => Math.round(v).toLocaleString("en-US");
      let T = 0;
      const set = (list, fn) => list.forEach(fn);
      const grp = n => (E.partGroups && E.partGroups[n]) || null;
      const spin = k => one(k);
      const fillSpool = { "Basin Steel": "fbasin", "Sprue Steel": "fsprue", "Gating Steel": "fgate", "Casting Steel": "fcast", "Hub Steel": "fhub", "Riser Steel": "friser" };
      const grow = (k, f, bright) => {
        set(spin(k), g => { g.scale.set(1, Math.max(0.0001, f), 1); g.visible = f > 0.004; });
      };

      // the pyrometer's display
      const st = { text: "", t: "", kg: "", T: 0 };
      const scr = window.BP_screenAnimation(E, {
        screen: G.screen, part: "Pyrometer Display", width: 620, height: 360, always: true, still: STILL, fps: 20,
        draw(ctx, TT, { W, H }) {
          ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
          ctx.font = "500 30px 'IBM Plex Mono', monospace"; ctx.globalAlpha = 0.65;
          ctx.fillText("2-COLOUR  1.0/1.1 µm", 24, 52);
          ctx.globalAlpha = 1;
          ctx.font = "700 110px 'IBM Plex Mono', monospace";
          ctx.fillText(st.t, 24, 190);
          ctx.font = "500 32px 'IBM Plex Mono', monospace";
          ctx.fillText(st.text, 24, 262);
          ctx.globalAlpha = 0.65; ctx.fillText(st.kg, 24, 316);
        },
      });

      function frame(t) {
        const f = t / RUN.dt, th = lerp(RUN.th, f) * RAD, idx = Math.floor(f) % N;
        const state = RUN.state[idx], tl = lerp(RUN.tl, f);
        const L = (a) => lerp(a, f);
        // the ladle, the worm and the wheel: wheel turns = tilt x 40 / 360
        const q = new V.Quaternion().setFromAxisAngle(AX, -th);
        set(spin("ladle"), g => g.quaternion.copy(q));
        const wq = new V.Quaternion().setFromAxisAngle(AXX, -th * 40);
        set(spin("worm"), g => g.quaternion.copy(wq)); set(spin("wheel"), g => g.quaternion.copy(wq));
        // the steel in the ladle: level, centre and size of its top surface
        const vl = L(RUN.vl), bi = Math.floor(f) % N, bj = (bi + 1) % N, bu = f - Math.floor(f);
        const bv = k => RUN.bath[bi][k] + (RUN.bath[bj][k] - RUN.bath[bi][k]) * bu;
        set(spin("bath"), g => { g.visible = vl > 0.25; g.position.set(bv(1), bv(0), 0); g.scale.set(Math.max(1, bv(2)), 1, Math.max(1, bv(3))); });
        // the stream
        const qin = L(RUN.qin), hb = L(RUN.hb), lipx = K.LIP[0] * Math.cos(th) + K.LIP[1] * Math.sin(th), lipz = -K.LIP[0] * Math.sin(th) + K.LIP[1] * Math.cos(th);
        const landz = K.FB[2] + Math.max(hb, 4), dx = K.XB - lipx, dz = lipz - landz;
        set(spin("stream"), g => {
          g.visible = qin > 0.03 && dz > 6;
          g.position.set(lipx, lipz, 0); g.scale.set(dx, Math.max(1, dz), 2 + 9 * Math.sqrt(Math.max(0, qin) / 0.75));
          g.rotation.set(0, 0, 0);
        });
        // the plug
        const plugUp = L(RUN.plug) > 0.5 ? 1 : 0;
        set(spin("plug"), g => { g.position.y += (plugUp * 24 - g.position.y) * 0.2; });
        // the mould
        const kg = L(RUN.mould), lvl = L(RUN.lvl), clear = 1 - L(RUN.clear), frozen = L(RUN.frozen);
        grow("fbasin", clamp(hb / K.BASIN_H, 0, 1) * clear);
        grow("fsprue", (kg > 0.05 && plugUp ? 1 : 0) * (state >= 10 ? clear : 1) * clamp(kg / 0.8, 0, 1));
        grow("fgate", clamp((lvl - (K.ZP - 15)) / 15, 0, 1) * clear);
        grow("fcast", clamp((lvl - K.PL0) / K.H_PLATE, 0, 1) * clear);
        grow("fhub", clamp((lvl - K.PL1) / K.BOSS.h, 0, 1) * clear);
        grow("friser", clamp((lvl - K.PL1) / K.H_RIS, 0, 1) * clear);
        // the casting freezes: the steel lines fade
        const glow = 1 - 0.8 * frozen;
        ["Basin Steel", "Sprue Steel", "Gating Steel", "Casting Steel", "Hub Steel", "Riser Steel"].forEach(n => { if (B[n]) B[n].m.userData.base = Math.min(1, B[n].b * 1.5 * glow); });
        if (B["Stream"]) B["Stream"].m.userData.base = Math.min(1, B["Stream"].b * 1.6);
        if (B["Steel Bath"]) B["Steel Bath"].m.userData.base = Math.min(1, B["Steel Bath"].b * 1.5);
        // the pyrometer reads the stream
        const pouring = qin > 0.03 && state >= 2 && state <= 4;
        const stream = tl - 17 + (E.reduceMotion ? 0 : 2 * Math.sin(t * 7));
        const poured = L(RUN.poured).toFixed(1), ladleKg = (vl * RHO).toFixed(1);
        st.t = pouring ? fmt(stream) + " °C" : "--- °C";
        let s = "ladle " + fmt(tl) + " °C · " + ladleKg + " kg";
        if (state === 2) s = "spout full";
        else if (state === 3) s = "basin brim";
        else if (state === 4) s = lvl >= K.ZRF - 8 ? "risers full" : "stream flowing";
        else if (state === 6) s = "mould full";
        else if (state === 7) s = "feeding \u00b7 risers hot";
        else if (state === 8) s = "freezing · " + Math.max(1, Math.ceil((1 - frozen) * 3)) + " s left";
        else if (state === 9) s = "solid";
        else if (state === 10) s = "new mould";
        else if (state === 11) s = "refilling";
        st.text = s;
        st.kg = state >= 2 && state <= 9 ? poured + " kg poured" : "ladle " + ladleKg + " kg";
      }
      frame(E.reduceMotion ? STILL : 0);
      return {
        tick(now, dt) {
          dt = Math.max(0, Math.min(dt, 1 / 30));
          if (!E.reduceMotion) T += dt;
          frame(E.reduceMotion ? STILL : T % CYC);
          scr.tick(now);
        },
        recolor(fg, bg) { scr.recolor(fg, bg); },
      };
    },
  };
})();
