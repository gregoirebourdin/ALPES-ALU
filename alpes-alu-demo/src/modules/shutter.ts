// Transition signature : un volet roulant descend lame par lame sur l'écran,
// ajours ouverts (la lumière passe entre les lames), se ferme, puis remonte sur
// la section suivante. Entièrement lié au scroll, donc réversible ; jamais bloquant.
import { ScrollTrigger } from '../lib/gsap';
import { reduceMotion, qs, qsa, range } from '../lib/env';

const N = 14;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;

export function initShutters() {
  if (reduceMotion) return;
  const root = qs('.shutter');
  const marks = qsa('.shutter-mark');
  if (!root || !marks.length) return;
  const curtain = qs('.shutter__curtain', root)!;
  const coffre = qs('.shutter__coffre', root)!;
  const label = qs('.shutter__label', root)!;
  const slats = Array.from({ length: N }, (_, i) => {
    const d = document.createElement('div');
    d.className = i === N - 1 ? 'slat slat--last' : 'slat';
    curtain.appendChild(d);
    return d;
  });

  let vh = window.innerHeight;
  let h = 0;
  let gapOpen = 0;
  let coffreH = 0;
  const measure = () => {
    vh = window.innerHeight;
    h = Math.ceil(vh / N) + 1;
    gapOpen = Math.max(3, Math.round(h * 0.14));
    coffreH = coffre.offsetHeight;
    slats.forEach((s) => (s.style.height = `${h}px`));
  };
  measure();
  window.addEventListener('resize', measure);

  const render = (p: number) => {
    const down = easeOut(range(p, 0, 0.26));
    const close = range(p, 0.22, 0.34) * (1 - range(p, 0.42, 0.5));
    const up = easeIn(range(p, 0.5, 1));
    const g = gapOpen * (1 - close);
    const bottom = coffreH + (vh - coffreH) * down * (1 - up);
    for (let i = 0; i < N; i++) {
      const y = bottom - (N - i) * h - (N - 1 - i) * g;
      const s = slats[i];
      s.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
      s.style.setProperty('--gap', `${g.toFixed(1)}px`);
    }
    const c = 1 - range(p, 0, 0.05) + range(p, 0.95, 1);
    coffre.style.transform = `translate3d(0, ${(-101 * Math.min(1, c)).toFixed(1)}%, 0)`;
  };

  marks.forEach((mark) => {
    const next = mark.nextElementSibling as HTMLElement | null;
    if (!next) return;
    ScrollTrigger.create({
      trigger: next,
      start: 'top bottom',
      end: 'top top',
      onToggle: (st) => {
        root.classList.toggle('is-on', st.isActive);
        if (st.isActive) label.textContent = mark.dataset.shutter || '';
        else render(st.progress > 0.5 ? 1 : 0);
      },
      onUpdate: (st) => render(st.progress),
    });
  });
}
