import numpy as np, json
from PIL import Image
im = np.asarray(Image.open('/home/user/ALPES-ALU/alpes-alu-demo/assets/raw/uploads/2021/10/logo-alpes-alu-copie.png').convert('RGBA')).astype(float)
A = im[..., 3] / 255
H, W = A.shape
def cross_row(y, xs, rising=True):
    # première transition 0->1 (rising) ou 1->0 le long de x dans xs
    v = A[y, xs]
    for i in range(len(xs) - 1):
        a0, a1 = v[i], v[i + 1]
        if rising and a0 < 0.5 <= a1: return xs[i] + (0.5 - a0) / (a1 - a0) * (xs[i+1]-xs[i]) + 0.5
        if not rising and a0 >= 0.5 > a1: return xs[i] + (a0 - 0.5) / (a0 - a1) * (xs[i+1]-xs[i]) + 0.5
    return None
def cross_col(x, ys, rising=True):
    v = A[ys, x]
    for i in range(len(ys) - 1):
        a0, a1 = v[i], v[i + 1]
        if rising and a0 < 0.5 <= a1: return ys[i] + (0.5 - a0) / (a1 - a0) + 0.5
        if not rising and a0 >= 0.5 > a1: return ys[i] + (a0 - 0.5) / (a0 - a1) + 0.5
    return None
def fit(pts):  # x = a*y + b
    p = np.array([q for q in pts if q[0] is not None and q[1] is not None])
    a, b = np.polyfit(p[:, 1], p[:, 0], 1); res = p[:, 0] - (a * p[:, 1] + b)
    return a, b, np.abs(res).max(), len(p)
def fit_h(pts):  # y = c*x + d
    p = np.array([q for q in pts if q[1] is not None])
    c, d = np.polyfit(p[:, 0], p[:, 1], 1); res = p[:, 1] - (c * p[:, 0] + d)
    return c, d, np.abs(res).max(), len(p)
xs = np.arange(0, W)
# E1 bord haut de la bande (transition 0->1 en descendant)
E1 = fit_h([(x + 0.5, cross_col(x, np.arange(60, 70))) for x in range(30, 255)])
# E2 bord bas (1->0 en descendant, image de 98 px)
E2 = fit_h([(x + 0.5, cross_col(x, np.arange(90, H), rising=False)) for x in range(12, 268)])
# E3 bord gauche oblique
E3 = fit([(cross_row(y, np.arange(0, 40)), y + 0.5) for y in range(66, 95)])
# E4 bord droit extérieur (1->0 vers la droite)
E4 = fit([(cross_row(y, np.arange(255, W), rising=False), y + 0.5) for y in range(3, 95)])
# E5 bord intérieur de la jambe (0->1 vers la droite), en partant après le « u »
E5 = fit([(cross_row(y, np.arange(int(287 - 0.36 * (y - 2)) - 4, W)), y + 0.5) for y in range(3, 62)])
# E6 bord haut de la jambe
top_rows = [(x + 0.5, cross_col(x, np.arange(0, 8))) for x in range(285, W)]
print('E1 haut', E1, '\nE2 bas', E2, '\nE3 gauche', E3, '\nE4 droite', E4, '\nE5 jambe int.', E5, '\nE6', top_rows)
def inter_vh(v, h):  # x = a*y+b ; y = c*x+d
    a, b = v[0], v[1]; c, d = h[0], h[1]
    y = (c * b + d) / (1 - c * a); x = a * y + b; return (x, y)
def inter_vv_y(v, y): return (v[0] * y + v[1], y)
ytop = np.mean([p[1] for p in top_rows if p[1] is not None])
poly = [inter_vh(E3, E1), inter_vh(E5, E1), inter_vv_y(E5, ytop), inter_vv_y(E4, ytop), inter_vh(E4, E2), inter_vh(E3, E2)]
print('ytop', ytop)
print('polygone', [(round(x, 2), round(y, 2)) for x, y in poly])
for name, e in (('E3', E3), ('E4', E4), ('E5', E5)): print(name, 'angle / verticale', round(np.degrees(np.arctan(-e[0])), 2), '°')
json.dump({'poly': poly}, open('bandfit.json', 'w'))

pts = []
for y in range(8, 95):
    x = cross_row(y, np.arange(255, W), rising=False)
    if x is not None and x < W - 0.6: pts.append((x, y + 0.5))
E4b = fit(pts)
print('E4 robuste', E4b, 'angle', round(np.degrees(np.arctan(-E4b[0])), 2))
ytop = 2.03; ytb = (E1[1] + E1[0] * 140)  # bord haut moyen
ytb = 64.6
E1h = (0.0, ytb)
poly = [inter_vh(E3, E1h), inter_vh(E5, E1h), inter_vv_y(E5, ytop), inter_vv_y(E4b, ytop), inter_vh(E4b, E2), inter_vh(E3, E2)]
print('polygone final', [(round(x, 2), round(y, 2)) for x, y in poly])
json.dump({'poly': poly}, open('bandfit.json', 'w'))

def last_fall(y):
    v = A[y]
    idx = np.where(v >= 0.5)[0]
    if not len(idx): return None
    i = idx.max()
    if i >= W - 1: return None
    a0, a1 = v[i], v[i + 1]
    return i + (a0 - 0.5) / (a0 - a1) + 0.5
pts = [(last_fall(y), y + 0.5) for y in range(3, 96)]
pts = [p for p in pts if p[0] is not None]
E4c = fit(pts)
print('E4 dernier front', E4c, 'angle', round(np.degrees(np.arctan(-E4c[0])), 2), 'n', len(pts))
poly = [inter_vh(E3, E1h), inter_vh(E5, E1h), inter_vv_y(E5, ytop), inter_vv_y(E4c, ytop), inter_vh(E4c, E2), inter_vh(E3, E2)]
print('polygone final', [(round(x, 2), round(y, 2)) for x, y in poly])
json.dump({'poly': poly}, open('bandfit.json', 'w'))
