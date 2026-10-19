"use client";

import { useState } from "react";
import { useCart } from "@/lib/cartStore";
import { soundSynth } from "@/lib/soundSynth";

interface StickyNavProps {
  activeSection?: number;
}

export default function StickyNav({ activeSection = 1 }: StickyNavProps) {
  const { totalCount, openCart } = useCart();
  const [soundActive, setSoundActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleToggleSound = () => {
    const active = soundSynth.toggle();
    setSoundActive(active);
    if (active) soundSynth.playSilkClick();
  };

  const navItems = [
    { id: 1, label: "THE DROP", href: "#section-drop" },
    { id: 2, label: "THE CRAFT", href: "#section-craft" },
    { id: 3, label: "COLLECTION", href: "#section-collection" },
    { id: 4, label: "FINALE", href: "#section-finale" },
  ];

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 lg:px-16 py-5 pointer-events-none w-full"
        aria-label="Main Navigation"
      >
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between pointer-events-auto">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-3">
            <a
              href="#section-drop"
              className="group flex flex-col items-start focus:outline-none"
              aria-label="Atelier Vaelis Home"
              onClick={() => soundSynth.playSilkClick()}
            >
              <span className="font-serif text-xl sm:text-2xl tracking-[0.35em] text-[#EDE9E3] group-hover:text-[#C5A880] transition-colors duration-300 font-light">
                VAELIS
              </span>
              <span className="font-mono text-[8px] tracking-[0.25em] text-white/35 -mt-0.5">
                PARIS • KYOTO
              </span>
            </a>
          </div>

          {/* Central Section Indicator / Nav Pill */}
          <nav
            aria-label="Section Navigation"
            className="hidden md:flex items-center gap-1 px-4 py-1.5 rounded-full glass-pill border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          >
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => soundSynth.playSilkClick()}
                  className={`px-3 py-1 rounded-full text-[10px] font-mono tracking-widest transition-all duration-300 ${
                    isActive
                      ? "bg-white/10 text-[#C5A880] border border-[#C5A880]/30 shadow-[0_0_15px_rgba(197,168,128,0.2)]"
                      : "text-white/50 hover:text-white/90 hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Controls: Audio Ambience + Reservation Bag */}
          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              aria-label={soundActive ? "Mute Atmosphere" : "Enable Atmosphere"}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill border transition-all duration-300 ${
                soundActive
                  ? "border-[#C5A880]/50 text-[#C5A880] shadow-[0_0_15px_rgba(197,168,128,0.25)]"
                  : "border-white/10 text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              <div className="flex items-end gap-[2px] h-3 w-3">
                <span
                  className={`w-[2px] bg-current rounded-full transition-all duration-300 ${
                    soundActive ? "h-3 animate-pulse" : "h-1"
                  }`}
                />
                <span
                  className={`w-[2px] bg-current rounded-full transition-all duration-300 ${
                    soundActive ? "h-2 animate-bounce" : "h-1.5"
                  }`}
                />
                <span
                  className={`w-[2px] bg-current rounded-full transition-all duration-300 ${
                    soundActive ? "h-3.5 animate-pulse" : "h-2"
                  }`}
                />
              </div>
              <span className="hidden sm:inline font-mono text-[9px] tracking-widest uppercase">
                {soundActive ? "AUDIO ON" : "AUDIO"}
              </span>
            </button>

            {/* Bag Button */}
            <button
              type="button"
              onClick={() => {
                soundSynth.playSilkClick();
                openCart();
              }}
              aria-label={`Open Atelier Bag with ${totalCount} items`}
              className="relative flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border border-white/10 hover:border-[#C5A880]/60 text-[#EDE9E3] hover:text-[#C5A880] transition-all duration-300 group"
            >
              <svg
                width="13"
                height="15"
                viewBox="0 0 14 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform group-hover:scale-105"
              >
                <path
                  d="M2.5 5.5H11.5L12.5 14.5H1.5L2.5 5.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.5 5.5V3.5C4.5 2.11929 5.61929 1 7 1C8.38071 1 9.5 2.11929 9.5 3.5V5.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
              <span className="font-mono text-[10px] tracking-wider">BAG</span>
              {totalCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#C5A880] text-[#0B0B0C] font-mono text-[9px] font-bold flex items-center justify-center -ml-0.5 shadow-[0_0_10px_rgba(197,168,128,0.5)]">
                  {totalCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden flex flex-col justify-center gap-1.5 w-8 h-8 rounded-full glass-pill border border-white/10 text-white/70 hover:text-white px-2"
            >
              <span
                className={`w-full h-[1.5px] bg-current transition-transform duration-300 ${
                  mobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              />
              <span
                className={`w-full h-[1.5px] bg-current transition-opacity duration-300 ${
                  mobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`w-full h-[1.5px] bg-current transition-transform duration-300 ${
                  mobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div
        aria-hidden={!mobileMenuOpen}
        className={`md:hidden fixed inset-0 z-40 bg-[#0B0B0C]/95 backdrop-blur-2xl transition-all duration-500 pt-28 px-8 flex flex-col justify-between pb-12 ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none -translate-y-4"
        }`}
      >
        <div className="space-y-6">
          <div className="font-mono text-xs text-[#C5A880] tracking-widest uppercase">
            CHRONO-FOLD DIRECTORY
          </div>
          <div className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="font-serif text-3xl text-white/80 hover:text-[#C5A880] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-4 border-t border-white/10 pt-6">
          <div className="flex justify-between font-mono text-xs text-white/50">
            <span>LOCATION</span>
            <span>BIELLA × KYOTO</span>
          </div>
          <div className="flex justify-between font-mono text-xs text-white/50">
            <span>EDITION</span>
            <span>ARCHIVAL DROP</span>
          </div>
        </div>
      </div>
    </>
  );
}
