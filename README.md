# VAELIS — Chrono-Fold

A luxury e-commerce site for VAELIS's t-shirt collection, built around **the Atelier Rail**: six real-time 3D t-shirts
hanging from walnut hangers on a bronze rail. Scroll pulls the camera back from Look 01 and then flicks through the
hangers; each piece swings to face you on its hook. Take one off the rail and the others wash back into the plaster
while colourway hang-tags drop in on strings.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Before launch: placeholders

`lib/catalog.ts` sets `CATALOG_IS_PLACEHOLDER = true`. **Product names, prices, sizes and composition are placeholders**
(the site says so in the footer, on product pages and in sizing). Replace them with verified product data, then flip the
flag to `false`.

House details in `lib/site.ts` (salons, email, delivery and returns) are reused verbatim from the previous VAELIS site.

**No payment provider is connected.** Checkout validates the order, prices it on the server from the catalog
(`app/api/orders/route.ts`, `lib/orders.ts`) and returns a reference; it stores nothing and takes no payment. Connect a
payment provider and order persistence there before taking real orders.

## Structure

| Route | What it is |
| --- | --- |
| `/` | Opening + the Atelier Rail (signature), manifesto, *From pattern to drape* (scroll-drawn flat patterns), colour card (3D swatch), lookbook teaser |
| `/collection` | Shop: cut and colour filters, search, sort, plates or true-scale line-up; all state in the URL |
| `/collection/[slug]` | Product: photos, collar/hem close-ups, 3D viewer, colour, size, size guide, bag, save |
| `/lookbook` | Horizontal campaign with pleat-reveal images |
| `/atelier` | House story, the six patterns at true scale, colour card, salons |
| `/client-services` | Contact, delivery and returns, sizing, care |
| `/wishlist`, `/checkout` | Saved pieces; three-step checkout |

- `components/rail` the signature 3D rail · `components/three` shared tee/hanger models and the jersey shader
- `lib/store.ts` bag, saved pieces and currency (localStorage) · `lib/patterns.json` pattern outlines from Blender

Design: plaster `#d8d5ce`, black, a single Umber accent; Archivo (width axis 62–125, animated as the "fold") with
Newsreader for reading text. Motion: GSAP ScrollTrigger + Lenis for scroll, Motion for interface, R3F for 3D.

## 3D assets (Blender)

Everything 3D was made in Blender 5.2 and lives in `public/models` and `public/textures`:

- `hanger.glb` walnut tailor's hanger with bronze swivel hook (origin = where the hook sits on the rail)
- `rail.glb` blackened bronze rail and bracket
- `swatch.glb` cloth-simulated jersey swatch hanging from two clips
- `tees/<id>.glb` six t-shirts: each is built from a flat two-panel pattern, shaped as a closed shell around the
  hanger and draped by cloth simulation; product images in `public/products` are Cycles renders of the same meshes

The pipeline is in `tools/blender` (set `VAELIS_WORK` to a scratch folder, default `D:/vaelis-work`):

```bash
blender -b --factory-startup --python tools/blender/outlines_only.py      # pattern outlines -> $VAELIS_WORK/tees
python tools/blender/gen_textures.py "$VAELIS_WORK/tex"                    # walnut, knit, horn textures
python tools/blender/gen_details.py "$VAELIS_WORK/tees" "$VAELIS_WORK/tex" monolith kimono column tank longsleeve pocket
bash tools/blender/run_all.sh                                              # drape, render, export GLBs
python tools/blender/publish_renders.py                                    # PNG renders -> public/products/*.webp
```

Silhouettes are parameters in `tools/blender/tee.py` (`PRODUCTS`): neck, shoulder, sleeve angle/length, body width and
length. Every render shares one orthographic camera and one crop, so the shop's line-up compares pieces at true scale.
