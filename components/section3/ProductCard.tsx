"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Product } from "@/lib/collectionData";
import { useCart } from "@/lib/cartStore";
import { soundSynth } from "@/lib/soundSynth";

interface ProductCardProps {
  product: Product;
  index: number;
  isFeatured?: boolean;
  onOpenQuickView: (product: Product) => void;
}

export default function ProductCard({
  product,
  index,
  isFeatured = false,
  onOpenQuickView,
}: ProductCardProps) {
  const { addItem, currency } = useCart();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);
  const [isAdded, setIsAdded] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const currentColorway = product.colorways[selectedColorIndex] || product.colorways[0];
  const activeImage = currentColorway.image || product.image;

  // Format price
  const formatPrice = (valEUR: number, valUSD: number) => {
    const isEUR = currency === "EUR";
    const amount = isEUR ? valEUR : valUSD;
    return new Intl.NumberFormat(isEUR ? "de-DE" : "en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Subtle 3D card tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 6, y: -y * 6 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Asymmetric staggered card layout styling (featured card never staggers)
  const isOdd = index % 2 !== 0 && !isFeatured;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
      }}
      className={`relative group flex flex-col justify-between p-6 sm:p-8 rounded-2xl glass-panel border border-white/10 hover:border-[#C5A880]/50 transition-all duration-500 shadow-[0_10px_35px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(197,168,128,0.15)] will-change-transform ${
        isFeatured ? "md:col-span-2 mt-8 lg:mt-16" : isOdd ? "lg:translate-y-16" : ""
      }`}
    >
      {/* Card Header: Garment Architecture & Provenance */}
      <div className="flex items-baseline justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="font-mono text-xs tracking-[0.25em] text-[#C5A880] uppercase font-semibold">
            {isFeatured ? "ARCHIVAL ACCESSORY • MODULAR HARDWARE" : "ARCHIVAL TAILORING"}
          </span>
        </div>
        <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
          {product.origin.split("•")[0]}
        </span>
      </div>

      {isFeatured ? (
        /* Horizontal Featured Layout for 7th Archival Accessory Centerpiece */
        <div className="my-6 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Image Column */}
          <div
            onClick={() => onOpenQuickView(product)}
            className="md:col-span-5 relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-square rounded-xl overflow-hidden bg-[#16171D] cursor-pointer group/img"
          >
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
            />
            <div className="absolute inset-0 bg-[#0B0B0C]/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
              <span className="px-4 py-2 rounded-full glass-pill border border-white/30 text-[10px] font-mono tracking-widest text-white uppercase shadow-xl">
                QUICK VIEW ↗
              </span>
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono tracking-widest text-[#C5A880] uppercase mb-2">
                COLLECTION HIGHLIGHT
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-light text-[#EDE9E3] leading-snug">
                {product.name}
              </h3>
              <p className="text-xs text-white/50 font-mono mt-1">
                {product.subtitle}
              </p>
            </div>

            {/* Architectural Feature Bullet Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-white/60 py-2 border-y border-white/5">
              {product.details.slice(0, 2).map((d, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[#C5A880] mt-0.5">•</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>

            {/* Controls: Colorways & Sizes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Colorway */}
              <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                <span className="font-mono text-[10px] text-white/40 tracking-wider">
                  COLORWAY:
                </span>
                <div className="flex items-center gap-2">
                  {product.colorways.map((c, i) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColorIndex(i)}
                      aria-label={`Select ${c.name} colorway`}
                      title={c.name}
                      style={{ backgroundColor: c.hex }}
                      className={`w-4 h-4 rounded-full border transition-all duration-300 ${
                        selectedColorIndex === i
                          ? "border-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.6)]"
                          : "border-white/20 hover:scale-110"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                <span className="font-mono text-[10px] text-white/40 tracking-wider">
                  SIZE:
                </span>
                <div className="flex items-center gap-1.5">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono transition-all duration-200 ${
                        selectedSize === s
                          ? "bg-[#C5A880] text-[#0B0B0C] font-semibold"
                          : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {s.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price & Add to Bag */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="font-serif text-2xl sm:text-3xl text-[#EDE9E3]">
                {formatPrice(product.priceEUR, product.priceUSD)}
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`px-6 py-3 rounded-full font-mono text-[11px] uppercase tracking-widest font-semibold transition-all duration-300 ${
                  isAdded
                    ? "bg-[#34D399] text-[#0B0B0C] shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                    : "bg-[#EDE9E3] hover:bg-[#C5A880] text-[#0B0B0C] shadow-[0_0_15px_rgba(237,233,227,0.15)] hover:shadow-[0_0_25px_rgba(197,168,128,0.35)] active:scale-95"
                }`}
              >
                {isAdded ? "ADDED ✓" : "ADD TO BAG"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Vertical Layout */
        <>
          {/* Product Image Stage */}
          <div
            onClick={() => onOpenQuickView(product)}
            className="relative my-6 w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#16171D] cursor-pointer group/img"
          >
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover/img:scale-105"
            />

            {/* Floating Quick View Pill */}
            <div className="absolute inset-0 bg-[#0B0B0C]/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
              <span className="px-4 py-2 rounded-full glass-pill border border-white/30 text-[10px] font-mono tracking-widest text-white uppercase shadow-xl">
                QUICK VIEW ↗
              </span>
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-4">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-light text-[#EDE9E3] leading-snug">
                {product.name}
              </h3>
              <p className="text-xs text-white/50 font-mono mt-1">
                {product.subtitle}
              </p>
            </div>

            {/* Colorway Swatches */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="font-mono text-[10px] text-white/40 tracking-wider">
                COLORWAY
              </span>
              <div className="flex items-center gap-2">
                {product.colorways.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColorIndex(i)}
                    aria-label={`Select ${c.name} colorway`}
                    title={c.name}
                    style={{ backgroundColor: c.hex }}
                    className={`w-4 h-4 rounded-full border transition-all duration-300 ${
                      selectedColorIndex === i
                        ? "border-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.6)]"
                        : "border-white/20 hover:scale-110"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Size Picker Pills */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-white/40 tracking-wider">
                SIZE
              </span>
              <div className="flex items-center gap-1.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all duration-200 ${
                      selectedSize === s
                        ? "bg-[#C5A880] text-[#0B0B0C] font-semibold"
                        : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {s.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Price & Add to Bag */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="font-serif text-xl sm:text-2xl text-[#EDE9E3]">
                {formatPrice(product.priceEUR, product.priceUSD)}
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className={`px-5 py-2.5 rounded-full font-mono text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold transition-all duration-300 ${
                  isAdded
                    ? "bg-[#34D399] text-[#0B0B0C] shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                    : "bg-[#EDE9E3] hover:bg-[#C5A880] text-[#0B0B0C] shadow-[0_0_15px_rgba(237,233,227,0.15)] hover:shadow-[0_0_25px_rgba(197,168,128,0.35)] active:scale-95"
                }`}
              >
                {isAdded ? "ADDED ✓" : "ADD TO BAG"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
