/*
Builds the gallery from models/ + templates/ + engine/:
    node tools/build.js           both of these
    node tools/build.js --dist    dist/      for Vercel: one viewer.html for every model (viewer.html?model=<id>), the shared
                                             engine.js and ui.js, and two data files per model
    node tools/build.js --local   index.html one self-contained file that opens from disk (file://)
    node tools/build.js --only id,id --out <dir>   a preview of just those models in <dir> (dist layout), for working on a
                                                    model without touching dist/ or index.html; ids needn't be in models/index.json yet
Every input is read and checked first; if anything is missing nothing is written.
dist/  index.html (the shell), viewer.html + viewer.js, engine.js, ui.js, manifest.js, models/<id>.geometry.js + <id>.model.js, thumbs/, docs/
*/
"use strict";
const fs = require("fs");
const path = require("path");
const { pageHtml, engineCode } = require("../templates/page.js");

const REPO = path.join(__dirname, "..");
const R = (...p) => path.join(REPO, ...p);
const read = f => fs.readFileSync(f, "utf8");

// everything the build needs, read and checked up front
function load(onlyIds) {
  const missing = [];
  const need = f => { if (fs.existsSync(f)) return true; missing.push(path.relative(REPO, f)); return false; };
  const get = f => need(f) ? read(f) : "";
  const ids = onlyIds || (need(R("models", "index.json")) ? JSON.parse(read(R("models", "index.json"))) : []);
  const engine = engineCode(get(R("engine", "engine.js")) || "// Blueprint model engine\n  requestAnimationFrame(tick);\n})();",
    get(R("engine", "realistic.js")), get(R("engine", "boot.js")));
  const ui = get(R("engine", "ui.js")), viewer = get(R("engine", "viewer.js"));
  const runtime = get(R("engine", "screen-runtime.js"));
  const models = [];
  for (const id of ids) {
    const dir = R("models", id);
    if (!need(path.join(dir, "meta.json"))) continue;
    const meta = JSON.parse(read(path.join(dir, "meta.json")));
    // the model script, with its meta.json (its page text) in front for engine/boot.js, and the screen runtime if it has a screen
    models.push({ id, meta, geometry: get(path.join(dir, "geometry.js")),
      model: "window.BP_META = " + json(meta) + ";\n" + (meta.screenRuntime ? runtime : "") + get(path.join(dir, "model.js")) });
  }
  const template = get(R("templates", "page.html"));
  const gallery = get(R("templates", "gallery.html")), pageJs = get(R("templates", "page.js"));
  if (missing.length) throw new Error("missing inputs, nothing written:\n  " + missing.join("\n  "));
  return { ids, engine, ui, viewer, template, models, gallery, pageJs };
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

// the entries of the single-file gallery: each model's code, from which the shell puts the page together when it's opened
function localModels(d) {
  return d.models.map(m => ({ ...entry(m), geometry: m.geometry, model: m.model }));
}
function buildLocal(d) {
  const html = shell(d, localModels(d), d.template, d.engine, d.ui, d.pageJs);
  fs.writeFileSync(R("index.html"), html);
  return html.length;
}

function buildDist(d, out = R("dist")) {
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, "models"), { recursive: true });
  fs.writeFileSync(path.join(out, "engine.js"), d.engine);
  fs.writeFileSync(path.join(out, "ui.js"), d.ui);
  fs.writeFileSync(path.join(out, "viewer.js"), d.viewer);
  // the list of models every page's picker shows, where the page of all models is, and the address of a model's page
  fs.writeFileSync(path.join(out, "manifest.js"), "window.BP_MANIFEST = " + json(d.models.map(entry)) + ";\nwindow.BP_HOME = \"index.html\";\n" +
    "window.BP_PAGE = id => \"viewer.html?model=\" + encodeURIComponent(id);\n");
  fs.writeFileSync(path.join(out, "viewer.html"), pageHtml(d.template, { manifest: { src: "manifest.js" }, viewer: { src: "viewer.js" } }));
  for (const m of d.models) {
    fs.writeFileSync(path.join(out, "models", m.id + ".geometry.js"), m.geometry);
    fs.writeFileSync(path.join(out, "models", m.id + ".model.js"), m.model);
  }
  const site = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL : "");
  let home = shell(d, d.models.map(m => ({ ...entry(m), src: "viewer.html?model=" + encodeURIComponent(m.id) })), "", "", "", "");
  if (site) home = home.replace('content="brand/og.png"', 'content="' + site.replace(/\/$/, "") + '/brand/og.png"');
  fs.writeFileSync(path.join(out, "index.html"), home);
  for (const dir of ["thumbs", "docs", "brand"]) if (fs.existsSync(R(dir))) fs.cpSync(R(dir), path.join(out, dir), { recursive: true });
  return out;
}

const size = f => (fs.statSync(f).size / 1e6).toFixed(2) + " MB";
function dirSize(d) { return fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? dirSize(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0); }

module.exports = { load, localModels, shell, entry };

if (require.main === module) {
  const a = process.argv.slice(2), arg = k => { const i = a.indexOf(k); return i < 0 ? null : a[i + 1]; };
  const onlyIds = arg("--only") ? arg("--only").split(",").filter(Boolean) : null, outDir = arg("--out");
  let d;
  try {
    if (onlyIds && !outDir) throw new Error("--only needs --out <dir>, so dist/ and index.html are left alone");
    d = load(onlyIds);
  } catch (e) { console.error(e.message); process.exit(1); }
  if (onlyIds) {   // a preview of some models, written nowhere else
    const out = buildDist(d, path.resolve(outDir));
    console.log("preview in " + out + ": " + d.ids.join(", ") + "  ->  open '" + path.join(out, "viewer.html") + "?model=<id>'");
    process.exit(0);
  }
  const only = a.includes("--dist") ? "dist" : a.includes("--local") ? "local" : "both";
  if (only !== "local") {
    buildDist(d);
    console.log("dist/ " + (dirSize(R("dist")) / 1e6).toFixed(2) + " MB, index.html " + size(R("dist", "index.html")) +
      ", engine.js " + size(R("dist", "engine.js")) + ", ui.js " + size(R("dist", "ui.js")) + ", " + d.models.length + " models");
  }
  if (only !== "dist") { buildLocal(d); console.log("index.html " + size(R("index.html")) + ", " + d.models.length + " models"); }
}
