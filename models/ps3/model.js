// PlayStation 3 (launch "fat" model, CECHA) with a DualShock 3: the model script for the blueprint engine
// (src/engine.js), which build_pages.py inlines after it. The shell, drive, cooler, board and power supply lift
// apart; the hard drive slides out of its side bay and the controller opens up beside it. "." follows a game
// from the Blu-ray to the screen. Parts face the camera for clarity: on the real console the board is flipped,
// with the cooler underneath.
(function () {
  "use strict";
  const G = window.PS3_GEOMETRY;

  // ---------- hotspot copy (the blueprint's callouts, in plain words) ----------
  const COPY = {
    "TOP SHELL": ["Top shell", "Piano black, touch Power and Eject"],
    "FRONT BEZEL": ["Front bezel", "Silver trim, card reader flap"],
    "BLU-RAY DRIVE": ["Blu-ray drive", "Slot loading, BD 2x / DVD 8x / CD 24x"],
    "HEATSINK + FAN": ["Heatsink + fan", "Heat pipes, fin stack, blower fan"],
    "WI-FI + BLUETOOTH": ["Wi-Fi + Bluetooth", "802.11b/g + Bluetooth 2.0"],
    "CELL PROCESSOR": ["Cell processor", "Cell Broadband Engine, 3.2 GHz"],
    "RSX GPU": ["RSX GPU", "The 'Reality Synthesizer'"],
    "XDR + GDDR3 MEMORY": ["XDR + GDDR3 memory", "256 MB XDR + 256 MB GDDR3"],
    "MAINBOARD": ["Mainboard", "PS2 Emotion Engine + GS on board"],
    "REAR PORTS": ["Rear ports", "HDMI, Ethernet, AV multi out, optical"],
    "POWER SUPPLY": ["Power supply", "Internal, rear inlet + main switch"],
    "HARD DRIVE": ["Hard drive", "2.5\" SATA, 60 GB on the launch model"],
    "FRONT PORTS": ["Front ports", "4x USB 2.0 + memory card reader"],
    "DUALSHOCK 3": ["DualShock 3", "Wireless, Bluetooth + vibration"],
    "ANALOG STICKS": ["Analog sticks", "Two thumbsticks, L3 / R3 click"],
    "FACE BUTTONS": ["Face buttons", "Pressure-sensitive"],
    "PS BUTTON": ["PS button", "Opens the XMB, with Select + Start"],
    "SIXAXIS SENSOR": ["Sixaxis sensor", "Tilt and motion sensing"],
    "RUMBLE MOTORS": ["Rumble motors", "Two vibration motors"],
    "BATTERY": ["Battery", "Li-ion, charged over USB"],
  };

  // ---------- part notes, shown when you click a part ----------
  const DETAIL = {
    "Top Shell": ["Top shell", "The curved piano-black cover, with the disc slot and the touch-sensitive Power and Eject strips on its front face."],
    "Front Bezel": ["Front bezel", "The silver band along the bottom of the front, with four USB ports and the flap over the memory card reader."],
    "Bottom Shell": ["Bottom shell", "The matte lower case. Everything inside mounts to it, and its vents feed the big cooling fan."],
    "Blu-ray Drive": ["Blu-ray drive", "A slot-loading drive that reads Blu-ray at 2x, DVD at 8x and CDs at 24x. Games ship on 25 or 50 GB discs."],
    "Mainboard": ["Mainboard", "The main board, carrying the Cell, the RSX, their memory and, on launch models, the PS2's own chips for playing PS2 discs."],
    "Cell Processor": ["Cell processor", "One general-purpose PowerPC core and seven working SPEs, small vector processors that crunch physics, audio and video in parallel at 3.2 GHz."],
    "RSX GPU": ["RSX GPU", "The 'Reality Synthesizer', an NVIDIA-designed graphics chip that draws every frame from the Cell's scene data."],
    "XDR + GDDR3 Memory": ["XDR and GDDR3 memory", "256 MB of fast XDR memory for the Cell and 256 MB of GDDR3 video memory for the RSX."],
    "Board Components": ["Board components", "Power regulation, the south bridge for USB and storage, and on launch models the Emotion Engine and Graphics Synthesizer from the PS2."],
    "Rear Ports": ["Rear ports", "HDMI, Ethernet, the AV multi out, optical audio, and the power inlet with its main switch."],
    "Heatsink + Fan": ["Heatsink and fan", "Heat pipes carry heat from the Cell and the RSX into fin stacks, and a large blower fan pulls air through and out the back."],
    "Wi-Fi + Bluetooth Board": ["Wi-Fi and Bluetooth", "A small radio board: 802.11b/g Wi-Fi for the network and Bluetooth 2.0 for up to seven wireless controllers."],
    "Power Supply": ["Power supply", "An internal supply that turns mains AC into the 12 V the console runs on. It's one of the biggest parts inside."],
    "Hard Drive": ["Hard drive", "A standard 2.5-inch laptop SATA drive in a side bay, 60 GB on the launch model. You can swap it for a bigger one."],
    "Front Ports": ["Front ports", "Four USB 2.0 ports for charging controllers and plugging in accessories."],
    "Card Reader": ["Card reader", "Reads Memory Stick, SD and CompactFlash cards on the launch models, for photos, music and video."],
    "Controller Top Shell": ["DualShock 3 top shell", "The upper half of the controller, the same shape as the PlayStation's original DualShock."],
    "Controller Bottom Shell": ["DualShock 3 bottom shell", "The lower half, with the grips that hold the rumble motors."],
    "D-Pad": ["D-pad", "Four directional buttons under one cross. Each one is pressure-sensitive."],
    "Face Buttons": ["Face buttons", "Triangle, circle, cross and square. They sense how hard you press, not just whether you do."],
    "Start + Select + PS Button": ["Start, Select and PS", "Start and Select sit in the middle; the PS button below them turns the console on and opens the XMB menu."],
    "Shoulder Buttons": ["Shoulder buttons", "L1, L2, R1 and R2. L2 and R2 are analog, for throttle and brake."],
    "Analog Sticks": ["Analog sticks", "Two thumbsticks that measure how far they're pushed. Press one in for L3 or R3."],
    "Controller PCB": ["Controller board", "Reads every button and stick, runs the Bluetooth radio, and carries the Sixaxis motion sensor."],
    "USB Port": ["USB port", "A mini-USB port for charging and for pairing the controller with the console."],
    "Battery": ["Battery", "A small rechargeable lithium-ion cell that charges whenever the controller is plugged in."],
    "Rumble Motors": ["Rumble motors", "Two motors with off-centre weights in the grips make the controller shake."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "ps3-theme",
    touchHint: "Tap the console to take it apart",
    view: { az: 45, el: 25 },
    // Photo style: piano-black top, silver trim, matte black base, glossy black controller
    materials: [
      [/^Top Shell$/, "gloss"],
      [/Front Bezel/, ["alu", { color: 0xc8ccd2, roughness: 0.25 }]],
      [/^Bottom Shell$/, ["plastic", { color: 0x141416, roughness: 0.55 }]],
      [/Controller (Top|Bottom) Shell/, ["gloss", { color: 0x0d0d10, roughness: 0.18, clearcoat: 0.6 }]],
      [/D-Pad|Face Buttons|Start|Shoulder|Card Reader/, ["plastic", { color: 0x16161a, roughness: 0.4 }]],
      [/Analog Sticks/, ["rubber", { color: 0x151518 }]],
      [/Blu-ray Drive|Power Supply|Hard Drive|Rear Ports|Front Ports|USB Port|Rumble Motors/, "steel"],
      [/Heatsink/, "copper"],
      [/Mainboard|Controller PCB|Wi-Fi/, "pcb"],
      [/Cell|RSX/, "nickel"],
      [/Memory|Board Components|Battery/, "chip"],
    ],
    hotspots: G.hotspots.map(h => {
      const c = COPY[h.t] || [h.t, h.s];
      return { t: c[0], s: c[1], p: h.p, o: h.o };
    }),
    detail: DETAIL,

    // "how it works": a game from the disc to the screen
    tour: {
      points: { disc: "Blu-ray Drive", cell: "Cell Processor", rsx: "RSX GPU", mem: "XDR + GDDR3 Memory", fan: "Heatsink + Fan",
        rear: "Rear Ports", hdd: "Hard Drive", pad: "Controller PCB", wifi: "Wi-Fi + Bluetooth Board", rumble: "Rumble Motors" },
      steps: [
        { t: "The disc spins up", focus: "disc", dist: 1.0, ex: 1, p: ["disc"], n: ["Blu-ray Drive"], ms: 3800,
          d: "A blue-violet laser reads the Blu-ray, with room for 25 or 50 GB of game on a single disc." },
        { t: "Some of it goes to the hard drive", focus: "hdd", dist: 1.0, ex: 1, p: ["disc", "hdd"], n: ["Hard Drive", "Blu-ray Drive"], ms: 3800,
          d: "Many games copy data to the hard drive the first time, so later loads come off the faster disk." },
        { t: "The Cell runs the game", focus: "cell", dist: 0.8, ex: 1, p: ["hdd", "mem", "cell"], n: ["Cell Processor", "XDR + GDDR3 Memory"], ms: 4000,
          d: "The main core runs the game while seven SPEs work through physics, animation and sound in parallel." },
        { t: "The RSX draws the frame", focus: "rsx", dist: 0.8, ex: 1, p: ["cell", "rsx", "mem"], n: ["RSX GPU", "XDR + GDDR3 Memory"], ms: 4000,
          d: "The Cell streams the scene to the RSX, which draws it with textures and lighting into its own video memory." },
        { t: "The fan keeps it cool", focus: "fan", dist: 1.0, ex: 1, p: ["cell", "fan"], n: ["Heatsink + Fan"], ms: 3800,
          d: "Heat pipes pull heat off both chips into the fins, and the blower fan pushes it out of the back." },
        { t: "Out through HDMI", focus: "rear", dist: 1.0, ex: 1, p: ["rsx", "rear"], n: ["Rear Ports", "RSX GPU"], ms: 3800,
          d: "Picture and sound go to the TV over HDMI, at up to 1080p." },
        { t: "Your controller answers wirelessly", focus: "pad", dist: 1.1, ex: 1, p: ["pad", "wifi", "cell"], n: ["Controller PCB", "Wi-Fi + Bluetooth Board"], ms: 4000,
          d: "The DualShock 3 sends every press, stick and tilt over Bluetooth to the radio board, which hands it to the game." },
        { t: "And it rumbles back", focus: "rumble", dist: 1.0, ex: 1, p: ["cell", "wifi", "rumble"], n: ["Rumble Motors"], ms: 3800,
          d: "The game sends a rumble command back over Bluetooth, and the motors in the grips spin up." },
        { t: "Closed up, piano black", focus: "disc", dist: 1.4, ex: 0, p: [], n: null, ms: 3800,
          d: "Shell, drive, cooler, board and power supply stack into one curved black body." },
      ],
    },
  };
})();
