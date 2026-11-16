// Ripple tank: the model script for the blueprint engine, which rippletank/build.js inlines after the generated geometry
// and lib/screen-runtime.js. Two pictures run all the time (one still frame with reduced motion): the ripples from the
// two dippers on the water, and their focused shadow on the paper. Both come from one wave field computed on a coarse
// grid, as seen by a strobe 0.75 Hz slower than the 16 Hz dippers, so the waves crawl outwards slowly. The dipper bar
// bobs at the same apparent rate.
(function () {
  "use strict";
  const G = window.RT_GEOMETRY;
  const K = G.constants;
  const DETAIL = {
    "Base Board": ["Base board", "Carries the paper, the legs, the lamp post and the control box."],
    "Feet": ["Feet", "Rubber feet under the base."],
    "Paper Screen": ["Paper screen", "White paper pinned under the tank, where the ripples' shadow falls, 1.53 times life size."],
    "Control Box": ["Control box", "Powers the motor and the strobe."],
    "Controls": ["Controls", "A frequency knob (8–28 Hz) with its meter, the power switch and a pilot light."],
    "Cables": ["Cables", "To the motor, up one leg, and to the lamp."],
    "Legs": ["Legs", "Four legs with screw feet, to level the tank so the water is the same depth everywhere."],
    "Tank Frame": ["Tank frame", "Holds the glass bed and the water."],
    "Glass Bed": ["Glass bed", "A sheet of glass, so the lamp's light passes through the water to the paper."],
    "Foam Beach": ["Foam beach", "Sloping foam round the walls that absorbs each wave before it can reflect back across the tank."],
    "Water": ["Water", "6 mm deep. At 16 Hz the ripples are 1.45 cm apart and move at 23 cm/s."],
    "Beam": ["Beam", "Spans the tank on two posts and carries the vibrator on its springs."],
    "Springs": ["Springs", "Hang the dipper bar so it can shake freely up and down."],
    "Dipper Bar": ["Dipper bar", "Carries both dippers, so they always move together: two sources in phase."],
    "Dippers": ["Dippers", "Small balls that just touch the water, 5 cm apart; each sends out circular ripples."],
    "Motor": ["Motor", "Turns an off-centre weight; the bar shakes at the motor's speed."],
    "Lamp Post": ["Lamp post", "Holds the lamp 40 cm above the water."],
    "Strobe Lamp": ["Strobe lamp", "A small, bright source that flashes 0.75 times a second slower than the dippers, so the moving waves look slowed down."],
  };
  const F = 16, LAMBDA = 14.5, BEAT = 0.75;   // the dippers' frequency, the ripples' wavelength (mm) and the strobe's slip (Hz)

  // the wave field at (x, y) in the tank's mm, at apparent phase ph: two circular sources, each fading with distance
  const src = [[K.XS, -K.SPACING / 2], [K.XS, K.SPACING / 2]];
  const kk = 2 * Math.PI / LAMBDA;
  const field = (x, y, ph) => {
    let h = 0;
    for (const [sx, sy] of src) { const r = Math.hypot(x - sx, y - sy) + 3; h += Math.cos(kk * r - ph) * Math.exp(-r / 260) / Math.sqrt(r / 12); }
    return h;
  };
  // draws the field over a rectangle of the tank's plane onto a coarse canvas, then up onto the screen
  function painter(x0, y0, x1, y1, scale, sharp) {
    const GW = 180, GH = Math.round(GW * (y1 - y0) / (x1 - x0));
    const a = document.createElement("canvas"), b = document.createElement("canvas");
    a.width = b.width = GW; a.height = b.height = GH;
    const ag = a.getContext("2d"), bg = b.getContext("2d"), img = ag.createImageData(GW, GH);
    return (ctx, ph, W, H, fg) => {
      for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
        const x = (x0 + (x1 - x0) * (i + 0.5) / GW) / scale, y = (y0 + (y1 - y0) * (1 - (j + 0.5) / GH)) / scale;   // canvas rows run down, y runs up
        const h = field(x, y, ph), v = Math.max(0, h) / 1.6;
        const o = (j * GW + i) * 4;
        img.data[o] = img.data[o + 1] = img.data[o + 2] = 255;
        img.data[o + 3] = Math.min(255, 255 * Math.pow(v, sharp));
      }
      ag.putImageData(img, 0, 0);
      bg.clearRect(0, 0, GW, GH); bg.globalCompositeOperation = "source-over"; bg.drawImage(a, 0, 0);
      bg.globalCompositeOperation = "source-in"; bg.fillStyle = fg; bg.fillRect(0, 0, GW, GH);
      ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = true; ctx.drawImage(b, 0, 0, W, H);
    };
  }

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "rt-theme",
    touchHint: "Tap the ripple tank to take it apart",
    view: { az: 35, el: 40 },
    spoolOf: o => o.spool || null,
    occluders: ["Base Board", "Tank Frame", "Control Box", "Beam", "Strobe Lamp"],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    materials: [
      [/Base Board/, ["greyPaint", { color: 0x3b3f44, roughness: 0.8 }]], [/Feet|Cables|Foam Beach/, "rubber"], [/Paper Screen/, ["plastic", { color: 0xf2f0ea, roughness: 0.9 }]],
      [/Control Box|Strobe Lamp/, ["greyPaint", { color: 0x2a2c30 }]], [/Controls|Motor/, ["plastic", { color: 0x1b1c1f }]],
      [/Legs|Lamp Post|Beam|Springs|Dipper Bar|Dippers/, "steel"], [/Tank Frame/, ["alu", { color: 0xcfd2d6 }]], [/Glass Bed|Water/, "glass"],
    ],

    setup(E) {
      const phase = now => E.reduceMotion ? 1.2 : 2 * Math.PI * BEAT * now / 1000;
      const [w0, w1] = K.WATER, [px, py] = K.PAPER;
      let fg = "#ffffff";
      const paintWater = painter(w0[0], w0[1], w1[0], w1[1], 1, 1.4);
      const paintPaper = painter(-px, -py, px, py, K.SHADOW, 2.4);   // focused: sharper, brighter lines
      const water = window.BP_screenAnimation(E, { screen: G.screens.water, part: "Water", width: 720, height: 560, always: true, still: 1, fps: 20,
        draw(ctx, T, { W, H }) { paintWater(ctx, phase(T * 1000), W, H, fg); } });
      const paper = window.BP_screenAnimation(E, { screen: G.screens.paper, part: "Paper Screen", width: 720, height: 590, always: true, still: 1, fps: 20,
        draw(ctx, T, { W, H }) { paintPaper(ctx, phase(T * 1000), W, H, fg); ctx.globalAlpha = 1; } });
      const bob = (E.spinners.bar || []);
      return {
        mats: [water.mat, paper.mat],
        tick(now) {
          water.tick(now); paper.tick(now);
          const dz = E.reduceMotion ? 0 : 0.9 * Math.sin(phase(now));
          bob.forEach(g => { g.position.y = dz; });
        },
        recolor(f, b) { fg = typeof f === "string" ? f : "#" + f.getHexString(); water.recolor(f, b); paper.recolor(f, b); },
      };
    },
  };
})();
