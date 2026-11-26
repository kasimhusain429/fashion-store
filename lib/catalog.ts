/**
 * VAELIS — t-shirt collection catalog.
 *
 * PLACEHOLDER DATA: product names, prices, sizes and composition below are
 * placeholders for the demo build. Every garment silhouette, colourway render and
 * 3D model was produced in Blender from the pattern parameters noted per product;
 * replace the commercial fields (name, price, sizes, composition) with verified
 * product information before launch. Flip CATALOG_IS_PLACEHOLDER to false once done.
 */

export const CATALOG_IS_PLACEHOLDER = true;

export type CategoryId = "short-sleeve" | "long-sleeve" | "sleeveless";

export interface Colorway {
  id: string;
  name: string;
  /** Fabric colour fed to the real-time 3D material and studio renders. */
  hex: string;
  /** Display colour for UI swatches, calibrated to the rendered cotton tone. */
  swatch: string;
  /** Short dye-house provenance note for the colour card. */
  note: string;
}

export interface Product {
  slug: string;
  /** Look number on the rail — the collection is presented in this order. */
  look: number;
  name: string;
  cut: string;
  category: CategoryId;
  priceEUR: number;
  priceUSD: number;
  colorways: Colorway[];
  sizes: string[];
  /** Design facts of the modelled garment (these describe the 3D pattern, not a lab test). */
  construction: string[];
  /** Flat measurements of the size II sample, taken from the Blender pattern (cm). */
  sample: { chest: number; length: number; sleeve: number | null };
  composition: string;
  note: string;
}

export const COLORWAYS = {
  obsidian: {
    id: "obsidian",
    name: "Sumi Obsidian",
    hex: "#17181B",
    swatch: "#1e1e1f",
    note: "Deep pine-soot black with matte charcoal depth",
  },
  celadon: {
    id: "celadon",
    name: "Celadon Sage",
    hex: "#6E8175",
    swatch: "#808b80",
    note: "Muted Kyoto stoneware green over unbleached cotton",
  },
  indigo: {
    id: "indigo",
    name: "Deep Indigo",
    hex: "#28394A",
    swatch: "#344757",
    note: "Nocturnal mineral slate-navy vat dye",
  },
  alabaster: {
    id: "alabaster",
    name: "Bone Alabaster",
    hex: "#EAE4D8",
    swatch: "#dfd9d0",
    note: "Warm raw-ecru combed jersey, lightly washed",
  },
  oxblood: {
    id: "oxblood",
    name: "Oxblood Clay",
    hex: "#6D332D",
    swatch: "#7f4238",
    note: "Architectural kiln terracotta and iron-oxide russet",
  },
  umber: {
    id: "umber",
    name: "Raw Umber",
    hex: "#9E7042",
    swatch: "#a47d58",
    note: "Warm earth ochre cured in natural tannins",
  },
  basalt: {
    id: "basalt",
    name: "Basalt Pewter",
    hex: "#5B6066",
    swatch: "#6d7072",
    note: "Cool mineral stone grey with soft neutral sheen",
  },
  patina: {
    id: "patina",
    name: "Patina Bronze",
    hex: "#78624D",
    swatch: "#88715c",
    note: "Aged warm bronze-taupe over heavyweight knit",
  },
} satisfies Record<string, Colorway>;

const SIZES = ["I", "II", "III", "IV"];
export const SIZE_LABELS: Record<string, string> = { I: "I · S", II: "II · M", III: "III · L", IV: "IV · XL" };

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "short-sleeve", label: "Short sleeve" },
  { id: "long-sleeve", label: "Long sleeve" },
  { id: "sleeveless", label: "Sleeveless" },
];

const COMPOSITION_PLACEHOLDER = "Composition to be confirmed";

export const PRODUCTS: Product[] = [
  {
    slug: "monolith-tee",
    look: 1,
    name: "Monolith Tee",
    cut: "Boxy, dropped shoulder",
    category: "short-sleeve",
    priceEUR: 290,
    priceUSD: 320,
    colorways: [COLORWAYS.obsidian, COLORWAYS.alabaster, COLORWAYS.umber],
    sizes: SIZES,
    construction: [
      "Boxy body cut wide and straight from shoulder to hem",
      "Dropped shoulder seam that sits past the natural shoulder",
      "Ribbed crew neck finished with a cover stitch",
      "Double-needle hem and sleeve openings",
      "Tonal VAELIS wordmark embossed below the back neck",
    ],
    sample: { chest: 58, length: 72, sleeve: 26 },
    composition: COMPOSITION_PLACEHOLDER,
    note: "The volume is the point: take your usual size for the drape shown on the rail.",
  },
  {
    slug: "kimono-tee",
    look: 2,
    name: "Kimono Tee",
    cut: "Wide, cropped, cut-in-one sleeve",
    category: "short-sleeve",
    priceEUR: 320,
    priceUSD: 350,
    colorways: [COLORWAYS.celadon, COLORWAYS.basalt, COLORWAYS.alabaster],
    sizes: SIZES,
    construction: [
      "Sleeves cut in one with the body, no set-in shoulder",
      "Cropped length with a wide, square hem",
      "Deep underarm for an easy kimono line",
      "Ribbed crew neck finished with a cover stitch",
      "Tonal CHRONO-FOLD print embossed across the back neck",
    ],
    sample: { chest: 60, length: 62, sleeve: 33 },
    composition: COMPOSITION_PLACEHOLDER,
    note: "Cut short and wide; it is designed to sit at the high hip.",
  },
  {
    slug: "column-tee",
    look: 3,
    name: "Column Tee",
    cut: "Longline, close through the body",
    category: "short-sleeve",
    priceEUR: 260,
    priceUSD: 285,
    colorways: [COLORWAYS.indigo, COLORWAYS.obsidian, COLORWAYS.patina],
    sizes: SIZES,
    construction: [
      "Long, narrow body that falls past the hip",
      "Natural shoulder with a short, close sleeve",
      "Ribbed crew neck finished with a cover stitch",
      "Small embroidered wordmark on the left chest",
      "Double-needle hem and sleeve openings",
    ],
    sample: { chest: 50, length: 84, sleeve: 19 },
    composition: COMPOSITION_PLACEHOLDER,
    note: "Close through the body; size up for a looser column.",
  },
  {
    slug: "selvedge-tank",
    look: 4,
    name: "Selvedge Tank",
    cut: "Sleeveless, deep armhole",
    category: "sleeveless",
    priceEUR: 210,
    priceUSD: 230,
    colorways: [COLORWAYS.alabaster, COLORWAYS.celadon, COLORWAYS.obsidian],
    sizes: SIZES,
    construction: [
      "Sleeveless body with deep, bound armholes",
      "Low scooped neck with a ribbed band",
      "Slight A-line from underarm to hem",
      "Double-needle hem",
    ],
    sample: { chest: 54, length: 74, sleeve: null },
    composition: COMPOSITION_PLACEHOLDER,
    note: "Designed to layer under the Kimono Tee or wear alone.",
  },
  {
    slug: "chrono-long-sleeve",
    look: 5,
    name: "Chrono Long Sleeve",
    cut: "Regular body, long tapered sleeve",
    category: "long-sleeve",
    priceEUR: 340,
    priceUSD: 370,
    colorways: [COLORWAYS.oxblood, COLORWAYS.indigo, COLORWAYS.alabaster],
    sizes: SIZES,
    construction: [
      "Long sleeve tapering to a narrow opening",
      "Regular body length with a straight hem",
      "Ribbed crew neck finished with a cover stitch",
      "Double-needle hem and sleeve openings",
    ],
    sample: { chest: 54, length: 74, sleeve: 60 },
    composition: COMPOSITION_PLACEHOLDER,
    note: "The sleeve is cut long so it can be pushed up and hold its gather.",
  },
  {
    slug: "atelier-pocket-tee",
    look: 6,
    name: "Atelier Pocket Tee",
    cut: "Classic fit, chest pocket",
    category: "short-sleeve",
    priceEUR: 270,
    priceUSD: 295,
    colorways: [COLORWAYS.umber, COLORWAYS.celadon, COLORWAYS.basalt],
    sizes: SIZES,
    construction: [
      "Classic body and sleeve proportions",
      "Patch pocket on the left chest with a pointed base",
      "Ribbed crew neck finished with a cover stitch",
      "Double-needle hem and sleeve openings",
    ],
    sample: { chest: 54, length: 74, sleeve: 21.5 },
    composition: COMPOSITION_PLACEHOLDER,
    note: "The most classic shape on the rail; take your usual size.",
  },
];

/** Blender pattern id used for the 3D model and render filenames. */
export const MODEL_ID: Record<string, string> = {
  "monolith-tee": "monolith",
  "kimono-tee": "kimono",
  "column-tee": "column",
  "selvedge-tank": "tank",
  "chrono-long-sleeve": "longsleeve",
  "atelier-pocket-tee": "pocket",
};

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function modelUrl(p: Product) {
  return `/models/tees/${MODEL_ID[p.slug]}.glb`;
}

export function detailUrl(p: Product) {
  return `/textures/tees/${MODEL_ID[p.slug]}_detail.png`;
}

export function inkUrl(p: Product): string | null {
  const id = MODEL_ID[p.slug];
  return ["monolith", "kimono", "column", "pocket"].includes(id) ? `/textures/tees/${id}_ink.png` : null;
}

export function imageUrl(p: Product, colorwayId: string, view: "front" | "back" = "front") {
  return `/products/${MODEL_ID[p.slug]}/${colorwayId}-${view}.webp`;
}

export function colorwayOf(p: Product, id?: string | null): Colorway {
  return p.colorways.find((c) => c.id === id) ?? p.colorways[0];
}
