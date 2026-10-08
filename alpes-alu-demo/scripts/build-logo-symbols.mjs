// Construit les symboles SVG du logo (bande, mot, accroche) pour le sprite de la page.
import { readFileSync, writeFileSync } from 'node:fs';
import { optimize } from 'svgo';
const p = JSON.parse(readFileSync('src/assets/logo/logo-paths.json', 'utf8'));
const opt = (d) => {
  const r = optimize(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${p.viewBox}"><path d="${d}"/></svg>`, {
    multipass: true,
    plugins: [{ name: 'preset-default', params: { overrides: { mergePaths: false } } }],
  });
  return /d="([^"]+)"/.exec(r.data)[1];
};
const band = opt(p.band), word = opt(p.word), tag = opt(p.tag);
const out = `<symbol id="logo-band" viewBox="${p.viewBox}"><path d="${band}"/></symbol>
<symbol id="logo-word" viewBox="${p.viewBox}"><path d="${word}"/></symbol>
<symbol id="logo-tag" viewBox="${p.viewBox}"><path d="${tag}"/></symbol>
<mask id="logo-knockout" maskUnits="userSpaceOnUse" x="0" y="0" width="2910" height="980"><rect width="2910" height="980" fill="#fff"/><path d="${tag}" fill="#000"/></mask>
<symbol id="logo-band-knockout" viewBox="${p.viewBox}"><path d="${band}" mask="url(#logo-knockout)"/></symbol>`;
writeFileSync('partials/logo-symbols.svg', out);
console.log('logo-symbols.svg', out.length, 'octets');
