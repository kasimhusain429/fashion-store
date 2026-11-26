"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cartCount, shop, useShop } from "@/lib/store";
import { scrollLock } from "./SmoothScroll";

const NAV = [
  { href: "/collection", label: "Collection" },
  { href: "/lookbook", label: "Lookbook" },
  { href: "/atelier", label: "Atelier" },
  { href: "/client-services", label: "Client services" },
];

export function Header() {
  const s = useShop();
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // light type over sections marked data-header="dark" (colour card, footer), ink everywhere else
  const [onDark, setOnDark] = useState(false);
  // the menu belongs to the page it was opened on, so navigating closes it
  const [menuAt, setMenuAt] = useState<string | null>(null);
  const menu = menuAt === pathname;
  const hiddenRef = useRef(hidden);
  const menuRef = useRef(menu);
  useEffect(() => {
    hiddenRef.current = hidden;
    menuRef.current = menu;
  }, [hidden, menu]);
  const setMenu = (open: boolean | ((m: boolean) => boolean)) => {
    const next = typeof open === "function" ? open(menu) : open;
    setMenuAt(next ? pathname : null);
  };
  const count = cartCount(s);

  useEffect(() => {
    const visibleBar = scrolled && !hidden && !menu;
    document.documentElement.style.setProperty("--header-offset", visibleBar ? "var(--header-h)" : "0px");
  }, [scrolled, hidden, menu]);

  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const syncOffset = (y: number, nextHidden: boolean) => {
      const visibleBar = y > 24 && !nextHidden && !menuRef.current;
      document.documentElement.style.setProperty("--header-offset", visibleBar ? "var(--header-h)" : "0px");
    };
    const probe = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 24);
      syncOffset(y, hiddenRef.current);
      const line = 32;
      const dark = [...document.querySelectorAll<HTMLElement>('[data-header="dark"]')].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= line && r.bottom >= line;
      });
      setOnDark(dark);
    };
    const onScroll = () => {
      const y = window.scrollY;
      const isScrolled = y > 24;
      let nextHidden = hiddenRef.current;
      if (y <= 160 || y < last - 2) nextHidden = false;
      else if (y > 160 && y > last + 2) nextHidden = true;
      setScrolled(isScrolled);
      setHidden(nextHidden);
      syncOffset(y, nextHidden);
      last = y;
      if (!frame) frame = requestAnimationFrame(probe);
    };
    frame = requestAnimationFrame(probe);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    scrollLock.lock();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuAt(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      scrollLock.unlock();
    };
  }, [menu]);

  const surface =
    scrolled && !menu
      ? onDark
        ? "border-b border-line-dark bg-ink/88 backdrop-blur-md text-washi"
        : "border-b border-line bg-plaster/90 backdrop-blur-md text-ink"
      : onDark && !menu
        ? "text-washi"
        : "text-ink";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[transform,color,background-color,border-color] duration-300 ${surface}`}
        style={{ transform: hidden && !menu ? "translateY(-100%)" : "none", transitionTimingFunction: "var(--ease-cloth)" }}
      >
        <div className="flex h-[var(--header-h)] items-center justify-between gap-4 px-[var(--gutter)] sm:gap-6">
          <Link href="/" className="t-wordmark inline-flex min-h-[44px] items-center text-[15px]" aria-label="VAELIS, home">
            VAELIS
          </Link>
          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {NAV.map((n) => {
                const active = pathname.startsWith(n.href);
                return (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      aria-current={active ? "page" : undefined}
                      className={`t-ui ${active ? "underline decoration-1 underline-offset-[6px]" : "hover:underline hover:decoration-1 hover:underline-offset-[6px]"}`}
                    >
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="flex items-center gap-5 sm:gap-7">
            <div className="hidden items-center gap-2 sm:flex" role="group" aria-label="Currency">
              {(["EUR", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => shop.setCurrency(c)}
                  aria-pressed={s.currency === c}
                  className={`t-label px-1 py-2 ${s.currency === c ? "underline underline-offset-4" : "opacity-60 hover:opacity-100"}`}
                >
                  {c === "EUR" ? "€ EUR" : "$ USD"}
                </button>
              ))}
            </div>
            <Link href="/wishlist" className="t-ui hidden min-h-[44px] items-center sm:inline-flex">
              Saved{s.wishlist.length > 0 ? ` (${s.wishlist.length})` : ""}
            </Link>
            <button type="button" onClick={shop.openCart} className="t-ui inline-flex min-h-[44px] items-center px-1" aria-haspopup="dialog">
              Bag<span className="t-num ml-1.5">{count > 0 ? `(${count})` : ""}</span>
            </button>
            <button
              type="button"
              className="t-ui inline-flex min-h-[44px] items-center px-1 lg:hidden"
              aria-expanded={menu}
              aria-controls="site-menu"
              onClick={() => setMenu((m) => !m)}
            >
              {menu ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="grain fixed inset-0 z-30 flex flex-col justify-between gap-6 overflow-y-auto bg-plaster px-[var(--gutter)] pb-8 pt-20 sm:pt-28 lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}
            data-lenis-prevent
          >
            <nav aria-label="Mobile">
              <ul className="space-y-2 sm:space-y-3">
                {NAV.map((n, i) => (
                  <motion.li
                    key={n.href}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + i * 0.06, duration: 0.6, ease: [0.22, 0.8, 0.18, 1] }}
                  >
                    <Link href={n.href} className="t-headline block py-1 text-[clamp(28px,min(10vw,7.2svh),64px)]">
                      {n.label}
                    </Link>
                  </motion.li>
                ))}
                <li className="sm:hidden">
                  <Link href="/wishlist" className="t-headline block py-1 text-[clamp(28px,min(10vw,7.2svh),64px)]">
                    Saved{s.wishlist.length > 0 ? ` (${s.wishlist.length})` : ""}
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="flex items-center gap-3 sm:hidden" role="group" aria-label="Currency">
              {(["EUR", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => shop.setCurrency(c)}
                  aria-pressed={s.currency === c}
                  className={`btn ${s.currency === c ? "btn-solid" : "btn-line"}`}
                >
                  {c === "EUR" ? "€ EUR" : "$ USD"}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
