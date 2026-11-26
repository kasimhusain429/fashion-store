"""Swatch colours sampled from the finished renders, so the colour dots match the photographs.

For each front render, takes the median colour of the body (centre of the garment, fully opaque
pixels), then the median across every product cut in that colourway.
Usage: python sample_swatches.py  -> prints {colourway: "#rrggbb"}
"""
import os, json, statistics
from PIL import Image

SRC = os.environ.get("VAELIS_WORK", "D:/vaelis-work") + "/renders/tees"
samples = {}
for pid in sorted(os.listdir(SRC)):
    d = os.path.join(SRC, pid)
    if not os.path.isdir(d):
        continue
    for f in os.listdir(d):
        if not f.endswith("-front.png"):
            continue
        cid = f.split("-")[0]
        im = Image.open(os.path.join(d, f)).convert("RGBA")
        x0, y0, x1, y1 = im.getbbox()
        w, h = x1 - x0, y1 - y0
        box = im.crop((x0 + int(w * 0.38), y0 + int(h * 0.45), x0 + int(w * 0.62), y0 + int(h * 0.7)))
        px = [p[:3] for p in box.getdata() if p[3] == 255]
        if px:
            samples.setdefault(cid, []).append(tuple(statistics.median(c[i] for c in px) for i in range(3)))
out = {}
for cid, vals in samples.items():
    rgb = [int(statistics.median(v[i] for v in vals)) for i in range(3)]
    out[cid] = "#%02x%02x%02x" % tuple(rgb)
print(json.dumps(out, indent=1))
