import json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

S = '/tmp/claude-0/-home-user-ALPES-ALU/e931c281-c58f-5ade-8a01-497925d25013/scratchpad'
OUT = '/home/user/ALPES-ALU/alpes-alu-demo/src/assets/logo'
fit = json.load(open(S + '/logofit.json'))
band = json.load(open(S + '/bandfit.json'))['poly']
font = TTFont(S + '/fonts/' + fit['font'])
gs = font.getGlyphSet(); cmap = font.getBestCmap()
K = 10  # espace de coordonnées x10 : viewBox 0 0 2910 980

def fmt(v):
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s

def line_path(line):
    d = []
    sh = line['shear']
    for L in line['letters']:
        x0, yb, sx, sy = L['p']
        pen = SVGPathPen(gs, ntos=fmt)
        tp = TransformPen(pen, (sx * K, 0, sx * sh * K, -sy * K, x0 * K, yb * K))
        gs[cmap[ord(L['ch'])]].draw(tp)
        d.append(pen.getCommands())
    return ''.join(d)

word = line_path(fit['lines'][0])
tag = line_path(fit['lines'][1])
bandd = 'M' + 'L'.join(f'{fmt(x * K)} {fmt(y * K)}' for x, y in band) + 'Z'

def svg(body, title='Alpes Alu, menuiserie aluminium'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2910 980" role="img" aria-label="{title}">{body}</svg>\n'

import os
os.makedirs(OUT, exist_ok=True)
Y = '#F4D20D'
open(OUT + '/logo-alpes-alu.svg', 'w').write(svg(f'<path fill="{Y}" d="{bandd}"/><path fill="#000" d="{word}"/><path fill="#000" d="{tag}"/>'))
open(OUT + '/logo-alpes-alu-jaune.svg', 'w').write(svg(f'<path fill="{Y}" d="{bandd}"/><path fill="#000" d="{word}"/><path fill="#fff" d="{tag}"/>'))
open(OUT + '/logo-alpes-alu-blanc.svg', 'w').write(svg(f'<path fill="#FAFAFA" fill-rule="evenodd" d="{bandd}{tag}"/><path fill="#fff" d="{word}"/>'))
json.dump({'band': bandd, 'word': word, 'tag': tag, 'viewBox': '0 0 2910 980'}, open(OUT + '/logo-paths.json', 'w'))
print('ok', len(word), len(tag), bandd)
