"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let locks = 0;

/** Pause/resume page scrolling (drawers, menus, focused 3D views). Reference-counted. */
export const scrollLock = {
  lock() {
    locks += 1;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
  },
  unlock() {
    locks = Math.max(0, locks - 1);
    if (locks > 0) return;
    lenis?.start();
    document.documentElement.style.overflow = "";
  },
};

export function SmoothScroll() {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      if (!window.location.hash) {
        lenis?.scrollTo(0, { immediate: true });
      }
    }
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
