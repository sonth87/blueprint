/*
Builds the gallery from models/ + templates/ + engine/:
    node tools/build.js           both of these
    node tools/build.js --dist    dist/      for Vercel: a shared engine.js and ui.js, a small page and two data files per model
    node tools/build.js --local   index.html one self-contained file that opens from disk (file://)
Every input is read and checked first; if anything is missing nothing is written.
dist/  index.html (the shell), engine.js, ui.js, manifest.js, m/<id>.html + <id>.geometry.js + <id>.model.js, thumbs/, docs/
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { pageHtml, engineCode, SLOTS } = require("../templates/page.js");

const REPO = path.join(__dirname, "..");
const R = (...p) => path.join(REPO, ...p);
const read = f => fs.readFileSync(f, "utf8");

// everything the build needs, read and checked up front
function load() {
  const missing = [];
  const need = f => { if (fs.existsSync(f)) return true; missing.push(path.relative(REPO, f)); return false; };
  const get = f => need(f) ? read(f) : "";
  const ids = need(R("models", "index.json")) ? JSON.parse(read(R("models", "index.json"))) : [];
  const engine = engineCode(get(R("engine", "engine.js")) || "// Blueprint model engine\n  requestAnimationFrame(tick);\n})();",
    get(R("engine", "realistic.js")));
  const ui = get(R("engine", "ui.js"));
  const runtime = get(R("engine", "screen-runtime.js"));
  const models = [];
  for (const id of ids) {
    const dir = R("models", id);
    if (!need(path.join(dir, "meta.json"))) continue;
    const meta = JSON.parse(read(path.join(dir, "meta.json")));
    models.push({ id, meta, geometry: get(path.join(dir, "geometry.js")),
      model: (meta.screenRuntime ? runtime : "") + get(path.join(dir, "model.js")) });
  }
  const template = get(R("templates", "page.html"));
  const gallery = get(R("templates", "gallery.html")), pageJs = get(R("templates", "page.js"));
  if (missing.length) throw new Error("missing inputs, nothing written:\n  " + missing.join("\n  "));
  return { ids, engine, ui, template, models, gallery, pageJs };
}

// JSON that is safe inside a <script>: no "</script>" or "<!--" can appear
const json = v => JSON.stringify(v).replace(/</g, "\\u003c");
const fill = (html, token, value) => { if (!html.includes(token)) throw new Error("gallery.html lacks " + token); return html.replace(token, () => value); };
// code placed in a <script>: same program, but "</script" and "<!--" can't end or open anything
const safeCode = c => c.replace(/<\/script/gi, "<\\/script").replace(/<!--/g, "<\\x21--");
const entry = ({ id, meta }) => ({ id, label: meta.label, kind: meta.kind, tags: meta.tags, key: meta.key, category: meta.category });

function shell(d, models, template, engine, ui, pageJs) {
  let h = fill(d.gallery, "const MODELS = /*MODELS*/[];", "const MODELS = " + json(models) + ";");
  h = fill(h, 'const TEMPLATE = /*TEMPLATE*/"";', "const TEMPLATE = " + json(template) + ";");
  h = fill(h, 'const ENGINE = /*ENGINE*/"";', "const ENGINE = " + json(engine) + ";");
  h = fill(h, 'const UI = /*UI*/"";', "const UI = " + json(ui) + ";");
  return fill(h, "<!--PAGE_JS-->", pageJs ? "<script>\n" + safeCode(pageJs) + "</script>" : "");
}

// the entries of the single-file gallery: the page's strings and code, from which the shell puts the page together
function localModels(d) {
  const slots = m => { const o = {}; for (const k of SLOTS) o[k] = m.meta[k]; return o; };
  return d.models.map(m => ({ ...entry(m), ...slots(m), geometry: m.geometry, model: m.model }));
}
function buildLocal(d) {
  const html = shell(d, localModels(d), d.template, d.engine, d.ui, d.pageJs);
  fs.writeFileSync(R("index.html"), html);
  return html.length;
}

function buildDist(d) {
  const out = R("dist");
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, "m"), { recursive: true });
  fs.writeFileSync(path.join(out, "engine.js"), d.engine);
  fs.writeFileSync(path.join(out, "ui.js"), d.ui);
  // the list of models every page's picker shows, and where the page of all models is
  fs.writeFileSync(path.join(out, "manifest.js"),
    "window.BP_MANIFEST = " + json(d.models.map(entry)) + ";\nwindow.BP_HOME = \"../index.html\";\n");
  for (const m of d.models) {
    const w = (n, c) => fs.writeFileSync(path.join(out, "m", m.id + n), c);
    w(".html", pageHtml(d.template, m.meta, { manifest: { src: "../manifest.js" }, geometry: { src: m.id + ".geometry.js" },
      model: { src: m.id + ".model.js" }, engine: { src: "../engine.js" }, ui: { src: "../ui.js" } }));
    w(".geometry.js", m.geometry);
    w(".model.js", m.model);
  }
  fs.writeFileSync(path.join(out, "index.html"), shell(d, d.models.map(m => ({ ...entry(m), src: "m/" + m.id + ".html" })), "", "", "", ""));
  for (const dir of ["thumbs", "docs"]) if (fs.existsSync(R(dir))) fs.cpSync(R(dir), path.join(out, dir), { recursive: true });
}

const size = f => (fs.statSync(f).size / 1e6).toFixed(2) + " MB";
function dirSize(d) { return fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? dirSize(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0); }

module.exports = { load, localModels, shell, entry };

if (require.main === module) {
  const a = process.argv.slice(2), only = a.includes("--dist") ? "dist" : a.includes("--local") ? "local" : "both";
  let d;
  try { d = load(); } catch (e) { console.error(e.message); process.exit(1); }
  if (only !== "local") {
    buildDist(d);
    console.log("dist/ " + (dirSize(R("dist")) / 1e6).toFixed(2) + " MB, index.html " + size(R("dist", "index.html")) +
      ", engine.js " + size(R("dist", "engine.js")) + ", ui.js " + size(R("dist", "ui.js")) + ", " + d.models.length + " models");
  }
  if (only !== "dist") { buildLocal(d); console.log("index.html " + size(R("index.html")) + ", " + d.models.length + " models"); }
}
