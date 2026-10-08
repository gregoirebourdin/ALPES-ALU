import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));

type Photo = {
  alt: string;
  w: number;
  h: number;
  widths: number[];
  lqip: string;
  color: string;
  credit?: string;
  mobile?: { w: number; h: number; widths: number[]; lqip: string };
  duotone?: number[];
};

const loadPhotos = (): Record<string, Photo> => JSON.parse(readFileSync(resolve(ROOT, 'src/generated/photos.json'), 'utf8'));

const attrs = (s: string) => {
  const out: Record<string, string> = {};
  for (const m of s.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) out[m[1]] = m[2] ?? '';
  return out;
};

const srcset = (id: string, widths: number[], ext: string) => widths.map((w) => `img/photos/${id}-${w}.${ext} ${w}w`).join(', ');

/**
 * <x-photo id="hero" sizes="100vw" class="…" loading="eager" fetchpriority="high" variant="duo"></x-photo>
 * devient un <picture> AVIF + WebP avec srcset, dimensions, LQIP et texte alternatif.
 */
function expandPhotos(html: string, photos: Record<string, Photo>) {
  return html.replace(/<x-photo\b([^>]*)><\/x-photo>/g, (_, raw: string) => {
    const a = attrs(raw);
    const p = photos[a.id];
    if (!p) throw new Error(`x-photo : photo inconnue « ${a.id} »`);
    const duo = a.variant === 'duo' && p.duotone;
    const id = duo ? `${a.id}-duo` : a.id;
    const widths = duo ? p.duotone! : p.widths;
    const sizes = a.sizes || '100vw';
    const eager = a.loading === 'eager';
    const fallbackW = widths.find((w) => w >= 1280) ?? widths[widths.length - 1];
    const sources: string[] = [];
    if (p.mobile && !duo && a.art !== 'off') {
      sources.push(`<source type="image/avif" media="(max-width: 767px) and (orientation: portrait)" srcset="${srcset(`${a.id}-m`, p.mobile.widths, 'avif')}" sizes="${sizes}" width="${p.mobile.w}" height="${p.mobile.h}">`);
      sources.push(`<source type="image/webp" media="(max-width: 767px) and (orientation: portrait)" srcset="${srcset(`${a.id}-m`, p.mobile.widths, 'webp')}" sizes="${sizes}" width="${p.mobile.w}" height="${p.mobile.h}">`);
    }
    sources.push(`<source type="image/avif" srcset="${srcset(id, widths, 'avif')}" sizes="${sizes}">`);
    sources.push(`<source type="image/webp" srcset="${srcset(id, widths, 'webp')}" sizes="${sizes}">`);
    const imgAttrs = [
      `src="img/photos/${id}-${fallbackW}.webp"`,
      `width="${p.w}"`,
      `height="${p.h}"`,
      `alt="${a.alt ?? p.alt}"`,
      eager ? 'loading="eager"' : 'loading="lazy"',
      `decoding="${eager ? 'sync' : 'async'}"`,
      a.fetchpriority ? `fetchpriority="${a.fetchpriority}"` : '',
      a['img-class'] ? `class="${a['img-class']}"` : '',
      `style="background-image:url(${duo ? '' : p.lqip})${a.position ? `;object-position:${a.position}` : ''}"`,
      `data-full="img/photos/${id}-${widths[widths.length - 1]}.webp"`,
    ].filter(Boolean);
    const cls = ['photo', a.class].filter(Boolean).join(' ');
    const credit = p.credit ? ` data-credit="${p.credit}"` : '';
    return `<picture class="${cls}" style="--ratio:${p.w}/${p.h}"${credit}>${sources.join('')}<img ${imgAttrs.join(' ')}></picture>`;
  });
}

/** Typographie française sur les nœuds texte et quelques attributs. */
function typographer(html: string) {
  const NNBSP = ' ';
  const NBSP = ' ';
  const fix = (t: string) =>
    t
      // apostrophe typographique
      .replace(/([A-Za-zÀ-ÿŒœ])'(?=[A-Za-zÀ-ÿŒœ])/g, '$1’')
      // guillemets français
      .replace(/«\s*/g, `«${NNBSP}`)
      .replace(/\s*»/g, `${NNBSP}»`)
      // ponctuation haute
      .replace(/\s+([;!?])/g, `${NNBSP}$1`)
      .replace(/([A-Za-zÀ-ÿ0-9»)])([!?])(?=\s|$|<)/g, `$1${NNBSP}$2`)
      .replace(/ :(?=\s|$)/g, `${NBSP}:`)
      // numéros de téléphone par groupes de deux
      .replace(/\b0(\d) (\d\d) (\d\d) (\d\d) (\d\d)\b/g, `0$1${NNBSP}$2${NNBSP}$3${NNBSP}$4${NNBSP}$5`)
      // nombre + unité ou mot court : insécable
      .replace(/(\d) (h|heures|km|%|€|°)(?=[\s.,;:!?)]|$)/g, `$1${NBSP}$2`)
      .replace(/\bn° (\d)/g, `n°${NBSP}$1`);
  // découpe en balises / texte ; on ignore script, style et le contenu des balises <code>
  let out = '';
  let skip: string | null = null;
  const re = /(<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>)/g;
  let last = 0;
  for (const m of html.matchAll(re)) {
    const text = html.slice(last, m.index);
    out += skip ? text : fix(text);
    let tag = m[0];
    const open = /^<(script|style|code|pre)\b/i.exec(tag);
    const close = /^<\/(script|style|code|pre)>/i.exec(tag);
    if (open && !tag.endsWith('/>')) skip = open[1].toLowerCase();
    else if (close && skip === close[1].toLowerCase()) skip = null;
    if (!skip && !tag.startsWith('<!--')) tag = tag.replace(/\b(alt|aria-label|title|content|data-caption)="([^"]*)"/g, (_s, k, v) => `${k}="${fix(v)}"`);
    out += tag;
    last = (m.index ?? 0) + m[0].length;
  }
  out += skip ? html.slice(last) : fix(html.slice(last));
  return out;
}

function includes(html: string, depth = 0): string {
  if (depth > 6) throw new Error('include : profondeur excessive');
  return html.replace(/<include src="([^"]+)"><\/include>/g, (_, src: string) => includes(readFileSync(resolve(ROOT, src), 'utf8'), depth + 1));
}

function alpesHtml(): Plugin {
  return {
    name: 'alpes-alu-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return typographer(expandPhotos(includes(html), loadPhotos()));
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.includes('/partials/') || file.endsWith('photos.json')) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [alpesHtml()],
  build: {
    target: 'es2020',
    cssMinify: 'lightningcss',
    assetsInlineLimit: 0,
    modulePreload: { polyfill: false },
    chunkSizeWarningLimit: 300,
  },
  server: { host: true },
  preview: { host: true },
});
