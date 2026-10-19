"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HeritageParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const track1Ref = useRef<HTMLDivElement>(null);
  const track2Ref = useRef<HTMLDivElement>(null);
  const track3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      // Differential speed horizontal parallax driven by scroll
      gsap.to(track1Ref.current, {
        xPercent: -18,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8,
        },
      });

      gsap.to(track2Ref.current, {
        xPercent: 14,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.6,
        },
      });

      gsap.to(track3Ref.current, {
        xPercent: -22,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.9,
        },
      });
    }, container);

    return () => ctx.revert();
  }, []);

  const track1Items = [
    { title: "BIELLA, PIEDMONT", text: "100% GOTS-Certified Virgin Merino Wool", tag: "FIBER" },
    { title: "440GSM TWILL", text: "Dense structured drape with zero canvas sag", tag: "WEAVE" },
    { title: "18.5µm FINENESS", text: "Select long-staple fleece spun in Alpine mills", tag: "PURITY" },
    { title: "ALPINE SCOURING", text: "Washed in natural snowmelt spring water", tag: "PROCESS" },
    { title: "BIELLA, PIEDMONT", text: "100% GOTS-Certified Virgin Merino Wool", tag: "FIBER" },
    { title: "440GSM TWILL", text: "Dense structured drape with zero canvas sag", tag: "WEAVE" },
  ];

  const track2Items = [
    { title: "KYOTO GUILD ARCHIVE", text: "Registered serial number engraved in interior lining", tag: "EDITION" },
    { title: "140 HOURS HANDWORK", text: "Hand-finished selvedge hems and horsehair canvas", tag: "ATELIER" },
    { title: "BUFFALO HORN BUTTONS", text: "Hand-turned four-hole buttons with raw silk stems", tag: "HARDWARE" },
    { title: "SASHIKO STITCHING", text: "Structural bar-tack reinforcement at every pivot node", tag: "TECHNIQUE" },
    { title: "KYOTO GUILD ARCHIVE", text: "Registered serial number engraved in interior lining", tag: "EDITION" },
    { title: "140 HOURS HANDWORK", text: "Hand-finished selvedge hems and horsehair canvas", tag: "ATELIER" },
  ];

  const track3Items = [
    { title: "0% DEADSTOCK WASTE", text: "Zero-discharge origami pattern cut geometry", tag: "ETHICS" },
    { title: "60 PIECES GLOBALLY", text: "Strictly limited single harvest allocation", tag: "ARCHIVE" },
    { title: "LIFETIME BESPOKE CARE", text: "Free restoration & tailoring at Paris & Kyoto salons", tag: "GUARANTEE" },
    { title: "NATURAL MINERAL DYES", text: "Extracted raw ochre, bone alabaster, and obsidian ash", tag: "COLOR" },
    { title: "0% DEADSTOCK WASTE", text: "Zero-discharge origami pattern cut geometry", tag: "ETHICS" },
    { title: "60 PIECES GLOBALLY", text: "Strictly limited single harvest allocation", tag: "ARCHIVE" },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full py-16 sm:py-24 overflow-hidden border-y border-white/10 bg-[#090A0D]"
    >
      {/* Background Section Accent */}
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C5A880]">
            HERITAGE &amp; PROVENANCE ARCHIVE
          </span>
          <h3 className="font-serif text-3xl sm:text-4xl font-light text-[#EDE9E3] mt-1">
            THE ARCHIVAL RECORD
          </h3>
        </div>
        <p className="font-mono text-[11px] text-white/45 max-w-sm">
          Verified atelier credentials from our companion weaving mill in Biella and hand-tailoring studio in Higashiyama, Kyoto.
        </p>
      </div>

      {/* Multi-Track Parallax Slipstream */}
      <div className="flex flex-col gap-4 select-none">
        {/* Track 1: Biella Weave (Slides Left) */}
        <div ref={track1Ref} className="flex gap-4 w-max will-change-transform transform-gpu">
          {track1Items.map((item, idx) => (
            <div
              key={`t1-${idx}`}
              className="px-6 py-4 rounded-xl glass-panel border border-white/10 hover:border-[#C5A880]/50 transition-colors duration-300 flex items-center gap-4 min-w-[320px] sm:min-w-[380px]"
            >
              <span className="px-2 py-0.5 rounded-full bg-[#C5A880]/15 text-[#C5A880] font-mono text-[8px] uppercase tracking-widest border border-[#C5A880]/30">
                {item.tag}
              </span>
              <div>
                <div className="font-serif text-base text-[#EDE9E3] tracking-wide">
                  {item.title}
                </div>
                <div className="font-mono text-[10px] text-white/50 tracking-wider">
                  {item.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Track 2: Kyoto Guild (Slides Right) */}
        <div ref={track2Ref} className="flex gap-4 w-max -translate-x-32 will-change-transform transform-gpu">
          {track2Items.map((item, idx) => (
            <div
              key={`t2-${idx}`}
              className="px-6 py-4 rounded-xl glass-panel border border-white/10 hover:border-[#C5A880]/50 transition-colors duration-300 flex items-center gap-4 min-w-[320px] sm:min-w-[400px]"
            >
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 font-mono text-[8px] uppercase tracking-widest border border-white/15">
                {item.tag}
              </span>
              <div>
                <div className="font-serif text-base text-[#EDE9E3] tracking-wide">
                  {item.title}
                </div>
                <div className="font-mono text-[10px] text-white/50 tracking-wider">
                  {item.text}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Track 3: Provenance & Guarantee (Slides Left) */}
        <div ref={track3Ref} className="flex gap-4 w-max will-change-transform transform-gpu">
          {track3Items.map((item, idx) => (
            <div
              key={`t3-${idx}`}
              className="px-6 py-4 rounded-xl glass-panel border border-white/10 hover:border-[#C5A880]/50 transition-colors duration-300 flex items-center gap-4 min-w-[320px] sm:min-w-[380px]"
            >
              <span className="px-2 py-0.5 rounded-full bg-[#34D399]/15 text-[#34D399] font-mono text-[8px] uppercase tracking-widest border border-[#34D399]/30">
                {item.tag}
              </span>
              <div>
                <div className="font-serif text-base text-[#EDE9E3] tracking-wide">
                  {item.title}
                </div>
                <div className="font-mono text-[10px] text-white/50 tracking-wider">
                  {item.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
