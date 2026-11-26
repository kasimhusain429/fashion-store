"""Rebuild VAELIS_Swatch_Baked as a clean single-layer draped jersey cloth (zero double-wall z-fighting)."""
import bpy, bmesh, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, "..", ".."))
SWATCH_GLB = f"{PROJECT}/public/models/swatch.glb"

scn = bpy.context.scene
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

bpy.ops.import_scene.gltf(filepath=SWATCH_GLB)
old = bpy.data.objects.get("VAELIS_Swatch_Baked")
if old:
    bpy.data.objects.remove(old, do_unlink=True)

# Build clean single-layer quad cloth hanging between the two brass clips (x in [-0.145, 0.145], z in [-0.54, 0])
NX, NZ = 54, 72
W, H = 0.29, 0.54
bm = bmesh.new()
uvl = bm.loops.layers.uv.new("UVMap")
grid = []
for iz in range(NZ + 1):
    row = []
    v_frac = iz / NZ
    z = -v_frac * H
    for ix in range(NX + 1):
        u_frac = ix / NX
        x = (u_frac - 0.5) * W
        # Soft initial catenary sag + gentle drape wave so cloth forms natural pleats between clips
        cat = 1.0 - ((abs(x) / 0.125) ** 2)
        y = 0.015 * math.sin(u_frac * math.pi * 3.0) * (0.25 + 0.75 * v_frac) - 0.018 * max(0.0, cat) * (1.0 - v_frac)
        v = bm.verts.new((x, y, z))
        row.append(v)
    grid.append(row)

for iz in range(NZ):
    for ix in range(NX):
        f = bm.faces.new((grid[iz][ix], grid[iz][ix + 1], grid[iz + 1][ix + 1], grid[iz + 1][ix]))
        for l in f.loops:
            # Find ix, iz from co
            u = (l.vert.co.x / W) + 0.5
            v_uv = -l.vert.co.z / H
            l[uvl].uv = (u, 1.0 - v_uv)

bm.normal_update()
me = bpy.data.meshes.new("VAELIS_Swatch_Baked")
bm.to_mesh(me)
bm.free()

ob = bpy.data.objects.new("VAELIS_Swatch_Baked", me)
scn.collection.objects.link(ob)
for poly in me.polygons:
    poly.use_smooth = True

# Pin around the two top brass clips (around x = +-0.118, z > -0.025)
vg = ob.vertex_groups.new(name="pin")
for v in me.vertices:
    x, _, z = v.co
    if z > -0.028 and (abs(abs(x) - 0.118) < 0.028):
        w = max(0.0, min(1.0, (z + 0.028) / 0.028))
        vg.add([v.index], w, 'REPLACE')

cl = ob.modifiers.new("Cloth", 'CLOTH')
s = cl.settings
s.quality = 6
s.mass = 0.22
s.air_damping = 1.6
s.tension_stiffness = 18
s.compression_stiffness = 18
s.shear_stiffness = 6
s.bending_stiffness = 1.4
s.vertex_group_mass = "pin"
s.pin_stiffness = 1.0
cl.collision_settings.use_collision = False
cl.collision_settings.use_self_collision = False  # single soft drape with zero self-intersection flips!

scn.frame_start = 1
scn.frame_end = 60
for f in range(1, 45):
    scn.frame_set(f)

with bpy.context.temp_override(scene=scn, view_layer=scn.view_layers[0]):
    dg = bpy.context.evaluated_depsgraph_get()
    baked_me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))

ob.modifiers.clear()
ob.data = baked_me
cs = ob.modifiers.new("corrective", 'CORRECTIVE_SMOOTH')
cs.factor = 0.4
cs.iterations = 4
with bpy.context.temp_override(scene=scn, view_layer=scn.view_layers[0]):
    dg = bpy.context.evaluated_depsgraph_get()
    final_me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
ob.modifiers.clear()
ob.data = final_me
for poly in ob.data.polygons:
    poly.use_smooth = True

for o in scn.objects:
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=SWATCH_GLB, export_format='GLB', use_selection=True, export_apply=True, export_yup=True)
print("[vaelis] SWATCH_DONE verts=", len(ob.data.vertices), "faces=", len(ob.data.polygons))
