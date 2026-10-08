import { gsap, ScrollTrigger, SplitText, Flip } from '../lib/gsap';
import { reduceMotion, finePointer, qs, qsa, clamp } from '../lib/env';
import { scrollVelocity, lenis } from './core';

/* ---------- Titres : lignes masquées ---------- */
export function initTitles() {
  if (reduceMotion) return;
  qsa('[data-split="lines"]').forEach((el) => {
    if (el.closest('.hero')) return;
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'tl',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 112,
          duration: 1.1,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none none' },
        }),
    });
  });
  qsa('.section__lead, .step__text').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.from(el, { opacity: 0, y: 22, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' } });
  });
}

/* ---------- 03 · Manifeste : les mots s'éclairent ---------- */
export function initManifesto() {
  const el = qs('[data-words]');
  if (!el || reduceMotion) return;
  const split = SplitText.create(el, { type: 'words', wordsClass: 'w' });
  gsap.fromTo(
    split.words,
    { opacity: 0.14 },
    { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 48%', scrub: true } },
  );
  const prof = qs('.manifeste__profile use');
  if (prof) gsap.fromTo(prof, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.manifeste', start: 'top 70%', end: 'center 40%', scrub: true } });
}

/* ---------- 04 · Repères ---------- */
export function initReperes() {
  if (reduceMotion) return;
  qsa('.repere').forEach((rep, i) => {
    const line = qs('.rc-line', rep);
    const corner = qs('.rc-corner', rep);
    const num = qs('.repere__num', rep)!;
    const tl = gsap.timeline({ scrollTrigger: { trigger: rep, start: 'top 82%', toggleActions: 'play none none none' }, delay: (i % 3) * 0.08 });
    tl.from(num, { yPercent: 40, opacity: 0, duration: 1.1, ease: 'expo.out' }, 0)
      .fromTo(line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'expo.out' }, 0.1)
      .from(corner, { scale: 0, transformOrigin: '0% 100%', duration: 0.7, ease: 'back.out(2)' }, 0.1)
      .from(qsa('.repere__label, .repere__text', rep), { opacity: 0, y: 16, duration: 0.9, ease: 'power4.out', stagger: 0.06 }, 0.25);
    const to = Number(num.dataset.countTo);
    if (to) {
      const o = { v: Number(num.dataset.countFrom || 0) };
      tl.to(o, { v: to, duration: 1.4, ease: 'expo.out', onUpdate: () => (num.textContent = String(Math.round(o.v))) }, 0);
    }
  });
}

/* ---------- Bandeau des métiers : vitesse indexée sur le scroll ---------- */
export function initMarquee() {
  const track = qs('.marquee__track');
  if (!track || reduceMotion) return;
  track.innerHTML += track.innerHTML;
  let x = 0;
  let dir = -1;
  let half = track.scrollWidth / 2;
  window.addEventListener('resize', () => (half = track.scrollWidth / 2));
  const set = gsap.quickSetter(track, 'x', 'px');
  let visible = false;
  ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top', onToggle: (st) => (visible = st.isActive) });
  gsap.ticker.add((_t, dt) => {
    if (!visible) return;
    const v = scrollVelocity();
    if (Math.abs(v) > 0.4) dir = v > 0 ? -1 : 1;
    const speed = 0.055 + Math.min(1.6, Math.abs(v) * 0.045);
    x += dir * speed * dt;
    if (x <= -half) x += half;
    if (x > 0) x -= half;
    set(x);
  });
}

/* ---------- 05 · Métiers : défilement horizontal épinglé ---------- */
export function initMetiers() {
  const section = qs('.metiers');
  if (!section) return;
  const pin = qs('.metiers__pin', section)!;
  const viewport = qs('.metiers__viewport', section)!;
  const track = qs('.metiers__track', section)!;
  const cards = qsa('.metier', section);
  const bar = qs('.metiers__bar', section)!;
  const current = qs('.metiers__current', section)!;
  const setP = (p: number) => {
    const v = 1 / 9 + (8 / 9) * p;
    bar.style.setProperty('--p', v.toFixed(4));
    current.textContent = String(Math.min(9, 1 + Math.floor(p * 8.999))).padStart(2, '0');
  };
  const measureBar = () => bar.style.setProperty('--bar-w', `${bar.clientWidth}px`);
  measureBar();
  window.addEventListener('resize', measureBar);

  // révélation de chaque carte : timeline en pause, jouée quand la carte entre dans le cadre
  const reveals = cards.map((card) => {
    if (reduceMotion) return null;
    const media = qs('.metier__media', card);
    const img = qs('img', card);
    const icon = qs('.metier__icon', card);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(media, { clipPath: 'inset(12% 12% 12% 12%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.out' }, 0)
      .fromTo(img, { scale: 1.18 }, { scale: 1, duration: 1.4, ease: 'expo.out' }, 0)
      .fromTo(icon, { '--draw': 1 }, { '--draw': 0, duration: 1.2, ease: 'power2.out' }, 0.15)
      .from(qsa('.metier__title, .metier__text, .metier__specs', card), { opacity: 0, y: 18, duration: 0.9, ease: 'power4.out', stagger: 0.06 }, 0.2);
    return tl;
  });
  let sectionIn = false;
  const check = () => {
    if (!sectionIn) return;
    const limit = window.innerWidth * 0.94;
    cards.forEach((card, i) => {
      const tl = reveals[i];
      if (tl && !tl.isActive() && tl.progress() === 0 && card.getBoundingClientRect().left < limit) tl.play();
    });
  };
  ScrollTrigger.create({
    trigger: section,
    start: 'top 62%',
    onEnter: () => {
      sectionIn = true;
      check();
    },
  });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    if (reduceMotion) return;
    const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
    // les mises à jour suivent l'animation lissée (et non la position de scroll, en avance sur elle)
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      onUpdate() {
        setP(this.progress());
        check();
      },
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });
    return () => gsap.set(track, { x: 0 });
  });
  mm.add('(max-width: 1023px)', () => {
    const onScroll = () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      setP(max > 0 ? viewport.scrollLeft / max : 0);
      check();
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    const st = ScrollTrigger.create({ trigger: section, start: 'top 85%', end: 'bottom top', onUpdate: check });
    return () => {
      viewport.removeEventListener('scroll', onScroll);
      st.kill();
    };
  });
}

/* ---------- 06 · La fenêtre qui se monte toute seule ---------- */
export function initAssembly() {
  const section = qs('.assemblage');
  const svg = qs<SVGSVGElement>('.xw', section || document);
  if (!section || !svg) return;
  const steps = qsa('.step', section);
  const now = qs('.assemblage__now', section)!;
  const photo = qs('.assemblage__photo', section)!;
  const parts = qsa<SVGGElement>('.xw-part', svg);
  const labels = qsa('.p-label', svg);
  const lines = qsa('.xw-part .f-line', svg);
  const fills = qsa('.xw-part .f-front, .xw-part .f-top, .xw-part .f-side, .xw-part .f-in-b, .xw-part .f-in-l, .xw-part .v-pane, .xw-part .v-edge, .xw-part .cr-box, .xw-part .cr-bolt, .xw-part .po-base, .xw-part .cr-rod, .xw-part .po-lever, .xw-part .v-glint', svg);
  const miters = qsa('.f-miter', svg);
  const wallLine = qs('.w-line', svg);
  const cotes = qsa('.c-line, .c-acc', svg);
  const cotesTxt = qsa('.xw-cotes text', svg);
  const check = qs('.ck', svg);
  const checkTxt = qs('.xw-check text', svg);
  const offset = (el: SVGGElement) => {
    const e = Number(el.dataset.explode || 0);
    const sh = Number(el.dataset.shift || 0);
    return { x: -e * 0.6 + sh, y: e * 0.35 };
  };

  const setStep = (n: number) => {
    steps.forEach((s, i) => s.classList.toggle('is-active', i === n));
    now.textContent = String(n + 1).padStart(2, '0');
  };
  steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 62%', end: 'bottom 62%', onToggle: (st) => st.isActive && setStep(i) }));
  setStep(0);

  if (reduceMotion) {
    gsap.set(photo, { opacity: 1 });
    return;
  }

  // états initiaux : mur à dessiner, pièces absentes, en position éclatée
  gsap.set(wallLine, { strokeDashoffset: 1 });
  gsap.set(cotes, { strokeDashoffset: 1 });
  gsap.set(cotesTxt, { opacity: 0 });
  gsap.set(parts, { opacity: 0, x: (_i, el) => offset(el as SVGGElement).x, y: (_i, el) => offset(el as SVGGElement).y });
  gsap.set(lines, { opacity: 1, strokeDashoffset: 1 });
  gsap.set(fills, { fillOpacity: 0, strokeOpacity: 0 });
  gsap.set(miters, { strokeDashoffset: 1 });
  gsap.set(labels, { opacity: 0 });
  gsap.set(check, { strokeDashoffset: 1 });
  gsap.set(checkTxt, { opacity: 0 });
  const part = (name: string) => parts.find((p) => p.dataset.part === name)!;

  const tl = gsap.timeline({ defaults: { ease: 'power2.inOut', duration: 1 } });
  // 1 · prise de cotes
  tl.to(wallLine, { strokeDashoffset: 0, duration: 0.8 }, 0)
    .to(cotes, { strokeDashoffset: 0, duration: 0.9, stagger: 0.1 }, 0.15)
    .to(cotesTxt, { opacity: 1, duration: 0.4 }, 0.6)
    // 2 · conception sur plan : les pièces apparaissent au trait, éclatées
    .to(parts, { opacity: 1, duration: 0.3, stagger: 0.05 }, 1)
    .to(lines, { strokeDashoffset: 0, duration: 0.9, stagger: 0.04 }, 1)
    .to(labels, { opacity: 1, duration: 0.4, stagger: 0.05 }, 1.4)
    // 3 · découpe et assemblage : matière, onglets, l'ouvrant rentre dans le dormant
    .to(qsa('.f-front, .f-top, .f-side, .f-in-b, .f-in-l', part('dormant')).concat(qsa('.f-front, .f-top, .f-side, .f-in-b, .f-in-l', part('ouvrant'))), { fillOpacity: 1, strokeOpacity: 1, duration: 0.6 }, 2)
    .to(miters, { strokeDashoffset: 0, duration: 0.6, stagger: 0.03 }, 2.1)
    .to(part('ouvrant'), { x: 0, y: 0, duration: 0.9 }, 2.25)
    // 4 · joints, vitrage, crémone et poignée
    .to(qsa('.f-front, .f-top, .f-side, .f-in-b, .f-in-l', part('joints')).concat(qsa('.v-pane, .v-edge, .v-glint', part('vitrage'))), { fillOpacity: 1, strokeOpacity: 1, duration: 0.5 }, 3)
    .to([part('joints'), part('vitrage')], { x: 0, y: 0, duration: 0.85, stagger: 0.12 }, 3.05)
    .to(qsa('.cr-box, .cr-bolt, .cr-rod, .po-base, .po-lever', svg), { fillOpacity: 1, strokeOpacity: 1, duration: 0.4 }, 3.3)
    .to([part('cremone'), part('poignee')], { x: 0, y: 0, duration: 0.8, stagger: 0.1 }, 3.4)
    .to(lines, { opacity: 0, duration: 0.4 }, 3.7)
    .to(labels, { opacity: 0, duration: 0.3 }, 3.85)
    // 5 · posée et réglée, la vraie photo apparaît derrière le dessin
    .to(photo, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 4.1)
    .to(check, { strokeDashoffset: 0, duration: 0.5 }, 4.35)
    .to(checkTxt, { opacity: 1, duration: 0.3 }, 4.6)
    .to({}, { duration: 0.4 }, 4.6);

  ScrollTrigger.create({
    trigger: qs('.assemblage__steps', section),
    start: 'top 58%',
    end: 'bottom 72%',
    scrub: 0.7,
    animation: tl,
  });
}

/* ---------- 07 · Le mur de l'atelier ---------- */
export function initAtelier() {
  const title = qs('.atelier__title');
  if (title && !reduceMotion) {
    gsap.fromTo(title, { '--stretch': '76%' }, { '--stretch': '108%', duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: title, start: 'top 80%', toggleActions: 'play none none none' } });
    gsap.from(title, { opacity: 0, y: 30, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: title, start: 'top 80%', toggleActions: 'play none none none' } });
  }
  const frames = qsa('.pane__frame, .portrait__frame');
  frames.forEach((fr) => {
    const glass = qs('.pane__glass', fr);
    if (!reduceMotion) {
      gsap.fromTo(fr, { clipPath: 'inset(8% 8% 8% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.25, ease: 'expo.out', scrollTrigger: { trigger: fr, start: 'top 90%', toggleActions: 'play none none none' } });
    }
    if (!glass) return;
    // le reflet du vitrage suit la souris ; au repos, il dérive avec le scroll
    if (finePointer && !reduceMotion) {
      fr.addEventListener('pointermove', (e) => {
        const r = fr.getBoundingClientRect();
        const t = clamp((e.clientX - r.left) / r.width);
        glass.style.setProperty('--gx', `${(100 - t * 100).toFixed(1)}%`);
      });
      fr.addEventListener('pointerleave', () => glass.style.removeProperty('--gx'));
    }
    if (!reduceMotion)
      ScrollTrigger.create({
        trigger: fr,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (st) => !fr.matches(':hover') && glass.style.setProperty('--gx', `${(100 - st.progress * 100).toFixed(1)}%`),
      });
  });
}

/* ---------- 08 · Anatomie : repères interactifs ---------- */
export function initAnatomy() {
  const figure = qs('.anatomie__figure');
  if (!figure) return;
  const svg = qs<SVGSVGElement>('.anat', figure)!;
  const spots = qsa<HTMLButtonElement>('.spot', figure);
  const items = qsa('.anatomie__list li');
  const term = qs('.anatomie__term')!;
  const def = qs('.anatomie__def')!;
  const index = qs('.anatomie__i')!;
  spots.forEach((s, i) => s.style.setProperty('--i', String(i)));
  const activate = (key: string, dim = true) => {
    const li = items.find((l) => l.dataset.term === key);
    if (!li) return;
    term.textContent = li.textContent?.replace(/^\d+/, '').trim() || '';
    def.textContent = li.dataset.def || '';
    index.textContent = String(items.indexOf(li) + 1);
    items.forEach((l) => l.classList.toggle('is-on', l === li));
    spots.forEach((s) => s.classList.toggle('is-on', s.dataset.term === key));
    qsa('.an-part', svg).forEach((p) => p.classList.toggle('is-on', p.dataset.part === key));
    svg.classList.toggle('has-focus', dim);
    if (!reduceMotion) gsap.fromTo([term, def], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.04 });
  };
  spots.forEach((s, i) => {
    s.addEventListener('pointerenter', () => activate(s.dataset.term!));
    s.addEventListener('focus', () => activate(s.dataset.term!));
    s.addEventListener('click', () => activate(s.dataset.term!));
    s.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        spots[(i + 1) % spots.length].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        spots[(i - 1 + spots.length) % spots.length].focus();
      }
    });
  });
  figure.addEventListener('pointerleave', () => svg.classList.remove('has-focus'));
  activate('dormant', false);
  if (!reduceMotion) gsap.from(spots, { scale: 0, duration: 0.6, ease: 'back.out(2.2)', stagger: 0.05, scrollTrigger: { trigger: figure, start: 'top 75%', toggleActions: 'play none none none' } });
}

/* ---------- 09 · Volets : électrique ou solaire ---------- */
export function initVolets() {
  const demo = qs('.volets__demo');
  if (!demo) return;
  const svg = qs<SVGSVGElement>('.vr', demo)!;
  const g = qs<SVGGElement>('.vr-slats', svg)!;
  const ns = 'http://www.w3.org/2000/svg';
  const top = 128, height = 452, n = 14, x = 88, w = 384;
  const sh = height / n;
  const slats: SVGGElement[] = [];
  for (let i = 0; i < n; i++) {
    const s = document.createElementNS(ns, 'g');
    const r = document.createElementNS(ns, 'rect');
    r.setAttribute('x', String(x));
    r.setAttribute('y', '0');
    r.setAttribute('width', String(w));
    r.setAttribute('height', (sh - 1).toFixed(2));
    r.setAttribute('class', i === n - 1 ? 'vr-slat vr-slat--last' : 'vr-slat');
    s.appendChild(r);
    if (i === n - 1) {
      const a = document.createElementNS(ns, 'rect');
      a.setAttribute('x', String(x));
      a.setAttribute('y', (sh - 6).toFixed(2));
      a.setAttribute('width', String(w));
      a.setAttribute('height', '3');
      a.setAttribute('class', 'vr-slat-acc');
      s.appendChild(a);
    }
    g.appendChild(s);
    slats.push(s);
  }
  const buttons = qsa<HTMLButtonElement>('.volets__opt', demo);
  const texts = qsa('[data-for]', demo);
  const state = { down: 0, gap: 1 };
  const draw = () => {
    // lames suspendues avec leurs ajours, qui se resserrent en bout de course
    const gp = 3 * state.gap;
    const bottom = top + height * state.down;
    slats.forEach((s, i) => {
      const y = bottom - (n - i) * sh - (n - 1 - i) * gp;
      s.setAttribute('transform', `translate(0 ${y.toFixed(2)})`);
    });
  };
  draw();
  let tl: gsap.core.Timeline | null = null;
  const run = (mode: string) => {
    tl?.kill();
    tl = gsap.timeline();
    if (state.down > 0) tl.to(state, { down: 0, gap: 1, duration: 0.7, ease: 'power2.in', onUpdate: draw });
    tl.add(() => {
      demo.dataset.mode = mode;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
      texts.forEach((t) => (t.hidden = t.dataset.for !== mode));
    });
    if (mode === 'solaire') tl.fromTo(qsa('.vr-ray', svg), { '--ray': 1 }, { '--ray': 0, duration: 0.9, ease: 'power2.out', stagger: 0.12 });
    else tl.fromTo(qs('.vr-cable', svg), { '--cable': 1 }, { '--cable': 0, duration: 0.8, ease: 'power2.out' });
    tl.to(state, { down: 1, duration: reduceMotion ? 0.01 : 1.5, ease: 'power2.inOut', onUpdate: draw }, '-=0.3').to(state, { gap: 0, duration: 0.45, ease: 'power3.out', onUpdate: draw });
  };
  buttons.forEach((b) => b.addEventListener('click', () => run(b.dataset.mode!)));
  let played = false;
  ScrollTrigger.create({
    trigger: demo,
    start: 'top 70%',
    onEnter: () => {
      if (played) return;
      played = true;
      run((demo.dataset.mode as string) || 'electrique');
    },
  });
}

/* ---------- 10 · Dépannage ---------- */
export function initDepannage() {
  const s = qs('.depannage');
  if (!s || reduceMotion) return;
  gsap.fromTo('.lock-rotor', { rotation: -35 }, { rotation: 90, svgOrigin: '150 134', ease: 'none', scrollTrigger: { trigger: s, start: 'top 80%', end: 'bottom 30%', scrub: 0.6 } });
  const shards = qsa('.shard', s);
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.dv--glass', start: 'top 80%', toggleActions: 'play none none none' } });
  tl.from(shards, {
    x: () => gsap.utils.random(-70, 70),
    y: () => gsap.utils.random(-60, 60),
    rotation: () => gsap.utils.random(-40, 40),
    opacity: 0,
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.04,
  })
    .fromTo('.crack-lines', { strokeDashoffset: 0 }, { strokeDashoffset: 1, duration: 0.9, ease: 'power2.inOut' }, 0.7)
    .to('.crack-glint', { opacity: 1, duration: 0.5 }, 1.3);
  gsap.from('.depannage__tel', { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.depannage__call', start: 'top 85%', toggleActions: 'play none none none' } });
  gsap.from('.depannage__services li', { opacity: 0, y: 14, duration: 0.7, ease: 'power3.out', stagger: 0.05, scrollTrigger: { trigger: '.depannage__services', start: 'top 92%', toggleActions: 'play none none none' } });
}

/* ---------- 11 · Réalisations : filtres et visionneuse ---------- */
export function initGallery() {
  const section = qs('.realisations');
  if (!section) return;
  const tiles = qsa('.tile', section);
  const filters = qsa<HTMLButtonElement>('.filtre', section);
  const box = qs('.lightbox')!;
  const img = qs<HTMLImageElement>('.lightbox__img', box)!;
  const cat = qs('.lightbox__cat', box)!;
  const txt = qs('.lightbox__text', box)!;
  const count = qs('.lightbox__count', box)!;
  let list = tiles;
  let at = 0;
  let opener: HTMLElement | null = null;

  filters.forEach((f) =>
    f.addEventListener('click', () => {
      const key = f.dataset.filter!;
      const state = Flip.getState(tiles);
      filters.forEach((b) => {
        b.setAttribute('aria-pressed', String(b === f));
        b.classList.toggle('is-on', b === f);
      });
      tiles.forEach((t) => t.classList.toggle('is-hidden', key !== 'tout' && t.dataset.cat !== key));
      list = tiles.filter((t) => !t.classList.contains('is-hidden'));
      if (reduceMotion) return ScrollTrigger.refresh();
      Flip.from(state, {
        duration: 0.7,
        ease: 'expo.out',
        absolute: true,
        scale: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.9, duration: 0.35 }),
        onComplete: () => ScrollTrigger.refresh(),
      });
    }),
  );

  const show = (i: number) => {
    at = (i + list.length) % list.length;
    const t = list[at];
    const im = qs<HTMLImageElement>('img', t)!;
    img.classList.remove('is-loaded');
    img.alt = im.alt;
    const src = im.dataset.full || im.currentSrc || im.src;
    const pre = new Image();
    pre.onload = () => {
      img.src = src;
      requestAnimationFrame(() => img.classList.add('is-loaded'));
    };
    pre.src = src;
    cat.textContent = qs('.tile__cat', t)?.textContent || '';
    txt.textContent = qs('.tile__txt', t)?.textContent || '';
    count.textContent = `${String(at + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
  };
  const focusables = () => qsa<HTMLElement>('button', box);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(at + 1);
    else if (e.key === 'ArrowLeft') show(at - 1);
    else if (e.key === 'Tab') {
      const f = focusables();
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && i === f.length - 1) {
        e.preventDefault();
        f[0].focus();
      }
    }
  };
  const outside = [qs('main'), qs('.site-header'), qs('.footer')].filter(Boolean) as HTMLElement[];
  const open = (i: number, from: HTMLElement) => {
    opener = from;
    box.hidden = false;
    show(i);
    requestAnimationFrame(() => box.classList.add('is-open'));
    lenis?.stop();
    outside.forEach((el) => el.setAttribute('inert', ''));
    document.addEventListener('keydown', onKey);
    qs<HTMLElement>('.lightbox__close', box)!.focus();
  };
  const close = () => {
    box.classList.remove('is-open');
    lenis?.start();
    outside.forEach((el) => el.removeAttribute('inert'));
    document.removeEventListener('keydown', onKey);
    setTimeout(() => (box.hidden = true), 380);
    opener?.focus();
  };
  tiles.forEach((t) => {
    const btn = qs<HTMLButtonElement>('.tile__btn', t)!;
    btn.addEventListener('click', () => open(list.indexOf(t), btn));
  });
  qs('.lightbox__close', box)!.addEventListener('click', close);
  qs('.lightbox__prev', box)!.addEventListener('click', () => show(at - 1));
  qs('.lightbox__next', box)!.addEventListener('click', () => show(at + 1));
  box.addEventListener('click', (e) => e.target === box && close());
  // glisser au doigt
  let sx = 0, sy = 0;
  box.addEventListener('pointerdown', (e) => ((sx = e.clientX), (sy = e.clientY)));
  box.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(at + (dx < 0 ? 1 : -1));
  });
  if (!reduceMotion)
    tiles.forEach((t, i) =>
      gsap.from(t, { opacity: 0, y: 40, duration: 1, ease: 'expo.out', delay: (i % 4) * 0.06, scrollTrigger: { trigger: t, start: 'top 94%', toggleActions: 'play none none none' } }),
    );
}

/* ---------- 12 · RGE ---------- */
export function initRge() {
  const s = qs('.rge');
  if (!s || reduceMotion) return;
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.rge__thermo', start: 'top 80%', toggleActions: 'play none none none' } });
  tl.fromTo('.th-wave', { '--heat': 1 }, { '--heat': 0, duration: 1.4, ease: 'power2.out', stagger: 0.15 }, 0).from('.th-in', { opacity: 0, duration: 1.2 }, 0);
  qsa('.th-arrow', s).forEach((a, i) =>
    gsap.fromTo(a, { x: -18 }, { x: 8, duration: 1.1, ease: 'power2.in', yoyo: true, repeat: -1, repeatDelay: 0.15, delay: i * 0.22 }),
  );
  gsap.from('.rge__badge', { scale: 0.8, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.rge__badge', start: 'top 85%', toggleActions: 'play none none none' } });
  gsap.from('.rge__corner', { xPercent: -60, opacity: 0, duration: 1.2, ease: 'expo.out', delay: 0.3, scrollTrigger: { trigger: '.rge__badge', start: 'top 85%', toggleActions: 'play none none none' } });
}

/* ---------- 13 · Zone d'intervention ---------- */
export function initZone() {
  const s = qs('.zone');
  if (!s || reduceMotion) return;
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.zone__map', start: 'top 75%', toggleActions: 'play none none none' } });
  tl.from('.map__iso path', { opacity: 0, duration: 1.4, ease: 'power2.out', stagger: 0.04 }, 0)
    .fromTo('.river', { '--river': 1 }, { '--river': 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.1 }, 0.1)
    .from('.map__home', { scale: 0, transformOrigin: '50% 50%', duration: 0.8, ease: 'back.out(2)' }, 0.4)
    .fromTo('.ray', { '--ray': 1 }, { '--ray': 0, duration: 1.4, ease: 'power2.out', stagger: 0.15 }, 0.6)
    .from('.zone-halo', { scale: 0, transformOrigin: '50% 50%', opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.15 }, 0.9)
    .from('.pin', { opacity: 0, y: 10, duration: 0.6, ease: 'power3.out', stagger: 0.15 }, 1.1);
}

/* ---------- 15 · La cornière jaune devient le bouton ---------- */
export function initCta() {
  const s = qs('.appel');
  if (!s) return;
  const band = qs<SVGSVGElement>('.appel__band', s)!;
  const path = qs('path', band)!;
  const btn = qs('.btn-giant', s)!;
  const shape = qs('.btn-giant__shape', s)!;
  const label = qsa('.btn-giant__label, .btn-giant__ico', s);
  gsap.from('.appel__coords > div', { opacity: 0, y: 20, duration: 0.9, ease: 'power4.out', stagger: 0.06, scrollTrigger: { trigger: '.appel__coords', start: 'top 92%', toggleActions: 'play none none none' } });
  if (reduceMotion) return;

  // La cornière en pixels : même tracé que le bouton (viewBox 1000 × 220), seule la longueur de la bande varie.
  let box = { x: 0, y: 0, w: 1, h: 1 };
  const state = { left: 0, right: 0 };
  const draw = () => {
    const sx = box.w / 1000, sy = box.h / 100;
    const { left: l, right: r } = state;
    path.setAttribute('d', `M${(l + 40 * sx).toFixed(1)} ${(120 * sy).toFixed(1)}H${(r - 70 * sx).toFixed(1)}L${(r - 25 * sx).toFixed(1)} 0H${(r - 10 * sx).toFixed(1)}L${(r - 40 * sx).toFixed(1)} ${(220 * sy).toFixed(1)}H${l.toFixed(1)}Z`);
  };
  const measure = () => {
    const sr = s.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    box = { x: br.left - sr.left, y: br.top - sr.top, w: br.width, h: br.height };
    const top = box.y - box.h * 1.2;
    gsap.set(band, { attr: { width: sr.width, height: box.h * 2.2, viewBox: `0 0 ${sr.width.toFixed(0)} ${(box.h * 2.2).toFixed(0)}` }, y: top });
  };

  gsap.set(shape, { opacity: 0 });
  gsap.set(label, { opacity: 0, yPercent: 40 });
  let played = false;
  const play = () => {
    if (played) return;
    played = true;
    measure();
    const W = s.clientWidth;
    const len = W * 1.15;
    state.right = -40;
    state.left = state.right - len;
    draw();
    const tl = gsap.timeline({ onComplete: () => gsap.set(band, { visibility: 'hidden' }) });
    tl.set(band, { visibility: 'visible' })
      // la bande traverse l'écran, montant en tête, et s'arrête au bout du bouton
      .to(state, { right: box.x + box.w, left: box.x + box.w - len, duration: 0.95, ease: 'power3.inOut', onUpdate: draw }, 0)
      // puis elle se rétracte jusqu'à n'être plus que le bouton
      .to(state, { left: box.x, duration: 0.8, ease: 'expo.inOut', onUpdate: draw }, 0.78)
      .set(shape, { opacity: 1 }, 1.58)
      .set(band, { visibility: 'hidden' }, 1.58)
      .to(label, { opacity: 1, yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 }, 1.38);
  };
  // après la remontée du volet de transition, qui couvre l'écran jusque-là
  ScrollTrigger.create({ trigger: s, start: 'top 6%', onEnter: play });
  window.addEventListener('resize', () => {
    if (!played) return;
    gsap.set(shape, { opacity: 1 });
    gsap.set(label, { opacity: 1, yPercent: 0 });
  });
}

/* ---------- 16 · Pied de page ---------- */
export function initFooter() {
  if (reduceMotion) return;
  gsap.fromTo('.footer__logo', { '--fy': '40%' }, { '--fy': '4%', ease: 'none', scrollTrigger: { trigger: '.footer__giant', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}
