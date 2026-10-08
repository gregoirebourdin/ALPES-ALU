// Génère les images de la page : étalonnage, recadrages, AVIF + WebP en
// 640 / 1280 / 1920 / 2560 px (sans agrandir l'original), LQIP en ligne,
// variantes duotone et mobile, environnement de reflets du hero, image Open Graph.
// Usage : node scripts/build-images.mjs [--force]
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHOTOS, ENV, WIDTHS } from './photos.config.mjs';
import { grade, duotone } from './lib/grade.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'assets/raw');
const OUT = join(ROOT, 'public/img/photos');
const GEN = join(ROOT, 'src/generated');
const FORCE = process.argv.includes('--force');
sharp.concurrency(4);

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function loadGraded(src, crop, g = {}) {
  let img = sharp(join(RAW, src), { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  // dimensions après rotation EXIF
  const swap = (meta.orientation || 1) >= 5;
  const W = swap ? meta.height : meta.width;
  const H = swap ? meta.width : meta.height;
  if (crop) {
    const [x, y, w, h] = crop;
    img = sharp(await img.toBuffer()).extract({
      left: Math.round(x * W),
      top: Math.round(y * H),
      width: Math.round(w * W),
      height: Math.round(h * H),
    });
  }
  const { data, info } = await img.removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
  return { data: grade(data, 3, g), info };
}

function widthsFor(w) {
  const list = WIDTHS.filter((x) => x <= w);
  const max = list[list.length - 1] || 0;
  if (w - max > 120 && w < WIDTHS[WIDTHS.length - 1]) list.push(w);
  if (!list.length) list.push(w);
  return list;
}

async function encodeSet(id, buf, info, widths, { sharpen = 0.5 } = {}) {
  const jobs = [];
  for (const w of widths) {
    const base = sharp(buf, { raw: info }).resize(w, null, { kernel: 'lanczos3' }).sharpen({ sigma: w <= 640 ? 0.4 : sharpen });
    jobs.push(base.clone().avif({ quality: w >= 1920 ? 48 : 52, effort: 4, chromaSubsampling: '4:2:0' }).toFile(join(OUT, `${id}-${w}.avif`)));
    jobs.push(base.clone().webp({ quality: 76, effort: 5, smartSubsample: true }).toFile(join(OUT, `${id}-${w}.webp`)));
  }
  await Promise.all(jobs);
}

async function lqip(buf, info) {
  const small = await sharp(buf, { raw: info }).resize(32, null).blur(0.8).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${small.toString('base64')}`;
}

async function dominant(buf, info) {
  const { dominant: d } = await sharp(buf, { raw: info }).resize(64).stats();
  return `#${[d.r, d.g, d.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await mkdir(GEN, { recursive: true });
  const cacheFile = join(ROOT, 'node_modules/.cache/images.json');
  let cache = {};
  try {
    cache = JSON.parse(await readFile(cacheFile, 'utf8'));
  } catch {}
  const gradeSrc = await readFile(join(ROOT, 'scripts/lib/grade.mjs'), 'utf8');
  const out = {};
  for (const p of PHOTOS) {
    const key = createHash('sha1').update(JSON.stringify(p) + gradeSrc + 'v3').digest('hex');
    if (!FORCE && cache[p.id]?.key === key && (await exists(join(OUT, `${p.id}-640.webp`)))) {
      out[p.id] = cache[p.id].meta;
      continue;
    }
    const t0 = Date.now();
    const { data, info } = await loadGraded(p.src, p.crop, p.grade);
    const widths = widthsFor(info.width);
    await encodeSet(p.id, data, info, widths);
    const meta = {
      alt: p.alt,
      w: info.width,
      h: info.height,
      widths,
      lqip: await lqip(data, info),
      color: await dominant(data, info),
    };
    if (p.credit) meta.credit = p.credit;
    if (p.mobile) {
      const m = await loadGraded(p.src, p.mobile, p.grade);
      const mw = widthsFor(m.info.width);
      await encodeSet(`${p.id}-m`, m.data, m.info, mw);
      meta.mobile = { w: m.info.width, h: m.info.height, widths: mw, lqip: await lqip(m.data, m.info) };
    }
    if (p.duotone) {
      const d = duotone(data, 3);
      const dw = widthsFor(info.width).filter((w) => w <= 1920);
      await encodeSet(`${p.id}-duo`, d, info, dw, { sharpen: 0.3 });
      meta.duotone = dw;
    }
    out[p.id] = meta;
    cache[p.id] = { key, meta };
    console.log(`${p.id.padEnd(18)} ${String(info.width).padStart(4)}×${String(info.height).padEnd(4)} ${widths.join('/')}  ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }

  // Environnement de reflets : demi-panorama mis en miroir (raccord invisible), légèrement flouté pour un métal satiné.
  {
    const { data, info } = await loadGraded(ENV.src, ENV.crop, { contrast: 5, sat: 0.7 });
    const half = await sharp(data, { raw: info }).resize(ENV.width / 2, ENV.height, { fit: 'fill' }).raw().toBuffer();
    const mirror = await sharp(half, { raw: { width: ENV.width / 2, height: ENV.height, channels: 3 } }).flop().raw().toBuffer();
    const row = (ENV.width / 2) * 3;
    const pano = Buffer.alloc(ENV.width * ENV.height * 3);
    for (let y = 0; y < ENV.height; y++) {
      half.copy(pano, y * row * 2, y * row, (y + 1) * row);
      mirror.copy(pano, y * row * 2 + row, y * row, (y + 1) * row);
    }
    const raw = { raw: { width: ENV.width, height: ENV.height, channels: 3 } };
    await sharp(pano, raw).blur(1.2).jpeg({ quality: 78, mozjpeg: true }).toFile(join(ROOT, 'public/img/env-montagne.jpg'));
  }

  // Image de partage 1200 × 630 : la photo du hero, un dégradé et le logo clair.
  {
    const hero = PHOTOS.find((p) => p.id === 'hero');
    const { data, info } = await loadGraded(hero.src, [0, 0.08, 1, 0.72]);
    const logo = await sharp(join(ROOT, 'src/assets/logo/logo-alpes-alu-blanc.svg'), { density: 300 }).resize(420).png().toBuffer();
    const shade = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121417" stop-opacity="0.15"/><stop offset="0.55" stop-color="#121417" stop-opacity="0.25"/><stop offset="1" stop-color="#121417" stop-opacity="0.9"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/><path d="M64 566 H408 L424 556" stroke="#F4D20D" stroke-width="6" fill="none"/></svg>`,
    );
    await sharp(data, { raw: info })
      .resize(1200, 630, { fit: 'cover', position: 'centre' })
      .composite([{ input: shade }, { input: logo, left: 64, top: 410 }])
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(join(ROOT, 'public/og-alpes-alu.jpg'));
  }

  await mkdir(dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, JSON.stringify(cache));
  await writeFile(join(GEN, 'photos.json'), JSON.stringify(out, null, 1));
  console.log(`photos.json : ${Object.keys(out).length} photos`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
