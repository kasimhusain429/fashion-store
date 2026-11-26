"""Pattern-space detail height maps (rib collar, hems, seams, pocket, prints) + realistic jersey knit maps.

Usage: python gen_details.py <outline_dir> <out_dir> [ids...]
Reads <id>_outline.json written by tee.py; writes <id>_detail.png (lossless grayscale height),
<id>_ink.png (lossless colour multiplier for prints/pocket), plus jersey_normal.png and jersey_weave.png.
"""
import sys, os, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

src, out = sys.argv[1], sys.argv[2]
ids = sys.argv[3:]
os.makedirs(out, exist_ok=True)
# Render at 2x supersampled (4096x2048) and downsample to 2048x1024 for crisp anti-aliased stitches
SS = 2
W, H = 2048, 1024
WS, HS = W * SS, H * SS
NECK, SHOULDER, SLEEVE_TOP, CUFF, SLEEVE_UNDER, SIDE, HEM, ARMHOLE = 1, 2, 3, 4, 5, 6, 7, 8
SEW = {SHOULDER, SLEEVE_TOP, SLEEVE_UNDER, SIDE}
FONT = next((f for f in ("C:/Windows/Fonts/bahnschrift.ttf", "C:/Windows/Fonts/arialbd.ttf") if os.path.exists(f)), None)

EXTRAS = {
    "monolith": {"back_print": "VAELIS"},
    "column": {"chest_mark": "VAELIS"},
    "pocket": {"pocket": True},
    "kimono": {"back_print": "CHRONO-FOLD"},
}


def to_px(x, z, m, panel, w=WS, h=HS):
    S = m["S"]
    if panel == 0:
        u = 0.5 * (x - m["xmin"]) / S
    else:
        u = 0.5 + 0.5 * (x - m["xmin"]) / S
    v = (z - m["zmin"]) / S
    return u * w, (1 - v) * h


def segments(poly, label):
    """Contiguous runs of points carrying `label` WITHOUT leaking across corners."""
    runs, cur = [], []
    n = len(poly)
    # Find start index where label transitions so a wrap-around run isn't split
    start = 0
    for i in range(n):
        if poly[i][2] == label and poly[(i - 1) % n][2] != label:
            start = i
            break
    for k in range(n):
        idx = (start + k) % n
        x, z, lab = poly[idx]
        if lab == label:
            cur.append((x, z))
        elif cur:
            runs.append(cur)
            cur = []
    if cur:
        runs.append(cur)
    return runs


def inside(pt, poly):
    x, z = pt
    c = False
    n = len(poly)
    for i in range(n):
        x1, z1 = poly[i]
        x2, z2 = poly[(i + 1) % n]
        if (z1 > z) != (z2 > z):
            xi = x1 + (z - z1) * (x2 - x1) / (z2 - z1)
            if xi > x:
                c = not c
    return c


def inward_normal(a, b, poly_xz):
    dx, dz = b[0] - a[0], b[1] - a[1]
    L = math.hypot(dx, dz) or 1.0
    nx, nz = -dz / L, dx / L
    mx, mz = (a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5
    if not inside((mx + nx * 0.005, mz + nz * 0.005), poly_xz):
        nx, nz = -nx, -nz
    return nx, nz


def resample(run, step):
    if len(run) < 2:
        return list(run)
    pts = [run[0]]
    acc = 0.0
    for i in range(1, len(run)):
        a, b = run[i - 1], run[i]
        d = math.hypot(b[0] - a[0], b[1] - a[1])
        if d < 1e-7:
            continue
        while acc + d >= step:
            t = (step - acc) / d
            a = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
            pts.append(a)
            d = math.hypot(b[0] - a[0], b[1] - a[1])
            acc = 0.0
        acc += d
    if math.hypot(run[-1][0] - pts[-1][0], run[-1][1] - pts[-1][1]) > step * 0.25:
        pts.append(run[-1])
    return pts


def offset_run(run, dist, poly_xz):
    if len(run) < 2:
        return list(run)
    out_pts = []
    n = len(run)
    for i in range(n):
        a = run[max(i - 1, 0)]
        b = run[min(i + 1, n - 1)]
        nx, nz = inward_normal(a, b, poly_xz)
        # Clamp corner offset slightly if near endpoints so miter never shoots out
        out_pts.append((run[i][0] + nx * dist, run[i][1] + nz * dist))
    return out_pts


def draw_detail(data):
    m = data["mapping"]
    pid = data["id"]
    ex = EXTRAS.get(pid, {})
    img = Image.new("L", (WS, HS), 128)
    ink = Image.new("L", (WS, HS), 255)
    mask = Image.new("L", (WS, HS), 0)
    d = ImageDraw.Draw(img)
    di = ImageDraw.Draw(ink)
    dm = ImageDraw.Draw(mask)
    pxm = WS / 2 / m["S"]  # supersampled pixels per metre

    for panel, key in ((0, "front"), (1, "back")):
        poly = data[key]
        if panel == 1:
            poly = [[-x, z, lab] for x, z, lab in poly]
        poly_xz = [(x, z) for x, z, _ in poly]
        P = lambda q: to_px(q[0], q[1], m, panel)

        # Panel mask slightly dilated to cover UV boundary safely without stray exterior lines
        dm.polygon([P(q) for q in poly_xz], fill=255)
        dm.line([P(q) for q in poly_xz + [poly_xz[0]]], fill=255, width=10)

        # Seams: clean flatlock/overlock stitch groove + gentle seam allowance ridge
        for lab in SEW:
            for run in segments(poly, lab):
                if len(run) < 2:
                    continue
                smooth_run = resample(run, 0.004)
                d.line([P(q) for q in smooth_run], fill=112, width=4)
                inner = offset_run(smooth_run, 0.0055, poly_xz)
                d.line([P(q) for q in inner], fill=142, width=4)
                # Subtle micro-puckering stitches along seam
                st = resample(offset_run(smooth_run, 0.0032, poly_xz), 0.0035)
                for i in range(0, len(st) - 1, 2):
                    d.line([P(st[i]), P(st[i + 1])], fill=152, width=2)

        # Ribbed crew neckband: fine 1x1 architectural rib texture + coverstitch join
        for run in segments(poly, NECK):
            if len(run) < 2:
                continue
            band = 0.017
            pts = resample(run, 0.0022)
            # Subtle base collar elevation
            inner_band = offset_run(pts, band, poly_xz)
            collar_poly = [P(q) for q in pts] + [P(q) for q in reversed(inner_band)]
            if len(collar_poly) > 2:
                d.polygon(collar_poly, fill=136)
            for i, q in enumerate(pts):
                a = pts[max(i - 1, 0)]
                b = pts[min(i + 1, len(pts) - 1)]
                nx, nz = inward_normal(a, b, poly_xz)
                q0 = (q[0] + nx * 0.001, q[1] + nz * 0.001)
                q2 = (q[0] + nx * (band - 0.001), q[1] + nz * (band - 0.001))
                # Soft tonal rib wales (alternating ridge/valley without harsh noise)
                d.line([P(q0), P(q2)], fill=154 if i % 2 == 0 else 116, width=3)
            inner = offset_run(pts, band + 0.0012, poly_xz)
            d.line([P(q) for q in inner], fill=102, width=4)
            stitch = resample(offset_run(pts, band + 0.0045, poly_xz), 0.003)
            for i in range(0, len(stitch) - 1, 2):
                d.line([P(stitch[i]), P(stitch[i + 1])], fill=156, width=2)

        # Hems, cuffs, armholes: clean folded hem thickness + fine twin-needle coverstitch
        for lab, band in ((HEM, 0.024), (CUFF, 0.020), (ARMHOLE, 0.012)):
            for run in segments(poly, lab):
                if len(run) < 2:
                    continue
                srun = resample(run, 0.005)
                edge_in = offset_run(srun, band, poly_xz)
                poly_band = [P(q) for q in srun] + [P(q) for q in reversed(edge_in)]
                if len(poly_band) > 2:
                    d.polygon(poly_band, fill=138)
                d.line([P(q) for q in edge_in], fill=108, width=4)
                offs = (band - 0.0055,) if lab == ARMHOLE else (band - 0.007, band - 0.0125)
                for off in offs:
                    st = resample(offset_run(srun, off, poly_xz), 0.0028)
                    for i in range(0, len(st) - 1, 2):
                        d.line([P(st[i]), P(st[i + 1])], fill=158, width=2)
                d.line([P(q) for q in srun], fill=116, width=3)

        # Patch pocket on Atelier Pocket Tee
        if panel == 0 and ex.get("pocket"):
            cx, top, w, h = 0.105, -0.165, 0.115, 0.135
            rect = [
                (cx - w / 2, top),
                (cx + w / 2, top),
                (cx + w / 2, top - h + 0.02),
                (cx, top - h),
                (cx - w / 2, top - h + 0.02),
            ]
            d.polygon([P(q) for q in rect], fill=144)
            d.line([P(q) for q in rect + [rect[0]]], fill=98, width=5)
            # Top folded hem on pocket
            hem_poly = [(cx - w / 2, top), (cx + w / 2, top), (cx + w / 2, top - 0.018), (cx - w / 2, top - 0.018)]
            d.polygon([P(q) for q in hem_poly], fill=150)
            inner = [(cx - w / 2 + 0.004, top - 0.018), (cx + w / 2 - 0.004, top - 0.018)]
            d.line([P(q) for q in inner], fill=162, width=3)
            border = resample(
                [
                    (cx + w / 2 - 0.0045, top - 0.018),
                    (cx + w / 2 - 0.0045, top - h + 0.022),
                    (cx, top - h + 0.0045),
                    (cx - w / 2 + 0.0045, top - h + 0.022),
                    (cx - w / 2 + 0.0045, top - 0.018),
                ],
                0.0028,
            )
            for i in range(0, len(border) - 1, 2):
                d.line([P(border[i]), P(border[i + 1])], fill=162, width=2)

            # Tonal weave contrast on pocket ink map
            di.polygon([P(q) for q in rect], fill=244)
            di.line([P(q) for q in rect + [rect[0]]], fill=185, width=6)
            di.line([P(q) for q in inner], fill=215, width=3)
            for i in range(0, len(border) - 1, 2):
                di.line([P(border[i]), P(border[i + 1])], fill=215, width=2)

        # Tonal embossed/printed marks
        text, at, size_m = None, None, None
        if panel == 1 and ex.get("back_print"):
            text, at, size_m = ex["back_print"], (0.0, -0.088), 0.0115
        if panel == 0 and ex.get("chest_mark"):
            text, at, size_m = ex["chest_mark"], (0.102, -0.172), 0.0082
        if text and FONT:
            font = ImageFont.truetype(FONT, max(14, int(size_m * pxm * 1.35)))
            px, py = P(at)
            bbox = d.textbbox((0, 0), text, font=font)
            th = bbox[3] - bbox[1]
            spacing = int(size_m * pxm * 0.55)
            total = sum(d.textbbox((0, 0), ch, font=font)[2] for ch in text) + spacing * (len(text) - 1)
            x = px - total / 2
            for ch in text:
                d.text((x, py - th / 2), ch, fill=168, font=font)
                di.text((x, py - th / 2), ch, fill=208, font=font)
                x += d.textbbox((0, 0), ch, font=font)[2] + spacing

    # Mask strictly to garment panels so zero lines or blur spill outside edges
    base_detail = Image.new("L", (WS, HS), 128)
    base_ink = Image.new("L", (WS, HS), 255)
    img = Image.composite(img, base_detail, mask)
    ink = Image.composite(ink, base_ink, mask)

    # Smooth softly at 2x resolution then Lanczos downsample to 2048x1024
    img = img.filter(ImageFilter.GaussianBlur(1.1)).resize((W, H), Image.LANCZOS)
    img.save(os.path.join(out, f"{pid}_detail.png"), optimize=True)
    if any(k in ex for k in ("back_print", "chest_mark", "pocket")):
        ink = ink.filter(ImageFilter.GaussianBlur(0.8)).resize((W, H), Image.LANCZOS)
        ink.save(os.path.join(out, f"{pid}_ink.png"), optimize=True)


def tile_fbm(S, base_freq, octaves=4, seed=17):
    """Seamless periodic 2D value noise via wrapped grid."""
    rng = np.random.default_rng(seed)
    acc = np.zeros((S, S), np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        f = base_freq * (2 ** o)
        grid = rng.random((f, f)).astype(np.float32)
        y = (np.arange(S, dtype=np.float32) / S) * f
        x = (np.arange(S, dtype=np.float32) / S) * f
        yi = np.floor(y).astype(int) % f
        xi = np.floor(x).astype(int) % f
        yj = (yi + 1) % f
        xj = (xi + 1) % f
        fy = (y - np.floor(y))[:, None]
        fx = (x - np.floor(x))[None, :]
        fy = fy * fy * (3 - 2 * fy)
        fx = fx * fx * (3 - 2 * fx)
        a = grid[np.ix_(yi, xi)]
        b = grid[np.ix_(yi, xj)]
        c = grid[np.ix_(yj, xi)]
        d = grid[np.ix_(yj, xj)]
        val = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
        acc += amp * val
        norm += amp
        amp *= 0.5
    return acc / norm


def jersey_textures():
    """Seamless 1024x1024 fine combed-cotton single-jersey knit normal map + weave/slub map."""
    S = 1024
    wales, courses = 32, 42
    y, x = np.mgrid[0:S, 0:S].astype(np.float32)
    # Subtle organic yarn waviness so wales feel like spun cotton rather than rigid plastic grid
    warp_wobble = (tile_fbm(S, 8, 3, seed=31) - 0.5) * 0.08
    course_wobble = (tile_fbm(S, 8, 3, seed=43) - 0.5) * 0.06
    u_w = (x / S) * wales + warp_wobble
    v_c = (y / S) * courses + course_wobble
    fx = (u_w % 1.0) - 0.5
    fy = v_c % 1.0

    # Natural V-shaped knitted cotton loop legs with rounded yarn crown and yarn twist
    h = np.zeros((S, S), np.float32)
    for side in (-1, 1):
        cx = side * (0.20 - 0.075 * (fy - 0.5))
        dx = (fx - cx) / 0.175
        dy = (fy - 0.5) / 0.56
        dist2 = dx * dx + dy * dy
        leg = np.clip(1.0 - dist2, 0.0, 1.0) ** 0.72
        # Subtle spun yarn ply twist striations along the loop
        twist = 1.0 + 0.08 * np.sin((fx * 18.0 + fy * 14.0 * side) * math.pi)
        h = np.maximum(h, leg * twist)

    # Fine spun-cotton slub & fiber fuzz (multi-scale, completely seamless)
    slub = tile_fbm(S, 16, 4, seed=71) * 0.16 + tile_fbm(S, 64, 3, seed=97) * 0.10
    h = h * 0.78 + slub

    # Calibrated gentle normal slope so cotton reads velvety & fine without Moire shimmer
    gy, gx = np.gradient(h)
    k = 1.15
    nx, ny, nz = -gx * k, gy * k, np.ones_like(h)
    l = np.sqrt(nx * nx + ny * ny + nz * nz)
    n = np.stack([nx / l, ny / l, nz / l], -1)
    Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8)).save(os.path.join(out, "jersey_normal.png"), optimize=True)

    # Organic weave/heather micro-roughness & subtle yarn-depth map (around 235..255 for color, 195..255 for roughness)
    weave = np.clip(0.84 + 0.10 * h + 0.06 * (tile_fbm(S, 12, 3, seed=113) - 0.5), 0.76, 1.0)
    Image.fromarray((weave * 255).astype(np.uint8)).save(os.path.join(out, "jersey_weave.png"), optimize=True)


for pid in ids:
    with open(os.path.join(src, f"{pid}_outline.json")) as fh:
        draw_detail(json.load(fh))
jersey_textures()
print("ok", ids)
