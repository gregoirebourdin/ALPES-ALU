// Fenêtre aluminium en 3D temps réel (OGL, WebGL 2).
// Géométrie modélisée en code : chaque cadre est une section de profilé balayée
// le long d'un rectangle, onglets à 45° compris. Matières : alu anodisé brossé
// (reflets anisotropes, environnement tiré d'une vraie photo de montagne) et
// verre qui réfracte la photo du hero.
import { Renderer, Camera, Transform, Program, Mesh, Geometry, Texture } from 'ogl';
import type { HeroScene } from './hero';

type V2 = [number, number];

const W = 1.0;
const H = 0.7;

/* ---------- géométrie ---------- */
// Section (u : retrait depuis le bord extérieur, v : profondeur vers l'avant), sens antihoraire.
const SECTION_DORMANT: V2[] = [
  [0, -0.036], [0.064, -0.036], [0.064, -0.012], [0.056, -0.012], [0.056, -0.004], [0.05, -0.004],
  [0.05, 0.016], [0.043, 0.016], [0.043, 0.032], [0.039, 0.036], [0.005, 0.036], [0, 0.031],
];
const SECTION_OUVRANT: V2[] = [
  [0, -0.018], [0.05, -0.018], [0.05, -0.004], [0.045, -0.004], [0.045, 0.012], [0.041, 0.016], [0.006, 0.016], [0, 0.011],
];
const SECTION_JOINT: V2[] = [
  [0, -0.004], [0.006, -0.004], [0.006, 0.004], [0, 0.004],
];

function ensureCCW(sec: V2[]): V2[] {
  let a = 0;
  for (let i = 0; i < sec.length; i++) {
    const [x1, y1] = sec[i], [x2, y2] = sec[(i + 1) % sec.length];
    a += x1 * y2 - x2 * y1;
  }
  return a > 0 ? sec : [...sec].reverse();
}

type Buffers = { pos: number[]; nor: number[]; uv: number[]; tan: number[] };

function pushQuad(b: Buffers, p: number[][], n: number[], t: number[], uvs: number[][]) {
  const idx = [0, 1, 2, 0, 2, 3];
  for (const i of idx) {
    b.pos.push(...p[i]);
    b.nor.push(...n);
    b.tan.push(...t);
    b.uv.push(...uvs[i]);
  }
}

/** Balaye une section le long d'un rectangle centré (largeur w, hauteur h), à la profondeur z0. */
function sweepRing(b: Buffers, sec: V2[], w: number, h: number, z0 = 0, cx = 0, cy = 0) {
  const s = ensureCCW(sec);
  const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2;
  // côtés : point du coin (u) et axes ; dir = direction de la barre, inw = vers l'intérieur
  const sides = [
    { a: (u: number) => [x0 + u, y1 - u], b: (u: number) => [x1 - u, y1 - u], inw: [0, -1], dir: [1, 0] }, // haut
    { a: (u: number) => [x1 - u, y1 - u], b: (u: number) => [x1 - u, y0 + u], inw: [-1, 0], dir: [0, -1] }, // droite
    { a: (u: number) => [x1 - u, y0 + u], b: (u: number) => [x0 + u, y0 + u], inw: [0, 1], dir: [-1, 0] }, // bas
    { a: (u: number) => [x0 + u, y0 + u], b: (u: number) => [x0 + u, y1 - u], inw: [1, 0], dir: [0, 1] }, // gauche
  ];
  let acc = 0;
  for (let i = 0; i < s.length; i++) {
    const [ua, va] = s[i];
    const [ub, vb] = s[(i + 1) % s.length];
    const du = ub - ua, dv = vb - va;
    const len = Math.hypot(du, dv) || 1;
    // normale sortante dans le plan de la section
    const nu = dv / len, nv = -du / len;
    for (const sd of sides) {
      const pa0 = sd.a(ua), pb0 = sd.b(ua), pa1 = sd.a(ub), pb1 = sd.b(ub);
      const P = [
        [pa0[0] + cx, pa0[1] + cy, va + z0],
        [pb0[0] + cx, pb0[1] + cy, va + z0],
        [pb1[0] + cx, pb1[1] + cy, vb + z0],
        [pa1[0] + cx, pa1[1] + cy, vb + z0],
      ];
      const n = [sd.inw[0] * nu, sd.inw[1] * nu, nv];
      const t = [sd.dir[0], sd.dir[1], 0];
      const L = Math.hypot(pb0[0] - pa0[0], pb0[1] - pa0[1]);
      pushQuad(b, P, n, t, [[0, acc], [L, acc], [L, acc + len], [0, acc + len]]);
    }
    acc += len;
  }
}

function boxInto(b: Buffers, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) {
  const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
  const faces: [number[][], number[], number[]][] = [
    [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], [0, 1, 0]],
    [[[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], [0, 1, 0]],
    [[[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], [0, 1, 0]],
    [[[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], [0, 1, 0]],
    [[[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [0, 1, 0], [1, 0, 0]],
    [[[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], [1, 0, 0]],
  ];
  for (const [p, n, t] of faces) pushQuad(b, p, n, t, [[0, 0], [sx, 0], [sx, sy], [0, sy]]);
}

function toGeometry(gl: Renderer['gl'], b: Buffers) {
  return new Geometry(gl, {
    position: { size: 3, data: new Float32Array(b.pos) },
    normal: { size: 3, data: new Float32Array(b.nor) },
    uv: { size: 2, data: new Float32Array(b.uv) },
    tangent: { size: 3, data: new Float32Array(b.tan) },
  });
}
const buffers = (): Buffers => ({ pos: [], nor: [], uv: [], tan: [] });

/* ---------- shaders ---------- */
const VERT = /* glsl */ `#version 300 es
in vec3 position;
in vec3 normal;
in vec2 uv;
in vec3 tangent;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec3 vN;
out vec3 vT;
out vec3 vW;
out vec2 vUv;
out float vZ;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vZ = position.z;
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vT = normalize(mat3(modelMatrix) * tangent);
  vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const COMMON = /* glsl */ `
#define PI 3.14159265
vec2 eq(vec3 d) {
  return vec2(0.5 + atan(d.x, d.z) / (2.0 * PI), 0.5 + asin(clamp(d.y, -1.0, 1.0)) / PI);
}
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
`;

const METAL_FRAG = /* glsl */ `#version 300 es
precision highp float;
${COMMON}
uniform sampler2D tEnv;
uniform vec3 cameraPosition;
uniform vec3 uColor;
uniform vec3 uLight;
uniform float uRough;
uniform float uBrush;
uniform float uOpacity;
uniform float uSheen;
uniform float uHorizon;
uniform float uHorizonY;
uniform float uAO;
in vec3 vN;
in vec3 vT;
in vec3 vW;
in vec2 vUv;
in float vZ;
out vec4 fragColor;
void main() {
  vec3 N = normalize(vN);
  vec3 T = normalize(vT - N * dot(vT, N));
  vec3 B = normalize(cross(N, T));
  vec3 V = normalize(cameraPosition - vW);
  // brossage : stries fines et passes plus larges, dans le sens du profilé
  float s = vUv.y * 2600.0;
  float stri = mix(h11(floor(s)), h11(floor(s * 0.37) + 7.0), 0.45);
  float pass = h11(floor(vUv.y * 340.0) + 3.0);
  N = normalize(N + B * (stri - 0.5) * uBrush);
  vec3 R = reflect(-V, N);
  float lod = uRough * 7.0;
  vec3 env = textureLod(tEnv, eq(R), lod).rgb * 0.5;
  env += textureLod(tEnv, eq(normalize(R + T * 0.16)), lod + 0.6).rgb * 0.25;
  env += textureLod(tEnv, eq(normalize(R - T * 0.16)), lod + 0.6).rgb * 0.25;
  env = pow(env, vec3(2.2));
  // horizon de studio : ciel clair au-dessus, sol sombre au-dessous (lecture métal franche)
  float hz = smoothstep(uHorizonY - 0.1, uHorizonY + 0.14, R.y);
  env = mix(env, mix(vec3(0.03, 0.035, 0.04), vec3(0.92, 0.95, 1.0), hz), uHorizon);
  float NoV = clamp(dot(N, V), 0.0, 1.0);
  vec3 F = uColor + (1.0 - uColor) * pow(1.0 - NoV, 5.0);
  // reflet allongé (anisotrope, type Ward) de la lumière principale
  vec3 L = normalize(uLight);
  vec3 Hh = normalize(L + V);
  float hn = max(dot(Hh, N), 1e-3);
  float ht = dot(Hh, T), hb = dot(Hh, B);
  float ax = 0.07, ay = 0.36;
  float ward = exp(-2.0 * ((ht * ht) / (ax * ax) + (hb * hb) / (ay * ay)) / (1.0 + hn));
  float NoL = clamp(dot(N, L), 0.0, 1.0);
  vec3 col = env * F * 1.25 + ward * NoL * vec3(1.0, 0.97, 0.92) * 1.6 * F;
  // lumière de remplissage froide, et assombrissement des faces arrière
  col += uColor * 0.035 * vec3(0.8, 0.9, 1.0);
  col *= mix(0.42, 1.0, smoothstep(-0.6, 0.4, dot(N, vec3(0.0, 0.25, 1.0))));
  col += uSheen * ward * 0.4;
  col *= 0.95 + 0.05 * stri + 0.06 * pass;
  // occlusion des feuillures : plus la face est en retrait, plus elle s'assombrit
  col *= mix(1.0 - uAO, 1.0, smoothstep(-0.03, 0.03, vZ));
  col = aces(col * 1.15);
  fragColor = vec4(pow(col, vec3(1.0 / 2.2)), uOpacity);
}`;

const GLASS_FRAG = /* glsl */ `#version 300 es
precision highp float;
${COMMON}
uniform sampler2D tEnv;
uniform sampler2D tPhoto;
uniform vec3 cameraPosition;
uniform vec2 uRes;
uniform float uPhotoAspect;
uniform float uZoom;
uniform float uOpacity;
uniform float uTime;
uniform vec2 uPointer;
uniform float uFlipY;
uniform vec3 uTint;
uniform float uRefl;
uniform float uSky;
uniform float uBand;
uniform float uRefr;
uniform float uFres;
in vec3 vN;
in vec3 vT;
in vec3 vW;
in vec2 vUv;
out vec4 fragColor;
vec2 coverUv(vec2 s) {
  // s : coordonnées écran 0-1, origine en haut à gauche ; zoom autour de (0,5 ; 0,42) comme en CSS
  vec2 o = vec2(0.5, 0.42);
  s = (s - o) / uZoom + o;
  float boxA = uRes.x / uRes.y;
  vec2 uv = s;
  if (boxA > uPhotoAspect) uv.y = 0.5 + (s.y - 0.5) * (uPhotoAspect / boxA);
  else uv.x = 0.5 + (s.x - 0.5) * (boxA / uPhotoAspect);
  return vec2(uv.x, mix(uv.y, 1.0 - uv.y, uFlipY));
}
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec2 s = gl_FragCoord.xy / uRes;
  s.y = 1.0 - s.y;
  // réfraction : petit décalage lié à l'inclinaison et une légère onde de verre étiré
  vec2 q = vUv;
  float wave = sin(q.y * 9.0 + q.x * 3.0) * 0.0016 + sin(q.x * 23.0) * 0.0006;
  vec2 off = (N.xy * 0.035 + vec2(wave, wave * 0.6)) * vec2(1.0, -1.0) * uRefr;
  vec3 refr;
  refr.r = texture(tPhoto, coverUv(s + off * 1.06)).r;
  refr.g = texture(tPhoto, coverUv(s + off)).g;
  refr.b = texture(tPhoto, coverUv(s + off * 0.92)).b;
  // teinte glacier, un peu plus dense vers les bords
  vec2 e = abs(q - 0.5) * 2.0;
  float edge = smoothstep(0.82, 1.0, max(e.x, e.y));
  refr *= mix(uTint, uTint * vec3(0.84, 0.9, 0.92), edge);
  // reflet de la montagne (Fresnel), plus présent vers le haut du vitrage (le ciel)
  vec3 R = reflect(-V, N);
  vec3 env = textureLod(tEnv, eq(R), 0.8).rgb;
  float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
  float sky = smoothstep(0.3, 1.0, q.y) * uSky;
  vec3 col = mix(refr, env, clamp(F * uFres + uRefl + sky, 0.0, 1.0));
  // reflet qui glisse lentement sur le vitrage
  // uTime porte la phase du reflet (scroll et souris) : rien ne bouge, rien ne se redessine
  float d = (q.x * 0.75 + q.y * 0.55) - fract(uTime) * 2.6 + 0.6;
  float band = smoothstep(0.0, 0.015, d) * (1.0 - smoothstep(0.16, 0.18, d));
  float band2 = smoothstep(0.24, 0.25, d) * (1.0 - smoothstep(0.29, 0.30, d));
  col += vec3(0.96, 0.98, 1.0) * (band * uBand + band2 * uBand * 0.6);
  fragColor = vec4(col, uOpacity);
}`;

const RUBBER_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform float uOpacity;
uniform vec3 cameraPosition;
in vec3 vN;
in vec3 vW;
in vec3 vT;
in vec2 vUv;
out vec4 fragColor;
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float r = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
  fragColor = vec4(vec3(0.05, 0.055, 0.06) + r * 0.08, uOpacity);
}`;

/* ---------- scène ---------- */
export async function createHeroScene(hero: HTMLElement, canvas: HTMLCanvasElement, box: HTMLElement): Promise<HeroScene | null> {
  const renderer = new Renderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false, dpr: 1, webgl: 2, powerPreference: 'high-performance' });
  const gl = renderer.gl;
  if (!(gl as WebGL2RenderingContext).texStorage2D) return null;
  gl.clearColor(0, 0, 0, 0);

  const camera = new Camera(gl, { fov: 28, near: 0.1, far: 40 });
  camera.position.set(0, 0, 3.2);
  const scene = new Transform();
  const group = new Transform();
  group.setParent(scene);

  // textures : environnement (vraie photo de montagne) et photo du hero
  const loadImg = (src: string) =>
    new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = src;
    });
  const heroImg = hero.querySelector<HTMLImageElement>('.hero__img')!;
  const photoSrc = heroImg.currentSrc || heroImg.src;
  const [envImg, photoImg] = await Promise.all([loadImg('img/env-montagne.jpg'), loadImg(photoSrc)]);
  const tEnv = new Texture(gl, { image: envImg, generateMipmaps: true, minFilter: gl.LINEAR_MIPMAP_LINEAR, wrapS: gl.REPEAT, wrapT: gl.CLAMP_TO_EDGE });
  const tPhoto = new Texture(gl, { image: photoImg, generateMipmaps: false, minFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE });

  const light = [-0.55, 0.75, 0.62];
  const alu = [0.57, 0.59, 0.62];
  const metal = (color = alu, rough = 0.18) =>
    new Program(gl, {
      vertex: VERT,
      fragment: METAL_FRAG,
      cullFace: false,
      transparent: true,
      uniforms: {
        tEnv: { value: tEnv },
        uColor: { value: color },
        uLight: { value: light },
        uRough: { value: rough },
        uBrush: { value: 0.05 },
        uOpacity: { value: 1 },
        uSheen: { value: 0 },
        uHorizon: { value: 0.6 },
        uHorizonY: { value: 0.1 },
        uAO: { value: 0.45 },
      },
    });
  const frameProg = metal();
  const sashProg = metal([0.55, 0.57, 0.6], 0.2);
  const handleProg = metal([0.16, 0.17, 0.19], 0.42);
  const rubberProg = new Program(gl, { vertex: VERT, fragment: RUBBER_FRAG, cullFace: false, transparent: true, uniforms: { uOpacity: { value: 1 } } });
  const glassUniforms = {
    tEnv: { value: tEnv },
    tPhoto: { value: tPhoto },
    uRes: { value: [1, 1] },
    uPhotoAspect: { value: photoImg.naturalWidth / photoImg.naturalHeight },
    uZoom: { value: 1.08 },
    uOpacity: { value: 1 },
    uTime: { value: 0 },
    uPointer: { value: [0, 0] },
    uFlipY: { value: 1 },
    uTint: { value: [0.88, 0.93, 0.95] },
    uRefl: { value: 0.1 },
    uSky: { value: 0.14 },
    uBand: { value: 0.08 },
    uRefr: { value: 1 },
    uFres: { value: 1.6 },
  };
  const glassProg = new Program(gl, { vertex: VERT, fragment: GLASS_FRAG, cullFace: false, transparent: true, depthWrite: false, uniforms: glassUniforms });
  // « air » : la vue non voilée dans l'ouverture du dormant, révélée quand le vantail coulisse
  const airUniforms = { ...glassUniforms, uTint: { value: [1, 1, 1] }, uRefl: { value: 0 }, uSky: { value: 0 }, uBand: { value: 0 }, uRefr: { value: 0 }, uFres: { value: 0 } };
  const airProg = new Program(gl, { vertex: VERT, fragment: GLASS_FRAG, cullFace: false, transparent: true, depthWrite: false, uniforms: airUniforms });

  // dormant (cadre fixe)
  const bD = buffers();
  sweepRing(bD, SECTION_DORMANT, W, H, 0);
  const dormant = new Mesh(gl, { geometry: toGeometry(gl, bD), program: frameProg });
  dormant.setParent(group);
  {
    const aw = W - 2 * 0.05, ah = H - 2 * 0.05, z = -0.03;
    const ba = buffers();
    pushQuad(ba, [[-aw / 2, -ah / 2, z], [aw / 2, -ah / 2, z], [aw / 2, ah / 2, z], [-aw / 2, ah / 2, z]], [0, 0, 1], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const air = new Mesh(gl, { geometry: toGeometry(gl, ba), program: airProg });
    air.renderOrder = 5;
    air.setParent(group);
  }

  // ouvrants : rail arrière (gauche) et rail avant (droite, celui qui coulisse)
  const sashW = (W - 2 * 0.05) / 2 + 0.022;
  const sashH = H - 2 * 0.05;
  const makeSash = (cx: number, z: number, withHandle: boolean) => {
    const g = new Transform();
    g.position.set(cx, 0, z);
    const b = buffers();
    sweepRing(b, SECTION_OUVRANT, sashW, sashH, 0);
    new Mesh(gl, { geometry: toGeometry(gl, b), program: sashProg }).setParent(g);
    const bj = buffers();
    sweepRing(bj, SECTION_JOINT, sashW - 0.09 + 0.006, sashH - 0.09 + 0.006, -0.002);
    new Mesh(gl, { geometry: toGeometry(gl, bj), program: rubberProg }).setParent(g);
    // vitrage
    const gw = sashW - 0.09, gh = sashH - 0.09;
    const bg = buffers();
    pushQuad(bg, [[-gw / 2, -gh / 2, -0.004], [gw / 2, -gh / 2, -0.004], [gw / 2, gh / 2, -0.004], [-gw / 2, gh / 2, -0.004]], [0, 0, 1], [1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    const glass = new Mesh(gl, { geometry: toGeometry(gl, bg), program: glassProg });
    glass.setParent(g);
    glass.renderOrder = 10;
    if (withHandle) {
      const bh = buffers();
      const hx = -sashW / 2 + 0.024;
      boxInto(bh, hx, 0, 0.024, 0.016, 0.1, 0.014);
      boxInto(bh, hx, -0.05, 0.036, 0.011, 0.11, 0.012);
      new Mesh(gl, { geometry: toGeometry(gl, bh), program: handleProg }).setParent(g);
    }
    g.setParent(group);
    return g;
  };
  makeSash(-(W / 2 - 0.05) + sashW / 2, -0.006, false);
  const sashR = makeSash(W / 2 - 0.05 - sashW / 2, 0.014, true);
  const sashRx0 = sashR.position.x;

  /* --- placement : la fenêtre recouvre exactement la boîte CSS .hero__window --- */
  let layout = { x: 0, y: 0, s: 1 };
  const stage = (canvas.parentElement as HTMLElement) || hero;
  const resize = () => {
    const r = stage.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    const ideal = Math.min(window.devicePixelRatio || 1, 1.75);
    const dpr = Math.min(ideal, Math.sqrt(3.4e6 / (w * h)));
    renderer.dpr = dpr;
    renderer.setSize(w, h);
    camera.perspective({ aspect: w / h });
    glassUniforms.uRes.value = [gl.canvas.width, gl.canvas.height];
    const b = box.getBoundingClientRect();
    const vis = 2 * camera.position.z * Math.tan(((camera.fov as number) * Math.PI) / 360);
    const k = vis / h;
    layout = {
      s: (b.height * k) / H,
      x: (b.left - r.left + b.width / 2 - w / 2) * k,
      y: -(b.top - r.top + b.height / 2 - h / 2) * k,
    };
    dirty = true;
  };

  /* --- état piloté --- */
  let progress = 0;
  let tx = 0, ty = 0, cx = 0, cy = 0;
  let dirty = true;
  let raf = 0;
  let visible = true;
  const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const range = (t: number, a: number, b: number) => Math.min(1, Math.max(0, (t - a) / (b - a)));

  // rendu à la demande : seulement si la progression, la souris ou la taille ont changé
  const frame = () => {
    raf = requestAnimationFrame(frame);
    const moving = Math.abs(tx - cx) > 1e-4 || Math.abs(ty - cy) > 1e-4;
    if (!visible || (!dirty && !moving)) return;
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    const slide = easeInOut(range(progress, 0.02, 0.42));
    const recede = range(progress, 0.42, 1);
    const fade = range(progress, 0.6, 0.95);
    sashR.position.x = sashRx0 - 0.418 * slide;
    const r2 = recede * recede;
    group.position.set(layout.x + cx * 0.012, layout.y + 0.12 * recede * layout.s, -1.6 * r2);
    group.scale.set(layout.s);
    group.rotation.set(-cy * 0.052 + 0.02, cx * 0.07 - 0.12 * (1 - recede) + 0.05, 0);
    const op = 1 - fade;
    frameProg.uniforms.uOpacity.value = op;
    sashProg.uniforms.uOpacity.value = op;
    handleProg.uniforms.uOpacity.value = op;
    rubberProg.uniforms.uOpacity.value = op;
    glassUniforms.uOpacity.value = op;
    glassUniforms.uTime.value = 0.32 + progress * 0.9 + cx * 0.08;
    glassUniforms.uPointer.value = [cx, cy];
    if (op <= 0.001) {
      if (dirty) {
        renderer.render({ scene: new Transform(), camera });
        dirty = false;
      }
      return;
    }
    renderer.render({ scene, camera });
    dirty = false;
  };

  if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__hero3d = { frameProg, sashProg, handleProg, glassUniforms, light, render: () => (dirty = true) };

  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 });
  io.observe(hero);
  resize();
  raf = requestAnimationFrame(frame);

  canvas.addEventListener('webglcontextlost', () => {
    cancelAnimationFrame(raf);
    hero.classList.remove('gl-on');
  });

  return {
    setProgress: (p) => {
      progress = p;
      dirty = true;
    },
    setZoom: (z) => {
      glassUniforms.uZoom.value = z;
    },
    setPointer: (x, y) => {
      tx = x;
      ty = y;
    },
    resize,
    destroy: () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
