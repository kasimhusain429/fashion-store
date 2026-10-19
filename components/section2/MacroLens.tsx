"use client";

import Image from "next/image";

interface MacroLensProps {
  progress: number; // local progress of Beat 2 (0 to 1)
  active: boolean;
}

export default function MacroLens({ progress, active }: MacroLensProps) {
  if (!active && progress <= 0) return null;

  // Scale and opacity driven by Beat 2 progress
  const opacity = Math.min(progress * 2.5, 1.0) * Math.min((1.0 - progress) * 3.0, 1.0);
  const scale = 0.65 + Math.min(progress, 0.5) * 0.7;

  // Stitch line path length (SVG strokeDashoffset)
  const pathLength = 1000;
  const strokeOffset = pathLength * (1.0 - Math.min(progress * 1.5, 1.0));

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-20 flex items-center justify-center transition-opacity duration-300 ${
        opacity > 0.02 ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!active}
    >
      {/* ============================================================
          DYNAMIC DRAWING SASHIKO STITCH LINE ACROSS CLOTH
          ============================================================ */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 50,750 C 350,680 400,280 720,450 C 1040,620 1150,220 1390,150"
          stroke="#C5A880"
          strokeWidth="2"
          strokeDasharray="14 10"
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
          className="transition-all duration-75"
        />
        {/* Glowing Needle Tip */}
        <circle
          cx="720"
          cy="450"
          r="4"
          fill="#EDE9E3"
          className="drop-shadow-[0_0_8px_#C5A880] animate-pulse"
        />
      </svg>

      {/* ============================================================
          CIRCULAR SVG APERTURE / MACRO TWILL LENS
          ============================================================ */}
      <div
        style={{
          transform: `scale(${scale})`,
          opacity: opacity,
        }}
        className="relative w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] rounded-full overflow-hidden border border-[#C5A880]/60 shadow-[0_0_60px_rgba(197,168,128,0.25)] glass-panel transition-transform duration-100 ease-out flex items-center justify-center"
      >
        {/* Layer 1 (0.2x depth): Deep dark shadow weave backing */}
        <div className="absolute inset-0 bg-[#09090B] opacity-90" />

        {/* Layer 2 (0.5x depth): Microscopic Wool & Silk Twill Image */}
        <div className="absolute inset-0 w-full h-full scale-125 transition-transform duration-300">
          <Image
            src="/assets/s2_macro_weave_ref.jpg"
            alt="Extreme macro of 440gsm bonded virgin wool twill and silk selvedge"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Layer 3 (1.0x depth): Optical Caliper Reticle Overlay */}
        <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none flex items-center justify-center">
          {/* Concentric rings */}
          <div className="w-3/4 h-3/4 rounded-full border border-[#C5A880]/30" />
          <div className="w-1/2 h-1/2 rounded-full border border-[#C5A880]/20" />

          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-[#C5A880]/40 to-transparent" />
          <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-[#C5A880]/40 to-transparent" />

          {/* Micro Measurement Callouts */}
          <div className="absolute top-6 font-mono text-[9px] tracking-widest text-[#C5A880] uppercase bg-[#0B0B0C]/80 px-2.5 py-0.5 rounded-full border border-white/10">
            18.5µm VIRGIN MERINO TWILL
          </div>

          <div className="absolute bottom-6 font-mono text-[9px] tracking-widest text-white/70 uppercase bg-[#0B0B0C]/80 px-2.5 py-0.5 rounded-full border border-white/10">
            RAW HABOTAI SILK SELVEDGE
          </div>
        </div>

        {/* Ambient Raking Specular Sheen */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Flanking Atelier Micro-Data (Left & Right) */}
      <div
        style={{ opacity: opacity }}
        className="absolute w-full max-w-5xl px-8 flex justify-between items-center pointer-events-none font-mono text-[10px] text-white/50 tracking-widest"
      >
        <div className="hidden sm:block space-y-1 bg-[#121316]/80 p-3 rounded-lg border border-white/10 backdrop-blur-md">
          <div className="text-[#C5A880] font-semibold">WEAVE FORMULA</div>
          <div>2/2 RIGHT-HAND ARCHITECTURAL TWILL</div>
          <div>ZERO DISCHARGE WATER-REPELLENT RESIN</div>
        </div>

        <div className="hidden sm:block text-right space-y-1 bg-[#121316]/80 p-3 rounded-lg border border-white/10 backdrop-blur-md">
          <div className="text-[#C5A880] font-semibold">TENSILE DENSITY</div>
          <div>WARP: 120 ENDS/INCH • BIELLA MILL</div>
          <div>WEFT: 94 PICKS/INCH • UNBLEACHED SILK</div>
        </div>
      </div>
    </div>
  );
}
