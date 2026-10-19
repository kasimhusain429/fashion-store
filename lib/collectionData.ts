export interface Product {
  id: string;
  look: string;
  name: string;
  subtitle: string;
  priceEUR: number;
  priceUSD: number;
  image: string;
  colorways: { name: string; hex: string; image: string }[];
  sizes: string[];
  fabric: string;
  origin: string;
  details: string[];
}

export const COLLECTION_PRODUCTS: Product[] = [
  {
    id: "vaelis-look-01-trench",
    look: "COCOON TRENCH",
    name: "The Monolith Cocoon Trench",
    subtitle: "Architectural Double-Breasted Outerwear",
    priceEUR: 2850,
    priceUSD: 3100,
    image: "/assets/s1_look01_monolith_studio.jpg",
    colorways: [
      { name: "Obsidian Black", hex: "#121316", image: "/assets/s1_look01_monolith_studio.jpg" },
      { name: "Bone Alabaster", hex: "#EDE9E3", image: "/assets/s3_colorway_alabaster_studio.jpg" },
      { name: "Umber Dust", hex: "#8C6338", image: "/assets/s3_colorway_umber_studio.jpg" },
    ],
    sizes: ["I (S)", "II (M)", "III (L)", "IV (XL)"],
    fabric: "440gsm Bonded Raw Silk & Virgin Wool Twill",
    origin: "Biella Mill Weave • Kyoto Hand-Finish",
    details: [
      "Rigid origami folded lapels with horsehair canvas core",
      "Unlined contrasting raw mulberry silk interior",
      "Hand-turned buffalo horn 4-hole bespoke buttons",
      "Zero deadstock single batch allocation: 60 pieces worldwide",
    ],
  },
  {
    id: "vaelis-look-02-blazer",
    look: "KIMONO BLAZER",
    name: "Asymmetric Kimono Blazer",
    subtitle: "Folded Crossover Tailored Jacket",
    priceEUR: 1950,
    priceUSD: 2120,
    image: "/assets/s3_look02_blazer.jpg",
    colorways: [
      { name: "Basalt Grey", hex: "#32353B", image: "/assets/s3_look02_blazer.jpg" },
      { name: "Obsidian Black", hex: "#121316", image: "/assets/s3_look02_blazer.jpg" },
    ],
    sizes: ["I (S)", "II (M)", "III (L)"],
    fabric: "400gsm Structured Virgin Wool Twill",
    origin: "Biella, Italy",
    details: [
      "Asymmetric wrap closure with integrated self-fabric buckle belt",
      "Drop-shoulder architectural raglan articulation",
      "Raw-cut selvedge edge finishings along hem and lapels",
      "Sashiko reinforcement stitching on stress points",
    ],
  },
  {
    id: "vaelis-look-03-trouser",
    look: "PLEATED TROUSER",
    name: "Chrono Pleated Wide Trouser",
    subtitle: "High-Waisted Volumetric Tailoring",
    priceEUR: 1150,
    priceUSD: 1250,
    image: "/assets/s3_look03_trouser.jpg",
    colorways: [
      { name: "Obsidian Black", hex: "#121316", image: "/assets/s3_look03_trouser.jpg" },
      { name: "Bone Alabaster", hex: "#EDE9E3", image: "/assets/s3_look03_trouser.jpg" },
    ],
    sizes: ["I (S)", "II (M)", "III (L)", "IV (XL)"],
    fabric: "380gsm Bonded Wool Twill",
    origin: "Biella, Italy",
    details: [
      "Deep origami double front pleats extending to hem",
      "Ultra-wide fluid column drape with raw turn-up selvedge cuffs",
      "Concealed horn-button fly and waistband side adjusters",
      "Breathable cupro pocket lining",
    ],
  },
  {
    id: "vaelis-look-04-gilet",
    look: "SELVEDGE GILET",
    name: "Sculpted Selvedge Gilet",
    subtitle: "Standing Collar Asymmetric Vest",
    priceEUR: 1450,
    priceUSD: 1580,
    image: "/assets/s3_look04_gilet.jpg",
    colorways: [
      { name: "Patina Bronze", hex: "#5E4D38", image: "/assets/s3_look04_gilet.jpg" },
      { name: "Obsidian Black", hex: "#121316", image: "/assets/s3_look04_gilet.jpg" },
    ],
    sizes: ["I (S)", "II (M)", "III (L)"],
    fabric: "Heavyweight Bonded Linen-Wool Twill",
    origin: "Kyoto Atelier, Japan",
    details: [
      "Fringed raw-cut selvedge armhole openings",
      "High architectural standing funnel collar",
      "Two-way oxidized gunmetal asymmetric front zip",
      "Internal harness strap carry system",
    ],
  },
  {
    id: "vaelis-look-05-overshirt",
    look: "DRAPE OVERSHIRT",
    name: "Orbital Drape Overshirt",
    subtitle: "Sheer Asymmetric Storm Shirt",
    priceEUR: 1280,
    priceUSD: 1390,
    image: "/assets/s3_look05_overshirt.jpg",
    colorways: [
      { name: "Smoked Obsidian", hex: "#26272B", image: "/assets/s3_look05_overshirt.jpg" },
    ],
    sizes: ["I (S)", "II (M)", "III (L)"],
    fabric: "100% Unbleached Mulberry Raw Silk",
    origin: "Kyoto, Japan",
    details: [
      "Semi-translucent liquid silk drape with natural slub texture",
      "Waterfall asymmetric storm shield drape across chest",
      "Mother-of-pearl buttons with subtle iridescent sheen",
      "French-seamed internal construction throughout",
    ],
  },
  {
    id: "vaelis-look-06-skirt",
    look: "ORIGAMI SKIRT",
    name: "Fluted Origami Column Skirt",
    subtitle: "Geometric Pleated Maxi Column",
    priceEUR: 1350,
    priceUSD: 1470,
    image: "/assets/s3_look06_skirt.jpg",
    colorways: [
      { name: "Bone Alabaster", hex: "#EDE9E3", image: "/assets/s3_look06_skirt.jpg" },
      { name: "Obsidian Black", hex: "#121316", image: "/assets/s3_look06_skirt.jpg" },
    ],
    sizes: ["I (S)", "II (M)", "III (L)"],
    fabric: "Bonded Twill in Virgin Merino Wool",
    origin: "Biella, Italy",
    details: [
      "Rigid origami accordion flute pleats holding vertical column architecture",
      "Raw selvedge eyelash fringe along hem perimeter",
      "Concealed side seam zip with architectural hook closure",
      "Clean interior bound in natural silk Habotai",
    ],
  },
  {
    id: "vaelis-look-07-belt",
    look: "HARNESS BELT",
    name: "Modular Leather Harness Belt",
    subtitle: "Tuscan Bridle Leather Hardware",
    priceEUR: 680,
    priceUSD: 740,
    image: "/assets/s3_look07_belt.jpg",
    colorways: [
      { name: "Tuscan Black", hex: "#121214", image: "/assets/s3_look07_belt.jpg" },
    ],
    sizes: ["S/M (75-85cm)", "L/XL (85-100cm)"],
    fabric: "Vegetable-Tanned Tuscan Bridle Leather",
    origin: "Florence, Italy",
    details: [
      "Full grain 4mm bridle leather burnished with natural beeswax",
      "Brushed oxidized patina bronze double-buckle hardware",
      "Modular strap system compatible with Monolith Trench and Kimono Blazer",
      "Hand-numbered atelier serial stamp",
    ],
  },
];
