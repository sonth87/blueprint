// Arcade cabinet: the model script for the blueprint engine, which arcade/build.js inlines after the generated geometry
// and lib/screen-runtime.js. One 12-second loop drives everything (a still frame with reduced motion): the screen's
// attract mode says INSERT COIN, a quarter drops through the slot, the coin mechanism and the chute, flicks the coin
// switch (the screen gives a credit) and falls into the cash box; then a game plays, and the joystick leans with the
// ship on the screen. The game is made up for this page.
(function () {
  "use strict";
  const G = window.AC_GEOMETRY;
  const K = G.constants;
  const DETAIL = {
    "Left Side": ["Side panel", "18 mm board cut to the cabinet's profile; everything else is screwed between the two sides."],
    "Right Side": ["Side panel", "Taken off here to show the coin path, the monitor and the electronics."],
    "T-Molding": ["T-molding", "A plastic strip pushed into a slot round each side's edge, so the board's edge never shows."],
    "Kick Panel": ["Kick panel", "The lower front, with the opening for the coin door."],
    "Floor": ["Floor", "The power supply stands on it."],
    "Levelers": ["Levelers", "Screw feet, turned to stand the cabinet level on an uneven floor."],
    "Board Shelf": ["Board shelf", "Holds the game board at the back, where the operator can reach it through the back door."],
    "Top Panel": ["Top panel", "Closes the cabinet over the marquee."],
    "Back Door": ["Back door", "Locked; vents behind the monitor let its heat out."],
    "Coin Door": ["Coin door", "Two slots, a reject button under each, coin return cups and a lock for the cash box behind it."],
    "Coin Mechanisms": ["Coin mechanisms", "Check each coin's size, weight and metal; accepted coins fall to the chute, the rest to the return cup."],
    "Coin Chute": ["Coin chute", "A sloped trough that rolls accepted coins past the coin switch to the cash box."],
    "Coin Switch": ["Coin switch", "A microswitch with a long wire lever across the chute. Each passing coin closes it once: one credit."],
    "Cash Box": ["Cash box", "Collects the coins behind the locked lower door."],
    "Coin Counter": ["Coin counter", "An electromechanical counter that clicks once per coin, for the operator's books."],
    "Coin": ["Quarter", "24.26 mm across, 1.75 mm thick."],
    "Control Panel": ["Control panel", "Sloped towards the player, its top a steel plate under a printed overlay."],
    "Panel Overlay": ["Panel overlay", "The printed sheet on the panel, held by carriage bolts."],
    "Buttons": ["Buttons", "Three fire buttons and two start buttons, each a plunger on a microswitch."],
    "Microswitches": ["Microswitches", "Four under the joystick, one for each direction, and one under every button."],
    "Joystick": ["Joystick", "A ball-top stick on a pivot; its actuator underneath closes the switch on the side it leans to."],
    "Bezel": ["Bezel", "A printed panel framing the picture, under the glass."],
    "Bezel Glass": ["Bezel glass", "Tempered glass over the bezel and the tube."],
    "CRT": ["CRT", "A 19-inch colour picture tube, tilted back to face the player's eyes."],
    "Deflection Yoke": ["Deflection yoke", "Two pairs of coils round the tube's neck whose fields sweep the electron beam across and down the screen."],
    "Monitor Chassis": ["Monitor chassis", "The tube's mounting frame and the board that drives it, with its flyback transformer for the tube's high voltage."],
    "Marquee": ["Marquee", "The game's name on a translucent panel, lit from behind."],
    "Marquee Light": ["Marquee light", "A fluorescent tube in two holders."],
    "Speaker Panel": ["Speaker panel", "Closes the box above the monitor and carries the speakers."],
    "Speakers": ["Speakers", "Two cones firing down through grilles towards the player."],
    "Game Board": ["Game board", "The whole game on one PCB: processor, ROMs with the program and graphics, sound and video, and the 56-way edge connector."],
    "Wiring Harness": ["Wiring harness", "Bundles every switch, the video, the speakers and the power to the board's edge connector."],
    "Power Supply": ["Power supply", "A switching supply: 5 V for the logic and 12 V for the audio amplifier."],
  };

  // the coin's path, relative to the slot: in, down through the mechanism, along the chute, into the cash box
  const PATH = [[0, -60, 0, 0], [0, 4, 0, 0.5], [0, 58, 0, 0.9], [0, 58, -108, 1.3], [0, 75, -110, 1.45], [0, 92, -116, 1.6], [0, 150, -136, 2.05], [0, 245, -168, 2.6], [0, 260, -260, 2.95]];
  const SWITCH_AT = 2.05, COIN_T0 = 1.5, LOOP = 12;
  const along = t => {   // position of the coin t seconds after it starts
    if (t <= PATH[0][3]) return PATH[0].slice(0, 3);
    for (let i = 1; i < PATH.length; i++) if (t <= PATH[i][3]) {
      const a = PATH[i - 1], b = PATH[i], u = (t - a[3]) / (b[3] - a[3]), e = i === 3 || i === 8 ? u * u : u;   // falls speed up
      return [0, 1, 2].map(k => a[k] + (b[k] - a[k]) * e);
    }
    return PATH[PATH.length - 1].slice(0, 3);
  };
  const shipX = t => 0.5 + 0.32 * Math.sin(t * 1.25) + 0.08 * Math.sin(t * 3.1);   // the made-up game's ship, 0..1 across

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "ac-theme",
    touchHint: "Tap the cabinet to take it apart",
    view: { az: 35, el: 18 },
    spoolOf: o => o.spool || null,
    occluders: ["Right Side", "Left Side", "Kick Panel", "Control Panel", "Back Door", "Top Panel", "Cash Box", "CRT", "Marquee", "Power Supply"],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Side|Kick Panel|Floor|Top Panel|Back Door|Board Shelf|Speaker Panel/, ["greyPaint", { color: 0x26282c, roughness: 0.7 }]], [/T-Molding/, ["plastic", { color: 0xd2341f }]],
      [/Levelers|Coin Door|Coin Mechanisms|Coin Chute|Cash Box|Microswitches/, "steel"], [/^Coin$/, ["alu", { color: 0xd9dadc, roughness: 0.25 }]],
      [/Control Panel|Panel Overlay/, ["plastic", { color: 0x1a1b1e }]], [/Buttons/, ["plastic", { color: 0xd2341f, roughness: 0.3 }]], [/Joystick/, ["plastic", { color: 0xd2341f, roughness: 0.25 }]],
      [/Bezel Glass/, "glass"], [/^Bezel$/, ["plastic", { color: 0x111214 }]], [/CRT/, ["glass", { color: 0x2a2d30 }]], [/Deflection Yoke/, "copper"],
      [/Monitor Chassis|Game Board/, "pcb"], [/Marquee$/, ["plastic", { color: 0xf2efe6, roughness: 0.3 }]], [/Marquee Light/, ["plastic", { color: 0xffffff }]],
      [/Speakers|Coin Switch|Coin Counter/, ["plastic", { color: 0x1b1c1f }]], [/Wiring Harness/, "rubber"], [/Power Supply/, ["darkAlu", { color: 0x3a3d42 }]],
    ],

    setup(E) {
      const V = (x, y, z) => new THREE.Vector3(x, z, -y);
      const one = k => (E.spinners[k] || []);
      const tilt = new THREE.Vector3(0, K.PSU, -K.PCU).normalize();   // the panel's slope direction, in three's axes: the stick leans left and right about it
      const phase = now => E.reduceMotion ? 8 : (now / 1000) % LOOP;
      const credit = t => t >= COIN_T0 + SWITCH_AT;
      const blocks = Array.from({ length: 7 }, (_, i) => ({ x: (i * 0.37 + 0.11) % 1, v: 0.18 + (i % 3) * 0.06, o: i * 0.53 }));

      const scr = window.BP_screenAnimation(E, {
        screen: G.screen, part: "CRT", width: 800, height: 600, always: true, still: 8, fps: 30,
        draw(ctx, T, { W, H }) {
          const t = E.reduceMotion ? 8 : T % LOOP;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          for (let i = 0; i < 60; i++) {   // stars drifting down
            const x = (i * 137.5) % W, y = (i * 61.3 + T * (20 + (i % 4) * 14)) % H;
            ctx.globalAlpha = 0.25 + (i % 3) * 0.15; ctx.fillRect(x, y, 2, 2);
          }
          ctx.globalAlpha = 1;
          if (t < 5) {
            ctx.font = "800 64px 'Archivo', sans-serif"; ctx.fillText("VOLT RUNNER", W / 2, H * 0.32);
            ctx.font = "500 22px 'IBM Plex Mono', monospace"; ctx.globalAlpha = 0.6; ctx.fillText("© 1983 BLUEPRINT AMUSEMENTS", W / 2, H * 0.44); ctx.globalAlpha = 1;
            ctx.font = "500 34px 'IBM Plex Mono', monospace";
            if (!credit(t)) { if (Math.floor(T * 2) % 2) ctx.fillText("INSERT COIN", W / 2, H * 0.68); }
            else { ctx.fillText("CREDIT 1", W / 2, H * 0.62); if (Math.floor(T * 3) % 2) ctx.fillText("PRESS START", W / 2, H * 0.74); }
          } else {
            const g = t - 5;
            blocks.forEach(b => {   // falling blocks to dodge
              const y = ((g * b.v + b.o) % 1.15) * H - 30;
              BP_rr(ctx, b.x * (W - 60) + 10, y, 48, 24, 4); ctx.stroke();
            });
            const sx = shipX(T) * W, sy = H * 0.86;
            ctx.beginPath(); ctx.moveTo(sx, sy - 26); ctx.lineTo(sx + 22, sy + 16); ctx.lineTo(sx, sy + 6); ctx.lineTo(sx - 22, sy + 16); ctx.closePath(); ctx.fill();
            ctx.font = "500 24px 'IBM Plex Mono', monospace"; ctx.textAlign = "left";
            ctx.fillText("1UP " + String(Math.floor(g * 130)).padStart(6, "0"), 24, 28);
            ctx.textAlign = "right"; ctx.fillText("HI 048200", W - 24, 28);
          }
          ctx.globalAlpha = 0.07;   // scan lines
          for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1.5);
          ctx.globalAlpha = 1;
        },
      });

      const coinAt = t => one("coin").forEach(g => {
        const c = t - COIN_T0, on = c >= 0 && c <= PATH[PATH.length - 1][3] + 0.2;
        g.visible = on;
        if (on) { const p = along(c); g.position.copy(V(p[0], p[1], p[2])); g.rotation.x = c > 1.4 ? -(c - 1.4) * 9 : 0; }   // it rolls down the chute
      });
      const stickAt = (t, T) => {
        let a = 0;
        if (t >= 5) { const d = (shipX(T + 0.05) - shipX(T - 0.05)) / 0.1; a = Math.max(-1, Math.min(1, d * 2.2)) * 0.32; }
        one("stick").forEach(g => g.quaternion.setFromAxisAngle(tilt, -a));
      };
      return {
        mats: [scr.mat],
        tick(now) {
          const t = phase(now), T = E.reduceMotion ? 8 : now / 1000;
          scr.tick(now); coinAt(t); stickAt(t, T);
        },
        recolor(fg, bg) { scr.recolor(fg, bg); },
      };
    },
  };
})();
