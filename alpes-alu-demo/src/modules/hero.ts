import { gsap, ScrollTrigger, SplitText } from '../lib/gsap';
import { reduceMotion, finePointer, isModestDevice, webglAvailable, qs, qsa, range } from '../lib/env';

export type HeroScene = {
  setProgress(p: number): void;
  setZoom(z: number): void;
  setPointer(x: number, y: number): void;
  resize(): void;
  destroy(): void;
};

/** Pilote du hero : apparition, ouverture au scroll, WebGL ou SVG. */
export function initHero() {
  const hero = qs('.hero');
  if (!hero) return { reveal: () => {} };
  const win = qs('.hero__window', hero)!;
  const svgwin = qs<SVGSVGElement>('.hero__svgwin', hero)!;
  const sashR = qs<SVGGElement>('.hw-sash--r', hero)!;
  const cotes = qsa('.hero__cotes > *', hero);
  const coteLines = qsa('.cote__line', hero);
  const media = qs('.hero__media', hero)!;
  const ridges = qsa<SVGPathElement>('.ridge--main', hero);
  const title = qs('.hero__title', hero)!;
  const shadow = qs('.hero__shadow', hero)!;
  let scene: HeroScene | null = null;
  let progress = 0;
  let zoom = 1.12;
  const setZoom = (z: number) => {
    zoom = z;
    media.style.setProperty('--hero-zoom', z.toFixed(4));
    scene?.setZoom(z);
  };

  /* --- repli SVG et mouvement réduit --- */
  if (reduceMotion) {
    gsap.set(sashR, { x: -210 });
    gsap.set(cotes, { opacity: 1 });
    document.documentElement.classList.add('ready');
    return { reveal: () => {} };
  }

  // états initiaux
  gsap.set(ridges, { '--ridge': 1 });
  gsap.set(win, { opacity: 0, y: 30 });

  /* --- apparition après le préchargement --- */
  let split: SplitText | null = null;
  const reveal = () => {
    document.documentElement.classList.add('ready');
    split = SplitText.create(title, { type: 'lines', mask: 'lines', linesClass: 'hl' });
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(split.lines, { yPercent: 112, duration: 1.15, stagger: 0.08 }, 0)
      .from('.hero .kicker', { opacity: 0, y: 14, duration: 0.8 }, 0.1)
      .from('.hero__lead', { opacity: 0, y: 24, duration: 0.9, ease: 'power4.out' }, 0.35)
      .from('.hero__actions > *', { opacity: 0, y: 24, duration: 0.9, ease: 'power4.out', stagger: 0.06 }, 0.42)
      .from('.hero__foot', { opacity: 0, duration: 0.8 }, 0.5)
      .to(win, { opacity: 1, y: 0, duration: 1.2 }, 0.15)
      .to(ridges, { '--ridge': 0, duration: 1.6, ease: 'power2.inOut' }, 0.25)
      .fromTo({ z: 1.12 }, { z: 1.12 }, { z: 1.08, duration: 1.8, ease: 'power3.out', onUpdate() { if (progress === 0) setZoom((this.targets()[0] as { z: number }).z); } }, 0);
  };

  // voile autour de la fenêtre : n'existe qu'avec le vitrage WebGL (qui montre la vue non voilée)
  const dim = { on: 0 };
  const updateDim = () => media.style.setProperty('--dim', ((1 - range(progress, 0.28, 0.8)) * dim.on).toFixed(3));

  /* --- application de la progression (0 → 1) --- */
  const apply = (p: number) => {
    progress = p;
    const slide = range(p, 0.02, 0.42);
    const coteIn = range(p, 0.06, 0.22);
    const coteOut = range(p, 0.4, 0.56);
    const recede = range(p, 0.42, 1);
    const fade = range(p, 0.6, 0.95);
    // photo : on dévoile toute l'image, et la lumière revient
    if (p > 0 || zoom <= 1.08) setZoom(1.08 - 0.08 * range(p, 0, 1));
    updateDim();
    // cotes
    const c = coteIn * (1 - coteOut);
    cotes.forEach((el) => (el.style.opacity = c.toFixed(3)));
    coteLines.forEach((el) => el.style.setProperty('--cote', coteIn.toFixed(3)));
    // fenêtre
    if (scene) {
      scene.setProgress(p);
    } else {
      gsap.set(sashR, { x: -390 * gsap.parseEase('power2.inOut')(slide) });
      gsap.set(svgwin, { scale: 1 - 0.28 * gsap.parseEase('power2.in')(recede), yPercent: -12 * recede, opacity: 1 - fade, transformOrigin: '50% 40%' });
    }
    gsap.set(qs('.hero__cotes', hero), { scale: 1 - 0.28 * recede, opacity: 1 - fade });
    if (scene) gsap.set(shadow, { scale: 1 - 0.32 * recede, yPercent: -14 * recede, opacity: 1 - Math.min(1, fade * 1.3) });
  };

  /* --- défilement : épinglé sur ordinateur, simple défilement sur mobile --- */
  const mm = gsap.matchMedia();
  mm.add({ desk: '(min-width: 1024px)', mob: '(max-width: 1023px)' }, (ctx) => {
    const desk = ctx.conditions?.desk;
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: desk ? '+=110%' : 'bottom top',
      pin: desk ? qs('.hero__pin', hero) : false,
      pinSpacing: true,
      scrub: desk ? 0.6 : 0.4,
      onUpdate: (st) => apply(st.progress),
    });
    if (!desk) {
      // parallaxe réduite du contenu sur mobile
      gsap.to('.hero__content', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
  });

  /* --- souris : quelques degrés --- */
  let px = 0, py = 0;
  if (finePointer) {
    const rx = gsap.quickTo(svgwin, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    const ry = gsap.quickTo(svgwin, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    gsap.set(win, { perspective: 1400 });
    hero.addEventListener('pointermove', (e) => {
      px = (e.clientX / window.innerWidth) * 2 - 1;
      py = (e.clientY / window.innerHeight) * 2 - 1;
      if (scene) scene.setPointer(px, py);
      else {
        rx(px * 4);
        ry(-py * 3);
      }
    });
  }

  /* --- WebGL, chargé après le premier affichage --- */
  const canGL = webglAvailable() && !isModestDevice();
  if (canGL) {
    const start = () =>
      import('./hero3d')
        .then(({ createHeroScene }) => createHeroScene(hero, qs<HTMLCanvasElement>('.hero__canvas', hero)!, win))
        .then((s) => {
          if (!s) return;
          scene = s;
          scene.setZoom(zoom);
          scene.setProgress(progress);
          scene.setPointer(px, py);
          hero.classList.add('gl-on');
          gsap.to(dim, { on: 1, duration: 1.1, ease: 'power2.out', onUpdate: updateDim });
          window.addEventListener('resize', () => scene?.resize());
          ScrollTrigger.addEventListener('refresh', () => scene?.resize());
        })
        .catch(() => hero.classList.remove('gl-on'));
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
    if (document.readyState === 'complete') idle ? idle(start, { timeout: 900 }) : setTimeout(start, 200);
    else window.addEventListener('load', () => (idle ? idle(start, { timeout: 900 }) : setTimeout(start, 200)), { once: true });
  }

  return { reveal };
}
