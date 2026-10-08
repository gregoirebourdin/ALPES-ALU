import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '../lib/gsap';
import { reduceMotion, finePointer, qs, qsa, clamp } from '../lib/env';

/* ---------- Défilement doux ---------- */
export let lenis: Lenis | null = null;

export function initSmooth() {
  if (reduceMotion) return;
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.95,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export const scrollVelocity = () => lenis?.velocity ?? 0;

/* ---------- 01 · Préchargement ---------- */
export function playIntro(onOpen?: () => void): Promise<void> {
  const root = document.documentElement;
  const el = qs('div.intro');
  if (!el || !root.classList.contains('is-intro')) return Promise.resolve();
  lenis?.stop();
  const leaf = qs('.intro__leaf', el)!;
  const digits = qs('[data-count]', el)!;
  const paths = qsa<SVGPathElement>('.intro__profile path', el);
  const counter = { v: 1988 };
  return new Promise((resolve) => {
    const done = () => {
      root.classList.remove('is-intro');
      try {
        sessionStorage.setItem('aa-intro', '1');
      } catch {}
      lenis?.start();
      resolve();
    };
    const tl = gsap.timeline({ onComplete: done });
    // le hero apparaît derrière le vantail, dès qu'il commence à s'ouvrir
    tl.call(() => onOpen?.(), [], 0.8);
    // compteur mécanique : de la création de l'atelier à l'année en cours
    const year = new Date().getFullYear();
    tl.to(paths, { strokeDashoffset: 0, duration: 0.85, ease: 'power2.out', stagger: { each: 0.01, from: 'start' } }, 0)
      .to(counter, { v: year, duration: 1.0, ease: 'power2.inOut', onUpdate: () => (digits.textContent = String(Math.round(counter.v))) }, 0.02)
      .to('.intro__logo', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.45)
      .to('.intro__hinge', { scaleY: 1, duration: 0.45, ease: 'power3.inOut' }, 0.55)
      .to(leaf, { rotationY: -104, duration: 0.6, ease: 'expo.inOut', '--shade': 1 }, 0.82)
      .to(el, { opacity: 0, duration: 0.18, ease: 'none' }, 1.24);
  });
}

/* ---------- En-tête : thème, fond flouté, masquage ---------- */
export function initHeader() {
  const header = qs('.site-header')!;
  const hero = qs('.hero');
  // thème selon la section sous la barre
  qsa('[data-theme]', document.body)
    .filter((s) => s !== header && !s.closest('.site-header'))
    .forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: () => `top top+=${header.querySelector('.bar')!.getBoundingClientRect().bottom * 0.5}`,
        end: () => `bottom top+=${header.querySelector('.bar')!.getBoundingClientRect().bottom * 0.5}`,
        onToggle: (st) => st.isActive && (header.dataset.theme = section.dataset.theme || 'light'),
      });
    });
  // fond flouté et masquage au scroll vers le bas : sur ordinateur une fois le hero épinglé passé,
  // sur mobile dès que le contenu passe sous la barre
  let solid = false;
  const limit = () => (window.innerWidth >= 1024 && hero ? Math.max(0, hero.offsetHeight - window.innerHeight) + 60 : 40);
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (st) => {
      const y = st.scroll();
      const l = limit();
      const past = y > l;
      if (past !== solid) {
        solid = past;
        header.classList.toggle('is-solid', solid);
      }
      const menuOpen = document.querySelector('.menu.is-open');
      header.classList.toggle('is-hidden', past && st.direction === 1 && y > l + 80 && !menuOpen);
    },
  });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
}

/* ---------- Menu mobile ---------- */
export function initMenu() {
  const burger = qs<HTMLButtonElement>('.burger');
  const menu = qs('.menu');
  if (!burger || !menu) return;
  const label = burger.querySelector('.sr')!;
  qsa('.menu__list li', menu).forEach((li, i) => li.style.setProperty('--i', String(i)));
  const outside = [qs('.skip'), qs('main'), qs('.footer'), qs('.sav-band'), qs('.bar__logo'), qs('.nav'), qs('.bar .btn')].filter(Boolean) as HTMLElement[];
  let open = false;
  // éléments réellement focalisables (les <use href> des pictos SVG n'en font pas partie)
  const focusables = () => [burger, ...qsa<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])', menu)];
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      set(false);
    } else if (e.key === 'Tab') {
      const f = focusables();
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && (i <= 0)) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && i === f.length - 1) {
        e.preventDefault();
        f[0].focus();
      }
    }
  };
  const set = (v: boolean) => {
    if (v === open) return;
    open = v;
    burger.setAttribute('aria-expanded', String(v));
    label.textContent = v ? 'Fermer le menu' : 'Ouvrir le menu';
    if (v) {
      menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      lenis?.stop();
      document.documentElement.style.overflow = 'hidden';
      outside.forEach((el) => el.setAttribute('inert', ''));
      document.addEventListener('keydown', onKey);
      qs<HTMLElement>('.site-header')!.dataset.menu = 'open';
      setTimeout(() => (qs<HTMLElement>('.menu__foot .btn', menu) ?? burger).focus({ preventScroll: true }), 350);
    } else {
      menu.classList.remove('is-open');
      lenis?.start();
      document.documentElement.style.overflow = '';
      outside.forEach((el) => el.removeAttribute('inert'));
      document.removeEventListener('keydown', onKey);
      delete qs<HTMLElement>('.site-header')!.dataset.menu;
      setTimeout(() => !open && (menu.hidden = true), 850);
      burger.focus({ preventScroll: true });
    }
  };
  burger.addEventListener('click', () => set(!open));
  window.addEventListener('resize', () => window.innerWidth >= 1360 && set(false));
}

/* ---------- Boutons magnétiques ---------- */
export function initMagnetic() {
  if (!finePointer || reduceMotion) return;
  qsa('[data-magnetic]').forEach((btn) => {
    const strength = Number(btn.dataset.magneticStrength || 0.32);
    const label = btn.querySelector<HTMLElement>('.btn__label, .btn-giant__label');
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3.out' });
    const lx = label ? gsap.quickTo(label, 'x', { duration: 0.5, ease: 'power3.out' }) : null;
    const ly = label ? gsap.quickTo(label, 'y', { duration: 0.5, ease: 'power3.out' }) : null;
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const max = 12 + r.height * 0.1;
      xTo(clamp(dx * strength, -max, max));
      yTo(clamp(dy * strength, -max, max));
      lx?.(clamp(dx * strength * 0.35, -6, 6));
      ly?.(clamp(dy * strength * 0.35, -4, 4));
    });
    btn.addEventListener('pointerleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' });
      if (label) gsap.to(label, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)' });
    });
  });
}

/* ---------- Curseur viseur ---------- */
export function initCursor() {
  if (!finePointer || reduceMotion) return;
  const cur = qs('.cursor');
  if (!cur) return;
  const label = qs('.cursor__label', cur)!;
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.32, ease: 'power3.out' });
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.32, ease: 'power3.out' });
  let shown = false;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) {
      gsap.set(cur, { x: e.clientX, y: e.clientY });
      shown = true;
    }
    xTo(e.clientX);
    yTo(e.clientY);
    const t = (e.target as Element).closest?.('[data-cursor]');
    cur.classList.toggle('is-view', !!t);
    if (t) label.textContent = (t as HTMLElement).dataset.cursor || 'Voir';
  });
  document.documentElement.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
  document.documentElement.addEventListener('pointerenter', () => cur.classList.remove('is-hidden'));
}

/* ---------- Mètre ruban : progression ---------- */
export function initTape() {
  const tape = qs('.tape');
  if (!tape || window.innerWidth < 1024) return;
  const ruler = qs('.tape__ruler', tape)!;
  const cursor = qs('.tape__cursor', tape)!;
  const num = qs('.tape__num', tape)!;
  const sections = qsa('[data-section]');
  const ns = 'http://www.w3.org/2000/svg';
  const build = () => {
    const H = tape.clientHeight;
    const svg = document.createElementNS(ns, 'svg');
    const total = document.documentElement.scrollHeight - window.innerHeight;
    for (let i = 0; i <= 100; i++) {
      const y = (i / 100) * H;
      const l = document.createElementNS(ns, 'line');
      const len = i % 10 === 0 ? 14 : i % 5 === 0 ? 9 : 5;
      l.setAttribute('x1', String(26 - len));
      l.setAttribute('x2', '26');
      l.setAttribute('y1', y.toFixed(1));
      l.setAttribute('y2', y.toFixed(1));
      l.setAttribute('opacity', i % 10 === 0 ? '0.9' : '0.45');
      svg.appendChild(l);
    }
    sections.forEach((s) => {
      const top = Math.min(total, s.getBoundingClientRect().top + window.scrollY);
      const t = document.createElementNS(ns, 'text');
      t.setAttribute('x', '-2');
      t.setAttribute('y', ((top / total) * H + 3).toFixed(1));
      t.setAttribute('text-anchor', 'end');
      t.textContent = s.dataset.section || '';
      svg.appendChild(t);
    });
    ruler.replaceChildren(svg);
  };
  build();
  ScrollTrigger.addEventListener('refresh', build);
  let current = sections[0]?.dataset.section || '01';
  num.textContent = current;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (st) => {
      cursor.style.setProperty('--ty', `${(st.progress * tape.clientHeight).toFixed(1)}px`);
      // section courante
      const mid = window.innerHeight * 0.45;
      let id = sections[0]?.dataset.section || '01';
      for (const s of sections) if (s.getBoundingClientRect().top <= mid) id = s.dataset.section || id;
      if (id !== current) {
        current = id;
        gsap.fromTo(num, { yPercent: st.direction === 1 ? 100 : -100 }, { yPercent: 0, duration: 0.5, ease: 'expo.out' });
        num.textContent = id;
      }
    },
  });
}

/* ---------- Numéros de section qui défilent (compteur mécanique) ---------- */
export function initKickers() {
  qsa('.kicker__num').forEach((el) => {
    const text = el.textContent || '';
    const m = /^(\d\d)(.*)$/.exec(text);
    if (!m || reduceMotion) return;
    const digits = m[1].split('');
    el.innerHTML =
      `<span class="sr-only">${text}</span>` +
      digits
        .map((d) => `<span class="odo" aria-hidden="true"><span class="odo__col">${Array.from({ length: Number(d) + 1 }, (_, k) => `<span>${k}</span>`).join('')}</span></span>`)
        .join('') +
      `<span aria-hidden="true">${m[2]}</span>`;
    const cols = qsa('.odo__col', el);
    cols.forEach((c) => gsap.set(c, { yPercent: 0 }));
    let done = false;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 99%',
      onEnter: () => {
        if (done) return;
        done = true;
        cols.forEach((c, i) => {
          const n = c.children.length - 1;
          gsap.to(c, { yPercent: (-100 * n) / (n + 1), duration: 0.9 + i * 0.25, ease: 'expo.out', delay: 0.05 });
        });
      },
    });
  });
}

/* ---------- Révélations génériques : cadres, parallaxe, pictos ---------- */
export function initReveals() {
  if (reduceMotion) return;
  qsa('.frame--reveal').forEach((fr) => {
    const img = fr.querySelector('img');
    gsap.fromTo(fr, { clipPath: 'inset(9% 9% 9% 9%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: fr, start: 'top 88%', toggleActions: 'play none none none' } });
    if (img) gsap.fromTo(img, { scale: 1.16 }, { scale: 1, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: fr, start: 'top 88%', toggleActions: 'play none none none' } });
  });
  qsa<SVGSVGElement>('svg.draw').forEach((svg) => {
    if (svg.closest('.metiers')) return; // géré par la piste horizontale
    gsap.fromTo(svg, { '--draw': 1 }, { '--draw': 0, duration: 1.1, ease: 'power2.out', scrollTrigger: { trigger: svg, start: 'top 90%', toggleActions: 'play none none none' } });
  });
  // parallaxe douce sur quelques photos encadrées
  qsa('.pane__frame img, .volets__photo img, .rge__photo img, .rallye__photos img').forEach((img) => {
    gsap.set(img, { scale: 1.12 });
    gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img.closest('figure') || img, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}
