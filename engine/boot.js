// Puts a model's own text into the page's shared chrome, before the engine starts (the engine reads some of it: the
// hint decides whether there is a Screen button). window.BP_META is the model's meta.json, set by its model script.
(function () {
  "use strict";
  const m = window.BP_META;
  if (!m) return;
  const $ = s => document.querySelector(s);
  const put = (s, f) => { const el = $(s); if (el) f(el); };
  document.title = m.title;
  document.body.dataset.model = m.id;
  put("#scene", el => el.setAttribute("aria-label", m.sceneLabel));
  put("#hotspots", el => el.setAttribute("aria-label", m.hotspotsLabel));
  put(".mark", el => { el.innerHTML = m.mark; });
  put(".dwg", el => { el.innerHTML = m.dwg; });
  put("#screen-hint", el => { el.innerHTML = m.screenHint || ""; });
})();
