"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroCanvas from "./HeroCanvas";
import { soundSynth } from "@/lib/soundSynth";
import { useCart } from "@/lib/cartStore";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SectionDropProps {
  onExitState?: (progress: number) => void;
}

export default function SectionDrop({ onExitState }: SectionDropProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgHeadlineRef = useRef<HTMLHeadingElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const { addItem } = useCart();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Background monumental word reveals smoothly behind coat
      gsap.fromTo(
        bgHeadlineRef.current,
        {
          opacity: 0,
          scale: 0.96,
          y: 20,
        },
        {
          opacity: 0.22,
          scale: 1,
          y: 0,
          duration: 0.9,
          delay: 0.2,
          ease: "power3.out",
        }
      );

      // Bottom editorial accents animate in
      gsap.fromTo(
        bottomBarRef.current,
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.35,
          ease: "power2.out",
        }
      );

      // ScrollTrigger timeline for parallax separation
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=100%",
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 0.4,
        fastScrollEnd: true,
        preventOverlaps: true,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
          if (onExitState) onExitState(self.progress);

          // GPU-accelerated parallax transform on background typography
          if (bgHeadlineRef.current) {
            gsap.set(bgHeadlineRef.current, {
              yPercent: -self.progress * 25,
              opacity: 0.22 * (1 - self.progress * 1.5),
              scale: 1 - self.progress * 0.04,
              force3D: true,
            });
          }

          if (bottomBarRef.current) {
            gsap.set(bottomBarRef.current, {
              opacity: 1 - self.progress * 2.2,
              y: self.progress * 25,
              force3D: true,
            });
          }
        },
      });

      // Recalculate pin offsets accurately after mounting
      ScrollTrigger.refresh();
    }, section);

    return () => ctx.revert();
  }, [onExitState]);

  const handleQuickReserve = () => {
    soundSynth.playSilkClick();
    addItem({
      id: "vaelis-look-01-trench",
      name: "The Monolith Cocoon Trench",
      look: "THE MONOLITH",
      priceEUR: 2850,
      priceUSD: 3100,
      size: "II (M)",
      colorway: "Obsidian Black",
      image: "/assets/s1_hero_trench_ref.jpg",
      quantity: 1,
    });
  };

  return (
    <section
      ref={sectionRef}
      id="section-drop"
      className="relative w-full h-screen overflow-hidden bg-[#0B0B0C] flex flex-col justify-between select-none"
      aria-label="The Drop — The Monolith Cocoon Trench"
    >
      {/* ============================================================
          LAYER 1 (z-1): MONUMENTAL ARCHITECTURAL HEADLINE BEHIND COAT
          ============================================================ */}
      <div
        className="absolute inset-0 z-1 flex items-center justify-center pointer-events-none select-none overflow-hidden will-change-transform transform-gpu"
        aria-hidden="true"
      >
        <h1
          ref={bgHeadlineRef}
          className="font-serif text-[17vw] lg:text-[18vw] font-light leading-none tracking-[0.02em] text-[#EDE9E3] uppercase text-center whitespace-nowrap opacity-20 will-change-transform transform-gpu"
        >
          MONOLITH
        </h1>
      </div>

      {/* Atmospheric Radial Runway Glow */}
      <div
        className="absolute inset-0 z-2 pointer-events-none bg-[radial-gradient(ellipse_at_50%_60%,rgba(197,168,128,0.07)_0%,transparent_65%)]"
        aria-hidden="true"
      />

      {/* ============================================================
          LAYER 2 (z-10): 3D RUNWAY CANVAS (COAT FLOATS IN FRONT)
          ============================================================ */}
      <HeroCanvas scrollProgress={scrollProgress} />

      {/* ============================================================
          LAYER 3 (z-20): EDITORIAL SPECIFICATIONS & RESERVE ACTION
          ============================================================ */}
      <div className="relative z-20 w-full h-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-end pb-8 sm:pb-12 pointer-events-none">
        {/* Bottom Editorial Specifications & Reserve Action */}
        <div
          ref={bottomBarRef}
          className="grid grid-cols-1 sm:grid-cols-3 items-end gap-6 pb-2 pointer-events-auto will-change-transform transform-gpu"
        >
          {/* Left: Atelier Provenance Spec */}
          <div className="space-y-1 font-mono text-[10px] sm:text-[11px] text-white/60">
            <div className="text-[#C5A880] tracking-widest uppercase text-[9px] font-semibold">
              ATELIER ARCHIVE SPECIFICATION
            </div>
            <div className="text-white/90 tracking-wider">
              440GSM BONDED RAW SILK &amp; VIRGIN WOOL TWILL
            </div>
            <div className="text-white/40 tracking-wider">
              BIELLA MILL WEAVE • KYOTO FINISH • ZERO DEADSTOCK
            </div>
          </div>

          {/* Center: Tactile Basting Stitch Scroll Indicator (Hidden on compact mobile to preserve 3D coat clearance) */}
          <div className="hidden sm:flex flex-col items-center justify-center gap-1.5 text-center">
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/50">
              SCROLL TO DISSECT
            </span>
            <div className="relative w-[1px] h-10 bg-white/10 overflow-hidden rounded-full">
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#C5A880] to-transparent stitch-pulse" />
            </div>
          </div>

          {/* Right: Price & Pre-Order Button */}
          <div className="flex flex-row sm:flex-col justify-between sm:items-end items-center gap-2.5 pt-2 sm:pt-0 border-t border-white/10 sm:border-t-0">
            <div className="font-mono text-xs sm:text-sm text-white/90 flex items-baseline gap-2">
              <span className="text-white/40 text-[9px] tracking-widest uppercase">
                LIMITED EDITION
              </span>
              <span className="font-serif text-lg text-[#EDE9E3]">€2,850</span>
            </div>

            <button
              type="button"
              onClick={handleQuickReserve}
              className="px-6 py-2.5 rounded-full bg-[#EDE9E3] hover:bg-[#C5A880] text-[#0B0B0C] font-mono text-[11px] uppercase tracking-widest font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(237,233,227,0.15)] hover:shadow-[0_0_30px_rgba(197,168,128,0.35)] hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              RESERVE THE MONOLITH
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
