"""Procedural textures for the VAELIS Blender assets (walnut, buffalo horn, 2/2 twill normal map)."""
import sys, os
import numpy as np
from PIL import Image

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
rng = np.random.default_rng(7)


def value_noise(h, w, cells_y, cells_x, seed):
    r = np.random.default_rng(seed)
    g = r.random((cells_y + 3, cells_x + 3))
    y = np.linspace(0, cells_y, h, endpoint=False)
    x = np.linspace(0, cells_x, w, endpoint=False)
    yi, xi = np.floor(y).astype(int), np.floor(x).astype(int)
    fy, fx = y - yi, x - xi
    fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
    a = g[yi][:, xi]; b = g[yi][:, xi + 1]; c = g[yi + 1][:, xi]; d = g[yi + 1][:, xi + 1]
    fx = fx[None, :]; fy = fy[:, None]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def fbm(h, w, cy, cx, seed, octaves=5):
    v = np.zeros((h, w)); amp = 1.0; tot = 0
    for o in range(octaves):
        v += amp * value_noise(h, w, cy * 2 ** o, cx * 2 ** o, seed + o)
        tot += amp; amp *= 0.5
    return v / tot


def walnut():
    H, W = 512, 2048  # v (around section) x u (along length)
    n1 = fbm(H, W, 3, 6, 11)
    n2 = fbm(H, W, 8, 40, 23)
    v = np.linspace(0, 1, H)[:, None]
    u = np.linspace(0, 1, W)[None, :]
    lines = v * 34 + n1 * 6.0 + 0.6 * np.sin(u * 9.0 + n1 * 3)
    ring = np.abs(np.sin(lines * np.pi)) ** 0.6
    figure = n2
    t = np.clip(0.55 * ring + 0.45 * figure, 0, 1)
    dark = np.array([0.075, 0.042, 0.024]); mid = np.array([0.16, 0.092, 0.05]); light = np.array([0.25, 0.15, 0.085])
    col = np.where(t[..., None] < 0.5, dark + (mid - dark) * (t[..., None] / 0.5), mid + (light - mid) * ((t[..., None] - 0.5) / 0.5))
    # pores: short dark dashes along the grain
    pores = (value_noise(H, W, 220, 900, 99) > 0.93).astype(float)
    col *= (1 - 0.35 * pores[..., None])
    srgb = np.clip(col, 0, 1) ** (1 / 2.2)
    Image.fromarray((srgb * 255).astype(np.uint8)).save(os.path.join(out, "walnut.jpg"), quality=88)


def horn():
    S = 1024
    n1 = fbm(S, S, 3, 3, 5)
    n2 = fbm(S, S, 10, 10, 9)
    yy, xx = np.mgrid[0:S, 0:S] / S - 0.5
    ang = np.arctan2(yy, xx)
    streak = 0.5 + 0.5 * np.sin(ang * 3 + n1 * 9 + n2 * 2)
    t = np.clip(0.65 * n1 + 0.35 * streak - 0.12, 0, 1)
    t = t ** 2.7
    black = np.array([0.018, 0.013, 0.010]); brown = np.array([0.09, 0.05, 0.025]); amber = np.array([0.42, 0.22, 0.07])
    col = np.where(t[..., None] < 0.55, black + (brown - black) * (t[..., None] / 0.55), brown + (amber - brown) * ((t[..., None] - 0.55) / 0.45))
    srgb = np.clip(col, 0, 1) ** (1 / 2.2)
    Image.fromarray((srgb * 255).astype(np.uint8)).save(os.path.join(out, "horn.jpg"), quality=90)


def twill_normal():
    """2/2 right-hand twill: each warp passes over two wefts, shifting one pick per row."""
    S = 512
    ends = 32  # yarns per tile in each direction
    cell = S // ends
    y, x = np.mgrid[0:S, 0:S]
    ci, cj = y // cell, x // cell
    fy, fx = (y % cell) / cell, (x % cell) / cell
    warp_up = ((cj - ci) % 4) < 2  # 2/2 twill offset by one per pick -> diagonal ribs
    # yarn cross-section profiles
    warp_profile = np.sin(np.pi * fx) ** 0.7  # warp runs vertically
    weft_profile = np.sin(np.pi * fy) ** 0.7
    # float shape along its length (dips where it goes under)
    h = np.where(warp_up, 0.6 + 0.4 * warp_profile * np.sin(np.pi * (fy * 0.5 + 0.25)), 0.6 + 0.4 * weft_profile * np.sin(np.pi * (fx * 0.5 + 0.25)))
    fib = fbm(S, S, 64, 16, 3) * 0.12 + fbm(S, S, 16, 64, 4) * 0.08
    h = h + fib
    gy, gx = np.gradient(h)
    strength = 6.0
    nx, ny, nz = -gx * strength, gy * strength, np.ones_like(h)
    l = np.sqrt(nx ** 2 + ny ** 2 + nz ** 2)
    n = np.stack([nx / l, ny / l, nz / l], -1)
    Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8)).save(os.path.join(out, "twill_normal.png"))
    ao = np.clip(0.55 + 0.45 * (h - h.min()) / (h.max() - h.min()), 0, 1)
    Image.fromarray((ao * 255).astype(np.uint8)).save(os.path.join(out, "twill_ao.png"))


walnut(); horn(); twill_normal()
print("ok")
