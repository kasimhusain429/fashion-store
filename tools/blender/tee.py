"""VAELIS t-shirt generator for Blender.

Builds front/back pattern panels from silhouette parameters, sews them with cloth
sewing springs, drapes them on the walnut hanger, and exports mesh + outline data.
Run inside Blender:  exec(open(path).read()); setup("monolith")
"""
import bpy, bmesh, math, json, os
from mathutils import Vector
from mathutils.kdtree import KDTree

OUT = os.environ.get("VAELIS_WORK", "D:/vaelis-work") + "/tees"
SCN = "VAELIS_Assets"
HANGER_LOC = Vector((0.0235, 0.0, 0.0651))  # puts hanger body centre-line at z=-0.018
GAP = 0.042

NECK, SHOULDER, SLEEVE_TOP, CUFF, SLEEVE_UNDER, SIDE, HEM, ARMHOLE = 1, 2, 3, 4, 5, 6, 7, 8
SEW = {SHOULDER, SLEEVE_TOP, SLEEVE_UNDER, SIDE}

PRODUCTS = {
    # neck_w: half neck width; neck_f/b: neck drop; sw/sdrop: shoulder point; bw: half body width;
    # L: length from HPS; sleeve: angle (deg below horizontal), len, aw (armhole width), cuff
    "monolith": dict(neck_w=0.098, neck_f=0.088, neck_b=0.026, sw=0.300, sdrop=0.042, bw=0.292, flare=0.0, L=0.720,
                     sleeve=dict(angle=18, len=0.255, aw=0.250, cuff=0.215), bend=2.2, cell=0.0115),
    "kimono":   dict(neck_w=0.102, neck_f=0.080, neck_b=0.026, sw=0.215, sdrop=0.032, bw=0.300, flare=0.012, L=0.620,
                     sleeve=dict(angle=11, len=0.330, aw=0.300, cuff=0.250), bend=1.9, cell=0.0115),
    "column":   dict(neck_w=0.086, neck_f=0.082, neck_b=0.022, sw=0.236, sdrop=0.050, bw=0.252, flare=0.0, L=0.840,
                     sleeve=dict(angle=22, len=0.190, aw=0.200, cuff=0.160), bend=1.9, cell=0.0110),
    "tank":     dict(neck_w=0.100, neck_f=0.120, neck_b=0.040, sw=0.168, sdrop=0.036, bw=0.268, flare=0.010, L=0.740,
                     sleeve=None, bend=2.4, cell=0.0105),
    "longsleeve": dict(neck_w=0.088, neck_f=0.082, neck_b=0.022, sw=0.250, sdrop=0.050, bw=0.268, flare=0.0, L=0.740,
                     sleeve=dict(angle=38, len=0.600, aw=0.205, cuff=0.098), bend=2.8, cell=0.0115),
    "pocket":   dict(neck_w=0.090, neck_f=0.086, neck_b=0.024, sw=0.256, sdrop=0.048, bw=0.270, flare=0.0, L=0.740,
                     sleeve=dict(angle=22, len=0.215, aw=0.215, cuff=0.180), bend=2.2, cell=0.0115, pocket=True),
}


def _seg(a, b, label, step=0.0095):
    n = max(1, int(round((b - a).length / step)))
    return [(a.lerp(b, i / n), label) for i in range(n)]


def _bez(p0, p1, p2, label, n=28):
    out = []
    for i in range(n):
        t = i / n
        out.append((p0 * (1 - t) ** 2 + p1 * 2 * (1 - t) * t + p2 * t * t, label))
    return out


def outline(p, front):
    """Closed polygon [(Vector(x, z), label)], full panel."""
    V = lambda x, z: Vector((x, z))
    nd = p["neck_f"] if front else p["neck_b"]
    nw = p["neck_w"]
    right = []
    for i in range(24):
        t = (i / 24) * math.pi / 2
        right.append((V(nw * math.sin(t), -nd * math.cos(t)), NECK))
    hps = V(nw, 0.0)
    sp = V(p["sw"], -p["sdrop"])
    right += _seg(hps, sp, SHOULDER)
    bw = p["bw"]
    sl = p["sleeve"]
    if sl:
        a = math.radians(sl["angle"])
        d = V(math.cos(a), -math.sin(a))
        n = V(-math.sin(a), -math.cos(a))
        ct = sp + d * sl["len"]
        cb = ct + n * sl["cuff"]
        ub = sp + n * sl["aw"]
        dirv = (ub - cb)
        t = (bw - cb.x) / dirv.x if abs(dirv.x) > 1e-6 else 1.0
        ua = cb + dirv * t
        right += _seg(sp, ct, SLEEVE_TOP)
        right += _seg(ct, cb, CUFF)
        pre = cb.lerp(ua, 0.82)
        right += _seg(cb, pre, SLEEVE_UNDER)
        corner_out = V(bw, ua.y - 0.035)
        right += _bez(pre, ua, corner_out, SLEEVE_UNDER, 10)
        side_start = corner_out
    else:
        ua = V(bw, -0.30)
        right += _bez(sp, V(sp.x - 0.012, -0.25), ua, ARMHOLE, 34)
        side_start = ua
    hs = V(bw + p["flare"], -p["L"])
    right += _seg(side_start, hs, SIDE)
    right += _seg(hs, V(0.0, -p["L"]), HEM)
    left = [(V(-q.x, q.y), lab) for (q, lab) in right[1:]]
    left.reverse()
    return right + [(V(0.0, -p["L"]), HEM)] + left


def _inside(pt, poly):
    x, z = pt
    c = False
    n = len(poly)
    for i in range(n):
        x1, z1 = poly[i][0]
        x2, z2 = poly[(i + 1) % n][0]
        if (z1 > z) != (z2 > z):
            xi = x1 + (z - z1) * (x2 - x1) / (z2 - z1)
            if xi > x:
                c = not c
    return c


def _nearest_on_poly(pt, poly):
    best = (1e9, None, None)
    n = len(poly)
    for i in range(n):
        a, la = poly[i]
        b, _ = poly[(i + 1) % n]
        ab = b - a
        L2 = ab.length_squared
        t = 0.0 if L2 == 0 else max(0.0, min(1.0, (pt - a).dot(ab) / L2))
        q = a + ab * t
        d = (q - pt).length
        if d < best[0]:
            best = (d, q, la)
    return best


def scene():
    return bpy.data.scenes[SCN]


def remove(name):
    o = bpy.data.objects.get(name)
    if o:
        me = o.data
        bpy.data.objects.remove(o, do_unlink=True)
        if me and me.users == 0:
            bpy.data.meshes.remove(me)


def hanger_collider():
    """Low-poly loft of the hanger's arc; padding comes from a thick collision shell."""
    scn = scene()
    name = "VAELIS_Hanger_Collider"
    remove(name)
    body = bpy.data.objects.get("VAELIS_Hanger_Body")
    if body is not None:
        o = bpy.data.objects.new(name, body.data)
        scn.collection.objects.link(o)
        o.location = HANGER_LOC
        o.modifiers.new("Collision", 'COLLISION')
        o.collision.thickness_outer = 0.009
        o.collision.cloth_friction = 15.0
        o.hide_render = True
        return o
    return None


def bake(pid, weld=0.0004):
    """Freeze the draped tee, relax seams cleanly, and add subtle turned lip thickness."""
    scn = scene()
    src = bpy.data.objects[f"VAELIS_Tee_{pid}"]
    with bpy.context.temp_override(scene=scn, view_layer=scn.view_layers[0]):
        dg = bpy.context.evaluated_depsgraph_get()
        me = bpy.data.meshes.new_from_object(src.evaluated_get(dg))
    name = f"VAELIS_TeeBaked_{pid}"
    remove(name)
    me.name = name
    bm = bmesh.new()
    bm.from_mesh(me)
    loose = [e for e in bm.edges if not e.link_faces]
    bmesh.ops.delete(bm, geom=loose, context='EDGES')
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=weld)
    # Smooth interior gently to remove simulation micro-facets while keeping folds intact
    for _ in range(2):
        bmesh.ops.smooth_vert(bm, verts=[v for v in bm.verts if not v.is_boundary], factor=0.35,
                              use_axis_x=True, use_axis_y=True, use_axis_z=True)
    # Smooth boundary loops softly in place so sleeve cuffs, neck, and hem curves are fluid
    for _ in range(3):
        bverts = [v for v in bm.verts if v.is_boundary]
        disp = {}
        for v in bverts:
            bn = [e.other_vert(v) for e in v.link_edges if e.is_boundary]
            if len(bn) == 2:
                mid = (bn[0].co + bn[1].co) * 0.5
                disp[v] = v.co.lerp(mid, 0.35)
        for v, pco in disp.items():
            v.co = pco
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    scn.collection.objects.link(ob)
    for poly in me.polygons:
        poly.use_smooth = True
    src.hide_render = True
    src.hide_viewport = True
    return dict(verts=len(me.vertices), faces=len(me.polygons))
