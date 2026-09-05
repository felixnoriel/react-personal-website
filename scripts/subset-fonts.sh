#!/usr/bin/env bash
# Instance and subset the two typefaces offline. The outputs are committed to
# src/assets/fonts/, so the deploy never needs fontTools.
#
#   python3 -m venv .fontenv && .fontenv/bin/pip install fonttools brotli
#   bash scripts/subset-fonts.sh <path-to-Fraunces[SOFT,WONK,opsz,wght].ttf> <path-to-HostGrotesk[wght].ttf> <path-to-HostGrotesk-Italic[wght].ttf>
#
# Fraunces: opsz pinned 144, SOFT 0, WONK 1 (the deliberately peculiar
# letterforms; metrically free), wght 500-600 (the only display weights used),
# content-subset to the characters that appear in the source data plus the
# printable ASCII block. Host Grotesk: wght 400-600, full latin (it renders
# user-typed form input and the blog bodies, so it is not content-subset).
# fontTools' default layout-feature set is kept on purpose: it carries ccmp,
# mark, mkmk, locl and rvrn, which a variable font needs to compose correctly.
set -euo pipefail
FT=${FONTTOOLS:-.fontenv/bin}
OUT=src/assets/fonts
TMP=$(mktemp -d)
LATIN="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2030,U+2039-203A,U+2044,U+2074,U+20AC,U+2122,U+2190-2193,U+2197,U+2212,U+2215,U+FEFF,U+FFFD"

"$FT/fonttools" varLib.instancer -q -o "$TMP/fraunces.ttf" "$1" opsz=144 SOFT=0 WONK=1 wght=500:600
"$FT/fonttools" varLib.instancer -q -o "$TMP/host.ttf" "$2" wght=400:600
"$FT/fonttools" varLib.instancer -q -o "$TMP/host-italic.ttf" "$3" wght=400:600

# the display charset: printable ASCII plus every non-ASCII character in the source
"$FT/python" - <<'PY' > "$TMP/display.chars"
import glob, html
chars = set(chr(c) for c in range(0x20, 0x7F))
for p in glob.glob('src/data/*.ts') + glob.glob('src/**/*.tsx', recursive=True):
    t = html.unescape(open(p, encoding='utf-8').read())
    chars.update(ch for ch in t if 0x7E < ord(ch) < 0x2500 and not ch.isspace())
chars.update(' –—‘’“”•…·°×−éèàüöäçñïâêôûáíóú')
print(''.join(sorted(chars)), end='')
PY

"$FT/pyftsubset" "$TMP/fraunces.ttf" --text-file="$TMP/display.chars" --flavor=woff2 --no-hinting --desubroutinize --name-IDs='*' --notdef-outline --output-file="$OUT/fraunces-display.woff2"
"$FT/pyftsubset" "$TMP/host.ttf" --unicodes="$LATIN" --layout-features+=case,frac,ordn,ss02 --flavor=woff2 --no-hinting --desubroutinize --name-IDs='*' --notdef-outline --output-file="$OUT/host-grotesk.woff2"
"$FT/pyftsubset" "$TMP/host-italic.ttf" --unicodes="$LATIN" --layout-features+=case --flavor=woff2 --no-hinting --desubroutinize --name-IDs='*' --notdef-outline --output-file="$OUT/host-grotesk-italic.woff2"
ls -la "$OUT"/*.woff2
rm -rf "$TMP"
