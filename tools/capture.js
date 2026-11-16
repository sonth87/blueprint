/*
Screenshots of a model page (dist/m/<id>.html, from `npm run build:dist`; it opens from disk) for checking a build: assembled, taken apart (Space locks it apart), the same without
labels, and a close-up. Prints any page errors and exits 1 if there were some.

    NODE_PATH=<dir with playwright-core> node tools/capture.js <page.html> <out dir> [--zoom x,y,clicks]

Writes <out dir>/assembled.png, apart.png, apart-nolabels.png and, with --zoom, zoom.png (the wheel turned
`clicks` times at x, y; the pointer over the model opens it, so the close-up is of the parts apart). Read every PNG it writes. Chrome: CHROMIUM=path.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const args = process.argv.slice(2);
const zi = args.indexOf("--zoom"), zoom = zi >= 0 ? args.splice(zi, 2)[1].split(",").map(Number) : null;
const [page, out] = args;
if (!page || !out) { console.error("usage: node tools/capture.js <page.html> <out dir> [--zoom x,y,clicks]"); process.exit(1); }
fs.mkdirSync(out, { recursive: true });

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const p = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  const errors = [];
  p.on("pageerror", e => errors.push(e.message));
  p.on("console", m => { if (m.type() === "error" && !/GL Driver|GPU stall/.test(m.text())) errors.push(m.text()); });
  await p.goto("file://" + path.resolve(page));
  await p.waitForTimeout(2500);
  await p.mouse.move(1399, 999);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(out, "assembled.png") });
  if (zoom) {
    await p.mouse.move(zoom[0], zoom[1]);
    for (let i = 0; i < zoom[2]; i++) { await p.mouse.wheel(0, -200); await p.waitForTimeout(60); }
    await p.waitForTimeout(1200);
    await p.screenshot({ path: path.join(out, "zoom.png") });
    await p.keyboard.press("r"); await p.waitForTimeout(1200);
    await p.mouse.move(1399, 999);
  }
  // Space toggles: give a model the pointer just left time to close (300 ms) first, or Space locks it closed
  await p.waitForTimeout(800);
  await p.keyboard.press("Space"); await p.waitForTimeout(3000);
  await p.screenshot({ path: path.join(out, "apart.png") });
  await p.keyboard.press("h"); await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(out, "apart-nolabels.png") });
  await b.close();
  console.log("wrote", fs.readdirSync(out).filter(f => f.endsWith(".png")).map(f => path.join(out, f)).join(" "));
  if (errors.length) { console.error("page errors:\n  " + errors.join("\n  ")); process.exit(1); }
  console.log("no page errors");
})();
