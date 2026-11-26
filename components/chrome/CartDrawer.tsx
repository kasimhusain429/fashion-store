"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cartSubtotal, lineKey, MAX_QTY, shop, unitPrice, useShop } from "@/lib/store";
import { colorwayOf, getProduct, imageUrl, SIZE_LABELS } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { POLICIES } from "@/lib/site";
import { scrollLock } from "./SmoothScroll";

export function CartDrawer() {
  const s = useShop();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const subtotal = cartSubtotal(s);

  useEffect(() => {
    if (!s.cartOpen) return;
    scrollLock.lock();
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") shop.closeCart();
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input,select");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      scrollLock.unlock();
      prev?.focus?.();
    };
  }, [s.cartOpen]);

  return (
    <AnimatePresence>
      {s.cartOpen && (
        <div className="fixed inset-0 z-50" role="presentation">
          <motion.button
            type="button"
            aria-label="Close bag"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full cursor-default bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={shop.closeCart}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bag-title"
            className="grain absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-washi"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: [0.22, 0.8, 0.18, 1] }}
            data-lenis-prevent
          >
            <div className="flex items-baseline justify-between border-b border-line px-6 py-5">
              <h2 id="bag-title" className="t-headline text-[26px]">
                Bag
              </h2>
              <button ref={closeRef} type="button" onClick={shop.closeCart} className="t-ui link -mr-1 inline-flex min-h-[36px] items-center px-1">
                Close
              </button>
            </div>

            {s.lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-start justify-center gap-5 px-6">
                <p className="t-lede measure">Your bag is empty. Everything in the collection hangs on the rail.</p>
                <Link href="/collection" onClick={shop.closeCart} className="btn btn-solid">
                  Browse the collection
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto px-6" aria-label="Pieces in your bag">
                  {s.lines.map((l) => {
                    const p = getProduct(l.slug);
                    if (!p) return null;
                    const cw = colorwayOf(p, l.colorway);
                    const key = lineKey(l);
                    const fresh = s.lastAdded === key;
                    return (
                      <motion.li
                        key={key}
                        layout
                        initial={fresh ? { opacity: 0, y: -12 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-[88px_1fr] gap-4 border-b border-line py-5"
                      >
                        <Link href={`/collection/${p.slug}?c=${cw.id}`} onClick={shop.closeCart} className="plate block aspect-[4/5] overflow-hidden">
                          <Image
                            src={imageUrl(p, cw.id)}
                            alt={`${p.name} in ${cw.name}`}
                            width={176}
                            height={220}
                            className="render h-full w-full object-contain"
                          />
                        </Link>
                        <div className="flex flex-col justify-between gap-3">
                          <div>
                            <div className="flex items-baseline justify-between gap-3">
                              <Link href={`/collection/${p.slug}?c=${cw.id}`} onClick={shop.closeCart} className="t-ui font-medium">
                                {p.name}
                              </Link>
                              <span className="t-ui">{formatPrice(unitPrice(p.slug, s.currency) * l.qty, s.currency)}</span>
                            </div>
                            <p className="t-label mt-1 text-muted">
                              {cw.name}, size {SIZE_LABELS[l.size] ?? l.size}
                            </p>
                            {fresh && <p className="t-label mt-2 text-umber">Added to your bag</p>}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.25)]" role="group" aria-label={`Quantity of ${p.name}`}>
                              <button
                                type="button"
                                className="t-ui grid h-9 w-9 place-items-center"
                                onClick={() => shop.setQty(key, l.qty - 1)}
                                aria-label="Decrease quantity"
                              >
                                −
                              </button>
                              <span className="t-num w-6 text-center text-[15px]" aria-live="polite">
                                {l.qty}
                              </span>
                              <button
                                type="button"
                                className="t-ui grid h-9 w-9 place-items-center disabled:opacity-30"
                                onClick={() => shop.setQty(key, l.qty + 1)}
                                disabled={l.qty >= MAX_QTY}
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>
                            <button type="button" className="t-label link inline-flex min-h-[32px] items-center text-muted" onClick={() => shop.remove(key)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
                <div className="border-t border-line px-6 pb-6 pt-5">
                  <div className="flex items-baseline justify-between">
                    <span className="t-ui">Subtotal</span>
                    <span className="t-headline text-[22px]">{formatPrice(subtotal, s.currency)}</span>
                  </div>
                  <p className="t-label mt-2 text-muted">{POLICIES.delivery}</p>
                  <Link href="/checkout" onClick={shop.closeCart} className="btn btn-solid mt-5 w-full">
                    Continue to checkout
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
