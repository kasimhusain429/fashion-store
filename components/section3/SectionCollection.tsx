"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { COLLECTION_PRODUCTS, Product } from "@/lib/collectionData";
import ProductCard from "./ProductCard";
import QuickViewModal from "./QuickViewModal";
import SilkRibbonCanvas from "./SilkRibbonCanvas";
import ColorwayStudio from "./ColorwayStudio";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SectionCollectionProps {
  onExitState?: (progress: number) => void;
}

export default function SectionCollection({
  onExitState,
}: SectionCollectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [ribbonScroll, setRibbonScroll] = useState(0);
  const [counterValues, setCounterValues] = useState({
    hours: 0,
    pieces: 0,
    microns: 0,
    deadstock: 0,
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Track Section 3 overall progress
      ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          if (onExitState) onExitState(self.progress);
        },
      });

      // Ribbon & Kinetic Statistics ScrollTrigger
      if (ribbonRef.current) {
        ScrollTrigger.create({
          trigger: ribbonRef.current,
          start: "top 75%",
          end: "bottom 25%",
          scrub: 0.5,
          onUpdate: (self) => {
            setRibbonScroll(self.progress);

            // Animate counting numbers smoothly with scroll
            const p = self.progress;
            setCounterValues({
              hours: Math.floor(p * 140),
              pieces: Math.floor(p * 60),
              microns: Number((p * 18.5).toFixed(1)),
              deadstock: 0,
            });
          },
        });
      }
    }, section);

    return () => ctx.revert();
  }, [onExitState]);

  return (
    <section
      ref={sectionRef}
      id="section-collection"
      className="relative w-full min-h-screen bg-[#0B0B0C] text-[#EDE9E3] py-24 sm:py-32 overflow-hidden select-none flex flex-col items-center"
      aria-label="The Collection in Motion"
    >
      {/* Editorial Section Header */}
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 mb-16 sm:mb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-[0.35em] text-[#C5A880]">
                THE COLLECTION
              </span>
            </div>
            <h2 className="font-serif text-4xl sm:text-6xl font-light text-[#EDE9E3] tracking-tight">
              CHRONO-FOLD ARCHIVAL COLLECTION
            </h2>
          </div>

          <div className="font-mono text-xs text-white/50 tracking-widest max-w-sm">
            LIMITED ARCHIVAL RUN • SCULPTURAL SILHOUETTES CRAFTED FROM BONDED BIELLA WOOL &amp; UNBLEACHED JAPANESE SILK.
          </div>
        </div>
      </div>

      {/* ============================================================
          STAGE 1: ASYMMETRIC EDITORIAL GRID (7 REAL PIECES)
          ============================================================ */}
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-start">
          {COLLECTION_PRODUCTS.map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              index={idx}
              isFeatured={idx === COLLECTION_PRODUCTS.length - 1}
              onOpenQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      </div>

      {/* ============================================================
          STAGE 2: FULL-WIDTH GLSL SILK RIBBON & KINETIC STATS
          ============================================================ */}
      <div
        ref={ribbonRef}
        className="relative my-24 sm:my-32 w-full overflow-hidden bg-[#0E0F13] border-y border-white/10 py-12 sm:py-16 min-h-[520px] flex items-center justify-center"
      >
        {/* Background Full-Width WebGL Silk Ribbon Shader */}
        <div className="absolute inset-0 w-full h-full pointer-events-none flex justify-center">
          <SilkRibbonCanvas scrollProgress={ribbonScroll} />
        </div>

        {/* Kinetic Count-Up Statistics HUD */}
        <div className="relative z-20 w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-between gap-8 pointer-events-none">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase text-[#C5A880]">
              MATERIAL KINETICS • SILK DISPLACEMENT SHADER
            </span>
            <span className="font-mono text-[10px] sm:text-xs tracking-widest text-white/40">
              100% MULBERRY HABOTAI
            </span>
          </div>

          {/* Kinetic Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pointer-events-auto">
            {/* Stat 1 */}
            <div className="space-y-1 p-5 rounded-xl glass-panel border border-white/10 backdrop-blur-xl">
              <div className="font-serif text-4xl sm:text-5xl font-light text-[#EDE9E3]">
                {counterValues.hours}h
              </div>
              <div className="font-mono text-[10px] tracking-widest text-[#C5A880] uppercase">
                HANDWORK PER PIECE
              </div>
              <p className="font-mono text-[9px] text-white/40">
                Individual sashiko bar-tacks and hand-finished selvedge hems.
              </p>
            </div>

            {/* Stat 2 */}
            <div className="space-y-1 p-5 rounded-xl glass-panel border border-white/10 backdrop-blur-xl">
              <div className="font-serif text-4xl sm:text-5xl font-light text-[#EDE9E3]">
                {counterValues.pieces}
              </div>
              <div className="font-mono text-[10px] tracking-widest text-[#C5A880] uppercase">
                PIECES PER DROP
              </div>
              <p className="font-mono text-[9px] text-white/40">
                Strictly limited single-batch allocation worldwide.
              </p>
            </div>

            {/* Stat 3 */}
            <div className="space-y-1 p-5 rounded-xl glass-panel border border-white/10 backdrop-blur-xl">
              <div className="font-serif text-4xl sm:text-5xl font-light text-[#EDE9E3]">
                {counterValues.microns}µm
              </div>
              <div className="font-mono text-[10px] tracking-widest text-[#C5A880] uppercase">
                FIBER FINENESS
              </div>
              <p className="font-mono text-[9px] text-white/40">
                GOTS-certified ultra-fine virgin Merino wool from Biella.
              </p>
            </div>

            {/* Stat 4 */}
            <div className="space-y-1 p-5 rounded-xl glass-panel border border-white/10 backdrop-blur-xl">
              <div className="font-serif text-4xl sm:text-5xl font-light text-[#34D399]">
                0%
              </div>
              <div className="font-mono text-[10px] tracking-widest text-[#34D399] uppercase">
                DEADSTOCK WASTE
              </div>
              <p className="font-mono text-[9px] text-white/40">
                Zero-discharge pattern cutting and recycled silk bonding.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[9px] sm:text-[10px] text-white/40">
            <span>BIELLA MILL WEAVE • KYOTO FINISH</span>
            <span className="text-[#C5A880]">SCROLL TO EXPLORE COLORWAYS ↓</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          STAGE 3: FLUID COLORWAY MORPH STUDIO
          ============================================================ */}
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 mt-12 flex flex-col items-center">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 bg-[#121316] px-3.5 py-1 rounded-full border border-white/10 glass-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-ping" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C5A880]">
              CHROMATIC MORPH STUDIO
            </span>
          </div>
          <h3 className="font-serif text-3xl sm:text-5xl font-light text-[#EDE9E3]">
            THE THREE PALETTES
          </h3>
          <p className="font-mono text-xs text-white/50 max-w-lg mx-auto">
            Experience the signature Monolith Cocoon Trench across three natural archival mineral dyes. Tap any swatch to morph the garment in real-time.
          </p>
        </div>

        {/* Colorway Studio Canvas */}
        <ColorwayStudio />
      </div>

      {/* Quick View Modal Drawer */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  );
}
