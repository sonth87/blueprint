/*
Puts a model page together: the page template (templates/page.html, the same for every model) with the scripts
where <!--SCRIPTS--> is. Each script is either inline code ({ code }) or a file ({ src }); the ones that are left
out are skipped. In order:
    manifest   the list of every model (window.BP_MANIFEST), for the picker; left out for a page with no picker
    geometry   the model's generated geometry
    model      the model's script, with its meta.json before it (window.BP_META, window.BLUEPRINT_MODEL)
    engine     engine/boot.js (puts the model's text in the page), the shared engine and the shaded and photo styles
    ui         the shared controls round the engine: back button, model picker, render style, theme carried between pages
    viewer     instead of the four above: loads them for the model named in the address (dist/viewer.html?model=<id>)
The same function runs in Node (tools/build.js) and in the browser (the single-file index.html, which keeps the
template and the engine once and puts each page together when it's opened).
*/
(function (root) {
  "use strict";
  const ORDER = ["manifest", "geometry", "model", "engine", "ui", "viewer"];
  function pageHtml(template, scripts) {
    const tags = ORDER.filter(k => scripts[k]).map(k => scripts[k].src ? '<script src="' + scripts[k].src + '"></script>' : "<script>\n" + scripts[k].code + "</script>").join("\n");
    const at = template.indexOf("<!--SCRIPTS-->");
    if (at < 0) throw new Error("template has no <!--SCRIPTS--> slot");
    return template.slice(0, at) + tags + template.slice(at + "<!--SCRIPTS-->".length);
  }
  // the engine as every page carries it: boot.js, then engine.js up to its frame loop, then realistic.js (the shaded
  // and photo styles), then the loop's start and the engine's close
  function engineCode(engine, realistic, boot) {
    const START = "// Blueprint model engine", END = "requestAnimationFrame(tick);\n})();";
    const a = engine.indexOf(START), tail = engine.lastIndexOf("  " + END);
    if (a < 0 || tail < 0) throw new Error("engine.js doesn't start or end as expected");
    return (boot || "") + engine.slice(a, tail) + realistic + END + "\n";
  }
  const api = { pageHtml, engineCode };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.BP_page = api;
})(typeof window !== "undefined" ? window : this);
