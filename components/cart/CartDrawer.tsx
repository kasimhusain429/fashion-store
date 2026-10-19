"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useCart } from "@/lib/cartStore";
import { soundSynth } from "@/lib/soundSynth";

export default function CartDrawer() {
  const {
    isOpen,
    closeCart,
    items,
    currency,
    setCurrency,
    totalCount,
    totalEUR,
    totalUSD,
    removeItem,
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);
  const [isReserved, setIsReserved] = useState(false);
  const [reservationCode, setReservationCode] = useState("");

  const handleClose = useCallback(() => {
    setIsReserved(false);
    closeCart();
  }, [closeCart]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const formatPrice = (valEUR: number, valUSD: number) => {
    const isEUR = currency === "EUR";
    const amount = isEUR ? valEUR : valUSD;
    return new Intl.NumberFormat(isEUR ? "de-DE" : "en-US", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePreOrder = () => {
    if (items.length === 0) return;
    soundSynth.playSilkClick();
    const code = `VAELIS-${Math.floor(1000 + Math.random() * 9000)}-CF01`;
    setReservationCode(code);
    setIsReserved(true);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Atelier Vaelis, I would like to inquire regarding Reservation ${reservationCode || "Chrono-Fold Archive"} (Pieces: ${items
      .map((i) => `${i.name} [Size ${i.size}, ${i.colorway}]`)
      .join(", ")}). Total: ${formatPrice(totalEUR, totalUSD)}.`
  );

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[100] transition-opacity duration-500 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-[#0B0B0C]/80 backdrop-blur-md transition-opacity duration-500"
      />

      {/* Drawer Panel */}
      <aside
        ref={drawerRef}
        role="dialog"
        aria-label="Atelier Reservation Drawer"
        className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#121316] border-l border-white/10 flex flex-col justify-between p-6 sm:p-8 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[#C5A880]">
                ATELIER BAG
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-white/60">
                {totalCount} {totalCount === 1 ? "PIECE" : "PIECES"}
              </span>
            </div>

            {/* Currency Switcher */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  soundSynth.playSilkClick();
                  setCurrency("EUR");
                }}
                className={`px-2.5 py-0.5 rounded-full transition-colors ${
                  currency === "EUR"
                    ? "bg-[#C5A880] text-[#0B0B0C] font-semibold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                € EUR
              </button>
              <button
                type="button"
                onClick={() => {
                  soundSynth.playSilkClick();
                  setCurrency("USD");
                }}
                className={`px-2.5 py-0.5 rounded-full transition-colors ${
                  currency === "USD"
                    ? "bg-[#C5A880] text-[#0B0B0C] font-semibold"
                    : "text-white/60 hover:text-white"
                }`}
              >
                $ USD
              </button>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close Bag"
              className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:border-white/30 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Reserved Confirmation Overlay vs Items List */}
          {isReserved ? (
            <div className="mt-8 p-6 rounded-2xl bg-white/[0.03] border border-[#C5A880]/40 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-[#C5A880]">
                <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse" />
                <span className="font-mono text-[10px] tracking-widest uppercase font-semibold">
                  ARCHIVAL RESERVATION LOGGED
                </span>
              </div>
              <h3 className="font-serif text-2xl text-[#EDE9E3] font-light">
                Order Protocol {reservationCode}
              </h3>
              <p className="font-mono text-xs text-white/60 leading-relaxed">
                Your private allocation for {totalCount} archival {totalCount === 1 ? "piece" : "pieces"} has been registered with Atelier Vaelis. Our salon liaison will review fabric availability and contact you for measurement verification.
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between font-mono text-[11px] text-white/50">
                <span>ESTIMATED DISPATCH:</span>
                <span className="text-[#EDE9E3]">14 BUSINESS DAYS</span>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4 overflow-y-auto max-h-[50vh] pr-1">
              {items.length === 0 ? (
                <div className="py-16 text-center text-white/40 font-serif italic text-lg">
                  Your archive selection is currently empty.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="flex gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-colors"
                  >
                    <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-[#1c1d22] flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-mono text-[9px] tracking-widest text-[#C5A880] uppercase">
                            ARCHIVE PIECE
                          </span>
                          <span className="font-mono text-xs text-white/90">
                            {formatPrice(item.priceEUR, item.priceUSD)}
                          </span>
                        </div>
                        <h4 className="font-serif text-base text-white font-medium leading-snug mt-0.5">
                          {item.name}
                        </h4>
                        <p className="text-xs text-white/50 mt-1 font-mono">
                          {item.colorway} • Size {item.size}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2">
                        <span className="text-white/40 font-mono">
                          QTY: {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            soundSynth.playSilkClick();
                            removeItem(item.id, item.size);
                          }}
                          className="text-white/40 hover:text-red-400 font-mono text-[11px] uppercase tracking-wider transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        <div className="pt-6 border-t border-white/10 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-white/60 font-mono">
              <span>EDITION</span>
              <span>CHRONO-FOLD / RUNWAY BATCH 01</span>
            </div>
            <div className="flex justify-between items-center text-xs text-white/60 font-mono">
              <span>ESTIMATED FULFILLMENT</span>
              <span>HAND-FINISHED IN 2 WEEKS</span>
            </div>
            <div className="flex justify-between items-baseline pt-2">
              <span className="font-mono text-sm tracking-widest text-white/80">
                TOTAL
              </span>
              <span className="font-serif text-2xl text-[#EDE9E3]">
                {formatPrice(totalEUR, totalUSD)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={items.length === 0}
            onClick={handlePreOrder}
            className={`w-full py-4 rounded-full font-mono text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-[0_0_25px_rgba(237,233,227,0.15)] ${
              items.length === 0
                ? "bg-white/10 text-white/30 cursor-not-allowed"
                : isReserved
                ? "bg-[#34D399] text-[#0B0B0C] shadow-[0_0_35px_rgba(52,211,153,0.3)]"
                : "bg-[#EDE9E3] hover:bg-[#C5A880] text-[#0B0B0C] hover:shadow-[0_0_35px_rgba(197,168,128,0.3)]"
            }`}
          >
            {isReserved
              ? "RESERVATION RECORDED ✓"
              : items.length === 0
              ? "ARCHIVE SELECTION IS EMPTY"
              : "PRE-ORDER ARCHIVE PIECE"}
          </button>

          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => soundSynth.playSilkClick()}
            className="w-full py-3.5 rounded-full border border-white/15 hover:border-[#C5A880] text-white/80 hover:text-white flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-widest transition-colors"
          >
            <span>VIP Concierge on WhatsApp</span>
            <span className="text-[#C5A880]">↗</span>
          </a>

          <p className="text-[10px] text-center text-white/40 font-mono">
            Complimentary white-glove courier & carbon-neutral dispatch worldwide.
          </p>
        </div>
      </aside>
    </div>
  );
}
