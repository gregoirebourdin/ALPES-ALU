// Génère deux dessins SVG :
// 1. le relevé de la ligne de crête réellement visible sur la photo du hero
//    (ciel / relief séparés par analyse de l'image), pour les deux recadrages ;
// 2. les courbes de niveau stylisées de la carte de la zone d'intervention.
// Usage : node scripts/gen-svg.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'partials/generated');

// --- outils -----------------------------------------------------------------
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = -1, dmax = 0;
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (d > dmax) (dmax = d), (idx = i);
  }
  if (dmax > eps) return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
  return [a, b];
}
const fmt = (n) => (Math.round(n * 10) / 10).toString();
const pathOf = (pts) => 'M' + pts.map((p) => `${fmt(p[0])} ${fmt(p[1])}`).join('L');

// --- 1. ligne de crête -------------------------------------------------------
// Relevé à la main sur une grille posée sur la photo du hero (recadrage bureau,
// 2 048 × 1 336) : seules les crêtes réellement visibles, sans les toits.
const RIDGE = [
  [[0, 251], [64, 290], [128, 325], [192, 366], [250, 405]],
  [[512, 402], [538, 386], [576, 376], [640, 373], [678, 382], [688, 395], [717, 370], [755, 354], [794, 366], [832, 379], [864, 384], [928, 357], [992, 325], [1024, 308], [1184, 299], [1216, 306], [1280, 309], [1331, 322], [1370, 341], [1408, 345], [1466, 341], [1510, 326], [1619, 322], [1664, 318], [1702, 338], [1728, 363], [1741, 366], [1792, 341], [1856, 312], [1920, 274], [1984, 235], [2048, 197]],
];
const SUMMITS = [[755, 354], [1184, 299], [1664, 318]];
function skyline(kind) {
  if (kind === 'desk') return { w: 2048, h: 1336, segs: RIDGE, summits: SUMMITS };
  // recadrage mobile : x 553 → 1495 de l'original, y décalé de 30 px (le recadrage bureau commence à 2 %)
  const X0 = 553, X1 = 1495, DY = 30;
  const segs = RIDGE.map((seg) => seg.filter(([x]) => x >= X0 - 70 && x <= X1 + 70).map(([x, y]) => [x - X0, y + DY])).filter((s) => s.length > 1);
  const summits = SUMMITS.filter(([x]) => x > X0 && x < X1).map(([x, y]) => [x - X0, y + DY]);
  return { w: X1 - X0, h: 1484, segs, summits };
}
const ridgeSvg = (kind) => {
  const r = skyline(kind);
  const d = r.segs.map(pathOf).join('');
  const marks = r.summits.map(([x, y]) => `M${fmt(x - 9)} ${fmt(y - 22)}l9 -15 9 15Z`).join('');
  return `<svg class="hero__ridges hero__ridges--${kind}" viewBox="0 0 ${r.w} ${r.h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path class="ridge ridge--main" pathLength="1" d="${d}"/><path class="ridge ridge--echo" pathLength="1" d="${d}" transform="translate(0 14)"/><path class="ridge ridge--marks" d="${marks}"/></svg>`;
};

// --- 2. courbes de niveau ----------------------------------------------------
function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function valueNoise(seed) {
  const r = rng(seed), G = 64, g = Array.from({ length: (G + 1) * (G + 1) }, () => r());
  const at = (i, j) => g[(j % G) * (G + 1) + (i % G)];
  return (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return at(i, j) * (1 - u) * (1 - v) + at(i + 1, j) * u * (1 - v) + at(i, j + 1) * (1 - u) * v + at(i + 1, j + 1) * u * v;
  };
}
function distSeg(px, py, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
}
function distPoly(px, py, poly) {
  let d = Infinity;
  for (let i = 0; i < poly.length - 1; i++) d = Math.min(d, distSeg(px, py, poly[i], poly[i + 1]));
  return d;
}

function contours() {
  // Repère 1000 × 1000, L'Argentière-la-Bessée au centre (500, 520). Schéma, pas une carte exacte.
  const N = 200, S = 1000 / N;
  const n1 = valueNoise(7), n2 = valueNoise(19);
  const valleys = [
    { poly: [[560, 0], [548, 140], [520, 300], [500, 520], [532, 700], [585, 860], [610, 1000]], w: 70 }, // Durance
    { poly: [[500, 520], [400, 470], [300, 440], [170, 400], [40, 360]], w: 46 }, // Gyronde, vers la Vallouise
    { poly: [[548, 140], [440, 90], [320, 30], [240, 0]], w: 44 }, // Guisane
    { poly: [[585, 860], [700, 840], [830, 800], [1000, 790]], w: 40 }, // Guil
    { poly: [[500, 520], [430, 600], [360, 660]], w: 24 }, // Fournel
    { poly: [[532, 700], [430, 760], [300, 800], [180, 830]], w: 30 }, // Freissinières
  ];
  const height = (x, y) => {
    let h = 0, amp = 1, f = 1 / 220;
    for (let o = 0; o < 5; o++) {
      h += amp * (o % 2 ? n2(x * f, y * f) : n1(x * f, y * f));
      amp *= 0.52;
      f *= 2.05;
    }
    h = h / 1.9;
    // massif plus haut à l'ouest (Écrins), plus doux à l'est
    h *= 0.62 + 0.58 * Math.max(0, Math.min(1, (620 - x) / 620)) + 0.18 * Math.max(0, (x - 700) / 300);
    for (const v of valleys) {
      const d = distPoly(x, y, v.poly);
      const k = Math.min(1, d / (v.w * 2.4));
      h *= 0.22 + 0.78 * k * k * (3 - 2 * k);
    }
    return h;
  };
  const grid = new Float32Array((N + 1) * (N + 1));
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) grid[j * (N + 1) + i] = height(i * S, j * S);
  // marching squares, segments puis chaînage
  const levels = Array.from({ length: 13 }, (_, k) => 0.085 + k * 0.052);
  const out = [];
  for (const L of levels) {
    const segs = [];
    const interp = (a, b, va, vb) => a + ((L - va) / (vb - va)) * (b - a);
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const v0 = grid[j * (N + 1) + i], v1 = grid[j * (N + 1) + i + 1], v2 = grid[(j + 1) * (N + 1) + i + 1], v3 = grid[(j + 1) * (N + 1) + i];
        const c = (v0 > L ? 1 : 0) | (v1 > L ? 2 : 0) | (v2 > L ? 4 : 0) | (v3 > L ? 8 : 0);
        if (c === 0 || c === 15) continue;
        const x0 = i * S, y0 = j * S;
        const e = {
          t: [interp(x0, x0 + S, v0, v1), y0],
          r: [x0 + S, interp(y0, y0 + S, v1, v2)],
          b: [interp(x0, x0 + S, v3, v2), y0 + S],
          l: [x0, interp(y0, y0 + S, v0, v3)],
        };
        const table = { 1: ['l', 't'], 2: ['t', 'r'], 3: ['l', 'r'], 4: ['r', 'b'], 5: ['l', 't', 'r', 'b'], 6: ['t', 'b'], 7: ['l', 'b'], 8: ['b', 'l'], 9: ['b', 't'], 10: ['t', 'r', 'b', 'l'], 11: ['b', 'r'], 12: ['r', 'l'], 13: ['r', 't'], 14: ['t', 'l'] }[c];
        for (let k = 0; k < table.length; k += 2) segs.push([e[table[k]], e[table[k + 1]]]);
      }
    // chaînage des segments en polylignes
    const key = (p) => `${Math.round(p[0] * 10)},${Math.round(p[1] * 10)}`;
    const map = new Map();
    segs.forEach((s, idx) => {
      for (const p of s) {
        const k = key(p);
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(idx);
      }
    });
    const used = new Uint8Array(segs.length);
    for (let s0 = 0; s0 < segs.length; s0++) {
      if (used[s0]) continue;
      used[s0] = 1;
      const line = [segs[s0][0], segs[s0][1]];
      for (const dir of [1, -1]) {
        for (;;) {
          const end = dir === 1 ? line[line.length - 1] : line[0];
          const next = (map.get(key(end)) || []).find((ix) => !used[ix]);
          if (next === undefined) break;
          used[next] = 1;
          const [a, b] = segs[next];
          const p = key(a) === key(end) ? b : a;
          if (dir === 1) line.push(p);
          else line.unshift(p);
        }
      }
      if (line.length > 6) out.push({ L, d: pathOf(rdp(line, 1.1)) });
    }
  }
  return { levels, lines: out };
}

await mkdir(OUT, { recursive: true });
const ridges = ridgeSvg('desk') + '\n' + ridgeSvg('mob') + '\n';
await writeFile(join(OUT, 'ridges.svg'), ridges);
const c = contours();
const groups = c.levels
  .map((L, k) => {
    const ds = c.lines.filter((l) => l.L === L).map((l) => l.d).join('');
    return ds ? `<path class="iso iso--${k}${k % 4 === 3 ? ' iso--major' : ''}" d="${ds}"/>` : '';
  })
  .join('');
await writeFile(join(OUT, 'map-contours.svg'), `<g class="map__iso">${groups}</g>\n`);
console.log('ridges.svg', ridges.length, 'octets ; map-contours.svg', groups.length, 'octets,', c.lines.length, 'courbes');

// --- 3. vue éclatée d'une fenêtre (projection oblique) ----------------------
// Coordonnées « monde » : x, y sur le plan du mur, d = profondeur vers l'arrière.
// Vers l'arrière = vers le haut à droite à l'écran ; l'éclaté sort vers l'avant (bas gauche).
const KX = 0.6, KY = 0.35;
const P = (x, y, d) => [x + d * KX, y - d * KY];
const pt = (p) => `${fmt(p[0])} ${fmt(p[1])}`;
const quad = (a, b, c, e) => `M${pt(a)}L${pt(b)}L${pt(c)}L${pt(e)}Z`;
// Anneau (cadre) : rectangle extérieur x0..x1, y0..y1, largeur t, de la profondeur d0 à d1.
function ring({ x0, y0, x1, y1, t, d0, d1, cls, miter = true }) {
  const xi0 = x0 + t, yi0 = y0 + t, xi1 = x1 - t, yi1 = y1 - t;
  const f = (x, y) => P(x, y, d0), b = (x, y) => P(x, y, d1);
  const parts = [];
  // faces visibles derrière la face avant : dessus et côté droit extérieurs, fond et gauche intérieurs
  parts.push(`<path class="f-top" d="${quad(f(x0, y0), f(x1, y0), b(x1, y0), b(x0, y0))}"/>`);
  parts.push(`<path class="f-side" d="${quad(f(x1, y0), f(x1, y1), b(x1, y1), b(x1, y0))}"/>`);
  parts.push(`<path class="f-in-b" d="${quad(f(xi0, yi1), f(xi1, yi1), b(xi1, yi1), b(xi0, yi1))}"/>`);
  parts.push(`<path class="f-in-l" d="${quad(f(xi0, yi0), f(xi0, yi1), b(xi0, yi1), b(xi0, yi0))}"/>`);
  const front = `M${pt(f(x0, y0))}L${pt(f(x1, y0))}L${pt(f(x1, y1))}L${pt(f(x0, y1))}ZM${pt(f(xi0, yi0))}L${pt(f(xi0, yi1))}L${pt(f(xi1, yi1))}L${pt(f(xi1, yi0))}Z`;
  parts.push(`<path class="f-front" fill-rule="evenodd" d="${front}"/>`);
  // tracé de plan (contours) animé
  parts.push(`<path class="f-line" pathLength="1" d="${front}"/>`);
  if (miter) {
    const m = [[x0, y0, xi0, yi0], [x1, y0, xi1, yi0], [x1, y1, xi1, yi1], [x0, y1, xi0, yi1]].map(([a, b2, c, e]) => `M${pt(f(a, b2))}L${pt(f(c, e))}`).join('');
    parts.push(`<path class="f-miter" pathLength="1" d="${m}"/>`);
  }
  return `<g class="${cls}">${parts.join('')}</g>`;
}
function exploded() {
  const g = [];
  // mur et tableau (ouverture), prise de cotes
  const O = { x0: 330, y0: 170, x1: 690, y1: 630 };
  const wall = `M150 70H860V730H150ZM${O.x0} ${O.y0}V${O.y1}H${O.x1}V${O.y0}Z`;
  g.push(`<g class="xw-wall"><path class="w-face" fill-rule="evenodd" d="${wall}"/>`
    + `<path class="w-reveal-b" d="${quad(P(O.x0, O.y1, 0), P(O.x1, O.y1, 0), P(O.x1, O.y1, 120), P(O.x0, O.y1, 120))}"/>`
    + `<path class="w-reveal-l" d="${quad(P(O.x0, O.y0, 0), P(O.x0, O.y1, 0), P(O.x0, O.y1, 120), P(O.x0, O.y0, 120))}"/>`
    + `<path class="w-line" pathLength="1" d="M${O.x0} ${O.y0}V${O.y1}H${O.x1}V${O.y0}Z"/>`
    + `<path class="w-hatch" d="${Array.from({ length: 16 }, (_, i) => `M${150 + i * 44} 730l-26 26`).join('')}"/></g>`);
  g.push(`<g class="xw-cotes">`
    + `<path class="c-line" pathLength="1" d="M${O.x0} 128H${O.x1}M${O.x0} 116v24M${O.x1} 116v24M${O.x0 - 6} 134l12-12M${O.x1 - 6} 134l12-12"/>`
    + `<path class="c-line" pathLength="1" d="M742 ${O.y0}V${O.y1}M730 ${O.y0}h24M730 ${O.y1}h24M736 ${O.y0 + 6}l12-12M736 ${O.y1 + 6}l12-12"/>`
    + `<path class="c-acc" pathLength="1" d="M${O.x0} 128h34"/>`
    + `<text class="c-txt" x="${(O.x0 + O.x1) / 2}" y="108" text-anchor="middle">L · COTE PRISE CHEZ VOUS</text>`
    + `<text class="c-txt" x="772" y="${(O.y0 + O.y1) / 2}" transform="rotate(90 772 ${(O.y0 + O.y1) / 2})" text-anchor="middle">H · SUR MESURE</text></g>`);
  // pièces de la fenêtre, dessinées assemblées (les translations d'éclaté sont posées en JS)
  g.push(`<g class="xw-part" data-part="dormant" data-explode="0">${ring({ x0: 330, y0: 170, x1: 690, y1: 630, t: 32, d0: 40, d1: 100, cls: 'p-dormant' })}<g class="p-label" transform="translate(${pt(P(690, 170, 100))})"><path d="M0 0l40-30h96"/><text x="44" y="-38">DORMANT</text></g></g>`);
  g.push(`<g class="xw-part" data-part="joints" data-explode="80">${ring({ x0: 359, y0: 199, x1: 661, y1: 601, t: 5, d0: 36, d1: 40, cls: 'p-joint', miter: false })}<g class="p-label" transform="translate(${pt(P(359, 199, 36))})"><path d="M0 0l-30-34h-74"/><text x="-104" y="-42">JOINTS</text></g></g>`);
  g.push(`<g class="xw-part" data-part="ouvrant" data-explode="165">${ring({ x0: 350, y0: 190, x1: 670, y1: 610, t: 44, d0: 26, d1: 66, cls: 'p-ouvrant' })}<g class="p-label" transform="translate(${pt(P(350, 300, 26))})"><path d="M0 0l-40-20h-80"/><text x="-120" y="-28">OUVRANT</text></g></g>`);
  g.push(`<g class="xw-part" data-part="vitrage" data-explode="255"><g class="p-vitrage">`
    + `<path class="v-edge" d="${quad(P(394, 234, 40), P(626, 234, 40), P(626, 234, 52), P(394, 234, 52))}"/>`
    + `<path class="v-edge v-edge--side" d="${quad(P(626, 234, 40), P(626, 566, 40), P(626, 566, 52), P(626, 234, 52))}"/>`
    + `<path class="v-pane" d="${quad(P(394, 234, 40), P(626, 234, 40), P(626, 566, 40), P(394, 566, 40))}"/>`
    + `<path class="v-glint" d="M${pt(P(420, 330, 40))}L${pt(P(500, 250, 40))}M${pt(P(436, 360, 40))}L${pt(P(520, 276, 40))}M${pt(P(520, 540, 40))}L${pt(P(600, 460, 40))}"/>`
    + `<path class="f-line" pathLength="1" d="${quad(P(394, 234, 40), P(626, 234, 40), P(626, 566, 40), P(394, 566, 40))}"/></g>`
    + `<g class="p-label" transform="translate(${pt(P(394, 470, 40))})"><path d="M0 0l-40 22h-86"/><text x="-126" y="14">VITRAGE</text></g></g>`);
  g.push(`<g class="xw-part" data-part="cremone" data-explode="0" data-shift="150"><g class="p-cremone">`
    + `<path class="cr-rod" d="M${pt(P(650, 214, 22))}L${pt(P(650, 586, 22))}"/>`
    + `<path class="cr-box" d="${quad(P(643, 380, 22), P(657, 380, 22), P(657, 440, 22), P(643, 440, 22))}"/>`
    + `<path class="cr-bolt" d="${quad(P(645, 206, 22), P(655, 206, 22), P(655, 222, 22), P(645, 222, 22))}${quad(P(645, 578, 22), P(655, 578, 22), P(655, 594, 22), P(645, 594, 22))}"/>`
    + `<path class="f-line" pathLength="1" d="M${pt(P(650, 214, 22))}L${pt(P(650, 586, 22))}"/></g>`
    + `<g class="p-label" transform="translate(${pt(P(650, 214, 22))})"><path d="M0 0l30-26h70"/><text x="34" y="-34">CRÉMONE</text></g></g>`);
  g.push(`<g class="xw-part" data-part="poignee" data-explode="0" data-shift="215"><g class="p-poignee">`
    + `<path class="po-base" d="${quad(P(641, 384, 8), P(659, 384, 8), P(659, 436, 8), P(641, 436, 8))}"/>`
    + `<path class="po-lever" d="M${pt(P(650, 410, 4))}L${pt(P(650, 492, 4))}"/>`
    + `<path class="f-line" pathLength="1" d="M${pt(P(650, 410, 4))}L${pt(P(650, 492, 4))}"/></g>`
    + `<g class="p-label" transform="translate(${pt(P(650, 492, 4))})"><path d="M0 0l26 30h70"/><text x="30" y="52">POIGNÉE</text></g></g>`);
  g.push(`<g class="xw-check"><path class="ck" pathLength="1" d="M${pt(P(690, 630, 40))}m14 18l10 10 22-26"/><text class="c-txt" x="${fmt(P(690, 630, 40)[0] + 56)}" y="${fmt(P(690, 630, 40)[1] + 34)}">RÉGLÉE</text></g>`);
  return `<svg class="xw" viewBox="130 46 780 724" role="img" aria-labelledby="xw-titre"><title id="xw-titre">Vue éclatée d’une fenêtre aluminium : dormant, joints, ouvrant, vitrage, crémone et poignée</title>${g.join('')}</svg>\n`;
}
await writeFile(join(OUT, 'exploded.svg'), exploded());
console.log('exploded.svg ok');
