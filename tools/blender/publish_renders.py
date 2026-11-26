"""Convert transparent PNG renders to WebP (alpha kept) under public/products/<pid>/."""
import os, sys
from PIL import Image
SRC = os.environ.get("VAELIS_WORK", "D:/vaelis-work") + "/renders/tees"
DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "public", "products")
for pid in (sys.argv[1:] or os.listdir(SRC)):
    src = os.path.join(SRC, pid)
    if not os.path.isdir(src):
        continue
    os.makedirs(os.path.join(DST, pid), exist_ok=True)
    for f in sorted(os.listdir(src)):
        if f.endswith(".png"):
            im = Image.open(os.path.join(src, f)).convert("RGBA")
            # one identical 4:5 window for every render keeps the scale true across products
            im = im.crop((90, 110, 870, 1085))
            bbox = im.getbbox()
            im.save(os.path.join(DST, pid, f.replace(".png", ".webp")), "WEBP", quality=86, method=5)
            print(pid, f, im.size, bbox)
