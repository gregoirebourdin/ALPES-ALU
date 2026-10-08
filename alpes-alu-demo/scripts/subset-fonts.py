"""Réduit les polices : caractères français utiles seulement, axes inutiles figés.
Usage : python3 scripts/subset-fonts.py (nécessite fonttools et brotli)."""
import os, sys
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(ROOT, 'assets/fonts-src')
OUT = os.path.join(ROOT, 'public/fonts')
os.makedirs(OUT, exist_ok=True)

# ASCII imprimable, latin-1 (accents français), œ Œ æ Æ ÿ Ÿ, ponctuation typographique,
# espaces insécables (fine et normale), flèches et signes utilisés dans la page.
UNICODES = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x100)) +
    [0x152, 0x153, 0x178, 0x2009, 0x200A, 0x202F, 0x2010, 0x2011, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D,
     0x2026, 0x2022, 0x2032, 0x2033, 0x20AC, 0x2122, 0x2190, 0x2191, 0x2192, 0x2193, 0x2197, 0x2198, 0x2212, 0x00D7, 0x2264, 0x2265, 0x2192]
)

def run(src, dst, limits=None, features=('kern', 'liga', 'calt', 'tnum', 'lnum', 'case', 'ss01')):
    f = TTFont(os.path.join(SRC, src))
    if limits and 'fvar' in f:
        f = instancer.instantiateVariableFont(f, limits)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = list(features)
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    opts.hinting = False
    opts.desubroutinize = True
    s = subset.Subsetter(opts)
    s.populate(unicodes=UNICODES)
    s.subset(f)
    f.flavor = 'woff2'
    f.save(os.path.join(OUT, dst))
    print(dst, round(os.path.getsize(os.path.join(OUT, dst)) / 1024, 1), 'Ko')

run('archivo-normal-100-900.woff2', 'archivo-var.woff2', {'wght': (600, 900), 'wdth': (75, 125)})
run('instrument-sans-normal-400-700.woff2', 'instrument-sans-var.woff2', {'wdth': 100, 'wght': (400, 700)})
run('ibm-plex-mono-normal-300.woff2', 'plex-mono-300.woff2')
run('ibm-plex-mono-normal-400.woff2', 'plex-mono-400.woff2')
