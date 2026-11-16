/*
Puts a model page together: the page template (templates/page.html) with the model's strings in its {{slots}} and its
scripts where <!--SCRIPTS--> is. Each script is either inline code ({ code }) or a file ({ src }); the ones that are
left out are skipped. In order:
    manifest   the list of every model (window.BP_MANIFEST), for the picker; left out for a page with no picker
    geometry   the model's generated geometry
    model      the model's script (window.BLUEPRINT_MODEL)
    engine     the shared engine, with the shaded and photo styles
    ui         the shared controls round the engine: back button, model picker, render style, theme carried between pages
The same function runs in Node (tools/build.js) and in the browser (the single-file index.html, which keeps the
template and the engine once and puts each page together when it's opened).
*/
(function (root) {
  "use strict";
  const SLOTS = ["id", "title", "sceneLabel", "hotspotsLabel", "mark", "dwg", "screenHint"];
  const ORDER = ["manifest", "geometry", "model", "engine", "ui"];
  function pageHtml(template, meta, scripts) {
    let html = template;
    // a slot a model has no text for (screenHint, on most) is left empty
    SLOTS.forEach(k => { html = html.split("{{" + k + "}}").join(meta[k] === undefined ? "" : meta[k]); });
    const tags = ORDER.filter(k => scripts[k]).map(k => scripts[k].src ? '<script src="' + scripts[k].src + '"></script>' : "<script>\n" + scripts[k].code + "</script>").join("\n");
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
