"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PRODUCTS, imageUrl } from "@/lib/catalog";
import { lookNumber } from "@/lib/format";
import { PleatImage } from "./PleatImage";

gsap.registerPlugin(ScrollTrigger);

/* Campaign order: curated distinct colorway per frame so no consecutive looks repeat the same shade. */
const CAMPAIGN_COLOR: Record<string, string> = {
  "monolith-tee": "umber",
  "kimono-tee": "celadon",
  "column-tee": "obsidian",
  "selvedge-tank": "alabaster",
  "chrono-long-sleeve": "oxblood",
  "atelier-pocket-tee": "basalt",
};

const FRAMES = PRODUCTS.flatMap((p, i) => {
  const cw = p.colorways.find((c) => c.id === CAMPAIGN_COLOR[p.slug]) ?? p.colorways[0];
  const view = i % 2 ? "back" : "front";
  const frames: { kind: "look" | "detail"; key: string; product: typeof p; colorway: typeof cw; view: "front" | "back" }[] = [
    { kind: "look", key: `${p.slug}-look`, product: p, colorway: cw, view },
  ];
  if (i % 2 === 0) frames.push({ kind: "detail", key: `${p.slug}-detail`, product: p, colorway: cw, view: "front" });
  return frames;
});

export function LookbookScroller() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const distance = () => tr.scrollWidth - window.innerWidth;
      const scroll = gsap.to(tr, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      gsap.utils.toArray<HTMLElement>(".lb-frame").forEach((frame) => {
        const pleats = frame.querySelectorAll(".pleat");
        const shades = frame.querySelectorAll(".pleat-shade");
        const base = frame.querySelectorAll(".pleat-base");
        gsap.fromTo(
          pleats,
          { scaleX: 0.08 },
          {
            scaleX: 1,
            ease: "power3.out",
            stagger: 0.05,
            scrollTrigger: { trigger: frame, containerAnimation: scroll, start: "left 92%", end: "left 35%", scrub: 0.6 },
          },
        );
        gsap.fromTo(
          shades,
          { opacity: 1 },
          { opacity: 0, scrollTrigger: { trigger: frame, containerAnimation: scroll, start: "left 70%", end: "left 30%", scrub: true } },
        );
        gsap.fromTo(
          base,
          { opacity: 0 },
          { opacity: 1, scrollTrigger: { trigger: frame, containerAnimation: scroll, start: "left 58%", end: "left 42%", scrub: true } },
        );
      });
    });
    mm.add("(max-width: 1023px)", () => {
      gsap.utils.toArray<HTMLElement>(".lb-frame").forEach((frame) => {
        gsap.fromTo(
          frame.querySelectorAll(".pleat"),
          { scaleX: 0.1 },
          { scaleX: 1, ease: "power3.out", stagger: 0.05, scrollTrigger: { trigger: frame, start: "top 85%", end: "top 30%", scrub: 0.6 } },
        );
        gsap.fromTo(
          frame.querySelectorAll(".pleat-shade"),
          { opacity: 1 },
          { opacity: 0, scrollTrigger: { trigger: frame, start: "top 60%", end: "top 20%", scrub: true } },
        );
        gsap.fromTo(
          frame.querySelectorAll(".pleat-base"),
          { opacity: 0 },
          { opacity: 1, scrollTrigger: { trigger: frame, start: "top 58%", end: "top 40%", scrub: true } },
        );
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={root} className="relative overflow-hidden lg:h-[100svh]">
      <div ref={track} className="flex flex-col gap-24 px-[var(--gutter)] pb-24 pt-[calc(var(--header-h)+6vh)] lg:h-full lg:w-max lg:flex-row lg:items-stretch lg:gap-[6vw] lg:pb-[6vh]">
        <header className="flex shrink-0 flex-col justify-end lg:w-[38vw]">
          <p className="t-label text-muted">The lookbook</p>
          <h1 className="t-display mt-4 text-[clamp(56px,8.4vw,150px)]">Chrono-Fold</h1>
          <p className="t-lede measure mt-8">
            Six t-shirts on one walnut hanger, photographed in the same light at the same scale. Scroll to move along the rail.
          </p>
        </header>

        {FRAMES.map((f, i) =>
          f.kind === "look" ? (
            <figure key={f.key} className="lb-frame flex shrink-0 flex-col gap-5 lg:h-full lg:w-[44vw] lg:flex-row lg:items-end">
              <div className="plate relative h-[72svh] w-full lg:h-full lg:w-[32vw]">
                <PleatImage
                  src={imageUrl(f.product, f.colorway.id, f.view)}
                  alt={`${f.product.name} in ${f.colorway.name}, ${f.view}`}
                  sizes="(min-width: 1024px) 32vw, 100vw"
                  className="h-full w-full"
                  imgClassName="object-contain p-[4%]"
                />
              </div>
              <figcaption className="lg:w-[11vw] lg:pb-2">
                <p className="t-num text-[clamp(40px,4vw,64px)] leading-none">{String(f.product.look).padStart(2, "0")}</p>
                <p className="t-ui mt-3 font-medium">{f.product.name}</p>
                <p className="t-label mt-1 text-muted">
                  {f.colorway.name}, {f.view}
                </p>
                <Link href={`/collection/${f.product.slug}?c=${f.colorway.id}`} className="t-label link mt-3 inline-flex min-h-[32px] items-center">
                  Shop {lookNumber(f.product.look).toLowerCase()}
                </Link>
              </figcaption>
            </figure>
          ) : (
            <figure key={f.key} className={`lb-frame flex shrink-0 flex-col justify-center gap-4 lg:h-full lg:w-[22vw] ${i % 4 === 1 ? "lg:justify-start" : "lg:justify-end"}`}>
              <div className="plate relative aspect-[4/5] w-full overflow-hidden lg:h-[52%] lg:aspect-auto">
                <PleatImage
                  src={imageUrl(f.product, f.colorway.id, "front")}
                  alt={`${f.product.name}: ribbed neck band and shoulder seam, close up`}
                  pleats={4}
                  sizes="(min-width: 1024px) 22vw, 100vw"
                  className="h-full w-full"
                  imgClassName="object-contain"
                  imgStyle={{ transform: "scale(2.6)", transformOrigin: "50% 16%" }}
                />
              </div>
              <figcaption className="t-label text-muted">Ribbed neck band, cover-stitched</figcaption>
            </figure>
          ),
        )}

        <div className="flex shrink-0 flex-col justify-end gap-6 lg:w-[30vw]">
          <p className="t-lede measure">Every look is on the rail, in every colour.</p>
          <Link href="/collection" className="btn btn-solid self-start">
            Shop the collection
          </Link>
        </div>
      </div>
    </div>
  );
}
