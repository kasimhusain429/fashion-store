"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FinaleCanvas from "./FinaleCanvas";
import HeritageParallax from "./HeritageParallax";
import BastingThread from "./BastingThread";
import SizeGuideModal from "./SizeGuideModal";
import { useCart } from "@/lib/cartStore";
import { soundSynth } from "@/lib/soundSynth";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface SectionFinaleProps {
  onExitState?: (progress: number) => void;
}

export default function SectionFinale({ onExitState }: SectionFinaleProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const ctaCardRef = useRef<HTMLDivElement>(null);

  const { addItem, openCart, currency } = useCart();
  const [selectedSize, setSelectedSize] = useState("II (M)");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isNewsletterSubmitted, setIsNewsletterSubmitted] = useState(false);
  const [newsletterError, setNewsletterError] = useState("");

  const sizes = ["I (S)", "II (M)", "III (L)", "IV (XL)"];

  // Pricing based on active currency
  const priceDisplay = currency === "EUR" ? "€2,850" : "$3,100";

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          if (onExitState) onExitState(self.progress);
        },
      });

      // Monumental headline reveal
      if (headlineRef.current) {
        gsap.fromTo(
          headlineRef.current,
          { opacity: 0, y: 30, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.0,
            scrollTrigger: {
              trigger: headlineRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }

      // CTA Card reveal
      if (ctaCardRef.current) {
        gsap.fromTo(
          ctaCardRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            scrollTrigger: {
              trigger: ctaCardRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      }
    }, section);

    return () => ctx.revert();
  }, [onExitState]);

  const handleReserve = () => {
    soundSynth.playSilkClick();
    addItem({
      id: "vaelis-look-01-trench",
      name: "The Monolith Cocoon Trench",
      look: "THE MONOLITH",
      priceEUR: 2850,
      priceUSD: 3100,
      size: selectedSize,
      colorway: "Obsidian Black",
      image: "/assets/s1_look01_monolith_studio.jpg",
      quantity: 1,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      openCart();
    }, 600);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      setNewsletterError("Please enter a valid atelier correspondence address.");
      return;
    }
    soundSynth.playSilkClick();
    setNewsletterError("");
    setIsNewsletterSubmitted(true);
  };

  const handleScrollToTop = () => {
    soundSynth.playSilkClick();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Atelier Vaelis, I would like to request a private archival consultation for The Monolith Cocoon Trench, Size ${selectedSize}.`
  );

  return (
    <section
      ref={sectionRef}
      id="section-finale"
      className="relative w-full min-h-screen bg-[#07080A] text-[#EDE9E3] pt-20 overflow-hidden select-none flex flex-col items-center"
      aria-label="Proof and Finale"
    >
      {/* ============================================================
          BEAT 1: DIFFERENTIAL SPEED HERITAGE PARALLAX TRACKS
          ============================================================ */}
      <HeritageParallax />

      {/* ============================================================
          BEAT 2: TACTILE GOLDEN BASTING THREAD
          ============================================================ */}
      <BastingThread />

      {/* ============================================================
          BEAT 3: THE MONUMENTAL RETURN & PRIMARY CTA STAGE
          ============================================================ */}
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 py-16 sm:py-24 flex flex-col items-center relative">
        {/* Giant Monolithic Backdrop Wordmark */}
        <div
          ref={headlineRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-0 text-center opacity-15"
          aria-hidden="true"
        >
          <span className="font-serif text-[18vw] leading-none tracking-[0.25em] text-[#EDE9E3] font-light">
            VAELIS
          </span>
        </div>

        {/* Section Headline */}
        <div className="relative z-10 text-center space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 glass-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse" />
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#C5A880]">
              THE FINALE
            </span>
          </div>

          <h2 className="font-serif text-4xl sm:text-6xl font-light text-[#EDE9E3] tracking-tight">
            FORM SUSPENDED IN SILENCE
          </h2>
          <p className="font-mono text-xs text-white/50 max-w-md mx-auto">
            The Monolith Cocoon Trench returns to its dais. Sixty individually registered garments worldwide.
          </p>
        </div>

        {/* Centerpiece 3D WebGL Canvas */}
        <div className="w-full relative z-10 flex justify-center">
          <FinaleCanvas />
        </div>

        {/* Floating Reservation Action Bar */}
        <div
          ref={ctaCardRef}
          className="relative z-20 -mt-10 sm:-mt-14 w-full max-w-xl p-6 sm:p-8 rounded-2xl glass-panel border border-[#C5A880]/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col items-center gap-6"
        >
          {/* Garment Identification */}
          <div className="w-full flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-white/10 pb-4 gap-2">
            <div>
              <div className="font-serif text-2xl text-[#EDE9E3] font-light">
                The Monolith Cocoon Trench
              </div>
              <div className="font-mono text-[10px] text-[#C5A880] tracking-widest uppercase">
                BIELLA WOOL &amp; MULBERRY SILK
              </div>
            </div>
            <div className="font-serif text-2xl text-[#EDE9E3] font-light">
              {priceDisplay}
            </div>
          </div>

          {/* Size Selector Strip */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] text-white/50 tracking-wider">
                SELECT SIZE:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      soundSynth.playSilkClick();
                      setSelectedSize(s);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[11px] tracking-wider transition-all duration-200 ${
                      selectedSize === s
                        ? "bg-[#C5A880] text-[#0B0B0C] font-semibold shadow-[0_0_15px_rgba(197,168,128,0.5)]"
                        : "bg-white/5 border border-white/10 text-white/70 hover:border-white/30"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundSynth.playSilkClick();
                setIsSizeGuideOpen(true);
              }}
              className="font-mono text-[10px] text-[#C5A880] hover:text-white underline underline-offset-4 tracking-widest transition-colors self-start sm:self-auto"
            >
              SIZE GUIDE ↗
            </button>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-3">
            {/* Primary Reserve Button */}
            <button
              type="button"
              onClick={handleReserve}
              className={`flex-1 py-4 px-6 rounded-xl font-mono text-xs tracking-[0.25em] uppercase font-medium transition-all duration-300 relative overflow-hidden group shadow-2xl ${
                isAdded
                  ? "bg-[#34D399] text-[#0B0B0C]"
                  : "bg-gradient-to-r from-[#C5A880] via-[#D4B892] to-[#C5A880] text-[#0B0B0C] hover:shadow-[0_0_30px_rgba(197,168,128,0.6)] hover:scale-[1.02]"
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isAdded ? "RESERVED IN ARCHIVE ✓" : `RESERVE THE MONOLITH — ${priceDisplay}`}
              </span>
            </button>

            {/* WhatsApp VIP Concierge */}
            <a
              href={`https://wa.me/?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundSynth.playSilkClick()}
              className="px-5 py-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white font-mono text-xs tracking-wider flex items-center justify-center gap-2 transition-all duration-300"
            >
              <span>VIP CONCIERGE</span>
              <span>↗</span>
            </a>
          </div>

          {/* Authentic Atelier Guarantee Badges */}
          <div className="grid grid-cols-3 w-full border-t border-white/10 pt-4 text-center font-mono text-[9px] text-white/40 tracking-wider">
            <div>EXPRESS COURIER</div>
            <div>14-DAY RETURNS</div>
            <div>LIFETIME TAILORING</div>
          </div>
        </div>
      </div>

      {/* ============================================================
          BEAT 4: ARCHIVAL FOOTER & GLOBAL POLICY MATRIX
          ============================================================ */}
      <footer className="w-full border-t border-white/10 bg-[#050608] pt-20 pb-12 text-white/70">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col gap-16">
          {/* Top Footer: Brand Philosophy & Newsletter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 border-b border-white/10 pb-16">
            {/* Column 1: Monogram & Manifesto */}
            <div className="lg:col-span-5 space-y-4">
              <span className="font-serif text-3xl sm:text-4xl tracking-[0.3em] text-[#EDE9E3] font-light">
                VAELIS
              </span>
              <p className="font-mono text-xs text-white/50 max-w-md leading-relaxed">
                A digital haute couture atelier between Paris and Kyoto. Garments constructed with pure tectonic integrity, sculpted from bonded Biella wool twill and Japanese Habotai silk.
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 font-mono text-[10px] text-[#C5A880] tracking-widest">
                <span>PARIS SALON: 14 RUE SAINT-FLORENTIN</span>
                <span>•</span>
                <span>KYOTO ATELIER: GION HIGASHIYAMA</span>
              </div>
            </div>

            {/* Column 2: Working Archival Dispatch Form */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#C5A880]">
                  ARCHIVAL DISPATCH REGISTRY
                </span>
                <h4 className="font-serif text-2xl font-light text-[#EDE9E3] mt-1 mb-2">
                  RECEIVE PRIVATE SALON NOTICES
                </h4>
                <p className="font-mono text-xs text-white/50 mb-4">
                  Exclusive allocation windows, bespoke fittings, and archival previews delivered directly to your correspondence.
                </p>
              </div>

              {isNewsletterSubmitted ? (
                <div className="p-4 rounded-xl bg-white/5 border border-[#C5A880]/40 text-[#C5A880] font-mono text-xs tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
                  <span>YOUR ARCHIVAL INVITATION HAS BEEN REGISTERED. WE SALUTE YOUR DISCRETION.</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="ENTER ATELIER CORRESPONDENCE EMAIL"
                    aria-label="Newsletter email address"
                    className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-3 font-mono text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C5A880] transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-[#C5A880] text-white hover:text-[#0B0B0C] border border-white/20 hover:border-[#C5A880] font-mono text-xs tracking-widest uppercase transition-all duration-300 font-medium whitespace-nowrap"
                  >
                    REGISTER ↗
                  </button>
                </form>
              )}
              {newsletterError && (
                <p className="font-mono text-[10px] text-red-400 mt-2">{newsletterError}</p>
              )}
            </div>
          </div>

          {/* Middle Footer: Links Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 font-mono text-xs">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-[#C5A880]">
                ARCHIVAL COLLECTION
              </div>
              <ul className="space-y-2 text-white/50 text-[11px]">
                <li><a href="#section-drop" className="hover:text-white transition-colors">Monolith Trench</a></li>
                <li><a href="#section-collection" className="hover:text-white transition-colors">Kimono Blazer</a></li>
                <li><a href="#section-collection" className="hover:text-white transition-colors">Pleated Trouser</a></li>
                <li><a href="#section-collection" className="hover:text-white transition-colors">Selvedge Gilet</a></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-[#C5A880]">
                CRAFT &amp; WEAVE
              </div>
              <ul className="space-y-2 text-white/50 text-[11px]">
                <li><a href="#section-craft" className="hover:text-white transition-colors">Biella Wool Spinning</a></li>
                <li><a href="#section-craft" className="hover:text-white transition-colors">Habotai Silk Bonding</a></li>
                <li><a href="#section-craft" className="hover:text-white transition-colors">Sashiko Reinforcement</a></li>
                <li><a href="#section-craft" className="hover:text-white transition-colors">Buffalo Horn Carving</a></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-[#C5A880]">
                CLIENT SERVICES
              </div>
              <ul className="space-y-2 text-white/50 text-[11px]">
                <li><button type="button" onClick={() => setIsSizeGuideOpen(true)} className="hover:text-white transition-colors cursor-pointer text-left">Bespoke Size Guide</button></li>
                <li><a href={`https://wa.me/?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp VIP Liaison</a></li>
                <li><span className="text-white/40">Complimentary Global Courier</span></li>
                <li><span className="text-white/40">14-Day Archival Exchange</span></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-widest text-[#C5A880]">
                ATELIER SALONS
              </div>
              <ul className="space-y-2 text-white/50 text-[11px]">
                <li>PARIS: 14 Rue Saint-Florentin</li>
                <li>KYOTO: 247 Gionmachi Kitagawa</li>
                <li>HOURS: Mon–Sat by Private Appointment</li>
                <li><a href="mailto:salon@vaelis-atelier.com" className="hover:text-[#C5A880] transition-colors">SALON@VAELIS-ATELIER.COM</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Summit Return */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-8 font-mono text-[10px] text-white/40">
            <div>
              © 2026 ATELIER VAELIS. ALL RIGHTS RESERVED. PARIS • KYOTO.
            </div>

            <button
              type="button"
              onClick={handleScrollToTop}
              className="flex items-center gap-2 text-[#C5A880] hover:text-white transition-colors tracking-widest uppercase"
            >
              <span>RETURN TO SUMMIT</span>
              <span>↑</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Sizing Matrix Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />
    </section>
  );
}
