// Préférences et capacités de l'appareil, lues une fois au démarrage.
const mq = (q: string) => window.matchMedia(q);

export const reduceMotion = mq('(prefers-reduced-motion: reduce)').matches;
export const finePointer = mq('(hover: hover) and (pointer: fine)').matches;
export const isDesktop = () => mq('(min-width: 1024px)').matches;
export const isPhone = () => mq('(max-width: 767px)').matches;

type NavigatorPlus = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

/** Appareil modeste : on garde la fenêtre SVG plutôt que le WebGL. */
export function isModestDevice(): boolean {
  const n = navigator as NavigatorPlus;
  const mem = n.deviceMemory;
  const cores = n.hardwareConcurrency;
  const conn = n.connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && /(^|-)2g$|3g/.test(conn.effectiveType)) return true;
  if (mem !== undefined && mem < 4) return true;
  if (cores !== undefined && cores < 4) return true;
  return false;
}

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') as WebGL2RenderingContext | null;
    if (!gl) return false;
    const ok = !!gl.getParameter(gl.VERSION);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

export const qs = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
export const qsa = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => Array.from(root.querySelectorAll<T>(sel));

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Remappe t de [a, b] vers [0, 1], borné. */
export const range = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
