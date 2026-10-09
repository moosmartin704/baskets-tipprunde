// Spielfeld-Grafiken für das Basketball-ABC. Maßstab: 1 m = 30 Einheiten. Halbes Feld:
// Grundlinie oben (y = 0), Mittellinie unten (y = 420), Korbmitte bei (225, 47.25).
// Die Klassen innerhalb der Grafiken (cl, off, def, arr …) sind in style.css unter .abc svg gestylt.
const r = (v) => Math.round(v * 10) / 10;
const pt = (p) => r(p[0]) + " " + r(p[1]);
const path = (ps) => "M" + ps.map(pt).join("L");

const HALF = '<g class="cl">'
  + '<rect class="floor" x="0" y="0" width="450" height="420"/>'
  + '<rect class="paint" x="151.5" y="0" width="147" height="174"/>'
  + '<path d="M151.5 0V174H298.5V0"/>'
  + '<path d="M171 174A54 54 0 0 0 279 174"/>'
  + '<path class="dash" d="M171 174A54 54 0 0 1 279 174"/>'
  + '<path d="M27 0V89.7A202.5 202.5 0 0 0 423 89.7V0"/>'
  + '<path d="M187.5 47.25A37.5 37.5 0 0 0 262.5 47.25"/>'
  + '<path d="M171 420A54 54 0 0 1 279 420"/>'
  + '<rect class="nz" x="147.5" y="52.5" width="4" height="12"/>'
  + '<rect class="nz" x="298.5" y="52.5" width="4" height="12"/>'
  + '<rect class="bound" x="0" y="0" width="450" height="420"/>'
  + '<path d="M225 36V40.5"/>'
  + '<path class="board" d="M198 36H252"/>'
  + '<circle class="rim" cx="225" cy="47.25" r="6.75"/>'
  + "</g>";
// Ganzes Feld quer: linke Hälfte gespiegelt (x↔y), rechte Hälfte zusätzlich um die Mittellinie gedreht.
const FULL = '<g transform="matrix(0 1 1 0 0 0)">' + HALF + '</g><g transform="matrix(0 1 -1 0 840 0)">' + HALF + "</g>";

function ball(x, y) {
  return `<g class="ball"><circle cx="${x}" cy="${y}" r="6.5"/><path d="M${x - 6.5} ${y}H${x + 6.5}M${x} ${y - 6.5}V${y + 6.5}"/></g>`;
}
function O(x, y, n, o = {}) {
  return `<g class="off${o.ghost ? " ghost" : ""}"><circle cx="${x}" cy="${y}" r="15"/><text x="${x}" y="${y}">${n}</text></g>`
    + (o.ball ? ball(o.ball === "l" ? x - 13 : x + 13, y - 13) : "");
}
function X(x, y, n, o = {}) {
  const d = 8.5;
  return `<g class="def${o.ghost ? " ghost" : ""}"><path d="M${x - d} ${y - d}L${x + d} ${y + d}M${x + d} ${y - d}L${x - d} ${y + d}"/>`
    + (n ? `<text x="${x - 12}" y="${y + 5}" text-anchor="end">${n}</text>` : "") + "</g>";
}

// Zwei Punkte: Bogen (bend = seitliche Auslenkung). Mehr Punkte: weiche Kurve durch alle Punkte.
function curve(ps, bend = 0) {
  if (ps.length === 2) {
    const [a, b] = ps, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    const c = [(a[0] + b[0]) / 2 - dy / L * bend, (a[1] + b[1]) / 2 + dx / L * bend];
    const out = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, u = 1 - t;
      out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
    }
    return out;
  }
  const P = [ps[0], ...ps, ps[ps.length - 1]], out = [];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    for (let j = 0; j < 20; j++) {
      const t = j / 20, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t
        + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  out.push(ps[ps.length - 1]);
  return out;
}
function lens(ps) {
  const c = [0];
  for (let i = 1; i < ps.length; i++) c.push(c[i - 1] + Math.hypot(ps[i][0] - ps[i - 1][0], ps[i][1] - ps[i - 1][1]));
  return c;
}
function at(ps, c, d) {
  if (d <= 0) return ps[0];
  for (let i = 1; i < ps.length; i++) {
    if (c[i] >= d) {
      const t = (d - c[i - 1]) / ((c[i] - c[i - 1]) || 1);
      return [ps[i - 1][0] + (ps[i][0] - ps[i - 1][0]) * t, ps[i - 1][1] + (ps[i][1] - ps[i - 1][1]) * t];
    }
  }
  return ps[ps.length - 1];
}
// Kürzt eine Linie vorne um s und hinten um e (damit Pfeile nicht in den Spielerkreisen beginnen/enden).
function trim(ps, s, e) {
  const c = lens(ps), T = c[c.length - 1];
  const a = Math.max(0, Math.min(s, T / 2 - 1)), b = Math.max(0, Math.min(e, T / 2 - 1));
  const out = [at(ps, c, a)];
  for (let i = 0; i < ps.length; i++) if (c[i] > a && c[i] < T - b) out.push(ps[i]);
  out.push(at(ps, c, T - b));
  return out;
}
function zig(ps) {
  const c = lens(ps), T = c[c.length - 1], out = [ps[0]];
  let k = 0;
  for (let s = 8; s < T - 8; s += 8) {
    const q = at(ps, c, s), q2 = at(ps, c, s + 1), dx = q2[0] - q[0], dy = q2[1] - q[1], L = Math.hypot(dx, dy) || 1;
    const m = k++ % 2 ? -5 : 5;
    out.push([q[0] - dy / L * m, q[1] + dx / L * m]);
  }
  out.push(ps[ps.length - 1]);
  return out;
}
// kind: "cut" (Laufweg), "pass" (gestrichelt), "drib" (Zickzack), "screen" (Querbalken am Ende)
function arrow(kind, ps, o = {}) {
  const p = trim(curve(ps, o.bend), o.s ?? 19, o.e ?? 19);
  const c = lens(p), T = c[c.length - 1], tip = p[p.length - 1];
  const cls = "arr " + kind + (o.def ? " is-def" : "") + (o.ghost ? " ghost" : "");
  if (kind === "screen") {
    const q = at(p, c, Math.max(0, T - 6)), dx = tip[0] - q[0], dy = tip[1] - q[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L * 12, ny = dx / L * 12;
    return `<g class="${cls}"><path class="line" d="${path(p)}"/><path class="line" d="${path([[tip[0] + nx, tip[1] + ny], [tip[0] - nx, tip[1] - ny]])}"/></g>`;
  }
  const base = at(p, c, Math.max(0, T - 13)), dx = tip[0] - base[0], dy = tip[1] - base[1], L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L * 6.5, ny = dx / L * 6.5;
  let body = trim(p, 0, 11);
  if (kind === "drib") body = zig(body);
  const head = path([tip, [base[0] + nx, base[1] + ny], [base[0] - nx, base[1] - ny]]) + "Z";
  return `<g class="${cls}"><path class="line" d="${path(body)}"/><path class="head" d="${head}"/></g>`;
}
const cut = (ps, o) => arrow("cut", ps, o);
const pass = (ps, o) => arrow("pass", ps, o);
const drib = (ps, o) => arrow("drib", ps, o);
const screen = (ps, o) => arrow("screen", ps, o);
const dcut = (ps, o = {}) => arrow("cut", ps, { ...o, def: true });

function bar(x, y, len = 24) { return `<path class="bar" d="M${x} ${y - len / 2}V${y + len / 2}"/>`; }
function note(x, y, t, o = {}) {
  const tr = o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : "";
  return `<text class="note ${o.c || ""}" x="${x}" y="${y}" text-anchor="${o.a || "middle"}"${tr}>`
    + t.split("\n").map((l, i) => `<tspan x="${x}"${i ? ' dy="1.2em"' : ""}>${l}</tspan>`).join("") + "</text>";
}
const spot = (x, y) => `<circle class="spot" cx="${x}" cy="${y}" r="6"/>`;
function burst(x, y, rad = 11) {
  let s = "";
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, rr = i % 2 ? rad * 0.45 : rad;
    s += (i ? "L" : "M") + r(x + Math.cos(a) * rr) + " " + r(y + Math.sin(a) * rr);
  }
  return `<path class="burst" d="${s}Z"/>`;
}
const area = (d, alt) => `<path class="area${alt ? " alt" : ""}" d="${d}"/>`;
const assign = (a, b) => `<path class="assign" d="${path([a, b])}"/>`;
const lead = (a, b) => `<path class="lead" d="${path([a, b])}"/>`;
function dimH(x1, x2, y, t) {
  return `<g class="dim"><path d="M${x1} ${y}H${x2}M${x1} ${y - 7}V${y + 7}M${x2} ${y - 7}V${y + 7}"/><text x="${(x1 + x2) / 2}" y="${y - 9}" text-anchor="middle">${t}</text></g>`;
}
function dimV(x, y1, y2, t) {
  const cy = (y1 + y2) / 2;
  return `<g class="dim"><path d="M${x} ${y1}V${y2}M${x - 7} ${y1}H${x + 7}M${x - 7} ${y2}H${x + 7}"/><text x="${x + 20}" y="${cy}" text-anchor="middle" transform="rotate(-90 ${x + 20} ${cy})">${t}</text></g>`;
}

const VB = {
  half: "-16 -24 482 474",
  play: "-16 -16 482 346",
  key: "96 -12 258 250",
  top: "96 124 298 222",
  full: "-26 -56 916 548",
  fb: "-12 -12 864 474"
};
// Mitspieler, die beim Pick and Roll nur für die Abstände da sind
const CTX = O(434, 40, "2", { ghost: true }) + O(62, 205, "3", { ghost: true }) + O(16, 40, "4", { ghost: true });
// Ausgangslage für die Pick-and-Roll-Verteidigung
const B5 = O(250, 256, "5"), B1 = O(300, 270, "1", { ball: true }), BX1 = X(222, 262, "1");
const OFF5 = O(225, 284, "1", { ball: true }) + O(388, 205, "2") + O(62, 205, "3") + O(16, 40, "4") + O(318, 80, "5");

const FIG = {
  court: [VB.full, () => FULL
    + note(96, 176, "ZONE", { c: "xl" })
    + note(194, 225, "FREIWURFLINIE", { c: "sm", rot: -90 })
    + note(272, 225, "DREIERLINIE", { c: "sm", rot: -90 })
    + '<g class="dim"><path d="M47.25 225L213.1 341.1"/></g>'
    + note(134.8, 276.5, "6,75 m", { c: "lg", rot: 35 })
    + note(420, 230, "MITTELKREIS", { c: "sm" })
    + note(330, 424, "RÜCKFELD", { c: "big" }) + note(510, 424, "VORFELD", { c: "big" })
    + cut([[364, 378], [476, 378]], { s: 0, e: 0 }) + note(420, 362, "ANGRIFFSRICHTUNG", { c: "sm" })
    + lead([792.75, 240], [792.75, 322]) + note(834, 340, "KORB · 3,05 m HOCH", { c: "lg", a: "end" })
    + lead([755.25, 212], [755.25, 128]) + note(834, 116, "NO-CHARGE-HALBKREIS", { c: "sm", a: "end" })
    + dimH(0, 840, -28, "28 m") + dimV(866, 0, 450, "15 m")
    + note(-8, 225, "GRUNDLINIE", { c: "sm", rot: -90 })
    + note(210, 476, "SEITENLINIE", { c: "sm" }) + note(420, 476, "MITTELLINIE", { c: "sm" })],

  spots: [VB.half, () => HALF
    + spot(14, 30) + note(4, 104, "ECKE", { a: "start", c: "lbl" })
    + spot(436, 30) + note(446, 104, "ECKE", { a: "end", c: "lbl" })
    + spot(62, 205) + note(62, 236, "FLÜGEL", { c: "lbl" })
    + spot(388, 205) + note(388, 236, "FLÜGEL", { c: "lbl" })
    + spot(225, 290) + note(225, 320, "SPITZE (TOP)", { c: "lbl" })
    + spot(151.5, 174) + note(140, 179, "ELLBOGEN", { a: "end", c: "lbl" })
    + spot(298.5, 174) + note(310, 179, "ELLBOGEN", { a: "start", c: "lbl" })
    + spot(140, 62) + note(128, 67, "LOW POST", { a: "end", c: "lbl" })
    + spot(310, 62) + note(322, 67, "LOW POST", { a: "start", c: "lbl" })
    + spot(225, 174) + note(225, 202, "HIGH POST", { c: "lbl" })
    + note(225, 128, "ZONE (PAINT)", { c: "lbl" })
    + note(98, 134, "MITTEL-\nDISTANZ", { c: "sm" })
    + note(167.5, 262, "DREIERLINIE", { c: "lbl", rot: 15 })
    + note(225, -8, "GRUNDLINIE", { c: "lbl" })
    + note(225, 444, "MITTELLINIE", { c: "lbl" })],

  positions: [VB.play, () => HALF
    + O(225, 284, "1", { ball: true }) + note(225, 320, "POINT GUARD", { c: "lbl" })
    + O(388, 205, "2") + note(388, 240, "SHOOTING GUARD", { c: "lbl" })
    + O(62, 205, "3") + note(62, 240, "SMALL FORWARD", { c: "lbl" })
    + O(152, 180, "4") + note(152, 215, "POWER FORWARD", { c: "lbl" })
    + O(318, 80, "5") + note(340, 85, "CENTER", { a: "start", c: "lbl" })],

  charge1: [VB.key, () => HALF
    + X(228, 142) + note(228, 114, "STEHT FEST", { c: "lbl" })
    + O(296, 214, "1", { ball: true }) + drib([[296, 214], [243, 158]], { e: 0 }) + burst(240, 154)],
  charge2: [VB.key, () => HALF
    + X(166, 122, "", { ghost: true }) + dcut([[166, 122], [226, 128]], { s: 12, e: 8 }) + X(232, 128)
    + note(190, 98, "RUTSCHT ZU SPÄT REIN", { c: "lbl mg" })
    + O(296, 214, "1", { ball: true }) + drib([[296, 214], [248, 146]], { e: 0 }) + burst(243, 141)],
  charge3: [VB.key, () => HALF
    + X(225, 68) + note(178, 128, "IM HALBKREIS", { c: "lbl mg" })
    + O(296, 214, "1", { ball: true }) + drib([[296, 214], [240, 92]], { e: 0 }) + burst(236, 86)],

  pnr1: [VB.play, () => HALF + CTX
    + X(225, 252, "1") + X(284, 154, "5") + O(298, 180, "5") + O(225, 284, "1", { ball: "l" })
    + screen([[298, 180], [250, 258]], { e: 4 })],
  pnr2: [VB.play, () => HALF + CTX
    + O(250, 258, "5") + X(222, 246, "1") + X(276, 200, "5") + O(225, 284, "1", { ball: "l" })
    + drib([[225, 284], [292, 300], [345, 226]], { e: 4 })
    + note(194, 251, "HÄNGT FEST", { a: "end", c: "lbl mg" })],
  pnr3: [VB.play, () => HALF + CTX
    + O(250, 258, "5") + X(322, 252, "1") + X(300, 196, "5") + O(345, 226, "1", { ball: true })
    + cut([[250, 258], [236, 96]], { bend: -14, e: 0 })
    + pass([[345, 226], [244, 112]], { bend: 14, e: 8 })],
  pnr4: [VB.play, () => HALF + CTX
    + O(250, 258, "5", { ghost: true }) + O(152, 288, "5") + X(322, 252, "1") + X(292, 200, "5")
    + O(345, 226, "1", { ball: true })
    + cut([[250, 258], [152, 288]], { bend: 10, e: 18 })
    + pass([[345, 226], [152, 288]], { bend: 30, e: 18 })
    + note(152, 322, "FREIER WURF", { c: "lbl" })],

  drop: [VB.top, () => HALF + B5 + BX1 + B1 + X(250, 188, "5")
    + note(245, 334, "BLEIBT TIEF AM KORB", { c: "lbl mg" })],
  hedge: [VB.top, () => HALF + B5 + BX1 + B1
    + X(268, 210, "", { ghost: true }) + dcut([[268, 210], [326, 246]], { s: 12, e: 10 }) + X(330, 246, "5")
    + note(245, 334, "SPRINGT RAUS, DANN ZURÜCK", { c: "lbl mg" })],
  switch: [VB.top, () => HALF + B5 + B1
    + X(222, 262, "", { ghost: true }) + dcut([[222, 262], [236, 226]], { s: 12, e: 8 }) + X(238, 222, "1")
    + X(268, 210, "", { ghost: true }) + dcut([[268, 210], [322, 244]], { s: 12, e: 10 }) + X(326, 246, "5")
    + note(245, 334, "TAUSCHEN DIE GEGNER", { c: "lbl mg" })],
  blitz: [VB.top, () => HALF + B5 + B1
    + X(222, 262, "", { ghost: true }) + dcut([[222, 262], [258, 302], [292, 302]], { s: 12, e: 10 }) + X(298, 302, "1")
    + X(268, 210, "", { ghost: true }) + dcut([[268, 210], [318, 244]], { s: 12, e: 10 }) + X(322, 246, "5")
    + note(245, 334, "ZU ZWEIT AN DEN BALL", { c: "lbl mg" })],

  horns1: [VB.play, () => HALF
    + O(225, 284, "1", { ball: true }) + O(152, 180, "4") + O(298, 180, "5") + O(434, 40, "2") + O(16, 40, "3")],
  horns2: [VB.play, () => HALF
    + O(152, 180, "4") + O(298, 180, "5") + O(434, 40, "2") + O(16, 40, "3") + O(225, 284, "1", { ball: "l" })
    + screen([[298, 180], [250, 258]], { e: 4 })
    + drib([[225, 284], [292, 300], [345, 226]], { e: 4 })],
  horns3: [VB.play, () => HALF
    + O(434, 40, "2") + O(16, 40, "3") + O(250, 258, "5") + O(152, 180, "4") + O(345, 226, "1", { ball: true })
    + cut([[250, 258], [236, 96]], { bend: -14, e: 0 })
    + cut([[152, 180], [172, 290]], { bend: 12, e: 0 })
    + pass([[345, 226], [244, 112]], { bend: 14, e: 8 })
    + pass([[345, 226], [172, 290]], { bend: -26, e: 16 })
    + pass([[345, 226], [434, 40]], { bend: -10, e: 19 })],

  spain1: [VB.play, () => HALF
    + O(16, 40, "3") + O(434, 40, "4") + O(200, 128, "2") + X(240, 172, "5") + O(225, 196, "5")
    + X(225, 252, "1") + O(225, 284, "1", { ball: "l" })
    + screen([[225, 196], [252, 256]], { e: 4 })
    + drib([[225, 284], [292, 300], [345, 226]], { e: 4 })],
  spain2: [VB.play, () => HALF
    + O(16, 40, "3") + O(434, 40, "4") + O(252, 258, "5") + X(272, 214, "5") + O(200, 128, "2")
    + O(345, 226, "1", { ball: true })
    + cut([[252, 258], [236, 96]], { bend: -16, e: 0 })
    + screen([[200, 128], [258, 202]], { e: 4 })
    + cut([[258, 202], [176, 290]], { s: 10, e: 0, bend: 20 })
    + pass([[345, 226], [244, 112]], { bend: 14, e: 8 })
    + pass([[345, 226], [176, 290]], { bend: -26, e: 16 })],

  floppy: [VB.play, () => HALF
    + O(225, 284, "1", { ball: true }) + O(130, 84, "4") + O(130, 120, "3") + O(320, 96, "5") + O(225, 92, "2")
    + bar(149, 84) + bar(149, 120) + bar(301, 96)
    + cut([[225, 92], [166, 104], [160, 152], [118, 192], [74, 206]], { e: 4 })
    + cut([[225, 92], [284, 106], [292, 152], [340, 192], [378, 206]], { e: 4 })
    + pass([[225, 284], [82, 212]], { bend: 12, e: 14 })
    + pass([[225, 284], [370, 212]], { bend: -12, e: 14 })
    + note(112, 54, "DOPPELBLOCK", { a: "end", c: "lbl" })
    + note(340, 64, "EINZELBLOCK", { a: "start", c: "lbl" })],

  backdoor: [VB.play, () => HALF
    + O(62, 205, "3", { ghost: true }) + O(16, 40, "4", { ghost: true }) + O(152, 180, "5", { ghost: true })
    + X(205, 252, "1") + O(225, 284, "1", { ball: "l" })
    + O(388, 205, "2") + X(358, 224, "2")
    + cut([[388, 205], [398, 242]], { e: 0 })
    + cut([[396, 236], [330, 140], [262, 84]], { s: 8, e: 0 })
    + pass([[225, 284], [262, 100]], { bend: 40, e: 12 })
    + note(356, 262, "ZU WEIT VORNE", { c: "lbl mg" })],

  drivekick: [VB.play, () => HALF
    + O(388, 205, "2", { ghost: true }) + O(434, 40, "4", { ghost: true }) + O(318, 80, "5", { ghost: true })
    + X(128, 244, "1", { ghost: true }) + O(150, 280, "1", { ball: "l" })
    + drib([[150, 280], [160, 200], [188, 128]], { e: 0 })
    + O(16, 40, "3") + X(56, 78, "", { ghost: true }) + dcut([[56, 78], [136, 128]], { s: 12, e: 8 }) + X(140, 132, "3")
    + pass([[190, 124], [16, 40]], { bend: 12, s: 8, e: 19 })
    + note(40, 44, "FREI", { a: "start", c: "lbl" })],

  fastbreak: [VB.fb, () => FULL
    + O(70, 262, "5", { ball: true }) + note(92, 244, "REBOUND", { a: "start", c: "lg" })
    + pass([[70, 262], [150, 392]], { e: 19 }) + note(96, 360, "OUTLET", { a: "end", c: "lg" })
    + O(150, 392, "1") + drib([[150, 392], [300, 300], [560, 232]], { e: 4 }) + note(330, 330, "MITTE", { c: "lg" })
    + O(230, 420, "2") + cut([[230, 420], [520, 418], [716, 340]], { e: 4 }) + note(470, 442, "AUSSENBAHN", { c: "lg" })
    + O(230, 40, "3") + cut([[230, 40], [520, 34], [716, 112]], { e: 4 }) + note(470, 24, "AUSSENBAHN", { c: "lg" })
    + O(120, 180, "4") + cut([[120, 180], [300, 190], [470, 200]], { e: 4 }) + note(380, 176, "NACHZÜGLER", { c: "lg" })],

  man: [VB.play, () => HALF
    + assign([225, 252], [225, 284]) + assign([366, 186], [388, 205]) + assign([84, 186], [62, 205])
    + assign([96, 100], [16, 40]) + assign([298, 72], [318, 80])
    + X(225, 252) + X(366, 186) + X(84, 186) + X(96, 100) + X(298, 72)
    + note(100, 134, "HILFSPOSITION", { c: "sm mg" }) + OFF5],
  zone: [VB.play, () => HALF
    + area("M0 160H225V330H0Z") + area("M225 160H450V330H225Z", true)
    + area("M0 0H150V160H0Z", true) + area("M150 0H300V160H150Z") + area("M300 0H450V160H300Z", true)
    + X(170, 222) + X(280, 222) + X(78, 112) + X(225, 84) + X(372, 112) + OFF5],

  "lg-off": ["-1 -1 32 32", () => O(15, 15, "1")],
  "lg-def": ["-1 -1 32 32", () => X(15, 15)],
  "lg-ball": ["0 0 18 18", () => ball(9, 9)],
  "lg-cut": ["0 0 64 20", () => cut([[3, 10], [61, 10]], { s: 0, e: 0 })],
  "lg-pass": ["0 0 64 20", () => pass([[3, 10], [61, 10]], { s: 0, e: 0 })],
  "lg-drib": ["0 0 64 20", () => drib([[3, 10], [61, 10]], { s: 0, e: 0 })],
  "lg-screen": ["0 -3 64 26", () => screen([[3, 10], [55, 10]], { s: 0, e: 0 })],
  "lg-dcut": ["0 0 64 20", () => dcut([[3, 10], [61, 10]], { s: 0, e: 0 })]
};

/** Füllt alle <svg data-fig="…"> unterhalb von root mit der passenden Grafik. */
export function drawFigures(root) {
  for (const svg of root.querySelectorAll("svg[data-fig]")) {
    const f = FIG[svg.dataset.fig];
    if (!f) continue;
    svg.setAttribute("viewBox", f[0]);
    if (!svg.hasAttribute("width")) {
      const v = f[0].split(" ").map(Number);
      svg.style.aspectRatio = v[2] + " / " + v[3];
    }
    svg.innerHTML = f[1]();
  }
}
