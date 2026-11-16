#!/usr/bin/env node
/* Visual regression check: did a build change alter how any model looks?
 *
 *   NODE_PATH=<dir with playwright-core> node tools/regress.js --out <dir> \
 *       --a <url template> [--b <url template>] [--only id,id] [--states closed,open] [--wait ms] [--force]
 *
 * A URL template contains {id}, e.g. file:///abs/dist/viewer.html?model={id} (from `npm run build:dist`),
 * or the same for an older build to compare with. Model ids come from models/index.json.
 * Each side is captured to <out>/<side>/<id>-<state>.png (existing PNGs are skipped,
 * so runs are resumable; --force recaptures). States: closed (as loaded) and open
 * (Space pressed: model taken apart). With --b, every pair is compared; differing
 * pixels (any RGB channel off by > 8) are written red-on-black to <out>/diff/.
 * <out>/report.txt lists the result. Exit 1 if anything differs by > 0.05%,
 * a page logged errors, or a capture failed.
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1]; };
const out = opt("out"), tpl = { a: opt("a"), b: opt("b") };
if (!out || !tpl.a) { console.error("usage: regress.js --out DIR --a URL_TEMPLATE [--b URL_TEMPLATE] [--only ids] [--states closed,open] [--wait ms] [--force]"); process.exit(2); }
const force = args.includes("--force");
const states = opt("states", "closed,open").split(",");
const only = opt("only") ? opt("only").split(",") : null;
const waitMs = opt("wait") ? +opt("wait") : null;
const ids = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "models", "index.json"), "utf8"))
  .map(m => (typeof m === "string" ? m : m.id)).filter(id => !only || only.includes(id));
const sides = ["a", "b"].filter(s => tpl[s]);
const IGNORE = /GL Driver|GPU stall|insights|favicon|ERR_FILE_NOT_FOUND.*favicon/;
const HIDE = ".page, .hint, .dwg, #hotspots, .viewbar, .panpad, .flow, .exportbar, .tour, .detail, #tip, .bp-controls, .sheet { display:none !important; } html, body { background:#000 !important; }";
const file = (side, id, st) => path.join(out, side, `${id}-${st}.png`);
const errors = { a: {}, b: {} }, failed = [];

async function capture(browser, side, id) {
  const todo = states.filter(st => force || !fs.existsSync(file(side, id, st)));
  if (!todo.length) return;
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(String(e.message || e)));
  page.on("console", m => { if (m.type() === "error" && !IGNORE.test(m.text())) errs.push(m.text()); });
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(tpl[side].replace(/\{id\}/g, id), { waitUntil: "load" });
    await page.waitForSelector("#scene", { timeout: 30000, state: "attached" });
    await page.waitForTimeout(waitMs != null ? waitMs : id === "turbofan" ? 9000 : 3500);
    await page.addStyleTag({ content: HIDE });
    await page.mouse.move(1399, 899);
    await page.waitForTimeout(600);
    fs.mkdirSync(path.join(out, side), { recursive: true });
    for (const st of states) {
      if (st === "open") { await page.keyboard.press("Space"); await page.waitForTimeout(3500); }
      if (todo.includes(st)) await page.screenshot({ path: file(side, id, st) });
    }
  } catch (e) { failed.push(`${side}/${id}: ${e.message.split("\n")[0]}`); }
  if (errs.length) errors[side][id] = errs;
  await ctx.close();
}

async function countDiff(page, fa, fb, fd) {
  const r = await page.evaluate(async ([A, B]) => {
    const load = s => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = s; });
    const [ia, ib] = await Promise.all([load(A), load(B)]);
    const data = i => { const c = document.createElement("canvas"); c.width = i.width; c.height = i.height; const x = c.getContext("2d"); x.drawImage(i, 0, 0); return x.getImageData(0, 0, c.width, c.height); };
    const da = data(ia), db = data(ib), c = document.createElement("canvas");
    c.width = da.width; c.height = da.height;
    const x = c.getContext("2d"), o = x.createImageData(c.width, c.height);
    let n = 0;
    for (let p = 0; p < da.data.length; p += 4) {
      const d = Math.abs(da.data[p] - db.data[p]) > 8 || Math.abs(da.data[p + 1] - db.data[p + 1]) > 8 || Math.abs(da.data[p + 2] - db.data[p + 2]) > 8;
      if (d) { n++; o.data[p] = 255; }
      o.data[p + 3] = 255;
    }
    x.putImageData(o, 0, 0);
    return { n, png: c.toDataURL("image/png") };
  }, [fa, fb].map(f => "data:image/png;base64," + fs.readFileSync(f).toString("base64")));
  fs.mkdirSync(path.dirname(fd), { recursive: true });
  fs.writeFileSync(fd, Buffer.from(r.png.split(",")[1], "base64"));
  return r.n;
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  for (const id of ids) for (const side of sides) {
    const t = Date.now();
    await capture(browser, side, id);
    console.log(`captured ${side}/${id} (${((Date.now() - t) / 1000).toFixed(1)}s)`);
  }
  const lines = [];
  let bad = failed.length > 0;
  if (sides.length === 2) {
    const page = await browser.newPage();
    await page.goto("about:blank");
    for (const id of ids) for (const st of states) {
      const fa = file("a", id, st), fb = file("b", id, st);
      if (!fs.existsSync(fa) || !fs.existsSync(fb)) { lines.push(`${id} ${st}: MISSING`); bad = true; continue; }
      if (fs.readFileSync(fa).equals(fs.readFileSync(fb))) { lines.push(`${id} ${st}: IDENTICAL`); continue; }
      const n = await countDiff(page, fa, fb, path.join(out, "diff", `${id}-${st}.png`));
      const pct = n / 12600;
      if (pct > 0.05) bad = true;
      lines.push(`${id} ${st}: ${n ? `DIFFERS (${n} px, ${pct.toFixed(3)}%)` : "IDENTICAL (within tolerance)"}`);
    }
  }
  await browser.close();
  for (const s of sides) for (const [id, e] of Object.entries(errors[s])) { bad = true; lines.push(`ERRORS ${s}/${id}: ${e.join(" | ")}`); }
  for (const f of failed) lines.push(`FAILED ${f}`);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "report.txt"), lines.join("\n") + "\n");
  console.log(lines.join("\n"));
  process.exit(bad ? 1 : 0);
})();
