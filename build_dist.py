#!/usr/bin/env python3
"""Portal builds. Writes dist/checkout-chaos-poki.zip, dist/checkout-chaos-crazygames.zip and dist/checkout-chaos-web.zip.
Each ZIP has index.html at the root, relative paths only, and no debug params needed. The platform is baked in via window.BUILD_PLATFORM.
Run: python3 build_strings.py && python3 build_sprites.py && python3 build_dist.py"""
import os, re, sys, zipfile
FULLV = '--full' in sys.argv  # optional: bake window.BUILD_FULL_VERSION=true and write *-full.zip (not used for the demo release)
H = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(H, 'dist'); os.makedirs(OUT, exist_ok=True)
FILES = ['storage.js', 'platform.js', 'analytics.js', 'strings.js', 'data.js', 'data.json', 'sprites.js', 'game.js']
html = open(os.path.join(H, 'index.html'), encoding='utf-8').read()
assert not re.search(r'(src|href)="(https?:)?//', html), 'index.html must not reference external URLs'
for plat, name in [('poki', 'checkout-chaos-poki.zip'), ('crazygames', 'checkout-chaos-crazygames.zip'), ('none', 'checkout-chaos-web.zip')]:
    h = html.replace('<script src="storage.js"></script>', '<script>window.BUILD_PLATFORM=%r;%s</script>\n<script src="storage.js"></script>' % (plat, 'window.BUILD_FULL_VERSION=true;' if FULLV else ''))
    if FULLV: name = name.replace('.zip', '-full.zip')
    p = os.path.join(OUT, name)
    with zipfile.ZipFile(p, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('index.html', h)
        for f in FILES: z.write(os.path.join(H, f), f)
    print(name, os.path.getsize(p) // 1024, 'KB')
