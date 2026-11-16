// Macintosh 128K: the model script for the blueprint engine (src/engine.js), which build_pages.py inlines after it.
// The Mac brings a MacTerminal session for its screen ("/") and an interactive "how it works" (".") that
// follows a key press or a mouse click from your finger to the picture tube.
(function () {
  "use strict";
  const G = window.MAC_GEOMETRY;

// ---------- classic Mac window chrome, shared by both screen animations ----------
// a 1-bit desktop: menu bar, a window with a striped title bar and a close box
function macChrome(ctx, W, H, fg, bg, menus, title) {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = fg; ctx.fillStyle = fg; ctx.lineWidth = 2; ctx.globalAlpha = 1;
  // menu bar
  ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(W, 40); ctx.stroke();
  ctx.font = "600 21px 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace";
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.beginPath(); ctx.arc(34, 20, 8, 0, Math.PI * 2); ctx.fill();
  let x = 70;
  menus.forEach(m => { ctx.fillText(m, x, 21); x += ctx.measureText(m).width + 30; });
  // window
  const wx = 36, wy = 66, ww = W - 72, wh = H - 96, tb = 34;
  ctx.fillStyle = fg; ctx.fillRect(wx + 5, wy + 5, ww, wh);             // drop shadow
  ctx.fillStyle = bg; ctx.fillRect(wx, wy, ww, wh);
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.beginPath(); ctx.moveTo(wx, wy + tb); ctx.lineTo(wx + ww, wy + tb); ctx.stroke();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {                                         // title bar stripes
    const y = wy + 7 + i * 4.2;
    ctx.beginPath(); ctx.moveTo(wx + 6, y); ctx.lineTo(wx + ww - 6, y); ctx.stroke();
  }
  ctx.font = "600 20px 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace";
  ctx.textAlign = "center";
  const tw = ctx.measureText(title).width + 28;
  ctx.fillStyle = bg; ctx.fillRect(W / 2 - tw / 2, wy + 3, tw, tb - 6);
  ctx.fillRect(wx + 18, wy + 6, 24, tb - 12);
  ctx.fillStyle = fg; ctx.fillText(title, W / 2, wy + tb / 2 + 1);
  ctx.lineWidth = 2; ctx.strokeRect(wx + 22, wy + 9, 16, 16);          // close box
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  return { x: wx, y: wy + tb, w: ww, h: wh - tb };
}


  // ---------- hotspot copy (the blueprint's callouts, in plain words) ----------
  const COPY = {
  "REAR CASE": ["Rear case", "One-piece ABS shell, lifts off backwards"],
  "CARRY HANDLE": ["Carry handle", "Moulded into the top. It goes where you go"],
  "9in CRT": ["9-inch screen", "512 x 342 sharp black-on-white pixels"],
  "DEFLECTION YOKE": ["Deflection yoke", "Sweeps the beam 60 times a second"],
  "FRONT BEZEL": ["Front bezel", "Screen, drive and keyboard jack in one face"],
  "3.5in FLOPPY DRIVE": ["3.5-inch floppy drive", "400K disks that fit in a shirt pocket"],
  "ANALOG BOARD": ["Analog board", "Power supply and video sweep"],
  "FLYBACK TRANSFORMER": ["Flyback transformer", "High voltage for the picture tube"],
  "SPEAKER": ["Speaker", "8-bit sound at 22 kHz"],
  "MOTOROLA 68000": ["Motorola 68000", "7.83 MHz, 32-bit registers"],
  "128K RAM": ["128K memory", "Sixteen 64 Kbit DRAM chips"],
  "64K ROM": ["64K ROM", "QuickDraw and the Toolbox, built in"],
  "IWM + SCC": ["Custom chips", "IWM disk controller, SCC serial, VIA"],
  "REAR PORTS": ["Rear ports", "Mouse, modem, printer, external drive"],
  "LOGIC BOARD": ["Logic board", "Slides out of the back on rails"],
  "KEYBOARD": ["Keyboard", "58 keys, no function keys to learn"],
  "MOUSE": ["Mouse", "One button. Point, then click"],
  "MOUSE BALL": ["Mouse ball", "Rubber-coated steel, turns two encoders"],
  };

  // ---------- part notes, shown when you click a part ----------
  const DETAIL = {
    "Front Bezel": ["Front bezel", "The whole face of the Mac is one ABS moulding: a bevelled opening for the screen, the floppy slot with its manual-eject hole, the keyboard jack and a recessed foot that lifts it off the desk."],
    "Rear Case": ["Rear case", "One shell forms the top, sides and back. It slides off backwards to open the Mac, and it carries the handle, the cooling vents and the cut-outs for every port."],
    "Chassis Frame": ["Chassis frame", "Steel rails guide the logic board in from the back, a cage holds the floppy drive, and four bosses on the bezel carry the picture tube."],
    "CRT Tube": ["9-inch picture tube", "A monochrome CRT with a sharp, flat-looking face. It shows 512 x 342 pixels, square ones, so what you see is what prints."],
    "Deflection Yoke": ["Deflection yoke", "Copper coils around the neck of the tube. Their magnetic field bends the electron beam across and down the screen."],
    "Neck Board": ["Neck board", "A small board on the back of the tube that feeds the electron gun its heater power and video signal."],
    "Analog Board": ["Analog board", "Stands along the left wall. It turns mains power into the voltages the Mac needs and drives the picture tube."],
    "Power Components": ["Power supply parts", "A switching transformer, filter capacitors and power transistors on a finned heatsink. There's no fan: warm air rises out through the top vents."],
    "Flyback Transformer": ["Flyback transformer", "Generates the high voltage, around ten thousand volts, that accelerates the electron beam into the screen."],
    "Speaker": ["Speaker", "A small speaker behind the front bezel plays 8-bit sound at 22 kHz, enough for four-voice music and speech."],
    "Floppy Drive": ["3.5-inch floppy drive", "A Sony drive for 400K single-sided disks in a hard plastic shell. Eject is done by software: a motor pushes the disk out."],
    "Drive Mechanism": ["Drive mechanism", "A spindle motor spins the disk, and a stepper moves the head carriage across it on two guide rods."],
    "Logic Board": ["Logic board", "The whole computer on one board. It slides in on rails from the back, with every port on its rear edge."],
    "Motorola 68000": ["Motorola 68000", "The processor: 32-bit registers on a 16-bit bus, running at 7.83 MHz. Fast enough to draw a graphical interface in real time."],
    "128K RAM": ["128K memory", "Sixteen 64 Kbit DRAM chips. About 22K of it is the screen itself: every pixel is one bit in memory."],
    "64K ROM": ["64K ROM", "Two chips hold QuickDraw, the Toolbox and the operating system core, so every application shares the same menus, windows and fonts."],
    "IWM + SCC + VIA": ["Custom chips", "The IWM runs the floppy drive with very few parts, the SCC drives the two serial ports and the mouse, and the VIA handles the keyboard, clock and sound."],
    "Board Components": ["Video and glue logic", "Programmable logic chips generate the video timing and share memory between the processor and the screen."],
    "I/O Connectors": ["Ports", "Mouse, external drive, two serial ports for modem and printer, and audio out on the back; the keyboard jack on the front."],
    "Keyboard Base": ["Keyboard base", "The lower shell of the keyboard, with room for the circuit board and its controller."],
    "Key Switches + PCB": ["Key switches", "Mechanical switches on one circuit board, read by a small controller that sends each key down the coiled cord."],
    "Keyboard Top Case": ["Keyboard top case", "A beige frame around the 58 keys. No numeric keypad and no function keys to remember."],
    "Keycaps": ["Keycaps", "Sculpted keys, with Command and Option keys for shortcuts instead of codes."],
    "Mouse Shell": ["Mouse shell", "A boxy shell that fits under your palm, with the cable leaving from the button end."],
    "Mouse Button": ["Mouse button", "A single large button. There is never a question of which one to press."],
    "Mouse Base": ["Mouse base", "The bottom plate, with a ring that turns to release the ball for cleaning."],
    "Mouse Encoders": ["Encoders", "Two shafts touch the ball, one for each direction. Slotted wheels on the shafts chop a beam of light into pulses."],
    "Mouse Ball": ["Mouse ball", "A rubber-coated steel ball. It rolls on the desk and turns the two encoder shafts as you move."],
  };

  window.BLUEPRINT_MODEL = {
    screenPart: "CRT Tube",   // your photo or video goes on this part's screen
    geometry: G,
    themeKey: "mac128k-theme",
    touchHint: "Tap the Mac to take it apart",
    view: { az: 45, el: 28 },
    occluders: ["Front Bezel", "Rear Case", "CRT Tube", "Keyboard Top Case", "Mouse Shell", "Floppy Drive", "Analog Board"],
    hotspots: G.hotspots.map(h => {
      const c = COPY[h.t] || [h.t, h.s];
      return { t: c[0], s: c[1], p: h.p, o: h.o };
    }),
    detail: DETAIL,

    setup(E) {
      const { toThree, renderer, partGroups, byName, reduceMotion } = E;
      // ---------- looping terminal session on the screen ----------
      // MacTerminal dialling a time-sharing host, drawn into a 2D canvas (512 x 342 at 2x, like the
      // tube's raster) and mapped onto the active area just in front of the tube face
      // each typed character lights its key on the model's keyboard
      const keys = E.keyPresser({ keys: G.keys, top: G.keyTop, group: partGroups["Keycaps"], enter: "return" });
      const term = (function () {
        const S = G.screen;
        const W = 1024, H = 684, FS = 23, LH = 30, PADX = 22;
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
        partGroups["CRT Tube"].add(mesh);
        byName["CRT Tube"].mats.push(mat);

        const bar = (p, n) => "[" + "#".repeat(Math.round(p * n)) + ".".repeat(n - Math.round(p * n)) + "]";
        // the session: typed commands (with their prompt), printed output, a live progress bar; it loops forever
        const SCRIPT = [
          ["cmd", "", "ATDT 555-0128"],
          ["out", "DIALING...", 1100], ["out", "CONNECT 1200", 700], ["out", "", 120],
          ["out", "4.2 BSD UNIX (vax.campus)", 400],
          ["cmd", "login: ", "guest"],
          ["out", "Last login: Tue Jan 24 09:41 on ttyd3", 450],
          ["cmd", "% ", "uptime"],
          ["out", "  9:41am  up 12 days,  3 users,  load 0.42", 600],
          ["cmd", "% ", "ls"],
          ["out", "hello.c    mail/    notes.txt    paint.doc", 600],
          ["cmd", "% ", "cc -o hello hello.c"],
          ["bar", "compiling", 2000, "hello: 4096 bytes"],
          ["cmd", "% ", "./hello"],
          ["ok", "Hello from the Macintosh!", 800],
          ["cmd", "% ", "mail"],
          ["out", "No mail for guest", 700],
          ["cmd", "% ", "logout"],
          ["out", "NO CARRIER", 1200],
          ["clear", 500],
        ];
        let lines = [], step = 0, typed = 0, t0 = performance.now(), dirty = true, cur = null, lastDraw = 0, rows = 14;
        function push(text, kind, prompt) { lines.push({ text, kind, prompt: prompt || "" }); if (lines.length > rows) lines.shift(); dirty = true; }
        function next(now) { step = (step + 1) % SCRIPT.length; typed = 0; t0 = now; cur = null; }

        function update(now) {
          const s = SCRIPT[step], dt = now - t0;
          if (s[0] === "cmd") {
            if (!cur) { push("", "cmd", s[1]); cur = lines[lines.length - 1]; t0 = now + 350; }
            const n = Math.max(0, Math.min(s[2].length, Math.floor((now - t0) / 75)));
            if (n !== typed) { if (n > typed) keys.char(s[2][n - 1]); typed = n; cur.text = s[2].slice(0, n); dirty = true; }
            if (n === s[2].length && now - t0 > s[2].length * 75 + 260) { keys.press("return"); next(now); }
          } else if (s[0] === "out" || s[0] === "ok") {
            if (!cur) { cur = true; push(s[1], s[0]); }
            if (dt > s[2]) next(now);
          } else if (s[0] === "bar") {
            if (!cur) { push("", "bar"); cur = lines[lines.length - 1]; }
            const p = Math.min(1, dt / s[2]);
            const txt = s[1].padEnd(11) + bar(p, 22) + String(Math.round(p * 100)).padStart(4) + "%";
            if (txt !== cur.text) { cur.text = txt; dirty = true; }
            if (p >= 1) { cur.kind = "out"; push(s[3], "out"); next(now); }
          } else if (s[0] === "clear") {
            if (!cur) { cur = true; lines = []; dirty = true; }
            if (dt > s[1]) next(now);
          }
        }

        let fg = "#fff", bg = "#141414";
        function draw(now) {
          const box = macChrome(ctx, W, H, fg, bg, ["File", "Edit", "Commands", "Settings", "Phone"], "MacTerminal");
          rows = Math.floor((box.h - 24) / LH);
          ctx.fillStyle = fg;
          ctx.font = "400 " + FS + "px 'IBM Plex Mono', ui-monospace, Menlo, Consolas, monospace";
          lines.forEach((l, i) => {
            const y = box.y + 20 + (i + 1) * LH - 8;
            ctx.globalAlpha = l.kind === "out" ? 0.8 : 1;
            ctx.fillText(l.prompt + l.text, box.x + PADX, y);
          });
          // blinking block cursor after the command being typed (or on a fresh line)
          const last = lines[lines.length - 1];
          const typing = last && last.kind === "cmd" && SCRIPT[step][0] === "cmd";
          const idle = SCRIPT[step][0] === "clear" || reduceMotion;
          if ((typing || idle) && (Math.floor(now / 530) % 2 === 0 || reduceMotion)) {
            const row = typing ? lines.length - 1 : Math.min(lines.length, rows - 1);
            const x = box.x + PADX + (typing ? ctx.measureText(last.prompt + last.text).width + 2 : 0);
            ctx.globalAlpha = 1;
            ctx.fillRect(x, box.y + 20 + row * LH + 4, FS * 0.6, LH - 6);
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
          [["cmd", "% ", "cc -o hello hello.c"], ["out", "", "hello: 4096 bytes"], ["cmd", "% ", "./hello"], ["ok", "", "Hello from the Macintosh!"]]
            .forEach(([k, p, s]) => push(s, k, p));
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
      anchors.kin = new THREE.Object3D(); partGroups["Keycaps"].add(anchors.kin);
      anchors.pin = new THREE.Object3D(); partGroups["Mouse Button"].add(anchors.pin);
      const KEYS = G.keys.map(k => ({ cx: k[0], cy: k[1], w: k[2], h: k[3], label: k[4] }));
      const byLabel = {};
      KEYS.forEach(k => { byLabel[k.label] = k; });
      const [MBX, MBY, MBW, MBH, MBT] = G.mouse;
      const NICE = { backspace: "Backspace", tab: "Tab", caps: "Caps Lock", return: "Return", shift: "Shift", rshift: "Shift",
        option: "Option", roption: "Option", cmd: "Command", space: "Space", enter: "Enter" };
      const nice = l => NICE[l] || l.toUpperCase();
      const CAP = { backspace: "backspace", tab: "tab", caps: "caps lock", return: "return", shift: "shift", rshift: "shift",
        option: "option", roption: "option", cmd: "⌘", space: "", enter: "enter" };

      // --- key legends on the model's keycaps (only while this mode is on)
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
      partGroups["Keycaps"].add(legMesh);
      function drawLegends(fg) {
        const c = legend.getContext("2d");
        c.clearRect(0, 0, LW, LH);
        c.fillStyle = fg; c.textAlign = "center"; c.textBaseline = "middle";
        KEYS.forEach(k => {
          const x = (k.cx - kx0) * LS, y = (ky1 - k.cy) * LS;
          const t = k.label in CAP ? CAP[k.label] : k.label.toUpperCase();
          const big = t.length === 1;
          c.globalAlpha = big ? 0.9 : 0.7;
          c.font = (big ? 500 : 400) + " " + Math.round(k.h * LS * (big ? 0.36 : 0.2)) + "px 'IBM Plex Mono', ui-monospace, Menlo, monospace";
          c.fillText(t, x, y + 1);
        });
        legTex.needsUpdate = true;
      }

      // --- pressed-key flash and mouse-button ripple
      const flashMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      const flash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), flashMat);
      flash.rotation.x = -Math.PI / 2; flash.renderOrder = 4;
      partGroups["Keycaps"].add(flash);
      const ripple = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 48), flashMat.clone());
      ripple.rotation.x = -Math.PI / 2; ripple.renderOrder = 4;
      ripple.position.copy(toThree(MBX, MBY, MBT + 0.2));
      partGroups["Mouse Button"].add(ripple);
      anchors.pin.position.copy(toThree(MBX, MBY, MBT));

      // --- what the Mac shows: a word processor window the typed keys land in, and a pointer that clicks
      const SW = 1024, SH = 684;
      const scv = document.createElement("canvas"); scv.width = SW; scv.height = SH;
      const sc = scv.getContext("2d");
      const scrTex = new THREE.CanvasTexture(scv);
      scrTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const scrMat = new THREE.MeshBasicMaterial({ map: scrTex, transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide });
      const scr = new THREE.Mesh(term.geometry, scrMat);
      scr.renderOrder = 4;
      partGroups["CRT Tube"].add(scr);
      let text = "", ptr = { x: SW * 0.66, y: SH * 0.62 }, clickAt = -1e9, lastKey = "", keyAt = -1e9;
      let fgC = "#fff", bgC = "#141414";
      function drawScreen(now) {
        const box = macChrome(sc, SW, SH, fgC, bgC, ["File", "Edit", "Search", "Format", "Font", "Style"], "Untitled");
        sc.strokeStyle = fgC; sc.fillStyle = fgC; sc.lineWidth = 2;
        // ruler
        const rx0 = box.x + 40, rx1 = box.x + box.w - 40, ry = box.y + 34;
        sc.beginPath(); sc.moveTo(rx0, ry); sc.lineTo(rx1, ry); sc.stroke();
        for (let x = rx0, i = 0; x <= rx1; x += 18, i++) { sc.beginPath(); sc.moveTo(x, ry); sc.lineTo(x, ry - (i % 4 === 0 ? 12 : 6)); sc.stroke(); }
        sc.beginPath(); sc.moveTo(box.x, ry + 16); sc.lineTo(box.x + box.w, ry + 16); sc.stroke();
        // text, wrapped
        const FS = 40, LHt = 52, X0 = box.x + 40, Y0 = ry + 76, MAXC = 34;
        sc.font = "400 " + FS + "px 'IBM Plex Mono', ui-monospace, Menlo, monospace";
        const rows = [];
        text.split("\n").forEach(par => { let s = par; do { rows.push(s.slice(0, MAXC)); s = s.slice(MAXC); } while (s.length); });
        const vis = rows.slice(-8);
        sc.globalAlpha = 1;
        if (!text) { sc.globalAlpha = 0.4; sc.fillText("Start typing…", X0, Y0); sc.globalAlpha = 1; }
        vis.forEach((r, i) => sc.fillText(r, X0, Y0 + i * LHt));
        const lastRow = vis.length ? vis[vis.length - 1] : "";
        if (Math.floor(now / 530) % 2 === 0) {
          const cx = text ? X0 + sc.measureText(lastRow).width + 3 : X0 - 6;
          sc.fillRect(cx, Y0 + (Math.max(vis.length, 1) - 1) * LHt - FS * 0.8, 3, FS);
        }
        // the key that just landed, big for a moment
        const ka = 1 - (now - keyAt) / 1400;
        if (ka > 0 && lastKey) {
          sc.globalAlpha = ka * 0.9;
          sc.font = "600 36px 'IBM Plex Mono', ui-monospace, Menlo, monospace";
          sc.textAlign = "right"; sc.fillText(lastKey, box.x + box.w - 30, box.y + box.h - 26); sc.textAlign = "left";
        }
        // pointer + click ripple
        const ca = (now - clickAt) / 900;
        if (ca >= 0 && ca < 1) {
          sc.globalAlpha = 1 - ca; sc.lineWidth = 3;
          for (const k of [0, 0.25]) { const r = 16 + 70 * Math.max(0, ca - k); sc.beginPath(); sc.arc(ptr.x, ptr.y, r, 0, Math.PI * 2); sc.stroke(); }
        }
        sc.globalAlpha = 1; sc.lineWidth = 3;
        sc.beginPath();
        const P = [[0, 0], [0, 44], [11, 33], [19, 52], [27, 48], [19, 30], [33, 30]];
        P.forEach(([x, y], i) => (i ? sc.lineTo(ptr.x + x, ptr.y + y) : sc.moveTo(ptr.x + x, ptr.y + y)));
        sc.closePath(); sc.fillStyle = bgC; sc.fill(); sc.stroke();
        scrTex.needsUpdate = true;
      }

      // --- signal path: a dashed line whose dashes march from the source to the destination
      const MAXP = 10;
      const lineMat = new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color() }, opacity: { value: 0 }, offset: { value: 0 }, dash: { value: 3 }, period: { value: 5 } },
        vertexShader: "attribute float lineDistance; varying float vD; void main() { vD = lineDistance; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: "uniform vec3 color; uniform float opacity, offset, dash, period; varying float vD; void main() { if (mod(vD - offset, period) > dash) discard; gl_FragColor = vec4(color, opacity); }",
        transparent: true, depthTest: false, depthWrite: false,
      });
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * MAXP), 3));
      const path = new THREE.Line(lineGeo, lineMat);
      path.renderOrder = 5; path.frustumCulled = false;
      scene.add(path);

      // --- the steps for one input. dist is the zoom as a fraction of the overview distance.
      const BOARD = ["Logic Board", "Board Components"];
      function stepsFor(inp) {
        const key = inp.kind === "key";
        const name = key ? nice(inp.label) : "";
        const first = key ? [
          { t: "You press " + (name.length === 1 ? "“" + name + "”" : name), focus: "kin", dist: 0.2, ex: 0, p: ["kin", "kbCtrl"], n: ["Keycaps", "Key Switches + PCB"], ms: 3200,
            d: "The key closes a mechanical switch on the keyboard's circuit board. A small controller chip inside the keyboard scans the rows and columns and finds which one closed." },
          { t: "A key code goes down the cord", focus: "kbJack", dist: 0.32, ex: 1, p: ["kbCtrl", "kbCord", "kbJack", "via"], n: ["Key Switches + PCB", "I/O Connectors", "IWM + SCC + VIA"], ms: 3600,
            d: "The keyboard sends a one-byte code down its coiled cord to the jack on the front of the Mac. The VIA chip on the logic board clocks it in, one bit at a time." },
        ] : [
          { t: "You click the mouse", focus: "pin", dist: 0.18, ex: 0, p: ["pin", "mSwitch"], n: ["Mouse Button", "Mouse Shell"], ms: 3200,
            d: "The button presses a switch inside the mouse. As you slide it, the ball turns two slotted wheels and light shining through the slots counts every step of the motion." },
          { t: "The click goes down the cable", focus: "mousePort", dist: 0.34, ex: 1, p: ["mSwitch", "mBoard", "mCable", "mousePort", "scc"], n: ["Mouse Encoders", "I/O Connectors", "IWM + SCC + VIA"], ms: 3600,
            d: "The mouse has no processor of its own. Its pulses travel down the cable to the port on the back, where the SCC and VIA chips on the logic board count them." },
        ];
        return first.concat([
          { t: "The 68000 stops to listen", focus: "cpu", dist: 0.2, ex: 1, p: [key ? "via" : "scc", "cpu"], n: ["Motorola 68000", "IWM + SCC + VIA"], ms: 3400,
            d: "The chip raises an interrupt. The 68000 pauses what it was doing, runs the " + (key ? "keyboard" : "mouse") + " handler in ROM and posts an event for the application." },
          { t: key ? "QuickDraw draws the letter" : "QuickDraw moves the pointer", focus: "rom", dist: 0.22, ex: 1, p: ["cpu", "rom", "cpu", "ram1"], n: ["Motorola 68000", "64K ROM", "128K RAM"], ms: 3600,
            d: key ? "The application calls QuickDraw, the graphics code built into the ROM. It draws the letter's bitmap straight into the screen buffer, 21,888 bytes of the 128K memory."
                   : "QuickDraw, the graphics code built into the ROM, redraws the pointer and the application handles the click. The result goes straight into the screen buffer in memory." },
          { t: "The video circuit reads memory", focus: "video", dist: 0.26, ex: 1, p: ["ram2", "video", "lbHeader"], n: ["128K RAM"].concat(BOARD), ms: 3400,
            d: "Sixty times a second, logic on the board reads the screen buffer and shifts it out one pixel at a time: a single bit, black or white." },
          { t: "The analog board drives the tube", focus: "abVideo", dist: 0.42, ex: 1, p: ["lbHeader", "abConn", "abVideo", "abNeck", "neck"], n: ["Analog Board", "Power Components", "Flyback Transformer", "Neck Board"], ms: 3800,
            d: "The video signal crosses to the analog board, which amplifies it for the tube's electron gun. Its flyback transformer makes the high voltage that pulls the beam to the screen." },
          { t: "The beam paints the picture", focus: "yoke", dist: 0.34, ex: 1, p: ["neck", "yoke", "screen"], n: ["Deflection Yoke", "Neck Board", "CRT Tube"], ms: 3600,
            d: "Coils in the deflection yoke sweep the electron beam across the tube, 342 lines from top to bottom, sixty times a second." },
          { t: key ? "And there it is" : "And the click lands", focus: "screen", dist: 0.5, ex: 0, p: [], n: ["CRT Tube"], ms: 3600, out: true,
            d: "Where the beam strikes, the phosphor glows. From your finger to the screen took a few hundredths of a second." },
        ]);
      }

      const box = document.getElementById("flow");
      const elK = box.querySelector(".flow-k"), elT = box.querySelector("b"), elD = box.querySelector("p"), elBar = box.querySelector(".flow-bar i");
      let on = false, steps = null, idx = -1, t0 = 0, fade = 0, inp = null;
      const api = { names: null, explode: 0, get on() { return on; } };
      function caption(k, t, d, n) {
        elK.textContent = k; elT.textContent = t; elD.textContent = d;
        api.names = n; refresh(true);
      }
      function waiting() {
        steps = null; idx = -1; inp = null; api.explode = 0;
        document.body.classList.remove("zoomed");
        caption("How it works", "Press any key or click the mouse",
          "Type on your keyboard, click a key on the drawing, or click the mouse or the screen. Then follow the signal from your finger to the picture tube.", null);
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
            ptr.x = SW * Math.min(0.9, Math.max(0.08, inp.u)); ptr.y = SH * Math.min(0.86, Math.max(0.12, 1 - inp.v)); clickAt = now;
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

      // inputs: real keys (by physical position), clicks on the model's keys, clicks on the mouse or anywhere else
      const CODE = { Minus: "-", Equal: "=", BracketLeft: "[", BracketRight: "]", Backslash: "\\", Semicolon: ";", Quote: "'",
        Comma: ",", Backquote: "`", Space: "space", Enter: "return", NumpadEnter: "enter", ShiftLeft: "shift", ShiftRight: "rshift",
        AltLeft: "option", AltRight: "roption", MetaLeft: "cmd", MetaRight: "cmd", ControlLeft: "cmd", ControlRight: "cmd",
        Backspace: "backspace", Tab: "tab", CapsLock: "caps" };
      const charOf = l => l.length === 1 ? l : l === "space" ? " " : l === "return" || l === "enter" ? "\n" : l === "backspace" ? "\b" : "";
      addEventListener("keydown", e => {
        if (e.metaKey || e.target.closest("input, textarea, [contenteditable]")) return;
        if (e.ctrlKey && !/^Control/.test(e.code)) return;
        if (e.key === "." && !e.altKey && !e.ctrlKey) { e.preventDefault(); toggle(); return; }
        if (!on || e.key === "/" || e.repeat) return;
        let label = CODE[e.code] || null;
        if (!label && /^Key[A-Z]$/.test(e.code)) label = e.code.slice(3).toLowerCase();
        if (!label && /^Digit\d$/.test(e.code)) label = e.code.slice(5);
        if (!label || !byLabel[label]) return;
        e.preventDefault();
        start({ kind: "key", label, ch: e.key.length === 1 ? e.key : charOf(label) });
      });
      const local = new THREE.Vector3();
      const so = toThree(...G.screen.origin), sr = toThree(...G.screen.right), st = toThree(...G.screen.top);
      const sU = sr.clone().sub(so), sV = st.clone().sub(so);
      canvas.addEventListener("click", () => {
        if (!on || steps) return;
        ray.setFromCamera(mouse, camera);
        const hit = ray.intersectObjects(pickable, false)[0];
        if (!hit) return;
        if (hit.object.name === "Keycaps") {
          modules.keycaps.worldToLocal(local.copy(hit.point));
          const bx = local.x, by = -local.z;
          let best = null, bd = Infinity;
          KEYS.forEach(k => { const d = Math.max(Math.abs(bx - k.cx) - k.w / 2, 0) + Math.max(Math.abs(by - k.cy) - k.h / 2, 0); if (d < bd) { bd = d; best = k; } });
          start({ kind: "key", label: best.label, ch: charOf(best.label) });
          return;
        }
        // a click on the screen puts the pointer where you clicked; anywhere else, near the middle
        modules[G.screen.module].worldToLocal(local.copy(hit.point)).sub(so);
        let u = local.dot(sU) / sU.lengthSq(), v = local.dot(sV) / sV.lengthSq();
        if (!(u > 0 && u < 1 && v > 0 && v < 1) || hit.object.name !== "CRT Tube" && hit.object.name !== "Front Bezel") {
          u = 0.35 + Math.random() * 0.4; v = 0.25 + Math.random() * 0.4;
        }
        start({ kind: "click", u, v });
      });

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
            if (inp.kind === "key") { flashMat.opacity = 0.55 * a + 0.15; flash.position.y = G.keyTop + 0.08 - 2.5 * a; }
            else { const r = 3 + 22 * ((dt % 1100) / 1100); ripple.scale.set(r, r, r); ripple.material.opacity = 0.8 * (1 - (dt % 1100) / 1100); }
          }
          if (s.p.length > 1) {
            show_path = true;
            pts.length = 0;
            s.p.forEach((k, i) => { pts[i] = anchors[k].getWorldPosition(new THREE.Vector3()); });
            const arr = lineGeo.attributes.position.array;
            for (let i = 0; i < MAXP; i++) {
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
