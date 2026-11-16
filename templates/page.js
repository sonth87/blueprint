/*
Puts a model page together: a page template (templates/page-*.html) with the model's strings in its {{slots}} and its
three scripts (geometry, model, engine) where <!--SCRIPTS--> is. Each script is either inline code ({ code }) or a
file ({ src }). The same function runs in Node (tools/build.js) and in the browser (the single-file index.html, which
keeps every template and the engine once and puts each page together when it's opened).
*/
(function (root) {
  "use strict";
  const SLOTS = ["title", "sceneLabel", "hotspotsLabel", "mark", "dwg"];
  function pageHtml(template, meta, scripts) {
    let html = template;
    SLOTS.forEach(k => { if (meta[k] !== undefined) html = html.split("{{" + k + "}}").join(meta[k]); });
    const tags = [scripts.geometry, scripts.model, scripts.engine]
      .map(s => s.src ? '<script src="' + s.src + '"></script>' : "<script>\n" + s.code + "</script>").join("\n");
    const at = html.indexOf("<!--SCRIPTS-->");
    if (at < 0) throw new Error("template has no <!--SCRIPTS--> slot");
    return html.slice(0, at) + tags + html.slice(at + "<!--SCRIPTS-->".length);
  }
  // the engine as every page carries it: engine.js up to its frame loop, then realistic.js (the shaded and photo
  // styles), then the loop's start and the engine's close
  function engineCode(engine, realistic) {
    const START = "// Blueprint model engine", END = "requestAnimationFrame(tick);\n})();";
    const a = engine.indexOf(START), tail = engine.lastIndexOf("  " + END);
    if (a < 0 || tail < 0) throw new Error("engine.js doesn't start or end as expected");
    return engine.slice(a, tail) + realistic + END + "\n";
  }
  const api = { pageHtml, engineCode, SLOTS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BP_page = api;
})(typeof window !== "undefined" ? window : this);
