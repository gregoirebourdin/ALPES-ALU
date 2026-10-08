// Étalonnage commun à toutes les photos : lumière froide et nette de montagne,
// noirs profonds, reflets métalliques, jaunes Alpes Alu préservés.
// Travaille sur des tampons RVB 8 bits (sharp .raw()).

const srgbToLin = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const v = i / 255;
  srgbToLin[i] = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
const linToSrgb = (v) => {
  v = v <= 0 ? 0 : v >= 1 ? 1 : v;
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
};

// Courbe en S douce sur valeurs encodées, avec point noir abaissé.
function makeCurve({ contrast = 5.2, black = 0.022, white = 0.985 }) {
  const s = (x) => 1 / (1 + Math.exp(-contrast * (x - 0.5)));
  const s0 = s(0), s1 = s(1);
  return (x) => {
    let y = (s(x) - s0) / (s1 - s0);
    y = 0.62 * y + 0.38 * x; // garde du modelé dans les tons moyens
    y = (y - black) / (white - black);
    return y < 0 ? 0 : y > 1 ? 1 : y;
  };
}

/**
 * @param {Buffer} data RVB entrelacé
 * @param {number} channels 3 ou 4
 * @param {object} o réglages par photo
 */
export function grade(data, channels, o = {}) {
  const {
    exposure = 0, // en IL
    cool = 0.085, // balance vers le froid
    sat = 0.8, // saturation globale
    keepYellow = 0.8, // part de saturation rendue aux jaunes
    greens = 0.72, // les verts saturés des téléphones, calmés
    contrast = 6.2,
    black = 0.03,
    shadowTint = [-0.006, 0.002, 0.016], // ombres vers le bleu acier
    highTint = [0.0, 0.004, 0.01],
  } = o;
  const curve = makeCurve({ contrast, black });
  const lut = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) lut[i] = curve(i / 1023);
  const k = 2 ** exposure;
  const wr = k * (1 - cool * 0.55), wg = k * (1 - cool * 0.12), wb = k * (1 + cool);
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += channels) {
    // linéaire + exposition + balance
    let r = srgbToLin[data[i]] * wr, g = srgbToLin[data[i + 1]] * wg, b = srgbToLin[data[i + 2]] * wb;
    // retour en encodé pour la courbe
    r = lut[Math.min(1023, Math.round(linToSrgb(r) * 1023))];
    g = lut[Math.min(1023, Math.round(linToSrgb(g) * 1023))];
    b = lut[Math.min(1023, Math.round(linToSrgb(b) * 1023))];
    // saturation sélective (jaunes préservés)
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0;
    if (max - min > 1e-4) {
      if (max === r) h = ((g - b) / (max - min) + 6) % 6;
      else if (max === g) h = (b - r) / (max - min) + 2;
      else h = (r - g) / (max - min) + 4;
      h *= 60;
    }
    const dy = (h - 50) / 22;
    const wy = Math.exp(-dy * dy) * (max - min > 0.18 ? 1 : (max - min) / 0.18);
    const dg = (h - 115) / 45;
    const wgr = Math.exp(-dg * dg);
    const s = (sat + (1 - sat) * keepYellow * wy) * (1 - (1 - greens) * wgr);
    const Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = Y + (r - Y) * s;
    g = Y + (g - Y) * s;
    b = Y + (b - Y) * s;
    // virage : ombres acier, hautes lumières froides
    const sh = (1 - Y) * (1 - Y), hi = Y * Y;
    r += shadowTint[0] * sh + highTint[0] * hi;
    g += shadowTint[1] * sh + highTint[1] * hi;
    b += shadowTint[2] * sh + highTint[2] * hi;
    out[i] = Math.max(0, Math.min(255, Math.round(r * 255)));
    out[i + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
    out[i + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
    if (channels === 4) out[i + 3] = data[i + 3];
  }
  return out;
}

// Duotone graphite → jaune Alpes Alu pour les sections sombres : les ombres et
// les tons moyens restent dans le graphite, seul le haut de l'échelle vire au
// jaune, comme une lumière d'atelier.
export function duotone(data, channels, { dark = [18, 20, 23], mid = [58, 63, 70], light = [244, 210, 13], knee = 0.66 } = {}) {
  const out = Buffer.alloc(data.length);
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  for (let i = 0; i < data.length; i += channels) {
    const Y = 0.2126 * srgbToLin[data[i]] + 0.7152 * srgbToLin[data[i + 1]] + 0.0722 * srgbToLin[data[i + 2]];
    const t = linToSrgb(Y);
    const a = smooth(0, knee, t), b = smooth(knee - 0.08, 1, t);
    for (let c = 0; c < 3; c++) {
      const lo = dark[c] + (mid[c] - dark[c]) * a;
      out[i + c] = Math.round(lo + (light[c] - lo) * b);
    }
    if (channels === 4) out[i + 3] = data[i + 3];
  }
  return out;
}
