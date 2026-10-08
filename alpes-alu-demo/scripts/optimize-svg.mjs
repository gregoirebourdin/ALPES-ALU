// Passe SVGO sur les fichiers SVG autonomes (logos redessinés, favicon).
// Les SVG intégrés aux partials sont écrits à la main ou générés compacts (scripts/gen-svg.mjs) ;
// ils portent des classes, des pathLength et des attributs data-* utilisés par les animations :
// on ne les fait pas passer dans SVGO pour ne rien casser.
// Usage : npm run svg
import { optimize } from 'svgo';
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['src/assets/logo/logo-alpes-alu.svg', 'src/assets/logo/logo-alpes-alu-jaune.svg', 'src/assets/logo/logo-alpes-alu-blanc.svg', 'public/favicon.svg'];

const config = {
  multipass: true,
  floatPrecision: 2,
  plugins: [
    // SVGO 4 garde déjà le viewBox ; on conserve aussi les identifiants (référencés par <use>)
    { name: 'preset-default', params: { overrides: { cleanupIds: false } } },
    'removeDimensions',
  ],
};

for (const f of FILES) {
  const path = join(ROOT, f);
  const src = await readFile(path, 'utf8');
  const { data } = optimize(src, { path, ...config });
  await writeFile(path, data);
  console.log(`${f.padEnd(42)} ${String(src.length).padStart(6)} → ${String(data.length).padStart(6)} octets`);
}
