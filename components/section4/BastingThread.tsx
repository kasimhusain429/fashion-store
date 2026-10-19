"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function BastingThread() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [threadProgress, setThreadProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        end: "bottom 25%",
        scrub: 0.5,
        onUpdate: (self) => {
          setThreadProgress(self.progress);
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full py-10 sm:py-14 overflow-hidden select-none"
      aria-label="Atelier Basting Thread Progress"
    >
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col gap-2">
        {/* Thread Header */}
        <div className="flex justify-between items-center font-mono text-[9px] tracking-[0.25em] text-[#C5A880] uppercase">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-ping" />
            <span>ATELIER BASTING THREAD • SILK STITCH LINE</span>
          </span>
          <span className="text-white/40">
            {Math.round(threadProgress * 100)}% COMPLETE
          </span>
        </div>

        {/* Tactile Thread Track */}
        <div className="relative w-full h-4 flex items-center">
          {/* Base dashed grey guide track */}
          <div className="absolute inset-x-0 h-px border-b border-dashed border-white/20" />

          {/* Active Golden Basting Thread */}
          <div
            style={{ width: `${threadProgress * 100}%` }}
            className="absolute left-0 h-[2px] bg-gradient-to-r from-[#C5A880]/30 via-[#C5A880] to-[#EDE9E3] shadow-[0_0_12px_rgba(197,168,128,0.8)] transition-all duration-75"
          />

          {/* Golden Tailor's Needle Point */}
          <div
            style={{ left: `${threadProgress * 100}%` }}
            className="absolute -translate-x-1/2 flex items-center justify-center transition-all duration-75"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-[#EDE9E3] border border-[#C5A880] shadow-[0_0_10px_#C5A880] animate-pulse" />
          </div>
        </div>

        {/* Tailor's Marks */}
        <div className="flex justify-between items-center font-mono text-[8px] text-white/30 tracking-widest">
          <span>PIEDMONT WEAVE</span>
          <span>SASHIKO BASTE</span>
          <span>MONOLITH CLOSURE</span>
        </div>
      </div>
    </div>
  );
}
