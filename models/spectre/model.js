// Spectre x360 14: the model script for the blueprint engine (src/engine.js), which build_pages.py inlines after it.
// The laptop brings a terminal session for its screen ("/") and an interactive "how it works" (".") that
// follows a key press or a touchpad click from your finger to the OLED panel.
(function () {
  "use strict";
  const G = window.SX_GEOMETRY;

  // ---------- hotspot copy (the blueprint's callouts, in plain words) ----------
  const COPY = {
    "A-COVER": ["Aluminium lid", "CNC-machined, gem-cut corners"],
    "OLED DISPLAY": ["2.8K OLED display", "14 inches, 2880 x 1800, 120 Hz"],
    "COVER GLASS": ["Edge-to-edge glass", "Touch and pen, all the way to the edge"],
    "IR CAMERA": ["9 MP IR camera", "Signs you in with your face"],
    "360° HINGES": ["360° hinges", "Laptop, tent, stand or tablet"],
    "KEYBOARD": ["Backlit keyboard", "Full size, with arrow cluster"],
    "FINGERPRINT READER": ["Fingerprint reader", "Built into the power key"],
    "HAPTIC TOUCHPAD": ["Haptic touchpad", "Glass, 136 x 80 mm, clicks anywhere"],
    "TOP CASE": ["Top case", "One piece of aluminium, faceted edge"],
    "DUAL FANS": ["Dual fans", "Quiet under load, copper fin stacks"],
    "HEAT PIPES": ["Twin heat pipes", "Carry heat to both fans"],
    "PROCESSOR": ["Intel Core Ultra 7", "CPU, GPU and NPU on one package"],
    "LPDDR5x MEMORY": ["LPDDR5x memory", "Up to 32 GB"],
    "SSD": ["M.2 SSD", "PCIe 4.0, up to 2 TB"],
    "BATTERY": ["68 Wh battery", "Four cells across the palm rest"],
    "WOOFERS": ["Quad speakers", "Two woofers fire through the base"],
    "THUNDERBOLT 4": ["Thunderbolt 4", "Tucked into the gem-cut corner"],
    "BOTTOM COVER": ["Bottom cover", "Intake vents under both fans"],
  };

  // ---------- part notes, shown when you click a part ----------
  const DETAIL = {
    "Bottom Cover": ["Bottom cover", "One piece of machined aluminium. Slotted intakes sit under each fan, grilles under the woofers, and the two Thunderbolt 4 ports, USB-A and headphone jack are cut through its walls."],
    "Screw Bosses + Ribs": ["Screw bosses and ribs", "Eleven threaded posts hold the top case down, and two low ribs stiffen the floor so the base doesn't flex when you type on your lap."],
    "Battery": ["68 Wh battery", "Four lithium-ion polymer cells sit side by side under the palm rest, with a small management board that balances them and reports the charge."],
    "Woofers": ["Woofers", "Two sealed speaker boxes fire down through the base. With the two tweeters they make the quad-speaker system."],
    "Mainboard": ["Mainboard", "A compact T-shaped board. The processor, memory and power circuits sit in the middle, the SSD on the left wing and Wi-Fi on the right."],
    "Processor": ["Intel Core Ultra 7", "CPU cores, Arc graphics and an AI engine (NPU) are separate tiles on one package. It's the part that does the work for everything else in the laptop."],
    "LPDDR5x Memory": ["LPDDR5x memory", "Four memory chips soldered right beside the processor. Short traces keep it fast and frugal, up to 32 GB."],
    "SSD": ["M.2 2280 SSD", "PCIe 4.0 solid-state storage, up to 2 TB. A controller and two flash chips on one stick, held by a single screw."],
    "Board Components": ["Power and I/O parts", "Inductors and capacitors feed the processor clean power, the embedded controller handles the keyboard and battery, and the Wi-Fi 7 card connects to the lid antennas."],
    "Fan Housings": ["Fan housings", "Two blower housings pull air in from below and push it sideways through the fin stacks and out the back of the hinge."],
    "Fan Impellers": ["Fan impellers", "Thirty-one curved blades per fan. Many thin blades move the same air at lower speed, so the fans stay quieter."],
    "Fin Stacks": ["Copper fin stacks", "Dozens of thin copper fins give the heat a large surface to escape into the fans' airflow."],
    "Heat Pipes + Cold Plate": ["Heat pipes and cold plate", "A copper plate sits on the processor. Two sealed pipes carry its heat to the fin stacks by evaporating and condensing a little water inside."],
    "Top Case": ["Top case", "Machined from one block of aluminium with a faceted, gem-cut front edge. The keyboard and touchpad sit in pockets cut into it."],
    "Keyboard": ["Backlit keyboard", "Full-size keys with a function row, arrow cluster and a fingerprint reader in the power key."],
    "Touchpad Glass": ["Haptic touchpad", "A large glass surface with no moving parts. Press anywhere and it clicks the same way."],
    "Haptic Module": ["Haptic module", "Force sensors read how hard you press, and two actuators tap the glass so the click feels real."],
    "360 Hinges": ["360° hinges", "Two hinges let the screen fold all the way round, from laptop to tent, stand and tablet, and hold any angle in between."],
    "Hinge Lid Brackets": ["Hinge lid brackets", "Steel brackets screw the hinges into the lid. The display cable runs past them on its way to the panel."],
    "A-Cover": ["Aluminium lid", "The lid's outer shell, machined with the same gem-cut corners as the base. It protects the panel and stiffens the screen."],
    "A-Cover Ribs + Antennas": ["Lid ribs and antennas", "Ribs stop the lid twisting, and the Wi-Fi antennas sit at the top edge, above the metal, for better reception."],
    "Cover Glass": ["Cover glass", "Edge-to-edge glass over the panel, with a touch layer that also tracks a pen."],
    "OLED Panel": ["2.8K OLED panel", "2880 x 1800 pixels at up to 120 Hz. Every pixel makes its own light, so blacks are truly black."],
    "IR Camera Module": ["9 MP IR camera", "A 9 MP camera with infrared emitters and a sensor, so Windows Hello can recognise your face in any light."],
  };

  window.BLUEPRINT_MODEL = {
    screenPart: "OLED Panel",   // your photo or video goes on this part's screen
    screenGlass: ["Cover Glass"],
    geometry: G,
    themeKey: "sx360-theme",
    touchHint: "Tap the laptop to take it apart",
    view: { az: 45, el: 28 },
    occluders: ["Top Case", "Bottom Cover", "A-Cover", "Cover Glass", "Keyboard"],
    hotspots: G.hotspots.map(h => {
      const c = COPY[h.t] || [h.t, h.s];
      return { t: c[0], s: c[1], p: h.p, o: h.o };
    }),
    detail: DETAIL,

    setup(E) {
      const { toThree, renderer, partGroups, byName, reduceMotion } = E;
      // ---------- looping terminal session on the display ----------
      // drawn into a 2D canvas (16:10, like the panel) and mapped onto the active area in front of the glass
      // each typed character lights its key on the model's keyboard
      const keys = E.keyPresser({ keys: G.keys, top: G.keyTop, group: partGroups["Keyboard"], enter: "enter" });
      const term = (function () {
        const S = G.screen;
        const W = 1440, H = 900, PAD = 44, BAR = 54, FS = 30, LH = 40;
        const ROWS = Math.floor((H - BAR - PAD * 1.4) / LH);
        const cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        const ctx = cv.getContext("2d");
        const tex = new THREE.CanvasTexture(cv);
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
        mat.userData = { base: 1, k: 1, target: 1 };
        const o = toThree(...S.origin), r = toThree(...S.right), t = toThree(...S.top);
        const q = r.clone().add(t).sub(o);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute([...o.toArray(), ...r.toArray(), ...q.toArray(), ...t.toArray()], 3));
        geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
        geo.setIndex([0, 1, 2, 0, 2, 3]);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = 3;
        partGroups["OLED Panel"].add(mesh);
        byName["OLED Panel"].mats.push(mat);

        const PROMPT = "spectre@x360 ~/studio % ";
        const bar = (p, n) => "[" + "#".repeat(Math.round(p * n)) + ".".repeat(n - Math.round(p * n)) + "]";
        // the session: typed commands, printed output, live progress bars; it loops forever
        const SCRIPT = [
          ["cmd", "neofetch --off"],
          ["out", "OS      Windows 11 Pro x64", 60], ["out", "Host    Spectre x360 14", 60],
          ["out", "CPU     Intel Core Ultra 7 155H (16C/22T)", 60], ["out", "Memory  4.1 GiB / 32 GiB LPDDR5x", 60],
          ["out", "Display 2880x1800 @ 120 Hz OLED", 60], ["out", "Battery 68 Wh - 94% (on battery)", 400],
          ["cmd", "git pull origin main"],
          ["out", "remote: Enumerating objects: 42, done.", 140], ["out", "Updating 8f3c1a2..d41e07b", 120],
          ["out", "Fast-forward  12 files changed, 318 insertions(+), 41 deletions(-)", 500],
          ["cmd", "npm run build"],
          ["out", "> studio@2.4.0 build", 80], ["out", "> vite build", 300],
          ["bar", "transforming modules", 1800, "1284 modules transformed."],
          ["out", "dist/index.html                  0.46 kB", 90], ["out", "dist/assets/index-4f1c9e.css    18.20 kB", 90],
          ["out", "dist/assets/index-b7a2d0.js    142.73 kB", 90], ["ok", "built in 2.31s", 600],
          ["cmd", "npm test -- --silent"],
          ["bar", "running 214 tests", 2200, "Tests: 214 passed, 214 total"], ["ok", "all suites green", 600],
          ["cmd", "python3 render.py --scene laptop --samples 64"],
          ["bar", "rendering 3600x2400", 2600, "saved laptop_render.png"],
          ["out", "GPU  Intel Arc  -  fans 2100 rpm  -  42 C", 1600],
          ["cmd", "clear"], ["clear", 400],
        ];
        let lines = [], step = 0, typed = 0, t0 = performance.now(), dirty = true, cur = null, lastDraw = 0;
        function push(text, kind) { lines.push({ text, kind }); if (lines.length > ROWS) lines.shift(); dirty = true; }
        function next(now) { step = (step + 1) % SCRIPT.length; typed = 0; t0 = now; cur = null; }

        function update(now) {
          const s = SCRIPT[step], dt = now - t0;
          if (s[0] === "cmd") {
            if (!cur) { cur = { text: PROMPT, kind: "cmd" }; push(cur.text, "cmd"); cur = lines[lines.length - 1]; t0 = now + 350; }
            const n = Math.max(0, Math.min(s[1].length, Math.floor((now - t0) / 55)));
            if (n !== typed) { if (n > typed) keys.char(s[1][n - 1]); typed = n; cur.text = PROMPT + s[1].slice(0, n); dirty = true; }
            if (n === s[1].length && now - t0 > s[1].length * 55 + 260) { keys.press("enter"); next(now); }
          } else if (s[0] === "out" || s[0] === "ok") {
            if (!cur) { cur = true; push((s[0] === "ok" ? "✓ " : "") + s[1], s[0]); }
            if (dt > s[2]) next(now);
          } else if (s[0] === "bar") {
            if (!cur) { push("", "bar"); cur = lines[lines.length - 1]; }
            const p = Math.min(1, dt / s[2]);
            const txt = s[1].padEnd(22) + bar(p, 28) + String(Math.round(p * 100)).padStart(4) + "%";
            if (txt !== cur.text) { cur.text = txt; dirty = true; }
            if (p >= 1) { cur.kind = "out"; push(s[3], "out"); next(now); }
          } else if (s[0] === "clear") {
            if (!cur) { cur = true; lines = []; dirty = true; }
            if (dt > s[1]) next(now);
          }
        }

        let fg = "#fff", bg = "#141414";
        function draw(now) {
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, W, H);
          ctx.strokeStyle = fg; ctx.fillStyle = fg;
          // title bar
          ctx.globalAlpha = 0.55; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(0, BAR); ctx.lineTo(W, BAR); ctx.stroke();
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(34 + i * 30, BAR / 2, 8, 0, Math.PI * 2); ctx.stroke(); }
          ctx.font = "500 20px 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("zsh — studio — 120×36", W / 2, BAR / 2 + 1);
          ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
          ctx.font = "400 " + FS + "px 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace";
          lines.forEach((l, i) => {
            const y = BAR + PAD + i * LH + FS * 0.4;
            ctx.globalAlpha = l.kind === "out" ? 0.72 : 1;
            if (l.kind === "cmd") {
              ctx.globalAlpha = 0.55; ctx.fillText(PROMPT, PAD, y);
              ctx.globalAlpha = 1; ctx.fillText(l.text.slice(PROMPT.length), PAD + ctx.measureText(PROMPT).width, y);
            } else ctx.fillText(l.text, PAD, y);
          });
          // blinking block cursor after the command being typed (or on a fresh line)
          const last = lines[lines.length - 1];
          const typing = last && last.kind === "cmd" && SCRIPT[step][0] === "cmd";
          const idle = SCRIPT[step][0] === "clear" || reduceMotion;
          if ((typing || idle) && (Math.floor(now / 530) % 2 === 0 || reduceMotion)) {
            const row = typing ? lines.length - 1 : Math.min(lines.length, ROWS - 1);
            const x = typing ? PAD + ctx.measureText(last.text).width + 3 : PAD;
            ctx.globalAlpha = 0.9;
            ctx.fillRect(x, BAR + PAD + row * LH + FS * 0.4 - FS * 0.82, FS * 0.6, FS * 1.02);
          }
          ctx.globalAlpha = 1;
          tex.needsUpdate = true;
        }

        // optional: off until the "/" key turns it on; each press toggles it
        let on = false;
        mesh.visible = false;
        addEventListener("keydown", e => {
          if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.target.closest("input, textarea, [contenteditable]")) return;
          e.preventDefault();
          on = !on;
          mesh.visible = on;
          if (!on) keys.clear();
          if (on && !reduceMotion) { lines = []; step = 0; typed = 0; cur = null; t0 = performance.now(); dirty = true; }
        });
        function tick(now) {
          if (!on) return;
          if (!reduceMotion) update(now);
          const blink = Math.floor(now / 530);
          if (dirty || blink !== lastDraw) { lastDraw = blink; dirty = false; draw(now); }
        }
        function recolor(f, b) { fg = f; bg = b; dirty = true; }
        if (reduceMotion) {   // a still frame of the session
          [["cmd", PROMPT + "npm run build"], ["out", "> vite build"], ["out", "1284 modules transformed."], ["ok", "✓ built in 2.31s"]]
            .forEach(([k, s]) => push(s, k));
        }
        if (document.fonts) document.fonts.ready.then(() => { dirty = true; });
        return { tick, recolor, mat, geometry: geo };
      })();

      return {
        term,
        mats: [term.mat],
        tick(now, dt, e, fg) { term.tick(now); keys.tick(now, fg); },
        recolor(fg, bg) { term.recolor(fg, bg); },
      };
    },

    flow(E) {
      const { toThree, renderer, scene, camera, canvas, modules, partGroups, pickable, ray, mouse, reduceMotion } = E;
      const term = E.extras.term;
      const refresh = f => E.refresh(f);
      const anchors = {};
      Object.keys(G.flow).forEach(k => {
        const [x, y, z, m] = G.flow[k];
        const a = new THREE.Object3D();
        a.position.copy(toThree(x, y, z));
        modules[m].add(a);
        anchors[k] = a;
      });
      anchors.kin = new THREE.Object3D(); partGroups["Keyboard"].add(anchors.kin);
      anchors.pin = new THREE.Object3D(); partGroups["Touchpad Glass"].add(anchors.pin);
      const KEYS = G.keys.map(k => ({ cx: k[0], cy: k[1], w: k[2], h: k[3], label: k[4] }));
      const byLabel = {};
      KEYS.forEach(k => { byLabel[k.label] = k; });
      const [TPX, TPY, TPW, TPH] = G.touchpad;
      const NICE = { esc: "Esc", fp: "Power", backspace: "Backspace", tab: "Tab", caps: "Caps Lock", enter: "Enter", shift: "Shift",
        rshift: "Shift", fn: "Fn", ctrl: "Ctrl", rctrl: "Ctrl", win: "Windows", alt: "Alt", ralt: "Alt", space: "Space",
        left: "Left arrow", up: "Up arrow", down: "Down arrow", right: "Right arrow" };
      const nice = l => NICE[l] || (/^f\d+$/.test(l) ? l.toUpperCase() : l.toUpperCase());
      const CAP = { esc: "esc", fp: "⏻", backspace: "⌫", tab: "tab", caps: "caps", enter: "enter", shift: "shift", rshift: "shift",
        fn: "fn", ctrl: "ctrl", rctrl: "ctrl", win: "⊞", alt: "alt", ralt: "alt", space: "", left: "←", up: "↑", down: "↓", right: "→" };

      // --- key legends on the model's keyboard (only while this mode is on)
      let kx0 = Infinity, kx1 = -Infinity, ky0 = Infinity, ky1 = -Infinity;
      KEYS.forEach(k => { kx0 = Math.min(kx0, k.cx - k.w / 2); kx1 = Math.max(kx1, k.cx + k.w / 2); ky0 = Math.min(ky0, k.cy - k.h / 2); ky1 = Math.max(ky1, k.cy + k.h / 2); });
      const LW = 2048, LH = Math.round(LW * (ky1 - ky0) / (kx1 - kx0)), LS = LW / (kx1 - kx0);
      const legend = document.createElement("canvas"); legend.width = LW; legend.height = LH;
      const legTex = new THREE.CanvasTexture(legend);
      legTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const legMat = new THREE.MeshBasicMaterial({ map: legTex, transparent: true, depthWrite: false, opacity: 0 });
      const legMesh = new THREE.Mesh(new THREE.PlaneGeometry(kx1 - kx0, ky1 - ky0), legMat);
      legMesh.rotation.x = -Math.PI / 2;
      legMesh.position.copy(toThree((kx0 + kx1) / 2, (ky0 + ky1) / 2, G.keyTop + 0.05));
      legMesh.renderOrder = 4;
      partGroups["Keyboard"].add(legMesh);
      function drawLegends(fg) {
        const c = legend.getContext("2d");
        c.clearRect(0, 0, LW, LH);
        c.fillStyle = fg; c.textAlign = "center"; c.textBaseline = "middle";
        KEYS.forEach(k => {
          const x = (k.cx - kx0) * LS, y = (ky1 - k.cy) * LS;
          const t = k.label in CAP ? CAP[k.label] : k.label.length === 1 ? k.label.toUpperCase() : k.label;
          const big = t.length === 1;
          c.globalAlpha = big ? 0.9 : 0.7;
          c.font = (big ? 500 : 400) + " " + Math.round(k.h * LS * (big ? 0.42 : 0.26)) + "px 'IBM Plex Mono', ui-monospace, Menlo, monospace";
          c.fillText(t, x, y + 1);
        });
        legTex.needsUpdate = true;
      }

      // --- pressed-key flash and touchpad ripple
      const flashMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      const flash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flashMat);
      flash.rotation.x = -Math.PI / 2; flash.renderOrder = 4;
      partGroups["Keyboard"].add(flash);
      const ripple = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), flashMat.clone());
      ripple.rotation.x = -Math.PI / 2; ripple.renderOrder = 4;
      partGroups["Touchpad Glass"].add(ripple);

      // --- what the laptop shows: a notes window that the typed keys land in, and a pointer that clicks
      const SW = 1440, SH = 900;
      const scv = document.createElement("canvas"); scv.width = SW; scv.height = SH;
      const sc = scv.getContext("2d");
      const scrTex = new THREE.CanvasTexture(scv);
      scrTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const scrMat = new THREE.MeshBasicMaterial({ map: scrTex, transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide });
      const scr = new THREE.Mesh(term.geometry, scrMat);
      scr.renderOrder = 4;
      partGroups["OLED Panel"].add(scr);
      let text = "", ptr = { x: SW * 0.62, y: SH * 0.58 }, clickAt = -1e9, lastKey = "", keyAt = -1e9;
      let fgC = "#fff", bgC = "#141414";
      function drawScreen(now) {
        sc.fillStyle = bgC; sc.fillRect(0, 0, SW, SH);
        sc.strokeStyle = fgC; sc.fillStyle = fgC; sc.lineWidth = 2;
        sc.globalAlpha = 0.55;
        sc.beginPath(); sc.moveTo(0, 60); sc.lineTo(SW, 60); sc.stroke();
        for (let i = 0; i < 3; i++) { sc.beginPath(); sc.arc(36 + i * 32, 30, 9, 0, Math.PI * 2); sc.stroke(); }
        sc.font = "500 24px 'IBM Plex Mono', ui-monospace, Menlo, monospace";
        sc.textAlign = "center"; sc.textBaseline = "middle";
        sc.fillText("notes.txt", SW / 2, 31);
        sc.textAlign = "left"; sc.textBaseline = "alphabetic";
        // text, wrapped
        const FS = 56, LHt = 72, X0 = 70, MAXC = 36;
        sc.font = "400 " + FS + "px 'IBM Plex Mono', ui-monospace, Menlo, monospace";
        const rows = [];
        text.split("\n").forEach(par => { let s = par; do { rows.push(s.slice(0, MAXC)); s = s.slice(MAXC); } while (s.length); });
        const vis = rows.slice(-10);
        sc.globalAlpha = 1;
        if (!text) { sc.globalAlpha = 0.35; sc.fillText("Start typing…", X0, 160); sc.globalAlpha = 1; }
        vis.forEach((r, i) => sc.fillText(r, X0, 160 + i * LHt));
        const lastRow = vis.length ? vis[vis.length - 1] : "";
        if (Math.floor(now / 530) % 2 === 0 && text) {
          sc.fillRect(X0 + sc.measureText(lastRow).width + 4, 160 + (Math.max(vis.length, 1) - 1) * LHt - FS * 0.8, 4, FS);
        } else if (!text && Math.floor(now / 530) % 2 === 0) sc.fillRect(X0 - 8, 160 - FS * 0.8, 4, FS);
        // the key that just landed, big for a moment
        const ka = 1 - (now - keyAt) / 1400;
        if (ka > 0 && lastKey) {
          sc.globalAlpha = ka * 0.9;
          sc.font = "600 46px 'IBM Plex Mono', ui-monospace, Menlo, monospace";
          sc.textAlign = "right"; sc.fillText(lastKey, SW - 60, SH - 60); sc.textAlign = "left";
        }
        // pointer + click ripple
        const ca = (now - clickAt) / 900;
        if (ca >= 0 && ca < 1) {
          sc.globalAlpha = 1 - ca; sc.lineWidth = 3;
          for (const k of [0, 0.25]) { const r = 20 + 90 * Math.max(0, ca - k); sc.beginPath(); sc.arc(ptr.x, ptr.y, r, 0, Math.PI * 2); sc.stroke(); }
        }
        sc.globalAlpha = 1; sc.lineWidth = 3;
        sc.beginPath();
        const P = [[0, 0], [0, 54], [14, 41], [24, 64], [33, 60], [23, 37], [41, 37]];
        P.forEach(([x, y], i) => (i ? sc.lineTo(ptr.x + x, ptr.y + y) : sc.moveTo(ptr.x + x, ptr.y + y)));
        sc.closePath(); sc.fillStyle = bgC; sc.fill(); sc.stroke();
        scrTex.needsUpdate = true;
      }

      // --- signal path: a dashed line whose dashes march from the source to the destination
      const lineMat = new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color() }, opacity: { value: 0 }, offset: { value: 0 }, dash: { value: 3 }, period: { value: 5 } },
        vertexShader: "attribute float lineDistance; varying float vD; void main() { vD = lineDistance; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: "uniform vec3 color; uniform float opacity, offset, dash, period; varying float vD; void main() { if (mod(vD - offset, period) > dash) discard; gl_FragColor = vec4(color, opacity); }",
        transparent: true, depthTest: false, depthWrite: false,
      });
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 8), 3));
      const path = new THREE.Line(lineGeo, lineMat);
      path.renderOrder = 5; path.frustumCulled = false;
      scene.add(path);

      // --- the steps for one input. dist is the zoom as a fraction of the overview distance.
      const BOARD = ["Mainboard", "Board Components"];
      function stepsFor(inp) {
        const key = inp.kind === "key";
        const name = key ? nice(inp.label) : "";
        const first = key ? [
          { t: "You press " + (name.length === 1 ? "“" + name + "”" : name), focus: "kin", dist: 0.24, ex: 0, p: ["kin", "kbFlex"], n: ["Keyboard"], ms: 3200,
            d: "The key pushes a rubber dome down until two traces in the keyboard's switch matrix touch. The keyboard controller scans its rows and columns about a thousand times a second and finds which one closed." },
          { t: "A scan code goes to the mainboard", focus: "ec", dist: 0.3, ex: 1, p: ["kbFlex", "ec"], n: ["Keyboard"].concat(BOARD), ms: 3400,
            d: "The controller turns the key into a short number, its scan code, and sends it down a ribbon cable to the embedded controller on the mainboard." },
        ] : [
          { t: "You click the touchpad", focus: "pin", dist: 0.24, ex: 0, p: ["pin", "padFlex"], n: ["Touchpad Glass", "Haptic Module"], ms: 3200,
            d: "Force sensors under the glass feel the press while a grid of electrodes tracks where your finger is. The haptic motors tap back, so the glass feels like it clicked." },
          { t: "The click goes to the mainboard", focus: "ec", dist: 0.3, ex: 1, p: ["padFlex", "boardFront", "ec"], n: ["Haptic Module"].concat(BOARD), ms: 3400,
            d: "The touchpad controller packs the position and the click into a short report and sends it over an I2C link to the mainboard." },
        ];
        return first.concat([
          { t: "The processor stops to listen", focus: "soc", dist: 0.2, ex: 1, p: ["ec", "soc"], n: ["Processor", "Mainboard"], ms: 3400,
            d: "The mainboard raises an interrupt. The CPU pauses what it was doing, runs the " + (key ? "keyboard" : "touchpad") + " driver, and Windows hands the event to the app you're using." },
          { t: "Memory does the heavy lifting", focus: "soc", dist: 0.24, ex: 1, p: ["soc", "ram1", "soc", "ram2", "soc"], n: ["Processor", "LPDDR5x Memory"], ms: 3400,
            d: key ? "The app and your document live in LPDDR5x memory. The CPU fetches them, adds the character and works out the new line layout."
                   : "The app and the page live in LPDDR5x memory. The CPU fetches them, works out what was under the pointer and runs the click." },
          { t: "The GPU draws a new frame", focus: "gpu", dist: 0.2, ex: 1, p: ["gpu", "ram3", "gpu", "ram4", "gpu"], n: ["Processor", "LPDDR5x Memory"], ms: 3400,
            d: "The graphics cores on the same chip redraw only the part of the window that changed, into a frame buffer in memory." },
          { t: "The frame travels to the panel", focus: "hinge", dist: 0.42, ex: 1, p: ["soc", "boardRear", "hinge", "lidHinge", "panelDriver", "screen"], n: ["Processor", "360 Hinges", "Hinge Lid Brackets", "OLED Panel"], ms: 3800,
            d: "The display engine sends the frame down a thin cable that runs through the hinge to the panel's timing controller." },
          { t: key ? "And there it is" : "And the click lands", focus: "screen", dist: 0.64, ex: 0, p: [], n: ["OLED Panel", "Cover Glass"], ms: 3600, out: true,
            d: "The timing controller lights the 2880 x 1800 OLED pixels that changed, up to 120 times a second. From your finger to the screen took a few milliseconds." },
        ]);
      }

      const box = document.getElementById("flow");
      const elK = box.querySelector(".flow-k"), elT = box.querySelector("b"), elD = box.querySelector("p"), elBar = box.querySelector(".flow-bar i");
      let on = false, steps = null, idx = -1, t0 = 0, fade = 0, inp = null, doneAt = 0;
      const api = { names: null, explode: 0, get on() { return on; } };
      function caption(k, t, d, n) {
        elK.textContent = k; elT.textContent = t; elD.textContent = d;
        api.names = n; refresh(true);
      }
      function waiting() {
        steps = null; idx = -1; inp = null; api.explode = 0;
        document.body.classList.remove("zoomed");
        caption("How it works", "Press any key or click the laptop",
          "Type on your keyboard, click a key on the drawing, or click the touchpad. Then follow the signal from your finger to the screen.", null);
        elBar.style.transform = "scaleX(0)";
      }
      function show(i, now) {
        const s = steps[i];
        idx = i; t0 = now;
        api.explode = s.ex;
        caption("How it works · " + String(i + 1).padStart(2, "0") + " / " + String(steps.length).padStart(2, "0"), s.t, s.d, s.n);
        if (s.out) {
          if (inp.kind === "key") {
            if (inp.ch === "\b") text = text.slice(0, -1);
            else if (inp.ch) text = (text + inp.ch).slice(-300);
            lastKey = nice(inp.label); keyAt = now;
          } else {
            ptr.x = SW * Math.min(0.9, Math.max(0.08, inp.u)); ptr.y = SH * Math.min(0.88, Math.max(0.12, 1 - inp.v)); clickAt = now;
          }
        }
      }
      function start(input) {
        if (!on || steps) return;
        inp = input;
        if (inp.kind === "key") {
          const k = byLabel[inp.label];
          anchors.kin.position.copy(toThree(k.cx, k.cy, G.keyTop));
          flash.scale.set(k.w, k.h, 1);
          flash.position.copy(toThree(k.cx, k.cy, G.keyTop + 0.08));
        } else {
          anchors.pin.position.copy(toThree(inp.x, inp.y, G.keyTop + 0.15));
          ripple.position.copy(toThree(inp.x, inp.y, G.keyTop + 0.2));
        }
        steps = stepsFor(inp);
        document.body.classList.add("zoomed");
        show(0, performance.now());
      }
      function toggle() {
        on = !on;
        document.body.classList.toggle("flowing", on);
        box.hidden = !on;
        if (on) waiting();
        else { steps = null; api.names = null; api.explode = 0; document.body.classList.remove("zoomed"); refresh(true); }
      }

      // inputs: real keys (by physical position), clicks on the model's keys, clicks anywhere else on the laptop
      const CODE = { Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]", Backslash: "\\", Semicolon: ";", Quote: "'",
        Comma: ",", Slash: "/", Backquote: "`", Space: "space", Enter: "enter", NumpadEnter: "enter", ShiftLeft: "shift", ShiftRight: "rshift",
        ControlLeft: "ctrl", ControlRight: "rctrl", AltLeft: "alt", AltRight: "ralt", MetaLeft: "win", MetaRight: "win", ArrowLeft: "left",
        ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", Escape: "esc", Backspace: "backspace", Tab: "tab", CapsLock: "caps" };
      const charOf = l => l.length === 1 ? l : l === "space" ? " " : l === "enter" ? "\n" : l === "backspace" ? "\b" : "";
      addEventListener("keydown", e => {
        if (e.ctrlKey || e.metaKey || e.target.closest("input, textarea, [contenteditable]")) return;
        if (e.key === "." && !e.altKey) { e.preventDefault(); toggle(); return; }
        if (!on || e.key === "/" || e.repeat) return;
        let label = CODE[e.code] || null;
        if (!label && /^Key[A-Z]$/.test(e.code)) label = e.code.slice(3).toLowerCase();
        if (!label && /^Digit\d$/.test(e.code)) label = e.code.slice(5);
        if (!label && /^F([1-9]|1[0-2])$/.test(e.code)) label = e.code.toLowerCase();
        if (!label || !byLabel[label]) return;
        e.preventDefault();
        start({ kind: "key", label, ch: e.key.length === 1 ? e.key : charOf(label) });
      });
      const local = new THREE.Vector3();
      canvas.addEventListener("click", () => {
        if (!on || steps) return;
        ray.setFromCamera(mouse, camera);
        const hit = ray.intersectObjects(pickable, false)[0];
        if (!hit) return;
        if (hit.object.name === "Keyboard") {
          partGroups["Keyboard"].worldToLocal(local.copy(hit.point));
          const bx = local.x, by = -local.z;
          let best = null, bd = Infinity;
          KEYS.forEach(k => { const d = Math.max(Math.abs(bx - k.cx) - k.w / 2, 0) + Math.max(Math.abs(by - k.cy) - k.h / 2, 0); if (d < bd) { bd = d; best = k; } });
          start({ kind: "key", label: best.label, ch: charOf(best.label) });
          return;
        }
        let x = TPX, y = TPY;
        if (hit.object.name === "Touchpad Glass") {
          partGroups["Touchpad Glass"].worldToLocal(local.copy(hit.point));
          x = local.x; y = -local.z;
        }
        start({ kind: "click", x, y, u: (x - TPX) / TPW + 0.5, v: (y - TPY) / TPH + 0.5 });
      });

      const focusPos = new THREE.Vector3();
      // where the camera should look while this mode runs (null = the normal framing)
      api.focus = out => {
        if (!on || !steps) return 0;
        anchors[steps[idx].focus].getWorldPosition(out);
        return steps[idx].dist;
      };

      const pts = [];
      api.tick = (now, fg) => {
        fade += ((on ? 1 : 0) - fade) * 0.12;
        legMat.opacity = fade; scrMat.opacity = fade;
        legMesh.visible = scr.visible = fade > 0.01;
        lineMat.uniforms.color.value.copy(fg); flashMat.color.copy(fg); ripple.material.color.copy(fg);
        flashMat.opacity = 0; ripple.material.opacity = 0;
        if (fade > 0.01) drawScreen(now);
        let show_path = false;
        if (on && steps) {
          if (now - t0 > steps[idx].ms) {
            if (idx + 1 < steps.length) show(idx + 1, now);
            else { waiting(); }
          }
        }
        if (on && steps) {
          const s = steps[idx], dt = now - t0;
          elBar.style.transform = "scaleX(" + Math.min(1, dt / s.ms).toFixed(3) + ")";
          if (idx === 0) {
            const a = Math.max(0, 1 - dt / 1600);
            if (inp.kind === "key") { flashMat.opacity = 0.55 * a + 0.15; flash.position.y = G.keyTop + 0.08 - 0.5 * a; }
            else { const r = 3 + 26 * ((dt % 1100) / 1100); ripple.scale.set(r, r, r); ripple.material.opacity = 0.8 * (1 - (dt % 1100) / 1100); }
          }
          if (s.p.length > 1) {
            show_path = true;
            pts.length = 0;
            s.p.forEach((k, i) => { pts[i] = anchors[k].getWorldPosition(new THREE.Vector3()); });
            const arr = lineGeo.attributes.position.array;
            for (let i = 0; i < 8; i++) {
              const v = pts[Math.min(i, pts.length - 1)];
              arr[i * 3] = v.x; arr[i * 3 + 1] = v.y; arr[i * 3 + 2] = v.z;
            }
            lineGeo.attributes.position.needsUpdate = true;
            lineGeo.setDrawRange(0, pts.length);
            path.computeLineDistances();
            // dash length and speed follow the zoom so they read the same at any distance
            const camD = camera.position.distanceTo(pts[0]);
            lineMat.uniforms.dash.value = camD * 0.009;
            lineMat.uniforms.period.value = camD * 0.015;
            if (!reduceMotion) lineMat.uniforms.offset.value = (dt / 1000) * camD * 0.05;
          }
        }
        const pf = show_path ? fade : 0;
        const u = lineMat.uniforms.opacity;
        u.value += (pf - u.value) * 0.2;
        path.visible = u.value > 0.01;
      };
      api.recolor = (fg, bg) => { fgC = fg; bgC = bg; drawLegends(fg); };
      if (document.fonts) document.fonts.ready.then(() => drawLegends(fgC));
      api.toggle = toggle;
      return api;
    },
  };
})();
