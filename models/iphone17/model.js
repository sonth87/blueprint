// iPhone 17: the model script for the blueprint engine (src/engine.js), which build_pages.py inlines after it.
// The phone lies screen up; its layers lift apart from the back glass to the cover glass. "." follows a tap
// from the glass to the chip and back out as a haptic tap. The internal layout is a concept.
(function () {
  "use strict";
  const G = window.IP17_GEOMETRY;

  // ---------- hotspot copy (the blueprint's callouts, in plain words) ----------
  const COPY = {
    "COVER GLASS": ["Cover glass", "Ceramic Shield front"],
    "OLED DISPLAY": ["6.3-inch OLED display", "Up to 120 Hz, always-on"],
    "FRONT CAMERA + FACE ID": ["Front camera + Face ID", "TrueDepth, in the Dynamic Island"],
    "A19 CHIP": ["A19 chip", "CPU, GPU and Neural Engine"],
    "MEMORY + STORAGE": ["Memory + storage", "Stacked beside the chip"],
    "LOGIC BOARD": ["Logic board", "Everything else that makes it a phone"],
    "REAR CAMERAS": ["Dual rear cameras", "Fusion main + ultra wide"],
    "BATTERY": ["Battery", "Lithium-ion, fills most of the body"],
    "TAPTIC ENGINE": ["Taptic Engine", "The clicks and taps you feel"],
    "SPEAKERS": ["Stereo speakers", "Bottom speaker + earpiece"],
    "USB-C PORT": ["USB-C port", "Charging and data"],
    "SIDE BUTTONS": ["Buttons", "Side, Action and volume"],
    "CAMERA CONTROL": ["Camera Control", "Press and slide to shoot"],
    "ALUMINIUM FRAME": ["Aluminium frame", "Antenna bands and port cut-outs"],
    "DISPLAY FRAME": ["Midframe", "The chassis plate everything mounts to"],
    "MAGSAFE COIL": ["MagSafe coil", "Wireless charging, magnets ring"],
    "CAMERA PLATEAU": ["Camera plateau", "Lens rings, flash and mic"],
    "BACK GLASS": ["Back glass", "Colour-infused glass"],
  };

  // ---------- part notes, shown when you click a part ----------
  const DETAIL = {
    "Cover Glass": ["Cover glass", "A tough ceramic-infused glass front with a touch-sensitive layer bonded underneath, so it senses your finger right through the glass."],
    "OLED Display": ["OLED display", "6.3 inches of self-lit pixels. Each one makes its own light, so blacks are black, and the refresh rate drops right down when nothing moves to save power."],
    "Front Camera + Face ID": ["Front camera + Face ID", "The selfie camera and the TrueDepth system sit in the Dynamic Island: a dot projector, infrared camera and flood illuminator map your face to unlock the phone."],
    "Display Frame": ["Midframe", "The structural plate in the middle of the phone. The display sits on top of it, and the board, battery and cameras mount to it."],
    "Aluminium Frame": ["Aluminium frame", "The band around the edge. Its plastic-filled breaks split it into antenna sections, and it carries the buttons and the USB-C port."],
    "Action + Volume Buttons": ["Action and volume buttons", "The Action button does what you set it to: silent mode, camera, a shortcut. Below it are the volume buttons."],
    "Side Button + Camera Control": ["Side button + Camera Control", "The side button wakes and locks the phone. Below it, Camera Control opens the camera with a press and adjusts zoom or exposure with a slide."],
    "USB-C Port": ["USB-C port", "Charges the phone and connects it to a computer or accessories."],
    "Speakers": ["Speakers", "A bottom-firing speaker and the earpiece above the screen play in stereo when you turn the phone sideways."],
    "Taptic Engine": ["Taptic Engine", "A small linear motor that moves a weight back and forth, so the phone can tap, buzz and click with precise, short pulses."],
    "Battery": ["Battery", "The single biggest part inside. A lithium-ion cell shaped to fill the space around the board."],
    "Logic Board": ["Logic board", "A compact board that carries the chip, memory, storage and the radios. It sits beside the battery near the cameras."],
    "A19 Chip": ["A19 chip", "The processor: CPU cores, graphics and a Neural Engine for on-device AI, all on one chip."],
    "Memory + Storage": ["Memory and storage", "Working memory for the apps that are open, and flash storage for photos, apps and everything you keep on the phone."],
    "Board Components": ["Board components", "Power management, wireless chips for Wi-Fi, Bluetooth and cellular, and the small parts that keep them fed."],
    "Rear Cameras": ["Rear cameras", "Two camera modules: the main Fusion camera and an ultra wide. Each has its own lens stack and sensor, stabilised in the main camera."],
    "Camera Plateau": ["Camera plateau", "The raised island on the back glass that holds the lens covers, flash and microphone."],
    "Flash + Mic": ["Flash and microphone", "The True Tone flash and a microphone sit on the camera plateau between the lenses."],
    "MagSafe Coil": ["MagSafe coil", "A charging coil ringed with magnets. Chargers and accessories snap into place on the back and charge wirelessly."],
    "Back Glass": ["Back glass", "The colour is infused into the glass itself, with a soft matte finish."],
  };

  window.BLUEPRINT_MODEL = {
    screenPart: "OLED Display",   // your photo or video goes on this part's screen
    screenGlass: ["Cover Glass"],
    geometry: G,
    themeKey: "ip17-theme",
    touchHint: "Tap the phone to take it apart",
    view: { az: 45, el: 30, near: 1, far: 5000 },
    // Photo style: the lavender finish, with matte back glass and an aluminium frame
    materials: [
      [/Cover Glass/, "clearGlass"],
      [/OLED Display/, "glass"],
      [/Aluminium Frame|Buttons|Camera Control/, ["alu", { color: 0xbcaed0, roughness: 0.3 }]],
      [/Back Glass|Camera Plateau/, ["glass", { color: 0xcabfdb, metalness: 0, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.4 }]],
      [/Rear Cameras|Front Camera/, ["glass", { color: 0x15171c, roughness: 0.08 }]],
      [/Display Frame|USB-C|Taptic/, "steel"],
      [/MagSafe/, "copper"],
      [/Logic Board/, "pcb"],
      [/A19|Memory|Board Components/, "chip"],
      [/Speakers|Flash/, "plastic"],
    ],
    silhouetteMinArea: 0.002,
    occluders: ["Cover Glass", "OLED Display", "Display Frame", "Battery", "Logic Board", "Back Glass"],
    hotspots: G.hotspots.map(h => {
      const c = COPY[h.t] || [h.t, h.s];
      return { t: c[0], s: c[1], p: h.p, o: h.o };
    }),
    detail: DETAIL,

    // "how it works": a tap on the glass, through the chip, and back to your finger as a tap you feel
    tour: {
      points: {
        glass: "Cover Glass",
        oled: "OLED Display",
        chip: "A19 Chip",
        mem: "Memory + Storage",
        board: "Logic Board",
        battery: "Battery",
        taptic: "Taptic Engine",
        coil: "MagSafe Coil",
        speaker: "Speakers",
      },
      steps: [
        { t: "You tap the glass", focus: "glass", dist: 1.3, ex: 1, p: ["glass", "oled"], n: ["Cover Glass", "OLED Display"], ms: 4000,
          d: "A grid of transparent electrodes under the glass feels the tiny change in charge your finger makes, and works out exactly where you touched." },
        { t: "The touch reaches the chip", focus: "chip", dist: 0.9, ex: 1, p: ["oled", "board", "chip"], n: ["OLED Display", "Logic Board", "A19 Chip"], ms: 4000,
          d: "A thin flexible cable carries the touch position down to the logic board, where the A19 chip hands it to the app under your finger." },
        { t: "The app does its work", focus: "chip", dist: 0.6, ex: 1, p: ["chip", "mem", "chip"], n: ["A19 Chip", "Memory + Storage"], ms: 4000,
          d: "The CPU runs the app's code, pulling what it needs from memory and storage right beside it, and the GPU draws the next frame." },
        { t: "The screen updates", focus: "oled", dist: 1.2, ex: 1, p: ["chip", "board", "oled"], n: ["OLED Display", "A19 Chip"], ms: 4000,
          d: "The new frame goes back up the cable to the display, which lights the pixels that changed, up to 120 times a second." },
        { t: "And you feel it click", focus: "taptic", dist: 0.9, ex: 1, p: ["chip", "taptic"], n: ["Taptic Engine", "A19 Chip"], ms: 3800,
          d: "For a button press or a toggle, the chip pulses the Taptic Engine. Its weight moves for a few milliseconds, and the glass feels like it clicked." },
        { t: "All of it runs on the battery", focus: "battery", dist: 1.1, ex: 1, p: ["coil", "battery", "board"], n: ["Battery", "MagSafe Coil", "USB-C Port"], ms: 4000,
          d: "The battery powers every step. It charges through USB-C or wirelessly through the MagSafe coil in the back." },
        { t: "Closed up, 7.95 mm thin", focus: "glass", dist: 1.4, ex: 0, p: [], n: null, ms: 3800,
          d: "Back glass, midframe, battery, board, display and cover glass stack into one sealed body less than 8 mm thick." },
      ],
    },
  };
})();
