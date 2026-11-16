// PlayStation 5 (launch disc edition, CFI-1000) with a DualSense: the model script for the blueprint engine
// (src/engine.js), which build_pages.py inlines after it. The console stands on its base; the white side panels,
// black core, board, heatsink, power supply, drive and fan slide apart sideways and the controller opens up in
// front. "." follows a game from the SSD to the screen and into your hands. The chips are drawn on the
// camera's side of the board for clarity.
(function () {
  "use strict";
  const G = window.PS5_GEOMETRY;

  const COPY = {
    "SIDE PANELS": ["Side panels", "Removable white covers"],
    "BLACK CORE": ["Black core", "Gloss black, light bar at the seams"],
    "STAND": ["Stand", "For vertical or horizontal use"],
    "ULTRA HD BLU-RAY DRIVE": ["Ultra HD Blu-ray drive", "4K UHD Blu-ray, 100 GB discs"],
    "APU": ["APU", "8-core Zen 2 CPU, up to 3.5 GHz"],
    "RDNA 2 GPU": ["RDNA 2 GPU", "10.28 TFLOPS, 36 CUs, up to 2.23 GHz"],
    "GDDR6 MEMORY": ["GDDR6 memory", "16 GB, 448 GB/s"],
    "SSD": ["SSD", "825 GB custom, 5.5 GB/s raw"],
    "M.2 EXPANSION SLOT": ["M.2 expansion slot", "PCIe 4.0 NVMe SSD upgrade"],
    "HEATSINK": ["Heatsink", "Heat pipes, liquid-metal TIM"],
    "FAN": ["Fan", "120 mm, double-sided intake"],
    "POWER SUPPLY": ["Power supply", "350 W, internal"],
    "FRONT PORTS": ["Front ports", "USB-A + USB-C"],
    "REAR PORTS": ["Rear ports", "HDMI 2.1, Ethernet, 2x USB-A"],
    "DUALSENSE": ["DualSense", "Wireless, built-in mic + speaker"],
    "TOUCHPAD": ["Touchpad", "Clickable, light strip around it"],
    "ADAPTIVE TRIGGERS": ["Adaptive triggers", "Motor-driven resistance, L2 / R2"],
    "ANALOG STICKS": ["Analog sticks", "L3 / R3 click"],
    "HAPTIC ACTUATORS": ["Haptic actuators", "Voice-coil haptic feedback"],
    "BATTERY": ["Battery", "1,560 mAh Li-ion"],
  };

  const DETAIL = {
    "Left Side Panel": ["Left side panel", "A white cover that clips on and lifts off by hand, for cleaning the dust catchers and reaching the M.2 slot."],
    "Right Side Panel": ["Right side panel", "The matching white cover on the drive side, with the bulge over the disc drive."],
    "Black Core Shell": ["Black core", "The glossy black middle of the console, carrying the disc slot, the front ports and buttons, and the vents."],
    "Console Light Bar": ["Light bar", "Blue light along the seams between the core and the side panels: pulsing while starting, steady when on."],
    "Stand": ["Stand", "A round base that screws in when the console stands up and clips on when it lies flat."],
    "Blu-ray Drive": ["Ultra HD Blu-ray drive", "Reads 4K UHD Blu-ray movies and game discs of up to 100 GB."],
    "Mainboard": ["Mainboard", "Carries the APU, 16 GB of GDDR6, the soldered SSD and its controller, and the expansion slot."],
    "APU": ["APU", "One custom AMD chip: eight Zen 2 CPU cores at up to 3.5 GHz and an RDNA 2 GPU with hardware ray tracing."],
    "GDDR6 Memory": ["GDDR6 memory", "16 GB of graphics memory shared by the CPU and GPU, at 448 GB a second."],
    "SSD": ["SSD", "825 GB of flash soldered to the board, with a custom controller that streams game data at 5.5 GB a second."],
    "M.2 Expansion Slot": ["M.2 expansion slot", "A slot for adding a PCIe 4.0 NVMe SSD to hold more games."],
    "Board Components": ["Board components", "Power regulation, the I/O controller and the small parts around them."],
    "Rear Ports": ["Rear ports", "HDMI 2.1 for 4K at 120 Hz, Ethernet, two USB-A ports and the power inlet."],
    "Front Ports": ["Front ports", "A USB-A and a USB-C port on the front of the core."],
    "Power + Eject Buttons": ["Power and Eject", "Two small buttons on the front edge of the core."],
    "Heatsink": ["Heatsink", "A large cooler with heat pipes. Liquid metal between the APU and the heatsink moves the heat out of the chip."],
    "Fan": ["Fan", "A 120 mm fan that pulls air in from both sides and pushes it out of the back."],
    "Power Supply": ["Power supply", "A 350 W internal supply fed by a figure-8 mains cable."],
    "Controller Top Shell": ["DualSense top shell", "The white upper half of the controller."],
    "Controller Bottom Shell": ["DualSense bottom shell", "The black lower half, with a textured grip made of tiny PlayStation symbols."],
    "Touchpad": ["Touchpad", "A larger clickable touch surface than the DualShock 4's."],
    "Light Strip": ["Light strip", "The light runs around the touchpad now, instead of a light bar on the back edge."],
    "D-Pad": ["D-pad", "Four directional buttons under one cross."],
    "Face Buttons": ["Face buttons", "Triangle, circle, cross and square."],
    "Create + Options + PS + Mute": ["Create, Options, PS and Mute", "Create captures and shares play; Mute turns the built-in microphones off."],
    "Adaptive Triggers + Bumpers": ["Adaptive triggers", "L2 and R2 have small motors that push back, so a game can make a bowstring tense or a trigger jam."],
    "Analog Sticks": ["Analog sticks", "Two thumbsticks. Press one in for L3 or R3."],
    "Controller PCB": ["Controller board", "Reads the buttons, sticks, touchpad and motion sensors and drives the triggers and haptics."],
    "Speaker + Mics": ["Speaker and microphones", "A built-in speaker and a microphone array, so you can chat without a headset."],
    "Battery": ["Battery", "A 1,560 mAh lithium-ion cell, charged over USB-C."],
    "Haptic Actuators": ["Haptic actuators", "Voice-coil motors in each grip, like tiny speakers. They can make raindrops, sand or a heartbeat you can feel."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "ps5-theme",
    touchHint: "Tap the console to take it apart",
    view: { az: 45, el: 25 },
    materials: [
      [/Side Panel/, ["plastic", { color: 0xf2f3f5, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.3 }]],
      [/Black Core Shell|Power \+ Eject/, "gloss"],
      [/Console Light Bar/, ["plastic", { color: 0x3d7bff, roughness: 0.3, emissive: 0x2f6bff, emissiveIntensity: 1.6, opacity: 0.85 }]],
      [/Light Strip/, ["plastic", { color: 0x4c8dff, roughness: 0.3, emissive: 0x3a7bff, emissiveIntensity: 1.4, opacity: 0.85 }]],
      [/^Stand$/, ["plastic", { color: 0xe9ebee, roughness: 0.4 }]],
      [/Controller Top Shell|Touchpad/, ["plastic", { color: 0xf4f5f7, roughness: 0.42 }]],
      [/Controller Bottom Shell|Adaptive Triggers/, ["plastic", { color: 0x16171a, roughness: 0.5 }]],
      [/D-Pad|Face Buttons|Create/, ["plastic", { color: 0x1e1f23, roughness: 0.3 }]],
      [/Analog Sticks/, ["rubber", { color: 0x1b1c1f }]],
      [/Blu-ray Drive|Rear Ports|Front Ports|Haptic|Speaker/, "steel"],
      [/Heatsink/, "copper"],
      [/^Fan$|M\.2/, ["plastic", { color: 0x1c1d20 }]],
      [/Power Supply/, ["plastic", { color: 0x2a2c30, roughness: 0.5 }]],
      [/Mainboard|Controller PCB/, "pcb"],
      [/APU/, "silicon"],
      [/Memory|SSD|Board Components|Battery/, "chip"],
    ],
    hotspots: G.hotspots.map(h => {
      const c = COPY[h.t] || [h.t, h.s];
      return { t: c[0], s: c[1], p: h.p, o: h.o };
    }),
    detail: DETAIL,

    tour: {
      points: { ssd: "SSD", apu: "APU", mem: "GDDR6 Memory", sink: "Heatsink", fan: "Fan", rear: "Rear Ports",
        pad: "Controller PCB", trig: "Adaptive Triggers + Bumpers", hap: "Haptic Actuators", disc: "Blu-ray Drive" },
      steps: [
        { t: "The SSD streams the game", focus: "ssd", dist: 0.9, ex: 1, p: ["ssd", "apu"], n: ["SSD", "Mainboard"], ms: 4000,
          d: "Game data comes off the soldered SSD at 5.5 GB a second, fast enough that levels load in a second or two." },
        { t: "The APU runs it", focus: "apu", dist: 0.8, ex: 1, p: ["ssd", "mem", "apu"], n: ["APU", "GDDR6 Memory"], ms: 4000,
          d: "Eight Zen 2 cores run the game, with 16 GB of GDDR6 right beside the chip." },
        { t: "The GPU draws the frame", focus: "apu", dist: 0.6, ex: 1, p: ["apu", "mem", "apu"], n: ["APU", "GDDR6 Memory"], ms: 4000,
          d: "The RDNA 2 GPU renders the frame, with ray-traced reflections and lighting, up to 120 times a second." },
        { t: "Heat leaves through the fan", focus: "fan", dist: 1.0, ex: 1, p: ["apu", "sink", "fan"], n: ["Heatsink", "Fan"], ms: 3800,
          d: "Liquid metal moves heat into the heatsink, and the big fan pulls air through it and out the back." },
        { t: "Out through HDMI 2.1", focus: "rear", dist: 1.0, ex: 1, p: ["apu", "rear"], n: ["Rear Ports"], ms: 3600,
          d: "The picture goes to the TV over HDMI 2.1, at up to 4K and 120 Hz." },
        { t: "The triggers push back", focus: "trig", dist: 1.0, ex: 1, p: ["apu", "pad", "trig"], n: ["Adaptive Triggers + Bumpers", "Controller PCB"], ms: 4000,
          d: "The game tells the controller how stiff L2 and R2 should be, and their motors resist your finger." },
        { t: "And you feel the world", focus: "hap", dist: 1.0, ex: 1, p: ["pad", "hap"], n: ["Haptic Actuators", "Controller PCB"], ms: 3800,
          d: "Voice-coil actuators in the grips play textures and impacts you can feel, far finer than a rumble motor." },
        { t: "Closed up, standing tall", focus: "disc", dist: 1.4, ex: 0, p: [], n: null, ms: 3800,
          d: "Side panels, core, board, cooler and drive come together on the round stand." },
      ],
    },
  };
})();
