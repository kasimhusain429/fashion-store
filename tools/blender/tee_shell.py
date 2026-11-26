"""Pre-shaped isotropic Delaunay shell drape: exec after tee.py.

Builds front and back panels using 2D Constrained Delaunay Triangulation over the exact
pattern outline + a staggered hexagonal interior point lattice. This completely eliminates
Cartesian grid staircase notches along curved collars and angled sleeves, giving Marvelous
Designer-quality isotropic cloth flow and seamless shared-seam welding.
"""
import bpy, bmesh, math, json, os
from mathutils import Vector
from mathutils.geometry import delaunay_2d_cdt

HANGER_HALF = 0.218
OPEN = {NECK, CUFF, HEM, ARMHOLE}


def hanger_top(x):
    t = max(-1.0, min(1.0, x / HANGER_HALF))
    return -0.018 - 0.05 * t * t + 0.0125


def _seg_dist(pt, poly, labels=None):
    best = (1e9, None)
    n = len(poly)
    for i in range(n):
        a, la = poly[i]
        if labels is not None and la not in labels:
            continue
        b, _ = poly[(i + 1) % n]
        ab = b - a
        L2 = ab.length_squared
        t = 0.0 if L2 == 0 else max(0.0, min(1.0, (pt - a).dot(ab) / L2))
        d = (a + ab * t - pt).length
        if d < best[0]:
            best = (d, la)
    return best


def shoulder_z(p, x):
    """z of the pattern's shoulder seam at |x| (between HPS and the shoulder point)."""
    ax = abs(x)
    nw, sw, sd = p["neck_w"], p["sw"], p["sdrop"]
    if ax <= nw:
        return 0.0
    if ax >= sw:
        return -sd
    return -sd * (ax - nw) / (sw - nw)


def build_shell(p):
    c = p["cell"]
    polyF = outline(p, True)
    polyB = outline(p, False)
    allx = [q.x for q, _ in polyF + polyB]
    allz = [q.y for q, _ in polyF + polyB]
    xmin, xmax, zmin, zmax = min(allx), max(allx), min(allz), max(allz)
    S = max(xmax - xmin, zmax - zmin) + 0.02
    mapping = dict(S=S, xmin=xmin - 0.01, zmin=zmin - 0.01)
    reach = HANGER_HALF + 0.012

    def dz_at(x):
        ax = min(abs(x), reach)
        tip = max(0.0, min(1.0, (abs(x) - 0.165) / 0.06))
        return (hanger_top(ax) + 0.014 + 0.008 * tip * tip * (3 - 2 * tip)) - shoulder_z(p, ax)

    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new("UVMap")
    lab_layer = bm.verts.layers.int.new("seam")
    pan_layer = bm.verts.layers.int.new("panel")
    pin_layer = bm.verts.layers.float.new("pin")
    struct_layer = bm.verts.layers.float.new("struct")

    dx = c
    dz = c * 0.8660254
    min_bound_dist = c * 0.56
    nx_steps = int(math.ceil((xmax - xmin) / dx)) + 2
    nz_steps = int(math.ceil((zmax - zmin) / dz)) + 2

    flat = {}
    for panel, poly, sign in ((0, polyF, -1), (1, polyB, 1)):
        # Deduplicate close consecutive boundary vertices cleanly
        clean_poly = []
        for q, lab in poly:
            if not clean_poly or (q - clean_poly[-1][0]).length > 1e-4:
                clean_poly.append((q, lab))
        if len(clean_poly) > 2 and (clean_poly[0][0] - clean_poly[-1][0]).length <= 1e-4:
            clean_poly.pop()

        nb = len(clean_poly)
        pts_2d = [Vector((q.x, q.y)) for q, _ in clean_poly]
        edges = [(i, (i + 1) % nb) for i in range(nb)]

        # Add staggered hexagonal interior points strictly inside the boundary
        for row in range(nz_steps):
            z = zmin + row * dz
            x_off = (0.5 * dx) if (row % 2) else 0.0
            for col in range(nx_steps):
                x = xmin + col * dx + x_off
                pt = Vector((x, z))
                if _inside((x, z), clean_poly):
                    d_b, _ = _seg_dist(pt, clean_poly)
                    if d_b > min_bound_dist:
                        pts_2d.append(pt)

        # Output type 3: constrained Delaunay keeping only triangles strictly inside the boundary polygon
        res = delaunay_2d_cdt(pts_2d, edges, [], 3, 1e-5)
        out_pts, _, out_faces, orig_verts, _, _ = res

        pverts = []
        for idx, pt in enumerate(out_pts):
            v = bm.verts.new((pt.x, 0.0, pt.y))
            v[pan_layer] = panel
            # Check if this CDT vertex corresponds to a boundary polygon vertex
            ov = orig_verts[idx] if idx < len(orig_verts) else []
            b_indices = [k for k in ov if k < nb]
            if b_indices:
                v[lab_layer] = clean_poly[b_indices[0]][1]
            pverts.append(v)

        for face_idx in out_faces:
            if len(face_idx) < 3:
                continue
            fverts = [pverts[i] for i in face_idx]
            if sign > 0:
                fverts = list(reversed(fverts))
            try:
                bm.faces.new(fverts)
            except ValueError:
                pass

        # Relax interior 2D vertices smoothly in flat space for uniform isotropic triangles
        iverts = [v for v in pverts if not v.is_boundary]
        for _ in range(5):
            updates = {}
            for v in iverts:
                nbrs = [e.other_vert(v) for e in v.link_edges if e.other_vert(v)[pan_layer] == panel]
                if nbrs:
                    avg = sum((n.co for n in nbrs), Vector((0, 0, 0))) / len(nbrs)
                    updates[v] = (v.co.x * 0.45 + avg.x * 0.55, v.co.z * 0.45 + avg.z * 0.55)
            for v, (nx, nz) in updates.items():
                v.co.x, v.co.z = nx, nz

        # Record clean pattern-space UV coordinates BEFORE 3D shell shaping
        for v in pverts:
            if v.is_valid and v.link_faces:
                flat[v] = (v.co.x, v.co.z)

        # Shape into smooth 3D garment shell over the walnut hanger
        for v in pverts:
            if not v.is_valid or not v.link_faces:
                continue
            x, z = flat[v]
            pt = Vector((x, z))
            dist, lab = _seg_dist(pt, clean_poly)
            below = shoulder_z(p, x) - z

            top_zone = 1.0 - max(0.0, min(1.0, (below - 0.06) / 0.28))
            in_sleeve = abs(x) > p["bw"] + 0.008
            if in_sleeve:
                dmax = 0.022 + 0.013 * top_zone
                d_open = 0.017
            else:
                dmax = 0.019 + 0.028 * top_zone
                d_open = 0.013

            d = dmax * math.sqrt(max(0.0, min(1.0, dist / 0.032)))
            if (v.is_boundary and v[lab_layer] in OPEN) or (not v.is_boundary and lab in OPEN):
                open_dist, _ = _seg_dist(pt, clean_poly, OPEN)
                open_fade = max(0.0, 1.0 - open_dist / 0.05)
                d = max(d, d_open * (0.65 + 0.35 * open_fade))

            fall = 1.0 - max(0.0, min(1.0, (below - 0.035) / 0.26))
            ax = min(abs(x), reach)
            v.co.z = z + dz_at(x) * fall

            drape_mask = (1.0 - fall) * max(0.0, min(1.0, (below - 0.14) / 0.30)) * min(1.0, dist / 0.04)
            seed = (0.0040 * math.sin(x * 13.0 + panel * 1.1) + 0.0020 * math.cos(x * 21.0 - z * 4.5)) * drape_mask
            v.co.y = sign * d - 0.034 * min(1.0, ax / HANGER_HALF) ** 2 * fall + seed

            if p["neck_w"] - 0.008 <= abs(x) <= reach and below < 0.045:
                wx = 1.0
                if abs(x) > reach - 0.022:
                    wx = max(0.0, (reach - abs(x)) / 0.022)
                wz = max(0.0, min(1.0, (0.045 - below) / 0.035))
                w = wx * wz
                v[pin_layer] = w * w * (3 - 2 * w)

            open_d, _ = _seg_dist(pt, clean_poly, OPEN)
            if open_d < 0.028:
                v[struct_layer] = 1.0 - (open_d / 0.028)

    # Weld matching sewn seam vertices cleanly
    bmesh.ops.remove_doubles(bm, verts=[v for v in bm.verts if v.is_boundary and v[lab_layer] in SEW], dist=0.0025)
    bad = [f for f in bm.faces if f.calc_area() < 1e-7]
    bmesh.ops.delete(bm, geom=bad, context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')

    for f in bm.faces:
        for l in f.loops:
            v = l.vert
            x, z = flat.get(v, (v.co.x, v.co.z))
            u = 0.5 * (x - mapping["xmin"]) / S if v[pan_layer] == 0 else 0.5 + 0.5 * ((-x) - mapping["xmin"]) / S
            l[uvl].uv = (u, (z - mapping["zmin"]) / S)
    bm.verts.index_update()
    bm.verts.ensure_lookup_table()
    pins = [(v.index, v[pin_layer]) for v in bm.verts if v[pin_layer] > 0.01]
    structs = [(v.index, v[struct_layer]) for v in bm.verts if v[struct_layer] > 0.01]
    return bm, mapping, polyF, polyB, pins, structs


def setup(pid):
    p = PRODUCTS[pid]
    scn = scene()
    name = f"VAELIS_Tee_{pid}"
    remove(name)
    bm, mapping, polyF, polyB, pins, structs = build_shell(p)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    scn.collection.objects.link(ob)
    for poly in me.polygons:
        poly.use_smooth = True

    vg = ob.vertex_groups.new(name="pin")
    for idx, w in pins:
        vg.add([idx], w, 'REPLACE')

    sg = ob.vertex_groups.new(name="struct")
    for idx, w in structs:
        sg.add([idx], w, 'REPLACE')

    cl = ob.modifiers.new("Cloth", 'CLOTH')
    s = cl.settings
    s.quality = 7
    s.mass = 0.22
    s.air_damping = 1.8
    s.tension_stiffness = 22
    s.compression_stiffness = 20
    s.shear_stiffness = 8
    s.bending_stiffness = p.get("bend", 1.8)
    s.bending_stiffness_max = s.bending_stiffness * 3.5
    s.vertex_group_bending = "struct"
    s.tension_damping = 10
    s.compression_damping = 10
    s.shear_damping = 10
    s.bending_damping = 1.2
    s.vertex_group_mass = "pin"
    s.pin_stiffness = 1.0
    s.use_sewing_springs = False

    cs = cl.collision_settings
    cs.use_collision = False
    cs.use_self_collision = True
    cs.self_distance_min = 0.0040
    cs.self_friction = 3.5

    cl.point_cache.frame_start = 1
    cl.point_cache.frame_end = 200
    scn.frame_start = 1
    scn.frame_end = 200
    scn.frame_set(1)
    os.makedirs(OUT, exist_ok=True)
    with open(f"{OUT}/{pid}_outline.json", "w") as fh:
        json.dump(dict(id=pid, params=p, mapping=mapping, front=[[q.x, q.y, l] for q, l in polyF],
                       back=[[q.x, q.y, l] for q, l in polyB]), fh)
    return dict(verts=len(me.vertices), faces=len(me.polygons), pins=len(pins))
