import bpy, json, os, sys
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tee.py")
code = open(SRC).read()
ns = {"__name__": "tee"}
exec(code, ns)
os.makedirs(ns["OUT"], exist_ok=True)
for pid, p in ns["PRODUCTS"].items():
    F = ns["outline"](p, True); B = ns["outline"](p, False)
    allx = [q.x for q, _ in F + B]; allz = [q.y for q, _ in F + B]
    S = max(max(allx) - min(allx), max(allz) - min(allz)) + 0.02
    mapping = dict(S=S, xmin=min(allx) - 0.01, zmin=min(allz) - 0.01)
    with open(f"{ns['OUT']}/{pid}_outline.json", "w") as fh:
        json.dump(dict(id=pid, params=p, mapping=mapping, front=[[q.x, q.y, l] for q, l in F], back=[[q.x, q.y, l] for q, l in B]), fh)
    print("[vaelis] outline", pid, round(S, 3))
