// Captures de contrôle : page complète à chaque largeur cible, puis les cinq moments clés en mouvement.
// Usage : npm run build && npm run preview (dans un autre terminal), puis npm run screens
// Options : URL=http://localhost:4173/ WIDTHS=360,1440 node scripts/screens.mjs
//
// Les pages complètes sont prises en « mouvement réduit » : tout le contenu est en place, sans épinglage.
// Elles sont capturées par tranches d'un écran puis recollées (Chromium ne sait pas capturer une page
// de 25 000 px d'un seul tenant).
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/screens');
const URL = process.env.URL || 'http://localhost:4173/';
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

// largeur, hauteur, nom ; « paysage » = téléphone tourné
const SIZES = [
  [360, 780], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440], [844, 390, 'paysage-844x390'],
].filter(([w]) => !process.env.WIDTHS || process.env.WIDTHS.split(',').includes(String(w)));

const touch = (w, h) => w < 1024 || h < 500;

async function fullPage(browser, w, h, name) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce', isMobile: touch(w, h) && w < 1024, hasTouch: touch(w, h) });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL, { waitUntil: 'load' });
  // toutes les images, y compris celles chargées en différé
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'));
    await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r)))));
  });
  await page.waitForTimeout(600);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const slices = [];
  for (let y = 0, k = 0; y < total; y += h, k++) {
    await page.evaluate(([y, k]) => {
      window.scrollTo(0, y);
      document.documentElement.classList.toggle('shot-rest', k > 0);
    }, [y, k]);
    if (k === 1) await page.addStyleTag({ content: 'html.shot-rest .site-header, html.shot-rest .tape, html.shot-rest .cursor { visibility: hidden !important; }' });
    await page.waitForTimeout(250);
    slices.push({ buf: await page.screenshot({ type: 'png' }), top: await page.evaluate(() => window.scrollY) });
  }
  const composite = slices.map((s) => ({ input: s.buf, left: 0, top: Math.min(s.top, total - h) }));
  const big = await sharp({ create: { width: w, height: total, channels: 3, background: '#ffffff' }, limitInputPixels: false }).composite(composite).png().toBuffer();
  // largeur réelle jusqu'à 1440, réduite au-delà pour garder des fichiers raisonnables
  const outW = Math.min(w, 1440);
  const file = join(OUT, `page-${name || w}.jpg`);
  await sharp(big, { limitInputPixels: false }).resize(outW).jpeg({ quality: 72, mozjpeg: true }).toFile(file);
  console.log(`page ${name || w}×${h} : ${total} px, ${slices.length} tranches${errors.length ? ' — erreurs : ' + errors.join(' | ') : ''}`);
  await ctx.close();
}

// Les cinq moments, en mouvement : fenêtre du hero, vue éclatée, volet roulant, mur de l'atelier, cornière → bouton.
async function moments(browser, w, h, tag) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 1024 });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  await page.mouse.move(w * 0.62, h * 0.4);
  await page.mouse.move(w * 0.64, h * 0.42);
  await page.waitForTimeout(3600);
  const at = async (sel, frac = 0) =>
    page.evaluate(([sel, frac]) => {
      const el = document.querySelector(sel);
      return el.getBoundingClientRect().top + scrollY + frac * el.offsetHeight;
    }, [sel, frac]);
  const shot = async (name, y, wait = 1400) => {
    await page.evaluate((y) => window.scrollTo(0, y), Math.round(y));
    await page.waitForTimeout(wait);
    await page.screenshot({ path: join(OUT, `moment-${tag}-${name}.jpg`), type: 'jpeg', quality: 80 });
  };
  await shot('1-fenetre-repos', 0, 600);
  await shot('1-fenetre-ouverte', h * (w >= 1024 ? 0.5 : 0.25));
  await shot('2-vue-eclatee', await at('.assemblage', 0.45));
  await shot('3-volet-roulant', (await at('.atelier')) - h * 0.55, 900);
  await shot('4-mur-atelier', await at('.atelier .wall', w >= 1024 ? 0.1 : 0.05));
  const cta = await at('.appel');
  await page.evaluate(([y, off]) => window.scrollTo(0, y - off), [cta, h * 0.2]);
  await page.waitForTimeout(700);
  await shot('5-corniere-bouton', cta, 2800);
  console.log(`moments ${tag} ok`);
  await ctx.close();
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: GL });
// ONLY=moments : seulement les moments ; ONLY=pages : seulement les pages complètes
if (process.env.ONLY !== 'moments') for (const [w, h, name] of SIZES) await fullPage(browser, w, h, name);
if (!process.env.WIDTHS && process.env.ONLY !== 'pages') {
  await moments(browser, 1440, 900, 'ordinateur');
  await moments(browser, 390, 844, 'mobile');
}
await browser.close();
