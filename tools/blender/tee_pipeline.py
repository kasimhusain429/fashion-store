"""Headless VAELIS tee geometry + GLB exporter (and optional Cycles render).

blender -b --factory-startup --python tee_pipeline.py -- <pid> [--frames N] [--no-render] [--samples N]

1. imports the walnut hanger GLB, 2. drapes the high-res tailored shell (tee_shell.py),
3. bakes & applies Corrective Smooth + Subdivision Surface (1) + subtle rolled boundary lip,
4. exports the smooth, production-ready GLB (origin = rail centre) to public/models/tees/<pid>.glb,
5. optionally renders Cycles front/back shots, 6. saves the .blend.
"""
import bpy, bmesh, sys, os, math, json, time
from mathutils import Matrix

argv = sys.argv[sys.argv.index("--") + 1:]
PID = argv[0]
FRAMES = int(argv[argv.index("--frames") + 1]) if "--frames" in argv else 55
NO_RENDER = "--no-render" in argv
PREVIEW = "--preview" in argv
SAMPLES = int(argv[argv.index("--samples") + 1]) if "--samples" in argv else 24
ONLY = argv[argv.index("--colors") + 1].split(",") if "--colors" in argv else None

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.abspath(os.path.join(HERE, "..", ".."))
WORK = os.environ.get("VAELIS_WORK", "D:/vaelis-work")
COLORS = {
    "obsidian": "#17181B",
    "celadon": "#6E8175",
    "indigo": "#28394A",
    "alabaster": "#EAE4D8",
    "oxblood": "#6D332D",
    "umber": "#9E7042",
    "basalt": "#5B6066",
    "patina": "#78624D",
}
PRODUCT_COLORS = {
    "monolith": ["obsidian", "alabaster", "umber"],
    "kimono": ["celadon", "basalt", "alabaster"],
    "column": ["indigo", "obsidian", "patina"],
    "tank": ["alabaster", "celadon", "obsidian"],
    "longsleeve": ["oxblood", "indigo", "alabaster"],
    "pocket": ["umber", "celadon", "basalt"],
}
log = lambda *a: print("[vaelis]", *a, flush=True)

scn = bpy.context.scene
scn.name = "VAELIS_Assets"
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

bpy.ops.import_scene.gltf(filepath=f"{PROJECT}/public/models/hanger.glb")
for o in bpy.context.selected_objects:
    o.select_set(False)

exec(open(f"{HERE}/tee.py").read())
exec(open(f"{HERE}/tee_shell.py").read())

HANGER_PARTS = ("VAELIS_Hanger_Body", "VAELIS_Hanger_Hook", "VAELIS_Hanger_Ferrule")
for n in HANGER_PARTS:
    o = bpy.data.objects[n]
    o.location = HANGER_LOC
    o.rotation_euler = (0, 0, 0)
bpy.data.objects["VAELIS_Hanger_Body"].scale = (0.86, 0.78, 0.96)
hanger_collider()
scn.view_layers[0].update()

t0 = time.time()
info = setup(PID)
log("setup", info)
scn.frame_set(1)
for f in range(1, FRAMES + 1):
    scn.frame_set(f)
    if f % 10 == 0:
        log("frame", f, round(time.time() - t0, 1), "s")
baked = bake(PID, weld=0.0004)
log("baked", baked)
tee = bpy.data.objects[f"VAELIS_TeeBaked_{PID}"]
zs = [v.co.z for v in tee.data.vertices]
log("tee z-range", round(min(zs), 3), round(max(zs), 3))
if max(zs) < -0.12:
    log("FAILED: tee fell off the hanger")

# Corrective smooth + boundary smoothing on the isotropic cloth mesh (clean single-shell edges, zero corner pinches)
cs = tee.modifiers.new("corrective", 'CORRECTIVE_SMOOTH')
cs.factor = 0.5
cs.iterations = 6
cs.smooth_type = 'LENGTH_WEIGHTED'

with bpy.context.temp_override(scene=scn, view_layer=scn.view_layers[0]):
    dg = bpy.context.evaluated_depsgraph_get()
    smooth_me = bpy.data.meshes.new_from_object(tee.evaluated_get(dg))

tee.modifiers.clear()
tee.data = smooth_me
bm = bmesh.new()
bm.from_mesh(tee.data)
for _ in range(3):
    bverts = [v for v in bm.verts if v.is_boundary]
    disp = {}
    for v in bverts:
        bn = [e.other_vert(v) for e in v.link_edges if e.is_boundary]
        if len(bn) == 2:
            disp[v] = v.co.lerp((bn[0].co + bn[1].co) * 0.5, 0.35)
    for v, pco in disp.items():
        v.co = pco
bm.normal_update()
bm.to_mesh(tee.data)
bm.free()
for poly in tee.data.polygons:
    poly.use_smooth = True
log("final mesh", dict(verts=len(tee.data.vertices), faces=len(tee.data.polygons)))

# --- export baked high-res tee for the web (origin = rail centre)
exp = tee.copy()
exp.data = tee.data.copy()
exp.name = f"tee_{PID}"
exp.data.name = f"tee_{PID}"
scn.collection.objects.link(exp)
exp.data.transform(Matrix.Translation(-HANGER_LOC))
exp.location = (0, 0, 0)
exp.data.materials.clear()
os.makedirs(f"{PROJECT}/public/models/tees", exist_ok=True)
for o in scn.objects:
    o.select_set(False)
exp.select_set(True)
bpy.context.view_layer.objects.active = exp
bpy.ops.export_scene.gltf(filepath=f"{PROJECT}/public/models/tees/{PID}.glb", export_format='GLB',
                          use_selection=True, export_apply=True, export_yup=True, export_materials='NONE',
                          export_cameras=False, export_lights=False)
bpy.data.objects.remove(exp, do_unlink=True)

if not NO_RENDER:
    # Optional Cycles rendering path
    def srgb_to_lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    def hex_lin(h):
        h = h.lstrip("#")
        return tuple(srgb_to_lin(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)
    S = json.load(open(f"{WORK}/tees/{PID}_outline.json"))["mapping"]["S"]
    mat = bpy.data.materials.new("VAELIS_Jersey")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out_n = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    uv = nt.nodes.new("ShaderNodeUVMap"); uv.uv_map = "UVMap"
    mp = nt.nodes.new("ShaderNodeMapping")
    tile = 0.035
    mp.inputs["Scale"].default_value = (2 * S / tile, S / tile, 1)
    nt.links.new(uv.outputs["UV"], mp.inputs["Vector"])
    knit = nt.nodes.new("ShaderNodeTexImage")
    knit.image = bpy.data.images.load(f"{WORK}/tex/jersey_normal.png")
    knit.image.colorspace_settings.name = "Non-Color"
    nt.links.new(mp.outputs["Vector"], knit.inputs["Vector"])
    nmap = nt.nodes.new("ShaderNodeNormalMap"); nmap.inputs["Strength"].default_value = 0.35
    nt.links.new(knit.outputs["Color"], nmap.inputs["Color"])
    det = nt.nodes.new("ShaderNodeTexImage")
    det.image = bpy.data.images.load(f"{WORK}/tex/{PID}_detail.png")
    det.image.colorspace_settings.name = "Non-Color"
    nt.links.new(uv.outputs["UV"], det.inputs["Vector"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.45
    bump.inputs["Distance"].default_value = 0.0012
    nt.links.new(det.outputs["Color"], bump.inputs["Height"])
    nt.links.new(nmap.outputs["Normal"], bump.inputs["Normal"])
    nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    rgb = nt.nodes.new("ShaderNodeRGB")
    base = rgb.outputs["Color"]
    ink_path = f"{WORK}/tex/{PID}_ink.png"
    if os.path.exists(ink_path):
        ink = nt.nodes.new("ShaderNodeTexImage")
        ink.image = bpy.data.images.load(ink_path)
        ink.image.colorspace_settings.name = "Non-Color"
        nt.links.new(uv.outputs["UV"], ink.inputs["Vector"])
        mix = nt.nodes.new("ShaderNodeMix"); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
        mix.inputs["Factor"].default_value = 1.0
        nt.links.new(rgb.outputs["Color"], mix.inputs["A"])
        nt.links.new(ink.outputs["Color"], mix.inputs["B"])
        base = mix.outputs["Result"]
    nt.links.new(base, bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.90
    bsdf.inputs["Sheen Weight"].default_value = 0.16
    bsdf.inputs["Specular IOR Level"].default_value = 0.18
    bsdf.inputs["Sheen Roughness"].default_value = 0.6
    nt.links.new(bsdf.outputs["BSDF"], out_n.inputs["Surface"])
    tee.data.materials.clear()
    tee.data.materials.append(mat)
    world = bpy.data.worlds.new("VAELIS_World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.62, 0.6, 0.57, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.45
    scn.world = world
    def area(name, loc, rot, energy, size, color=(1, 1, 1)):
        ld = bpy.data.lights.new(name, 'AREA')
        ld.energy = energy; ld.size = size; ld.color = color
        ob = bpy.data.objects.new(name, ld)
        scn.collection.objects.link(ob)
        ob.location = loc
        ob.rotation_euler = [math.radians(a) for a in rot]
        return ob
    area("Key", (-1.2, -1.6, 0.9), (62, 0, -36), 190, 1.6, (1.0, 0.97, 0.93))
    area("Fill", (1.6, -1.4, -0.2), (85, 0, 48), 70, 2.2, (0.93, 0.96, 1.0))
    area("Rim", (0.4, 1.4, 0.8), (-60, 0, 165), 110, 1.0)
    area("Back", (-0.9, 1.6, -0.6), (-80, 0, 205), 60, 1.6)
    camd = bpy.data.cameras.new("Cam")
    camd.type = 'ORTHO'
    camd.ortho_scale = 1.25
    cam = bpy.data.objects.new("Cam", camd)
    scn.collection.objects.link(cam)
    scn.camera = cam
    scn.render.engine = "CYCLES"
    scn.cycles.samples = 16 if PREVIEW else SAMPLES
    scn.cycles.use_adaptive_sampling = True
    scn.cycles.adaptive_threshold = 0.04
    scn.cycles.use_denoising = True
    scn.cycles.max_bounces = 3
    scn.render.film_transparent = True
    scn.view_settings.view_transform = 'AgX'
    scn.render.resolution_x = 960
    scn.render.resolution_y = 1200
    scn.render.image_settings.file_format = 'PNG'
    scn.render.image_settings.color_mode = 'RGBA'
    os.makedirs(f"{WORK}/renders/tees/{PID}", exist_ok=True)
    colors = ONLY or PRODUCT_COLORS[PID]
    VIEWS = argv[argv.index("--views") + 1].split(",") if "--views" in argv else ["front", "back"]
    turn_objs = [tee] + [bpy.data.objects[n] for n in HANGER_PARTS]
    scn.view_layers[0].update()
    rest = {o.name: o.matrix_world.copy() for o in turn_objs}
    cam.location = (0, -3, -0.385)
    cam.rotation_euler = (math.radians(90), 0, 0)
    for cid in colors:
        rgb.outputs["Color"].default_value = hex_lin(COLORS[cid])
        for view in VIEWS:
            R = Matrix.Identity(4) if view == "front" else Matrix.Rotation(math.pi, 4, "Z")
            for o in turn_objs:
                o.matrix_world = R @ rest[o.name]
            scn.render.filepath = f"{WORK}/renders/tees/{PID}/{cid}-{view}.png"
            bpy.ops.render.render(write_still=True)
            log("rendered", cid, view, round(time.time() - t0, 1), "s")

os.makedirs(f"{WORK}/blend", exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=f"{WORK}/blend/{PID}.blend")
log("DONE", PID, round(time.time() - t0, 1), "s")
