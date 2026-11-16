// PlayStation (SCPH-1001) with a DualShock: the model script for the blueprint engine (src/engine.js), which build_pages.py
// inlines after it. The console's shell, drive, board and power supply lift apart; the controller opens up beside it.
// "." follows a game from the disc to the screen and back through the controller. The power supply and rear port
// placement are plausible guesses, not taken from a teardown.
(function () {
  "use strict";
  const G = window.PS1_GEOMETRY;

  // ---------- hotspot copy (the blueprint's callouts, in plain words) ----------
  const COPY = {
    "DISC LID": ["Disc lid", "Hinged, popped by the Open button"],
    "POWER / RESET / OPEN": ["Power, Reset, Open", "The three top-panel buttons"],
    "TOP SHELL": ["Top shell", "Grey ABS with ribbed side vents"],
    "CD-ROM DRIVE": ["CD-ROM drive", "2x speed, 300 KB/s"],
    "LASER SLED": ["Laser sled", "Optical pickup on guide rods"],
    "POWER SUPPLY": ["Power supply", "Internal, AC inlet at the rear"],
    "R3000A CPU": ["R3000A CPU", "MIPS, 33.9 MHz, GTE on chip"],
    "GPU": ["GPU", "2D + 3D polygons, up to 640 x 480"],
    "RAM + VRAM": ["RAM + VRAM", "2 MB main RAM + 1 MB VRAM"],
    "SOUND + CD CONTROLLER": ["Sound + CD controller", "SPU: 24 voices, 512 KB RAM"],
    "MAINBOARD": ["Mainboard", "512 KB BIOS ROM"],
    "REAR PORTS": ["Rear ports", "AV multi out, RCA, serial, parallel"],
    "CONTROLLER PORTS": ["Controller ports", "2 ports + 2 memory card slots"],
    "MEMORY CARD": ["Memory card", "128 KB, 15 save blocks"],
    "DUALSHOCK": ["DualShock", "Analog sticks + vibration"],
    "ANALOG STICKS": ["Analog sticks", "Two thumbsticks, L3 / R3 click"],
    "FACE BUTTONS": ["Face buttons", "Triangle, circle, cross, square"],
    "D-PAD": ["D-pad", "Four-way directional pad"],
    "SHOULDER BUTTONS": ["Shoulder buttons", "L1, L2, R1, R2"],
    "RUMBLE MOTORS": ["Rumble motors", "Two eccentric-weight motors"],
  };

  // ---------- part notes, shown when you click a part ----------
  const DETAIL = {
    "Top Shell": ["Top shell", "The grey upper case. The disc lid sits in a round well in its middle, and ribbed vents along the sides let the warm air out."],
    "Disc Lid": ["Disc lid", "A spring-loaded hinged lid over the CD drive. Opening it stops the disc; a small switch tells the console it's open."],
    "Power + Reset + Open Buttons": ["Power, Reset and Open", "Power switches the console on, Reset restarts the game, and the round Open button pops the disc lid."],
    "CD Drive": ["CD-ROM drive", "A double-speed drive that reads up to 300 KB a second. Games stream graphics, sound and video straight off the disc."],
    "Laser Sled": ["Laser sled", "The optical pickup slides along two guide rods under the spinning disc, reading the pits in its surface with an infrared laser."],
    "RF Shield": ["RF shield", "A metal plate over the board that keeps its electrical noise from interfering with the TV signal and other devices."],
    "Mainboard": ["Mainboard", "The main circuit board. It carries the processor, graphics, memory, sound, the BIOS chip and all the connectors."],
    "CPU": ["R3000A CPU", "A 33.9 MHz MIPS processor with the Geometry Transformation Engine built in, a maths unit that turns 3D models into screen positions."],
    "GPU": ["GPU", "Draws the polygons the CPU sends it, with textures and shading, into video memory at up to 640 x 480."],
    "RAM + VRAM": ["RAM and VRAM", "2 MB of main memory for the game and 1 MB of video memory that holds the picture being drawn and its textures."],
    "Sound + CD Controller": ["Sound and CD controller", "The SPU mixes 24 voices of sampled sound from its own 512 KB of memory; beside it, the CD controller runs the drive."],
    "Board Components": ["Board components", "The BIOS ROM that shows the startup logo, the clock, power regulation and the small parts that keep it all running."],
    "Power Supply": ["Power supply", "Turns mains AC from the rear inlet into the low DC voltages the board, the drive and the controllers run on."],
    "Controller Ports + Card Slots": ["Controller ports and card slots", "Two controller ports on the front, each with a memory card slot above it."],
    "Rear Ports": ["Rear ports", "AV multi out for the TV, RCA audio and video, a serial link port for two-console play, and a parallel expansion port."],
    "Bottom Shell": ["Bottom shell", "The lower case and base. Everything inside mounts to it, and it carries the feet and the rear port openings."],
    "Memory Card": ["Memory card", "128 KB of flash memory split into 15 blocks. Your saves live here, so you can take them to a friend's console."],
    "Controller Top Shell": ["DualShock top shell", "The upper half of the controller, with the grips that made the shape famous."],
    "Controller Bottom Shell": ["DualShock bottom shell", "The lower half, holding the rumble motors in the grips."],
    "D-Pad": ["D-pad", "Four separate directional buttons under one cross-shaped cap."],
    "Face Buttons": ["Face buttons", "Triangle, circle, cross and square: pressure-sensing rubber domes close contacts on the board underneath."],
    "Start + Select + Analog": ["Start, Select and Analog", "Start pauses, Select picks options, and Analog switches the sticks on, with a red light to show it."],
    "Shoulder Buttons": ["Shoulder buttons", "L1, L2, R1 and R2 on the top edge, under your index and middle fingers."],
    "Analog Sticks": ["Analog sticks", "Two thumbsticks on potentiometers that measure how far they're pushed. Press one down for L3 or R3."],
    "Controller PCB": ["Controller board", "Reads every button and stick and sends them down the cable to the console."],
    "Rumble Motors": ["Rumble motors", "Two motors in the grips spin off-centre weights, one large and one small, so the controller shakes."],
    "Controller Cable + Plug": ["Cable and plug", "Carries the button data to the console and power for the rumble motors back up to the controller."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "ps1-theme",
    touchHint: "Tap the console to take it apart",
    view: { az: 45, el: 25 },
    // Photo style: the light grey shells, darker grey buttons, black rubber sticks and cable
    materials: [
      [/^(Top Shell|Bottom Shell|Disc Lid|Controller Top Shell|Controller Bottom Shell|Memory Card)$/, ["plastic", { color: 0xbab9b4, roughness: 0.55 }]],
      [/Power \+ Reset|D-Pad|Shoulder|Start \+ Select/, ["plastic", { color: 0x86868a, roughness: 0.5 }]],
      [/Face Buttons/, ["plastic", { color: 0x38383c, roughness: 0.35 }]],
      [/Analog Sticks|Cable/, ["rubber", { color: 0x1c1c1e }]],
      [/CD Drive|Rear Ports/, ["plastic", { color: 0x2a2a2d }]],
      [/Controller Ports/, ["plastic", { color: 0x5a5a5f }]],
      [/Laser Sled|RF Shield|Rumble Motors/, "steel"],
      [/Mainboard|Controller PCB|Power Supply/, "pcb"],
      [/CPU|GPU|RAM|Sound|Board Components/, "chip"],
    ],
    occluders: ["Top Shell", "Bottom Shell", "Mainboard", "Controller Top Shell", "Controller Bottom Shell"],
    hotspots: G.hotspots.map(h => {
      const c = COPY[h.t] || [h.t, h.s];
      return { t: c[0], s: c[1], p: h.p, o: h.o };
    }),
    detail: DETAIL,

    // "how it works": the disc is read, the chips build the picture and sound, and your thumbs feed back in
    tour: {
      points: {
        disc: "CD Drive",
        sled: "Laser Sled",
        cpu: "CPU",
        ram: "RAM + VRAM",
        gpu: "GPU",
        spu: "Sound + CD Controller",
        rear: "Rear Ports",
        ports: "Controller Ports + Card Slots",
        card: "Memory Card",
        pad: "Controller PCB",
        rumble: "Rumble Motors",
        psu: "Power Supply",
      },
      steps: [
        { t: "The laser reads the disc", focus: "sled", dist: 1.0, ex: 1, p: ["sled", "disc"], n: ["CD Drive", "Laser Sled"], ms: 4000,
          d: "The disc spins while the laser sled tracks across it, reading the game's code, textures and audio at 300 KB a second." },
        { t: "The CPU runs the game", focus: "cpu", dist: 0.8, ex: 1, p: ["disc", "spu", "ram", "cpu"], n: ["CPU", "RAM + VRAM", "Sound + CD Controller"], ms: 4000,
          d: "The CD controller hands the data to main memory, and the R3000A runs the game, working out where every 3D model is with its built-in geometry engine." },
        { t: "The GPU draws the frame", focus: "gpu", dist: 0.8, ex: 1, p: ["cpu", "gpu", "ram"], n: ["GPU", "RAM + VRAM"], ms: 4000,
          d: "The GPU fills in the polygons with textures and shading, drawing the next frame into video memory." },
        { t: "The SPU plays the sound", focus: "spu", dist: 0.8, ex: 1, p: ["cpu", "spu"], n: ["Sound + CD Controller"], ms: 3800,
          d: "The sound chip mixes up to 24 voices from its own memory, or plays music straight off the disc." },
        { t: "Out to the TV", focus: "rear", dist: 1.0, ex: 1, p: ["gpu", "rear"], n: ["Rear Ports", "GPU"], ms: 3800,
          d: "Picture and sound leave through the AV multi out on the back, sixty times a second on an NTSC TV." },
        { t: "Your thumbs answer", focus: "pad", dist: 1.1, ex: 1, p: ["pad", "ports", "cpu"], n: ["Controller PCB", "Analog Sticks", "Face Buttons", "Controller Cable + Plug", "Controller Ports + Card Slots"], ms: 4000,
          d: "The controller reads every button and both sticks and sends them up the cable to the console, which feeds them into the game." },
        { t: "And it shakes back", focus: "rumble", dist: 1.0, ex: 1, p: ["cpu", "ports", "rumble"], n: ["Rumble Motors", "Controller Cable + Plug"], ms: 3800,
          d: "When something hits, the game spins the rumble motors. Their off-centre weights shake the grips in your hands." },
        { t: "Saved to the card", focus: "card", dist: 1.0, ex: 1, p: ["cpu", "ports", "card"], n: ["Memory Card", "Controller Ports + Card Slots"], ms: 3800,
          d: "Your progress goes onto the memory card in the slot above the controller port, one of its 15 save blocks." },
        { t: "Closed up, all grey", focus: "disc", dist: 1.4, ex: 0, p: [], n: null, ms: 3800,
          d: "Shell, drive, board and power supply stack into one box, with the DualShock plugged into the front." },
      ],
    },
  };
})();
