#!/usr/bin/env python3
"""Render the social card (public/og.png, 1200x630) as real type.

Text is converted to outlines with fontTools so the card uses the site's own
faces without needing them installed on the rendering machine; the SVG is
then rasterised with sharp (bun -e). One-off: the output is committed.

    python3 scripts/build-og.py   # needs: pip install fonttools brotli

Font sources are the shipped subsets in src/assets/fonts/.
"""
import subprocess, sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, 'src', 'assets', 'fonts')
OUT_SVG = os.path.join(ROOT, 'scripts', '.og.svg')
OUT_PNG = os.path.join(ROOT, 'public', 'og.png')

PAPER, INK, INK3, PEN, RULE, ACCENT = '#f5f2ea', '#1a1714', '#6b625a', '#3e4c5a', '#cfc7ba', '#a82f1c'
W, H, DATUM = 1200, 630, 96

def load(name, wght=None):
    f = TTFont(os.path.join(FONTS, name))
    if wght is not None and 'fvar' in f:
        f = instancer.instantiateVariableFont(f, {'wght': wght})
    return f

def text_path(font, text, x, y, size, letter_spacing=0.0):
    """Return (svg d, advance) for `text` set at font-size `size` with its baseline at y."""
    upm = font['head'].unitsPerEm
    scale = size / upm
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    hmtx = font['hmtx']
    kern = {}
    d = []
    cx = x
    for ch in text:
        gname = cmap.get(ord(ch))
        if gname is None:
            cx += size * 0.25
            continue
        pen = SVGPathPen(glyphs)
        tpen = TransformPen(pen, (scale, 0, 0, -scale, cx, y))
        glyphs[gname].draw(tpen)
        d.append(pen.getCommands())
        cx += hmtx[gname][0] * scale + letter_spacing * size
    return ' '.join(d), cx - x

fraunces = load('fraunces-display.woff2', 600)
host = load('host-grotesk.woff2', 400)
mono = load('monaspace-xenon.woff2')

parts = [f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
         f'<rect x="{DATUM}" y="0" width="1" height="{H}" fill="{RULE}"/>']

# status line
sq = 9
parts.append(f'<rect x="{DATUM+24}" y="{112-sq}" width="{sq}" height="{sq}" fill="{ACCENT}"/>')
d, adv = text_path(mono, 'available for work', DATUM + 24 + sq + 14, 112, 20, 0.05)
parts.append(f'<path d="{d}" fill="{INK3}"/>')
d2, _ = text_path(mono, 'Bangkok · UTC+7 · remote-friendly', DATUM + 24 + sq + 14 + adv + 40, 112, 20, 0.05)
parts.append(f'<rect x="{DATUM + 24 + sq + 14 + adv + 12}" y="{112 - 7}" width="16" height="1" fill="{RULE}"/>')
parts.append(f'<path d="{d2}" fill="{INK3}"/>')

# headline
d, adv = text_path(fraunces, 'Product Engineer', DATUM + 24, 300, 128, -0.02)
parts.append(f'<path d="{d}" fill="{INK}"/>')

# dimension line: rule with the three words knocking gaps into it
y = 362
x0 = DATUM + 24
parts.append(f'<rect x="{x0}" y="{y}" width="{adv}" height="1" fill="{RULE}"/>')
parts.append(f'<rect x="{x0}" y="{y-6}" width="1" height="13" fill="{INK3}"/>')
parts.append(f'<rect x="{x0+adv-1}" y="{y-6}" width="1" height="13" fill="{INK3}"/>')
cx = x0
for i, word in enumerate(['Startups', 'Web3', 'Fintech']):
    wd, wadv = text_path(mono, word, 0, 0, 22, 0.04)
    pad_l = 0 if i == 0 else 22
    wx = cx + pad_l
    parts.append(f'<rect x="{wx-8 if i else wx}" y="{y-14}" width="{wadv+16}" height="28" fill="{PAPER}"/>')
    wd, _ = text_path(mono, word, wx, y + 8, 22, 0.04)
    parts.append(f'<path d="{wd}" fill="{PEN}"/>')
    cx = wx + wadv + 22

# bio line
d, _ = text_path(host, "Senior full-stack engineer and technical co-founder.", DATUM + 24, 428, 30)
parts.append(f'<path d="{d}" fill="{INK}"/>')
d, _ = text_path(host, "13+ years shipping software for startups across Web3, fintech, hospitality, and media.", DATUM + 24, 466, 26)
parts.append(f'<path d="{d}" fill="{INK3}"/>')

# the four figures as small callouts
figs = [('7.5M+', 'messages / day'), ('150k', 'monthly actives'), ('80%', 'faster p95'), ('1.8M+', 'users reached')]
fx = DATUM + 24
for fig, label in figs:
    d, adv = text_path(fraunces, fig, fx, 548, 44, -0.01)
    parts.append(f'<path d="{d}" fill="{INK}"/>')
    parts.append(f'<rect x="{fx}" y="562" width="{max(adv, 150)}" height="1" fill="{RULE}"/>')
    parts.append(f'<rect x="{fx}" y="558" width="1" height="9" fill="{INK3}"/>')
    parts.append(f'<rect x="{fx+max(adv,150)-1}" y="558" width="1" height="9" fill="{INK3}"/>')
    ld, _ = text_path(mono, label, fx, 590, 18, 0.04)
    parts.append(f'<path d="{ld}" fill="{INK3}"/>')
    fx += max(adv, 150) + 56

# name, bottom right on the sheet's edge
d, adv = text_path(mono, 'Felix Noriel', 0, 0, 20, 0.05)
d, _ = text_path(mono, 'Felix Noriel', W - 64 - adv, 590, 20, 0.05)
parts.append(f'<path d="{d}" fill="{INK3}"/>')

svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">' + ''.join(parts) + '</svg>'
open(OUT_SVG, 'w').write(svg)
subprocess.run(['bun', '-e', f'''
import sharp from "sharp";
await sharp("{OUT_SVG}").png({{ compressionLevel: 9, palette: true, colors: 64 }}).toFile("{OUT_PNG}");
const fs = await import("node:fs"); console.log("og.png", fs.statSync("{OUT_PNG}").size, "bytes");
'''], check=True, cwd=ROOT)
os.remove(OUT_SVG)
