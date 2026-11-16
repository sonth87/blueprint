// Mac mini (M4): the model script for the blueprint engine, which macmini/build.js inlines after the generated
// geometry. The blower fan turns all the time (not with reduced motion).
(function () {
  "use strict";
  const G = window.MM4_GEOMETRY;
  const DETAIL = {
    "Enclosure": ["Enclosure", "One piece of aluminium for the top and all four sides, 12.7 cm square and 5 cm tall. It lifts off once the bottom is out."],
    "Status Light": ["Status light", "A small white light on the front, on while the Mac is running."],
    "Bottom Cover": ["Bottom cover", "The base the whole machine stands on, with the intake round its edge."],
    "Foot Ring": ["Foot ring", "A round foot that lifts the Mac off the desk, leaving a gap all round for air to get in."],
    "Power Button": ["Power button", "Underneath, at the back left corner: reach under and press it."],
    "Fan": ["Fan", "A blower that pulls air in from underneath and throws it sideways into the fins."],
    "Fan Housing": ["Fan housing", "Wraps round the fan and points all its air at the fin stack."],
    "Thermal Plate": ["Thermal plate", "Pressed against the M4 with thermal paste, under the board."],
    "Heat Pipes": ["Heat pipes", "Two flat copper pipes that carry the chip's heat back to the fins."],
    "Fin Stack": ["Fin stack", "Thin fins at the back; the fan's air passes through them and leaves through the slot low on the back."],
    "Logic Board": ["Logic board", "Carries the M4, the SSD module and every port."],
    "M4 Chip": ["M4 chip", "Apple's system on a chip: a 10-core CPU, a 10-core GPU and a 16-core Neural Engine, face down on the board's underside."],
    "Unified Memory": ["Unified memory", "16, 24 or 32 GB on the chip's package, shared by the CPU, the GPU and the Neural Engine."],
    "Board Components": ["Board components", "Power stages for the chip and the controllers for the ports, Wi-Fi and Bluetooth."],
    "SSD": ["SSD", "Flash storage on a small module that plugs into the board: 256 GB to 2 TB."],
    "Front Ports": ["Front ports", "Two USB-C ports (10 Gb/s) and a 3.5 mm headphone jack."],
    "Rear Ports": ["Rear ports", "Three Thunderbolt 4 ports, HDMI and Gigabit Ethernet."],
    "Power Supply": ["Power supply", "Built in, across the top of the case: one cable from the wall, no brick."],
    "Power Inlet": ["Power inlet", "Where the power cable plugs in, at the back."],
  };

  window.BLUEPRINT_MODEL = {
    geometry: G,
    themeKey: "mm4-theme",
    touchHint: "Tap the Mac mini to take it apart",
    view: { az: 40, el: 24 },
    spoolOf: o => o.spool || null,
    occluders: ["Enclosure", "Power Supply", "Logic Board", "Bottom Cover", "Fin Stack"],
    hotspots: G.hotspots.map(h => ({ t: h.t, s: h.s, p: h.p, o: h.o })),
    detail: DETAIL,
    tour: G.tour,
    // shaded and photo styles: a silver aluminium case on a black base
    materials: [
      [/^Enclosure$/, ["alu", { color: 0xd4d6d9, roughness: 0.32 }]], [/Bottom Cover|Foot Ring|Power Button/, ["plastic", { color: 0x1a1b1d, roughness: 0.6 }]],
      [/Status Light/, ["plastic", { color: 0xf4f6f8, roughness: 0.2 }]], [/^Fan$|Fan Housing/, ["plastic", { color: 0x1d1e21 }]],
      [/Thermal Plate|Heat Pipes/, "copper"], [/Fin Stack/, "alu"], [/Logic Board/, "pcb"],
      [/M4 Chip|Unified Memory|Board Components|SSD/, "chip"], [/Ports|Power Inlet/, "steel"],
      [/Power Supply/, ["darkAlu", { color: 0x3a3d42 }]],
    ],

    setup(E) {
      let t = 0;
      return {
        tick(now, dt) {
          if (!E.reduceMotion) t += dt;
          (E.spinners.fan || []).forEach(g => g.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 6 * t));
        },
      };
    },
  };
})();
