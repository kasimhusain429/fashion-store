"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { soundSynth } from "@/lib/soundSynth";
import CraftCanvas from "./CraftCanvas";
import MacroLens from "./MacroLens";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SectionCraftProps {
  onExitState?: (progress: number) => void;
}

export default function SectionCraft({ onExitState }: SectionCraftProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const manifestoWordsRef = useRef<HTMLSpanElement[]>([]);
  const calloutsRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeCallout, setActiveCallout] = useState<number | null>(null);
  const [assembledColorway, setAssembledColorway] = useState<"alabaster" | "obsidian">("alabaster");

  const manifestoText =
    "We do not construct garments to follow the body. We sculpt monumental architectures that suspend time, where rigid virgin wool twill surrenders to the fluid flight of unbleached silk.";

  const words = manifestoText.split(" ");

  const anatomyCallouts = [
    {
      id: 1,
      title: "ORIGAMI LAPELS",
      spec: "440GSM BONDED VIRGIN WOOL",
      desc: "Architectural crisp folds holding geometric contour without canvas sagging.",
      pos: "top-[16%] left-[10%] sm:left-[16%]",
    },
    {
      id: 2,
      title: "FLUID MEMBRANE",
      spec: "UNBLEACHED HABOTAI SILK",
      desc: "Low-friction organic mulberry lining finished with contrasting amber selvedge.",
      pos: "top-[40%] right-[8%] sm:right-[14%]",
    },
    {
      id: 3,
      title: "SCULPTED RAGLAN",
      spec: "ARTICULATED SLEEVE PANELS",
      desc: "Ergonomic volumetric cut providing zero arm-lift resistance.",
      pos: "top-[26%] left-[6%] sm:left-[10%]",
    },
    {
      id: 4,
      title: "ATELIER SELVEDGE",
      spec: "HAND-STITCHED SASHIKO BAR-TACKS",
      desc: "Reinforced structural pivot points individually stitched in Kyoto.",
      pos: "bottom-[22%] left-[12%] sm:left-[18%]",
    },
    {
      id: 5,
      title: "ORGANIC TRIMS",
      spec: "HAND-TURNED BUFFALO HORN",
      desc: "Matte-carved 4-hole bespoke buttons secured with waxed linen thread.",
      pos: "bottom-[18%] right-[10%] sm:right-[16%]",
    },
  ];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Pinned Multi-Beat Timeline for Section 2 (Generous runway for all 3 beats)
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "+=280%",
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 0.4,
        preventOverlaps: true,
        fastScrollEnd: true,
        onUpdate: (self) => {
          const p = self.progress;
          setScrollProgress(p);
          if (onExitState) onExitState(p);

          // BEAT 1: Word-by-word Manifesto animation (0.0 to 0.32)
          if (manifestoWordsRef.current.length > 0) {
            const wordCount = manifestoWordsRef.current.length;
            const manifestoP = Math.min(p / 0.30, 1.0);
            const activeWordIndex = Math.floor(manifestoP * wordCount);

            manifestoWordsRef.current.forEach((el, idx) => {
              if (el) {
                if (idx <= activeWordIndex) {
                  gsap.set(el, {
                    opacity: 1,
                    color: idx === activeWordIndex ? "#C5A880" : "#EDE9E3",
                    scale: idx === activeWordIndex ? 1.03 : 1.0,
                    force3D: true,
                  });
                } else {
                  gsap.set(el, {
                    opacity: 0.22,
                    color: "#7E7D86",
                    scale: 1.0,
                    force3D: true,
                  });
                }
              }
            });
          }
        },
      });

      // Recalculate pin offsets accurately after mounting
      ScrollTrigger.refresh();
    }, section);

    return () => ctx.revert();
  }, [onExitState]);

  // BEAT 1: Manifesto visibility (0.0 to 0.36)
  const manifestoOpacity =
    scrollProgress < 0.30 ? 1.0 : Math.max(0, 1.0 - (scrollProgress - 0.30) / 0.08);

  // BEAT 2: MacroLens progress (0.30 to 0.58)
  const macroProgress = Math.max(0, Math.min(1, (scrollProgress - 0.30) / 0.26));
  const isMacroActive = scrollProgress >= 0.28 && scrollProgress <= 0.60;

  // BEAT 3: Exploded Anatomy Callouts visibility (0.50 to 1.0)
  // Smoothly eases in from 0.50 to 0.62, holds full opacity 0.62-0.92,
  // and smoothly transitions out from 0.92 to 1.0 as Section 3 enters.
  const calloutsOpacity =
    scrollProgress < 0.50
      ? 0
      : scrollProgress < 0.62
      ? (scrollProgress - 0.50) / 0.12
      : scrollProgress > 0.92
      ? Math.max(0, 1.0 - (scrollProgress - 0.92) / 0.08)
      : 1.0;

  const calloutsScale = 0.95 + Math.min(1, Math.max(0, (scrollProgress - 0.50) / 0.15)) * 0.05;
  const isCalloutsActive = calloutsOpacity > 0.03;

  return (
    <section
      ref={sectionRef}
      id="section-craft"
      className="relative w-full h-screen overflow-hidden bg-[#0A0B0D] text-[#EDE9E3] flex items-center justify-center select-none"
      aria-label="The Craft — Manifesto, Weave, and Exploded Anatomy"
    >
      {/* 3D WebGL Canvas Layer */}
      <CraftCanvas scrollProgress={scrollProgress} assembledColorway={assembledColorway} />

      {/* Extreme Macro Circular Lens & Drawing Stitch Line (Beat 2) */}
      <MacroLens progress={macroProgress} active={isMacroActive} />

      {/* Soft Ambient Radial Atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none z-2 bg-[radial-gradient(circle_at_30%_50%,rgba(197,168,128,0.06)_0%,transparent_60%)]"
        aria-hidden="true"
      />

      {/* ============================================================
          BEAT 1: BALANCED EDITORIAL MANIFESTO (Right 55% Column)
          ============================================================ */}
      <div
        style={{
          opacity: manifestoOpacity,
          pointerEvents: "none",
        }}
        className="absolute inset-0 z-20 flex items-center justify-end px-6 sm:px-12 lg:px-20 transition-opacity duration-300"
      >
        <div
          style={{ pointerEvents: manifestoOpacity > 0.05 ? "auto" : "none" }}
          className="w-full max-w-2xl ml-auto flex flex-col justify-center space-y-6 lg:space-y-8 py-8 sm:py-12 p-6 sm:p-0 rounded-2xl sm:rounded-none bg-[#0A0B0D]/85 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border border-white/10 sm:border-none"
        >
          {/* Section Category Header & Rotating Trench Colorway Switcher (Alabaster First) */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
              <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.35em] text-[#C5A880] font-semibold">
                THE CRAFT MANIFESTO
              </span>
            </div>

            {/* Rotating Trench Coat Colorway Switcher (Alabaster First, Obsidian Second) */}
            <div
              style={{ pointerEvents: "auto" }}
              className="flex items-center gap-2 bg-[#121316]/95 p-1.5 rounded-full border border-white/15 glass-pill shadow-xl relative z-40"
            >
              {/* Alabaster First */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundSynth.playSilkClick();
                  setAssembledColorway("alabaster");
                }}
                className={`px-3.5 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer relative z-50 ${
                  assembledColorway === "alabaster"
                    ? "bg-[#EDE9E3] text-[#0B0B0C] font-semibold shadow-[0_0_15px_rgba(237,233,227,0.6)] scale-105"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#EDE9E3] border border-black/30" />
                <span>ALABASTER</span>
              </button>

              {/* Obsidian Second */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundSynth.playSilkClick();
                  setAssembledColorway("obsidian");
                }}
                className={`px-3.5 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer relative z-50 ${
                  assembledColorway === "obsidian"
                    ? "bg-[#C5A880] text-[#0B0B0C] font-semibold shadow-[0_0_15px_rgba(197,168,128,0.6)] scale-105"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#121316] border border-white/40" />
                <span>OBSIDIAN</span>
              </button>
            </div>
          </div>

          {/* Kinetic Word-by-Word Headline with Guaranteed Spaces */}
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[3.1rem] font-light leading-[1.28] tracking-[-0.01em] text-[#EDE9E3]">
            {words.map((word, i) => (
              <span
                key={i}
                ref={(el) => {
                  if (el) manifestoWordsRef.current[i] = el;
                }}
                className="inline-block transition-colors duration-200"
              >
                {word}
                {/* Guaranteed HTML space between words */}
                <span className="inline-block">&nbsp;</span>
              </span>
            ))}
          </h2>

          {/* Clean Atelier Provenance Footer */}
          <div className="pt-6 flex flex-wrap items-center gap-6 font-mono text-[11px] text-white/50 tracking-widest border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-[#C5A880]">EDITION:</span>
              <span className="text-white/80">LIMITED ATELIER RUN</span>
            </div>
            <span className="text-white/20">•</span>
            <div className="flex items-center gap-2">
              <span className="text-[#C5A880]">ORIGIN:</span>
              <span className="text-white/80">BIELLA WEAVE × KYOTO SASHIKO</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          BEAT 3: EXPLODED ANATOMY CALLOUT LABELS & CONNECTORS
          ============================================================ */}
      <div
        ref={calloutsRef}
        style={{
          opacity: calloutsOpacity,
          transform: `scale(${calloutsScale})`,
          pointerEvents: isCalloutsActive ? "auto" : "none",
        }}
        className="absolute inset-0 z-30 flex flex-col justify-between p-6 sm:p-12 transition-all duration-150 will-change-transform"
      >
        {/* Top Header Tag */}
        <div className="w-full flex justify-between items-center pt-16">
          <div className="flex items-center gap-3 bg-[#121316]/85 px-4 py-2 rounded-full border border-white/10 glass-panel shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-ping" />
            <span className="font-mono text-[10px] tracking-widest text-[#EDE9E3]">
              DECONSTRUCTED COUTURE ANATOMY [ 5 ARCHITECTURAL NODES ]
            </span>
          </div>

          <div className="font-mono text-[10px] tracking-widest text-white/50 uppercase hidden sm:block">
            HOVER OR TAP A COMPONENT TO INSPECT
          </div>
        </div>

        {/* Floating Callout Badges with Hairline Connectors */}
        <div className="absolute inset-0 pointer-events-none">
          {anatomyCallouts.map((item) => {
            const isHovered = activeCallout === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveCallout(item.id)}
                onMouseLeave={() => setActiveCallout(null)}
                onClick={() =>
                  setActiveCallout(activeCallout === item.id ? null : item.id)
                }
                className={`absolute ${item.pos} pointer-events-auto cursor-pointer transition-all duration-300 group`}
              >
                <div
                  className={`p-2.5 sm:p-4 rounded-xl glass-panel border transition-all duration-300 max-w-[200px] sm:max-w-[280px] shadow-xl ${
                    isHovered
                      ? "border-[#C5A880] bg-[#1a1b22]/95 shadow-[0_0_25px_rgba(197,168,128,0.3)] scale-105"
                      : "border-white/10 bg-[#121316]/85 hover:border-white/25"
                  }`}
                >
                  <div className="border-b border-white/10 pb-1.5 mb-1.5">
                    <span className="font-mono text-[9px] tracking-widest text-[#C5A880] font-semibold">
                      {item.title}
                    </span>
                  </div>

                  <div className="font-serif text-sm sm:text-base text-white/90 font-medium leading-snug">
                    {item.spec}
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-white/50 font-mono mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Status / Transition Bar */}
        <div className="w-full flex justify-between items-end pb-4 font-mono text-[10px] text-white/40">
          <span>ATELIER ANATOMY</span>
          <span className="text-[#C5A880]">SCROLL TOWARDS COLLECTION ↓</span>
        </div>
      </div>
    </section>
  );
}
