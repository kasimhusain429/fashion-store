"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Product } from "@/lib/collectionData";
import { useCart } from "@/lib/cartStore";
import { soundSynth } from "@/lib/soundSynth";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

interface QuickViewContentProps {
  product: Product;
  onClose: () => void;
}

function QuickViewContent({ product, onClose }: QuickViewContentProps) {
  const { addItem, currency } = useCart();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || "");
  const [isAdded, setIsAdded] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Lock background scroll when modal is active
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const currentColorway =
    product.colorways[selectedColorIndex] || product.colorways[0];
  const activeImage = currentColorway.image || product.image;

  const formatPrice = (valEUR: number, valUSD: number) => {
    const isEUR = currency === "EUR";
    const amount = isEUR ? valEUR : valUSD;
    return new Intl.NumberFormat(isEUR ? "de-DE" : "en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddToCart = () => {
    soundSynth.playSilkClick();
    addItem({
      id: `${product.id}-${currentColorway.name}`,
      name: product.name,
      look: "ATELIER PIECE",
      priceEUR: product.priceEUR,
      priceUSD: product.priceUSD,
      size: selectedSize,
      colorway: currentColorway.name,
      image: activeImage,
      quantity: 1,
    });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Atelier Vaelis, I would like to reserve ${product.name} in ${currentColorway.name}, Size ${selectedSize}. Please connect me with an atelier advisor.`
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} Quick View`}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#0B0B0C]/85 backdrop-blur-xl animate-fade-in"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#121316] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 overflow-y-auto">
        {/* Left: Big Image Stage */}
        <div className="relative md:w-1/2 aspect-[3/4] md:aspect-auto bg-[#181920] flex-shrink-0">
          <Image
            src={activeImage}
            alt={product.name}
            fill
            className="object-cover"
          />
          <div className="absolute top-4 left-4">
            <span className="font-mono text-[10px] tracking-widest uppercase text-[#C5A880] bg-[#0B0B0C]/80 px-3 py-1.5 rounded-full border border-white/10 glass-panel">
              ARCHIVE PIECE
            </span>
          </div>
        </div>

        {/* Right: Detailed Specifications */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] tracking-widest text-[#C5A880] uppercase">
                  {product.origin}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#EDE9E3] font-light mt-0.5">
                  {product.name}
                </h2>
                <p className="text-xs text-white/50 font-mono mt-1">
                  {product.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Price */}
            <div className="font-serif text-2xl text-[#EDE9E3] border-b border-white/10 pb-4">
              {formatPrice(product.priceEUR, product.priceUSD)}
            </div>

            {/* Fabric Composition */}
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-white/40 tracking-wider uppercase">
                MATERIAL ARCHITECTURE
              </span>
              <p className="font-mono text-xs text-white/80">
                {product.fabric}
              </p>
            </div>

            {/* Colorway Selection */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-[10px] text-white/40">
                <span>COLORWAY</span>
                <span className="text-white/80">{currentColorway.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {product.colorways.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      soundSynth.playSilkClick();
                      setSelectedColorIndex(i);
                    }}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={`Select ${c.name} colorway`}
                    className={`w-6 h-6 rounded-full border transition-all duration-300 ${
                      selectedColorIndex === i
                        ? "border-[#C5A880] scale-125 shadow-[0_0_12px_rgba(197,168,128,0.5)]"
                        : "border-white/20 hover:scale-110"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-[10px] text-white/40">
                <span>SELECT SIZE</span>
                <span className="text-white/80">{selectedSize}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      soundSynth.playSilkClick();
                      setSelectedSize(s);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 ${
                      selectedSize === s
                        ? "bg-[#C5A880] text-[#0B0B0C] font-semibold shadow-md"
                        : "bg-white/5 border border-white/10 text-white/70 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Hand-Finished Details */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <span className="font-mono text-[10px] text-white/40 tracking-wider uppercase">
                ATELIER SPECIFICATIONS
              </span>
              <ul className="space-y-1 font-mono text-[11px] text-white/60">
                {product.details.map((d, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#C5A880]">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`w-full py-3.5 rounded-full font-mono text-xs uppercase tracking-widest font-semibold transition-all duration-300 ${
                isAdded
                  ? "bg-[#34D399] text-[#0B0B0C] shadow-[0_0_25px_rgba(52,211,153,0.4)]"
                  : "bg-[#EDE9E3] hover:bg-[#C5A880] text-[#0B0B0C] shadow-[0_0_20px_rgba(237,233,227,0.2)]"
              }`}
            >
              {isAdded ? "ADDED TO ARCHIVE BAG ✓" : "ADD TO ARCHIVE BAG"}
            </button>

            <a
              href={`https://wa.me/?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => soundSynth.playSilkClick()}
              className="w-full py-3 rounded-full border border-white/15 hover:border-[#C5A880] text-white/70 hover:text-white flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-widest transition-colors"
            >
              <span>Consult Atelier Advisor on WhatsApp</span>
              <span className="text-[#C5A880]">↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuickViewModal({
  product,
  onClose,
}: QuickViewModalProps) {
  if (!product) return null;
  return <QuickViewContent key={product.id} product={product} onClose={onClose} />;
}
