import { ScrollTrigger } from './lib/gsap';
import { initSmooth, playIntro, initHeader, initMenu, initMagnetic, initCursor, initTape, initKickers, initReveals } from './modules/core';
import { initHero } from './modules/hero';
import {
  initTitles,
  initManifesto,
  initReperes,
  initMarquee,
  initMetiers,
  initAssembly,
  initAtelier,
  initAnatomy,
  initVolets,
  initDepannage,
  initGallery,
  initRge,
  initZone,
  initCta,
  initFooter,
} from './modules/sections';

/** Un module en échec ne doit jamais casser la page. */
const safe = (name: string, fn: () => unknown) => {
  try {
    return fn();
  } catch (err) {
    console.error(`[alpes-alu] ${name}`, err);
  }
};

const fontsReady = (ms: number) =>
  Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise((r) => setTimeout(r, ms))]);

// Rend la main au navigateur entre deux modules : pas de longue tâche au démarrage.
const yieldToMain = () =>
  new Promise<void>((resolve) => {
    const sch = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
    if (sch?.yield) sch.yield().then(resolve);
    else setTimeout(resolve, 0);
  });
const run = async (list: [string, () => unknown][]) => {
  for (const [name, fn] of list) {
    safe(name, fn);
    await yieldToMain();
  }
};

export async function boot() {
  initSmooth();
  // le hero d'abord : son apparition ne dépend d'aucun autre module
  const hero = (safe('initHero', initHero) as ReturnType<typeof initHero> | undefined) ?? { reveal: () => document.documentElement.classList.add('ready') };
  let shown = false;
  const reveal = () => {
    if (shown) return;
    shown = true;
    safe('reveal', () => hero.reveal());
  };
  const intro = playIntro(reveal);
  if (!document.documentElement.classList.contains('is-intro')) {
    // préchargement déjà vu : on n'attend que les polices (préchargées)
    await fontsReady(700);
    reveal();
  }
  await yieldToMain();

  // puis le reste, dans l'ordre de la page, une tâche courte par module
  await run([
    ['initMetiers', initMetiers],
    ['initHeader', initHeader],
    ['initMenu', initMenu],
    ['initManifesto', initManifesto],
    ['initReperes', initReperes],
    ['initMarquee', initMarquee],
    ['initAssembly', initAssembly],
    ['initAtelier', initAtelier],
    ['initAnatomy', initAnatomy],
    ['initVolets', initVolets],
    ['initDepannage', initDepannage],
    ['initGallery', initGallery],
    ['initRge', initRge],
    ['initZone', initZone],
    ['initCta', initCta],
    ['initFooter', initFooter],
    ['initMagnetic', initMagnetic],
    ['initCursor', initCursor],
  ]);
  await fontsReady(1400);
  await run([
    ['initTitles', initTitles],
    ['initKickers', initKickers],
    ['initReveals', initReveals],
  ]);
  await intro;
  reveal();
  safe('refresh', () => ScrollTrigger.refresh());
  safe('initTape', initTape);
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
