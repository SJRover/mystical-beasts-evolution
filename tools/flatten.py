"""Flatten every PNG under a folder to RGB (no alpha), as Apple requires for store images.

Usage: py tools/flatten.py "App Store 1.3"
"""
import pathlib
import sys

from PIL import Image

root = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'App Store 1.3')
for p in sorted(root.rglob('*.png')):
    im = Image.open(p)
    if im.mode != 'RGB':
        bg = Image.new('RGB', im.size, (0, 0, 0))
        bg.paste(im, mask=im.getchannel('A') if 'A' in im.getbands() else None)
        bg.save(p, optimize=True)
    print(p.relative_to(root), im.size, '->', Image.open(p).mode)
