/*
One thumbnail for the home page's grid, in one step: tools/thumbs.js's render and tools/thumbs.py's mask together,
with the masking done on a canvas in the browser, so it needs no Python or Pillow and runs on macOS.

    NODE_PATH=<dir with playwright-core> node tools/thumb_one.js <page.html> <out.webp> [--key <theme key>] [--selector <css>]

A blueprint page (e.g. macmini/index.html, --key mm4-theme) is shot whole in its dark theme with the chrome hidden;
with --selector only that element is shot (an Anatomy figure's stage). The shot becomes a white 960 x 720 WebP whose
alpha is the lines' brightness, cropped to the drawing at 4:3 with a margin, so the grid can colour it with any theme.
Chrome: CHROMIUM=path, default the macOS Google Chrome.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const key = opt("--key"), selector = opt("--selector"), gain = opt("--gain"), hide = opt("--hide");
const [page, out] = args;
if (!page || !out) { console.error("usage: node tools/thumb_one.js <page.html> <out.webp> [--key k] [--selector css]"); process.exit(1); }
const HIDE = `.page, .hint, .dwg, #hotspots, .sheet, .viewbar, .panpad, .flow, .exportbar, .tour, .detail, #tip, .bp-controls { display: none !important; }
  html, body { background: #000 !important; }`;

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const p = await (await b.newContext({ viewport: { width: 1200, height: selector ? 1600 : 900 }, deviceScaleFactor: 1 })).newPage();
  if (key) await p.addInitScript(k => { try { localStorage.setItem(k, "dark"); } catch (e) {} }, key);
  await p.goto("file://" + path.resolve(page));
  if (!selector) await p.addStyleTag({ content: HIDE });
  // --hide <css>: leave things out of the shot, e.g. a WebGL layer that headless Chrome's software GL renders wrong
  if (hide) await p.addStyleTag({ content: hide + " { visibility: hidden !important; }" });
  await p.waitForTimeout(selector ? 4000 : 2600);
  await p.mouse.move(1199, selector ? 1599 : 899);   // keep the pointer off the model so it stays closed
  await p.waitForTimeout(400);
  // with a selector: the page shot clipped to the box round every match (a figure drawn in back and front layers)
  const clip = selector && await p.evaluate(sel => {
    const r = [...document.querySelectorAll(sel)].map(e => e.getBoundingClientRect()).filter(r => r.width && r.height);
    if (!r.length) return null;
    const x = Math.min(...r.map(q => q.left)), y = Math.min(...r.map(q => q.top));
    return { x, y, width: Math.max(...r.map(q => q.right)) - x, height: Math.max(...r.map(q => q.bottom)) - y };
  }, selector);
  if (selector && !clip) throw new Error("nothing matches " + selector);
  const shot = await p.screenshot(clip ? { clip } : {});
  const webp = await p.evaluate(async ([src, autoGain]) => {
    const img = new Image(); img.src = "data:image/png;base64," + src; await img.decode();
    const W = img.width, H = img.height, c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, W, H).data, m = g.createImageData(W, H);
    const lum = i => Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]);
    // as thumbs.py: the dark fills (below 26) drop out, the rest stretches to full. With --gain auto the stretch
    // ends at the 97th percentile of what's left, for drawings whose lines are grey rather than white
    let top = 226;
    if (autoGain) {
      const hist = new Uint32Array(256); let n = 0;
      for (let i = 0; i < W * H; i++) { const v = lum(i); if (v >= 26) { hist[v]++; n++; } }
      let acc = 0;
      for (let v = 255; v >= 26; v--) { acc += hist[v]; if (acc >= n * 0.03) { top = Math.max(60, v); break; } }
    }
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let i = 0; i < W * H; i++) {
      const v = lum(i);
      const a = v < 26 ? 0 : Math.min(255, Math.floor((v - 26) * 255 / (top - 26)));
      m.data[i * 4] = m.data[i * 4 + 1] = m.data[i * 4 + 2] = 255; m.data[i * 4 + 3] = a;
      if (a) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    g.putImageData(m, 0, 0);
    const cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2, w = Math.max(x1 + 1 - x0, (y1 + 1 - y0) * 4 / 3) * 1.12, h = w * 3 / 4;
    const o = document.createElement("canvas"); o.width = 960; o.height = 720;
    const og = o.getContext("2d"); og.imageSmoothingQuality = "high";
    og.drawImage(c, Math.floor(cx - w / 2), Math.floor(cy - h / 2), Math.floor(w), Math.floor(h), 0, 0, 960, 720);
    return o.toDataURL("image/webp", 0.82).split(",")[1];
  }, [shot.toString("base64"), gain === "auto"]);
  fs.writeFileSync(out, Buffer.from(webp, "base64"));
  console.log("wrote", out, fs.statSync(out).size, "bytes");
  await b.close();
})();
