// Télécharge les polices depuis Google Fonts (sous-ensemble latin, WOFF2)
// pour les auto-héberger dans public/fonts/.
// Usage : node scripts/fetch-fonts.mjs
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/fonts');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

const FAMILIES = [
  { css: 'Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900', name: 'archivo' },
  { css: 'Instrument+Sans:ital,wdth,wght@0,75..100,400..700', name: 'instrument-sans' },
  { css: 'IBM+Plex+Mono:wght@300;400;500', name: 'ibm-plex-mono' },
];

await mkdir(OUT, { recursive: true });
for (const f of FAMILIES) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${f.css}&display=swap`, { headers: { 'user-agent': UA } })).text();
  const blocks = css.split('/* ').slice(1);
  for (const b of blocks) {
    const subset = b.slice(0, b.indexOf(' */'));
    if (subset !== 'latin') continue;
    const style = /font-style: (\w+)/.exec(b)[1];
    const weight = /font-weight: ([\d ]+)/.exec(b)[1].trim().replace(' ', '-');
    const url = /url\((https:[^)]+\.woff2)\)/.exec(b)[1];
    const file = `${f.name}-${style}-${weight}.woff2`;
    const buf = Buffer.from(await (await fetch(url, { headers: { 'user-agent': UA } })).arrayBuffer());
    await writeFile(join(OUT, file), buf);
    console.log(file, (buf.length / 1024).toFixed(1), 'Ko');
  }
}
