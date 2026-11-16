// The viewer page (dist/viewer.html): one page for every model. It is told which model by its address,
//     viewer.html?model=macmini
// and loads that model's two files (models/<id>.geometry.js, models/<id>.model.js), then the shared engine and controls.
// Scripts added like this download side by side but run in the order they were added, which is what the engine needs:
// the geometry, then the model script that reads it, then the engine that reads the model.
(function () {
  "use strict";
  const id = new URLSearchParams(location.search).get("model");
  const known = (window.BP_MANIFEST || []).some(x => x.id === id);
  if (!known) { location.replace(window.BP_HOME || "index.html"); return; }
  ["models/" + id + ".geometry.js", "models/" + id + ".model.js", "engine.js", "ui.js"].forEach(src => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    document.body.appendChild(s);
  });
})();
