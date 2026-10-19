"use client";

import { useEffect, useState } from "react";
import { soundSynth } from "@/lib/soundSynth";

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  const [unit, setUnit] = useState<"cm" | "in">("cm");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const measurements = [
    {
      size: "Size I (S)",
      chest: unit === "cm" ? "116 cm" : "45.7 in",
      shoulder: unit === "cm" ? "49 cm" : "19.3 in",
      sleeve: unit === "cm" ? "64 cm" : "25.2 in",
      length: unit === "cm" ? "122 cm" : "48.0 in",
      fit: "Equivalent to EU 46-48 / US 36-38",
    },
    {
      size: "Size II (M)",
      chest: unit === "cm" ? "122 cm" : "48.0 in",
      shoulder: unit === "cm" ? "51 cm" : "20.1 in",
      sleeve: unit === "cm" ? "65.5 cm" : "25.8 in",
      length: unit === "cm" ? "125 cm" : "49.2 in",
      fit: "Equivalent to EU 48-50 / US 38-40 (Hero Trench Runway Sample)",
    },
    {
      size: "Size III (L)",
      chest: unit === "cm" ? "128 cm" : "50.4 in",
      shoulder: unit === "cm" ? "53 cm" : "20.9 in",
      sleeve: unit === "cm" ? "67 cm" : "26.4 in",
      length: unit === "cm" ? "128 cm" : "50.4 in",
      fit: "Equivalent to EU 50-52 / US 40-42",
    },
    {
      size: "Size IV (XL)",
      chest: unit === "cm" ? "134 cm" : "52.8 in",
      shoulder: unit === "cm" ? "55 cm" : "21.7 in",
      sleeve: unit === "cm" ? "68 cm" : "26.8 in",
      length: unit === "cm" ? "130 cm" : "51.2 in",
      fit: "Equivalent to EU 52-54 / US 42-44",
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={() => onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#0E0F13] border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl glass-panel max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#C5A880]">
              ATELIER MEASUREMENT MATRIX
            </span>
            <h3
              id="size-guide-title"
              className="font-serif text-2xl sm:text-3xl font-light text-[#EDE9E3] mt-1"
            >
              MONOLITH SILHOUETTE GUIDE
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onClose()}
            aria-label="Close size guide"
            className="w-8 h-8 rounded-full border border-white/10 hover:border-white/30 flex items-center justify-center text-white/50 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Unit Switcher */}
        <div className="flex justify-between items-center my-6">
          <p className="font-mono text-xs text-white/50">
            Measurements taken across flat garment.
          </p>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            <button
              type="button"
              onClick={() => {
                soundSynth.playSilkClick();
                setUnit("cm");
              }}
              className={`px-3 py-1 rounded-full font-mono text-[10px] tracking-wider transition-colors ${
                unit === "cm"
                  ? "bg-[#C5A880] text-[#0B0B0C] font-semibold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              METRIC (CM)
            </button>
            <button
              type="button"
              onClick={() => {
                soundSynth.playSilkClick();
                setUnit("in");
              }}
              className={`px-3 py-1 rounded-full font-mono text-[10px] tracking-wider transition-colors ${
                unit === "in"
                  ? "bg-[#C5A880] text-[#0B0B0C] font-semibold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              IMPERIAL (IN)
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/15 text-[#C5A880] text-[10px] tracking-wider">
                <th className="py-3 px-2">SIZE</th>
                <th className="py-3 px-2">CHEST</th>
                <th className="py-3 px-2">SHOULDER</th>
                <th className="py-3 px-2">SLEEVE</th>
                <th className="py-3 px-2">LENGTH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {measurements.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="py-3.5 px-2 font-serif text-sm text-[#EDE9E3]">
                    {row.size}
                  </td>
                  <td className="py-3.5 px-2 text-white/70">{row.chest}</td>
                  <td className="py-3.5 px-2 text-white/70">{row.shoulder}</td>
                  <td className="py-3.5 px-2 text-white/70">{row.sleeve}</td>
                  <td className="py-3.5 px-2 text-white/70">{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tailor Advice */}
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="font-mono text-[10px] uppercase tracking-widest text-[#C5A880]">
            SILHOUETTE &amp; FIT ADVICE
          </div>
          <p className="font-mono text-[11px] text-white/60 leading-relaxed">
            The Monolith Cocoon Trench is cut with an architectural volume designed to drape sculpturally over light tailoring or knitwear. If you prefer the monumental runway drape, choose your standard sizing. For a closer, more classical fit, select one size down.
          </p>
        </div>
      </div>
    </div>
  );
}
