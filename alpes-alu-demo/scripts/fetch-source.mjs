// Récupère les pages et la médiathèque WordPress d'alpesalu.fr, télécharge les
// originaux et écrit assets/raw/manifest.json.
// Usage : node scripts/fetch-source.mjs [--no-download]
// Le serveur coupe parfois les connexions : chaque requête est relancée avec
// un délai exponentiel.
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'assets/raw');
const SITE = 'https://alpesalu.fr';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';
const DOWNLOAD = !process.argv.includes('--no-download');

const PAGES = [
  '/', '/societe/', '/fenetres/', '/volets-roulants/', '/vitrerie/', '/catalogue/', '/realisations/', '/contact/',
  '/service/porte-fenetre/', '/service/fenetre/', '/service/volets/', '/service/baies-vitrees/',
  '/service/chassis-compose/', '/service/chassis-fixe/', '/service/clotures/', '/service/vitrerie/',
  '/service/escaliers/', '/service/gardes-corps/', '/service/moustiquaires/', '/service/porte-dentree/',
  '/service/portes-de-garage/', '/service/portails/', '/service/stores-dexterieur/',
  '/service/stores-dinterieur/', '/service/verandas/',
  '/2022/02/22/alpes-alu-votre-projet-suivi-personalise/',
  '/2022/02/22/alpes-alu-qualification-qualibat-rge/',
  '/2022/03/28/reparation-vitrerie-chez-alpes-alu/',
  '/2022/07/05/alpes-alu-sponsors-officiel-de-gerard-bouchie/',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, { as = 'text', tries = 6 } = {}) {
  let wait = 2000;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, accept: as === 'text' ? 'text/html,application/json' : '*/*' },
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 404) return { status: 404 };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = as === 'text' ? await res.text() : Buffer.from(await res.arrayBuffer());
      return { status: res.status, body, headers: res.headers };
    } catch (err) {
      if (i === tries) throw new Error(`${url} : ${err.message}`);
      console.warn(`  relance ${i}/${tries - 1} ${url} (${err.cause?.code || err.message})`);
      await sleep(wait);
      wait *= 2;
    }
  }
}

const slugOf = (path) => (path === '/' ? 'accueil' : path.replace(/^\/|\/$/g, '').replace(/\//g, '__'));

// Ramène une URL de miniature (-300x200.jpg) à son original.
function baseKey(url) {
  return url
    .replace(/\\\//g, '/')
    .replace(/^(https?:)?\/\/(www\.)?alpesalu\.fr/, '')
    .replace(/[?#].*$/, '')
    .replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, '');
}

async function main() {
  await mkdir(join(RAW, 'pages'), { recursive: true });
  await mkdir(join(RAW, 'media'), { recursive: true });

  // 1. Médiathèque
  const media = [];
  for (let page = 1; page < 20; page++) {
    const url = `${SITE}/wp-json/wp/v2/media?per_page=100&page=${page}`;
    const res = await get(url);
    if (res.status === 404) break;
    const items = JSON.parse(res.body);
    if (!Array.isArray(items) || items.length === 0) break;
    await writeFile(join(RAW, 'media', `media-p${page}.json`), JSON.stringify(items, null, 1));
    media.push(...items);
    console.log(`médiathèque p${page} : ${items.length} entrées (total ${res.headers.get('x-wp-total')})`);
    if (page >= Number(res.headers.get('x-wp-totalpages') || 1)) break;
  }

  // Index miniature -> original
  const byKey = new Map();
  for (const m of media) {
    const entry = { m, pages: new Set() };
    byKey.set(baseKey(m.source_url), entry);
    for (const s of Object.values(m.media_details?.sizes || {})) {
      if (s.source_url) byKey.set(baseKey(s.source_url), entry);
    }
    if (m.media_details?.original_image) {
      const dir = m.source_url.replace(/[^/]+$/, '');
      byKey.set(baseKey(dir + m.media_details.original_image), entry);
    }
  }

  // 2. Pages
  const orphanRefs = new Map();
  const altByKey = new Map();
  for (const path of PAGES) {
    const res = await get(SITE + path);
    if (res.status === 404) {
      console.warn(`page introuvable : ${path}`);
      continue;
    }
    await writeFile(join(RAW, 'pages', `${slugOf(path)}.html`), res.body);
    for (const tag of res.body.match(/<img\b[^>]*>/gi) || []) {
      const src = (tag.match(/\b(?:data-src|src)="([^"]+)"/i) || [])[1];
      const alt = (tag.match(/\balt="([^"]*)"/i) || [])[1];
      if (src && alt && /wp-content\/uploads/.test(src) && !altByKey.has(baseKey(src))) altByKey.set(baseKey(src), alt);
    }
    const refs = new Set(
      (res.body.match(/(?:https?:)?(?:\\?\/\\?\/)?(?:www\.)?alpesalu\.fr(?:\\?\/)+wp-content(?:\\?\/)+uploads(?:\\?\/)+[^"'\s)<>,]+?\.(?:jpe?g|png|webp|gif|svg|avif)/gi) || [])
        .concat(res.body.match(/\/wp-content\/uploads\/[^"'\s)<>,]+?\.(?:jpe?g|png|webp|gif|svg|avif)/gi) || [])
        .map(baseKey),
    );
    let n = 0;
    for (const k of refs) {
      const entry = byKey.get(k);
      if (entry) {
        entry.pages.add(path);
        n++;
      } else {
        if (!orphanRefs.has(k)) orphanRefs.set(k, new Set());
        orphanRefs.get(k).add(path);
      }
    }
    console.log(`page ${path} : ${refs.size} images référencées (${n} dans la médiathèque)`);
  }

  // 3. Téléchargement des originaux
  const entries = [...new Set(byKey.values())];
  const images = entries.filter((e) => /^image\//.test(e.m.mime_type));
  const queue = [...images];
  const workers = Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const e = queue.shift();
      const rel = e.m.source_url.replace(/^https?:\/\/(www\.)?alpesalu\.fr\/wp-content\/uploads\//, '');
      e.local = join('uploads', rel);
      const dest = join(RAW, e.local);
      if (!DOWNLOAD) continue;
      try {
        const s = await stat(dest).catch(() => null);
        if (s && s.size > 0) continue;
        const res = await get(e.m.source_url, { as: 'buffer' });
        if (res.status === 404) {
          e.missing = true;
          continue;
        }
        await mkdir(dirname(dest), { recursive: true });
        await writeFile(dest, res.body);
      } catch (err) {
        e.error = err.message;
        console.error(`échec : ${err.message}`);
      }
    }
  });
  await Promise.all(workers);

  // 3 bis. Images utilisées dans les pages mais masquées par l'API (pièces jointes
  // de contenus non publics) ou miniatures Elementor : on cherche l'original.
  const MONTHS = ['2021/11', '2021/10', '2022/02', '2022/03', '2022/05', '2022/07', '2020/02', '2020/03', '2019/08', '2019/09', '2019/10', '2019/11'];
  const exists = async (url) => {
    for (let i = 0; i < 4; i++) {
      try {
        const r = await fetch(url, { method: 'HEAD', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30_000) });
        return r.ok && /^image\//.test(r.headers.get('content-type') || '');
      } catch {
        await sleep(1500 * (i + 1));
      }
    }
    return false;
  };
  const extra = [];
  const known = new Set(images.map((e) => baseKey(e.m.source_url)));
  const oqueue = [...orphanRefs.entries()];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (oqueue.length) {
        const [key, pages] = oqueue.shift();
        let candidates = [];
        if (!/\/elementor\/thumbs\//.test(key)) candidates.push(key);
        else {
          const file = key.split('/').pop().replace(/-[a-z0-9]{40,}(?=\.[a-z0-9]+$)/i, '');
          const names = new Set([file, file.replace(/-e\d{10,}(?=\.)/, ''), file.replace(/-rotated(?=\.)/, '')]);
          for (const mo of MONTHS) for (const n of names) candidates.push(`/wp-content/uploads/${mo}/${n}`);
        }
        let found = null;
        for (const c of candidates) {
          if (known.has(baseKey(c))) {
            found = 'known';
            const entry = byKey.get(baseKey(c));
            if (entry) for (const p of pages) entry.pages.add(p);
            break;
          }
          if (await exists(SITE + c)) {
            found = c;
            break;
          }
        }
        if (!found || found === 'known') {
          if (!found) console.warn(`original introuvable : ${key}`);
          continue;
        }
        known.add(baseKey(found));
        const local = join('uploads', found.replace('/wp-content/uploads/', ''));
        const dest = join(RAW, local);
        try {
          if (DOWNLOAD && !(await stat(dest).catch(() => null))) {
            const res = await get(SITE + found, { as: 'buffer' });
            await mkdir(dirname(dest), { recursive: true });
            await writeFile(dest, res.body);
          }
          extra.push({ source_url: SITE + found, local, pages: [...pages], via: key });
        } catch (err) {
          console.error(`échec : ${err.message}`);
        }
      }
    }),
  );
  console.log(`hors médiathèque : ${extra.length} originaux récupérés`);

  // 4. Manifeste (le verdict est complété après revue visuelle, cf. scripts/verdicts.mjs)
  let previous = {};
  try {
    for (const it of JSON.parse(await readFile(join(RAW, 'manifest.json'), 'utf8')).images) previous[it.source_url] = it;
  } catch {}
  const manifest = {
    source: SITE,
    fetched_at: new Date().toISOString(),
    media_total: media.length,
    images: images
      .map((e) => {
        const md = e.m.media_details || {};
        const prev = previous[e.m.source_url] || {};
        return {
          id: e.m.id,
          source_url: e.m.source_url,
          local: e.local,
          original_image: md.original_image || null,
          title: e.m.title?.rendered || '',
          alt_text: e.m.alt_text || '',
          caption: (e.m.caption?.rendered || '').replace(/<[^>]+>/g, '').trim(),
          width: md.width || null,
          height: md.height || null,
          filesize: md.filesize || null,
          mime: e.m.mime_type,
          uploaded: e.m.date,
          pages: [...e.pages].sort(),
          verdict: prev.verdict || null,
          score: prev.score ?? null,
          notes: prev.notes || '',
          missing: e.missing || undefined,
          error: e.error || undefined,
        };
      })
      .concat(
        extra.map((x) => {
          const prev = previous[x.source_url] || {};
          return {
            id: null,
            source_url: x.source_url,
            local: x.local,
            found_via: x.via,
            title: '',
            alt_text: altByKey.get(baseKey(x.via)) || altByKey.get(baseKey(x.source_url)) || '',
            width: prev.width || null,
            height: prev.height || null,
            mime: /\.png$/i.test(x.source_url) ? 'image/png' : 'image/jpeg',
            pages: x.pages.sort(),
            hidden_from_media_api: true,
            verdict: prev.verdict || null,
            score: prev.score ?? null,
            notes: prev.notes || '',
          };
        }),
      )
      .map((it) => ({ ...it, alt_text: it.alt_text || altByKey.get(baseKey(it.source_url)) || '' }))
      .sort((a, b) => a.source_url.localeCompare(b.source_url)),
    non_images: entries
      .filter((e) => !/^image\//.test(e.m.mime_type))
      .map((e) => ({ id: e.m.id, source_url: e.m.source_url, mime: e.m.mime_type })),
    referenced_outside_media_library: [...orphanRefs].map(([k, p]) => ({ path: k, pages: [...p] })),
  };
  await writeFile(join(RAW, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`manifeste : ${manifest.images.length} images, ${manifest.non_images.length} autres fichiers, ${manifest.referenced_outside_media_library.length} références hors médiathèque`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
