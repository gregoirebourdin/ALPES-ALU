"""Cale chaque glyphe d'Archivo sur la lettre correspondante du PNG d'origine
(position, taille, inclinaison), puis écrit les tracés SVG.
"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.basePen import BasePen

S = '/tmp/claude-0/-home-user-ALPES-ALU/e931c281-c58f-5ade-8a01-497925d25013/scratchpad'
FONT = S + '/fonts/' + sys.argv[1] if len(sys.argv) > 1 else S + '/fonts/Archivo-k3k8o8UDI-1M0wlSfdzyIEkpwTM29hr-8k3YIRyOSVz60_PG_HAotBds.ttf'
SRC = '/home/user/ALPES-ALU/alpes-alu-demo/assets/raw/uploads/2021/10/logo-alpes-alu-copie.png'
SS = 8  # suréchantillonnage

im = np.asarray(Image.open(SRC).convert('RGBA')).astype(np.float64)
a = im[..., 3] / 255
lum = im[..., :3] @ np.array([0.299, 0.587, 0.114])
# hors bande : fond transparent ou blanc ; dans la bande : fond jaune (lum ~201)
cov = a * np.clip(1 - lum / 243.0, 0, 1)
band = np.zeros_like(cov, bool); band[64:97] = True
cov[band] = (a * np.clip(1 - lum / 201.0, 0, 1))[band]
cov[cov < 0.05] = 0
H, W = cov.shape

font = TTFont(FONT)
gs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font['head'].unitsPerEm

class FlatPen(BasePen):
    def __init__(self, gs):
        super().__init__(gs); self.contours = []; self.cur = []
    def _moveTo(self, p): self.cur = [p]
    def _lineTo(self, p): self.cur.append(p)
    def _curveToOne(self, p1, p2, p3):
        p0 = self.cur[-1]
        for t in np.linspace(0, 1, 9)[1:]:
            x = (1-t)**3*p0[0] + 3*(1-t)**2*t*p1[0] + 3*(1-t)*t*t*p2[0] + t**3*p3[0]
            y = (1-t)**3*p0[1] + 3*(1-t)**2*t*p1[1] + 3*(1-t)*t*t*p2[1] + t**3*p3[1]
            self.cur.append((x, y))
    def _qCurveToOne(self, p1, p2):
        p0 = self.cur[-1]
        for t in np.linspace(0, 1, 9)[1:]:
            x = (1-t)**2*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0]
            y = (1-t)**2*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1]
            self.cur.append((x, y))
    def _closePath(self):
        if self.cur: self.contours.append(np.array(self.cur)); self.cur = []
    _endPath = _closePath

def glyph_contours(ch):
    pen = FlatPen(gs); gs[cmap[ord(ch)]].draw(pen)
    return pen.contours

def transform(contours, p, shear):
    # p = (x0, ybase, sx, sy) : x' = x0 + sx*(x + shear*y) ; y' = ybase - sy*y  (pixels)
    x0, yb, sx, sy = p
    return [np.stack([x0 + sx * (c[:, 0] + shear * c[:, 1]), yb - sy * c[:, 1]], 1) for c in contours]

def raster(contours, box):
    bx0, by0, bx1, by1 = box
    w, h = (bx1 - bx0) * SS, (by1 - by0) * SS
    acc = np.zeros((h, w), bool)
    for c in contours:
        img = Image.new('1', (w, h), 0)
        pts = [((x - bx0) * SS, (y - by0) * SS) for x, y in c]
        ImageDraw.Draw(img).polygon(pts, fill=1)
        acc ^= np.asarray(img)
    return acc.reshape(by1 - by0, SS, bx1 - bx0, SS).mean((1, 3))

def iou(r, t):
    return np.minimum(r, t).sum() / max(np.maximum(r, t).sum(), 1e-9)

def fit_letter(ch, comp, shear):
    x0, y0, x1, y1 = comp
    box = (max(x0 - 3, 0), max(y0 - 3, 0), min(x1 + 3, W), min(y1 + 3, H))
    target = cov[box[1]:box[3], box[0]:box[2]].copy()
    # isole la lettre : masque les colonnes hors composante élargie
    cs = glyph_contours(ch)
    allp = np.concatenate(cs)
    gx0 = (allp[:, 0] + shear * allp[:, 1]).min(); gx1 = (allp[:, 0] + shear * allp[:, 1]).max()
    gy0, gy1 = allp[:, 1].min(), allp[:, 1].max()
    sy = (y1 - y0) / (gy1 - gy0); sx = (x1 - x0) / (gx1 - gx0)
    p = np.array([x0 - sx * gx0, y0 + sy * gy1, sx, sy], float)
    best = iou(raster(transform(cs, p, shear), box), target)
    steps = np.array([0.5, 0.5, sx * 0.03, sy * 0.03])
    for it in range(6):
        improved = True
        while improved:
            improved = False
            for k in range(4):
                for d in (-1, 1):
                    q = p.copy(); q[k] += d * steps[k]
                    s = iou(raster(transform(cs, q, shear), box), target)
                    if s > best + 1e-5: best, p, improved = s, q, True
        steps /= 2
    return p, best

def comps(mask):
    from collections import deque
    m = mask > 0.5; lab = np.zeros(m.shape, int); n = 0; out = []
    for y in range(m.shape[0]):
        for x in range(m.shape[1]):
            if m[y, x] and not lab[y, x]:
                n += 1; q = deque([(y, x)]); lab[y, x] = n; pts = []
                while q:
                    cy, cx = q.popleft(); pts.append((cy, cx))
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            yy, xx = cy + dy, cx + dx
                            if 0 <= yy < m.shape[0] and 0 <= xx < m.shape[1] and m[yy, xx] and not lab[yy, xx]:
                                lab[yy, xx] = n; q.append((yy, xx))
                ys, xs = zip(*pts)
                if len(pts) > 3: out.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1))
    return sorted(out)

if __name__ == '__main__':
    top = cov.copy(); top[63:] = 0
    bot = cov.copy(); bot[:63] = 0
    lines = [('Alpes Alu'.replace(' ', ''), top), ('MENUISERIE ALUMINIUM'.replace(' ', ''), bot)]
    result = {'font': FONT.split('/')[-1], 'upm': upm, 'lines': []}
    for text, mask in lines:
        cps = comps(mask)
        assert len(cps) == len(text), (text, len(cps))
        best_line = None
        for shear in np.arange(-0.04, 0.121, 0.02):
            fits = [fit_letter(ch, c, shear) for ch, c in zip(text, cps)]
            score = np.mean([f[1] for f in fits])
            if not best_line or score > best_line[0]:
                best_line = (score, shear, fits)
        score, shear, fits = best_line
        print(text, 'shear', round(shear, 3), 'IoU moyen', round(score, 4), [round(f[1], 3) for f in fits])
        result['lines'].append({'text': text, 'shear': shear, 'letters': [{'ch': ch, 'p': f[0].tolist(), 'iou': f[1]} for ch, f in zip(text, fits)]})
    json.dump(result, open(S + '/logofit.json', 'w'), indent=1)
