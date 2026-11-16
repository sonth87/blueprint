/*
The controls round the engine on every model page, built into the page itself (the engine knows nothing of them): a
back button to all the models, a picker to jump to any other model, the Lines / Shaded / Photo render style, and the
colour theme carried from one model to the next. Runs after the engine, only when the page has a list of the models
(window.BP_MANIFEST) and isn't an embed.

It reaches other pages two ways. Inside the gallery (a frame in the home page, which offers window.BP_GALLERY) it asks
the gallery to open one. On its own (a page served from dist/m/) it follows a link: BP_HOME is the page of all the
models, BP_PAGE(id) the address of another model's page (default: <id>.html next to this one).
*/
(function () {
  "use strict";
  const root = document.documentElement;
  const M = window.BLUEPRINT_MODEL, MODELS = window.BP_MANIFEST;
  if (!M || !MODELS || root.classList.contains("bp-embed")) return;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const me = MODELS.find(x => x.id === document.body.dataset.model) || { id: "", label: document.title, key: M.themeKey };
  const host = (() => { try { return window.parent !== window && window.parent.BP_GALLERY || null; } catch (e) { return null; } })();
  const canGoHome = !!(host || window.BP_HOME);
  // every page reads its theme from its own key at startup: this page has just saved its own, so hand it to all
  const carryTheme = () => {
    const t = store.get(me.key);
    if (!t) return;
    MODELS.forEach(x => store.set(x.key, t));
    store.set("blueprints-theme", t);
    if (host && host.setTheme) host.setTheme(t);
  };
  const go = id => {
    carryTheme();
    if (host) host.show(id);
    else location.href = window.BP_PAGE ? window.BP_PAGE(id) : id + ".html";
  };
  const goHome = () => { carryTheme(); if (host) host.home(); else location.href = window.BP_HOME; };
  let style = store.get("blueprints-style");
  if (!["blueprint", "realistic", "photo"].includes(style)) style = "blueprint";

  // styles for the model dropdown, added to each page; it uses the page's own theme colours
  const CSS = `
    * { -webkit-tap-highlight-color: transparent; }
    ::selection { background: var(--fg); color: var(--bg); }
    html { scrollbar-width: thin; scrollbar-color: var(--rule) transparent; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--rule); border-radius: 8px; }
    input[type="search"]::-webkit-search-cancel-button, input[type="search"]::-webkit-search-decoration { -webkit-appearance: none; appearance: none; }
    .bp-controls { display: flex; align-items: center; gap: 10px; pointer-events: auto; }
    .bp-controls * { pointer-events: auto; }
    .bp-model { position: relative; display: flex; align-items: center; }
    .bp-home {
      flex: none; display: flex; align-items: center; gap: 8px; pointer-events: auto; cursor: pointer;
      font: 500 11px/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--fg-2);
      background: transparent; border: 1px solid var(--rule); border-radius: 999px; padding: 11px 14px;
      transition: border-color .2s, color .2s;
    }
    .bp-home:hover { color: var(--fg); border-color: var(--fg); }
    .bp-home:focus-visible { outline: 1px dashed var(--fg); outline-offset: 2px; }
    .bp-home svg { width: 12px; height: 12px; }
    @media (max-width: 760px) { .bp-home span { display: none; } }
    .bp-style { display: flex; padding: 3px; border: 1px solid var(--rule); border-radius: 999px; }
    .bp-style button {
      font: 500 11px/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--fg-2);
      background: transparent; border: 0; border-radius: 999px; padding: 9px 12px; cursor: pointer;
      transition: background-color .2s, color .2s;
    }
    .bp-style button:hover { color: var(--fg); }
    .bp-style button[aria-pressed="true"] { background: var(--fg); color: var(--bg); }
    .bp-style button:focus-visible { outline: 1px dashed var(--fg); outline-offset: 2px; }
    .page { z-index: 6; }
    .bp-model input {
      width: 190px; cursor: pointer;
      font: 500 12px/1 var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--fg);
      background: transparent; border: 1px solid var(--rule); border-radius: 999px;
      padding: 11px 36px 11px 16px; transition: border-color .2s;
    }
    .bp-model input::placeholder { color: var(--fg-3); }
    .bp-model input:hover { border-color: var(--fg); }
    .bp-model input:focus { cursor: text; border-color: var(--fg); outline: none; text-transform: none; letter-spacing: .02em; }
    .bp-model::after {
      content: ""; position: absolute; right: 16px; top: 50%; width: 6px; height: 6px; pointer-events: none;
      border-right: 1.5px solid var(--fg); border-bottom: 1.5px solid var(--fg); transform: translateY(-70%) rotate(45deg);
      transition: transform .2s;
    }
    .bp-model.open::after { transform: translateY(-25%) rotate(225deg); }
    .bp-list {
      position: absolute; top: calc(100% + 6px); left: 0; min-width: 100%; margin: 0; padding: 5px; list-style: none;
      background: var(--panel); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
      border: 1px solid var(--rule); border-radius: 14px; max-height: 60vh; overflow: auto; z-index: 8;
      overscroll-behavior: contain; touch-action: pan-y; -webkit-overflow-scrolling: touch;
    }
    /* with the picker in the header there's no room for the subtitle on smaller screens */
    @media (max-width: 1180px) { .mark span { display: none; } }
    .bp-list[hidden] { display: none; }
    .bp-list li {
      display: flex; justify-content: space-between; gap: 16px; padding: 10px 12px; border-radius: 9px; cursor: pointer;
      font: 500 12px/1.2 var(--mono); letter-spacing: .06em; color: var(--fg-2); white-space: nowrap;
    }
    .bp-list li small { font: inherit; color: var(--fg-3); text-transform: lowercase; letter-spacing: .02em; }
    .bp-list li[aria-selected="true"] { background: var(--fg); color: var(--bg); }
    .bp-list li[aria-selected="true"] small { color: var(--bg); opacity: .7; }
    .bp-list li.current:not([aria-selected="true"]) { color: var(--fg); }
    .bp-list .none { cursor: default; color: var(--fg-3); }
    .bp-list li.group {
      cursor: default; padding: 12px 12px 6px; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--fg-3);
    }
    .bp-list li.group:first-child { padding-top: 7px; }
    .bp-list li.group:not(:first-child) { margin-top: 4px; border-top: 1px solid var(--rule); border-radius: 0; }
    /* on a phone the dropdown takes its own row under the brand and swatches */
    @media (max-width: 760px) {
      header { flex-wrap: wrap; row-gap: 12px; }
      .mark span { display: none; }
      .themes { margin-left: auto; }
      .tools { order: 4; }
      .bp-controls { order: 3; flex: 1 1 auto; min-width: 0; }
      .bp-model { flex: 1; }
      .bp-model input { width: 100%; padding: 10px 34px 10px 14px; font-size: 11px; }
    }
    /* phones: the picker opens as an opaque bottom sheet, its search box at the top */
    .bp-scrim { position: fixed; inset: 0; z-index: 30; background: rgba(0, 0, 0, .5); animation: bp-fade .2s ease; }
    .bp-sheet {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 31; display: flex; flex-direction: column; max-height: 82vh;
      background: var(--bg); color: var(--fg); border-top: 1px solid var(--rule); border-radius: 20px 20px 0 0;
      padding: 8px 16px calc(10px + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -12px 40px rgba(0, 0, 0, .35);
      animation: bp-up .28s cubic-bezier(.2, .8, .2, 1);
    }
    .bp-scrim[hidden], .bp-sheet[hidden] { display: none; }
    .bp-grip { flex: none; width: 40px; height: 4px; margin: 2px auto 12px; border-radius: 2px; background: var(--rule); }
    .bp-sheet-head { flex: none; display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .bp-sheet-head input {
      flex: 1; min-width: 0; font: 400 16px/1.2 var(--body); color: var(--fg); background: transparent;
      border: 1px solid var(--rule); border-radius: 999px; padding: 12px 16px; outline: none; -webkit-appearance: none; appearance: none;
    }
    .bp-sheet-head input::placeholder { color: var(--fg-3); }
    .bp-sheet-head input:focus { border-color: var(--fg); }
    .bp-x {
      flex: none; width: 42px; height: 42px; border-radius: 50%; border: 1px solid var(--rule); background: transparent;
      color: var(--fg); font: 400 22px/1 var(--body); cursor: pointer;
    }
    .bp-sheet .bp-list {
      position: static; flex: 1 1 auto; min-height: 0; max-height: none; padding: 0 0 4px; border: 0; border-radius: 0;
      background: transparent; -webkit-backdrop-filter: none; backdrop-filter: none;
    }
    .bp-sheet .bp-list li { padding: 14px 12px; font-size: 13px; }
    .bp-sheet .bp-list li.group { padding: 16px 12px 6px; font-size: 10px; }
    @keyframes bp-up { from { transform: translateY(100%); } }
    @keyframes bp-fade { from { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .bp-sheet, .bp-scrim { animation: none; } }`;

  // the model picker: a combobox you can type into to filter the models, then pick with a click,
  // the arrow keys and Enter. Esc or clicking away closes it and puts the current model's name back.
  // On a phone the header's box only opens a bottom sheet: an opaque panel with its own search box at the
  // top and the list under it. The keyboard comes up only when you tap that search box.
  function combobox(d, m) {
    const w = d.defaultView;
    const sheetMode = () => w.matchMedia("(max-width: 760px)").matches;
    const wrap = d.createElement("div");
    wrap.className = "bp-model";
    const input = d.createElement("input");
    const list = d.createElement("ul");
    list.className = "bp-list"; list.id = "bp-list"; list.hidden = true;
    list.setAttribute("role", "listbox"); list.setAttribute("aria-label", "Models");
    Object.entries({ type: "text", role: "combobox", "aria-label": "Model, type to search", "aria-autocomplete": "list",
      "aria-expanded": "false", "aria-controls": "bp-list", autocomplete: "off", spellcheck: "false", placeholder: "Search models" })
      .forEach(([k, v]) => input.setAttribute(k, v));
    input.value = m.label;
    wrap.append(input, list);
    // presses in the list (a tap's mousedown too) mustn't take focus from the input, which would close the list
    list.addEventListener("mousedown", e => e.preventDefault());
    // the bottom sheet: a scrim behind it, then a grip, the search box with a close button, and the list
    const scrim = d.createElement("div");
    scrim.className = "bp-scrim"; scrim.hidden = true;
    const sheet = d.createElement("div");
    sheet.className = "bp-sheet"; sheet.hidden = true;
    Object.entries({ role: "dialog", "aria-modal": "true", "aria-label": "Choose a model" }).forEach(([k, v]) => sheet.setAttribute(k, v));
    const search = d.createElement("input");
    Object.entries({ type: "search", role: "combobox", "aria-label": "Search models", "aria-autocomplete": "list", "aria-expanded": "true",
      "aria-controls": "bp-list", autocomplete: "off", spellcheck: "false", enterkeyhint: "go", placeholder: "Search models" })
      .forEach(([k, v]) => search.setAttribute(k, v));
    const closeBtn = d.createElement("button");
    closeBtn.type = "button"; closeBtn.className = "bp-x"; closeBtn.setAttribute("aria-label", "Close"); closeBtn.textContent = "×";
    const grip = d.createElement("div"), head = d.createElement("div");
    grip.className = "bp-grip"; head.className = "bp-sheet-head";
    head.append(search, closeBtn);
    sheet.append(grip, head);
    d.body.append(scrim, sheet);
    let inSheet = false;
    const field = () => inSheet ? search : input;
    let items = [], options = [], hi = -1;
    const norm = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    function render(q) {
      const words = norm(q).split(/\s+/).filter(Boolean);
      items = MODELS.filter(x => words.every(w => norm(x.label + " " + x.id + " " + (x.tags || "") + " " + (x.category || "")).includes(w)));
      list.textContent = "";
      // models come grouped by category (models/index.json lists them in order); each group gets a heading
      const opts = [];
      items.forEach((x, i) => {
        if (x.category && (i === 0 || items[i - 1].category !== x.category)) {
          const h = d.createElement("li");
          h.className = "group"; h.setAttribute("role", "presentation"); h.textContent = x.category;
          list.appendChild(h);
        }
        const li = d.createElement("li");
        li.id = "bp-opt-" + x.id; li.setAttribute("role", "option");
        li.classList.toggle("current", x.id === m.id);
        li.textContent = x.label;
        if (x.kind) { const k = d.createElement("small"); k.textContent = x.kind; li.appendChild(k); }
        // a mouse picks on press; a finger picks on a tap, so dragging scrolls the list instead of picking
        let viaMouse = false;
        li.addEventListener("pointerdown", e => { e.preventDefault(); viaMouse = e.pointerType === "mouse"; if (viaMouse) choose(i); });
        li.addEventListener("click", () => { if (!viaMouse) choose(i); });
        li.addEventListener("pointermove", e => { if (e.pointerType === "mouse") highlight(i); });
        list.appendChild(li); opts.push(li);
      });
      options = opts;
      if (!items.length) { const li = d.createElement("li"); li.className = "none"; li.textContent = "No matching model"; list.appendChild(li); }
      highlight(Math.max(0, items.findIndex(x => x.id === m.id)));
    }
    function highlight(i) {
      hi = items.length ? Math.max(0, Math.min(items.length - 1, i)) : -1;
      options.forEach((li, j) => li.setAttribute("aria-selected", String(j === hi)));
      if (hi >= 0) {
        field().setAttribute("aria-activedescendant", "bp-opt-" + items[hi].id);
        const head = options[hi].previousElementSibling;   // keep a group's heading in view with its first model
        (head && head.classList.contains("group") ? head : options[hi]).scrollIntoView({ block: "nearest" });
        options[hi].scrollIntoView({ block: "nearest" });
      }
      else field().removeAttribute("aria-activedescendant");
    }
    function open(q) {
      render(q);
      list.hidden = false; wrap.classList.add("open"); input.setAttribute("aria-expanded", "true");
    }
    // the sheet opens without focusing its search box, so no keyboard until that box is tapped
    function openSheet() {
      if (inSheet) return;
      inSheet = true;
      sheet.appendChild(list);
      search.value = "";
      scrim.hidden = sheet.hidden = false;
      open("");
      fit();
    }
    function close() {
      if (inSheet) {
        inSheet = false;
        search.blur();
        scrim.hidden = sheet.hidden = true;
        wrap.appendChild(list);
      }
      list.hidden = true; wrap.classList.remove("open"); input.setAttribute("aria-expanded", "false");
      input.value = m.label;
    }
    function choose(i) {
      const x = items[i];
      close();
      if (!x) return;
      input.value = x.label;
      input.blur();
      go(x.id);
    }
    // with the keyboard up, keep the sheet above it and inside what's left of the screen
    function fit() {
      const vv = w.visualViewport;
      if (!inSheet || !vv) return;
      sheet.style.bottom = Math.max(0, Math.round(w.innerHeight - vv.height - vv.offsetTop)) + "px";
      sheet.style.maxHeight = Math.round(vv.height * 0.86) + "px";
    }
    if (w.visualViewport) { w.visualViewport.addEventListener("resize", fit); w.visualViewport.addEventListener("scroll", fit); }
    // on a phone the header's box is only a button for the sheet: read-only, so tapping it brings up no keyboard
    function syncMode() {
      const s = sheetMode();
      input.readOnly = s;
      if (s) input.setAttribute("inputmode", "none"); else input.removeAttribute("inputmode");
      if (!s && inSheet) close();
    }
    syncMode();
    w.addEventListener("resize", () => { syncMode(); fit(); });
    input.addEventListener("focus", () => {
      if (sheetMode()) { input.blur(); openSheet(); return; }
      input.value = ""; open("");
    });
    input.addEventListener("click", () => { if (sheetMode()) openSheet(); });
    input.addEventListener("input", () => open(input.value));
    input.addEventListener("blur", () => { if (!inSheet) close(); });
    search.addEventListener("input", () => render(search.value));
    scrim.addEventListener("click", close);
    closeBtn.addEventListener("click", close);
    const keys = e => {
      e.stopPropagation();   // typing here never reaches the page's own shortcuts
      if (e.key === "ArrowDown") { e.preventDefault(); if (list.hidden) open(""); else highlight(hi + 1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); highlight(hi - 1); }
      else if (e.key === "Enter") { e.preventDefault(); choose(hi); }
      else if (e.key === "Escape") { e.preventDefault(); close(); input.blur(); }
    };
    input.addEventListener("keydown", keys);
    search.addEventListener("keydown", keys);
    sheet.addEventListener("keydown", e => { if (e.key === "Escape") { e.stopPropagation(); close(); } });
    return wrap;
  }

  document.head.appendChild(Object.assign(document.createElement("style"), { textContent: CSS }));
  const d = document, themes = d.querySelector(".themes"), header = d.querySelector("header");
  // back to the grid of every model
  if (header && canGoHome) {
    const back = d.createElement("button");
    back.type = "button"; back.className = "bp-home"; back.setAttribute("aria-label", "All models");
    back.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 1h4v4H1zM7 1h4v4H7zM1 7h4v4H1zM7 7h4v4H7z" fill="currentColor"/></svg><span>All models</span>';
    back.addEventListener("click", goHome);
    header.insertBefore(back, header.firstChild);
    const mark = d.querySelector(".mark");
    if (mark) mark.addEventListener("click", e => { e.preventDefault(); back.click(); });
  }
  if (themes) {
    const wrap = combobox(d, me);
    // render style: the white line drawing or shaded, realistic materials
    const seg = d.createElement("div");
    seg.className = "bp-style"; seg.setAttribute("role", "group"); seg.setAttribute("aria-label", "Render style");
    const btns = [["blueprint", "Lines"], ["realistic", "Shaded"], ["photo", "Photo"]].map(([s, t]) => {
      const b = d.createElement("button");
      b.type = "button"; b.dataset.s = s; b.textContent = t;
      b.addEventListener("click", () => { style = s; store.set("blueprints-style", s); sync(); });
      seg.appendChild(b);
      return b;
    });
    const sync = () => {
      btns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.s === style)));
      if (window.__bpSetStyle) window.__bpSetStyle(style);
    };
    sync();
    const box = d.createElement("div");
    box.className = "bp-controls";
    box.append(wrap, seg);
    const before = d.querySelector(".tools") || themes;
    before.parentNode.insertBefore(box, before);
    // keep the theme (and whether it's inverted) the same from model to model: the page has just saved it
    d.querySelectorAll(".swatch").forEach(b => b.addEventListener("click", carryTheme));
  }
})();
