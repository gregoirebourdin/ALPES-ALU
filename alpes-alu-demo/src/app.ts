import { ScrollTrigger } from './lib/gsap';
import { initSmooth, playIntro, initHeader, initMenu, initMagnetic, initCursor, initTape, initKickers, initReveals } from './modules/core';
import { initHero } from './modules/hero';
import { initShutters } from './modules/shutter';
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

export async function boot() {
  const intro = (() => {
    initSmooth();
    return playIntro();
  })();

  // épinglages d'abord, dans l'ordre de la page
  const hero = (safe('initHero', initHero) as ReturnType<typeof initHero> | undefined) ?? { reveal: () => document.documentElement.classList.add('ready') };
  safe('initMetiers', initMetiers);
  // puis le reste, de haut en bas
  safe('initHeader', initHeader);
  safe('initMenu', initMenu);
  safe('initManifesto', initManifesto);
  safe('initReperes', initReperes);
  safe('initMarquee', initMarquee);
  safe('initAssembly', initAssembly);
  safe('initShutters', initShutters);
  safe('initAtelier', initAtelier);
  safe('initAnatomy', initAnatomy);
  safe('initVolets', initVolets);
  safe('initDepannage', initDepannage);
  safe('initGallery', initGallery);
  safe('initRge', initRge);
  safe('initZone', initZone);
  safe('initCta', initCta);
  safe('initFooter', initFooter);
  safe('initMagnetic', initMagnetic);
  safe('initCursor', initCursor);

  await fontsReady(1400);
  safe('initTitles', initTitles);
  safe('initKickers', initKickers);
  safe('initReveals', initReveals);
  await intro;
  hero.reveal();
  ScrollTrigger.refresh();
  safe('initTape', initTape);
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
