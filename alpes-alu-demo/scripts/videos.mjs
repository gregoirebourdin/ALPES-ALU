// Vidéos de défilement (WebM) : la page parcourue d'un bout à l'autre, sur ordinateur puis sur téléphone.
// Usage : npm run build && npm run preview (dans un autre terminal), puis npm run videos
// Résultat : docs/videos/defilement-ordinateur.webm et docs/videos/defilement-mobile.webm
import { chromium } from 'playwright';
import { mkdir, rename, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/videos');
const URL = process.env.URL || 'http://localhost:4173/';
const GL = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

async function record(name, { width, height, mobile }) {
  const tmp = join(OUT, `.tmp-${name}`);
  const browser = await chromium.launch({ args: GL });
  const ctx = await browser.newContext({
    viewport: { width, height },
    isMobile: mobile,
    hasTouch: mobile,
    recordVideo: { dir: tmp, size: { width, height } },
  });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'load' });
  // le préchargement se joue, puis un léger mouvement de souris réveille la fenêtre 3D
  await page.mouse.move(width * 0.6, height * 0.45);
  await page.waitForTimeout(1800);
  await page.mouse.move(width * 0.66, height * 0.38, { steps: 12 });
  await page.waitForTimeout(1600);
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  // défilement régulier : la molette sur ordinateur (lissée par Lenis), le défilement natif sur téléphone
  const step = mobile ? 26 : 50;
  let y = 0;
  while (y < total) {
    if (mobile) await page.evaluate((d) => window.scrollBy(0, d), step);
    else await page.mouse.wheel(0, step);
    y += step;
    await page.waitForTimeout(mobile ? 22 : 34);
  }
  await page.waitForTimeout(2000);
  const video = page.video();
  await ctx.close();
  await browser.close();
  const file = join(OUT, `defilement-${name}.webm`);
  await rename(await video.path(), file);
  await rm(tmp, { recursive: true, force: true });
  console.log(`vidéo ${name} : ${file}`);
}

await mkdir(OUT, { recursive: true });
await record('ordinateur', { width: 1280, height: 800, mobile: false });
await record('mobile', { width: 390, height: 844, mobile: true });
