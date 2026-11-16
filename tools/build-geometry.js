#!/usr/bin/env node
// Regenerates models/<id>/geometry.js by running every models/*/build.js (or just the ids given).
//   node tools/build-geometry.js [id ...]
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const MODELS = path.join(ROOT, "models");
const want = process.argv.slice(2);
const ids = fs.readdirSync(MODELS).filter(id => fs.existsSync(path.join(MODELS, id, "build.js")) && (!want.length || want.includes(id))).sort();
const missing = want.filter(id => !ids.includes(id));
let failed = missing.length;
missing.forEach(id => console.error(`${id}: no models/${id}/build.js`));

for (const id of ids) {
  const r = spawnSync(process.execPath, [path.join("models", id, "build.js")], { cwd: ROOT, encoding: "utf8" });
  if (r.status === 0) console.log(`ok   ${id}: ${r.stdout.trim().replace(/^.*?geometry\.js: /, "")}`);
  else { failed++; console.error(`FAIL ${id}: ${(r.stderr || r.stdout || "exit " + r.status).trim()}`); }
}
console.log(`${ids.length - (failed - missing.length)}/${ids.length} built`);
process.exit(failed ? 1 : 0);
