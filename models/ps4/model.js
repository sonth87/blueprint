// PlayStation 4 (launch model, CUH-1000) with a DualShock 4: the model script for the blueprint engine
// (src/engine.js), which build_pages.py inlines after it. The two top covers and the light bar lift off,
// the drive, fan and heatsink rise, the power supply pulls forward and the controller opens up beside it.
// "." follows a game from the disc to the screen. Some internal positions are approximate.
(function () {
  "use strict";
  const G = window.PS4_GEOMETRY;

  const COPY = {
    "GLOSSY TOP COVER": ["Glossy top cover", "Slides off for the hard drive bay"],
    "MATTE TOP COVER": ["Matte top cover", "Textured black plastic"],
    "LIGHT BAR": ["Light bar", "Blue at boot, white on, orange at rest"],
    "BLU-RAY DRIVE": ["Blu-ray drive", "Slot-loading, 6x BD / 8x DVD"],
    "HARD DRIVE": ["Hard drive", "500 GB 2.5\" HDD, user-replaceable"],
    "APU": ["APU", "8-core AMD Jaguar + Radeon GPU"],
    "GDDR5 MEMORY": ["GDDR5 memory", "8 GB unified, 176 GB/s"],
    "HEATSINK": ["Heatsink", "Heat pipes into a fin stack"],
    "BLOWER FAN": ["Blower fan", "Centrifugal, exhaust at the rear"],
    "POWER SUPPLY": ["Power supply", "Internal, figure-8 AC inlet"],
    "WI-FI + BLUETOOTH": ["Wi-Fi + Bluetooth", "802.11 b/g/n, Bluetooth 2.1"],
    "FRONT PORTS": ["Front ports", "2x USB 3.0"],
    "REAR PORTS": ["Rear ports", "HDMI, Ethernet, optical, AUX"],
    "DUALSHOCK 4": ["DualShock 4", "Wireless, over Bluetooth"],
    "TOUCHPAD": ["Touchpad", "Two-point capacitive, clickable"],
    "CONTROLLER LIGHT BAR": ["Controller light bar", "RGB, tracked by PlayStation Camera"],
    "SHARE / OPTIONS / PS": ["Share, Options, PS", "Share captures and streams play"],
    "ANALOG STICKS": ["Analog sticks", "Two thumbsticks, L3 / R3 click"],
    "BATTERY": ["Battery", "3.7 V Li-ion, 1000 mAh"],
    "SPEAKER + HEADSET JACK": ["Speaker + headset jack", "Mono speaker, 3.5 mm stereo jack"],
  };

  const DETAIL = {
    "Glossy Top Cover": ["Glossy top cover", "The shiny third of the top. It slides off to reach the hard drive bay underneath."],
    "Matte Top Cover": ["Matte top cover", "The larger textured part of the top, split from the glossy part by the groove that holds the light bar."],
    "Light Bar": ["Light bar", "A light strip in the groove across the top: blue while starting, white when on, orange in rest mode."],
    "Power + Eject Buttons": ["Power and Eject", "Two thin touch-style buttons in the front groove."],
    "Bottom Shell": ["Bottom shell", "The lower case and chassis, with the slanted front and back that give the console its parallelogram profile."],
    "Blu-ray Drive": ["Blu-ray drive", "A slot-loading drive, 6x for Blu-ray and 8x for DVD. Games also install to the hard drive."],
    "Hard Drive": ["Hard drive", "A 500 GB laptop-size drive in a caddy under the glossy cover. You can swap in a bigger one with one screw."],
    "Mainboard": ["Mainboard", "Carries the APU, eight GB of GDDR5 and everything that connects them to the ports."],
    "APU": ["APU", "One chip with eight AMD Jaguar CPU cores and a Radeon GPU of 1.84 TFLOPS, sharing the same memory."],
    "GDDR5 Memory": ["GDDR5 memory", "8 GB of fast graphics memory shared by the CPU and GPU, at 176 GB a second."],
    "Wi-Fi + Bluetooth": ["Wi-Fi and Bluetooth", "The radios for the network and for up to four wireless controllers."],
    "Board Components": ["Board components", "Power regulation, a secondary low-power processor for downloads in rest mode, and the small parts around them."],
    "Heatsink": ["Heatsink", "Heat pipes carry heat from the APU into a stack of thin fins."],
    "Blower Fan": ["Blower fan", "A centrifugal fan that pulls air through the heatsink and out of the back."],
    "Power Supply": ["Power supply", "An internal supply fed by a simple figure-8 mains cable, so there's no power brick."],
    "Front Ports": ["Front ports", "Two USB 3.0 ports in the front groove, for charging controllers and storage."],
    "Rear Ports": ["Rear ports", "HDMI, Ethernet, optical audio, the AUX port for PlayStation Camera, and the power inlet."],
    "Controller Top Shell": ["DualShock 4 top shell", "The upper half of the controller, with wider grips than the DualShock 3."],
    "Controller Bottom Shell": ["DualShock 4 bottom shell", "The lower half, holding the battery and rumble motors."],
    "Touchpad": ["Touchpad", "A two-point capacitive touch surface that also clicks down as a button."],
    "Controller Light Bar": ["Controller light bar", "An RGB light on the back edge. It shows the player number and lets PlayStation Camera track the controller."],
    "D-Pad": ["D-pad", "Four directional buttons under one cross."],
    "Face Buttons": ["Face buttons", "Triangle, circle, cross and square."],
    "Share + Options + PS Button": ["Share, Options and PS", "Share captures screenshots and video or starts a stream; Options replaces Start; PS opens the home screen."],
    "Shoulder Buttons + Triggers": ["Shoulder buttons and triggers", "L1 and R1 bumpers, and curved L2 and R2 analog triggers."],
    "Analog Sticks": ["Analog sticks", "Two concave thumbsticks. Press one in for L3 or R3."],
    "Controller PCB": ["Controller board", "Reads the buttons, sticks, touchpad and motion sensors and sends them over Bluetooth."],
    "Speaker": ["Speaker", "A small mono speaker that games use for sounds right in your hands."],
    "Headphone Jack": ["Headset jack", "A 3.5 mm jack for a headset, with sound sent from the console over Bluetooth."],
    "Battery": ["Battery", "A 1000 mAh lithium-ion cell, charged over the micro-USB port."],
    "Rumble Motors": ["Rumble motors", "Two motors with off-centre weights in the grips make the controller shake."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "ps4-theme",
    touchHint: "Tap the console to take it apart",
    view: { az: 45, el: 25 },
    materials: [
      [/Glossy Top Cover|Power \+ Eject/, "gloss"],
      [/Matte Top Cover|^Bottom Shell$/, ["plastic", { color: 0x17171a, roughness: 0.75 }]],
      [/^Light Bar$/, ["plastic", { color: 0x4da3ff, roughness: 0.3, emissive: 0x2f7bff, emissiveIntensity: 1.2, opacity: 0.85 }]],
      [/Controller Light Bar/, ["plastic", { color: 0x3d7bff, roughness: 0.2, emissive: 0x2f6bff, emissiveIntensity: 1.4, opacity: 0.85 }]],
      [/Controller (Top|Bottom) Shell/, ["plastic", { color: 0x1b1c1f, roughness: 0.55 }]],
      [/Touchpad/, ["plastic", { color: 0x202124, roughness: 0.35 }]],
      [/D-Pad|Face Buttons|Share|Shoulder/, ["plastic", { color: 0x26272a, roughness: 0.4 }]],
      [/Analog Sticks/, ["rubber", { color: 0x1a1a1c }]],
      [/Blu-ray Drive|Power Supply|Hard Drive|Rear Ports|Front Ports|Rumble Motors|Wi-Fi/, "steel"],
      [/Heatsink/, "copper"],
      [/Blower Fan|Speaker|Headphone/, "plastic"],
      [/Mainboard|Controller PCB/, "pcb"],
      [/APU/, "silicon"],
      [/Memory|Board Components/, "chip"],
      [/Battery/, ["battery", { color: 0x2d4f8a }]],
    ],
    hotspots: G.hotspots.map(h => {
      const c = COPY[h.t] || [h.t, h.s];
      return { t: c[0], s: c[1], p: h.p, o: h.o };
    }),
    detail: DETAIL,

    tour: {
      points: { disc: "Blu-ray Drive", hdd: "Hard Drive", apu: "APU", mem: "GDDR5 Memory", sink: "Heatsink", fan: "Blower Fan",
        rear: "Rear Ports", pad: "Controller PCB", touch: "Touchpad", wifi: "Wi-Fi + Bluetooth", bar: "Controller Light Bar" },
      steps: [
        { t: "The game installs", focus: "hdd", dist: 1.0, ex: 1, p: ["disc", "hdd"], n: ["Blu-ray Drive", "Hard Drive"], ms: 4000,
          d: "The disc is read once and the game is copied to the hard drive, which loads it much faster than the disc." },
        { t: "The APU runs it", focus: "apu", dist: 0.8, ex: 1, p: ["hdd", "mem", "apu"], n: ["APU", "GDDR5 Memory"], ms: 4000,
          d: "Eight Jaguar cores run the game's logic, and all of it lives in 8 GB of fast GDDR5 shared with the graphics." },
        { t: "The GPU draws the frame", focus: "apu", dist: 0.6, ex: 1, p: ["apu", "mem", "apu"], n: ["APU", "GDDR5 Memory"], ms: 4000,
          d: "The Radeon GPU on the same chip renders the frame straight from that shared memory, no copying in between." },
        { t: "Heat goes out the back", focus: "fan", dist: 1.0, ex: 1, p: ["apu", "sink", "fan"], n: ["Heatsink", "Blower Fan"], ms: 3800,
          d: "Heat pipes carry the heat into the fins, and the blower fan pushes the warm air out of the rear vents." },
        { t: "Out through HDMI", focus: "rear", dist: 1.0, ex: 1, p: ["apu", "rear"], n: ["Rear Ports"], ms: 3600,
          d: "The finished picture and sound go to the TV over HDMI." },
        { t: "You touch, press and tilt", focus: "touch", dist: 1.0, ex: 1, p: ["touch", "pad", "wifi", "apu"], n: ["Touchpad", "Controller PCB", "Wi-Fi + Bluetooth"], ms: 4000,
          d: "Buttons, sticks, touchpad and motion sensors are read by the controller's board and sent over Bluetooth to the console." },
        { t: "The light bar answers", focus: "bar", dist: 1.0, ex: 1, p: ["apu", "wifi", "bar"], n: ["Controller Light Bar"], ms: 3800,
          d: "Games can colour the light bar to show your health or your team, and the camera uses it to find you." },
        { t: "Closed up, half gloss, half matte", focus: "disc", dist: 1.4, ex: 0, p: [], n: null, ms: 3800,
          d: "Covers, drive, cooler, board and power supply stack into the slanted black box." },
      ],
    },
  };
})();
